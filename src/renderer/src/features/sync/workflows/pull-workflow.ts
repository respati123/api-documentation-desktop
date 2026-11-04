import { firstRequestId, normalizeSharedTree, normalizeSharedVariables, normalizeTree } from '@/features/collection'
import { mergeTreeSnapshots, type SyncConflict, stripLocalFilePaths } from '@/lib/merge'
import {
  mergeWorkspaceVariables,
  preserveLocalSecretValues,
  shareableWorkspaceVariables,
  type WorkspaceVariables,
  workspaceVariablesChangeId,
} from '@/lib/workspace-variables'
import type { ApiNode } from '@/shared/models/api-node.model'

export type PendingMergeState = {
  remoteHeadId: string
  remoteTree: ApiNode[]
  localTree: ApiNode[]
  baseTree: ApiNode[]
  localHeadId: string
  conflicts: SyncConflict[]
  remoteVariables: WorkspaceVariables
  localVariables: WorkspaceVariables
  baseVariables: WorkspaceVariables
  variableConflict: boolean
}

export type Choices = Record<string, 'local' | 'remote'>

export type PullKey = 'upToDate' | 'blocked' | 'conflicts' | 'failed' | 'pulled' | 'merged' | 'resolved'

// What the pull workflow needs from its caller. Storage and network are injected, so the decisions are testable.
export type PullDeps = {
  token: string
  workspace: LocalWorkspace
  tree: ApiNode[]
  variables: WorkspaceVariables
  activeEnvironmentId: string | null
  translate: (key: PullKey) => string
  pullCloud: (input: { token: string; cloudId: string }) => Promise<{ headCommitId: string; tree: unknown[]; variables: unknown }>
  listCommits: (workspaceId: string) => Promise<LocalCommit[]>
  saveWorkspace: (workspace: LocalWorkspace) => Promise<void>
  saveCommit: (workspaceId: string, commit: LocalCommit) => Promise<void>
}

export type Applied = {
  workspace: LocalWorkspace
  tree: ApiNode[]
  variables: WorkspaceVariables
  activeEnvironmentId: string | null
  selectedRequestId: string
  mergeCommit: LocalCommit | null
}

export type PullOutcome =
  | { kind: 'upToDate'; message: string }
  | { kind: 'blocked'; message: string }
  | { kind: 'applied'; message: string; applied: Applied }
  | { kind: 'conflicts'; message: string; pending: PendingMergeState }
  | { kind: 'failed'; message: string }

const sameJson = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right)

