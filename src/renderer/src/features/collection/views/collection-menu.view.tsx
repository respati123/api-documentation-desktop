import type { ReactElement } from 'react'
import type { useCollectionTreeViewModel } from '@/features/collection/viewmodels/use-collection-tree.viewmodel'
import { styleWithVariables } from '@/shared/components/css-variables'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/ui'

export type CollectionMenuViewProps = NonNullable<ReturnType<typeof useCollectionTreeViewModel>['menu']>

// The right-click menu for the tree. The menu opens at the click point and closes when the user clicks outside it.
// Items depend on whether the target is a folder, a request, or the workspace root.
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
}: CollectionMenuViewProps): ReactElement {
  return (
    <DropdownMenu open onOpenChange={(open) => !open && onDismiss()}>
      <DropdownMenuTrigger asChild>
        <span
          aria-hidden="true"
          className="pointer-events-none fixed top-[var(--menu-y)] left-[var(--menu-x)] size-px"
          style={styleWithVariables({ '--menu-x': `${x}px`, '--menu-y': `${y}px` })}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" aria-label={label}>
        <DropdownMenuItem data-testid="collection-menu-create-folder" onSelect={onCreateFolder}>
          {createFolder}
        </DropdownMenuItem>
        <DropdownMenuItem data-testid="collection-menu-create-request" onSelect={onCreateRequest}>
          {createRequest}
        </DropdownMenuItem>
        {targetKind === 'folder' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-testid="collection-menu-rename" onSelect={onRename}>
              {renameFolder}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" data-testid="collection-menu-delete-folder" onSelect={onDelete}>
              {deleteFolder}
            </DropdownMenuItem>
          </>
        )}
        {targetKind === 'request' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-testid="collection-menu-duplicate-request" onSelect={onDuplicate}>
              {duplicateRequest}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" data-testid="collection-menu-delete-request" onSelect={onDelete}>
              {deleteRequest}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
