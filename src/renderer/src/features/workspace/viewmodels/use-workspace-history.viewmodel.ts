import { findNode, nodeDiffText, normalizeTree } from '@/features/collection'
import { useCloudCommitDetailsViewModel, useCloudHistoryViewModel } from '@/features/sync'
import type { WorkspaceHistoryCommit } from '@/features/workspace/models/workspace.model'
import { diffText } from '@/lib/text-diff'
import { getWorkspaceChanges } from '@/lib/workspace-changes'
import {
  emptyWorkspaceVariables,
  normalizeWorkspaceVariables,
  workspaceVariablesChangeId,
  workspaceVariablesDiffText,
} from '@/lib/workspace-variables'

export type HistoryInput = {
  sessionToken: string | null
  activeWorkspace: LocalWorkspace | undefined
  localCommits: LocalCommit[]
  commitDialogOpen: boolean
  commitDialogView: string
  selectedHistoryCommitId: string
  selectedHistoryChangeId: string
}

// The commit history: local and cloud commits merged, the selected commit's changes, and the diff of the selected change.
export function useCommitHistoryViewModel(input: HistoryInput) {
  const {
    sessionToken,
    activeWorkspace,
    localCommits,
    commitDialogOpen,
    commitDialogView,
    selectedHistoryCommitId,
    selectedHistoryChangeId,
  } = input
  const cloudHistoryOpen = commitDialogOpen && commitDialogView === 'history'
  const {
    commits: cloudCommits,
    loading: historyLoading,
    error: historyError,
  } = useCloudHistoryViewModel({ token: sessionToken, cloudId: activeWorkspace?.cloudId ?? null, enabled: cloudHistoryOpen })
  const historyCommits: WorkspaceHistoryCommit[] = (() => {
    const combined = new Map<string, WorkspaceHistoryCommit>()
    for (const commit of cloudCommits)
      combined.set(commit.id, {
        ...commit,
        pushed: true,
        source: 'cloud',
      })
    for (const commit of localCommits) {
      const cloudVersion = combined.get(commit.id)
      combined.set(commit.id, {
        ...commit,
        pushed: commit.pushed || Boolean(cloudVersion),
        source: cloudVersion ? 'cloud' : 'local',
      })
    }
    return [...combined.values()].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
  })()
  const historyCommitById = new Map(historyCommits.map((commit) => [commit.id, commit]))
  const localCommitIds = new Set(localCommits.map((commit) => commit.id))
  // The newest commit and its first item open at once, as in the Changes tab.
  const selectedHistoryCommit = historyCommitById.get(selectedHistoryCommitId) ?? (cloudHistoryOpen ? historyCommits[0] : undefined)
  const historyParentId = selectedHistoryCommit?.parentIds.find((id) => historyCommitById.has(id))
  const historyParentCommit = historyParentId ? historyCommitById.get(historyParentId) : undefined
  const historyDetailIds =
    cloudHistoryOpen && selectedHistoryCommit
      ? [selectedHistoryCommit.id, ...(historyParentId ? [historyParentId] : [])].filter(
          (id) => !Array.isArray(historyCommitById.get(id)?.tree),
        )
      : []
  const {
    detailsById: cloudCommitDetails,
    loading: historyDetailLoading,
    error: historyDetailError,
  } = useCloudCommitDetailsViewModel({ token: sessionToken, cloudId: activeWorkspace?.cloudId ?? null, commitIds: historyDetailIds })
  const selectedHistoryTreeValue =
    selectedHistoryCommit?.tree ?? (selectedHistoryCommit ? cloudCommitDetails.get(selectedHistoryCommit.id)?.tree : undefined)
  const historyParentTreeValue = historyParentCommit?.tree ?? (historyParentId ? cloudCommitDetails.get(historyParentId)?.tree : undefined)
  const historySnapshotsReady = Boolean(
    selectedHistoryCommit &&
      Array.isArray(selectedHistoryTreeValue) &&
      (!historyParentId || Array.isArray(historyParentTreeValue) || historyDetailError),
  )
  const historyAfterTree = normalizeTree(selectedHistoryTreeValue)
  const historyBeforeTree = (() => {
    if (Array.isArray(historyParentTreeValue)) return normalizeTree(historyParentTreeValue)
    return selectedHistoryCommit && (selectedHistoryCommit.source === 'local' || selectedHistoryCommit.parentIds.length > 0)
      ? (activeWorkspace?.baseTree ?? [])
      : []
  })()
  const historyBeforeVariables = historyParentCommit?.variables
    ? normalizeWorkspaceVariables(historyParentCommit.variables)
    : historyParentId && cloudCommitDetails.get(historyParentId)?.variables
      ? normalizeWorkspaceVariables(cloudCommitDetails.get(historyParentId)?.variables)
      : selectedHistoryCommit && (selectedHistoryCommit.source === 'local' || selectedHistoryCommit.parentIds.length > 0)
        ? normalizeWorkspaceVariables(activeWorkspace?.baseVariables ?? emptyWorkspaceVariables())
        : emptyWorkspaceVariables()
  const historyAfterVariables = normalizeWorkspaceVariables(
    selectedHistoryCommit?.variables ?? (selectedHistoryCommit ? cloudCommitDetails.get(selectedHistoryCommit.id)?.variables : undefined),
  )
  const historyChanges =
    selectedHistoryCommit && historySnapshotsReady
      ? getWorkspaceChanges(historyBeforeTree, historyAfterTree, historyBeforeVariables, historyAfterVariables)
      : []
  const selectedHistoryChange = historyChanges.find((change) => change.id === selectedHistoryChangeId) ?? historyChanges[0]
  const historyDiffRows =
    selectedHistoryCommit && selectedHistoryChange
      ? diffText(
          selectedHistoryChange.id === workspaceVariablesChangeId
            ? workspaceVariablesDiffText(historyBeforeVariables)
            : nodeDiffText(findNode(historyBeforeTree, selectedHistoryChange.id)),
          selectedHistoryChange.id === workspaceVariablesChangeId
            ? workspaceVariablesDiffText(historyAfterVariables)
            : nodeDiffText(findNode(historyAfterTree, selectedHistoryChange.id)),
        )
      : []

  return {
    cloudHistoryOpen,
    cloudCommits,
    historyLoading,
    historyError,
    historyCommits,
    historyCommitById,
    localCommitIds,
    selectedHistoryCommit,
    historyParentId,
    historyParentCommit,
    cloudCommitDetails,
    historyDetailLoading,
    historyDetailError,
    historyParentTreeValue,
    historySnapshotsReady,
    historyAfterTree,
    historyBeforeTree,
    historyBeforeVariables,
    historyAfterVariables,
    historyChanges,
    selectedHistoryChange,
    historyDiffRows,
  }
}