// Brings the cloud version into the workspace: a fast-forward when nothing local is unpublished, a merge commit when it is, or a conflict list when a merge cannot decide alone.
export async function pullWorkspaceChanges(deps: PullDeps): Promise<PullOutcome> {
  const { workspace } = deps
  if (!workspace.cloudId) return { kind: 'failed', message: deps.translate('failed') }
  try {
    const remote = await deps.pullCloud({ token: deps.token, cloudId: workspace.cloudId })
    const remoteTree = normalizeSharedTree(remote.tree)
    const remoteVariables = normalizeSharedVariables(remote.variables)
    if (remote.headCommitId === workspace.baseCommitId) return { kind: 'upToDate', message: deps.translate('upToDate') }

    const commits = await deps.listCommits(workspace.id)
    const localCommit = commits.find((item) => item.id === workspace.localHeadId)
    const expectedTree = localCommit?.tree ?? workspace.baseTree
    const expectedVariables = normalizeSharedVariables(localCommit?.variables ?? workspace.baseVariables)
    if (
      !sameJson(stripLocalFilePaths(expectedTree), stripLocalFilePaths(deps.tree)) ||
      !sameJson(expectedVariables, shareableWorkspaceVariables(deps.variables))
    ) {
      return { kind: 'blocked', message: deps.translate('blocked') }
    }

    if (workspace.localHeadId === workspace.baseCommitId) {
      const nextVariables = preserveLocalSecretValues(remoteVariables, deps.variables)
      const nextEnvironmentId =
        deps.activeEnvironmentId && remoteVariables.environments.some((environment) => environment.id === deps.activeEnvironmentId)
          ? deps.activeEnvironmentId
          : (remoteVariables.environments[0]?.id ?? null)
      const updated: LocalWorkspace = {
        ...workspace,
        tree: remoteTree,
        baseTree: remoteTree,
        variables: nextVariables,
        baseVariables: remoteVariables,
        activeEnvironmentId: nextEnvironmentId,
        baseCommitId: remote.headCommitId,
        localHeadId: remote.headCommitId,
      }
      await deps.saveWorkspace(updated)
      return {
        kind: 'applied',
        message: deps.translate('pulled'),
        applied: {
          workspace: updated,
          tree: remoteTree,
          variables: nextVariables,
          activeEnvironmentId: nextEnvironmentId,
          selectedRequestId: firstRequestId(remoteTree),
          mergeCommit: null,
        },
      }
    }

    const baseVariables = normalizeSharedVariables(workspace.baseVariables)
    const merged = mergeTreeSnapshots(normalizeTree(workspace.baseTree), deps.tree, remoteTree, {})
    const variableMerge = mergeWorkspaceVariables(baseVariables, deps.variables, remoteVariables)
    if (merged.unresolved.length || variableMerge.conflict) {
      return {
        kind: 'conflicts',
        message: deps.translate('conflicts'),
        pending: {
          remoteHeadId: remote.headCommitId,
          remoteTree,
          localTree: deps.tree,
          baseTree: normalizeTree(workspace.baseTree),
          localHeadId: workspace.localHeadId ?? workspace.baseCommitId ?? '',
          conflicts: merged.conflicts,
          remoteVariables,
          localVariables: deps.variables,
          baseVariables,
          variableConflict: variableMerge.conflict,
        },
      }
    }

    const mergeCommit: LocalCommit = {
      id: crypto.randomUUID(),
      parentIds: [workspace.localHeadId ?? workspace.baseCommitId ?? '', remote.headCommitId].filter(Boolean),
      message: 'Merge remote changes',
      tree: merged.tree,
      variables: shareableWorkspaceVariables(variableMerge.variables),
      createdAt: new Date().toISOString(),
      pushed: false,
    }
    await deps.saveCommit(workspace.id, mergeCommit)
    const nextEnvironmentId =
      deps.activeEnvironmentId && variableMerge.variables.environments.some((environment) => environment.id === deps.activeEnvironmentId)
        ? deps.activeEnvironmentId
        : (variableMerge.variables.environments[0]?.id ?? null)
    const updated: LocalWorkspace = {
      ...workspace,
      tree: merged.tree,
      baseTree: remoteTree,
      variables: variableMerge.variables,
      baseVariables: remoteVariables,
      activeEnvironmentId: nextEnvironmentId,
      baseCommitId: remote.headCommitId,
      localHeadId: mergeCommit.id,
    }
    await deps.saveWorkspace(updated)
    return {
      kind: 'applied',
      message: deps.translate('merged'),
      applied: {
        workspace: updated,
        tree: merged.tree,
        variables: variableMerge.variables,
        activeEnvironmentId: nextEnvironmentId,
        selectedRequestId: firstRequestId(merged.tree),
        mergeCommit,
      },
    }
  } catch (error) {
    return { kind: 'failed', message: error instanceof Error ? error.message : deps.translate('failed') }
  }
}

export type ResolveDeps = Omit<PullDeps, 'pullCloud' | 'listCommits' | 'token' | 'tree' | 'variables'> & {
  pending: PendingMergeState
  choices: Choices
  workspace: LocalWorkspace
}

export type ResolveOutcome = { kind: 'incomplete' } | { kind: 'resolved'; message: string; applied: Applied }

// Applies the user's choices to a pending merge. Nothing happens until every conflict has a choice.
export async function resolvePendingMerge(deps: ResolveDeps): Promise<ResolveOutcome> {
  const { pending, choices } = deps
  const merged = mergeTreeSnapshots(pending.baseTree, pending.localTree, pending.remoteTree, choices)
  const variableMerge = mergeWorkspaceVariables(
    pending.baseVariables,
    pending.localVariables,
    pending.remoteVariables,
    choices[workspaceVariablesChangeId],
  )
  if (merged.unresolved.length || (variableMerge.conflict && !choices[workspaceVariablesChangeId])) return { kind: 'incomplete' }

  const commit: LocalCommit = {
    id: crypto.randomUUID(),
    parentIds: [pending.localHeadId, pending.remoteHeadId].filter(Boolean),
    message: 'Merge remote changes',
    tree: merged.tree,
    variables: shareableWorkspaceVariables(variableMerge.variables),
    createdAt: new Date().toISOString(),
    pushed: false,
  }
  await deps.saveCommit(deps.workspace.id, commit)
  const nextEnvironmentId =
    deps.activeEnvironmentId && variableMerge.variables.environments.some((environment) => environment.id === deps.activeEnvironmentId)
      ? deps.activeEnvironmentId
      : (variableMerge.variables.environments[0]?.id ?? null)
  const updated: LocalWorkspace = {
    ...deps.workspace,
    tree: merged.tree,
    baseTree: pending.remoteTree,
    variables: variableMerge.variables,
    baseVariables: pending.remoteVariables,
    activeEnvironmentId: nextEnvironmentId,
    baseCommitId: pending.remoteHeadId,
    localHeadId: commit.id,
  }
  await deps.saveWorkspace(updated)
  return {
    kind: 'resolved',
    message: deps.translate('resolved'),
    applied: {
      workspace: updated,
      tree: merged.tree,
      variables: variableMerge.variables,
      activeEnvironmentId: nextEnvironmentId,
      selectedRequestId: firstRequestId(merged.tree),
      mergeCommit: commit,
    },
  }
}
