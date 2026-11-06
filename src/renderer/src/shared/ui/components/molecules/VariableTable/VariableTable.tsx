import { Button } from '../../atoms/Button/Button'
import { VariableRow, type VariableRowData, type VariableRowTestIds } from '../VariableRow/VariableRow'
import './VariableTable.css'

// Per-row options that depend on the app's state, such as a value that is read-only for one row only.
export interface VariableRowOptions {
  valueReadOnly?: boolean
  testIds?: VariableRowTestIds
}

export interface VariableTableProps {
  rows: VariableRowData[]
  readOnly?: boolean
  headings: { name: string; value: string; secret: string }
  rowLabels: {
    namePlaceholder: string
    valuePlaceholder: string
    secretValuePlaceholder?: string
    nameLabel: (id: string) => string
    valueLabel: (id: string) => string
    secretLabel: (id: string) => string
    removeLabel: (id: string) => string
  }
  rowOptions?: (id: string) => VariableRowOptions
  addLabel: string
  /** Set to false to disable Add without making the whole table read-only, for example at the variable limit. */
  canAdd?: boolean
  addTestId?: string
  emptyText?: string
  emptyTestId?: string
  onChange: (id: string, patch: Partial<Omit<VariableRowData, 'id'>>) => void
  onRemove: (id: string) => void
  onAdd: () => void
}

// The variables of one scope as an editable table, with an Add button under it.
export function VariableTable({
  rows,
  readOnly = false,
  headings,
  rowLabels,
  rowOptions,
  addLabel,
  canAdd = true,
  addTestId,
  emptyText,
  emptyTestId,
  onChange,
  onRemove,
  onAdd,
}: VariableTableProps) {
  return (
    <div className="variable-table">
      <div className="variable-table__heading" aria-hidden="true">
        <span>{headings.name}</span>
        <span>{headings.value}</span>
        <span className="variable-table__secret-heading">{headings.secret}</span>
        <span />
      </div>
      {rows.map((row) => {
        const options = rowOptions?.(row.id)
        return (
          <VariableRow
            key={row.id}
            row={row}
            readOnly={readOnly}
            valueReadOnly={options?.valueReadOnly}
            testIds={options?.testIds}
            namePlaceholder={rowLabels.namePlaceholder}
            valuePlaceholder={rowLabels.valuePlaceholder}
            secretValuePlaceholder={rowLabels.secretValuePlaceholder}
            nameLabel={rowLabels.nameLabel(row.id)}
            valueLabel={rowLabels.valueLabel(row.id)}
            secretLabel={rowLabels.secretLabel(row.id)}
            removeLabel={rowLabels.removeLabel(row.id)}
            onNameChange={(name) => onChange(row.id, { name })}
            onValueChange={(value) => onChange(row.id, { value })}
            onSecretChange={(secret) => onChange(row.id, { secret })}
            onRemove={() => onRemove(row.id)}
          />
        )
      })}
      {rows.length === 0 && emptyText && (
        <p className="variable-table__empty" data-testid={emptyTestId}>
          {emptyText}
        </p>
      )}
      <div className="variable-table__add">
        <Button variant="secondary" size="md" data-testid={addTestId} disabled={readOnly || !canAdd} onClick={onAdd}>
          {addLabel}
        </Button>
      </div>
    </div>
  )
}
