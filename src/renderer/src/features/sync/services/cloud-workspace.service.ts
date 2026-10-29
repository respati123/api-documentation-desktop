import {
  type CloudWorkspaceRecord,
  type InviteResponse,
  inviteResponseSchema,
  workspaceResponseSchema,
} from '@/features/sync/models/cloud-workspace.model'
import { apiCall } from '@/lib/api'
import type { ApiNode } from '@/shared/models/api-node.model'

// The cloud calls for creating, sharing, and joining workspaces. Each response is parsed before it is used.
export const cloudWorkspaceService = {
  create: async (input: { token: string; name: string; tree: ApiNode[]; variables: unknown }): Promise<CloudWorkspaceRecord> => {
    const data = await apiCall('/api/workspaces', {
      token: input.token,
      method: 'POST',
      body: { name: input.name, tree: input.tree, variables: input.variables },
    })
    return workspaceResponseSchema.parse(data).workspace
  },

  invite: async (input: { token: string; cloudId: string; email: string; role: 'editor' | 'viewer' }): Promise<InviteResponse> => {
    const data = await apiCall(`/api/workspaces/${input.cloudId}/invites`, {
      token: input.token,
      method: 'POST',
      body: { email: input.email, role: input.role },
    })
    return inviteResponseSchema.parse(data)
  },

  accept: async (input: { token: string; inviteToken: string }): Promise<CloudWorkspaceRecord> => {
    const data = await apiCall('/api/invites/accept', { token: input.token, method: 'POST', body: { token: input.inviteToken } })
    return workspaceResponseSchema.parse(data).workspace
  },
}
