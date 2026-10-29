import type { Dispatch, SetStateAction } from 'react'
import {
  addToTree,
  containsId,
  findParentFolder,
  firstRequestId,
  type indexTree,
  insertNode,
  isFolder,
  isRequest,
  removeNode,
  renameFolder,
} from '@/features/collection'
import { workspaceTabKey } from '@/features/workspace/lib/workspace-tabs'
import type { WorkspaceTab } from '@/features/workspace/models/workspace.model'
import type { ApiNode, FolderNode, RequestNode } from '@/shared/models/api-node.model'

export type TreeActionsInput = {
  tree: ApiNode[]
  setTree: Dispatch<SetStateAction<ApiNode[]>>
  treeIndex: ReturnType<typeof indexTree>
  isReadOnly: boolean
  selectedRequestId: string
  setSelectedRequestId: Dispatch<SetStateAction<string>>
  selectedFolderId: string
  setSelectedFolderId: Dispatch<SetStateAction<string>>
  setExpandedFolders: Dispatch<SetStateAction<Set<string>>>
  workspaceTabs: WorkspaceTab[]
  setWorkspaceTabs: Dispatch<SetStateAction<WorkspaceTab[]>>
  activeWorkspaceTabKey: string
  setActiveWorkspaceTabKey: Dispatch<SetStateAction<string>>
  setActiveEnvironmentId: Dispatch<SetStateAction<string | null>>
}

