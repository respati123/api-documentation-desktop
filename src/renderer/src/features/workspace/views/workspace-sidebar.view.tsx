import { Check, Folder, Globe, MoreHorizontal, Plus } from 'lucide-react'
import type { KeyboardEvent, PointerEvent, ReactElement } from 'react'
import { CollectionTreeView, CreateFolderDialogView, type useCollectionTreeViewModel } from '@/features/collection'
import { SyncFooterView, type useSyncFooterViewModel } from '@/features/sync'
import type { useWorkspaceSidebarViewModel } from '@/features/workspace/viewmodels/use-workspace-sidebar.viewmodel'
import { NO_ENVIRONMENT, type useWorkspaceTabbarViewModel } from '@/features/workspace/viewmodels/use-workspace-tabbar.viewmodel'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/utils/cn'

type SidebarViewModel = ReturnType<typeof useWorkspaceSidebarViewModel>
type CollectionViewModel = ReturnType<typeof useCollectionTreeViewModel>
type SyncFooterViewModel = ReturnType<typeof useSyncFooterViewModel>
type EnvironmentViewModel = ReturnType<typeof useWorkspaceTabbarViewModel>['environment']
type SidebarPanel = SidebarViewModel['panel']

export type SidebarResizeHandlers = {
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
}

// The fixed icon strip on the left of the sidebar. It picks which panel the sidebar shows.
function ActivityBarView({ sidebar }: { sidebar: SidebarViewModel }): ReactElement {
  const tabs: { key: SidebarPanel; icon: typeof Folder; label: string }[] = [
    { key: 'collections', icon: Folder, label: sidebar.panelTabs.collections },
    { key: 'environments', icon: Globe, label: sidebar.panelTabs.environments },
  ]
  return (
    <nav
      aria-label={sidebar.label}
      className="flex flex-none flex-col items-center gap-2 bg-background px-2 py-6 max-[720px]:flex-row max-[720px]:py-4"
    >
      {tabs.map(({ key, icon: Icon, label }) => {
        const active = sidebar.panel === key
        return (
          <Button
            key={key}
            type="button"
            variant={active ? 'secondary' : 'ghost'}
            size="icon"
            className={cn('size-9', active && 'text-foreground')}
            aria-label={label}
            aria-pressed={active}
            title={label}
            data-testid={`workspace-sidebar-tab-${key}`}
            onClick={() => sidebar.onSelectPanel(key)}
          >
            <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
          </Button>
        )
      })}
    </nav>
  )
}

// Environments of the active workspace. A row selects the environment; its menu sets it active, renames it, duplicates it, or deletes it.
function EnvironmentsPanelView({ sidebar, environment }: { sidebar: SidebarViewModel; environment: EnvironmentViewModel }): ReactElement {
  const actions = sidebar.environmentActions
  const named = environment.options.filter((option) => option.value !== NO_ENVIRONMENT)
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-2 mb-2 flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h1 className="text-[12px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">{sidebar.environmentsHeading}</h1>
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums" data-testid="workspace-sidebar-environment-count">
            {named.length}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label={actions.newName}
          title={actions.newName}
          disabled={!actions.canCreate}
          data-testid="workspace-sidebar-add-environment"
          onClick={actions.create}
        >
          <Plus size={16} strokeWidth={1.8} aria-hidden="true" />
        </Button>
      </div>

      <div
        className="grid min-h-0 flex-1 content-start gap-0 overflow-y-auto px-0 py-0"
        role="listbox"
        aria-label={sidebar.environmentsHeading}
      >
        {environment.options.map((option) => {
          const active = option.value === environment.value
          const viewing = option.value === actions.viewingId
          if (option.value === NO_ENVIRONMENT) {
            return (
              <div
                key={option.value}
                className={cn(
                  'flex min-h-[34px] items-center rounded-md px-2 text-[13px] text-muted-foreground',
                  active && 'font-semibold text-foreground',
                )}
                data-testid="workspace-sidebar-environment-item"
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {active && <Check size={14} strokeWidth={2} className="shrink-0 text-primary" aria-hidden="true" />}
              </div>
            )
          }
          const isRenaming = actions.renaming?.id === option.value
          return (
            <div key={option.value} className={cn('flex min-h-[34px] items-center gap-0 rounded-md', viewing && 'bg-muted')}>
              {isRenaming ? (
                <Input
                  autoFocus
                  maxLength={100}
                  aria-label={actions.labels.rename}
                  value={actions.renaming?.draft ?? ''}
                  onChange={(event) => actions.onRenameDraft(event.target.value)}
                  onBlur={actions.commitRename}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') actions.commitRename()
                    if (event.key === 'Escape') actions.cancelRename()
                  }}
                  className="mx-2 h-[30px] min-h-[30px] flex-1 text-[13px]"
                  data-testid="workspace-sidebar-environment-rename"
                />
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  role="option"
                  aria-selected={viewing}
                  disabled={environment.disabled}
                  data-testid="workspace-sidebar-environment-item"
                  onClick={() => actions.view(option.value)}
                  className={cn(
                    'h-auto min-h-[34px] min-w-0 flex-1 justify-start rounded-md px-2 text-left text-[13px] font-normal text-foreground focus-visible:ring-0',
                    active && 'font-semibold',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {active && <Check size={14} strokeWidth={2} className="shrink-0 text-primary" aria-hidden="true" />}
                </Button>
              )}
              {!isRenaming && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-muted-foreground focus-visible:ring-0"
                      aria-label={`${actions.labels.actions}: ${option.label}`}
                      data-testid="workspace-sidebar-environment-menu"
                    >
                      <MoreHorizontal size={16} strokeWidth={1.8} aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      disabled={active}
                      data-testid="workspace-sidebar-environment-set-active"
                      onSelect={() => actions.setActive(option.value)}
                    >
                      {actions.labels.setActive}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      data-testid="workspace-sidebar-environment-rename-action"
                      onSelect={() => actions.startRename(option.value, option.label)}
                    >
                      {actions.labels.rename}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      data-testid="workspace-sidebar-environment-duplicate"
                      onSelect={() => actions.duplicate(option.value)}
                    >
                      {actions.labels.duplicate}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      data-testid="workspace-sidebar-environment-delete"
                      onSelect={() => actions.remove(option.value)}
                    >
                      {actions.labels.remove}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )
        })}
        {named.length === 0 && (
          <p className="mx-2 mt-2 text-[13px] leading-[1.6] text-muted-foreground" data-testid="workspace-sidebar-environment-empty">
            {sidebar.noEnvironments}
          </p>
        )}
      </div>
    </div>
  )
}

