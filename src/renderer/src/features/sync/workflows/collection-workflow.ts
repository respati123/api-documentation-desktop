import { collectionKeys, collectionOf, normalizeSharedTree, replaceCollection } from '@/features/collection'
import { applyBranchHeads, type BranchCommit, type CollectionHead, planBranchCommits } from '@/features/sync/lib/branch-sync'
import type { CollectionBranch } from '@/features/sync/models/collection-branch.model'
import { ApiError } from '@/lib/api'
import type { ApiNode } from '@/shared/models/api-node.model'

const mainName = 'main'

// The branch each collection syncs with. A collection with no entry in heads uses its main branch.
export function headsFromBranches(branches: CollectionBranch[], heads: Record<string, CollectionHead>): Record<string, CollectionHead> {
  const next = { ...heads }
  for (const branch of branches) {
    if (branch.name === mainName && !next[branch.collectionKey]) {
      next[branch.collectionKey] = { branchId: branch.id, headCommitId: branch.headCommitId }
    }
  }
  return next
}

export type CollectionPullDeps = {
  tree: ApiNode[]
  baseTree: ApiNode[]
  heads: Record<string, CollectionHead>
  listBranches: () => Promise<CollectionBranch[]>
  pullBranch: (branchId: string) => Promise<{ headCommitId: string | null; tree: ApiNode[] }>
}

export type CollectionPullOutcome = {
  tree: ApiNode[]
  heads: Record<string, CollectionHead>
  pulled: string[]
  // A collection with local edits or unpushed commits is not overwritten. It needs a merge, which is a later step.
  blocked: string[]
  upToDate: boolean
}

// Brings each collection's branch head into the tree. A collection with local edits is kept and reported as blocked.
export async function pullCollections(deps: CollectionPullDeps): Promise<CollectionPullOutcome> {
  const branches = await deps.listBranches()
  const heads = headsFromBranches(branches, deps.heads)
  let tree = deps.tree
  const pulled: string[] = []
  const blocked: string[] = []
  const nextHeads = { ...heads }
  const keys = [...new Set([...collectionKeys(deps.tree), ...Object.keys(heads)])]

  for (const key of keys) {
    const head = heads[key]
    if (!head) continue
    const edited = JSON.stringify(collectionOf(deps.tree, key)) !== JSON.stringify(collectionOf(deps.baseTree, key))
    if (edited) {
      blocked.push(key)
      continue
    }
    const remote = await deps.pullBranch(head.branchId)
    if (remote.headCommitId === head.headCommitId) continue
    tree = applyBranchHeads(tree, [{ collectionKey: key, tree: normalizeSharedTree(remote.tree) }])
    nextHeads[key] = { ...head, headCommitId: remote.headCommitId }
    pulled.push(key)
  }

  return { tree, heads: nextHeads, pulled, blocked, upToDate: pulled.length === 0 && blocked.length === 0 }
}

export type CollectionPushDeps = {
  pending: Array<{ id: string; message: string; tree: ApiNode[] }>
  baseTree: ApiNode[]
  heads: Record<string, CollectionHead>
  newId: () => string
  pushBranch: (branchId: string, commits: BranchCommit[]) => Promise<string | null>
}

export type CollectionPushOutcome =
  | { kind: 'nothing' }
  | { kind: 'refused'; missing: string[] }
  | { kind: 'pushed'; heads: Record<string, CollectionHead>; pushedKeys: string[] }
  | { kind: 'conflict'; heads: Record<string, CollectionHead>; pushedKeys: string[]; conflictKeys: string[] }

// Sends the planned commits to their branches, one request per branch. A collection with no branch refuses the whole push,
// because a half-sent push would leave the local tree and the cloud out of step.
export async function pushCollections(deps: CollectionPushDeps): Promise<CollectionPushOutcome> {
  if (deps.pending.length === 0) return { kind: 'nothing' }
  const plan = planBranchCommits({ commits: deps.pending, baseTree: deps.baseTree, heads: deps.heads, newId: deps.newId })
  if (plan.missing.length > 0) return { kind: 'refused', missing: plan.missing }
  if (plan.commits.length === 0) return { kind: 'nothing' }

  const byBranch = new Map<string, BranchCommit[]>()
  for (const commit of plan.commits) byBranch.set(commit.branchId, [...(byBranch.get(commit.branchId) ?? []), commit])

  const heads = { ...deps.heads }
  const pushedKeys: string[] = []
  const conflictKeys: string[] = []
  for (const [branchId, commits] of byBranch) {
    const key = commits[0].collectionKey
    try {
      const headCommitId = await deps.pushBranch(branchId, commits)
      heads[key] = { branchId, headCommitId }
      pushedKeys.push(key)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        conflictKeys.push(key)
        continue
      }
      throw error
    }
  }

  if (conflictKeys.length > 0) return { kind: 'conflict', heads, pushedKeys, conflictKeys }
  return { kind: 'pushed', heads, pushedKeys }
}

// The tree a push leaves on the cloud for each collection, used as the new base after a successful push.
export function baseAfterPush(tree: ApiNode[], pushedKeys: string[], baseTree: ApiNode[]): ApiNode[] {
  return pushedKeys.reduce((current, key) => replaceCollection(current, key, collectionOf(tree, key)), baseTree)
}
