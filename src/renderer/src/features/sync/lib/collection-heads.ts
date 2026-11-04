import type { CollectionHead } from '@/features/sync/lib/branch-sync'
import type { CollectionBranch } from '@/features/sync/models/collection-branch.model'

const mainName = 'main'

// The branch each collection syncs with. A collection with no stored head uses its main branch.
export function headsFromBranches(branches: CollectionBranch[], heads: Record<string, CollectionHead>): Record<string, CollectionHead> {
  const next = { ...heads }
  for (const branch of branches) {
    if (branch.name === mainName && !next[branch.collectionKey]) {
      next[branch.collectionKey] = { branchId: branch.id, headCommitId: branch.headCommitId }
    }
  }
  return next
}

// A copy synced through the workspace head has no collection heads yet.
export function isCollectionSynced(workspace: LocalWorkspace): boolean {
  return workspace.collectionHeads != null
}

// The heads a copy syncs with: the stored ones, plus the main branch of any collection that has none yet.
export function collectionHeadsOf(workspace: LocalWorkspace, branches: CollectionBranch[]): Record<string, CollectionHead> {
  return headsFromBranches(branches, workspace.collectionHeads ?? {})
}

// A copy can move to collection sync only when nothing is unpushed and its base is the cloud head.
// Otherwise a legacy commit could end up beside branch commits, so the copy waits for a manual pull first.
export function canMigrateToCollections(workspace: LocalWorkspace, cloudHeadCommitId: string | null): boolean {
  if (isCollectionSynced(workspace)) return false
  if (!cloudHeadCommitId || workspace.baseCommitId !== cloudHeadCommitId) return false
  return workspace.localHeadId === workspace.baseCommitId
}

// The copy with its heads set from the main branches. Its base stays as it was.
export function migrateToCollectionHeads(workspace: LocalWorkspace, branches: CollectionBranch[]): LocalWorkspace {
  return { ...workspace, collectionHeads: headsFromBranches(branches, {}) }
}
