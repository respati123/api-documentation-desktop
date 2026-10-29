import type { BodyMode, RequestNode } from '@/shared/models/api-node.model'

// Field names that look like credentials are masked everywhere the docs show an example value.
export const maskedValue = '••••••'

export function isSensitiveName(value: string): boolean {
  return /authorization|cookie|token|secret|password|api[-_]?key/i.test(value)
}

export function bodyModeOf(request: Pick<RequestNode, 'bodyMode' | 'body'>): BodyMode {
  return request.bodyMode ?? (request.body.trim() ? 'json' : 'none')
}

// Replaces $ref pointers to #/components/schemas with the schema they name. A pointer that cannot be resolved is kept as is.
export function schemaForDisplay(source: string, components: Record<string, unknown> | undefined): string {
  if (!source.trim()) return source
  let parsed: unknown
  try {
    parsed = JSON.parse(source)
  } catch {
    return source
  }
  const expand = (value: unknown, seen: Set<string>): unknown => {
    if (Array.isArray(value)) return value.map((item) => expand(item, seen))
    if (!value || typeof value !== 'object') return value
    const object = value as Record<string, unknown>
    const reference = typeof object.$ref === 'string' ? object.$ref : ''
    if (!reference.startsWith('#/components/schemas/'))
      return Object.fromEntries(Object.entries(object).map(([key, item]) => [key, expand(item, seen)]))
    if (seen.has(reference)) return object
    const [component = '', ...path] = reference
      .slice('#/components/schemas/'.length)
      .split('/')
      .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'))
    let target: unknown = components?.[component]
    for (const segment of path) target = target && typeof target === 'object' ? (target as Record<string, unknown>)[segment] : undefined
    if (target === undefined) return object
    const expanded = expand(target, new Set(seen).add(reference))
    const siblings = Object.fromEntries(
      Object.entries(object)
        .filter(([key]) => key !== '$ref')
        .map(([key, item]) => [key, expand(item, seen)]),
    )
    return expanded && typeof expanded === 'object' && !Array.isArray(expanded) ? { ...expanded, ...siblings } : expanded
  }
  return JSON.stringify(expand(parsed, new Set()), null, 2) ?? source
}
