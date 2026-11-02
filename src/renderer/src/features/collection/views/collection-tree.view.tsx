import { MoreHorizontal, Plus } from 'lucide-react'
import type { ReactElement } from 'react'
import { CollectionFolderIcon } from '@/features/collection/components/workspace-icons'
import type { FolderRow, RequestRow, TreeChange, TreeRow } from '@/features/collection/models/collection-tree.model'
import type { useCollectionTreeViewModel } from '@/features/collection/viewmodels/use-collection-tree.viewmodel'
import { styleWithVariables } from '@/shared/components/css-variables'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/utils/cn'

export type CollectionTreeViewProps = ReturnType<typeof useCollectionTreeViewModel>
type Handlers = CollectionTreeViewProps['handlers']
type Rename = CollectionTreeViewProps['rename']

// Tree rows and triggers keep their own styling. The shadcn base sizing, weight, and focus ring are reset here.
const TREE_ROW =
  'flex h-auto min-h-[36px] w-full min-w-0 items-center justify-start gap-2 rounded-[7px] border border-transparent py-2 pr-2 pl-[calc(8px+var(--tree-depth,0)*16px)] text-left text-[12px] font-medium text-muted-foreground transition-colors duration-[120ms] hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary focus-visible:ring-0'
const TREE_SELECTED = 'border-primary/30 bg-primary/10 text-foreground'
const TREE_DRAGGING = 'opacity-[.45]'
const TREE_TRIGGER =
  'h-[36px] w-[36px] shrink-0 rounded-[7px] border border-transparent px-0 text-[17px] leading-none font-normal text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground focus-visible:ring-0 disabled:opacity-100'
const TREE_COUNT = 'min-w-[18px] text-right font-mono text-[10px] text-muted-foreground'
const TREE_DISCLOSURE = 'w-[13px] shrink-0 text-center text-[17px] leading-none text-muted-foreground'
const CHANGE_STATUS_CLASS: Record<string, string> = {
  added: 'text-primary',
  modified: 'text-warning',
  deleted: 'text-destructive',
}

function ChangeBadge({ change }: { change: TreeChange | null }): ReactElement | null {
  if (!change) return null
  return (
    <span
      role="img"
      className={cn(
        'w-[18px] shrink-0 text-center font-mono text-[11px] font-extrabold text-muted-foreground',
        CHANGE_STATUS_CLASS[change.status],
      )}
      aria-label={change.label}
    >
      {change.code}
    </span>
  )
}

function FolderLine({
  row,
  labels,
  rename,
  readOnly,
  handlers,
}: {
  row: FolderRow
  labels: CollectionTreeViewProps['labels']
  rename: Rename
  readOnly: boolean
  handlers: Handlers
}): ReactElement {
  return (
    <div className="group/folder flex min-w-0 items-center gap-0 pl-[calc(var(--tree-depth,0)*16px)]">
      {row.renaming ? (
        <div className={cn(TREE_ROW, 'w-auto flex-1 pl-2 font-semibold', TREE_SELECTED)}>
          <span className={TREE_DISCLOSURE} aria-hidden="true">
            {row.expanded ? '⌄' : '›'}
          </span>
          <CollectionFolderIcon open={row.expanded} />
          <Input
            data-testid="collection-tree-rename-input"
            autoFocus
            aria-label={labels.folderNameLabel}
            className="h-[28px] min-h-[28px] w-full border-primary/30 px-2 text-[12px] font-semibold"
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
          <span className={TREE_COUNT}>{row.requestCount}</span>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          data-testid="collection-tree-folder-row"
          className={cn(TREE_ROW, 'w-auto flex-1 pl-2 font-semibold', row.selected && TREE_SELECTED, row.dragging && TREE_DRAGGING)}
          aria-expanded={row.expanded}
          aria-haspopup="menu"
          draggable
          onDragStart={(event) => handlers.dragStart(row.id, event)}
          onDragEnd={handlers.dragEnd}
          onDragOver={handlers.allowDrop}
          onDrop={(event) => handlers.drop(event, row.id)}
          onClick={() => handlers.toggleFolder(row.id)}
          onContextMenu={(event) => handlers.openFolderMenu(event, row.id)}
          onKeyDown={(event) => handlers.openFolderKeyboard(event, row.id)}
        >
          <span className={TREE_DISCLOSURE} aria-hidden="true">
            {row.expanded ? '⌄' : '›'}
          </span>
          <CollectionFolderIcon open={row.expanded} />
          <span className="min-w-0 flex-1 truncate">{row.name}</span>
          <span className={TREE_COUNT}>{row.requestCount}</span>
        </Button>
      )}
      <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover/folder:opacity-100 focus-within:opacity-100">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-0"
          aria-label={labels.newRequestIn(row.name)}
          title={labels.newRequestIn(row.name)}
          data-testid="collection-tree-folder-add-request"
          disabled={readOnly}
          onClick={() => handlers.createRequestIn(row.id)}
        >
          <Plus size={15} strokeWidth={1.8} aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          data-testid="collection-tree-folder-menu"
          className={TREE_TRIGGER}
          aria-label={labels.actionsFor(row.name)}
          aria-haspopup="menu"
          disabled={readOnly}
          onClick={(event) => handlers.openFolderDropdown(event, row.id)}
        >
          <MoreHorizontal size={16} strokeWidth={1.8} aria-hidden="true" />
        </Button>
      </div>
      <ChangeBadge change={row.change} />
    </div>
  )
}

