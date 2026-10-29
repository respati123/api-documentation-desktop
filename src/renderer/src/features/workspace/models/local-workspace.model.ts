import { z } from 'zod'
import { normalizeWorkspaceVariables, type WorkspaceVariables } from '@/lib/workspace-variables'

// Variables are read through normalizeWorkspaceVariables, which accepts older saved shapes.
// A strict schema here would fail to load a workspace saved before a field existed.
const storedVariables = z
  .unknown()
  .optional()
  .transform((value): WorkspaceVariables | undefined => (value === undefined ? undefined : normalizeWorkspaceVariables(value)))

// Optional-in-storage fields accept a missing value and read it as null, as the app already does.
const nullableString = z
  .string()
  .nullish()
  .transform((value): string | null => value ?? null)

// Shapes of what the main process stores. The tree stays unknown here because lib/merge normalizes it.
export const localWorkspaceSchema: z.ZodType<LocalWorkspace> = z.object({
  id: z.string(),
  cloudId: nullableString,
  name: z.string(),
  tree: z.array(z.unknown()),
  baseTree: z.array(z.unknown()),
  variables: storedVariables,
  baseVariables: storedVariables,
  activeEnvironmentId: nullableString.optional(),
  baseCommitId: nullableString,
  localHeadId: nullableString,
  role: z.enum(['owner', 'editor', 'viewer']).nullable().optional(),
})

export const localCommitSchema: z.ZodType<LocalCommit> = z.object({
  id: z.string(),
  parentIds: z.array(z.string()),
  message: z.string(),
  tree: z.array(z.unknown()),
  variables: storedVariables,
  createdAt: z.string(),
  pushed: z.boolean(),
})