export function WorkspaceSidebarView({
  sidebar,
  collection,
  syncFooter,
  environment,
  resize,
}: {
  sidebar: SidebarViewModel
  collection: CollectionViewModel
  syncFooter: SyncFooterViewModel
  environment: EnvironmentViewModel
  resize: SidebarResizeHandlers
}): ReactElement {
  const collectionsShown = sidebar.panel === 'collections'
  return (
    <>
      <aside
        className="flex min-h-0 min-w-0 flex-row overflow-visible bg-card max-[720px]:h-[320px] max-[720px]:max-h-[320px] max-[720px]:border-b max-[720px]:border-border"
        aria-label={sidebar.label}
      >
        <ActivityBarView sidebar={sidebar} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col pr-4 py-6 pl-2 max-[720px]:px-2 max-[720px]:py-4">
          {collectionsShown ? (
            <>
              <div className="mx-2 mb-4 flex items-start justify-between gap-4 max-[720px]:mb-4">
                <h1 className="text-[20px] font-bold tracking-[-0.03em]">{sidebar.heading}</h1>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-[40px] w-[36px] min-h-0 shrink-0 rounded-[7px] border border-transparent px-0 text-[17px] leading-none font-normal text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground focus-visible:ring-0 disabled:opacity-100"
                  aria-label={sidebar.menuButton.label}
                  aria-haspopup="menu"
                  data-testid="workspace-sidebar-menu-trigger"
                  disabled={sidebar.menuButton.disabled}
                  onClick={collection.handlers.openRootDropdown}
                >
                  {sidebar.menuButton.icon}
                </Button>
                <CreateFolderDialogView folderDialog={collection.folderDialog} />
              </div>

              <nav
                className="grid min-h-0 min-w-0 flex-1 content-start gap-0 overflow-y-auto pr-0"
                aria-label={sidebar.foldersLabel}
                onDragOver={collection.handlers.allowDrop}
                onDrop={(event) => collection.handlers.drop(event, null)}
                onContextMenu={collection.handlers.openRootContext}
                onKeyDown={collection.handlers.openRootKeyboard}
              >
                <CollectionTreeView {...collection} />
              </nav>
            </>
          ) : (
            <EnvironmentsPanelView sidebar={sidebar} environment={environment} />
          )}
          <SyncFooterView {...syncFooter} />
        </div>
      </aside>

      {/* biome-ignore lint/a11y/useSemanticElements: a resizer needs a separator with value controls, which hr does not offer */}
      <div
        className="relative z-[3] col-start-2 row-start-2 w-2 cursor-col-resize touch-none bg-transparent hover:bg-primary/30 focus-visible:bg-primary/30 focus-visible:outline-none max-[720px]:hidden"
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
