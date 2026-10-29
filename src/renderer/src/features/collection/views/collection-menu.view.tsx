import type { CSSProperties, ReactElement } from 'react'
import type { useCollectionTreeViewModel } from '@/features/collection/viewmodels/use-collection-tree.viewmodel'

export type CollectionMenuViewProps = NonNullable<ReturnType<typeof useCollectionTreeViewModel>['menu']>

// The right-click and actions menu for the tree. Items depend on whether the target is a folder, a request, or the workspace root.
export function CollectionMenuView({
  x,
  y,
  targetKind,
  label,
  createFolder,
  createRequest,
  renameFolder,
  deleteFolder,
  deleteRequest,
  onCreateFolder,
  onCreateRequest,
  onRename,
  onDelete,
  onDismiss,
  onKey,
}: CollectionMenuViewProps): ReactElement {
  return (
    <>
      <div className="context-menu-dismiss" aria-hidden="true" onMouseDown={onDismiss} />
      <div className="tree-context-menu" role="menu" aria-label={label} style={{ left: x, top: y } as CSSProperties} onKeyDown={onKey}>
        {/* biome-ignore lint/a11y/noAutofocus: an open menu moves focus to its first item, as the menu pattern expects */}
        <button type="button" role="menuitem" autoFocus onClick={onCreateFolder}>
          <span aria-hidden="true">＋</span>
          {createFolder}
        </button>
        <button type="button" role="menuitem" onClick={onCreateRequest}>
          <span aria-hidden="true">↳</span>
          {createRequest}
        </button>
        {targetKind === 'folder' && (
          <>
            {/* biome-ignore lint/a11y/useSemanticElements: a menu divider uses the separator role inside the menu */}
            <div className="tree-context-menu-divider" role="separator" />
            <button type="button" role="menuitem" onClick={onRename}>
              <span aria-hidden="true">✎</span>
              {renameFolder}
            </button>
            <button type="button" role="menuitem" className="context-menu-danger" onClick={onDelete}>
              <span aria-hidden="true">×</span>
              {deleteFolder}
            </button>
          </>
        )}
        {targetKind === 'request' && (
          <>
            {/* biome-ignore lint/a11y/useSemanticElements: a menu divider uses the separator role inside the menu */}
            <div className="tree-context-menu-divider" role="separator" />
            <button type="button" role="menuitem" className="context-menu-danger" onClick={onDelete}>
              <span aria-hidden="true">×</span>
              {deleteRequest}
            </button>
          </>
        )}
      </div>
    </>
  )
}
