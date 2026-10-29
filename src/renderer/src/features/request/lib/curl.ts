import { bodyContentType } from '@/features/request/components/body-editor'
import type { RequestNode } from '@/shared/models/api-node.model'

export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`
}

export function buildCurlCommand(request: RequestNode): string {
  const mode = request.bodyMode ?? (request.body.trim() ? 'json' : 'none')
  const auth = request.auth ?? { type: 'none' as const }
  const headers = new Map<string, { name: string; value: string }>()
  for (const header of request.headers ?? []) {
    if (header.enabled && header.name.trim())
      headers.set(header.name.trim().toLowerCase(), { name: header.name.trim(), value: header.value })
  }
  if (!headers.has('accept')) headers.set('accept', { name: 'Accept', value: '*/*' })
  if (!headers.has('user-agent')) headers.set('user-agent', { name: 'User-Agent', value: 'API-Documentation/0.1.0' })

  let targetUrl = request.url
  try {
    const url = new URL(request.url)
    url.search = ''
    for (const param of request.params ?? []) if (param.enabled && param.name.trim()) url.searchParams.append(param.name, param.value)
    if (auth.type === 'api-key' && auth.location === 'query' && auth.name.trim() && auth.value)
      url.searchParams.append(auth.name, auth.value)
    targetUrl = url.toString()
  } catch {
    /* Keep the entered URL so the generated command remains editable. */
  }

  if (auth.type === 'bearer' && auth.token) headers.set('authorization', { name: 'Authorization', value: `Bearer ${auth.token}` })
  if (auth.type === 'basic' && (auth.username || auth.password)) {
    const bytes = new TextEncoder().encode(`${auth.username}:${auth.password}`)
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
    headers.set('authorization', { name: 'Authorization', value: `Basic ${btoa(binary)}` })
  }
  if (auth.type === 'api-key' && auth.location === 'header' && auth.name.trim() && auth.value)
    headers.set(auth.name.trim().toLowerCase(), { name: auth.name.trim(), value: auth.value })

  if (mode !== 'none' && mode !== 'form-data' && !headers.has('content-type')) {
    const contentType =
      mode === 'urlencoded'
        ? 'application/x-www-form-urlencoded;charset=UTF-8'
        : mode === 'file'
          ? request.bodyMimeType || 'application/octet-stream'
          : mode === 'other'
            ? request.bodyMimeType || 'text/plain'
            : bodyContentType(mode)
    headers.set('content-type', { name: 'Content-Type', value: contentType })
  }
  if (mode === 'form-data') headers.delete('content-type')

  const parts = ['curl', '--request', shellQuote(request.method.toUpperCase()), shellQuote(targetUrl)]
  for (const header of headers.values()) parts.push('--header', shellQuote(`${header.name}: ${header.value}`))
  const canSendBody = !['GET', 'HEAD'].includes(request.method.toUpperCase()) && mode !== 'none'
  if (canSendBody && mode === 'form-data') {
    for (const field of request.bodyFields ?? []) {
      if (!field.enabled || !field.name) continue
      const value = field.type === 'file' ? `@${field.filePath || field.fileName || ''}` : `${field.name}=${field.value}`
      parts.push('--form', shellQuote(field.type === 'file' ? `${field.name}=${value}` : value))
    }
  } else if (canSendBody && mode === 'urlencoded') {
    for (const field of request.bodyFields ?? [])
      if (field.enabled && field.name) parts.push('--data-urlencode', shellQuote(`${field.name}=${field.value}`))
  } else if (canSendBody && mode === 'file') {
    if (request.bodyPath) parts.push('--data-binary', shellQuote(`@${request.bodyPath}`))
  } else if (canSendBody && mode === 'graphql') {
    let variables: unknown = {}
    try {
      variables = JSON.parse(request.bodyVariables || '{}')
    } catch {
      variables = request.bodyVariables || '{}'
    }
    parts.push('--data-raw', shellQuote(JSON.stringify({ query: request.body, variables })))
  } else if (canSendBody) {
    parts.push('--data-raw', shellQuote(request.body))
  }
  return parts.join(' ')
}
