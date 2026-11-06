import { isFolder } from '@/features/collection'
import type { ApiNode } from '@/shared/models/api-node.model'

export type ReferenceRow = { id: string; method: string; name: string; path: string; active: boolean }
export type ReferenceGroup = { key: string; title: string; rows: ReferenceRow[] }

// The path a reader looks for: no base URL variable, no query.
export function referencePath(url: string): string {
  return url.replace(/^\{\{\s*baseUrl\s*\}\}/, '').split('?')[0]
}

// Lists the requests of a tree, one group per folder that holds requests directly. Requests at the top form the first group.
export function referenceGroups(tree: ApiNode[], activeRequestId: string, rootTitle: string): ReferenceGroup[] {
  const groups: ReferenceGroup[] = []
  const walk = (nodes: ApiNode[], key: string, title: string) => {
    const rows = nodes.flatMap((node) =>
      isFolder(node)
        ? []
        : [{ id: node.id, method: node.method, name: node.name, path: referencePath(node.url), active: node.id === activeRequestId }],
    )
    if (rows.length > 0) groups.push({ key, title, rows })
    for (const node of nodes) if (isFolder(node)) walk(node.children, node.id, node.name)
  }
  walk(tree, 'root', rootTitle)
  return groups
}
