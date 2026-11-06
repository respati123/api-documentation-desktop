import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { type CommitDialogInput, useCommitDialogViewModel } from '@/features/sync/viewmodels/use-commit-dialog.viewmodel'

const noop = vi.fn()

function input(overrides: Partial<CommitDialogInput> = {}): CommitDialogInput {
  return {
    open: true,
    view: 'changes',
    message: '',
    readOnly: false,
    cloudConnected: false,
    changeCount: 1,
    staged: [],
    unstaged: [{ id: 'a', name: 'List users', status: 'modified' }],
    selectedChangeId: '',
    selectedChange: undefined,
    diffRows: [],
    history: {
      commits: [],
      localCommitIds: new Set(),
      selectedCommit: undefined,
      loading: false,
      error: '',
      detailLoading: false,
      detailError: '',
      snapshotsReady: false,
      changes: [],
      selectedChangeId: '',
      selectedChange: undefined,
      diffRows: [],
    },
    actions: {
      onOpenChange: noop,
      onViewChange: noop,
      onMessageChange: noop,
      onSubmit: noop,
      onSelectChange: noop,
      onStage: noop,
      onStageAll: noop,
      onUnstageAll: noop,
      onSelectHistoryCommit: noop,
      onSelectHistoryChange: noop,
      onRevertHistoryCommit: noop,
      onOpenHistory: noop,
      onOpenChanges: noop,
    },
    ...overrides,
  }
}

describe('useCommitDialogViewModel', () => {
  it('does not allow a commit without a message and at least one staged change', () => {
    const { result } = renderHook(() => useCommitDialogViewModel(input({ message: 'Add endpoints' })))
    expect(result.current.changes.canSubmit).toBe(false)
  })

  it('allows a commit once there is a message and a staged change', () => {
    const staged = [{ id: 'a', name: 'List users', status: 'modified' as const }]
    const { result } = renderHook(() => useCommitDialogViewModel(input({ message: 'Add endpoints', staged })))
    expect(result.current.changes.canSubmit).toBe(true)
  })

  it('uses the change status word from the locale, not English text in the view', () => {
    const { result } = renderHook(() => useCommitDialogViewModel(input({ unstaged: [{ id: 'b', name: 'New', status: 'added' }] })))
    expect(result.current.changes.unstagedRows[0]).toMatchObject({ code: 'U', actionLabel: 'Stage' })
  })

  it('labels a cloud commit that was pushed, a local one that was not, and a cloud one that is only remote', () => {
    const { result } = renderHook(() =>
      useCommitDialogViewModel(
        input({
          history: {
            ...input().history,
            commits: [
              { id: 'c1', message: 'one', createdAt: '2026-01-01', pushed: true, source: 'cloud' },
              { id: 'c2', message: 'two', createdAt: '2026-01-02', pushed: false, source: 'local' },
              { id: 'c3', message: 'three', createdAt: '2026-01-03', pushed: false, source: 'cloud' },
            ],
            localCommitIds: new Set(['c1']),
          },
        }),
      ),
    )
    expect(result.current.history.commits.map((commit) => commit.state)).toEqual(['Pushed', 'Local', 'Cloud'])
    // The tone comes from where the commit lives, not from the translated label.
    expect(result.current.history.commits.map((commit) => commit.tone)).toEqual(['pushed', 'local', 'cloud'])
  })

  it('explains that a cloud-less workspace shows only local commits', () => {
    const { result } = renderHook(() => useCommitDialogViewModel(input({ view: 'history', cloudConnected: false })))
    expect(result.current.description).toBe(
      'Browse commits saved on this device. Connect this workspace to cloud to see your team’s commits.',
    )
  })

  it('says no commits exist yet, once loading has finished', () => {
    const { result } = renderHook(() => useCommitDialogViewModel(input({ view: 'history' })))
    expect(result.current.history.emptyText).toBe('No commits yet. Make a change, stage it, and commit to start the history.')
  })
})
