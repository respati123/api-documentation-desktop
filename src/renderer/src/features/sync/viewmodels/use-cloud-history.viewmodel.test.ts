import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearTestQueries, QueryWrapper } from '@/app/test-utils'
import { syncService } from '@/features/sync/services/sync.service'
import { useCloudCommitDetailsViewModel, useCloudHistoryViewModel } from '@/features/sync/viewmodels/use-cloud-history.viewmodel'

vi.mock('@/features/sync/services/sync.service')

const commit = { id: 'c1', parentIds: [], message: 'first', createdAt: '2026-01-01' }
const detail = { ...commit, tree: [], variables: undefined }

describe('useCloudHistoryViewModel', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    clearTestQueries()
  })

  it('does not fetch while the history tab is closed', () => {
    renderHook(() => useCloudHistoryViewModel({ token: 't', cloudId: 'cloud-1', enabled: false }), { wrapper: QueryWrapper })
    expect(syncService.listHistory).not.toHaveBeenCalled()
  })

  it('lists the cloud commits when the tab opens for a signed-in cloud workspace', async () => {
    vi.mocked(syncService.listHistory).mockResolvedValue([commit])
    const { result } = renderHook(() => useCloudHistoryViewModel({ token: 't', cloudId: 'cloud-1', enabled: true }), {
      wrapper: QueryWrapper,
    })
    await waitFor(() => expect(result.current.commits).toEqual([commit]))
    expect(syncService.listHistory).toHaveBeenCalledWith({ token: 't', cloudId: 'cloud-1' })
    expect(result.current.error).toBe('')
  })

  it('shows no cloud commits for a local-only workspace', () => {
    const { result } = renderHook(() => useCloudHistoryViewModel({ token: 't', cloudId: null, enabled: true }), { wrapper: QueryWrapper })
    expect(result.current.commits).toEqual([])
    expect(syncService.listHistory).not.toHaveBeenCalled()
  })

  it('shows the message of a failed list request', async () => {
    vi.mocked(syncService.listHistory).mockRejectedValue(new Error('Offline'))
    const { result } = renderHook(() => useCloudHistoryViewModel({ token: 't', cloudId: 'cloud-1', enabled: true }), {
      wrapper: QueryWrapper,
    })
    await waitFor(() => expect(result.current.error).toBe('Offline'))
  })
})

describe('useCloudCommitDetailsViewModel', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    clearTestQueries()
  })

  it('loads each requested commit by id', async () => {
    vi.mocked(syncService.getCommit).mockResolvedValue(detail)
    const { result } = renderHook(() => useCloudCommitDetailsViewModel({ token: 't', cloudId: 'cloud-1', commitIds: ['c1'] }), {
      wrapper: QueryWrapper,
    })
    await waitFor(() => expect(result.current.detailsById.get('c1')).toEqual(detail))
    expect(syncService.getCommit).toHaveBeenCalledWith({ token: 't', cloudId: 'cloud-1', commitId: 'c1' })
  })

  it('asks for a sign-in instead of fetching when nobody is signed in', () => {
    const { result } = renderHook(() => useCloudCommitDetailsViewModel({ token: null, cloudId: 'cloud-1', commitIds: ['c1'] }), {
      wrapper: QueryWrapper,
    })
    expect(result.current.error).toBe('Sign in to load this cloud commit.')
    expect(syncService.getCommit).not.toHaveBeenCalled()
  })

  it('fetches nothing when no commit is selected', () => {
    const { result } = renderHook(() => useCloudCommitDetailsViewModel({ token: 't', cloudId: 'cloud-1', commitIds: [] }), {
      wrapper: QueryWrapper,
    })
    expect(result.current.error).toBe('')
    expect(syncService.getCommit).not.toHaveBeenCalled()
  })
})
