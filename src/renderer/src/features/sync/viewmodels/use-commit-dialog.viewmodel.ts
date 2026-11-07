import { type FormEvent, type KeyboardEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SYNC_TEXT } from '@/features/sync/constants/sync-text.constants'
import { changeStatusKey } from '@/features/sync/lib/change-status'
import { canRevertTo } from '@/features/sync/lib/revert'
import type { CommitTab } from '@/features/sync/viewmodels/use-commit-dialog-state.viewmodel'
import type { TextDiffRow } from '@/lib/text-diff'
import type { WorkspaceChange } from '@/lib/workspace-changes'
import type { CommitTone } from '@/shared/ui'

// The fields of a commit that the dialog reads. Structural, so sync does not depend on the workspace's models.
export type CommitSummary = {
  id: string
  message: string
  createdAt: string
  pushed: boolean
  source: 'local' | 'cloud'
}

export type DiffLayout = 'split' | 'unified'

const messageMax = 200
// A short list needs no filter.
const filterFromCount = 8

export type CommitDialogInput = {
  open: boolean
  view: CommitTab
  message: string
  readOnly: boolean
  cloudConnected: boolean
  signedIn: boolean
  // The commit the cloud head points to. Reverting to it would do nothing, so the button stays off.
  cloudHeadId?: string | null
  changeCount: number
  // The working tree compared with the last commit. It gives the list one stable order while items are selected.
  changes: WorkspaceChange[]
  staged: WorkspaceChange[]
  unstaged: WorkspaceChange[]
  selectedChangeId: string
  selectedChange: WorkspaceChange | undefined
  diffRows: TextDiffRow[]
  pendingPushCount: number
  // The result of the last commit or push. Only shown after one is started from this dialog.
  syncStatus: string
  history: {
    commits: CommitSummary[]
    localCommitIds: ReadonlySet<string>
    selectedCommit: CommitSummary | undefined
    loading: boolean
    error: string
    detailLoading: boolean
    detailError: string
    snapshotsReady: boolean
    changes: WorkspaceChange[]
    selectedChangeId: string
    selectedChange: WorkspaceChange | undefined
    diffRows: TextDiffRow[]
  }
  actions: {
    onOpenChange: (open: boolean) => void
    onViewChange: (view: CommitTab) => void
    onMessageChange: (message: string) => void
    onSubmit: (event: FormEvent) => void
    onSelectChange: (changeId: string) => void
    onStage: (change: WorkspaceChange, staged: boolean) => void
    onStageAll: (changes: WorkspaceChange[], staged: boolean) => void
    onUnstageAll: () => void
    onPush: () => Promise<void>
    onSelectHistoryCommit: (commitId: string) => void
    onSelectHistoryChange: (changeId: string) => void
    onRevertHistoryCommit: (commitId: string) => void
    onOpenHistory: () => void
    onOpenChanges: () => void
  }
}

function countLines(rows: TextDiffRow[], kind: TextDiffRow['kind']): number {
  return rows.filter((row) => row.kind === kind).length
}

