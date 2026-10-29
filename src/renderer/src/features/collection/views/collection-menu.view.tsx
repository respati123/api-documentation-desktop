import type { CSSProperties, ReactElement } from 'react'
import type { useCollectionTreeViewModel } from '@/features/collection/viewmodels/use-collection-tree.viewmodel'
import { Button } from '@/shared/components/ui/button'

// Menu items keep the context menu's own styling. The shadcn base sizing and weight are reset here.
const MENU_ITEM = 'h-auto justify-start font-normal focus-visible:ring-0'

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
      <div
        className="tree-context-menu"
        role="menu"
        aria-label={label}
        style={{ left: x, top: y } satisfies CSSProperties}
        onKeyDown={onKey}
      >
        <Button
          type="button"
          variant="ghost"
          role="menuitem"
          className={MENU_ITEM}
          data-testid="collection-menu-create-folder"
          autoFocus
          onClick={onCreateFolder}
        >
          <span aria-hidden="true">＋</span>
          {createFolder}
        </Button>
        <Button
          type="button"
          variant="ghost"
          role="menuitem"
          className={MENU_ITEM}
          data-testid="collection-menu-create-request"
          onClick={onCreateRequest}
        >
          <span aria-hidden="true">↳</span>
          {createRequest}
        </Button>
        {targetKind === 'folder' && (
          <>
            {/* biome-ignore lint/a11y/useSemanticElements: a menu divider uses the separator role inside the menu */}
            <div className="tree-context-menu-divider" role="separator" />
            <Button
              type="button"
              variant="ghost"
              role="menuitem"
              className={MENU_ITEM}
              data-testid="collection-menu-rename"
              onClick={onRename}
            >
              <span aria-hidden="true">✎</span>
              {renameFolder}
            </Button>
            <Button
              type="button"
              variant="ghost"
              role="menuitem"
              className={`${MENU_ITEM} context-menu-danger`}
              data-testid="collection-menu-delete-folder"
              onClick={onDelete}
            >
              <span aria-hidden="true">×</span>
              {deleteFolder}
            </Button>
          </>
        )}
        {targetKind === 'request' && (
          <>
            {/* biome-ignore lint/a11y/useSemanticElements: a menu divider uses the separator role inside the menu */}
            <div className="tree-context-menu-divider" role="separator" />
            <Button
              type="button"
              variant="ghost"
              role="menuitem"
              className={`${MENU_ITEM} context-menu-danger`}
              data-testid="collection-menu-delete-request"
              onClick={onDelete}
            >
              <span aria-hidden="true">×</span>
              {deleteRequest}
            </Button>
          </>
        )}
      </div>
    </>
  )
}
