import type { z } from 'zod'
import { isRecord } from '@/shared/utils/record'

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function apiWebSocketUrl(path: string): string {
  const url = new URL(path, apiBaseUrl)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data: unknown,
  ) {
    super(message)
  }
}

type RequestOptions = { token?: string; method?: string; body?: unknown }

const listPageLimit = 100
const listPageCap = 200

async function send(path: string, options: RequestOptions): Promise<unknown> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  })
  const result: unknown = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = isRecord(result) && typeof result.error === 'string' ? result.error : undefined
    throw new ApiError(message || `API request failed (${response.status}).`, response.status, result)
  }
  return result
}

// Calls the API and returns the response's data. With a schema, the data is parsed before it is returned, so a mismatch throws.
export async function apiCall(path: string, options?: RequestOptions): Promise<unknown>
export async function apiCall<S extends z.ZodType>(path: string, options: RequestOptions, schema: S): Promise<z.infer<S>>
export async function apiCall(path: string, options: RequestOptions = {}, schema?: z.ZodType): Promise<unknown> {
  const result = await send(path, options)
  const data = isRecord(result) && 'data' in result ? result.data : result
  return schema ? schema.parse(data) : data
}

// Follows meta.nextCursor until the list ends. Each item is parsed with the schema. A list past the page cap is an error, not a silently cut list.
export async function apiListAll<S extends z.ZodType>(
  path: string,
  key: string,
  options: { token?: string },
  schema: S,
): Promise<z.infer<S>[]> {
  const items: z.infer<S>[] = []
  let cursor: string | null = null
  for (let page = 0; page < listPageCap; page++) {
    const query = new URLSearchParams({ limit: String(listPageLimit) })
    if (cursor) query.set('cursor', cursor)
    const result = await send(`${path}?${query}`, options)
    items.push(...readListItems(result, key, schema))
    cursor = readNextCursor(result)
    if (!cursor) return items
  }
  throw new Error(`Cloud list ${path} has more than ${listPageLimit * listPageCap} items.`)
}

function readListItems<S extends z.ZodType>(result: unknown, key: string, schema: S): z.infer<S>[] {
  const data = isRecord(result) ? result.data : undefined
  const items = isRecord(data) ? data[key] : undefined
  if (!Array.isArray(items)) throw new Error(`Cloud response has no ${key} list.`)
  return items.map((item) => schema.parse(item))
}

function readNextCursor(result: unknown): string | null {
  const meta = isRecord(result) ? result.meta : undefined
  const cursor = isRecord(meta) ? meta.nextCursor : undefined
  return typeof cursor === 'string' ? cursor : null
}
