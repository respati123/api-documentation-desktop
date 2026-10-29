export function downloadResponse(data: ApiResponse, requestName: string): void {
  const contentType = data.headers['content-type'] ?? ''
  const extension = /\bjson\b/i.test(contentType) ? 'json' : 'txt'
  const filename =
    requestName
      .trim()
      .replace(/[^a-z0-9._-]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'response'
  const url = URL.createObjectURL(new Blob([data.body], { type: contentType || 'text/plain' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${filename}.${extension}`
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function responseCookies(data: ApiResponse): string[] {
  if (data.cookies?.length) return data.cookies
  const combined = data.headers['set-cookie']
  return combined
    ? combined
        .split(/,(?=\s*[^;,=\s]+=)/)
        .map((cookie) => cookie.trim())
        .filter(Boolean)
    : []
}

export function cookieParts(cookie: string): { name: string; value: string; attributes: string[] } {
  const [pair = '', ...attributes] = cookie.split(';').map((part) => part.trim())
  const separator = pair.indexOf('=')
  return { name: separator < 0 ? pair : pair.slice(0, separator), value: separator < 0 ? '' : pair.slice(separator + 1), attributes }
}
