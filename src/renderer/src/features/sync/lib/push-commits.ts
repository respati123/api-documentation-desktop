import type { WorkspaceVariables } from '@/lib/workspace-variables'
import type { ApiNode } from '@/shared/models/api-node.model'

// The commit as the cloud receives it: no local file paths, and only the variables that may be shared.
export function sharedCommitOf(
  commit: LocalCommit,
  shareVariables: (value: unknown) => WorkspaceVariables,
  strip: (tree: ApiNode[]) => ApiNode[],
): LocalCommit {
  return {
    ...commit,
    tree: strip(commit.tree),
    variables: shareVariables(commit.variables),
  }
}

// Once the workspace is published, its unpushed commits sit on top of the cloud head. A parent that is itself unpushed is kept.
export function rebaseOntoCloudHead(pending: LocalCommit[], cloudHeadId: string): LocalCommit[] {
  const pendingIds = new Set(pending.map((commit) => commit.id))
  return pending.map((commit) => {
    const localParents = commit.parentIds.filter((parentId) => pendingIds.has(parentId))
    return { ...commit, parentIds: localParents.length ? localParents : [cloudHeadId] }
  })
}
