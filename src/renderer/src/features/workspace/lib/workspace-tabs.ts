import { z } from 'zod'
import { firstRequestId } from '@/features/collection'
import type { WorkspaceTab } from '@/features/workspace/models/workspace.model'
import type { WorkspaceVariables } from '@/lib/workspace-variables'
import type { ApiNode } from '@/shared/models/api-node.model'

// A saved tab, as the app wrote it. Anything that does not match is dropped when the tabs are read.
const savedTabSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('request'), id: z.string() }),
  z.object({ kind: z.literal('docs'), id: z.string() }),
  z.object({ kind: z.literal('environment'), id: z.string() }),
])
const savedTabsSchema = z.object({ tabs: z.unknown(), activeKey: z.unknown() })

export function workspaceTabKey(tab: WorkspaceTab): string {
  return `${tab.kind}:${tab.id}`
}

export function readWorkspaceTabs(
  workspaceId: string,
  tree: ApiNode[],
  variables: WorkspaceVariables,
): { tabs: WorkspaceTab[]; activeKey: string } {
  const requestIds = new Set<string>()
  const collectRequests = (nodes: ApiNode[]) => {
    for (const node of nodes) {
      if (node.kind === 'request') requestIds.add(node.id)
      else collectRequests(node.children)
    }
  }
  collectRequests(tree)
  const environmentIds = new Set(variables.environments.map((environment) => environment.id))
  const firstId = firstRequestId(tree)
  const fallback: WorkspaceTab[] = firstId ? [{ kind: 'request', id: firstId }] : []
  try {
    const parsed = savedTabsSchema.safeParse(JSON.parse(localStorage.getItem(`api-docs-open-tabs-${workspaceId}`) ?? 'null'))
    const stored = parsed.success ? parsed.data : null
    const savedTabs = Array.isArray(stored?.tabs) ? stored.tabs.flatMap((item) => savedTabSchema.safeParse(item).data ?? []) : []
    const seen = new Set<string>()
    const tabs = savedTabs.filter((tab) => {
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
