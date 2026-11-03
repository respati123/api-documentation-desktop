import { z } from 'zod'

// One branch of one collection. A collection has a branch named main, and its own branches made from it.
export const collectionBranchSchema = z.object({
  id: z.string(),
  collectionKey: z.string(),
  name: z.string(),
  headCommitId: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.string(),
})
export type CollectionBranch = z.infer<typeof collectionBranchSchema>

export const branchListResponseSchema = z.object({ branches: z.array(collectionBranchSchema) })
export const branchCreateResponseSchema = z.object({ branch: collectionBranchSchema })

// The collection at a branch head. The tree holds only that collection's top-level node.
export const branchPullResponseSchema = z.object({
  branch: z.object({ id: z.string(), collectionKey: z.string(), name: z.string() }),
  headCommitId: z.string().nullable(),
  tree: z.array(z.unknown()),
})
export type BranchPullRecord = z.infer<typeof branchPullResponseSchema>

export const branchPushResponseSchema = z.object({ headCommitId: z.string().nullable() })
