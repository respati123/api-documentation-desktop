import { firstRequestId } from '@/lib/tree'
import type { WorkspaceVariables } from '@/lib/workspace-variables'
import type { TreeNode, WorkspaceTab } from '@/models/workspace.model'

export function workspaceTabKey(tab: WorkspaceTab): string {
  return `${tab.kind}:${tab.id}`
}

export function readWorkspaceTabs(
  workspaceId: string,
  tree: TreeNode[],
  variables: WorkspaceVariables,
): { tabs: WorkspaceTab[]; activeKey: string } {
  const requestIds = new Set<string>()
  const collectRequests = (nodes: TreeNode[]) =>
    nodes.forEach((node) => (node.kind === 'request' ? requestIds.add(node.id) : collectRequests(node.children)))
  collectRequests(tree)
  const environmentIds = new Set(variables.environments.map((environment) => environment.id))
  const firstId = firstRequestId(tree)
  const fallback: WorkspaceTab[] = firstId ? [{ kind: 'request', id: firstId }] : []
  try {
    const stored = JSON.parse(localStorage.getItem(`api-docs-open-tabs-${workspaceId}`) ?? 'null') as {
      tabs?: unknown
      activeKey?: unknown
    } | null
    const savedTabs = Array.isArray(stored?.tabs) ? (stored.tabs as WorkspaceTab[]) : []
    const seen = new Set<string>()
    const tabs = savedTabs.filter((tab): tab is WorkspaceTab => {
      if (!tab || !['request', 'docs', 'environment'].includes(tab.kind) || typeof tab.id !== 'string') return false
      if (tab.kind === 'environment' ? !environmentIds.has(tab.id) : !requestIds.has(tab.id)) return false
      const key = workspaceTabKey(tab)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    const nextTabs = tabs.length ? tabs : fallback
    const activeKey =
      typeof stored?.activeKey === 'string' && nextTabs.some((tab) => workspaceTabKey(tab) === stored.activeKey)
        ? stored.activeKey
        : nextTabs[0]
          ? workspaceTabKey(nextTabs[0])
          : ''
    return { tabs: nextTabs, activeKey }
  } catch {
    return { tabs: fallback, activeKey: fallback[0] ? workspaceTabKey(fallback[0]) : '' }
  }
}
