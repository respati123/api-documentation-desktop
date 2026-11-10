// @vitest-environment node
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  listSavedResponses,
  MAX_SAVED_BODY_BYTES,
  readSavedResponse,
  responseFilePath,
  SAVED_RESPONSE_STATUS,
  saveResponse,
} from './response-store'

const base = {
  workspaceId: 'local-default',
  requestId: 'login-request',
  status: 200,
  statusText: 'OK',
  headers: { 'content-type': 'application/json', location: '/users/1' },
  body: '{"data":{"accessToken":"abc"}}',
}

let dataDir: string

beforeEach(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'response-store-'))
})

afterEach(() => {
  rmSync(dataDir, { recursive: true, force: true })
})

describe('responseFilePath', () => {
  it('places one file per request under responses/<workspaceId>/', () => {
    expect(responseFilePath(dataDir, 'local-default', 'login-request')).toBe(
      join(dataDir, 'responses', 'local-default', 'login-request.json'),
    )
  })

  it('refuses ids that could escape the responses folder', () => {
    expect(() => responseFilePath(dataDir, '../etc', 'x')).toThrow()
    expect(() => responseFilePath(dataDir, 'ok', '..')).toThrow()
    expect(() => responseFilePath(dataDir, 'ok', 'a/b')).toThrow()
    expect(() => responseFilePath(dataDir, '', 'x')).toThrow()
  })
})

describe('saveResponse', () => {
  it('saves a 200 response and reads it back with the same fields', async () => {
    const saved = await saveResponse(dataDir, base, new Date('2026-11-10T10:00:00.000Z'))

    expect(saved).toBe(true)
    const read = await readSavedResponse(dataDir, 'local-default', 'login-request')
    expect(read).toEqual({
      savedAt: '2026-11-10T10:00:00.000Z',
      status: 200,
      statusText: 'OK',
      headers: base.headers,
      body: base.body,
      truncated: false,
    })
  })

  it('does not save responses with any other status, and keeps the one already saved', async () => {
    await saveResponse(dataDir, base)

    const saved = await saveResponse(dataDir, { ...base, status: 500, statusText: 'Server Error', body: 'oops' })

    expect(saved).toBe(false)
    const read = await readSavedResponse(dataDir, 'local-default', 'login-request')
    expect(read?.status).toBe(200)
    expect(read?.body).toBe(base.body)
  })

  it('keeps only the last 200 response for a request', async () => {
    await saveResponse(dataDir, base)
    await saveResponse(dataDir, { ...base, body: '{"data":{"accessToken":"second"}}' })

    const read = await readSavedResponse(dataDir, 'local-default', 'login-request')
    expect(read?.body).toBe('{"data":{"accessToken":"second"}}')
  })

  it('marks a body larger than the limit as truncated and stores only the limit', async () => {
    const big = 'a'.repeat(MAX_SAVED_BODY_BYTES + 10)

    await saveResponse(dataDir, { ...base, body: big })

    const read = await readSavedResponse(dataDir, 'local-default', 'login-request')
    expect(read?.truncated).toBe(true)
    expect(Buffer.byteLength(read?.body ?? '')).toBe(MAX_SAVED_BODY_BYTES)
  })

  it('leaves no temporary file behind after a save', async () => {
    await saveResponse(dataDir, base)

    const names = readdirSync(join(dataDir, 'responses', 'local-default'))
    expect(names).toEqual(['login-request.json'])
  })

  it('exposes the saved status as a constant', () => {
    expect(SAVED_RESPONSE_STATUS).toBe(200)
  })
})

describe('readSavedResponse', () => {
  it('returns undefined when the request has never been saved', async () => {
    expect(await readSavedResponse(dataDir, 'local-default', 'never-sent')).toBeUndefined()
  })

  it('throws a clear error when the saved file is not valid', async () => {
    const file = responseFilePath(dataDir, 'local-default', 'broken')
    mkdirSync(join(dataDir, 'responses', 'local-default'), { recursive: true })
    writeFileSync(file, '{"status":"not a number"}')

    await expect(readSavedResponse(dataDir, 'local-default', 'broken')).rejects.toThrow(/saved response/i)
  })

  it('stores the file as plain JSON the reader can parse', async () => {
    await saveResponse(dataDir, base)

    const raw = readFileSync(responseFilePath(dataDir, 'local-default', 'login-request'), 'utf8')
    expect(JSON.parse(raw).status).toBe(200)
  })
})

describe('listSavedResponses', () => {
  it('returns an empty list when nothing was saved for the workspace', async () => {
    expect(await listSavedResponses(dataDir, 'local-default')).toEqual([])
  })

  it('lists one summary per saved request, without the body or headers', async () => {
    await saveResponse(dataDir, base, new Date('2026-11-10T10:00:00.000Z'))
    await saveResponse(dataDir, { ...base, requestId: 'list', body: '[]' }, new Date('2026-11-10T11:00:00.000Z'))

    expect(await listSavedResponses(dataDir, 'local-default')).toEqual([
      { requestId: 'list', savedAt: '2026-11-10T11:00:00.000Z', status: 200, statusText: 'OK', truncated: false },
      { requestId: 'login-request', savedAt: '2026-11-10T10:00:00.000Z', status: 200, statusText: 'OK', truncated: false },
    ])
  })

  it('skips a file that is not a valid saved response, and keeps the others', async () => {
    await saveResponse(dataDir, base)
    writeFileSync(responseFilePath(dataDir, 'local-default', 'broken'), '{"status":"no"}')

    const summaries = await listSavedResponses(dataDir, 'local-default')

    expect(summaries.map((summary) => summary.requestId)).toEqual(['login-request'])
  })

  it('refuses an unsafe workspace id', async () => {
    await expect(listSavedResponses(dataDir, '../x')).rejects.toThrow()
  })
})
