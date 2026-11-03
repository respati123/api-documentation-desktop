import { z } from 'zod'

// A cloud commit as the history list returns it.
export const cloudCommitSchema = z.object({
  id: z.string(),
  parentIds: z.array(z.string()),
  message: z.string(),
  createdAt: z.string(),
})
export type CloudCommitRecord = z.infer<typeof cloudCommitSchema>

// One cloud commit with its tree and variables, as the commit detail returns it.
export const cloudCommitDetailSchema = cloudCommitSchema.extend({
  tree: z.array(z.unknown()),
  variables: z.unknown().optional(),
})
export type CloudCommitDetailRecord = z.infer<typeof cloudCommitDetailSchema>

export const cloudCommitDetailResponseSchema = z.object({ commit: cloudCommitDetailSchema })
