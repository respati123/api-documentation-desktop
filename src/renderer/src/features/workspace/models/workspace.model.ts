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
  actorId: z.string().optional(),
  actorEmail: z.string().optional(),
  commitCount: z.number().optional(),
})
export type WorkspaceUpdateEvent = z.infer<typeof workspaceUpdateEventSchema>

// Sent to members when a workspace's settings, members, invites, or the workspace itself change. The reason says which part.
export const workspaceChangedEventSchema = z.object({
  type: z.literal('workspace.changed'),
  workspaceId: z.string(),
  reason: z.string(),
})
export type WorkspaceChangedEvent = z.infer<typeof workspaceChangedEventSchema>

export type WorkspaceEvent = WorkspaceUpdateEvent | WorkspaceChangedEvent

const workspaceEventSchema = z.discriminatedUnion('type', [workspaceUpdateEventSchema, workspaceChangedEventSchema])

// Returns null for anything that is not a known workspace event, so one bad message does not break the socket.
export function parseWorkspaceEvent(raw: string): WorkspaceEvent | null {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }
  const parsed = workspaceEventSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

export type CollectionContextMenu = { x: number; y: number; parentFolderId: string; targetNodeId: string | null }

export type DeleteConfirmTarget = { id: string; kind: 'folder' | 'request'; name: string }
