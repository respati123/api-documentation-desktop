import { z } from 'zod'
import { apiCall } from '@/lib/api'

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

  push: async (input: { token: string; cloudId: string; commits: LocalCommit[] }): Promise<string> => {
    const data = await apiCall(`/api/workspaces/${input.cloudId}/sync/push`, {
      token: input.token,
      method: 'POST',
      body: { commits: input.commits },
    })
    return pushResponseSchema.parse(data).headCommitId
  },
}
