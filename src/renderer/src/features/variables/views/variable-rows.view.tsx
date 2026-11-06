import { useTranslation } from 'react-i18next'
import { VARIABLES_TEST_IDS } from '@/features/variables/constants/variables-test-ids.constants'
import { VARIABLES_TEXT } from '@/features/variables/constants/variables-text.constants'
import type { useVariableRowsViewModel } from '@/features/variables/viewmodels/use-variable-rows.viewmodel'
import { VariableTable } from '@/shared/ui'

export type VariableRowsViewProps = ReturnType<typeof useVariableRowsViewModel>

export function VariableRowsView({
  rows,
  readOnly,
  isEmpty,
  canAdd,
  onNameChange,
  onValueChange,
  onSecretChange,
  onRemove,
  onAdd,
}: VariableRowsViewProps) {
  const { t } = useTranslation('variables')
  // The view model builds each row's labels and read-only state. The table looks them up by row id.
  const byId = new Map(rows.map((row) => [row.id, row]))
  const label = (id: string, pick: 'nameLabel' | 'valueLabel' | 'removeLabel') => byId.get(id)?.[pick] ?? ''

  return (
    <VariableTable
      rows={rows}
      readOnly={readOnly}
      headings={{
        name: t(VARIABLES_TEXT.rows.columnName),
        value: t(VARIABLES_TEXT.rows.columnValue),
        secret: t(VARIABLES_TEXT.rows.columnSecret),
      }}
      rowLabels={{
        namePlaceholder: t(VARIABLES_TEXT.rows.namePlaceholder),
        valuePlaceholder: t(VARIABLES_TEXT.rows.valuePlaceholder),
        secretValuePlaceholder: t(VARIABLES_TEXT.rows.secretPlaceholder),
        nameLabel: (id) => label(id, 'nameLabel'),
        valueLabel: (id) => label(id, 'valueLabel'),
        secretLabel: () => t(VARIABLES_TEXT.rows.secretToggle),
        removeLabel: (id) => label(id, 'removeLabel'),
      }}
      rowOptions={(id) => ({
        valueReadOnly: byId.get(id)?.valueReadOnly,
        testIds: {
          name: VARIABLES_TEST_IDS.rowName(id),
          value: VARIABLES_TEST_IDS.rowValue(id),
          secret: VARIABLES_TEST_IDS.rowSecret(id),
          remove: VARIABLES_TEST_IDS.rowRemove(id),
        },
      })}
      addLabel={t(VARIABLES_TEXT.rows.add)}
      canAdd={canAdd}
      addTestId={VARIABLES_TEST_IDS.rowsAdd}
      emptyText={isEmpty ? t(VARIABLES_TEXT.rows.empty) : undefined}
      emptyTestId={VARIABLES_TEST_IDS.rowsEmpty}
      onChange={(id, patch) => {
        if (patch.name !== undefined) onNameChange(id, patch.name)
        if (patch.value !== undefined) onValueChange(id, patch.value)
        if (patch.secret !== undefined) onSecretChange(id, patch.secret)
      }}
      onRemove={onRemove}
      onAdd={onAdd}
    />
  )
}
