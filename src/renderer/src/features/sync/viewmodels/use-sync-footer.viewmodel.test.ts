import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { type SyncFooterInput, useSyncFooterViewModel } from '@/features/sync/viewmodels/use-sync-footer.viewmodel'

function input(overrides: Partial<SyncFooterInput> = {}): SyncFooterInput {
  return {
    open: true,
    onOpenChange: vi.fn(),
    workspace: { name: 'Platform', cloudId: null, baseCommitId: null },
    signedIn: false,
    readOnly: false,
    changeCount: 0,
    historyCount: 0,
    pendingPushCount: 0,
    cloudHeadCommitId: undefined,
    actions: { openHistory: vi.fn(), discard: vi.fn(), openCommit: vi.fn(), pull: vi.fn(), push: vi.fn() },
    ...overrides,
  }
}

describe('useSyncFooterViewModel', () => {
  it('explains that a local workspace must be committed before it can be pushed', () => {
    const { result } = renderHook(() => useSyncFooterViewModel(input({ signedIn: true, changeCount: 1 })))
    expect(result.current.pushDisabledReason).toBe('Commit changes first; Push will publish this local workspace.')
    expect(result.current.statusLines.map((line) => line.key)).toEqual(['changes'])
  })

  it('asks for a sign-in before anything can be pushed', () => {
    const { result } = renderHook(() => useSyncFooterViewModel(input()))
    expect(result.current.pushDisabledReason).toBe('Sign in to sync this workspace.')
  })

  it('shows cloud updates on the trigger, the pull item, and the status line', () => {
    const { result } = renderHook(() =>
      useSyncFooterViewModel(
        input({
          workspace: { name: 'Platform', cloudId: 'cloud-1', baseCommitId: 'head-1' },
          signedIn: true,
          cloudHeadCommitId: 'head-2',
        }),
      ),
    )
    expect(result.current.cloudItems.find((item) => item.key === 'pull')?.detail).toBe('Updates available')
    expect(result.current.trigger.indicators.map((indicator) => indicator.key)).toContain('update')
    expect(result.current.statusLines.map((line) => line.key)).toContain('cloudUpdate')
  })

  it('closes the menu before running the chosen action', () => {
    const data = input({ changeCount: 2 })
    const { result } = renderHook(() => useSyncFooterViewModel(data))
    const commit = result.current.localItems.find((item) => item.key === 'commit')
    act(() => commit?.onSelect())
    expect(data.onOpenChange).toHaveBeenCalledWith(false)
    expect(data.actions.openCommit).toHaveBeenCalled()
  })

  it('disables discard and commit when nothing has changed', () => {
    const { result } = renderHook(() => useSyncFooterViewModel(input()))
    expect(result.current.localItems.find((item) => item.key === 'discard')?.disabled).toBe(true)
    expect(result.current.localItems.find((item) => item.key === 'commit')?.disabled).toBe(true)
  })
})
