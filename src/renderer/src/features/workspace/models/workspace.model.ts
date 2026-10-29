import { z } from 'zod'
import type { WorkspaceVariables } from '@/lib/workspace-variables'

export type WorkspaceTab = { kind: 'request'; id: string } | { kind: 'docs'; id: string } | { kind: 'environment'; id: string }

export type WorkspaceHistoryCommit = {
  id: string
  parentIds: string[]
  message: string
  tree?: unknown[]
  variables?: WorkspaceVariables
  createdAt: string
  pushed: boolean
  source: 'local' | 'cloud'
}

// A workspace change pushed over the event socket. Fields a sender may leave out are optional.
export const workspaceUpdateEventSchema = z.object({
  type: z.literal('workspace.updated'),
  workspaceId: z.string(),
  headCommitId: z.string(),
  message: z.string().optional(),
  actorEmail: z.string().optional(),
  commitCount: z.number().optional(),
})
export type WorkspaceUpdateEvent = z.infer<typeof workspaceUpdateEventSchema>

export type CollectionContextMenu = { x: number; y: number; parentFolderId: string; targetNodeId: string | null }

export type DeleteConfirmTarget = { id: string; kind: 'folder' | 'request'; name: string }
