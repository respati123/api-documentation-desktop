import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEST_IDS } from '@/features/request/constants/request-test-ids.constants'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import type { useBodyEditorViewModel } from '@/features/request/viewmodels/use-body-editor.viewmodel'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { VariableInput, VariableTextarea } from '@/shared/components/variable-field'
import { cn } from '@/shared/utils/cn'

export type BodyEditorViewProps = ReturnType<typeof useBodyEditorViewModel>

export function BodyEditorView({
  readOnly,
  suggestions,
  onVariableClick,
  mode,
  modeOptions,
  helpText,
  isFields,
  isFormData,
  isGraphql,
  isRaw,
  isOther,
  isFile,
  rows,
  query,
  variables,
  variablesPlaceholder,
  rawValue,
  rawAriaLabel,
  rawPlaceholder,
  otherContentType,
  fileContentType,
  filePath,
  fileText,
  errorMessage,
  onModeChange,
  onAddField,
  onRemoveField,
  onEnabledChange,
  onKeyChange,
  onValueChange,
  onFieldTypeChange,
  onChooseFieldFile,
  onChooseBodyFile,
  onQueryChange,
  onVariablesChange,
  onRawChange,
  onContentTypeChange,
  isJson,
  jsonInvalid,
  jsonMessage,
  formatJsonDisabled,
  onFormatJson,
  onRawBlur,
  onRawPaste,
}: BodyEditorViewProps): ReactElement {
  const { t } = useTranslation('request')

  return (
    <div className="body-composer" data-testid={REQUEST_TEST_IDS.body.container}>
      <div className="body-toolbar">
        <Select value={mode} onValueChange={onModeChange} disabled={readOnly}>
          <SelectTrigger data-testid={REQUEST_TEST_IDS.body.mode} aria-label={t(REQUEST_TEXT.body.typeLabel)} className="body-mode-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {modeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="body-mode-help" data-testid={REQUEST_TEST_IDS.body.help}>
          {helpText}
        </span>
      </div>

      {isFields && (
        <div className="body-fields">
          <div className={cn('body-fields-heading', !isFormData && 'body-fields-heading-urlencoded')}>
            <span aria-hidden="true" />
            <span>{t(REQUEST_TEXT.body.columnKey)}</span>
            {isFormData && <span>{t(REQUEST_TEXT.body.columnType)}</span>}
            <span>{t(isFormData ? REQUEST_TEXT.body.columnValueOrFile : REQUEST_TEXT.body.columnValue)}</span>
            <span aria-hidden="true" />
          </div>
          {rows.map((field) => (
            <div className={cn('body-field-row', !isFormData && 'body-field-row-urlencoded')} key={field.id}>
              <Checkbox
                data-testid={REQUEST_TEST_IDS.body.enabled(field.id)}
                aria-label={field.enableLabel}
                className="body-field-enabled"
                checked={field.enabled}
                disabled={readOnly}
                onCheckedChange={(checked) => onEnabledChange(field.id, checked)}
              />
              <VariableInput
                data-testid={REQUEST_TEST_IDS.body.key(field.id)}
                aria-label={field.keyLabel}
                value={field.name}
                suggestions={suggestions}
                onVariableClick={onVariableClick}
                readOnly={readOnly}
                placeholder={t(REQUEST_TEXT.body.keyPlaceholder)}
                onValueChange={(value) => onKeyChange(field.id, value)}
              />
              {isFormData && (
                <Select value={field.type} onValueChange={(value) => onFieldTypeChange(field.id, value)} disabled={readOnly}>
                  <SelectTrigger
                    data-testid={REQUEST_TEST_IDS.body.fieldType(field.id)}
                    aria-label={field.typeLabel}
                    className="body-field-type"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">{t(REQUEST_TEXT.body.typeText)}</SelectItem>
                    <SelectItem value="file">{t(REQUEST_TEXT.body.typeFile)}</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {isFormData && field.isFile ? (
                <div className="body-file-control">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-testid={REQUEST_TEST_IDS.body.fieldFile(field.id)}
                    disabled={readOnly}
                    onClick={() => onChooseFieldFile(field.id)}
                  >
                    {t(REQUEST_TEXT.body.chooseFile)}
                  </Button>
                  <span title={field.filePath}>{field.fileText}</span>
                </div>
              ) : (
                <VariableInput
                  data-testid={REQUEST_TEST_IDS.body.value(field.id)}
                  aria-label={field.valueLabel}
                  value={field.value}
                  suggestions={suggestions}
                  onVariableClick={onVariableClick}
                  readOnly={readOnly}
                  placeholder={t(REQUEST_TEXT.body.valuePlaceholder)}
                  onValueChange={(value) => onValueChange(field.id, value)}
                />
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="body-remove-field"
                data-testid={REQUEST_TEST_IDS.body.remove(field.id)}
                disabled={readOnly}
                onClick={() => onRemoveField(field.id)}
              >
                {t(REQUEST_TEXT.body.removeField)}
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="body-add-field"
            data-testid={REQUEST_TEST_IDS.body.add}
            disabled={readOnly}
            onClick={onAddField}
          >
            {t(REQUEST_TEXT.body.addField)}
          </Button>
        </div>
      )}

      {isGraphql && (
        <div className="body-raw-fields">
          <div>
            <Label htmlFor="request-body-query">{t(REQUEST_TEXT.body.graphqlQuery)}</Label>
            <VariableTextarea
              id="request-body-query"
              data-testid={REQUEST_TEST_IDS.body.query}
              className="code-field"
              aria-label={t(REQUEST_TEXT.body.graphqlQueryAria)}
              value={query}
              suggestions={suggestions}
              onVariableClick={onVariableClick}
              readOnly={readOnly}
              onValueChange={onQueryChange}
              placeholder={t(REQUEST_TEXT.body.graphqlQueryPlaceholder)}
            />
          </div>
          <div>
            <Label htmlFor="request-body-variables">{t(REQUEST_TEXT.body.graphqlVariables)}</Label>
            <VariableTextarea
              id="request-body-variables"
              data-testid={REQUEST_TEST_IDS.body.variables}
              className="code-field body-variables"
              aria-label={t(REQUEST_TEXT.body.graphqlVariablesAria)}
              value={variables}
              suggestions={suggestions}
              onVariableClick={onVariableClick}
              readOnly={readOnly}
              onValueChange={onVariablesChange}
              placeholder={variablesPlaceholder}
            />
          </div>
        </div>
      )}

      {isRaw && (
        <div className="body-raw-fields">
          {isOther && (
            <div className="body-mime-field">
              <Label htmlFor="request-body-mime">{t(REQUEST_TEXT.body.contentType)}</Label>
              <VariableInput
                id="request-body-mime"
                data-testid={REQUEST_TEST_IDS.body.otherType}
                aria-label={t(REQUEST_TEXT.body.contentTypeAria)}
                value={otherContentType}
                suggestions={suggestions}
                onVariableClick={onVariableClick}
                readOnly={readOnly}
                onValueChange={onContentTypeChange}
                placeholder={t(REQUEST_TEXT.body.contentTypePlaceholder)}
              />
            </div>
          )}
          {isJson && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid={REQUEST_TEST_IDS.body.formatJson}
                disabled={readOnly || formatJsonDisabled}
                onClick={onFormatJson}
              >
                {t(REQUEST_TEXT.body.formatJson)}
              </Button>
              {jsonMessage && (
                <span
                  role="status"
                  data-testid={REQUEST_TEST_IDS.body.jsonStatus}
                  className={cn('text-[12px]', jsonInvalid ? 'text-destructive' : 'text-muted-foreground')}
                >
                  {jsonMessage}
                </span>
              )}
            </div>
          )}
          <VariableTextarea
            data-testid={REQUEST_TEST_IDS.body.raw}
            className="code-field"
            aria-label={rawAriaLabel}
            value={rawValue}
            suggestions={suggestions}
            onVariableClick={onVariableClick}
            readOnly={readOnly}
            onValueChange={onRawChange}
            onBlur={(event) => onRawBlur(event.currentTarget.value)}
            onPaste={onRawPaste}
            placeholder={rawPlaceholder}
          />
        </div>
      )}

      {isFile && (
        <div className="body-file-picker">
          <Button
            type="button"
            variant="outline"
            data-testid={REQUEST_TEST_IDS.body.chooseFile}
            disabled={readOnly}
            onClick={onChooseBodyFile}
          >
            {t(REQUEST_TEXT.body.chooseFile)}
          </Button>
          <span title={filePath}>{fileText}</span>
          <div>
            <Label htmlFor="request-body-file-type">{t(REQUEST_TEXT.body.contentType)}</Label>
            <VariableInput
              id="request-body-file-type"
              data-testid={REQUEST_TEST_IDS.body.fileType}
              aria-label={t(REQUEST_TEXT.body.fileContentTypeAria)}
              value={fileContentType}
              suggestions={suggestions}
              onVariableClick={onVariableClick}
              readOnly={readOnly}
              onValueChange={onContentTypeChange}
            />
          </div>
          <p className="body-local-file-note">{t(REQUEST_TEXT.body.fileNote)}</p>
        </div>
      )}

      {errorMessage && (
        <p className="body-file-error" role="alert" data-testid={REQUEST_TEST_IDS.body.error}>
          {errorMessage}
        </p>
      )}
    </div>
  )
}
