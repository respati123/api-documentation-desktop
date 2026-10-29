import { z } from 'zod'

export const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const

export const requestTabSchema = z.enum(['params', 'body', 'auth', 'headers', 'responses', 'docs'])
export type RequestTab = z.infer<typeof requestTabSchema>

export const authTypeSchema = z.enum(['none', 'api-key', 'basic', 'bearer'])
export type AuthType = z.infer<typeof authTypeSchema>

export const apiKeyLocationSchema = z.enum(['header', 'query'])

export const pickedFileSchema = z.object({ path: z.string(), name: z.string() })
export type PickedFile = z.infer<typeof pickedFileSchema>
