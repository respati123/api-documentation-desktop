import { useTranslation } from 'react-i18next'
import { VARIABLES_TEST_IDS } from '@/features/variables/constants/variables-test-ids.constants'
import { VARIABLES_TEXT } from '@/features/variables/constants/variables-text.constants'
import type { useVariableRowsViewModel } from '@/features/variables/viewmodels/use-variable-rows.viewmodel'
import { KeyValueTable } from '@/shared/components/key-value-table'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

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

  return (
    <div className="variable-scope-body">
      <KeyValueTable
        label={t(VARIABLES_TEXT.rows.tableLabel)}
        columns={[t(VARIABLES_TEXT.rows.columnName), t(VARIABLES_TEXT.rows.columnValue), t(VARIABLES_TEXT.rows.columnSecret)]}
        rows={rows}
        readOnly={readOnly}
        classNames={{ table: 'variable-table', heading: 'variable-table-heading', row: 'variable-table-row', remove: 'variable-remove' }}
        renderCells={(row) => (
          <>
            <Input
              data-testid={VARIABLES_TEST_IDS.rowName(row.id)}
              aria-label={row.nameLabel}
              maxLength={160}
              value={row.name}
              readOnly={readOnly}
              onChange={(event) => onNameChange(row.id, event.target.value)}
              placeholder={t(VARIABLES_TEXT.rows.namePlaceholder)}
            />
            <Input
              data-testid={VARIABLES_TEST_IDS.rowValue(row.id)}
              aria-label={row.valueLabel}
              type={row.valueType}
              autoComplete="off"
              value={row.value}
              readOnly={row.valueReadOnly}
              onChange={(event) => onValueChange(row.id, event.target.value)}
              placeholder={row.valuePlaceholder}
            />
            <Label className="variable-secret-toggle" htmlFor={`variable-secret-${row.id}`}>
              <Checkbox
                id={`variable-secret-${row.id}`}
                data-testid={VARIABLES_TEST_IDS.rowSecret(row.id)}
                checked={row.secret}
                disabled={readOnly}
                onCheckedChange={(checked) => onSecretChange(row.id, checked)}
              />
              <span>{t(VARIABLES_TEXT.rows.secretToggle)}</span>
            </Label>
          </>
        )}
        removeLabel={(row) => row.removeLabel}
        removeTestId={(row) => VARIABLES_TEST_IDS.rowRemove(row.id)}
        onRemove={(row) => onRemove(row.id)}
        empty={
          isEmpty && (
            <p className="variable-empty" data-testid={VARIABLES_TEST_IDS.rowsEmpty}>
              {t(VARIABLES_TEXT.rows.empty)}
            </p>
          )
        }
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="variable-add"
        data-testid={VARIABLES_TEST_IDS.rowsAdd}
        disabled={!canAdd}
        onClick={onAdd}
      >
        {t(VARIABLES_TEXT.rows.add)}
      </Button>
    </div>
  )
}
