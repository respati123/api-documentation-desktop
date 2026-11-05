import { z } from 'zod'
import type { ScriptRunResult } from '@/shared/ipc/script-contract'

export const apiResponseSchema = z.object({
  status: z.number(),
  statusText: z.string(),
  duration: z.number(),
  headers: z.record(z.string(), z.string()),
  cookies: z.array(z.string()).optional(),
  body: z.string(),
})
export type ResponseData = z.infer<typeof apiResponseSchema>

export const responseTabSchema = z.enum(['body', 'headers', 'cookies', 'tests', 'console'])
export type ResponseTab = z.infer<typeof responseTabSchema>

export type ResponseState =
  | { kind: 'empty' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; data: ResponseData }

// A variable change a script asked for that was not saved, and why.
export type SkippedVariable = { name: string; reason: 'noEnvironment' | 'secret' }

// The script runs that happened for one send. A script that did not run is null.
export type ScriptRuns = {
  pre: ScriptRunResult | null
  post: ScriptRunResult | null
  skipped: SkippedVariable[]
}
