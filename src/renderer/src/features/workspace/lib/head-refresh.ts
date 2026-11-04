import { emptyWorkspaceVariables, preserveLocalSecretValues, type WorkspaceVariables } from '@/lib/workspace-variables'
import type { ApiNode } from '@/shared/models/api-node.model'

// The copy at a newer cloud head. Its id, owner, and role stay. Its active environment stays when that environment still exists,
// and otherwise falls back to the first environment. Secret values on this device stay too: the cloud sends them empty.
export function refreshedToHead(
  copy: LocalWorkspace,
  pulled: { headCommitId: string; tree: ApiNode[]; variables: WorkspaceVariables },
): LocalWorkspace {
  const keepsEnvironment =
    copy.activeEnvironmentId !== null && pulled.variables.environments.some((item) => item.id === copy.activeEnvironmentId)
  return {
    ...copy,
    tree: pulled.tree,
    baseTree: pulled.tree,
    variables: preserveLocalSecretValues(pulled.variables, copy.variables ?? emptyWorkspaceVariables()),
    baseVariables: pulled.variables,
    activeEnvironmentId: keepsEnvironment ? copy.activeEnvironmentId : (pulled.variables.environments[0]?.id ?? null),
    baseCommitId: pulled.headCommitId,
    localHeadId: pulled.headCommitId,
  }
}
