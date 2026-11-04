import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cloudVariablesService, isVariablesRevisionConflict } from '@/features/sync/services/cloud-variables.service'
import { ApiError, apiCall } from '@/lib/api'

vi.mock('@/lib/api', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/api')>()), apiCall: vi.fn() }))

const variables = { globals: [{ id: 'g1', name: 'host', value: 'api.test', secret: false }], environments: [] }

describe('cloud variables', () => {
  beforeEach(() => vi.mocked(apiCall).mockReset())

  it('reads the variables and their revision of a workspace', async () => {
    vi.mocked(apiCall).mockResolvedValue({ variables, revision: 3 })
    expect(await cloudVariablesService.get({ token: 't', cloudId: 'w1' })).toEqual({ variables, revision: 3 })
    expect(vi.mocked(apiCall).mock.calls[0][0]).toBe('/api/workspaces/w1/variables')
  })

  it('saves the variables with the revision they were read at', async () => {
    vi.mocked(apiCall).mockResolvedValue({ variables, revision: 4 })
    await cloudVariablesService.put({ token: 't', cloudId: 'w1', variables, baseRevision: 3 })
    expect(vi.mocked(apiCall).mock.calls[0][1]).toMatchObject({ method: 'PUT', body: { variables, baseRevision: 3 } })
  })

  it('recognises a refused save because the variables changed since they were read', () => {
    expect(isVariablesRevisionConflict(new ApiError('x', 409, { code: 'VARIABLES_REVISION_CONFLICT' }))).toBe(true)
    expect(isVariablesRevisionConflict(new ApiError('x', 409, { code: 'SYNC_REMOTE_ADVANCED' }))).toBe(false)
    expect(isVariablesRevisionConflict(new ApiError('x', 403, { code: 'ROLE_NOT_ALLOWED' }))).toBe(false)
    expect(isVariablesRevisionConflict(new Error('offline'))).toBe(false)
  })
})
