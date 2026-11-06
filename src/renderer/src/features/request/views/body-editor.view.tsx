import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEST_IDS } from '@/features/request/constants/request-test-ids.constants'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import type { useBodyEditorViewModel } from '@/features/request/viewmodels/use-body-editor.viewmodel'
import { VariableCodeEditor } from '@/shared/components/variable-code-editor'
import { VariableInput, VariableTextarea } from '@/shared/components/variable-field'
import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icon,
  Label,
  PaneBar,
  PaneSection,
  SegmentedControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui'
import { cn } from '@/shared/utils/cn'

export type BodyEditorViewProps = ReturnType<typeof useBodyEditorViewModel>

export function BodyEditorView({
  readOnly,
  suggestions,
  onVariableClick,
  mode,
  primaryModeOptions,
  moreModeOptions,
  moreLabel,
  moreActive,
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
    <div className="flex min-h-0 flex-1 flex-col" data-testid={REQUEST_TEST_IDS.body.container}>
      <PaneBar position="top">
        <SegmentedControl
          label={t(REQUEST_TEXT.body.typeLabel)}
          options={primaryModeOptions}
          value={mode}
          disabled={readOnly}
          testId={REQUEST_TEST_IDS.body.mode}
          onChange={onModeChange}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={moreActive ? 'secondary' : 'ghost'}
              size="sm"
              disabled={readOnly}
              aria-label={t(REQUEST_TEXT.body.typeLabel)}
              data-testid={REQUEST_TEST_IDS.body.moreModes}
            >
              {moreLabel}
              <Icon name="chevron" size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {moreModeOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                data-testid={REQUEST_TEST_IDS.body.modeOption(option.value)}
                onSelect={() => onModeChange(option.value)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </PaneBar>

      {mode === 'none' && (
        <PaneSection>
          <p className="max-w-[62ch] text-[12px] leading-5 text-muted-foreground" data-testid={REQUEST_TEST_IDS.body.help}>
            {helpText}
          </p>
        </PaneSection>
      )}

      {isFields && (
        <PaneSection>
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
                  checked={field.enabled}
                  disabled={readOnly}
                  onChange={(event) => onEnabledChange(field.id, event.target.checked)}
                />
                <VariableInput
                  mono
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
                      variant="secondary"
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
                    mono
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
                  variant="ghost"
                  size="icon"
                  aria-label={t(REQUEST_TEXT.body.removeField)}
                  data-testid={REQUEST_TEST_IDS.body.remove(field.id)}
                  disabled={readOnly}
                  onClick={() => onRemoveField(field.id)}
                >
                  <Icon name="trash" size={14} />
                </Button>
              </div>
            ))}
            <div>
              <Button variant="secondary" data-testid={REQUEST_TEST_IDS.body.add} disabled={readOnly} onClick={onAddField}>
                {t(REQUEST_TEXT.body.addField)}
              </Button>
            </div>
          </div>
          <p className="max-w-[62ch] text-[12px] leading-5 text-muted-foreground" data-testid={REQUEST_TEST_IDS.body.help}>
            {helpText}
          </p>
        </PaneSection>
      )}

      {isGraphql && (
        <PaneSection>
          <div className="grid min-w-0 gap-1.5">
            <Label htmlFor="request-body-query">{t(REQUEST_TEXT.body.graphqlQuery)}</Label>
            <VariableTextarea
              id="request-body-query"
              mono
              data-testid={REQUEST_TEST_IDS.body.query}
              aria-label={t(REQUEST_TEXT.body.graphqlQueryAria)}
              value={query}
              suggestions={suggestions}
              onVariableClick={onVariableClick}
              readOnly={readOnly}
              onValueChange={onQueryChange}
              placeholder={t(REQUEST_TEXT.body.graphqlQueryPlaceholder)}
            />
          </div>
          <div className="grid min-w-0 gap-1.5">
            <Label htmlFor="request-body-variables">{t(REQUEST_TEXT.body.graphqlVariables)}</Label>
            <VariableTextarea
              id="request-body-variables"
              mono
              data-testid={REQUEST_TEST_IDS.body.variables}
              aria-label={t(REQUEST_TEXT.body.graphqlVariablesAria)}
              value={variables}
              suggestions={suggestions}
              onVariableClick={onVariableClick}
              readOnly={readOnly}
              onValueChange={onVariablesChange}
              placeholder={variablesPlaceholder}
            />
          </div>
          <p className="max-w-[62ch] text-[12px] leading-5 text-muted-foreground" data-testid={REQUEST_TEST_IDS.body.help}>
            {helpText}
          </p>
        </PaneSection>
      )}

      {isRaw && (
        <>
          {isOther && (
            <div className="grid max-w-[360px] flex-none gap-1.5 px-4 py-3">
              <Label htmlFor="request-body-mime">{t(REQUEST_TEXT.body.contentType)}</Label>
              <VariableInput
                id="request-body-mime"
                mono
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
          <VariableCodeEditor
            data-testid={REQUEST_TEST_IDS.body.raw}
            aria-label={rawAriaLabel}
            highlight={isJson ? 'json' : undefined}
            value={rawValue}
            suggestions={suggestions}
            onVariableClick={onVariableClick}
            readOnly={readOnly}
            onValueChange={onRawChange}
            onBlur={(event) => onRawBlur(event.currentTarget.value)}
            onPaste={onRawPaste}
            placeholder={rawPlaceholder}
          />
          <PaneBar>
            {isJson ? (
              <>
                <span
                  role="status"
                  data-testid={REQUEST_TEST_IDS.body.jsonStatus}
                  className={cn('min-w-0 flex-1', jsonInvalid ? 'text-destructive' : 'text-ok')}
                >
                  {jsonMessage}
                </span>
                <Button
                  variant="link"
                  data-testid={REQUEST_TEST_IDS.body.formatJson}
                  disabled={readOnly || formatJsonDisabled}
                  onClick={onFormatJson}
                >
                  {t(REQUEST_TEXT.body.formatJson)}
                </Button>
              </>
            ) : (
              <span className="min-w-0 flex-1" data-testid={REQUEST_TEST_IDS.body.help}>
                {helpText}
              </span>
            )}
          </PaneBar>
        </>
      )}

      {isFile && (
        <PaneSection>
          <div className="flex min-w-0 items-center gap-2">
            <Button variant="secondary" data-testid={REQUEST_TEST_IDS.body.chooseFile} disabled={readOnly} onClick={onChooseBodyFile}>
              {t(REQUEST_TEXT.body.chooseFile)}
            </Button>
            <span className="min-w-0 truncate text-[12px] text-muted-foreground" title={filePath}>
              {fileText}
            </span>
          </div>
          <div className="grid max-w-[360px] gap-1.5">
            <Label htmlFor="request-body-file-type">{t(REQUEST_TEXT.body.contentType)}</Label>
            <VariableInput
              id="request-body-file-type"
              mono
              data-testid={REQUEST_TEST_IDS.body.fileType}
              aria-label={t(REQUEST_TEXT.body.fileContentTypeAria)}
              value={fileContentType}
              suggestions={suggestions}
              onVariableClick={onVariableClick}
              readOnly={readOnly}
              onValueChange={onContentTypeChange}
            />
          </div>
          <p className="max-w-[62ch] text-[12px] leading-5 text-muted-foreground">{t(REQUEST_TEXT.body.fileNote)}</p>
          <p className="max-w-[62ch] text-[12px] leading-5 text-muted-foreground" data-testid={REQUEST_TEST_IDS.body.help}>
            {helpText}
          </p>
        </PaneSection>
      )}

      {errorMessage && (
        <p className="flex-none px-4 pb-3 text-[12px] text-destructive" role="alert" data-testid={REQUEST_TEST_IDS.body.error}>
          {errorMessage}
        </p>
      )}
    </div>
  )
}
