import { bodyContentType } from '@/features/request/lib/body-content-type'
import { effectiveBodyMode } from '@/features/request/lib/body-mode'
import type { HeaderField, RequestNode } from '@/shared/models/api-node.model'

export type GeneratedHeader = { name: string; value: string }
export type GeneratedHeaderLabels = { hostValue: string; multipartBoundary: string; basicValue: string }

const maskLimit = 12
const mask = (value: string): string => '•'.repeat(Math.min(value.length, maskLimit))

function enabledHeader(headers: HeaderField[], name: string): HeaderField | undefined {
  return headers.find((header) => header.enabled && header.name.trim().toLowerCase() === name.toLowerCase())
}

function inferredContentType(request: RequestNode, labels: GeneratedHeaderLabels): string {
  const mode = effectiveBodyMode(request)
  const canSendBody = !['GET', 'HEAD'].includes(request.method.toUpperCase())
  if (mode === 'form-data') return canSendBody ? labels.multipartBoundary : 'multipart/form-data'
  if (mode === 'urlencoded') return 'application/x-www-form-urlencoded;charset=UTF-8'
  if (mode === 'file') return request.bodyMimeType || 'application/octet-stream'
  if (mode === 'other') return request.bodyMimeType || 'text/plain'
  return bodyContentType(mode)
}

// The headers the app adds when it sends the request, so the user can see them next to their own.
export function generatedHeaders(request: RequestNode, labels: GeneratedHeaderLabels): GeneratedHeader[] {
  const headers = request.headers ?? []
  const generated: GeneratedHeader[] = []
  if (!enabledHeader(headers, 'Accept')) generated.push({ name: 'Accept', value: '*/*' })
  if (!enabledHeader(headers, 'Host')) generated.push({ name: 'Host', value: labels.hostValue })
  if (!enabledHeader(headers, 'User-Agent')) generated.push({ name: 'User-Agent', value: 'API-Documentation/0.1.0' })

  const mode = effectiveBodyMode(request)
  const customContentType = enabledHeader(headers, 'Content-Type')
  if (mode !== 'none' && (!customContentType || mode === 'form-data')) {
    const inferred = inferredContentType(request, labels)
    generated.push({ name: 'Content-Type', value: mode === 'form-data' ? inferred : (customContentType?.value ?? inferred) })
  }

  const auth = request.auth ?? { type: 'none' as const }
  if (auth.type === 'bearer' && auth.token) generated.push({ name: 'Authorization', value: `Bearer ${mask(auth.token)}` })
  if (auth.type === 'basic' && (auth.username || auth.password)) generated.push({ name: 'Authorization', value: labels.basicValue })
  if (auth.type === 'api-key' && auth.location === 'header' && auth.name && auth.value)
    generated.push({ name: auth.name, value: mask(auth.value) })
  return generated
}

export function hasCustomContentType(request: RequestNode): boolean {
  return Boolean(enabledHeader(request.headers ?? [], 'Content-Type'))
}
