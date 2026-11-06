import type { ReactElement } from 'react'
import { CollectionFolderIcon } from '@/features/collection/components/workspace-icons'
import type {
  FolderRow as FolderRowModel,
  RequestRow as RequestRowModel,
  TreeChange,
  TreeRow,
} from '@/features/collection/models/collection-tree.model'
import type { useCollectionTreeViewModel } from '@/features/collection/viewmodels/use-collection-tree.viewmodel'
import { Button, FolderRow, Icon, Input, RequestRow, TreeChildren } from '@/shared/ui'

export type CollectionTreeViewProps = ReturnType<typeof useCollectionTreeViewModel> & {
  // How the last send of each request ended. Rows show it as a dot.
  lastSendById?: ReadonlyMap<string, 'ok' | 'error'>
}
type Handlers = CollectionTreeViewProps['handlers']
type Rename = CollectionTreeViewProps['rename']
type Labels = CollectionTreeViewProps['labels']

// Marks a row that was added, changed, or removed since the last commit.
function ChangeBadge({ change }: { change: TreeChange | null }): ReactElement | null {
  if (!change) return null
  return (
    <span
      role="img"
      className="w-[18px] shrink-0 text-center font-mono text-[11px] font-extrabold text-muted-foreground"
      aria-label={change.label}
    >
      {change.code}
    </span>
  )
}

// Buttons that appear when a row is hovered or focused. The row's wrapper shows them.
const ROW_ACTIONS = 'row-actions'

function RenameFolder({ row, labels, rename }: { row: FolderRowModel; labels: Labels; rename: Rename }): ReactElement {
  return (
    <div className="flex min-w-0 items-center gap-2" style={{ paddingLeft: 6 }}>
      <Icon name="chevron" size={14} />
      <CollectionFolderIcon open={row.expanded} />
      <Input
        data-testid="collection-tree-rename-input"
        autoFocus
        aria-label={labels.folderNameLabel}
        maxLength={100}
        value={rename.draft}
        onChange={(event) => rename.onDraftChange(event.target.value)}
        onBlur={() => rename.onBlur(row.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            rename.onCommit(row.id)
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            rename.onCancel()
          }
        }}
      />
      <span className="min-w-[18px] text-right font-mono text-[11px] text-muted-foreground">{row.requestCount}</span>
    </div>
  )
}

function FolderLine({
  row,
  labels,
  rename,
  readOnly,
  handlers,
}: {
  row: FolderRowModel
  labels: Labels
  rename: Rename
  readOnly: boolean
  handlers: Handlers
}): ReactElement {
  if (row.renaming) return <RenameFolder row={row} labels={labels} rename={rename} />
  return (
    <FolderRow
      name={row.name}
      count={row.requestCount}
      expanded={row.expanded}
      containsActive={row.containsActive}
      className={row.selected ? 'folder-row--selected' : row.dragging ? 'is-dragging' : undefined}
      data-testid="collection-tree-folder-row"
      aria-haspopup="menu"
      draggable
      onToggle={() => handlers.toggleFolder(row.id)}
      onDragStart={(event) => handlers.dragStart(row.id, event)}
      onDragEnd={handlers.dragEnd}
      onDragOver={handlers.allowDrop}
      onDrop={(event) => handlers.drop(event, row.id)}
      onContextMenu={(event) => handlers.openFolderMenu(event, row.id)}
      onKeyDown={(event) => handlers.openFolderKeyboard(event, row.id)}
      trailing={
        <div className={`${ROW_ACTIONS} flex shrink-0 items-center`}>
          <Button
            variant="ghost"
            size="icon"
            aria-label={labels.newRequestIn(row.name)}
            title={labels.newRequestIn(row.name)}
            data-testid="collection-tree-folder-add-request"
            disabled={readOnly}
            onClick={() => handlers.createRequestIn(row.id)}
          >
            <Icon name="plus" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            data-testid="collection-tree-folder-menu"
            aria-label={labels.actionsFor(row.name)}
            aria-haspopup="menu"
            disabled={readOnly}
            onClick={(event) => handlers.openFolderDropdown(event, row.id)}
          >
            <Icon name="more" />
          </Button>
        </div>
      }
      badge={<ChangeBadge change={row.change} />}
    />
  )
}

function RequestLine({
  row,
  labels,
  readOnly,
  handlers,
  lastSend,
}: {
  row: RequestRowModel
  labels: Labels
  readOnly: boolean
  handlers: Handlers
  lastSend?: 'ok' | 'error'
}): ReactElement {
  return (
    <RequestRow
      method={row.method}
      name={row.name}
      active={row.selected}
      lastStatus={lastSend}
      className={row.dragging ? 'is-dragging' : undefined}
      data-testid="collection-tree-request-row"
      aria-haspopup="menu"
      draggable
      onSelect={() => handlers.openRequest(row.id)}
      onDragStart={(event) => handlers.dragStart(row.id, event)}
      onDragEnd={handlers.dragEnd}
      onDragOver={handlers.allowDrop}
      onDrop={(event) => handlers.drop(event, row.id)}
      onContextMenu={(event) => handlers.openRequestMenu(event, row.id)}
      onKeyDown={(event) => handlers.openRequestKeyboard(event, row.id)}
      trailing={
        <Button
          variant="ghost"
          size="icon"
          className={ROW_ACTIONS}
          data-testid="collection-tree-request-menu"
          aria-label={labels.actionsFor(row.name)}
          aria-haspopup="menu"
          disabled={readOnly}
          onClick={(event) => handlers.openRequestDropdown(event, row.id)}
        >
          <Icon name="more" />
        </Button>
      }
      badge={<ChangeBadge change={row.change} />}
    />
  )
}

function TreeRows({
  rows,
  labels,
  rename,
  readOnly,
  handlers,
  lastSendById,
}: {
  rows: TreeRow[]
  labels: Labels
  rename: Rename
  readOnly: boolean
  handlers: Handlers
  lastSendById?: ReadonlyMap<string, 'ok' | 'error'>
}): ReactElement {
  return (
    <>
      {rows.map((row) =>
        row.kind === 'folder' ? (
          <div key={row.id} className="min-w-0">
            <FolderLine row={row} labels={labels} rename={rename} readOnly={readOnly} handlers={handlers} />
            {row.expanded && (
              <TreeChildren>
                {row.children.length ? (
                  <TreeRows
                    rows={row.children}
                    labels={labels}
                    rename={rename}
                    readOnly={readOnly}
                    handlers={handlers}
                    lastSendById={lastSendById}
                  />
                ) : (
                  <p className="px-2.5 py-1.5 text-[12px] text-muted-foreground">{labels.emptyFolder}</p>
                )}
              </TreeChildren>
            )}
          </div>
        ) : (
          <RequestLine
            key={row.id}
            row={row}
            labels={labels}
            readOnly={readOnly}
            handlers={handlers}
            lastSend={lastSendById?.get(row.id)}
          />
        ),
      )}
    </>
  )
}

export function CollectionTreeView({
  rows,
  isEmpty,
  noMatches,
  labels,
  rename,
  readOnly,
  handlers,
  lastSendById,
}: CollectionTreeViewProps): ReactElement {
  if (isEmpty || noMatches) return <p className="px-2 py-4 text-muted-foreground">{noMatches ?? labels.empty}</p>
  return <TreeRows rows={rows} labels={labels} rename={rename} readOnly={readOnly} handlers={handlers} lastSendById={lastSendById} />
}
