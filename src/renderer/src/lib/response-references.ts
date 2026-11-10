import { isRecord } from '@/shared/utils/record'

// A reference reads a value from the last saved 200 response of another request:
//   response.<requestId>.body.<JSONPath>   a value from the JSON body
//   response.<requestId>.raw               the whole body as text
//   response.<requestId>.header.<name>     one header, ignoring case
// The JSONPath supports only dot names and numeric indexes, such as $.data.items[0].id.

// Only the fields the reference needs. The main process holds the full saved file.
export type SavedResponseSnapshot = {
  savedAt: string
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  truncated: boolean
}

// The saved responses of the workspace, keyed by request id.
export type SavedResponses = Map<string, SavedResponseSnapshot>

const prefix = 'response.'
const requestIdPattern = /^[A-Za-z0-9_-]{1,128}$/

export function isResponseReference(name: string): boolean {
  return name.startsWith(prefix)
}

export function resolveResponseReference(name: string, savedResponses: SavedResponses): string {
  const rest = name.slice(prefix.length)
  const dot = rest.indexOf('.')
  const requestId = dot === -1 ? rest : rest.slice(0, dot)
  if (!requestIdPattern.test(requestId)) throw new Error(`"${requestId}" is not a valid request id in the reference "{{${name}}}".`)
  if (dot === -1) throw new Error(`The reference "{{${name}}}" needs an attribute: body, raw, or header.`)

  const afterId = rest.slice(dot + 1)
  const attributeEnd = afterId.indexOf('.')
  const attribute = attributeEnd === -1 ? afterId : afterId.slice(0, attributeEnd)
  const path = attributeEnd === -1 ? '' : afterId.slice(attributeEnd + 1)

  const saved = savedResponses.get(requestId)
  if (!saved) throw new Error(`Request "${requestId}" has no saved response yet. Send it first.`)

  if (attribute === 'header') {
    if (!path) throw new Error(`The header reference of "${requestId}" needs a header name.`)
    const wanted = path.toLowerCase()
    const key = Object.keys(saved.headers).find((header) => header.toLowerCase() === wanted)
    if (key === undefined) throw new Error(`Header "${path}" is not in the saved response of "${requestId}".`)
    return saved.headers[key]
  }

  if (attribute === 'raw') {
    if (path) throw new Error(`The raw reference does not take a path: "{{${name}}}".`)
    requireFullBody(saved, requestId)
    return saved.body
  }

  if (attribute === 'body') {
    if (!path) throw new Error(`The body reference of "${requestId}" needs a path, such as body.$.id.`)
    requireFullBody(saved, requestId)
    return selectJsonValue(saved.body, parseJsonPath(path), path, requestId)
  }

  throw new Error(`Unknown response attribute "${attribute}" in "{{${name}}}". Use body, raw, or header.`)
}

function requireFullBody(saved: SavedResponseSnapshot, requestId: string): void {
  if (saved.truncated) throw new Error(`The saved response of "${requestId}" is larger than 1 MB, so its body cannot be used.`)
}

type PathStep = { key: string } | { index: number }

// Reads a path such as $.data.items[0].id. Anything else is refused, so an unsupported path never silently picks a wrong value.
function parseJsonPath(path: string): PathStep[] {
  if (!path.startsWith('$')) throw new Error(`The path "${path}" must start with $.`)
  const steps: PathStep[] = []
  let position = 1
  while (position < path.length) {
    const char = path[position]
    if (char === '.') {
      const end = nextBoundary(path, position + 1)
      const key = path.slice(position + 1, end)
      if (!key) throw new Error(`The path "${path}" is not supported. Use dot names and [index] only.`)
      steps.push({ key })
      position = end
    } else if (char === '[') {
      const close = path.indexOf(']', position)
      const inner = close === -1 ? '' : path.slice(position + 1, close)
      if (!/^\d+$/.test(inner)) throw new Error(`The path "${path}" is not supported. Use dot names and [index] only.`)
      steps.push({ index: Number(inner) })
      position = close + 1
    } else {
      throw new Error(`The path "${path}" is not supported. Use dot names and [index] only.`)
    }
  }
  return steps
}

function nextBoundary(path: string, from: number): number {
  for (let index = from; index < path.length; index += 1) {
    if (path[index] === '.' || path[index] === '[') return index
  }
  return path.length
}

function selectJsonValue(body: string, steps: PathStep[], path: string, requestId: string): string {
  let value: unknown
  try {
    value = JSON.parse(body)
  } catch {
    throw new Error(`The saved body of "${requestId}" is not JSON, so the path "${path}" cannot be read.`)
  }
  for (const step of steps) {
    if ('key' in step) {
      if (!isRecord(value) || !Object.hasOwn(value, step.key)) throw notFound(path, requestId)
      value = value[step.key]
    } else {
      if (!Array.isArray(value) || step.index >= value.length) throw notFound(path, requestId)
      value = value[step.index]
    }
  }
  return toText(value)
}

function notFound(path: string, requestId: string): Error {
  return new Error(`Path ${path} was not found in the saved response of "${requestId}".`)
}

function toText(value: unknown): string {
  if (typeof value === 'string') return value
  if (value === null) return 'null'
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

// The request ids a text refers to, in the order they first appear. Used to load only the saved responses a request needs.
export function referencedRequestIds(text: string): string[] {
  const ids: string[] = []
  for (const match of text.matchAll(/\{\{\s*response\.([A-Za-z0-9_-]+)\./g)) {
    if (!ids.includes(match[1])) ids.push(match[1])
  }
  return ids
}

// Menu entries for the saved responses of a workspace. Each entry is a complete reference that works as it is.
// The value is never shown, because a body can hold a token, so each entry is marked secret.
export function savedResponseSuggestions(
  summaries: SavedResponseSummary[],
  describe: (summary: SavedResponseSummary) => string,
): Array<{ name: string; scope: string; secret: true }> {
  return summaries.flatMap((summary) => {
    const scope = describe(summary)
    return [
      { name: `${prefix}${summary.requestId}.raw`, scope, secret: true as const },
      { name: `${prefix}${summary.requestId}.body.$`, scope, secret: true as const },
    ]
  })
}

export type SavedResponseSummary = {
  requestId: string
  savedAt: string
  status: number
  statusText: string
  truncated: boolean
}
