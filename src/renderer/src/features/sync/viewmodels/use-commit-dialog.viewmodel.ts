import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { SYNC_TEXT } from '@/features/sync/constants/sync-text.constants'
import { changeStatusCode, changeStatusKey } from '@/features/sync/lib/change-status'
import type { CommitTab } from '@/features/sync/viewmodels/use-commit-dialog-state.viewmodel'
import type { TextDiffRow } from '@/lib/text-diff'
import type { WorkspaceChange } from '@/lib/workspace-changes'

// The fields of a commit that the dialog reads. Structural, so sync does not depend on the workspace's models.
export type CommitSummary = {
  id: string
  message: string
  createdAt: string
  pushed: boolean
  source: 'local' | 'cloud'
}

export type CommitDialogInput = {
  open: boolean
  view: CommitTab
  message: string
  readOnly: boolean
  cloudConnected: boolean
  changeCount: number
  staged: WorkspaceChange[]
  unstaged: WorkspaceChange[]
  selectedChangeId: string
  selectedChange: WorkspaceChange | undefined
  diffRows: TextDiffRow[]
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
    onSelectHistoryCommit: (commitId: string) => void
    onSelectHistoryChange: (changeId: string) => void
    onOpenHistory: () => void
    onOpenChanges: () => void
  }
}

// Turns the commit dialog's data into everything its two tabs show. Labels, empty states, and badges are decided here.
export function useCommitDialogViewModel(input: CommitDialogInput) {
  const { t } = useTranslation('sync')
  const { actions, history } = input

  function statusOf(change: WorkspaceChange) {
    return { code: changeStatusCode(change.status), status: change.status, text: t(changeStatusKey(change.status)) }
  }

  function diffHeader(change: WorkspaceChange) {
    return { ...statusOf(change), name: change.name }
  }

  const description =
    input.view === 'changes'
      ? t(SYNC_TEXT.commit.changesDescription)
      : input.cloudConnected
        ? t(SYNC_TEXT.commit.historyDescriptionCloud)
        : t(SYNC_TEXT.commit.historyDescriptionLocal)

  const stagedRows = input.staged.map((change) => ({
    key: `staged-${change.id}`,
    change,
    name: change.name,
    code: changeStatusCode(change.status),
    status: change.status,
    selected: input.selectedChangeId === change.id,
    actionLabel: t(SYNC_TEXT.commit.unstage),
  }))
  const unstagedRows = input.unstaged.map((change) => ({
    key: `unstaged-${change.id}`,
    change,
    name: change.name,
    code: changeStatusCode(change.status),
    status: change.status,
    selected: input.selectedChangeId === change.id,
    actionLabel: t(SYNC_TEXT.commit.stage),
  }))

  const historyCommits = history.commits.map((commit) => {
    const state =
      commit.source === 'cloud'
        ? history.localCommitIds.has(commit.id)
          ? t(SYNC_TEXT.commit.pushed)
          : t(SYNC_TEXT.commit.cloud)
        : commit.pushed
          ? t(SYNC_TEXT.commit.pushed)
          : t(SYNC_TEXT.commit.local)
    return {
      id: commit.id,
      message: commit.message,
      date: new Date(commit.createdAt).toLocaleString(),
      state,
      stateClass: state.toLowerCase(),
      selected: history.selectedCommit?.id === commit.id,
    }
  })

  const historyChanges = history.changes.map((change) => ({
    key: change.id,
    change,
    name: change.name,
    code: changeStatusCode(change.status),
    status: change.status,
    text: t(changeStatusKey(change.status)),
    selected: history.selectedChangeId === change.id,
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
    onOpenChange: actions.onOpenChange,
    openHistory: actions.onOpenHistory,
    openChanges: actions.onOpenChanges,
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
      onSelect: actions.onViewChange,
    },
    changes: {
      messageLabel: t(SYNC_TEXT.commit.message),
      messagePlaceholder: t(SYNC_TEXT.commit.messagePlaceholder),
      message: input.message,
      onMessageChange: actions.onMessageChange,
      onSubmit: actions.onSubmit,
      canSubmit: input.message.trim() !== '' && input.staged.length > 0,
      submitLabel: t(SYNC_TEXT.commit.submit),
      stagedHeading: t(SYNC_TEXT.commit.staged),
      stagedCount: input.staged.length,
      unstageAllLabel: t(SYNC_TEXT.commit.unstageAll),
      canUnstageAll: input.staged.length > 0,
      onUnstageAll: actions.onUnstageAll,
      stagedRows,
      stagedEmpty: t(SYNC_TEXT.commit.stageToCommit),
      unstagedHeading: t(SYNC_TEXT.commit.changes),
      unstagedCount: input.unstaged.length,
      stageAllLabel: t(SYNC_TEXT.commit.stageAll),
      canStageAll: input.unstaged.length > 0,
      onStageAll: () => actions.onStageAll(input.unstaged, true),
      unstagedRows,
      unstagedEmpty: t(SYNC_TEXT.commit.noUnstaged),
      onSelect: actions.onSelectChange,
      onStage: actions.onStage,
      diffLabel: t(SYNC_TEXT.commit.diffLabel),
      diff: input.selectedChange
        ? {
            header: diffHeader(input.selectedChange),
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
      commitsHeading: t(SYNC_TEXT.history.commits),
      commitCount: history.commits.length,
      loadingText: history.loading ? t(SYNC_TEXT.history.loadingCloud) : null,
      errorText: history.error ? t(SYNC_TEXT.history.cloudError, { error: history.error }) : null,
      emptyText: !history.commits.length && !history.loading ? t(SYNC_TEXT.history.noCommits) : null,
      commits: historyCommits,
      onSelectCommit: actions.onSelectHistoryCommit,
      selectedCommit: history.selectedCommit ? { id: history.selectedCommit.id, busy: history.detailLoading } : null,
      changedItemsHeading: t(SYNC_TEXT.history.changedItems),
      changedItemsCount: history.snapshotsReady ? history.changes.length : '…',
      changes: historyChanges,
      changesEmpty: historyEmpty,
      onSelectChange: actions.onSelectHistoryChange,
      selectedChange: history.selectedChange ? diffHeader(history.selectedChange) : null,
      parentHeading: t(SYNC_TEXT.history.parentVersion),
      parentMessage: history.selectedCommit?.message ?? '',
      diffRegionLabel: t(SYNC_TEXT.history.diffLabel),
      diffScrollLabel: history.selectedChange ? t(SYNC_TEXT.history.diffLabelFor, { name: history.selectedChange.name }) : '',
      diffRows: history.diffRows,
      diffEmpty: historyDiffEmpty,
    },
  }
}
