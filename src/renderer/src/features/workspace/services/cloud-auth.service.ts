import { type ApiUser, meResponseSchema } from '@/features/workspace/models/cloud-session.model'
import { apiCall } from '@/lib/api'

// The cloud calls for signing in and out. Each response is parsed before it is used.
export const cloudAuthService = {
  me: async (token: string): Promise<ApiUser> => {
    const data = await apiCall('/api/me', { token }, meResponseSchema)
    return data.user
  },

  logout: async (token: string): Promise<void> => {
    await apiCall('/api/auth/logout', { token, method: 'POST' })
  },
}
