import { findNode, type indexTree, nodeDiffText } from '@/features/collection'
import type { CloudWorkspace } from '@/features/sync'
import { diffText } from '@/lib/text-diff'
import { getWorkspaceChanges } from '@/lib/workspace-changes'
import {
  normalizeWorkspaceVariables,
  type WorkspaceVariables,
  workspaceVariablesChangeId,
  workspaceVariablesDiffText,
} from '@/lib/workspace-variables'
import type { ApiNode } from '@/shared/models/api-node.model'

export type ChangesInput = {
  tree: ApiNode[]
  workspaceVariables: WorkspaceVariables
  localCommits: LocalCommit[]
  activeWorkspace: LocalWorkspace | undefined
  cloudWorkspaces: CloudWorkspace[]
  stagedSnapshot: ApiNode[] | null
  stagedVariables: WorkspaceVariables | null
  commitDialogOpen: boolean
  commitDialogView: string
  selectedChangeId: string
  treeIndex: ReturnType<typeof indexTree>
}

// The working tree compared with the last commit, and the staged and unstaged parts of that difference.
export function useWorkspaceChangesViewModel(input: ChangesInput) {
  const {
    tree,
    workspaceVariables,
    localCommits,
    activeWorkspace,
    cloudWorkspaces,
    stagedSnapshot,
    stagedVariables,
    commitDialogOpen,
    commitDialogView,
    selectedChangeId,
    treeIndex,
  } = input
  const lastLocalCommit = localCommits.find((commit) => commit.id === activeWorkspace?.localHeadId)
  const committedTree = lastLocalCommit?.tree ?? activeWorkspace?.baseTree ?? tree
  const committedVariablesSource = lastLocalCommit?.variables ?? activeWorkspace?.baseVariables ?? activeWorkspace?.variables
  const committedVariables = normalizeWorkspaceVariables(committedVariablesSource)
  const stageBaseTree = stagedSnapshot ?? committedTree
  const stageBaseVariables = stagedVariables ?? committedVariables
  // Versioning (changes, commits, push) exists only for cloud workspaces. A local folder has no change tracking.
  const versioned = Boolean(activeWorkspace?.cloudId)
  const workspaceChanges = versioned ? getWorkspaceChanges(committedTree, tree, committedVariables, workspaceVariables) : []
  const pendingPushCount = versioned ? localCommits.filter((commit) => !commit.pushed).length : 0
  const cloudHeadCommitId = cloudWorkspaces.find((workspace) => workspace.id === activeWorkspace?.cloudId)?.headCommitId
  const showChanges = versioned && commitDialogOpen && commitDialogView === 'changes'
  const hasStagedContent = Boolean(stagedSnapshot || stagedVariables)
  const stagedChanges =
    showChanges && hasStagedContent ? getWorkspaceChanges(committedTree, stageBaseTree, committedVariables, stageBaseVariables) : []
  const unstagedChanges = (() => {
    if (!showChanges) return []
    if (!hasStagedContent) return workspaceChanges
    return getWorkspaceChanges(stageBaseTree, tree, stageBaseVariables, workspaceVariables)
  })()
  const changeById = new Map(workspaceChanges.map((change) => [change.id, change]))
  const selectedChange = showChanges ? workspaceChanges.find((change) => change.id === selectedChangeId) : undefined
  const diffRows = selectedChange
    ? diffText(
        selectedChange.id === workspaceVariablesChangeId
          ? workspaceVariablesDiffText(committedVariables)
          : nodeDiffText(findNode(committedTree, selectedChange.id)),
        selectedChange.id === workspaceVariablesChangeId
          ? workspaceVariablesDiffText(workspaceVariables)
          : nodeDiffText(treeIndex.nodeById.get(selectedChange.id)),
      )
    : []

  return {
    lastLocalCommit,
    committedTree,
    committedVariablesSource,
    committedVariables,
    stageBaseTree,
    stageBaseVariables,
    workspaceChanges,
    pendingPushCount,
    cloudHeadCommitId,
    showChanges,
    hasStagedContent,
    stagedChanges,
    unstagedChanges,
    changeById,
    selectedChange,
    diffRows,
  }
}
