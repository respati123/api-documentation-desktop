import type { KeyboardEvent, PointerEvent, ReactElement } from 'react'
import { CollectionTreeView, CreateFolderDialogView, type useCollectionTreeViewModel, WorkspaceStorageIcon } from '@/features/collection'
import { SyncFooterView, type useSyncFooterViewModel } from '@/features/sync'
import type { useWorkspaceSidebarViewModel } from '@/features/workspace/viewmodels/use-workspace-sidebar.viewmodel'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'

type SidebarViewModel = ReturnType<typeof useWorkspaceSidebarViewModel>
type CollectionViewModel = ReturnType<typeof useCollectionTreeViewModel>
type SyncFooterViewModel = ReturnType<typeof useSyncFooterViewModel>

export type SidebarResizeHandlers = {
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
}

export function WorkspaceSidebarView({
  sidebar,
  collection,
  syncFooter,
  resize,
}: {
  sidebar: SidebarViewModel
  collection: CollectionViewModel
  syncFooter: SyncFooterViewModel
  resize: SidebarResizeHandlers
}): ReactElement {
  const picker = sidebar.picker
  return (
    <>
      <aside className="sidebar" aria-label={sidebar.label}>
        <div className="sidebar-heading">
          <div>
            <p className="sidebar-kicker">{sidebar.kicker}</p>
            <h1>{sidebar.heading}</h1>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="openapi-trigger"
            data-testid="workspace-sidebar-openapi-button"
            onClick={sidebar.onOpenApi}
          >
            {sidebar.openApiLabel}
          </Button>
          <CreateFolderDialogView folderDialog={collection.folderDialog} />
        </div>

        <nav
          className="tree-list"
          aria-label={sidebar.foldersLabel}
          onDragOver={collection.handlers.allowDrop}
          onDrop={(event) => collection.handlers.drop(event, null)}
        >
          <div className="workspace-root-line">
            <Select value={picker.value} onValueChange={picker.onChange}>
              <SelectTrigger
                aria-label={picker.ariaLabel}
                className="workspace-root-select"
                data-testid="workspace-sidebar-picker"
                onContextMenu={collection.handlers.openRootContext}
                onKeyDown={collection.handlers.openRootKeyboard}
                onDragOver={collection.handlers.allowDrop}
                onDrop={(event) => collection.handlers.drop(event, null)}
              >
                <SelectValue className="workspace-root-name" placeholder={picker.placeholder}>
                  {picker.selected && (
                    <span className="workspace-selected-value">
                      <WorkspaceStorageIcon kind={picker.selected.kind} />
                      <span className="workspace-selected-name">{picker.selected.name}</span>
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="workspace-select-content">
                {picker.options.map((option) => (
                  <SelectItem key={option.id} value={option.id} textValue={option.textValue}>
                    <span className="workspace-option">
                      <WorkspaceStorageIcon kind={option.kind} className="workspace-option-icon" />
                      <span className="workspace-option-name">{option.name}</span>
                      <small className="workspace-option-meta">{option.storage}</small>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              className="tree-menu-trigger workspace-menu-trigger min-h-0 px-0 font-normal focus-visible:ring-0 disabled:opacity-100"
              aria-label={sidebar.menuButton.label}
              aria-haspopup="menu"
              data-testid="workspace-sidebar-menu-trigger"
              disabled={sidebar.menuButton.disabled}
              onClick={collection.handlers.openRootDropdown}
            >
              {sidebar.menuButton.icon}
            </Button>
          </div>
          <CollectionTreeView {...collection} />
        </nav>
        <SyncFooterView {...syncFooter} />
      </aside>

      {/* biome-ignore lint/a11y/useSemanticElements: a resizer needs a separator with value controls, which hr does not offer */}
      <div
        className="sidebar-resizer"
        role="separator"
        aria-label={sidebar.resizer.label}
        aria-orientation="vertical"
        aria-valuemin={sidebar.resizer.min}
        aria-valuemax={sidebar.resizer.max}
        aria-valuenow={sidebar.resizer.now}
        aria-valuetext={sidebar.resizer.text}
        tabIndex={0}
        onPointerDown={resize.onPointerDown}
        onPointerMove={resize.onPointerMove}
        onPointerUp={resize.onPointerUp}
        onPointerCancel={resize.onPointerUp}
        onLostPointerCapture={resize.onPointerUp}
        onKeyDown={resize.onKeyDown}
      />
    </>
  )
}
