import { useTranslation } from 'react-i18next'
import { VARIABLES_TEXT } from '@/features/variables/constants/variables-text.constants'
import type { WorkspaceVariable } from '@/lib/workspace-variables'

export const maxVariablesPerScope = 500

type RowPatch = Partial<WorkspaceVariable>

// Everything the rows table needs for one scope (global or one environment): labels, flags, and handlers.
export function useVariableRowsViewModel({
  rows,
  readOnly,
  onChange,
}: {
  rows: WorkspaceVariable[]
  readOnly: boolean
  onChange: (rows: WorkspaceVariable[]) => void
}) {
  const { t } = useTranslation('variables')

  function update(id: string, patch: RowPatch) {
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  return {
    rows: rows.map((row, index) => {
      const valueType: 'password' | 'text' = row.secret ? 'password' : 'text'
      return {
        id: row.id,
        name: row.name,
        value: row.value,
        secret: row.secret,
        valueType,
        nameLabel: t(VARIABLES_TEXT.rows.nameLabel, { position: index + 1 }),
        valueLabel: t(VARIABLES_TEXT.rows.valueLabel, { position: index + 1 }),
        valuePlaceholder: row.secret ? t(VARIABLES_TEXT.rows.secretPlaceholder) : t(VARIABLES_TEXT.rows.valuePlaceholder),
        valueReadOnly: readOnly && !row.secret,
        removeLabel: t(VARIABLES_TEXT.rows.removeLabel, { name: row.name || index + 1 }),
      }
    }),
    readOnly,
    isEmpty: rows.length === 0,
    canAdd: !readOnly && rows.length < maxVariablesPerScope,
    onNameChange: (id: string, name: string) => update(id, { name }),
    onValueChange: (id: string, value: string) => update(id, { value }),
    onSecretChange: (id: string, checked: boolean | 'indeterminate') => update(id, { secret: checked === true }),
    onRemove: (id: string) => onChange(rows.filter((row) => row.id !== id)),
    onAdd: () => onChange([...rows, { id: crypto.randomUUID(), name: '', value: '', secret: false }]),
  }
}
