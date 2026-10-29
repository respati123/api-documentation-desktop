import { useMemo } from 'react'
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
import type { ApiNode } from '@/shared/models/api-node.model'

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
  const historyCommits = useMemo<WorkspaceHistoryCommit[]>(() => {
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
  }, [cloudCommits, localCommits])
  const historyCommitById = useMemo(() => new Map(historyCommits.map((commit) => [commit.id, commit])), [historyCommits])
  const localCommitIds = useMemo(() => new Set(localCommits.map((commit) => commit.id)), [localCommits])
  const selectedHistoryCommit = historyCommitById.get(selectedHistoryCommitId)
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
  const historyAfterTree = useMemo(() => normalizeTree(selectedHistoryTreeValue), [selectedHistoryTreeValue])
  const historyBeforeTree = useMemo(() => {
    if (Array.isArray(historyParentTreeValue)) return normalizeTree(historyParentTreeValue)
    return selectedHistoryCommit && (selectedHistoryCommit.source === 'local' || selectedHistoryCommit.parentIds.length > 0)
      ? ((activeWorkspace?.baseTree as ApiNode[]) ?? [])
      : []
  }, [historyParentTreeValue, selectedHistoryCommit, activeWorkspace?.baseTree])
  const historyBeforeVariables = useMemo(
    () =>
      historyParentCommit?.variables
        ? normalizeWorkspaceVariables(historyParentCommit.variables)
        : historyParentId && cloudCommitDetails.get(historyParentId)?.variables
          ? normalizeWorkspaceVariables(cloudCommitDetails.get(historyParentId)?.variables)
          : selectedHistoryCommit && (selectedHistoryCommit.source === 'local' || selectedHistoryCommit.parentIds.length > 0)
            ? normalizeWorkspaceVariables(activeWorkspace?.baseVariables ?? emptyWorkspaceVariables())
            : emptyWorkspaceVariables(),
    [historyParentCommit, historyParentId, cloudCommitDetails, selectedHistoryCommit, activeWorkspace?.baseVariables],
  )
  const historyAfterVariables = useMemo(
    () =>
      normalizeWorkspaceVariables(
        selectedHistoryCommit?.variables ??
          (selectedHistoryCommit ? cloudCommitDetails.get(selectedHistoryCommit.id)?.variables : undefined),
      ),
    [selectedHistoryCommit, cloudCommitDetails],
  )
  const historyChanges = useMemo(
    () =>
      selectedHistoryCommit && historySnapshotsReady
        ? getWorkspaceChanges(historyBeforeTree, historyAfterTree, historyBeforeVariables, historyAfterVariables)
        : [],
    [selectedHistoryCommit, historySnapshotsReady, historyBeforeTree, historyAfterTree, historyBeforeVariables, historyAfterVariables],
  )
  const selectedHistoryChange = historyChanges.find((change) => change.id === selectedHistoryChangeId)
  const historyDiffRows = useMemo(
    () =>
      selectedHistoryCommit && selectedHistoryChange
        ? diffText(
            selectedHistoryChange.id === workspaceVariablesChangeId
              ? workspaceVariablesDiffText(historyBeforeVariables)
              : nodeDiffText(findNode(historyBeforeTree, selectedHistoryChange.id)),
            selectedHistoryChange.id === workspaceVariablesChangeId
              ? workspaceVariablesDiffText(historyAfterVariables)
              : nodeDiffText(findNode(historyAfterTree, selectedHistoryChange.id)),
          )
        : [],
    [selectedHistoryCommit, selectedHistoryChange, historyBeforeTree, historyAfterTree, historyAfterVariables, historyBeforeVariables],
  )

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