function RequestLine({
  row,
  labels,
  readOnly,
  handlers,
}: {
  row: RequestRow
  labels: CollectionTreeViewProps['labels']
  readOnly: boolean
  handlers: Handlers
}): ReactElement {
  return (
    <div
      className="group/request flex min-w-0 items-center gap-0 pl-[calc(var(--tree-depth,0)*16px)]"
      style={styleWithVariables({ '--tree-depth': row.depth })}
    >
      <Button
        type="button"
        variant="ghost"
        data-testid="collection-tree-request-row"
        className={cn(
          TREE_ROW,
          'grid w-auto flex-1 grid-cols-[38px_minmax(0,1fr)_22px] gap-2 px-2 py-2',
          row.selected && TREE_SELECTED,
          row.dragging && TREE_DRAGGING,
        )}
        draggable
        onDragStart={(event) => handlers.dragStart(row.id, event)}
        onDragEnd={handlers.dragEnd}
        onDragOver={handlers.allowDrop}
        onDrop={(event) => handlers.drop(event, row.id)}
        onClick={() => handlers.openRequest(row.id)}
        onContextMenu={(event) => handlers.openRequestMenu(event, row.id)}
        onKeyDown={(event) => handlers.openRequestKeyboard(event, row.id)}
      >
        <span className={`method method-${row.method.toLowerCase()}`}>{row.method}</span>
        <span className="block min-w-0 truncate">
          <strong className="block min-w-0 truncate !text-[12px] !font-medium" title={row.name}>
            {row.name}
          </strong>
        </span>
        <ChangeBadge change={row.change} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        data-testid="collection-tree-request-menu"
        className={cn(TREE_TRIGGER, 'h-[34px] w-[30px] basis-[30px] opacity-0 group-hover/request:opacity-100 focus-visible:opacity-100')}
        aria-label={labels.actionsFor(row.name)}
        aria-haspopup="menu"
        disabled={readOnly}
        onClick={(event) => handlers.openRequestDropdown(event, row.id)}
      >
        <MoreHorizontal size={16} strokeWidth={1.8} aria-hidden="true" />
      </Button>
    </div>
  )
}

function TreeRows({
  rows,
  labels,
  rename,
  readOnly,
  handlers,
}: {
  rows: TreeRow[]
  labels: CollectionTreeViewProps['labels']
  rename: Rename
  readOnly: boolean
  handlers: Handlers
}): ReactElement {
  return (
    <>
      {rows.map((row) =>
        row.kind === 'folder' ? (
          <div key={row.id} className="min-w-0" style={styleWithVariables({ '--tree-depth': row.depth })}>
            <FolderLine row={row} labels={labels} rename={rename} readOnly={readOnly} handlers={handlers} />
            {row.expanded && (
              <div className="min-w-0">
                {row.children.length ? (
                  <TreeRows rows={row.children} labels={labels} rename={rename} readOnly={readOnly} handlers={handlers} />
                ) : (
                  <div
                    className="px-2 pt-2 pb-2 pl-[calc(8px+var(--tree-depth,0)*16px)] text-[11px] italic text-muted-foreground"
                    style={styleWithVariables({ '--tree-depth': row.depth + 1 })}
                  >
                    {labels.emptyFolder}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <RequestLine key={row.id} row={row} labels={labels} readOnly={readOnly} handlers={handlers} />
        ),
      )}
    </>
  )
}

export function CollectionTreeView({ rows, isEmpty, labels, rename, readOnly, handlers }: CollectionTreeViewProps): ReactElement {
  return isEmpty ? (
    <p className="mx-2 my-2 text-[13px] leading-[1.6] text-muted-foreground">{labels.empty}</p>
  ) : (
    <TreeRows rows={rows} labels={labels} rename={rename} readOnly={readOnly} handlers={handlers} />
  )
}
