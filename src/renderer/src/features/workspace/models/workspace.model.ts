import type { SyncConflict } from '@/lib/merge'
import type { WorkspaceVariables } from '@/lib/workspace-variables'
import type { ApiNode } from '@/shared/models/api-node.model'

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

export type WorkspaceUpdateEvent = {
  type: 'workspace.updated'
  workspaceId: string
  headCommitId: string
  message: string
  actorEmail: string
  commitCount: number
}

export type CollectionContextMenu = { x: number; y: number; parentFolderId: string; targetNodeId: string | null }

export type DeleteConfirmTarget = { id: string; kind: 'folder' | 'request'; name: string }

export type PendingMerge = {
  remoteHeadId: string
  remoteTree: ApiNode[]
  localTree: ApiNode[]
  baseTree: ApiNode[]
  localHeadId: string
  conflicts: SyncConflict[]
  remoteVariables: WorkspaceVariables
  localVariables: WorkspaceVariables
  baseVariables: WorkspaceVariables
  variableConflict: boolean
}
