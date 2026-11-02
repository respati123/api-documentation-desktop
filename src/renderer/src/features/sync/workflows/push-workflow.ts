import { normalizeSharedTree, normalizeSharedVariables, normalizeTree } from '@/features/collection'
import { rebaseOntoCloudHead, sharedCommitOf } from '@/features/sync/lib/push-commits'
import type { CloudWorkspaceRecord } from '@/features/sync/models/cloud-workspace.model'
import { ApiError } from '@/lib/api'
import { stripLocalFilePaths } from '@/lib/merge'
import { normalizeWorkspaceVariables, shareableWorkspaceVariables, type WorkspaceVariables } from '@/lib/workspace-variables'
import type { ApiNode } from '@/shared/models/api-node.model'

// Everything the push needs from its caller. Storage and network are passed in, so the flow can be tested as it is.
export type PushDeps = {
  token: string
  role: 'owner' | 'editor' | 'viewer' | null | undefined
  workspace: LocalWorkspace
  tree: ApiNode[]
  variables: WorkspaceVariables
  translate: (key: 'viewer' | 'nothing' | 'conflictOnCloud' | 'conflictPublished' | 'pushed' | 'failed') => string
  listCommits: (workspaceId: string) => Promise<LocalCommit[]>
  saveWorkspace: (workspace: LocalWorkspace) => Promise<void>
  saveCommit: (workspaceId: string, commit: LocalCommit) => Promise<void>
  createCloud: (input: { token: string; name: string; tree: ApiNode[]; variables: unknown }) => Promise<CloudWorkspaceRecord>
  push: (input: { token: string; cloudId: string; commits: LocalCommit[] }) => Promise<string>
}

export type PublishedInfo = { workspace: LocalWorkspace; cloud: CloudWorkspaceRecord; rebased: LocalCommit[] }

export type PushOutcome =
  | { kind: 'refused'; message: string }
  | { kind: 'nothing'; message: string }
  | { kind: 'pushed'; message: string; workspace: LocalWorkspace; pushed: LocalCommit[]; published: PublishedInfo | null }
  | { kind: 'conflict'; message: string; workspaceAlreadyOnCloud: boolean; published: PublishedInfo | null }
  | { kind: 'error'; message: string; published: PublishedInfo | null }

// Sends the workspace's unpushed commits. A workspace that is not on the cloud yet is published first.
export async function pushWorkspaceCommits(deps: PushDeps): Promise<PushOutcome> {
  if (deps.role === 'viewer') return { kind: 'refused', message: deps.translate('viewer') }
  const commits = await deps.listCommits(deps.workspace.id)
  let pending = commits.filter((commit) => !commit.pushed)
  if (!pending.length) return { kind: 'nothing', message: deps.translate('nothing') }

  const onCloud = Boolean(deps.workspace.cloudId)
  let published: PublishedInfo | null = null
  try {
    let cloudId = deps.workspace.cloudId
    let target = deps.workspace
    if (!cloudId) {
      const baseVariables = shareableWorkspaceVariables(
        normalizeWorkspaceVariables(deps.workspace.baseVariables ?? deps.workspace.variables),
      )
      const cloud = await deps.createCloud({
        token: deps.token,
        name: deps.workspace.name,
        tree: stripLocalFilePaths(deps.workspace.baseTree),
        variables: baseVariables,
      })
      cloudId = cloud.id
      const cloudBaseTree = normalizeSharedTree(cloud.tree ?? [])
      const cloudBaseVariables = normalizeSharedVariables(cloud.variables ?? baseVariables)
      target = {
        ...deps.workspace,
        cloudId,
        role: 'owner',
        tree: deps.tree,
        baseTree: cloudBaseTree,
        variables: deps.variables,
        baseVariables: cloudBaseVariables,
        baseCommitId: cloud.headCommitId,
      }
      await deps.saveWorkspace(target)
      pending = rebaseOntoCloudHead(pending, cloud.headCommitId)
      await Promise.all(pending.map((commit) => deps.saveCommit(deps.workspace.id, commit)))
      published = { workspace: target, cloud, rebased: pending }
    }

    const headCommitId = await deps.push({
      token: deps.token,
      cloudId,
      commits: pending.map((commit) =>
        sharedCommitOf(commit, (value) => shareableWorkspaceVariables(normalizeWorkspaceVariables(value)), stripLocalFilePaths),
      ),
    })
    const pushed = pending.map((commit) => ({ ...commit, pushed: true }))
    await Promise.all(pushed.map((commit) => deps.saveCommit(deps.workspace.id, commit)))

    const last = pending[pending.length - 1]
    const updated: LocalWorkspace = {
      ...target,
      cloudId,
      tree: deps.tree,
      baseTree: last ? normalizeTree(last.tree) : deps.tree,
      variables: deps.variables,
      baseVariables: normalizeSharedVariables(last?.variables ?? deps.workspace.baseVariables),
      baseCommitId: headCommitId,
      localHeadId: headCommitId,
    }
    await deps.saveWorkspace(updated)
    return { kind: 'pushed', message: deps.translate('pushed'), workspace: updated, pushed, published }
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      return {
        kind: 'conflict',
        message: deps.translate(onCloud ? 'conflictOnCloud' : 'conflictPublished'),
        workspaceAlreadyOnCloud: onCloud,
        published,
      }
    }
    return { kind: 'error', message: error instanceof Error ? error.message : deps.translate('failed'), published }
  }
}
