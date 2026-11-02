import { z } from 'zod'

export const apiResponseSchema = z.object({
  status: z.number(),
  statusText: z.string(),
  duration: z.number(),
  headers: z.record(z.string(), z.string()),
  cookies: z.array(z.string()).optional(),
  body: z.string(),
})
export type ResponseData = z.infer<typeof apiResponseSchema>

export const responseTabSchema = z.enum(['body', 'headers', 'cookies'])
export type ResponseTab = z.infer<typeof responseTabSchema>

export type ResponseState =
  | { kind: 'empty' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; data: ResponseData }
