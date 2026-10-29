import type { ParamField } from '@/lib/merge'

export function splitUrlParams(url: string): { url: string; params: ParamField[] } {
  const hashIndex = url.indexOf('#')
  const beforeHash = hashIndex < 0 ? url : url.slice(0, hashIndex)
  const queryIndex = beforeHash.indexOf('?')
  if (queryIndex < 0 || queryIndex === beforeHash.length - 1) return { url, params: [] }
  const params = [...new URLSearchParams(beforeHash.slice(queryIndex + 1)).entries()].map(([name, value]) => ({
    id: crypto.randomUUID(),
    name,
    value,
    enabled: true,
  }))
  return { url, params }
}

export function hasUrlQuery(url: string): boolean {
  const hashIndex = url.indexOf('#')
  return (hashIndex < 0 ? url : url.slice(0, hashIndex)).includes('?')
}

export function mergeUrlParamRows(urlParams: ParamField[], existingParams: ParamField[]): ParamField[] {
  const remaining = [...existingParams]
  const merged = urlParams.map((param) => {
    let index = remaining.findIndex((item) => item.name === param.name && item.value === param.value)
    if (index < 0) index = remaining.findIndex((item) => item.name === param.name)
    if (index < 0) return param
    const [previous] = remaining.splice(index, 1)
    return { ...previous, name: param.name, value: param.value }
  })
  return [...merged, ...remaining]
}

export function syncUrlParams(url: string, existingParams: ParamField[]): ParamField[] {
  const parsedParams = splitUrlParams(url).params
  const unused = new Set(existingParams.map((param) => param.id))
  return parsedParams.map((param, index) => {
    const findExisting = (predicate: (item: ParamField) => boolean) => existingParams.find((item) => unused.has(item.id) && predicate(item))
    const previous =
      findExisting((item) => item.name === param.name && item.value === param.value) ??
      findExisting((item) => item.name === param.name) ??
      (existingParams[index] && unused.has(existingParams[index].id) ? existingParams[index] : undefined)
    if (!previous) return param
    unused.delete(previous.id)
    return { ...previous, name: param.name, value: param.value }
  })
}

export function encodeQueryComponent(value: string): string {
  const variableToken = /\{\{\s*[^{}]+?\s*\}\}/g
  let result = ''
  let cursor = 0
  let match: RegExpExecArray | null
  while ((match = variableToken.exec(value))) {
    result += `${encodeURIComponent(value.slice(cursor, match.index))}${match[0]}`
    cursor = match.index + match[0].length
  }
  return `${result}${encodeURIComponent(value.slice(cursor))}`
}

export function replaceUrlParams(url: string, params: ParamField[]): string {
  const hashIndex = url.indexOf('#')
  const beforeHash = hashIndex < 0 ? url : url.slice(0, hashIndex)
  const hash = hashIndex < 0 ? '' : url.slice(hashIndex)
  const queryIndex = beforeHash.indexOf('?')
  const base = queryIndex < 0 ? beforeHash : beforeHash.slice(0, queryIndex)
  const query = params
    .filter((param) => param.name.trim())
    .map((param) => `${encodeQueryComponent(param.name)}=${encodeQueryComponent(param.value)}`)
    .join('&')
  return `${base}${query ? `?${query}` : ''}${hash}`
}
