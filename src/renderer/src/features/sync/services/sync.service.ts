import { z } from 'zod'
import { apiCall } from '@/lib/api'

const pushResponseSchema = z.object({ headCommitId: z.string() })

// Sends unpushed commits to the cloud. Returns the new head.
export const syncService = {
  push: async (input: { token: string; cloudId: string; commits: LocalCommit[] }): Promise<string> => {
    const data = await apiCall(`/api/workspaces/${input.cloudId}/sync/push`, {
      token: input.token,
      method: 'POST',
      body: { commits: input.commits },
    })
    return pushResponseSchema.parse(data).headCommitId
  },
}
