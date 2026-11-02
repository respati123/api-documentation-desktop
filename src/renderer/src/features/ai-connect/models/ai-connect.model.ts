import { z } from 'zod'

export const aiToolIdSchema = z.enum(['codex', 'claude-cli', 'claude-desktop'])
export type AiToolId = z.infer<typeof aiToolIdSchema>

export const installableToolSchema = z.enum(['codex', 'claude-cli'])

export const aiToolStatusSchema = z.object({
  id: aiToolIdSchema,
  supported: z.boolean(),
  installed: z.boolean(),
  connected: z.boolean(),
})

export const aiConnectStatusSchema = z.object({
  node: z.object({
    installed: z.boolean(),
    version: z.string().optional(),
    source: z.enum(['app', 'system']).optional(),
  }),
  tools: z.array(aiToolStatusSchema),
})
export type AiConnectStatus = z.infer<typeof aiConnectStatusSchema>

export const nodeInstallProgressSchema = z.object({
  stage: z.enum(['checking', 'downloading', 'verifying', 'extracting', 'done']),
  percent: z.number().optional(),
})
export type NodeInstallProgress = z.infer<typeof nodeInstallProgressSchema>
