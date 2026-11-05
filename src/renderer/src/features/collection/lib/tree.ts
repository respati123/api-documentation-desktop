import { stripLocalFilePaths } from '@/lib/merge'
import type { ApiNode, FolderNode, RequestAuth, RequestNode } from '@/shared/models/api-node.model'

export function isRequest(node: ApiNode): node is RequestNode {
  return node.kind === 'request'
}

export function isFolder(node: ApiNode): node is FolderNode {
  return node.kind === 'folder'
}

export function redactDiffNode(node: ApiNode): ApiNode {
  if (isFolder(node)) return { ...node, children: node.children.map(redactDiffNode) }
  const shared = stripLocalFilePaths([node])[0]
  if (!shared || isFolder(shared)) return node
  const headers = shared.headers?.map((header) => ({
    ...header,
    value:
      /^(authorization|proxy-authorization|cookie|set-cookie|x-api-key|api-key)$/i.test(header.name.trim()) && header.value
        ? '••••••'
        : header.value,
  }))
  const auth: RequestAuth =
    shared.auth?.type === 'bearer'
      ? { ...shared.auth, token: shared.auth.token ? '••••••' : '' }
      : shared.auth?.type === 'basic'
        ? { ...shared.auth, password: shared.auth.password ? '••••••' : '' }
        : shared.auth?.type === 'api-key'
          ? { ...shared.auth, value: shared.auth.value ? '••••••' : '' }
          : (shared.auth ?? { type: 'none' })
  return { ...shared, headers, auth }
}

export function nodeDiffText(node: ApiNode | undefined): string {
  if (!node) return ''
  const safe = redactDiffNode(node)
  if (isFolder(safe)) return JSON.stringify(safe, null, 2)
  const shared = safe
  return JSON.stringify(
    {
      name: shared.name,
      method: shared.method,
      url: shared.url,
      pathParams: shared.pathParams ?? [],
      params: shared.params ?? [],
      auth: shared.auth ?? { type: 'none' },
      headers: shared.headers ?? [],
      bodyMode: shared.bodyMode ?? (shared.body.trim() ? 'json' : 'none'),
      body: shared.body,
      bodyFields: shared.bodyFields,
      bodyVariables: shared.bodyVariables,
      bodyMimeType: shared.bodyMimeType,
      bodyFileName: shared.bodyFileName,
      documentation: shared.documentation ?? '',
      preScript: shared.preScript ?? '',
      postScript: shared.postScript ?? '',
      responses: shared.responses ?? [],
      openApiSchemas: shared.openApiSchemas,
    },
    null,
    2,
  )
}

export function findNode(nodes: ApiNode[], id: string): ApiNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    if (isFolder(node)) {
      const nested = findNode(node.children, id)
      if (nested) return nested
    }
  }
  return undefined
}

export function findParentFolder(nodes: ApiNode[], id: string, parentId = ''): string {
  for (const node of nodes) {
    if (node.id === id) return parentId
    if (isFolder(node)) {
      const result = findParentFolder(node.children, id, node.id)
      if (result !== '') return result
    }
  }
  return ''
}

export function indexTree(nodes: ApiNode[]) {
  const nodeById = new Map<string, ApiNode>()
  const parentFolderById = new Map<string, string>()
  const requestCountByFolderId = new Map<string, number>()
  const visit = (items: ApiNode[], parentId = ''): number => {
    let requestCount = 0
    for (const node of items) {
      nodeById.set(node.id, node)
      parentFolderById.set(node.id, parentId)
      if (isFolder(node)) {
        const childCount = visit(node.children, node.id)
        requestCountByFolderId.set(node.id, childCount)
        requestCount += childCount
      } else requestCount += 1
    }
    return requestCount
  }
  visit(nodes)
  return { nodeById, parentFolderById, requestCountByFolderId }
}

export function updateNode(nodes: ApiNode[], id: string, patch: Partial<RequestNode>): ApiNode[] {
  let changed = false
  const updated = nodes.map((node) => {
    if (node.id === id && isRequest(node)) {
      changed = true
      return { ...node, ...patch }
    }
    if (!isFolder(node)) return node
    const children = updateNode(node.children, id, patch)
    if (children === node.children) return node
    changed = true
    return { ...node, children }
  })
  return changed ? updated : nodes
}

export function renameFolder(nodes: ApiNode[], id: string, name: string): ApiNode[] {
  return nodes.map((node) =>
    isFolder(node) ? (node.id === id ? { ...node, name } : { ...node, children: renameFolder(node.children, id, name) }) : node,
  )
}

export function removeNode(nodes: ApiNode[], id: string): { nodes: ApiNode[]; removed?: ApiNode } {
  const kept: ApiNode[] = []
  let removed: ApiNode | undefined
  for (const node of nodes) {
    if (node.id === id) removed = node
    else if (isFolder(node)) {
      const result = removeNode(node.children, id)
      if (result.removed) removed = result.removed
      kept.push({ ...node, children: result.nodes })
    } else kept.push(node)
  }
  return { nodes: kept, removed }
}

export function containsId(node: ApiNode, id: string): boolean {
  return node.id === id || (isFolder(node) && node.children.some((child) => containsId(child, id)))
}

export function insertNode(nodes: ApiNode[], item: ApiNode, targetId: string | null): ApiNode[] {
  if (!targetId) return [...nodes, item]
  const target = findNode(nodes, targetId)
  if (!target) return [...nodes, item]
  if (isFolder(target)) {
    return nodes.map((node) =>
      isFolder(node) && node.id === targetId
        ? { ...node, children: [...node.children, item] }
        : isFolder(node)
          ? { ...node, children: insertNode(node.children, item, targetId) }
          : node,
    )
  }
  return nodes.flatMap((node) => {
    if (node.id === targetId) return [item, node]
    if (isFolder(node)) return [{ ...node, children: insertNode(node.children, item, targetId) }]
    return [node]
  })
}

export function appendToFolder(folder: FolderNode, targetId: string, item: ApiNode): FolderNode {
  if (folder.id === targetId) return { ...folder, children: [...folder.children, item] }
  return { ...folder, children: folder.children.map((child) => (isFolder(child) ? appendToFolder(child, targetId, item) : child)) }
}

// Adds an item at the end of the folder with parentId. A missing parent, or one that is not a folder, adds it at the root.
export function addToTree(nodes: ApiNode[], parentId: string, item: ApiNode): ApiNode[] {
  const parent = findNode(nodes, parentId)
  if (!parent || !isFolder(parent)) return [...nodes, item]
  return nodes.map((node) => (isFolder(node) ? appendToFolder(node, parent.id, item) : node))
}

export function firstRequestId(nodes: ApiNode[]): string {
  for (const node of nodes) {
    if (isRequest(node)) return node.id
    const nested = firstRequestId(node.children)
    if (nested) return nested
  }
  return ''
}
