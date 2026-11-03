import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEST_IDS } from '@/features/request/constants/request-test-ids.constants'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import type { useHeadersEditorViewModel } from '@/features/request/viewmodels/use-headers-editor.viewmodel'
import { DebouncedInput } from '@/shared/components/debounced-field'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { VariableInput } from '@/shared/components/variable-field'

export type HeadersEditorViewProps = ReturnType<typeof useHeadersEditorViewModel>

export function HeadersEditorView({
  readOnly,
  suggestions,
  onVariableClick,
  showDescriptions,
  countText,
  canDeleteAll,
  rows,
  generated,
  helpText,
  onAdd,
  onDeleteAll,
  onToggleDescriptions,
  onEnabledChange,
  onNameChange,
  onValueChange,
  onDescriptionChange,
  onRemove,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: HeadersEditorViewProps): ReactElement {
  const { t } = useTranslation('request')

  return (
    <div className="headers-editor" data-testid={REQUEST_TEST_IDS.headers.container}>
      <div className="headers-toolbar">
        <Button type="button" variant="ghost" size="sm" data-testid={REQUEST_TEST_IDS.headers.add} disabled={readOnly} onClick={onAdd}>
          {t(REQUEST_TEXT.headers.add)}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-testid={REQUEST_TEST_IDS.headers.deleteAll}
          disabled={!canDeleteAll}
          onClick={onDeleteAll}
        >
          {t(REQUEST_TEXT.headers.deleteAll)}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-testid={REQUEST_TEST_IDS.headers.description}
          aria-pressed={showDescriptions}
          onClick={onToggleDescriptions}
        >
          {t(REQUEST_TEXT.headers.description)}
        </Button>
        <span className="headers-count" data-testid={REQUEST_TEST_IDS.headers.count}>
          {countText}
        </span>
      </div>
      {/* biome-ignore lint/a11y/useSemanticElements: the element keeps its ARIA table or grid role so the existing layout does not change */}
      <div className="headers-table" role="table" aria-label={t(REQUEST_TEXT.headers.tableLabel)}>
        {/* biome-ignore lint/a11y/useSemanticElements: the element keeps its ARIA table or grid role so the existing layout does not change */}
        {/* biome-ignore lint/a11y/useFocusableInteractive: the row is a layout container; the controls inside it take focus */}
        <div className="headers-heading" role="row">
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          {/* biome-ignore lint/a11y/useSemanticElements: the element keeps its ARIA table or grid role so the existing layout does not change */}
          {/* biome-ignore lint/a11y/useFocusableInteractive: the row is a layout container; the controls inside it take focus */}
          <span role="columnheader">{t(REQUEST_TEXT.headers.columnHeader)}</span>
          {/* biome-ignore lint/a11y/useSemanticElements: the element keeps its ARIA table or grid role so the existing layout does not change */}
          {/* biome-ignore lint/a11y/useFocusableInteractive: the row is a layout container; the controls inside it take focus */}
          <span role="columnheader">{t(REQUEST_TEXT.headers.columnValue)}</span>
          <span aria-hidden="true" />
        </div>
        {rows.map((header) => (
          // biome-ignore lint/a11y/noStaticElementInteractions: drag and drop is on this row; keyboard reordering uses the row handle button
          <div className="headers-entry" key={header.id} onDragOver={onDragOver} onDrop={(event) => onDrop(header.id, event)}>
            {/* biome-ignore lint/a11y/useSemanticElements: the element keeps its ARIA table or grid role so the existing layout does not change */}
            {/* biome-ignore lint/a11y/useFocusableInteractive: the row is a layout container; the controls inside it take focus */}
            <div className="headers-row" role="row">
              <Button
                type="button"
                variant="ghost"
                className="header-drag-handle"
                data-testid={REQUEST_TEST_IDS.headers.drag(header.id)}
                draggable={!readOnly}
                aria-label={header.reorderLabel}
                onDragStart={(event) => onDragStart(header.id, event)}
                onDragEnd={onDragEnd}
                disabled={readOnly}
              >
                ⠿
              </Button>
              <Checkbox
                data-testid={REQUEST_TEST_IDS.headers.enabled(header.id)}
                aria-label={header.enableLabel}
                className="header-enabled"
                checked={header.enabled}
                disabled={readOnly}
                onCheckedChange={(checked) => onEnabledChange(header.id, checked)}
              />
              <VariableInput
                data-testid={REQUEST_TEST_IDS.headers.name(header.id)}
                aria-label={header.nameLabel}
                value={header.name}
                suggestions={suggestions}
                onVariableClick={onVariableClick}
                readOnly={readOnly}
                placeholder={t(REQUEST_TEXT.headers.namePlaceholder)}
                onValueChange={(value) => onNameChange(header.id, value)}
              />
              <VariableInput
                data-testid={REQUEST_TEST_IDS.headers.value(header.id)}
                aria-label={header.valueLabel}
                value={header.value}
                suggestions={suggestions}
                onVariableClick={onVariableClick}
                readOnly={readOnly}
                placeholder={t(REQUEST_TEXT.headers.valuePlaceholder)}
                onValueChange={(value) => onValueChange(header.id, value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="header-remove"
                data-testid={REQUEST_TEST_IDS.headers.remove(header.id)}
                aria-label={header.removeLabel}
                disabled={readOnly}
                onClick={() => onRemove(header.id)}
              >
                ×
              </Button>
            </div>
            {showDescriptions && (
              <DebouncedInput
                data-testid={REQUEST_TEST_IDS.headers.descriptionField(header.id)}
                className="header-description"
                aria-label={header.descriptionLabel}
                value={header.description}
                readOnly={readOnly}
                placeholder={t(REQUEST_TEXT.headers.descriptionPlaceholder)}
                onValueChange={(value) => onDescriptionChange(header.id, value)}
              />
            )}
          </div>
        ))}
        <div className="headers-generated-label">{t(REQUEST_TEXT.headers.generatedLabel)}</div>
        {generated.map((header) => (
          // biome-ignore lint/a11y/useSemanticElements: the element keeps its ARIA table or grid role so the existing layout does not change
          // biome-ignore lint/a11y/useFocusableInteractive: the row is a layout container; the controls inside it take focus
          <div className="headers-generated-row" role="row" key={header.name}>
            <span aria-hidden="true" />
            <Checkbox
              data-testid={REQUEST_TEST_IDS.headers.generated(header.name)}
              className="header-enabled"
              checked
              disabled
              aria-label={header.enabledLabel}
            />
            <span className="header-generated-name">{header.name}</span>
            <span className="header-generated-value">{header.value}</span>
            <span className="header-generated-status">{t(REQUEST_TEXT.headers.auto)}</span>
          </div>
        ))}
      </div>
      {helpText && (
        <p className="headers-help" data-testid={REQUEST_TEST_IDS.headers.help}>
          {helpText}
        </p>
      )}
    </div>
  )
}
