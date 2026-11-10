import { z } from 'zod'
import type { SavedResponseSnapshot, SavedResponseSummary } from '@/lib/response-references'

// The main process sends these. Each is checked here before the renderer uses it.
export const savedResponseSummarySchema: z.ZodType<SavedResponseSummary> = z.object({
  requestId: z.string(),
  savedAt: z.string(),
  status: z.number(),
  statusText: z.string(),
  truncated: z.boolean(),
})

export const savedResponseSchema: z.ZodType<SavedResponseSnapshot> = z.object({
  savedAt: z.string(),
  status: z.number(),
  statusText: z.string(),
  headers: z.record(z.string(), z.string()),
  body: z.string(),
  truncated: z.boolean(),
})
