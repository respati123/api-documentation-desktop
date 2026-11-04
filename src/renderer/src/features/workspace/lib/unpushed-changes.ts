import { getWorkspaceChanges } from '@/lib/workspace-changes'
import type { WorkspaceVariables } from '@/lib/workspace-variables'
import type { ApiNode } from '@/shared/models/api-node.model'

// True when a copy has commits or edits that the cloud head does not have yet.
// Compared the same way as the Changes panel, so secret values and local file paths do not count as edits.
export function hasUnpushedChanges(copy: {
  localHeadId?: string | null
  baseCommitId?: string | null
  tree: ApiNode[]
  baseTree: ApiNode[]
  variables?: WorkspaceVariables
  baseVariables?: WorkspaceVariables
}): boolean {
  if ((copy.localHeadId ?? null) !== (copy.baseCommitId ?? null)) return true
  return getWorkspaceChanges(copy.baseTree, copy.tree, copy.baseVariables, copy.variables).length > 0
}
