import type { ReactNode } from 'react'
import { Button } from '@/shared/components/ui/button'

// Wraps one row in a div only when the table asks for an entry class. Otherwise the row stays a fragment.
function KeyValueEntry({ className, children }: { className?: string; children: ReactNode }) {
  return className ? <div className={className}>{children}</div> : children
}

// A table of editable rows. The caller supplies the cells and the class names, so the same table
// structure serves variables, parameters, and any other list of name and value pairs.
export function KeyValueTable<T extends { id: string }>({
  label,
  columns,
  rows,
  readOnly,
  classNames,
  renderCells,
  removeLabel,
  onRemove,
  empty,
}: {
  label: string
  // A string is a column heading. null is an unlabeled spacer. false leaves the column out.
  columns: Array<ReactNode | null | false>
  rows: T[]
  readOnly: boolean
  classNames: { table: string; heading: string; entry?: string; row: string; remove: string }
  renderCells: (row: T, index: number) => ReactNode
  removeLabel: (row: T, index: number) => string
  onRemove: (row: T) => void
  empty?: ReactNode
}) {
  return (
    <div className={classNames.table} role="table" aria-label={label}>
      <div className={classNames.heading} role="row">
        {columns.map((column, index) => {
          if (column === false) return null
          // Columns are fixed for the life of the table and have no id, so the position is the key.
          return column === null ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: columns are fixed and carry no id
            <span key={index} aria-hidden="true" />
          ) : (
            // biome-ignore lint/suspicious/noArrayIndexKey: columns are fixed and carry no id
            <span key={index} role="columnheader">
              {column}
            </span>
          )
        })}
        <span aria-hidden="true" />
      </div>
      {rows.map((row, index) => (
        <KeyValueEntry key={row.id} className={classNames.entry}>
          <div className={classNames.row} role="row">
            {renderCells(row, index)}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={classNames.remove}
              aria-label={removeLabel(row, index)}
              disabled={readOnly}
              onClick={() => onRemove(row)}
            >
              ×
            </Button>
          </div>
        </KeyValueEntry>
      ))}
      {empty}
    </div>
  )
}
