import { z } from 'zod'

export const updateStatusSchema = z.discriminatedUnion('state', [
  z.object({ state: z.literal('available'), version: z.string() }),
  z.object({ state: z.literal('downloading'), version: z.string(), percent: z.number() }),
  z.object({ state: z.literal('downloaded'), version: z.string() }),
  z.object({ state: z.literal('error'), version: z.string(), message: z.string() }),
])
export type UpdateStatus = z.infer<typeof updateStatusSchema>

export const appUpdateService = {
  onStatus: (handler: (status: UpdateStatus) => void): (() => void) =>
    window.apiDesktop.onUpdateStatus((status) => {
      const parsed = updateStatusSchema.safeParse(status)
      if (parsed.success) handler(parsed.data)
    }),

  download: async (version: string): Promise<void> => {
    await window.apiDesktop.downloadUpdate(version)
  },
}
