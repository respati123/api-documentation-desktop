import { act, renderHook } from '@testing-library/react'
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
    signedIn: true,
    changeCount: 1,
    changes: [{ id: 'a', name: 'List users', status: 'modified' }],
    staged: [],
    unstaged: [{ id: 'a', name: 'List users', status: 'modified' }],
    selectedChangeId: '',
    selectedChange: undefined,
    diffRows: [],
    pendingPushCount: 0,
    syncStatus: '',
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
      onPush: vi.fn(async () => {}),
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
    const added = { id: 'b', name: 'New one', status: 'added' as const }
    const { result } = renderHook(() => useCommitDialogViewModel(input({ changes: [added], unstaged: [added] })))
    expect(result.current.changes.groups[0].rows[0]).toMatchObject({ statusLabel: 'New', checked: false, indeterminate: false })
  })

  it('groups the changes by folder in one stable list, with items outside a folder under the workspace', () => {
    const changes = [
      { id: 'a', name: 'Get user', status: 'modified' as const, method: 'GET', folder: 'Users' },
      { id: 'b', name: 'Workspace variables', status: 'modified' as const },
      { id: 'c', name: 'Update user', status: 'modified' as const, method: 'PATCH', folder: 'Users' },
    ]
    const { result } = renderHook(() =>
      useCommitDialogViewModel(input({ changes, staged: [changes[2]], unstaged: [changes[0], changes[1]] })),
    )
    expect(result.current.changes.groups.map((group) => [group.label, group.rows.map((row) => row.name)])).toEqual([
      ['Users', ['Get user', 'Update user']],
      ['Workspace', ['Workspace variables']],
    ])
    expect(result.current.changes.selectAll).toMatchObject({ checked: false, indeterminate: true, label: '1 of 3 selected' })
    expect(result.current.changes.submitLabel).toBe('Commit 1 change')
  })

  it('keeps a change that was selected and then reverted, so it can still be unselected', () => {
    const staged = { id: 'gone', name: 'Reverted', status: 'modified' as const }
    const onStage = vi.fn()
    const base = input()
    const { result } = renderHook(() =>
      useCommitDialogViewModel(input({ changes: [], staged: [staged], unstaged: [], actions: { ...base.actions, onStage } })),
    )
    const row = result.current.changes.groups[0].rows[0]
    expect(row.checked).toBe(true)
    row.onCheckedChange(false)
    expect(onStage).toHaveBeenCalledWith(staged, false)
  })

  it('takes in the edits when the box of a change edited after selecting is clicked', () => {
    const staged = { id: 'a', name: 'List users', status: 'modified' as const }
    const edited = { ...staged }
    const onStage = vi.fn()
    const base = input()
    const { result } = renderHook(() =>
      useCommitDialogViewModel(input({ message: 'x', staged: [staged], unstaged: [edited], actions: { ...base.actions, onStage } })),
    )
    const row = result.current.changes.groups[0].rows[0]
    expect(row).toMatchObject({ checked: true, indeterminate: true })
    row.onCheckedChange(false)
    expect(onStage).toHaveBeenCalledWith(edited, true)
    expect(result.current.changes.hint).toContain('edited again')
  })

  it('applies select all only to the items the filter shows', () => {
    const changes = Array.from({ length: 9 }, (_, index) => ({
      id: String(index),
      name: index === 0 ? 'Invoice' : 'User ' + index,
      status: 'modified' as const,
    }))
    const onStageAll = vi.fn()
    const base = input()
    const { result } = renderHook(() =>
      useCommitDialogViewModel(input({ changes, unstaged: changes, actions: { ...base.actions, onStageAll } })),
    )
    expect(result.current.changes.filter.visible).toBe(true)
    act(() => result.current.changes.filter.onChange('invoice'))
    result.current.changes.selectAll.onToggle(true)
    expect(onStageAll).toHaveBeenCalledWith([changes[0]], true)
  })

  it('offers Push with a pending commit, and says why when it cannot run', () => {
    const { result } = renderHook(() => useCommitDialogViewModel(input({ pendingPushCount: 2, signedIn: false })))
    expect(result.current.changes.push.pendingLabel).toBe('2 commits not pushed')
    expect(result.current.changes.push.disabledReason).toBe('Sign in to sync this workspace.')
  })

  it('shows the sync status only after a commit or push started from the dialog', async () => {
    const { result } = renderHook(() => useCommitDialogViewModel(input({ pendingPushCount: 1, syncStatus: 'Something older' })))
    expect(result.current.changes.push.status).toBeNull()
    await act(async () => result.current.changes.push.onPush())
    expect(result.current.changes.push.status).toBe('Something older')
  })

  it('counts the lines of the compared change', () => {
    const selectedChange = { id: 'a', name: 'List users', status: 'modified' as const }
    const diffRows = [
      { kind: 'same' as const, leftText: 'a', rightText: 'a', leftLine: 1, rightLine: 1 },
      { kind: 'added' as const, leftText: '', rightText: 'b', leftLine: null, rightLine: 2 },
    ]
    const { result } = renderHook(() => useCommitDialogViewModel(input({ selectedChange, diffRows })))
    expect(result.current.changes.diff?.header).toMatchObject({ added: 1, removed: 0 })
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
