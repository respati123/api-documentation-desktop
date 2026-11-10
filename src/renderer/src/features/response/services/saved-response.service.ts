import { z } from 'zod'
import { savedResponseSchema, savedResponseSummarySchema } from '@/features/response/models/saved-response.model'
import type { SavedResponseSnapshot, SavedResponseSummary } from '@/lib/response-references'

// The only place the renderer reads saved responses through the main process.
export const savedResponseService = {
  list: async (workspaceId: string): Promise<SavedResponseSummary[]> =>
    z.array(savedResponseSummarySchema).parse(await window.apiDesktop.listSavedResponses(workspaceId)),

  read: async (workspaceId: string, requestId: string): Promise<SavedResponseSnapshot | undefined> => {
    const saved = await window.apiDesktop.readSavedResponse(workspaceId, requestId)
    return saved === null ? undefined : savedResponseSchema.parse(saved)
  },
}
