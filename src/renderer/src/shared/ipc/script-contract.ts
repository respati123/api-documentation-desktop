import { z } from 'zod'

// The shapes a request script receives and returns. The main process runs the script. The renderer sends the input and reads the result.
export const scriptHeaderSchema = z.object({ name: z.string(), value: z.string() })

export const scriptRequestSchema = z.object({
  method: z.string(),
  url: z.string(),
  headers: z.array(scriptHeaderSchema),
})

export const scriptResponseSchema = z.object({
  status: z.number(),
  elapsedMs: z.number(),
  headers: z.record(z.string(), z.string()),
  body: z.string(),
})

export const scriptRunInputSchema = z.object({
  phase: z.enum(['pre', 'post']),
  source: z.string(),
  variables: z.object({
    environment: z.record(z.string(), z.string()),
    globals: z.record(z.string(), z.string()),
  }),
  // Secret values are used only to redact them from what the script returns.
  secretValues: z.array(z.string()),
  request: scriptRequestSchema,
  response: scriptResponseSchema.optional(),
})

export const scriptCheckSchema = z.object({
  name: z.string(),
  passed: z.boolean(),
  message: z.string().optional(),
})

export const scriptVariableScopeSchema = z.enum(['environment', 'global'])

export const scriptRunResultSchema = z.object({
  ok: z.boolean(),
  error: z.string().nullable(),
  logs: z.array(z.string()),
  logsTruncated: z.boolean(),
  checks: z.array(scriptCheckSchema),
  writes: z.array(z.object({ scope: scriptVariableScopeSchema, name: z.string(), value: z.string() })),
  removals: z.array(z.object({ scope: scriptVariableScopeSchema, name: z.string() })),
  request: scriptRequestSchema.nullable(),
})

export type ScriptHeader = z.infer<typeof scriptHeaderSchema>
export type ScriptRequest = z.infer<typeof scriptRequestSchema>
export type ScriptResponse = z.infer<typeof scriptResponseSchema>
export type ScriptRunInput = z.infer<typeof scriptRunInputSchema>
export type ScriptCheck = z.infer<typeof scriptCheckSchema>
export type ScriptRunResult = z.infer<typeof scriptRunResultSchema>
