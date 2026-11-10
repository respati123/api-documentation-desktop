import { randomUUID } from 'node:crypto'
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'

// Saved responses let one request use a value from another request's last successful response.
// They hold the response body and headers, which can contain tokens. They are local files only and are never synced.

// Only the last response with this status is kept. A response with any other status never replaces it.
export const SAVED_RESPONSE_STATUS = 200

// Bodies above this size are cut off and marked truncated. A reference to a truncated body fails.
export const MAX_SAVED_BODY_BYTES = 1024 * 1024

const idPattern = /^[A-Za-z0-9_-]{1,128}$/

// Ids from the renderer are checked against the same pattern before they reach a file path.
export const storeIdSchema = z.string().regex(idPattern)

const savedResponseSchema = z.object({
  savedAt: z.string(),
  status: z.literal(SAVED_RESPONSE_STATUS),
  statusText: z.string(),
  headers: z.record(z.string(), z.string()),
  body: z.string(),
  truncated: z.boolean(),
})

export type SavedResponse = z.infer<typeof savedResponseSchema>

export interface SaveResponseInput {
  workspaceId: string
  requestId: string
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
}

// Ids come from the app, but they become part of a file path, so anything outside a plain id is refused.
function assertSafeId(kind: 'workspace' | 'request', id: string): void {
  if (!idPattern.test(id)) throw new Error(`The ${kind} id cannot be used to save a response.`)
}

export function responseFilePath(dataDir: string, workspaceId: string, requestId: string): string {
  assertSafeId('workspace', workspaceId)
  assertSafeId('request', requestId)
  return join(dataDir, 'responses', workspaceId, `${requestId}.json`)
}

// Writes to a temporary file first and then renames it, so a reader never sees a half-written file.
// Returns false, and writes nothing, when the status is not the saved status.
export async function saveResponse(dataDir: string, input: SaveResponseInput, now: Date = new Date()): Promise<boolean> {
  if (input.status !== SAVED_RESPONSE_STATUS) return false
  const file = responseFilePath(dataDir, input.workspaceId, input.requestId)

  const bytes = Buffer.from(input.body, 'utf8')
  const truncated = bytes.byteLength > MAX_SAVED_BODY_BYTES
  const saved: SavedResponse = {
    savedAt: now.toISOString(),
    status: SAVED_RESPONSE_STATUS,
    statusText: input.statusText,
    headers: input.headers,
    body: truncated ? bytes.subarray(0, MAX_SAVED_BODY_BYTES).toString('utf8') : input.body,
    truncated,
  }

  await mkdir(join(dataDir, 'responses', input.workspaceId), { recursive: true })
  const temporary = `${file}.${randomUUID()}.tmp`
  try {
    await writeFile(temporary, JSON.stringify(saved), { flag: 'wx' })
    await rename(temporary, file)
  } catch (error) {
    await rm(temporary, { force: true })
    throw error
  }
  return true
}

// Returns undefined when the request has never been saved. Throws when the file exists but is not valid.
export async function readSavedResponse(dataDir: string, workspaceId: string, requestId: string): Promise<SavedResponse | undefined> {
  const file = responseFilePath(dataDir, workspaceId, requestId)
  let text: string
  try {
    text = await readFile(file, 'utf8')
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return undefined
    throw error
  }
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`The saved response for "${requestId}" is not valid JSON.`)
  }
  const parsed = savedResponseSchema.safeParse(json)
  if (!parsed.success) throw new Error(`The saved response for "${requestId}" has an unexpected format.`)
  return parsed.data
}

// What the UI needs to list saved responses. The body is left out, so listing never sends bodies to the renderer.
export type SavedResponseSummary = {
  requestId: string
  savedAt: string
  status: number
  statusText: string
  truncated: boolean
}

// Lists the saved responses of one workspace. A file that cannot be read is skipped, so one bad file never hides the rest.
export async function listSavedResponses(dataDir: string, workspaceId: string): Promise<SavedResponseSummary[]> {
  assertSafeId('workspace', workspaceId)
  let names: string[]
  try {
    names = await readdir(join(dataDir, 'responses', workspaceId))
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return []
    throw error
  }
  const summaries = await Promise.all(
    names
      .filter((name) => name.endsWith('.json') && idPattern.test(name.slice(0, -'.json'.length)))
      .map(async (name): Promise<SavedResponseSummary | undefined> => {
        const requestId = name.slice(0, -'.json'.length)
        try {
          const saved = await readSavedResponse(dataDir, workspaceId, requestId)
          if (!saved) return undefined
          return { requestId, savedAt: saved.savedAt, status: saved.status, statusText: saved.statusText, truncated: saved.truncated }
        } catch {
          return undefined
        }
      }),
  )
  return summaries
    .filter((summary): summary is SavedResponseSummary => summary !== undefined)
    .sort((left, right) => left.requestId.localeCompare(right.requestId))
}