// Creating, importing, renaming, moving, and deleting collection items. Tabs and selection follow the change.
export function useWorkspaceTreeActionsViewModel(input: TreeActionsInput) {
  const {
    tree,
    setTree,
    treeIndex,
    isReadOnly,
    selectedRequestId,
    setSelectedRequestId,
    selectedFolderId,
    setSelectedFolderId,
    setExpandedFolders,
    workspaceTabs,
    setWorkspaceTabs,
    activeWorkspaceTabKey,
    setActiveWorkspaceTabKey,
    setActiveEnvironmentId,
  } = input
  function createFolderInTree(parentId: string, name: string) {
    if (isReadOnly) return
    const folder: FolderNode = { id: crypto.randomUUID(), kind: 'folder', name, children: [] }
    setTree((current) => addToTree(current, parentId, folder))
    setSelectedFolderId(folder.id)
    setExpandedFolders((current) => new Set(current).add(folder.id))
  }

  // An OpenAPI import adds its folders and opens its first request.
  function importTree(imported: ApiNode[]) {
    setTree((current) => [...current, ...imported])
    const importedRequestId = firstRequestId(imported)
    if (importedRequestId) {
      const tab: WorkspaceTab = { kind: 'request', id: importedRequestId }
      setWorkspaceTabs((current) => [...current.filter((item) => workspaceTabKey(item) !== workspaceTabKey(tab)), tab])
      setActiveWorkspaceTabKey(workspaceTabKey(tab))
      setSelectedRequestId(importedRequestId)
      setSelectedFolderId(findParentFolder(imported, importedRequestId))
    }
    const folders = new Set<string>()
    const collectFolders = (nodes: ApiNode[]) =>
      nodes.forEach((node) => {
        if (node.kind === 'folder') {
          folders.add(node.id)
          collectFolders(node.children)
        }
      })
    collectFolders(imported)
    setExpandedFolders((current) => new Set([...current, ...folders]))
  }

  function renameFolderInTree(folderId: string, name: string) {
    setTree((current) => renameFolder(current, folderId, name))
  }

  function selectFolder(folderId: string) {
    setSelectedFolderId(folderId)
  }

  function toggleFolderExpanded(folderId: string) {
    setExpandedFolders((current) => {
      const next = new Set(current)
      if (next.has(folderId)) next.delete(folderId)
      else next.add(folderId)
      return next
    })
  }

  function createRequest(folderId = selectedFolderId) {
    if (isReadOnly) return
    const request: RequestNode = {
      id: crypto.randomUUID(),
      kind: 'request',
      name: 'Untitled request',
      method: 'GET',
      url: '',
      body: '{\n  \n}',
      bodyMode: 'json',
      bodyFields: [],
      headers: [{ id: crypto.randomUUID(), name: 'Accept', value: '*/*', enabled: true }],
      params: [],
      auth: { type: 'none' },
    }
    setTree((current) => addToTree(current, folderId, request))
    const tab: WorkspaceTab = { kind: 'request', id: request.id }
    setWorkspaceTabs((current) => [...current.filter((item) => workspaceTabKey(item) !== workspaceTabKey(tab)), tab])
    setActiveWorkspaceTabKey(workspaceTabKey(tab))
    setSelectedRequestId(request.id)
    setSelectedFolderId(folderId)
    setExpandedFolders((current) => new Set(current).add(folderId))
  }

  function deleteItem(id: string) {
    if (isReadOnly) return
    const target = treeIndex.nodeById.get(id)
    if (!target) return

    const removedIds = new Set<string>()
    const collectIds = (node: ApiNode) => {
      removedIds.add(node.id)
      if (isFolder(node)) node.children.forEach(collectIds)
    }
    collectIds(target)

    const activeTabIndex = workspaceTabs.findIndex((tab) => workspaceTabKey(tab) === activeWorkspaceTabKey)
    const activeTab = activeTabIndex >= 0 ? workspaceTabs[activeTabIndex] : undefined
    const activeTabRemoved = Boolean(activeTab && removedIds.has(activeTab.id))
    const nextTree = removeNode(tree, target.id).nodes
    const nextTabs = workspaceTabs.filter((tab) => tab.kind === 'environment' || !removedIds.has(tab.id))
    const nextActiveTab = activeTabRemoved ? nextTabs[Math.min(activeTabIndex, nextTabs.length - 1)] : (activeTab ?? nextTabs[0])

    setTree(nextTree)
    setWorkspaceTabs(nextTabs)
    setActiveWorkspaceTabKey(nextActiveTab ? workspaceTabKey(nextActiveTab) : '')
    setExpandedFolders((current) => new Set([...current].filter((folderId) => !removedIds.has(folderId))))
    if (nextActiveTab?.kind === 'request' || nextActiveTab?.kind === 'docs') {
      setSelectedRequestId(nextActiveTab.id)
      setSelectedFolderId(findParentFolder(nextTree, nextActiveTab.id))
    } else {
      const fallbackRequestId = firstRequestId(nextTree)
      setSelectedRequestId(fallbackRequestId)
      setSelectedFolderId(fallbackRequestId ? findParentFolder(nextTree, fallbackRequestId) : (nextTree.find(isFolder)?.id ?? ''))
      if (nextActiveTab?.kind === 'environment') setActiveEnvironmentId(nextActiveTab.id)
    }
  }

  function moveItem(sourceId: string, targetId: string | null) {
    if (isReadOnly) return
    if (sourceId === targetId) return
    const source = treeIndex.nodeById.get(sourceId)
    if (!source || (targetId && containsId(source, targetId))) return
    const originalParent = treeIndex.parentFolderById.get(sourceId) ?? ''
    const target = targetId ? treeIndex.nodeById.get(targetId) : undefined
    const destination =
      target && isRequest(target) ? (treeIndex.parentFolderById.get(target.id) ?? '') : target && isFolder(target) ? target.id : ''
    if (sourceId === destination || (originalParent === destination && targetId === null)) return
    setTree((current) => {
      const removed = removeNode(current, sourceId)
      // Dropping on a request inserts before it; dropping on a folder appends to it.
      return insertNode(removed.nodes, source, targetId)
    })
    if (isRequest(source) && source.id === selectedRequestId) setSelectedFolderId(destination)
    if (isFolder(source)) setExpandedFolders((current) => new Set(current).add(source.id))
    if (target && isFolder(target)) setExpandedFolders((current) => new Set(current).add(target.id))
  }

  return { createFolderInTree, importTree, renameFolderInTree, selectFolder, toggleFolderExpanded, createRequest, deleteItem, moveItem }
}
