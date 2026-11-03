import { beforeEach, describe, expect, it, vi } from 'vitest'
import { syncService } from '@/features/sync/services/sync.service'
import { apiCall } from '@/lib/api'

vi.mock('@/lib/api', () => ({ apiCall: vi.fn(), apiListAll: vi.fn(), apiWebSocketUrl: vi.fn() }))

const branch = { id: 'b1', collectionKey: 'users', name: 'main', headCommitId: 'c1', createdBy: 'u1', createdAt: '2026-11-03T00:00:00Z' }

describe('branch calls', () => {
  beforeEach(() => vi.mocked(apiCall).mockReset())

  it('lists the branches of a workspace', async () => {
    vi.mocked(apiCall).mockResolvedValue({ branches: [branch] })
    expect(await syncService.listBranches({ token: 't', cloudId: 'w1' })).toEqual([branch])
    expect(vi.mocked(apiCall).mock.calls[0][0]).toBe('/api/workspaces/w1/branches')
  })

  it('creates a branch from main when no source branch is given', async () => {
    vi.mocked(apiCall).mockResolvedValue({ branch: { ...branch, id: 'b2', name: 'add-login' } })
    await syncService.createBranch({ token: 't', cloudId: 'w1', collectionKey: 'users', name: 'add-login' })
    expect(vi.mocked(apiCall).mock.calls[0][1]).toMatchObject({
      method: 'POST',
      body: { collectionKey: 'users', name: 'add-login', fromBranchId: null },
    })
  })

  it('pulls the collection at a branch head', async () => {
    vi.mocked(apiCall).mockResolvedValue({
      branch: { id: 'b1', collectionKey: 'users', name: 'main' },
      headCommitId: 'c1',
      tree: [{ id: 'users' }],
    })
    const pulled = await syncService.pullBranch({ token: 't', cloudId: 'w1', branchId: 'b1' })
    expect(pulled.headCommitId).toBe('c1')
    expect(vi.mocked(apiCall).mock.calls[0][0]).toBe('/api/workspaces/w1/branches/b1/pull')
  })

  it('pushes commits to one branch and returns the new head', async () => {
    vi.mocked(apiCall).mockResolvedValue({ headCommitId: 'c2' })
    const head = await syncService.pushBranch({
      token: 't',
      cloudId: 'w1',
      branchId: 'b1',
      commits: [{ id: 'c2', parentIds: ['c1'], message: 'Edit', tree: [{ id: 'users' }] }],
    })
    expect(head).toBe('c2')
    expect(vi.mocked(apiCall).mock.calls[0][1]).toMatchObject({ method: 'POST' })
  })
})
