import { Fragment, type ReactNode } from 'react'
import { Button } from '@/shared/components/ui/button'

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
          return column === null ? (
            <span key={index} aria-hidden="true" />
          ) : (
            <span key={index} role="columnheader">
              {column}
            </span>
          )
        })}
        <span aria-hidden="true" />
      </div>
      {rows.map((row, index) => {
        const cells = (
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
        )
        return classNames.entry ? (
          <div className={classNames.entry} key={row.id}>
            {cells}
          </div>
        ) : (
          <Fragment key={row.id}>{cells}</Fragment>
        )
      })}
      {empty}
    </div>
  )
}
