import { collectionKeys, collectionOf, replaceCollection } from '@/features/collection'
import type { ApiNode } from '@/shared/models/api-node.model'

// The branch a collection is synced with, and the commit that is its head on the cloud.
export type CollectionHead = { branchId: string; headCommitId: string | null }

export type BranchCommit = {
  id: string
  branchId: string
  collectionKey: string
  parentIds: string[]
  message: string
  tree: ApiNode[]
}

export type LocalSnapshot = { id: string; message: string; tree: ApiNode[] }

// The collections whose content differs between two trees. A collection that was added or removed counts as changed.
export function changedCollections(before: ApiNode[], after: ApiNode[]): string[] {
  const keys = new Set([...collectionKeys(before), ...collectionKeys(after)])
  return [...keys].filter((key) => JSON.stringify(collectionOf(before, key)) !== JSON.stringify(collectionOf(after, key)))
}

// Turns local commits, each a whole-tree snapshot, into branch commits. Each changed collection gets one commit per local commit
// that changed it, chained on that collection's head. The returned heads are the heads after the planned commits.
// A changed collection without a branch is reported in missing, and nothing is planned for it.
export function planBranchCommits(input: {
  commits: LocalSnapshot[]
  baseTree: ApiNode[]
  heads: Record<string, CollectionHead>
  newId: () => string
}): { commits: BranchCommit[]; heads: Record<string, CollectionHead>; missing: string[] } {
  const heads = { ...input.heads }
  const commits: BranchCommit[] = []
  const missing = new Set<string>()
  let before = input.baseTree
  for (const local of input.commits) {
    for (const key of changedCollections(before, local.tree)) {
      const head = heads[key]
      if (!head) {
        missing.add(key)
        continue
      }
      const id = input.newId()
      commits.push({
        id,
        branchId: head.branchId,
        collectionKey: key,
        parentIds: head.headCommitId ? [head.headCommitId] : [],
        message: local.message,
        tree: collectionOf(local.tree, key),
      })
      heads[key] = { ...head, headCommitId: id }
    }
    before = local.tree
  }
  return { commits, heads, missing: [...missing] }
}

// Puts the content of each pulled collection into the tree. Collections not pulled keep their content.
export function applyBranchHeads(tree: ApiNode[], pulled: Array<{ collectionKey: string; tree: ApiNode[] }>): ApiNode[] {
  return pulled.reduce((current, item) => replaceCollection(current, item.collectionKey, item.tree), tree)
}
