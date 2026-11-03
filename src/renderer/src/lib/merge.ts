import type { ApiNode, FolderNode, RequestNode } from '@/shared/models/api-node.model'

export type SyncConflict = { id: string; local: ApiNode | null; remote: ApiNode | null }
type FlatNode = { node: RequestNode | Omit<FolderNode, 'children'>; parentId: string; order: number }

export function stripLocalFilePaths(tree: ApiNode[]): ApiNode[] {
  return tree.map((node) => {
    if (node.kind === 'folder') return { ...node, children: stripLocalFilePaths(node.children) }
    const { bodyPath: _bodyPath, ...request } = node
    return {
      ...request,
      ...(node.bodyFields ? { bodyFields: node.bodyFields.map(({ filePath: _filePath, ...field }) => field) } : {}),
    }
  })
}

function comparableNode(node: FlatNode['node']): FlatNode['node'] {
  if (node.kind !== 'request') return node
  const { bodyPath: _bodyPath, ...request } = node
  return {
    ...request,
    ...(node.bodyFields ? { bodyFields: node.bodyFields.map(({ filePath: _filePath, ...field }) => field) } : {}),
  }
}

function isFolder(node: ApiNode): node is FolderNode {
  return node.kind === 'folder'
}

function flatten(tree: ApiNode[]): Map<string, FlatNode> {
  const result = new Map<string, FlatNode>()
  function visit(nodes: ApiNode[], parentId: string) {
    nodes.forEach((node, order) => {
      const flatNode = isFolder(node) ? { id: node.id, kind: node.kind, name: node.name } : node
      result.set(node.id, { node: flatNode, parentId, order })
      if (isFolder(node)) visit(node.children, node.id)
    })
  }
  visit(tree, '')
  return result
}

function sameState(left: FlatNode | undefined, right: FlatNode | undefined): boolean {
  if (!left || !right) return left === right
  return left.parentId === right.parentId && JSON.stringify(comparableNode(left.node)) === JSON.stringify(comparableNode(right.node))
}

export function mergeTreeSnapshots(
  baseTree: ApiNode[],
  localTree: ApiNode[],
  remoteTree: ApiNode[],
  choices: Record<string, 'local' | 'remote'> = {},
): { tree: ApiNode[]; conflicts: SyncConflict[]; unresolved: SyncConflict[] } {
  const base = flatten(baseTree)
  const local = flatten(localTree)
  const remote = flatten(remoteTree)
  const ids = new Set([...base.keys(), ...local.keys(), ...remote.keys()])
  const selected = new Map<string, FlatNode>()
  const conflicts: SyncConflict[] = []

  for (const id of ids) {
    const before = base.get(id)
    const mine = local.get(id)
    const theirs = remote.get(id)
    let choice: FlatNode | undefined
    if (!before) {
      if (mine && theirs && !sameState(mine, theirs)) {
        const conflict = { id, local: localTreeNode(mine, local), remote: localTreeNode(theirs, remote) }
        conflicts.push(conflict)
        choice = choices[id] === 'remote' ? theirs : mine
      } else choice = mine ?? theirs
    } else if (sameState(mine, before)) choice = theirs
    else if (sameState(theirs, before)) choice = mine
    else if (sameState(mine, theirs)) choice = mine
    else {
      const conflict = { id, local: mine ? localTreeNode(mine, local) : null, remote: theirs ? localTreeNode(theirs, remote) : null }
      conflicts.push(conflict)
      choice = choices[id] === 'remote' ? theirs : mine
    }
    if (choice) selected.set(id, choice)
  }

  const unresolved = conflicts.filter((conflict) => !choices[conflict.id])
  const childrenByParent = new Map<string, Array<[string, FlatNode]>>()
  for (const [id, entry] of selected) {
    const parentId = entry.parentId && selected.has(entry.parentId) ? entry.parentId : ''
    const children = childrenByParent.get(parentId) ?? []
    children.push([id, entry])
    childrenByParent.set(parentId, children)
  }

  function build(parentId: string, path = new Set<string>()): ApiNode[] {
    return (childrenByParent.get(parentId) ?? [])
      .sort((a, b) => a[1].order - b[1].order)
      .map(([id, entry]) => {
        if (entry.node.kind === 'request') return entry.node
        if (path.has(id)) return { ...entry.node, children: [] }
        const nextPath = new Set(path).add(id)
        return { ...entry.node, children: build(id, nextPath) }
      })
  }

  return { tree: build(''), conflicts, unresolved }
}

function localTreeNode(entry: FlatNode, source: Map<string, FlatNode>): ApiNode {
  if (entry.node.kind === 'request') return entry.node
  const children = [...source.entries()]
    .filter(([, child]) => child.parentId === entry.node.id)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([, child]) => localTreeNode(child, source))
  return { ...entry.node, children }
}
