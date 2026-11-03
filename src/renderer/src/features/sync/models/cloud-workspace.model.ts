import { z } from 'zod'

// What the cloud API returns for a workspace. The tree and variables are normalized by the caller.
export const cloudWorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(['owner', 'editor', 'viewer']),
  headCommitId: z.string(),
  tree: z.array(z.unknown()).optional(),
  variables: z.unknown().optional(),
})
export type CloudWorkspaceRecord = z.infer<typeof cloudWorkspaceSchema>

export const workspaceResponseSchema = z.object({ workspace: cloudWorkspaceSchema })

export const inviteResponseSchema = z.object({ token: z.string(), emailSent: z.boolean() })
export type InviteResponse = z.infer<typeof inviteResponseSchema>

// One entry of the cloud workspace list. The list shows only these fields.
export const cloudWorkspaceSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(['owner', 'editor', 'viewer']),
  headCommitId: z.string(),
})
export type CloudWorkspace = z.infer<typeof cloudWorkspaceSummarySchema>
