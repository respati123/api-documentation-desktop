import { type RequestAuth, stripLocalFilePaths } from '@/lib/merge'
import type { Folder, SavedRequest, TreeNode } from '@/models/workspace.model'

export function isRequest(node: TreeNode): node is SavedRequest {
  return node.kind === 'request'
}

export function isFolder(node: TreeNode): node is Folder {
  return node.kind === 'folder'
}

export function requestHeaderCount(request: SavedRequest): number {
  const names = new Set(
    (request.headers ?? []).filter((header) => header.enabled && header.name.trim()).map((header) => header.name.trim().toLowerCase()),
  )
  for (const name of ['accept', 'host', 'user-agent']) names.add(name)
  const bodyMode = request.bodyMode ?? (request.body.trim() ? 'json' : 'none')
  if (bodyMode !== 'none') names.add('content-type')
  const auth = request.auth ?? { type: 'none' as const }
  if (auth.type === 'bearer' && auth.token) names.add('authorization')
  if (auth.type === 'basic' && (auth.username || auth.password)) names.add('authorization')
  if (auth.type === 'api-key' && auth.location === 'header' && auth.name.trim() && auth.value) names.add(auth.name.trim().toLowerCase())
  return names.size
}

export function redactDiffNode(node: TreeNode): TreeNode {
  if (isFolder(node)) return { ...node, children: node.children.map(redactDiffNode) }
  const shared = stripLocalFilePaths([node])[0] as SavedRequest
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

export function nodeDiffText(node: TreeNode | undefined): string {
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
      responses: shared.responses ?? [],
      openApiSchemas: shared.openApiSchemas,
    },
    null,
    2,
  )
}

export function findNode(nodes: TreeNode[], id: string): TreeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    if (isFolder(node)) {
      const nested = findNode(node.children, id)
      if (nested) return nested
    }
  }
}

export function findParentFolder(nodes: TreeNode[], id: string, parentId = ''): string {
  for (const node of nodes) {
    if (node.id === id) return parentId
    if (isFolder(node)) {
      const result = findParentFolder(node.children, id, node.id)
      if (result !== '') return result
    }
  }
  return ''
}

export function indexTree(nodes: TreeNode[]) {
  const nodeById = new Map<string, TreeNode>()
  const parentFolderById = new Map<string, string>()
  const requestCountByFolderId = new Map<string, number>()
  const visit = (items: TreeNode[], parentId = ''): number => {
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

export function updateNode(nodes: TreeNode[], id: string, patch: Partial<SavedRequest>): TreeNode[] {
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

export function renameFolder(nodes: TreeNode[], id: string, name: string): TreeNode[] {
  return nodes.map((node) =>
    isFolder(node) ? (node.id === id ? { ...node, name } : { ...node, children: renameFolder(node.children, id, name) }) : node,
  )
}

export function removeNode(nodes: TreeNode[], id: string): { nodes: TreeNode[]; removed?: TreeNode } {
  const kept: TreeNode[] = []
  let removed: TreeNode | undefined
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

export function containsId(node: TreeNode, id: string): boolean {
  return node.id === id || (isFolder(node) && node.children.some((child) => containsId(child, id)))
}

export function insertNode(nodes: TreeNode[], item: TreeNode, targetId: string | null): TreeNode[] {
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

export function appendToFolder(folder: Folder, targetId: string, item: TreeNode): Folder {
  if (folder.id === targetId) return { ...folder, children: [...folder.children, item] }
  return { ...folder, children: folder.children.map((child) => (isFolder(child) ? appendToFolder(child, targetId, item) : child)) }
}

export function firstRequestId(nodes: TreeNode[]): string {
  for (const node of nodes) {
    if (isRequest(node)) return node.id
    const nested = firstRequestId(node.children)
    if (nested) return nested
  }
  return ''
}
