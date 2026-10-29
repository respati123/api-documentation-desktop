import { z } from 'zod'
import { normalizeTree } from '@/features/collection'
import { normalizeWorkspaceVariables, type WorkspaceVariables } from '@/lib/workspace-variables'

// Stored trees go through the same migration as the legacy tree, so every node the app reads has the current shape.
const storedTree = z.unknown().transform((value) => normalizeTree(value))

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

// Shapes of what the main process stores.
export const localWorkspaceSchema: z.ZodType<LocalWorkspace, unknown> = z.object({
  id: z.string(),
  cloudId: nullableString,
  name: z.string(),
  tree: storedTree,
  baseTree: storedTree,
  variables: storedVariables,
  baseVariables: storedVariables,
  activeEnvironmentId: nullableString.optional(),
  baseCommitId: nullableString,
  localHeadId: nullableString,
  role: z.enum(['owner', 'editor', 'viewer']).nullable().optional(),
})

export const localCommitSchema: z.ZodType<LocalCommit, unknown> = z.object({
  id: z.string(),
  parentIds: z.array(z.string()),
  message: z.string(),
  tree: storedTree,
  variables: storedVariables,
  createdAt: z.string(),
  pushed: z.boolean(),
})
