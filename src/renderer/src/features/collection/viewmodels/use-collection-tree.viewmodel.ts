import { type DragEvent, type FormEvent, type KeyboardEvent, type MouseEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { COLLECTION_TEXT } from '@/features/collection/constants/collection-text.constants'
import {
  contextMenuHeight,
  menuPositionAtAnchor,
  menuPositionAtKeyboard,
  menuPositionAtPointer,
} from '@/features/collection/lib/context-menu-position'
import { indexTree, isFolder } from '@/features/collection/lib/tree'
import type { ContextMenuState, DeleteTarget, TreeChange, TreeRow } from '@/features/collection/models/collection-tree.model'
import { changeStatusCode, changeStatusKey } from '@/features/sync'
import type { WorkspaceChange } from '@/lib/workspace-changes'
import type { ApiNode } from '@/shared/models/api-node.model'

export type CollectionActions = {
  selectFolder: (folderId: string) => void
  toggleFolderExpanded: (folderId: string) => void
  openRequest: (requestId: string) => void
  openDocs: (requestId: string) => void
  createFolder: (parentId: string, name: string) => void
  createRequest: (folderId: string) => void
  renameFolder: (folderId: string, name: string) => void
  deleteItem: (id: string) => void
  moveItem: (sourceId: string, targetId: string | null) => void
}

export type CollectionInput = {
  tree: ApiNode[]
  isReadOnly: boolean
  selectedRequestId: string
  selectedFolderId: string
  activeTabKind: 'request' | 'docs' | 'environment' | null
  expandedFolders: Set<string>
  changes: ReadonlyMap<string, WorkspaceChange>
  actions: CollectionActions
}

const viewport = () => ({ width: window.innerWidth, height: window.innerHeight })

// Owns the collection tree's interaction state: the context menu, the create and delete dialogs, rename, and drag.
// The tree itself and what a change means stay with the workspace; this only asks for actions.
export function useCollectionTreeViewModel(input: CollectionInput) {
  const { t } = useTranslation('collection')
  const { tree, isReadOnly, actions } = input
  const treeIndex = indexTree(tree)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [folderParentId, setFolderParentId] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [renamingFolderId, setRenamingFolderId] = useState('')
  const [renameDraft, setRenameDraft] = useState('')
  const [renameCancelled, setRenameCancelled] = useState(false)

  const changeOf = (id: string, name: string): TreeChange | null => {
    const change = input.changes.get(id)
    if (!change) return null
    return {
      status: change.status,
      code: changeStatusCode(change.status),
      label: `${t(changeStatusKey(change.status), { ns: 'sync' })}: ${name}`,
    }
  }

  function buildRows(nodes: ApiNode[], depth: number): TreeRow[] {
    return nodes.map((node): TreeRow => {
      if (isFolder(node)) {
        const expanded = input.expandedFolders.has(node.id)
        return {
          kind: 'folder',
          id: node.id,
          name: node.name,
          depth,
          expanded,
          selected: input.selectedFolderId === node.id,
          dragging: draggedId === node.id,
          renaming: renamingFolderId === node.id,
          requestCount: treeIndex.requestCountByFolderId.get(node.id) ?? 0,
          change: changeOf(node.id, node.name),
          isEmpty: node.children.length === 0,
          children: expanded ? buildRows(node.children, depth + 1) : [],
        }
      }
      return {
        kind: 'request',
        id: node.id,
        name: node.name,
        method: node.method,
        depth,
        selected: (input.activeTabKind === 'request' || input.activeTabKind === 'docs') && input.selectedRequestId === node.id,
        dragging: draggedId === node.id,
        change: changeOf(node.id, node.name),
      }
    })
  }

  // The request count shown in the folder delete text.
  const deleteCount = deleteTarget?.kind === 'folder' ? (treeIndex.requestCountByFolderId.get(deleteTarget.id) ?? 0) : 0

  function targetKindOf(targetId: string | null): 'folder' | 'request' | null {
    if (!targetId) return null
    const target = treeIndex.nodeById.get(targetId)
    return target && isFolder(target) ? 'folder' : 'request'
  }

  function openAtPointer(event: MouseEvent<HTMLElement>, parentFolderId: string, targetNodeId: string | null) {
    event.preventDefault()
    event.stopPropagation()
    const kind = targetKindOf(targetNodeId)
    const position = menuPositionAtPointer({ x: event.clientX, y: event.clientY }, contextMenuHeight(kind), viewport())
    setContextMenu({ ...position, parentFolderId, targetNodeId, targetKind: kind })
  }

  function openFromAnchor(event: MouseEvent<HTMLElement>, parentFolderId: string, targetNodeId: string | null) {
    event.preventDefault()
    event.stopPropagation()
    const kind = targetKindOf(targetNodeId)
    const rect = event.currentTarget.getBoundingClientRect()
    const position = menuPositionAtAnchor(rect, contextMenuHeight(kind), viewport())
    setContextMenu({ ...position, parentFolderId, targetNodeId, targetKind: kind })
  }

  function openFromKeyboard(event: KeyboardEvent<HTMLElement>, parentFolderId: string, targetNodeId: string | null) {
    if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return
    event.preventDefault()
    const kind = targetKindOf(targetNodeId)
    const rect = event.currentTarget.getBoundingClientRect()
    const position = menuPositionAtKeyboard(rect, contextMenuHeight(kind), viewport())
    setContextMenu({ ...position, parentFolderId, targetNodeId, targetKind: kind })
  }

  function openCreateFolder(parentId: string) {
    setContextMenu(null)
    setFolderParentId(parentId)
    actions.selectFolder(parentId)
    setFolderName('')
    setFolderDialogOpen(true)
  }

  function handleCreateFolder(event: FormEvent) {
    event.preventDefault()
    if (isReadOnly) return
    const name = folderName.trim()
    if (!name) return
    actions.createFolder(folderParentId, name)
    setFolderName('')
    setFolderDialogOpen(false)
  }

  function handleCreateRequestFromMenu() {
    if (!contextMenu) return
    const { parentFolderId } = contextMenu
    setContextMenu(null)
    actions.createRequest(parentFolderId)
  }

  function handleRenameFromMenu() {
    if (!contextMenu?.targetNodeId) return
    const folder = treeIndex.nodeById.get(contextMenu.targetNodeId)
    if (!folder || !isFolder(folder)) return
    setRenameDraft(folder.name)
    setRenamingFolderId(folder.id)
    setContextMenu(null)
  }

  function handleDeleteFromMenu() {
    if (!contextMenu?.targetNodeId) return
    const target = treeIndex.nodeById.get(contextMenu.targetNodeId)
    if (!target) return
    setDeleteTarget({ id: target.id, kind: target.kind, name: target.name })
    setContextMenu(null)
  }

  function handleConfirmDelete() {
    if (isReadOnly || !deleteTarget) return
    if (treeIndex.nodeById.has(deleteTarget.id)) actions.deleteItem(deleteTarget.id)
    setDeleteTarget(null)
  }

  function commitRename(folderId: string) {
    const name = renameDraft.trim()
    if (name) actions.renameFolder(folderId, name)
    setRenamingFolderId('')
    setRenameDraft('')
  }

  function cancelRename() {
    setRenameCancelled(true)
    setRenamingFolderId('')
    setRenameDraft('')
  }

  // Blur after Escape must not commit the rename, so the flag is read once and cleared.
  function handleRenameBlur(folderId: string) {
    if (renameCancelled) {
      setRenameCancelled(false)
      return
    }
    commitRename(folderId)
  }

  function handleDrop(event: DragEvent, targetId: string | null) {
    event.preventDefault()
    event.stopPropagation()
    const sourceId = event.dataTransfer.getData('text/plain') || draggedId
    if (sourceId) actions.moveItem(sourceId, targetId)
    setDraggedId(null)
  }

  function dragStart(id: string, event: DragEvent) {
    event.dataTransfer.setData('text/plain', id)
    event.dataTransfer.effectAllowed = 'move'
    setDraggedId(id)
  }

  function allowDrop(event: DragEvent) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  // Arrow keys move focus through the menu items, and Escape closes the menu.
  function handleMenuKey(event: KeyboardEvent<HTMLElement>): void {
    if (event.key === 'Escape') {
      setContextMenu(null)
      return
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'))
    const active = document.activeElement
    const activeIndex = items.findIndex((item) => item === active)
    event.preventDefault()
    const direction = event.key === 'ArrowDown' ? 1 : -1
    items[(activeIndex + direction + items.length) % items.length]?.focus()
  }

  const menu =
    contextMenu && !isReadOnly
      ? {
          x: contextMenu.x,
          y: contextMenu.y,
          targetKind: contextMenu.targetKind,
          label: t(COLLECTION_TEXT.tree.menuLabel),
          createFolder: t(COLLECTION_TEXT.menu.createFolder),
          createRequest: t(COLLECTION_TEXT.menu.createRequest),
          renameFolder: t(COLLECTION_TEXT.menu.renameFolder),
          deleteFolder: t(COLLECTION_TEXT.menu.deleteFolder),
          deleteRequest: t(COLLECTION_TEXT.menu.deleteRequest),
          onCreateFolder: () => openCreateFolder(contextMenu.parentFolderId),
          onCreateRequest: handleCreateRequestFromMenu,
          onRename: handleRenameFromMenu,
          onDelete: handleDeleteFromMenu,
          onDismiss: () => setContextMenu(null),
          onKey: handleMenuKey,
        }
      : null

  const folderParentName = folderParentId
    ? (treeIndex.nodeById.get(folderParentId)?.name ?? t(COLLECTION_TEXT.createDialog.selectedFolder))
    : t(COLLECTION_TEXT.createDialog.workspaceName)

  return {
    rows: buildRows(tree, 0),
    isEmpty: tree.length === 0,
    draggedId,
    readOnly: isReadOnly,
    labels: {
      empty: t(COLLECTION_TEXT.tree.empty),
      emptyFolder: t(COLLECTION_TEXT.tree.emptyFolder),
      folderNameLabel: t(COLLECTION_TEXT.tree.folderNameLabel),
      workspaceActions: t(COLLECTION_TEXT.tree.workspaceActions),
      actionsFor: (name: string) => t(COLLECTION_TEXT.tree.actionsFor, { name }),
      newRequestIn: (name: string) => t(COLLECTION_TEXT.tree.newRequestIn, { name }),
    },
    rename: {
      draft: renameDraft,
      onDraftChange: setRenameDraft,
      onCommit: commitRename,
      onCancel: cancelRename,
      onBlur: handleRenameBlur,
    },
    menu,
    folderDialog: {
      open: folderDialogOpen,
      onOpenChange: setFolderDialogOpen,
      title: t(COLLECTION_TEXT.createDialog.title),
      description: t(COLLECTION_TEXT.createDialog.description, { parent: folderParentName }),
      label: t(COLLECTION_TEXT.createDialog.label),
      placeholder: t(COLLECTION_TEXT.createDialog.placeholder),
      submit: t(COLLECTION_TEXT.createDialog.submit),
      name: folderName,
      canSubmit: folderName.trim() !== '',
      onNameChange: setFolderName,
      onSubmit: handleCreateFolder,
    },
    deleteDialog: {
      open: deleteTarget !== null,
      onOpenChange: (open: boolean) => {
        if (!open) setDeleteTarget(null)
      },
      title: deleteTarget?.kind === 'folder' ? t(COLLECTION_TEXT.deleteDialog.folderTitle) : t(COLLECTION_TEXT.deleteDialog.requestTitle),
      description:
        deleteTarget?.kind === 'folder'
          ? t(COLLECTION_TEXT.deleteDialog.folderDescription, { name: deleteTarget.name, count: deleteCount })
          : t(COLLECTION_TEXT.deleteDialog.requestDescription, {
              name: deleteTarget?.name ?? t(COLLECTION_TEXT.deleteDialog.requestFallbackName),
            }),
      cancel: t(COLLECTION_TEXT.deleteDialog.cancel),
      confirm:
        deleteTarget?.kind === 'folder' ? t(COLLECTION_TEXT.deleteDialog.confirmFolder) : t(COLLECTION_TEXT.deleteDialog.confirmRequest),
      onCancel: () => setDeleteTarget(null),
      onConfirm: handleConfirmDelete,
    },
    handlers: {
      selectFolder: actions.selectFolder,
      toggleFolder: (folderId: string) => {
        actions.selectFolder(folderId)
        actions.toggleFolderExpanded(folderId)
      },
      openRequest: (requestId: string) => (input.activeTabKind === 'docs' ? actions.openDocs(requestId) : actions.openRequest(requestId)),
      createRequestIn: (folderId: string) => actions.createRequest(folderId),
      createFolderIn: (folderId: string) => openCreateFolder(folderId),
      openFolderMenu: (event: MouseEvent<HTMLElement>, folderId: string) => openAtPointer(event, folderId, folderId),
      openRequestMenu: (event: MouseEvent<HTMLElement>, requestId: string) =>
        openAtPointer(event, treeIndex.parentFolderById.get(requestId) ?? '', requestId),
      openFolderDropdown: (event: MouseEvent<HTMLElement>, folderId: string) => openFromAnchor(event, folderId, folderId),
      openRequestDropdown: (event: MouseEvent<HTMLElement>, requestId: string) =>
        openFromAnchor(event, treeIndex.parentFolderById.get(requestId) ?? '', requestId),
      openRootDropdown: (event: MouseEvent<HTMLElement>) => openFromAnchor(event, '', null),
      openRootContext: (event: MouseEvent<HTMLElement>) => openAtPointer(event, '', null),
      openRootKeyboard: (event: KeyboardEvent<HTMLElement>) => openFromKeyboard(event, '', null),
      openFolderKeyboard: (event: KeyboardEvent<HTMLElement>, folderId: string) => openFromKeyboard(event, folderId, folderId),
      openRequestKeyboard: (event: KeyboardEvent<HTMLElement>, requestId: string) =>
        openFromKeyboard(event, treeIndex.parentFolderById.get(requestId) ?? '', requestId),
      dragStart,
      dragEnd: () => setDraggedId(null),
      allowDrop,
      drop: handleDrop,
    },
  }
}
