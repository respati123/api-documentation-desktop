// What the tree view draws. The ViewModel builds these so the view has no decisions to make.
export type TreeChange = { status: string; code: string; label: string }

export type FolderRow = {
  kind: 'folder'
  id: string
  name: string
  depth: number
  expanded: boolean
  selected: boolean
  dragging: boolean
  renaming: boolean
  requestCount: number
  change: TreeChange | null
  isEmpty: boolean
  children: TreeRow[]
}

export type RequestRow = {
  kind: 'request'
  id: string
  name: string
  method: string
  depth: number
  selected: boolean
  dragging: boolean
  change: TreeChange | null
}

export type TreeRow = FolderRow | RequestRow

export type ContextMenuTarget = 'folder' | 'request' | null

export type ContextMenuState = { x: number; y: number; parentFolderId: string; targetNodeId: string | null; targetKind: ContextMenuTarget }

export type DeleteTarget = { id: string; kind: 'folder' | 'request'; name: string }
