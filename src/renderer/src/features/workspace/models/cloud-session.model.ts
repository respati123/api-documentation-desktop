import { z } from 'zod'

// The signed-in account, as the cloud reports it.
export const apiUserSchema = z.object({ id: z.string(), email: z.string() })
export type ApiUser = z.infer<typeof apiUserSchema>

export const meResponseSchema = z.object({ user: apiUserSchema })

export const sessionExchangeResponseSchema = z.object({ token: z.string(), user: apiUserSchema })
