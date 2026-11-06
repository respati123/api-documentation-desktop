import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEST_IDS } from '@/features/request/constants/request-test-ids.constants'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import type { useParamsEditorViewModel } from '@/features/request/viewmodels/use-params-editor.viewmodel'
import { DebouncedInput } from '@/shared/components/debounced-field'
import { KeyValueTable } from '@/shared/components/key-value-table'
import { VariableInput } from '@/shared/components/variable-field'
import { Button, Checkbox } from '@/shared/ui'
import { cn } from '@/shared/utils/cn'

export type ParamsEditorViewProps = ReturnType<typeof useParamsEditorViewModel>

export function ParamsEditorView({
  readOnly,
  suggestions,
  onVariableClick,
  showDescriptions,
  countText,
  canDeleteAll,
  rows,
  onAdd,
  onDeleteAll,
  onToggleDescriptions,
  onEnabledChange,
  onNameChange,
  onValueChange,
  onDescriptionChange,
  onRemove,
}: ParamsEditorViewProps): ReactElement {
  const { t } = useTranslation('request')

  return (
    <div className="grid min-w-0 content-start gap-4" data-testid={REQUEST_TEST_IDS.params.container}>
      <KeyValueTable
        label={t(REQUEST_TEXT.params.tableLabel)}
        columns={[
          null,
          t(REQUEST_TEXT.params.columnParameter),
          t(REQUEST_TEXT.params.columnValue),
          showDescriptions ? t(REQUEST_TEXT.params.columnDescription) : false,
        ]}
        rows={rows}
        readOnly={readOnly}
        classNames={{
          table: 'params-table',
          heading: cn('params-heading', showDescriptions && 'params-heading-with-description'),
          entry: 'params-entry',
          row: cn('params-row', showDescriptions && 'params-row-with-description'),
          remove: 'param-remove',
        }}
        renderCells={(param) => (
          <>
            <Checkbox
              data-testid={REQUEST_TEST_IDS.params.enabled(param.id)}
              aria-label={param.enableLabel}
              checked={param.enabled}
              disabled={readOnly}
              onChange={(event) => onEnabledChange(param.id, event.target.checked)}
            />
            <VariableInput
              mono
              disabled={!param.enabled}
              data-testid={REQUEST_TEST_IDS.params.name(param.id)}
              aria-label={param.nameLabel}
              value={param.name}
              suggestions={suggestions}
              onVariableClick={onVariableClick}
              readOnly={readOnly}
              placeholder={t(REQUEST_TEXT.params.namePlaceholder)}
              onValueChange={(value) => onNameChange(param.id, value)}
            />
            <VariableInput
              mono
              disabled={!param.enabled}
              data-testid={REQUEST_TEST_IDS.params.value(param.id)}
              aria-label={param.valueLabel}
              value={param.value}
              suggestions={suggestions}
              onVariableClick={onVariableClick}
              readOnly={readOnly}
              placeholder={t(REQUEST_TEXT.params.valuePlaceholder)}
              onValueChange={(value) => onValueChange(param.id, value)}
            />
            {showDescriptions && (
              <DebouncedInput
                data-testid={REQUEST_TEST_IDS.params.descriptionField(param.id)}
                aria-label={param.descriptionLabel}
                value={param.description}
                readOnly={readOnly}
                placeholder={t(REQUEST_TEXT.params.descriptionPlaceholder)}
                onValueChange={(value) => onDescriptionChange(param.id, value)}
              />
            )}
          </>
        )}
        removeTestId={(param) => REQUEST_TEST_IDS.params.remove(param.id)}
        removeLabel={(param) => param.removeLabel}
        onRemove={(param) => onRemove(param.id)}
      />
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Button variant="secondary" data-testid={REQUEST_TEST_IDS.params.add} disabled={readOnly} onClick={onAdd}>
          {t(REQUEST_TEXT.params.add)}
        </Button>
        <Button variant="ghost" data-testid={REQUEST_TEST_IDS.params.deleteAll} disabled={!canDeleteAll} onClick={onDeleteAll}>
          {t(REQUEST_TEXT.params.deleteAll)}
        </Button>
        <Button
          variant="ghost"
          data-testid={REQUEST_TEST_IDS.params.description}
          aria-pressed={showDescriptions}
          onClick={onToggleDescriptions}
        >
          {t(REQUEST_TEXT.params.description)}
        </Button>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground" data-testid={REQUEST_TEST_IDS.params.count}>
          {countText}
        </span>
      </div>
    </div>
  )
}
