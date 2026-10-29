import type { CSSProperties, ReactElement } from 'react'
import { CollectionFolderIcon } from '@/features/collection/components/workspace-icons'
import type { FolderRow, RequestRow, TreeChange, TreeRow } from '@/features/collection/models/collection-tree.model'
import type { useCollectionTreeViewModel } from '@/features/collection/viewmodels/use-collection-tree.viewmodel'
import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/utils/cn'

export type CollectionTreeViewProps = ReturnType<typeof useCollectionTreeViewModel>
type Handlers = CollectionTreeViewProps['handlers']
type Rename = CollectionTreeViewProps['rename']

function ChangeBadge({ change }: { change: TreeChange | null }): ReactElement | null {
  if (!change) return null
  return (
    <span role="img" className={`change-badge change-${change.status}`} aria-label={change.label}>
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
    <div className="tree-folder-line">
      {row.renaming ? (
        <div className="tree-row folder-row folder-row-editing">
          <span className="tree-disclosure" aria-hidden="true">
            {row.expanded ? '⌄' : '›'}
          </span>
          <CollectionFolderIcon open={row.expanded} />
          <Input
            autoFocus
            aria-label={labels.folderNameLabel}
            className="folder-name-editor"
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
          <span className="tree-count">{row.requestCount}</span>
        </div>
      ) : (
        <button
          type="button"
          className={cn('tree-row', 'folder-row', row.selected && 'tree-row-selected', row.dragging && 'tree-row-dragging')}
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
          <span className="tree-disclosure" aria-hidden="true">
            {row.expanded ? '⌄' : '›'}
          </span>
          <CollectionFolderIcon open={row.expanded} />
          <span className="tree-label">{row.name}</span>
          <span className="tree-count">{row.requestCount}</span>
        </button>
      )}
      <button
        type="button"
        className="tree-menu-trigger"
        aria-label={labels.actionsFor(row.name)}
        aria-haspopup="menu"
        disabled={readOnly}
        onClick={(event) => handlers.openFolderDropdown(event, row.id)}
      >
        ⌄
      </button>
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
    <div className="tree-request-line" style={{ '--tree-depth': row.depth } as CSSProperties}>
      <button
        type="button"
        className={cn('tree-row', 'request-row', row.selected && 'tree-row-selected', row.dragging && 'tree-row-dragging')}
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
        <span className="tree-label request-copy">
          <strong title={row.name}>{row.name}</strong>
        </span>
        <ChangeBadge change={row.change} />
      </button>
      <button
        type="button"
        className="tree-menu-trigger request-menu-trigger"
        aria-label={labels.actionsFor(row.name)}
        aria-haspopup="menu"
        disabled={readOnly}
        onClick={(event) => handlers.openRequestDropdown(event, row.id)}
      >
        ⌄
      </button>
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
          <div key={row.id} className="tree-node" style={{ '--tree-depth': row.depth } as CSSProperties}>
            <FolderLine row={row} labels={labels} rename={rename} readOnly={readOnly} handlers={handlers} />
            {row.expanded && (
              <div className="tree-children">
                {row.children.length ? (
                  <TreeRows rows={row.children} labels={labels} rename={rename} readOnly={readOnly} handlers={handlers} />
                ) : (
                  <div className="tree-empty" style={{ '--tree-depth': row.depth + 1 } as CSSProperties}>
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
    <p className="collection-empty">{labels.empty}</p>
  ) : (
    <TreeRows rows={rows} labels={labels} rename={rename} readOnly={readOnly} handlers={handlers} />
  )
}
