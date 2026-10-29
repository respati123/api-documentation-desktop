import { useMemo } from 'react'
import { findNode, type indexTree, nodeDiffText } from '@/features/collection'
import type { CloudWorkspace } from '@/lib/api'
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
  const committedTree = (lastLocalCommit?.tree ?? activeWorkspace?.baseTree ?? tree) as ApiNode[]
  const committedVariablesSource = lastLocalCommit?.variables ?? activeWorkspace?.baseVariables ?? activeWorkspace?.variables
  const committedVariables = useMemo(() => normalizeWorkspaceVariables(committedVariablesSource), [committedVariablesSource])
  const stageBaseTree = stagedSnapshot ?? committedTree
  const stageBaseVariables = stagedVariables ?? committedVariables
  const workspaceChanges = useMemo(
    () => getWorkspaceChanges(committedTree, tree, committedVariables, workspaceVariables),
    [committedTree, tree, committedVariables, workspaceVariables],
  )
  const pendingPushCount = localCommits.filter((commit) => !commit.pushed).length
  const cloudHeadCommitId = cloudWorkspaces.find((workspace) => workspace.id === activeWorkspace?.cloudId)?.headCommitId
  const showChanges = commitDialogOpen && commitDialogView === 'changes'
  const hasStagedContent = Boolean(stagedSnapshot || stagedVariables)
  const stagedChanges = useMemo(
    () =>
      showChanges && hasStagedContent ? getWorkspaceChanges(committedTree, stageBaseTree, committedVariables, stageBaseVariables) : [],
    [showChanges, hasStagedContent, committedTree, stageBaseTree, committedVariables, stageBaseVariables],
  )
  const unstagedChanges = useMemo(() => {
    if (!showChanges) return []
    if (!hasStagedContent) return workspaceChanges
    return getWorkspaceChanges(stageBaseTree, tree, stageBaseVariables, workspaceVariables)
  }, [showChanges, hasStagedContent, workspaceChanges, stageBaseTree, tree, stageBaseVariables, workspaceVariables])
  const changeById = useMemo(() => new Map(workspaceChanges.map((change) => [change.id, change])), [workspaceChanges])
  const selectedChange = showChanges ? workspaceChanges.find((change) => change.id === selectedChangeId) : undefined
  const diffRows = useMemo(
    () =>
      selectedChange
        ? diffText(
            selectedChange.id === workspaceVariablesChangeId
              ? workspaceVariablesDiffText(committedVariables)
              : nodeDiffText(findNode(committedTree, selectedChange.id)),
            selectedChange.id === workspaceVariablesChangeId
              ? workspaceVariablesDiffText(workspaceVariables)
              : nodeDiffText(treeIndex.nodeById.get(selectedChange.id)),
          )
        : [],
    [selectedChange, committedTree, treeIndex, committedVariables, workspaceVariables],
  )

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
