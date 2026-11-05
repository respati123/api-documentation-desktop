import type { CSSProperties, ReactElement } from 'react'
import type { useCollectionTreeViewModel } from '@/features/collection/viewmodels/use-collection-tree.viewmodel'
import { CONTEXT_MENU_PANEL, CONTEXT_MENU_SEPARATOR, CONTEXT_MENU_ITEM as MENU_ITEM } from '@/shared/components/context-menu'
import { Button } from '@/shared/components/ui/button'

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
  duplicateRequest,
  onCreateFolder,
  onCreateRequest,
  onRename,
  onDuplicate,
  onDelete,
  onDismiss,
  onKey,
}: CollectionMenuViewProps): ReactElement {
  return (
    <>
      <div className="fixed inset-0 z-[70]" aria-hidden="true" onMouseDown={onDismiss} />
      <div
        className={`fixed z-[71] ${CONTEXT_MENU_PANEL}`}
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
          {createRequest}
        </Button>
        {targetKind === 'folder' && (
          <>
            {/* biome-ignore lint/a11y/useSemanticElements: a menu divider uses the separator role inside the menu */}
            <div className={CONTEXT_MENU_SEPARATOR} role="separator" />
            <Button
              type="button"
              variant="ghost"
              role="menuitem"
              className={MENU_ITEM}
              data-testid="collection-menu-rename"
              onClick={onRename}
            >
              {renameFolder}
            </Button>
            <Button
              type="button"
              variant="ghost"
              role="menuitem"
              className={MENU_ITEM}
              data-testid="collection-menu-delete-folder"
              onClick={onDelete}
            >
              {deleteFolder}
            </Button>
          </>
        )}
        {targetKind === 'request' && (
          <>
            {/* biome-ignore lint/a11y/useSemanticElements: a menu divider uses the separator role inside the menu */}
            <div className={CONTEXT_MENU_SEPARATOR} role="separator" />
            <Button
              type="button"
              variant="ghost"
              role="menuitem"
              className={MENU_ITEM}
              data-testid="collection-menu-duplicate-request"
              onClick={onDuplicate}
            >
              {duplicateRequest}
            </Button>
            <Button
              type="button"
              variant="ghost"
              role="menuitem"
              className={MENU_ITEM}
              data-testid="collection-menu-delete-request"
              onClick={onDelete}
            >
              {deleteRequest}
            </Button>
          </>
        )}
      </div>
    </>
  )
}
