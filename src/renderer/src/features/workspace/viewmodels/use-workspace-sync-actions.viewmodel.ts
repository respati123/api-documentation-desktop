import type { Dispatch, FormEvent, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import {
  type Applied,
  type CloudWorkspaceRecord,
  cloudWorkspaceService,
  type PendingMergeState,
  pullWorkspaceChanges,
  pushWorkspaceCommits,
  resolvePendingMerge,
  SYNC_TEXT,
  syncService,
} from '@/features/sync'
import { workspaceStorageService } from '@/features/workspace/services/workspace-storage.service'
import type { CloudWorkspace } from '@/lib/api'
import { buildStagedSnapshot, type WorkspaceChange } from '@/lib/workspace-changes'
import {
  preserveLocalSecretValues,
  shareableWorkspaceVariables,
  type WorkspaceVariables,
  workspaceVariablesChangeId,
} from '@/lib/workspace-variables'
import type { ApiNode } from '@/shared/models/api-node.model'

export type SyncActionsInput = {
  setSyncStatus: Dispatch<SetStateAction<string>>
  activeWorkspace: LocalWorkspace | undefined
  committedTree: ApiNode[]
  committedVariables: WorkspaceVariables
  workspaceVariables: WorkspaceVariables
  tree: ApiNode[]
  sessionToken: string | null
  stagedSnapshot: ApiNode[] | null
  stagedVariables: WorkspaceVariables | null
  stagedChanges: WorkspaceChange[]
  commitMessage: string
  activeEnvironmentId: string | null
  pendingMerge: PendingMergeState | null
  mergeChoices: Record<string, 'local' | 'remote'>
  setStagedSnapshot: Dispatch<SetStateAction<ApiNode[] | null>>
  setStagedVariables: Dispatch<SetStateAction<WorkspaceVariables | null>>
  setLocalWorkspaces: Dispatch<SetStateAction<LocalWorkspace[]>>
  setLocalCommits: Dispatch<SetStateAction<LocalCommit[]>>
  setCloudWorkspaces: Dispatch<SetStateAction<CloudWorkspace[]>>
  setCommitDialogOpen: Dispatch<SetStateAction<boolean>>
  setCommitMessage: Dispatch<SetStateAction<string>>
  setSyncMenuOpen: Dispatch<SetStateAction<boolean>>
  setDiscardConfirmOpen: Dispatch<SetStateAction<boolean>>
  setWorkspaceVariables: Dispatch<SetStateAction<WorkspaceVariables>>
  setTree: Dispatch<SetStateAction<ApiNode[]>>
  setActiveEnvironmentId: Dispatch<SetStateAction<string | null>>
  setSelectedRequestId: Dispatch<SetStateAction<string>>
  setPendingMerge: Dispatch<SetStateAction<PendingMergeState | null>>
  setMergeChoices: Dispatch<SetStateAction<Record<string, 'local' | 'remote'>>>
  persistActiveWorkspace: (patch: Partial<LocalWorkspace>) => void
}

// Staging, committing, discarding, pulling, pushing, and merge resolution. Each action decides its outcome in a workflow, then applies it here.
export function useWorkspaceSyncActionsViewModel(input: SyncActionsInput) {
  const {
    setSyncStatus,
    activeWorkspace,
    committedTree,
    committedVariables,
    workspaceVariables,
    tree,
    sessionToken,
    stagedSnapshot,
    stagedVariables,
    stagedChanges,
    commitMessage,
    activeEnvironmentId,
    pendingMerge,
    mergeChoices,
    setStagedSnapshot,
    setStagedVariables,
    setLocalWorkspaces,
    setLocalCommits,
    setCloudWorkspaces,
    setCommitDialogOpen,
    setCommitMessage,
    setSyncMenuOpen,
    setDiscardConfirmOpen,
    setWorkspaceVariables,
    setTree,
    setActiveEnvironmentId,
    setSelectedRequestId,
    setPendingMerge,
    setMergeChoices,
    persistActiveWorkspace,
  } = input
  const { t: tSync } = useTranslation('sync')
  function stageChanges(changes: WorkspaceChange[], staged: boolean) {
    const base = stagedSnapshot ?? committedTree
    const source = staged ? tree : committedTree
    const treeIds = changes.filter((change) => change.id !== workspaceVariablesChangeId).map((change) => change.id)
    const next = buildStagedSnapshot(base, source, new Set(treeIds))
    const nextStage = JSON.stringify(next) === JSON.stringify(committedTree) ? null : next
    setStagedSnapshot(nextStage)
    if (changes.some((change) => change.id === workspaceVariablesChangeId)) {
      const nextVariables = staged ? shareableWorkspaceVariables(workspaceVariables) : null
      setStagedVariables(nextVariables && JSON.stringify(nextVariables) !== JSON.stringify(committedVariables) ? nextVariables : null)
    }
  }

  function stageChange(change: WorkspaceChange, staged: boolean) {
    stageChanges([change], staged)
  }

  async function saveCommit(event: FormEvent) {
    event.preventDefault()
    if (!activeWorkspace || !commitMessage.trim()) return
    const previousTree = committedTree
    if (!stagedChanges.length) {
      setCommitDialogOpen(false)
      setSyncStatus('Stage at least one change before committing.')
      return
    }
    const stagedTree = stagedSnapshot ?? (previousTree as ApiNode[])
    const stagedVariableSnapshot = stagedVariables ?? committedVariables
    if (
      JSON.stringify(previousTree) === JSON.stringify(stagedTree) &&
      JSON.stringify(committedVariables) === JSON.stringify(stagedVariableSnapshot)
    ) {
      setCommitDialogOpen(false)
      setSyncStatus('There are no staged changes to commit.')
      return
    }
    const commit: LocalCommit = {
      id: crypto.randomUUID(),
      parentIds: activeWorkspace.localHeadId ? [activeWorkspace.localHeadId] : [],
      message: commitMessage.trim(),
      tree: stagedTree,
      variables: shareableWorkspaceVariables(stagedVariableSnapshot),
      createdAt: new Date().toISOString(),
      pushed: false,
    }
    await workspaceStorageService.saveCommit(activeWorkspace.id, commit)
    setLocalCommits((current) => [...current.filter((item) => item.id !== commit.id), commit])
    persistActiveWorkspace({ localHeadId: commit.id })
    setStagedSnapshot(null)
    setStagedVariables(null)
    setCommitMessage('')
    setCommitDialogOpen(false)
    setSyncStatus('Commit saved locally.')
  }

  function discardLocalChanges() {
    if (!activeWorkspace) return
    setTree(committedTree)
    const restoredVariables = preserveLocalSecretValues(committedVariables, workspaceVariables)
    setWorkspaceVariables(restoredVariables)
    if (activeEnvironmentId && !restoredVariables.environments.some((environment) => environment.id === activeEnvironmentId)) {
      setActiveEnvironmentId(restoredVariables.environments[0]?.id ?? null)
    }
    setStagedSnapshot(null)
    setStagedVariables(null)
    setDiscardConfirmOpen(false)
    setSyncMenuOpen(false)
    setSyncStatus('Discarded uncommitted changes.')
  }

  // Brings cloud changes in. The workflow decides what happens; this applies the outcome to the workspace's state.
  async function pullWorkspace() {
    if (!sessionToken || !activeWorkspace?.cloudId) return
    setSyncStatus(tSync(SYNC_TEXT.pull.pulling))
    const outcome = await pullWorkspaceChanges({
      token: sessionToken,
      workspace: activeWorkspace,
      tree,
      variables: workspaceVariables,
      activeEnvironmentId,
      translate: (key) => tSync(SYNC_TEXT.pull[key]),
      pullCloud: (input) => syncService.pull(input),
      listCommits: (workspaceId) => workspaceStorageService.listCommits(workspaceId),
      saveWorkspace: (workspace) => workspaceStorageService.saveWorkspace(workspace),
      saveCommit: (workspaceId, commit) => workspaceStorageService.saveCommit(workspaceId, commit),
    })
    if (outcome.kind === 'applied') applyPulledState(outcome.applied)
    if (outcome.kind === 'conflicts') {
      setMergeChoices({})
      setPendingMerge(outcome.pending)
    }
    setSyncStatus(outcome.message)
  }

  // Writes what a pull or a merge decided into the workspace's state. The storage writes already happened in the workflow.
  function applyPulledState(applied: Applied) {
    setLocalWorkspaces((current) => current.map((item) => (item.id === applied.workspace.id ? applied.workspace : item)))
    setTree(applied.tree)
    setWorkspaceVariables(applied.variables)
    setActiveEnvironmentId(applied.activeEnvironmentId)
    setSelectedRequestId(applied.selectedRequestId)
  }

  // Sends local commits. The workflow decides what happens; this applies the outcome to the workspace's state.
  async function pushWorkspace() {
    if (!sessionToken || !activeWorkspace) return
    const outcome = await pushWorkspaceCommits({
      token: sessionToken,
      role: activeWorkspace.role,
      workspace: activeWorkspace,
      tree,
      variables: workspaceVariables,
      translate: (key) => tSync(SYNC_TEXT.push[key]),
      listCommits: (workspaceId) => workspaceStorageService.listCommits(workspaceId),
      saveWorkspace: (workspace) => workspaceStorageService.saveWorkspace(workspace),
      saveCommit: (workspaceId, commit) => workspaceStorageService.saveCommit(workspaceId, commit),
      createCloud: (input) => cloudWorkspaceService.create(input),
      push: (input) => syncService.push(input),
    })
    if (outcome.kind === 'refused' || outcome.kind === 'nothing') {
      setSyncStatus(outcome.message)
      return
    }
    if ('published' in outcome && outcome.published) {
      const { workspace, cloud, rebased } = outcome.published
      setLocalWorkspaces((current) => current.map((item) => (item.id === workspace.id ? workspace : item)))
      setCloudWorkspaces((current) => [...current.filter((item) => item.id !== cloud.id), cloudSummary(cloud)])
      const rebasedById = new Map(rebased.map((item) => [item.id, item]))
      setLocalCommits((current) => current.map((item) => rebasedById.get(item.id) ?? item))
    }
    if (outcome.kind === 'pushed') {
      const pushedById = new Map(outcome.pushed.map((item) => [item.id, item]))
      setLocalCommits((current) => current.map((item) => pushedById.get(item.id) ?? item))
      setLocalWorkspaces((current) => current.map((item) => (item.id === outcome.workspace.id ? outcome.workspace : item)))
      setCloudWorkspaces((current) =>
        current.map((item) =>
          item.id === outcome.workspace.cloudId ? { ...item, headCommitId: outcome.workspace.baseCommitId ?? item.headCommitId } : item,
        ),
      )
      setSyncStatus(outcome.message)
      return
    }
    if (outcome.kind === 'conflict') {
      if (outcome.workspaceAlreadyOnCloud) {
        setSyncStatus(outcome.message)
        await pullWorkspace()
      } else setSyncStatus(outcome.message)
      return
    }
    setSyncStatus(outcome.message)
  }

  // A cloud workspace list entry needs only the fields the sidebar reads.
  function cloudSummary(cloud: CloudWorkspaceRecord): CloudWorkspace {
    return { id: cloud.id, name: cloud.name, role: cloud.role, headCommitId: cloud.headCommitId }
  }

  async function applyMergeResolution() {
    if (!pendingMerge || !activeWorkspace) return
    const outcome = await resolvePendingMerge({
      pending: pendingMerge,
      choices: mergeChoices,
      workspace: activeWorkspace,
      activeEnvironmentId,
      translate: (key) => tSync(SYNC_TEXT.pull[key]),
      saveWorkspace: (workspace) => workspaceStorageService.saveWorkspace(workspace),
      saveCommit: (workspaceId, commit) => workspaceStorageService.saveCommit(workspaceId, commit),
    })
    if (outcome.kind === 'incomplete') return
    applyPulledState(outcome.applied)
    setPendingMerge(null)
    setSyncStatus(outcome.message)
  }

  return { stageChanges, stageChange, saveCommit, discardLocalChanges, pullWorkspace, pushWorkspace, applyMergeResolution }
}