// Turns the commit dialog's data into everything its two tabs show. Labels, empty states, and badges are decided here.
export function useCommitDialogViewModel(input: CommitDialogInput) {
  const { t } = useTranslation('sync')
  const { actions, history } = input
  const [filter, setFilter] = useState('')
  const [layout, setLayout] = useState<DiffLayout>('split')
  const [pushing, setPushing] = useState(false)
  const [statusVisible, setStatusVisible] = useState(false)

  function onOpenChange(open: boolean) {
    setStatusVisible(false)
    setFilter('')
    actions.onOpenChange(open)
  }

  function diffHeader(change: WorkspaceChange, rows: TextDiffRow[]) {
    return {
      name: change.name,
      method: change.method,
      folder: change.folder,
      status: change.status,
      statusLabel: t(changeStatusKey(change.status)),
      added: countLines(rows, 'added'),
      removed: countLines(rows, 'removed'),
    }
  }

  const description =
    input.view === 'changes'
      ? t(SYNC_TEXT.commit.changesDescription)
      : input.cloudConnected
        ? t(SYNC_TEXT.commit.historyDescriptionCloud)
        : t(SYNC_TEXT.commit.historyDescriptionLocal)

  // A change is in both lists when it was selected and then edited again. One row shows it, in the mixed state.
  const stagedById = new Map(input.staged.map((change) => [change.id, change]))
  const unstagedById = new Map(input.unstaged.map((change) => [change.id, change]))
  const knownIds = new Set(input.changes.map((change) => change.id))
  const allChanges = [...input.changes, ...input.staged.filter((change) => !knownIds.has(change.id))]
  const query = filter.trim().toLowerCase()
  const visible = query ? allChanges.filter((change) => `${change.name} ${change.folder ?? ''}`.toLowerCase().includes(query)) : allChanges
  const visibleIds = new Set(visible.map((change) => change.id))
  const visibleStaged = input.staged.filter((change) => visibleIds.has(change.id))
  const visibleUnstaged = input.unstaged.filter((change) => visibleIds.has(change.id))
  const editedCount = input.staged.filter((change) => unstagedById.has(change.id)).length

  function toRow(change: WorkspaceChange) {
    const staged = stagedById.get(change.id)
    const unstaged = unstagedById.get(change.id)
    return {
      key: change.id,
      name: change.name,
      method: change.method,
      status: change.status,
      statusLabel: t(changeStatusKey(change.status)),
      selected: input.selectedChangeId === change.id,
      onSelect: () => actions.onSelectChange(change.id),
      checked: Boolean(staged),
      indeterminate: Boolean(staged && unstaged),
      checkLabel: t(SYNC_TEXT.commit.includeInCommit, { name: change.name }),
      // On a change edited after it was selected, a click takes in the edits instead of dropping the change.
      onCheckedChange: (next: boolean) => {
        if (unstaged && (next || staged)) actions.onStage(unstaged, true)
        else if (staged) actions.onStage(staged, false)
      },
    }
  }

  const rootGroup = t(SYNC_TEXT.commit.rootGroup)
  const groups: { key: string; label: string; rows: ReturnType<typeof toRow>[] }[] = []
  for (const change of visible) {
    const label = change.folder ?? rootGroup
    const group = groups.find((item) => item.label === label)
    if (group) group.rows.push(toRow(change))
    else groups.push({ key: label, label, rows: [toRow(change)] })
  }

  const canSubmit = input.message.trim() !== '' && input.staged.length > 0

  let hint = t(SYNC_TEXT.commit.hintReady)
  if (input.staged.length === 0) hint = t(SYNC_TEXT.commit.hintSelect)
  else if (input.message.trim() === '') hint = t(SYNC_TEXT.commit.hintMessage)
  else if (editedCount > 0) hint = t(SYNC_TEXT.commit.hintEdited)

  const pushDisabledReason = !input.signedIn ? t(SYNC_TEXT.footer.signIn) : input.readOnly ? t(SYNC_TEXT.footer.viewerReadOnly) : ''

  async function onPush() {
    setStatusVisible(true)
    setPushing(true)
    try {
      await actions.onPush()
    } finally {
      setPushing(false)
    }
  }

  function onSubmit(event: FormEvent) {
    setStatusVisible(true)
    actions.onSubmit(event)
  }

  const historyCommits = history.commits.map((commit) => {
    const tone: CommitTone =
      commit.source === 'cloud' ? (history.localCommitIds.has(commit.id) ? 'pushed' : 'cloud') : commit.pushed ? 'pushed' : 'local'
    return {
      id: commit.id,
      message: commit.message,
      date: new Date(commit.createdAt).toLocaleString(),
      state: t(SYNC_TEXT.commit[tone]),
      tone,
      selected: history.selectedCommit?.id === commit.id,
    }
  })

  const historyChanges = history.changes.map((change) => ({
    key: change.id,
    name: change.name,
    method: change.method,
    status: change.status,
    statusLabel: t(changeStatusKey(change.status)),
    selected: history.selectedChangeId === change.id,
    onSelect: () => actions.onSelectHistoryChange(change.id),
  }))

  let historyEmpty: string | null = null
  if (!history.snapshotsReady)
    historyEmpty = history.detailError
      ? t(SYNC_TEXT.history.detailError, { error: history.detailError })
      : t(SYNC_TEXT.history.loadingDetails)
  else if (!history.changes.length) historyEmpty = t(SYNC_TEXT.history.noVisible)

  let historyDiffEmpty: string
  if (history.selectedCommit && history.detailError) historyDiffEmpty = t(SYNC_TEXT.history.errorDetail, { error: history.detailError })
  else if (history.selectedCommit && !history.snapshotsReady) historyDiffEmpty = t(SYNC_TEXT.history.loadingSelected)
  else if (history.selectedCommit) historyDiffEmpty = t(SYNC_TEXT.history.selectItem)
  else if (history.loading && !history.commits.length) historyDiffEmpty = t(SYNC_TEXT.history.loadingCloudHistory)
  else if (history.commits.length) historyDiffEmpty = t(SYNC_TEXT.history.selectCommit)
  else historyDiffEmpty = t(SYNC_TEXT.history.firstCommit)

  return {
    open: input.open,
    onOpenChange,
    onClose: () => onOpenChange(false),
    closeLabel: t(SYNC_TEXT.commit.close),
    openHistory: actions.onOpenHistory,
    openChanges: actions.onOpenChanges,
    openHistoryTab: () => actions.onViewChange('history'),
    title: input.view === 'changes' ? t(SYNC_TEXT.commit.title) : t(SYNC_TEXT.commit.historyTitle),
    description,
    tabs: {
      label: t(SYNC_TEXT.commit.tabsLabel),
      view: input.view,
      changesLabel: t(SYNC_TEXT.commit.changesTab),
      changesCount: input.changeCount,
      changesDisabled: input.readOnly,
      historyLabel: t(SYNC_TEXT.commit.historyTab),
      historyCount: history.commits.length,
      onSelect: (value: string) => actions.onViewChange(value === 'history' ? 'history' : 'changes'),
    },
    diffLayout: {
      label: t(SYNC_TEXT.commit.diffLayout),
      value: layout,
      options: [
        { value: 'split', label: t(SYNC_TEXT.commit.diffSplit) },
        { value: 'unified', label: t(SYNC_TEXT.commit.diffUnified) },
      ],
      onChange: (value: string) => setLayout(value === 'unified' ? 'unified' : 'split'),
    },
    changes: {
      isEmpty: allChanges.length === 0,
      empty: {
        title: t(SYNC_TEXT.commit.emptyTitle),
        body: t(SYNC_TEXT.commit.emptyBody),
        action: t(SYNC_TEXT.commit.emptyAction),
      },
      selectAll: {
        label:
          visibleStaged.length === 0
            ? t(SYNC_TEXT.commit.selectAll, { count: visible.length })
            : t(SYNC_TEXT.commit.selectedCount, { selected: visibleStaged.length, total: visible.length }),
        checked: visible.length > 0 && visibleStaged.length === visible.length,
        indeterminate: visibleStaged.length > 0 && visibleStaged.length < visible.length,
        onToggle: (next: boolean) => {
          if (next) actions.onStageAll(visibleUnstaged, true)
          else if (query) actions.onStageAll(visibleStaged, false)
          else actions.onUnstageAll()
        },
      },
      filter: {
        visible: allChanges.length > filterFromCount,
        label: t(SYNC_TEXT.commit.filter),
        value: filter,
        onChange: setFilter,
      },
      noMatch: query && visible.length === 0 ? t(SYNC_TEXT.commit.noMatch) : null,
      groups,
      messageLabel: t(SYNC_TEXT.commit.message),
      messagePlaceholder: t(SYNC_TEXT.commit.messagePlaceholder),
      messageMax,
      messageCount: `${input.message.length}/${messageMax}`,
      message: input.message,
      onMessageChange: actions.onMessageChange,
      onMessageKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey)) return
        event.preventDefault()
        if (canSubmit) onSubmit(event)
      },
      onSubmit,
      canSubmit,
      submitLabel: input.staged.length > 0 ? t(SYNC_TEXT.commit.submitCount, { count: input.staged.length }) : t(SYNC_TEXT.commit.submit),
      hint,
      push: {
        pendingLabel: input.pendingPushCount > 0 ? t(SYNC_TEXT.commit.unpushed, { count: input.pendingPushCount }) : null,
        label: t(SYNC_TEXT.footer.push),
        pushing,
        disabledReason: pushDisabledReason,
        status: statusVisible && input.syncStatus ? input.syncStatus : null,
        onPush: () => void onPush(),
      },
      diffLabel: t(SYNC_TEXT.commit.diffLabel),
      diff: input.selectedChange
        ? {
            header: diffHeader(input.selectedChange, input.diffRows),
            leftHeading: t(SYNC_TEXT.commit.previous),
            rightHeading: t(SYNC_TEXT.commit.workingTree),
            rows: input.diffRows,
            noContentText:
              input.diffRows.length > 0 && input.diffRows.every((row) => row.kind === 'same') ? t(SYNC_TEXT.commit.noContent) : null,
            regionLabel: t(SYNC_TEXT.commit.diffFor, { name: input.selectedChange.name }),
          }
        : null,
      diffEmpty: t(SYNC_TEXT.commit.selectToCompare),
    },
    history: {
      loadingText: history.loading ? t(SYNC_TEXT.history.loadingCloud) : null,
      errorText: history.error ? t(SYNC_TEXT.history.cloudError, { error: history.error }) : null,
      emptyText: !history.commits.length && !history.loading ? t(SYNC_TEXT.history.noCommits) : null,
      commits: historyCommits,
      onSelectCommit: actions.onSelectHistoryCommit,
      selectedCommit: history.selectedCommit ? { id: history.selectedCommit.id, busy: history.detailLoading } : null,
      changedItemsHeading: t(SYNC_TEXT.history.changedItems),
      changes: historyChanges,
      changesEmpty: historyEmpty,
      diffHeader: history.selectedChange ? diffHeader(history.selectedChange, history.diffRows) : null,
      leftHeading: t(SYNC_TEXT.history.beforeCommit),
      rightHeading: t(SYNC_TEXT.history.thisCommit),
      diffRegionLabel: t(SYNC_TEXT.history.diffLabel),
      diffScrollLabel: history.selectedChange ? t(SYNC_TEXT.history.diffLabelFor, { name: history.selectedChange.name }) : '',
      diffRows: history.diffRows,
      diffEmpty: historyDiffEmpty,
      revert: {
        label: t(SYNC_TEXT.history.revert),
        disabled:
          input.readOnly ||
          !input.cloudConnected ||
          history.selectedCommit?.source !== 'cloud' ||
          !canRevertTo(history.selectedCommit?.id ?? '', input.cloudHeadId ?? null),
        onRevert: () => actions.onRevertHistoryCommit(history.selectedCommit?.id ?? ''),
      },
    },
  }
}
