import type { KeyboardEvent, PointerEvent, ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { CollectionTreeView, CreateFolderDialogView, type useCollectionTreeViewModel } from '@/features/collection'
import { VARIABLES_TEXT } from '@/features/variables'
import type { useWorkspaceSidebarViewModel } from '@/features/workspace/viewmodels/use-workspace-sidebar.viewmodel'
import { NO_ENVIRONMENT, type useWorkspaceTabbarViewModel } from '@/features/workspace/viewmodels/use-workspace-tabbar.viewmodel'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EnvironmentRow,
  Icon,
  Input,
  RequestRow,
  SidePanel,
} from '@/shared/ui'

type SidebarViewModel = ReturnType<typeof useWorkspaceSidebarViewModel>
type CollectionViewModel = ReturnType<typeof useCollectionTreeViewModel>
type EnvironmentViewModel = ReturnType<typeof useWorkspaceTabbarViewModel>['environment']

export type SidebarResizeHandlers = {
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
}

// Environments of the active workspace. A row opens the environment; its menu sets it active, renames it, duplicates it, or deletes it.
function EnvironmentsPanelView({ sidebar, environment }: { sidebar: SidebarViewModel; environment: EnvironmentViewModel }): ReactElement {
  const { t } = useTranslation('variables')
  const actions = sidebar.environmentActions
  const named = environment.options.filter((option) => option.value !== NO_ENVIRONMENT)
  if (named.length === 0) {
    return (
      <p className="px-2 py-4 text-muted-foreground" data-testid="workspace-sidebar-environment-empty">
        {sidebar.noEnvironments}
      </p>
    )
  }
  return (
    <div className="grid min-h-0 content-start gap-0.5" role="listbox" aria-label={sidebar.environmentsHeading}>
      {named.map((option) => {
        const active = option.value === environment.value
        const viewing = option.value === actions.viewingId
        const isRenaming = actions.renaming?.id === option.value
        if (isRenaming) {
          return (
            <Input
              key={option.value}
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
              data-testid="workspace-sidebar-environment-rename"
            />
          )
        }
        return (
          <EnvironmentRow
            key={option.value}
            name={option.label}
            isActive={active}
            selected={viewing}
            activeLabel={t(VARIABLES_TEXT.environments.active)}
            testId="workspace-sidebar-environment-item"
            disabled={environment.disabled}
            onSelect={() => actions.view(option.value)}
            trailing={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="row-actions"
                    aria-label={`${actions.labels.actions}: ${option.label}`}
                    data-testid="workspace-sidebar-environment-menu"
                  >
                    <Icon name="more" />
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
                  <DropdownMenuItem data-testid="workspace-sidebar-environment-duplicate" onSelect={() => actions.duplicate(option.value)}>
                    {actions.labels.duplicate}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    data-testid="workspace-sidebar-environment-delete"
                    onSelect={() => actions.remove(option.value)}
                  >
                    {actions.labels.remove}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          />
        )
      })}
    </div>
  )
}

// The requests sent in this session, newest first.
function HistoryPanelView({ history }: { history: SidebarViewModel['history'] }): ReactElement {
  if (history.rows.length === 0)
    return (
      <p className="px-2 py-4 text-muted-foreground" data-testid="workspace-sidebar-history-empty">
        {history.empty}
      </p>
    )
  return (
    <div className="grid content-start gap-0.5">
      {history.rows.map((row) => (
        <RequestRow
          key={row.key}
          method={row.method}
          name={row.name}
          detail={row.detail}
          data-testid="workspace-sidebar-history-row"
          lastStatus={row.ok ? 'ok' : 'error'}
          onSelect={() => history.onOpen(row.requestId)}
        />
      ))}
    </div>
  )
}

// Every request, by folder. A row opens its documentation.
function ReferencePanelView({ reference }: { reference: SidebarViewModel['reference'] }): ReactElement {
  if (reference.groups.length === 0)
    return (
      <p className="px-2 py-4 text-muted-foreground" data-testid="workspace-sidebar-reference-empty">
        {reference.empty}
      </p>
    )
  return (
    <div className="grid content-start gap-0.5">
      {reference.groups.map((group) => (
        <div className="grid gap-0.5" key={group.key}>
          <h2 className="px-2 pt-4 pb-1.5 text-[12px] font-medium text-muted-foreground">{group.title}</h2>
          {group.rows.map((row) => (
            <RequestRow
              key={row.id}
              method={row.method}
              name={row.name}
              detail={row.path}
              active={row.active}
              data-testid="workspace-sidebar-reference-row"
              onSelect={() => reference.onOpen(row.id)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function WorkspaceSidebarView({
  sidebar,
  collection,
  lastSendById,
  environment,
  resize,
}: {
  sidebar: SidebarViewModel
  collection: CollectionViewModel
  lastSendById: ReadonlyMap<string, 'ok' | 'error'>
  environment: EnvironmentViewModel
  resize: SidebarResizeHandlers
}): ReactElement {
  const actions = sidebar.environmentActions
  return (
    <>
      <SidePanel
        title={sidebar.title}
        filter={sidebar.panel === 'collections' ? collection.filter : undefined}
        actions={
          sidebar.panel === 'collections' ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={collection.labels.add}
                    disabled={sidebar.menuButton.disabled}
                    data-testid="workspace-sidebar-add-trigger"
                  >
                    <Icon name="plus" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem data-testid="workspace-sidebar-add-request" onSelect={() => collection.handlers.createRequestIn('')}>
                    {collection.labels.createRequest}
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="workspace-sidebar-add-folder" onSelect={() => collection.handlers.createFolderIn('')}>
                    {collection.labels.createFolder}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={sidebar.menuButton.label} data-testid="workspace-sidebar-menu-trigger">
                    <Icon name="more" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem data-testid="workspace-sidebar-expand-all" onSelect={collection.handlers.expandAll}>
                    {collection.labels.expandAll}
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="workspace-sidebar-collapse-all" onSelect={collection.handlers.collapseAll}>
                    {collection.labels.collapseAll}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem data-testid="workspace-sidebar-open-api" onSelect={sidebar.onOpenApi}>
                    {sidebar.openApiLabel}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <CreateFolderDialogView folderDialog={collection.folderDialog} />
            </>
          ) : sidebar.panel === 'environments' ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label={actions.newName}
              title={actions.newName}
              disabled={!actions.canCreate}
              data-testid="workspace-sidebar-add-environment"
              onClick={actions.create}
            >
              <Icon name="plus" />
            </Button>
          ) : undefined
        }
      >
        {sidebar.panel === 'collections' && (
          <nav
            className="grid min-h-0 min-w-0 content-start gap-0"
            aria-label={sidebar.foldersLabel}
            onDragOver={collection.handlers.allowDrop}
            onDrop={(event) => collection.handlers.drop(event, null)}
            onContextMenu={collection.handlers.openRootContext}
            onKeyDown={collection.handlers.openRootKeyboard}
          >
            <CollectionTreeView {...collection} lastSendById={lastSendById} />
          </nav>
        )}
        {sidebar.panel === 'environments' && <EnvironmentsPanelView sidebar={sidebar} environment={environment} />}
        {sidebar.panel === 'history' && <HistoryPanelView history={sidebar.history} />}
        {sidebar.panel === 'reference' && <ReferencePanelView reference={sidebar.reference} />}
      </SidePanel>

      {/* biome-ignore lint/a11y/useSemanticElements: a resizer needs a separator with value controls, which hr does not offer */}
      <div
        className="absolute top-0 right-[-4px] bottom-0 z-[3] w-2 cursor-col-resize touch-none bg-transparent hover:bg-primary/30 focus-visible:bg-primary/30 focus-visible:outline-none max-[760px]:hidden"
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
