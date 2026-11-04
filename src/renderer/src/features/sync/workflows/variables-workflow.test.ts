import { describe, expect, it, vi } from 'vitest'
import { resolveVariablesConflict, saveVariablesToCloud } from '@/features/sync/workflows/variables-workflow'
import { ApiError } from '@/lib/api'

const mine = { globals: [{ id: 'g1', name: 'host', value: 'mine.test', secret: false }], environments: [] }
const cloud = { globals: [{ id: 'g1', name: 'host', value: 'cloud.test', secret: false }], environments: [] }
const input = { token: 't', cloudId: 'w1', variables: mine, baseRevision: 2 }

function api(put: () => Promise<unknown>, get = vi.fn(async () => ({ variables: cloud, revision: 5 }))) {
  return { put: vi.fn(put), get } as unknown as NonNullable<Parameters<typeof saveVariablesToCloud>[1]>
}

describe('saveVariablesToCloud', () => {
  it('returns the new revision when the save goes through', async () => {
    const service = api(async () => ({ variables: mine, revision: 3 }))
    expect(await saveVariablesToCloud(input, service)).toEqual({ kind: 'saved', revision: 3 })
  })

  it('reads the cloud variables when the save is refused because they changed', async () => {
    const service = api(async () => {
      throw new ApiError('changed', 409, { code: 'VARIABLES_REVISION_CONFLICT' })
    })
    expect(await saveVariablesToCloud(input, service)).toEqual({ kind: 'conflict', remote: { variables: cloud, revision: 5 } })
    expect(service.get).toHaveBeenCalledWith({ token: 't', cloudId: 'w1' })
  })

  it('passes any other error on, so a network failure is not taken for a conflict', async () => {
    const service = api(async () => {
      throw new Error('offline')
    })
    await expect(saveVariablesToCloud(input, service)).rejects.toThrow('offline')
    expect(service.get).not.toHaveBeenCalled()
  })
})

describe('resolveVariablesConflict', () => {
  const remote = { variables: cloud, revision: 5 }

  it('"mine" keeps this device’s variables and saves them on top of the cloud revision', () => {
    expect(resolveVariablesConflict('mine', mine, remote)).toEqual({ variables: mine, baseRevision: 5, sendToCloud: true })
  })

  it('"cloud" takes the cloud variables and sends nothing, so this device’s edit is dropped only by the user’s choice', () => {
    expect(resolveVariablesConflict('cloud', mine, remote)).toEqual({ variables: cloud, baseRevision: 5, sendToCloud: false })
  })
})
