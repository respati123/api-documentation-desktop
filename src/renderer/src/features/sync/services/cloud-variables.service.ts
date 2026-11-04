import { z } from 'zod'
import { ApiError, apiCall } from '@/lib/api'

const cloudVariablesSchema = z.object({
  variables: z.unknown(),
  revision: z.number().int().nonnegative(),
})

export type CloudVariables = z.infer<typeof cloudVariablesSchema>

// The workspace variables at workspace level, with the revision they were read at. They sync apart from the collections.
export const cloudVariablesService = {
  get: (input: { token: string; cloudId: string }): Promise<CloudVariables> =>
    apiCall(`/api/workspaces/${input.cloudId}/variables`, { token: input.token }, cloudVariablesSchema),

  put: (input: { token: string; cloudId: string; variables: unknown; baseRevision: number }): Promise<CloudVariables> =>
    apiCall(
      `/api/workspaces/${input.cloudId}/variables`,
      { token: input.token, method: 'PUT', body: { variables: input.variables, baseRevision: input.baseRevision } },
      cloudVariablesSchema,
    ),
}

// True when the cloud refused a save because the variables changed after they were read. The copy must read them again first.
export function isVariablesRevisionConflict(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 409) return false
  const code = typeof error.data === 'object' && error.data !== null && 'code' in error.data ? error.data.code : undefined
  return code === 'VARIABLES_REVISION_CONFLICT'
}
