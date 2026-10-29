import type { WorkspaceVariables } from './workspace-variables'

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function apiWebSocketUrl(path: string): string {
  const url = new URL(path, apiBaseUrl)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

export type ApiUser = { id: string; email: string }
export type CloudWorkspace = {
  id: string
  name: string
  role: 'owner' | 'editor' | 'viewer'
  headCommitId: string
  tree?: unknown[]
  variables?: WorkspaceVariables
}
export type CloudCommit = { id: string; parentIds: string[]; message: string; createdAt: string }
export type CloudCommitDetail = CloudCommit & { tree: unknown[]; variables?: WorkspaceVariables }

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
type ListResult<T> = { data?: Record<string, T[]>; meta?: { nextCursor?: unknown } }

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
  const result = (await response.json().catch(() => ({}))) as { error?: string }
  if (!response.ok) throw new ApiError(result.error || `API request failed (${response.status}).`, response.status, result)
  return result
}

export async function apiCall<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const result = await send(path, options)
  return (typeof result === 'object' && result !== null && 'data' in result ? result.data : result) as T
}

// Follows meta.nextCursor until the list ends. A list past the page cap is an error, not a silently cut list.
export async function apiListAll<T>(path: string, key: string, options: { token?: string } = {}): Promise<T[]> {
  const items: T[] = []
  let cursor: string | null = null
  for (let page = 0; page < listPageCap; page++) {
    const query = new URLSearchParams({ limit: String(listPageLimit) })
    if (cursor) query.set('cursor', cursor)
    const result = (await send(`${path}?${query}`, options)) as ListResult<T>
    items.push(...readListItems(result, key))
    cursor = readNextCursor(result)
    if (!cursor) return items
  }
  throw new Error(`Cloud list ${path} has more than ${listPageLimit * listPageCap} items.`)
}

function readListItems<T>(result: ListResult<T>, key: string): T[] {
  const items = result.data?.[key]
  if (!Array.isArray(items)) throw new Error(`Cloud response has no ${key} list.`)
  return items
}

function readNextCursor(result: ListResult<unknown>): string | null {
  const cursor = result.meta?.nextCursor
  return typeof cursor === 'string' ? cursor : null
}
