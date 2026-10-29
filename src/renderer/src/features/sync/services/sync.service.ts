import { z } from 'zod'
import {
  type CloudCommitDetailRecord,
  type CloudCommitRecord,
  cloudCommitDetailResponseSchema,
  cloudCommitSchema,
} from '@/features/sync/models/cloud-history.model'
import { apiCall, apiListAll } from '@/lib/api'

const pushResponseSchema = z.object({ headCommitId: z.string() })
const pullResponseSchema = z.object({
  workspace: z.object({ headCommitId: z.string(), tree: z.array(z.unknown()).optional(), variables: z.unknown().optional() }),
})

// Sends unpushed commits to the cloud. Returns the new head.
export const syncService = {
  // Fetches the cloud version of a workspace: its head, its tree, and its shared variables.
  pull: async (input: { token: string; cloudId: string }): Promise<{ headCommitId: string; tree: unknown[]; variables: unknown }> => {
    const data = await apiCall(`/api/workspaces/${input.cloudId}/sync/pull`, { token: input.token })
    const { workspace } = pullResponseSchema.parse(data)
    return { headCommitId: workspace.headCommitId, tree: workspace.tree ?? [], variables: workspace.variables }
  },

  // Lists the cloud commits of a workspace across every page.
  listHistory: async (input: { token: string; cloudId: string }): Promise<CloudCommitRecord[]> => {
    const items = await apiListAll<unknown>(`/api/workspaces/${input.cloudId}/sync/history`, 'commits', { token: input.token })
    return z.array(cloudCommitSchema).parse(items)
  },

  // Fetches one cloud commit with its tree and variables.
  getCommit: async (input: { token: string; cloudId: string; commitId: string }): Promise<CloudCommitDetailRecord> => {
    const data = await apiCall(`/api/workspaces/${input.cloudId}/sync/history/${input.commitId}`, { token: input.token })
    return cloudCommitDetailResponseSchema.parse(data).commit
  },

  push: async (input: { token: string; cloudId: string; commits: LocalCommit[] }): Promise<string> => {
    const data = await apiCall(`/api/workspaces/${input.cloudId}/sync/push`, {
      token: input.token,
      method: 'POST',
      body: { commits: input.commits },
    })
    return pushResponseSchema.parse(data).headCommitId
  },
}
