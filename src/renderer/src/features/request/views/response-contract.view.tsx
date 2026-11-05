import { X } from 'lucide-react'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEST_IDS } from '@/features/request/constants/request-test-ids.constants'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import type { useResponseContractViewModel } from '@/features/request/viewmodels/use-response-contract.viewmodel'
import { DebouncedInput, DebouncedTextarea } from '@/shared/components/debounced-field'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'

export type ResponseContractViewProps = ReturnType<typeof useResponseContractViewModel>

// Success codes read as secondary, client errors as outline, and server errors as destructive.
function statusVariant(statusClass: string): 'secondary' | 'outline' | 'destructive' {
  if (statusClass === '5xx') return 'destructive'
  if (statusClass === '4xx') return 'outline'
  return 'secondary'
}

// Code fields share one look: monospace, a tinted surface, and room to read a whole payload.
const codeField = 'min-h-48 resize-y bg-muted/40 font-mono text-xs leading-5'

export function ResponseContractView({
  readOnly,
  isEmpty,
  items,
  onAdd,
  onRemove,
  onStatusChange,
  onDescriptionChange,
  onAddContent,
  onRemoveContent,
  onMediaTypeChange,
  onSchemaChange,
  onExampleChange,
  onFormatExample,
}: ResponseContractViewProps): ReactElement {
  const { t } = useTranslation('request')

  return (
    <div className="grid min-w-0 content-start gap-6" data-testid={REQUEST_TEST_IDS.contract.container}>
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <h3 className="text-sm font-semibold text-foreground">{t(REQUEST_TEXT.contract.title)}</h3>
          <p className="text-sm text-muted-foreground">{t(REQUEST_TEXT.contract.description)}</p>
        </div>
        <Button type="button" variant="outline" size="sm" data-testid={REQUEST_TEST_IDS.contract.add} disabled={readOnly} onClick={onAdd}>
          {t(REQUEST_TEXT.contract.add)}
        </Button>
      </div>

      {isEmpty && (
        <div
          className="grid gap-2 rounded-xl border border-dashed border-border p-8 text-center"
          data-testid={REQUEST_TEST_IDS.contract.empty}
        >
          <strong className="text-sm font-medium text-foreground">{t(REQUEST_TEXT.contract.emptyTitle)}</strong>
          <span className="text-sm text-muted-foreground">{t(REQUEST_TEXT.contract.emptyDescription)}</span>
        </div>
      )}

      {items.map((response) => (
        <article key={response.id} className="grid min-w-0 gap-5 rounded-xl border border-border bg-card p-5 text-card-foreground">
          <header className="flex min-w-0 items-end gap-3">
            <div className="grid w-28 shrink-0 gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`status-${response.id}`}>{t(REQUEST_TEXT.contract.status)}</Label>
                {response.statusClass && <Badge variant={statusVariant(response.statusClass)}>{response.statusClass}</Badge>}
              </div>
              <DebouncedInput
                id={`status-${response.id}`}
                data-testid={REQUEST_TEST_IDS.contract.status(response.id)}
                aria-label={response.statusLabel}
                className="font-mono"
                value={response.statusCode}
                readOnly={readOnly}
                maxLength={12}
                placeholder={t(REQUEST_TEXT.contract.statusPlaceholder)}
                onValueChange={(value) => onStatusChange(response.id, value)}
              />
            </div>
            <div className="grid min-w-0 flex-1 gap-1.5">
              <Label htmlFor={`description-${response.id}`}>{t(REQUEST_TEXT.contract.descriptionLabel)}</Label>
              <DebouncedInput
                id={`description-${response.id}`}
                data-testid={REQUEST_TEST_IDS.contract.description(response.id)}
                aria-label={response.descriptionLabel}
                value={response.description}
                readOnly={readOnly}
                maxLength={500}
                placeholder={t(REQUEST_TEXT.contract.descriptionPlaceholder)}
                onValueChange={(value) => onDescriptionChange(response.id, value)}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              data-testid={REQUEST_TEST_IDS.contract.remove(response.id)}
              aria-label={response.removeLabel}
              disabled={readOnly}
              onClick={() => onRemove(response.id)}
            >
              <X className="size-4" />
            </Button>
          </header>

          {response.content.map((item) => (
            <section key={item.id} className="grid min-w-0 gap-4 rounded-lg border border-border p-4">
              <div className="flex items-end gap-3">
                <div className="grid w-full max-w-xs gap-1.5">
                  <Label htmlFor={`content-type-${item.id}`}>{t(REQUEST_TEXT.contract.contentType)}</Label>
                  <DebouncedInput
                    id={`content-type-${item.id}`}
                    data-testid={REQUEST_TEST_IDS.contract.mediaType(item.id)}
                    aria-label={item.mediaTypeLabel}
                    className="font-mono"
                    value={item.mediaType}
                    readOnly={readOnly}
                    maxLength={160}
                    placeholder={t(REQUEST_TEXT.contract.contentTypePlaceholder)}
                    onValueChange={(value) => onMediaTypeChange(response.id, item.id, value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  data-testid={REQUEST_TEST_IDS.contract.removeContent(item.id)}
                  aria-label={response.removeContentLabel}
                  disabled={readOnly}
                  onClick={() => onRemoveContent(response.id, item.id)}
                >
                  {t(REQUEST_TEXT.contract.removeContent)}
                </Button>
              </div>

              <div className="grid min-w-0 gap-4 lg:grid-cols-2">
                <div className="grid min-w-0 gap-1.5">
                  <Label htmlFor={`schema-${item.id}`}>{t(REQUEST_TEXT.contract.schema)}</Label>
                  <DebouncedTextarea
                    id={`schema-${item.id}`}
                    data-testid={REQUEST_TEST_IDS.contract.schema(item.id)}
                    aria-label={item.schemaLabel}
                    className={codeField}
                    value={item.schema}
                    readOnly={readOnly}
                    spellCheck={false}
                    placeholder={t(REQUEST_TEXT.contract.schemaPlaceholder)}
                    onValueChange={(value) => onSchemaChange(response.id, item.id, value)}
                  />
                </div>

                <div className="grid min-w-0 gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor={`example-${item.id}`}>{t(REQUEST_TEXT.contract.example)}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      data-testid={REQUEST_TEST_IDS.contract.formatExample(item.id)}
                      disabled={readOnly || !item.canFormat}
                      onClick={() => onFormatExample(response.id, item.id, item.example)}
                    >
                      {t(REQUEST_TEXT.contract.formatExample)}
                    </Button>
                  </div>
                  <DebouncedTextarea
                    id={`example-${item.id}`}
                    data-testid={REQUEST_TEST_IDS.contract.example(item.id)}
                    aria-label={item.exampleLabel}
                    className={codeField}
                    value={item.example}
                    readOnly={readOnly}
                    spellCheck={false}
                    placeholder={t(REQUEST_TEXT.contract.examplePlaceholder)}
                    onValueChange={(value) => onExampleChange(response.id, item.id, value)}
                    onBlur={(event) => onFormatExample(response.id, item.id, event.currentTarget.value)}
                  />
                  <p className="text-xs text-muted-foreground">{t(REQUEST_TEXT.contract.formatHint)}</p>
                </div>
              </div>
            </section>
          ))}

          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid={REQUEST_TEST_IDS.contract.addContent(response.id)}
              disabled={readOnly}
              onClick={() => onAddContent(response.id)}
            >
              {t(REQUEST_TEXT.contract.addContent)}
            </Button>
          </div>
        </article>
      ))}
    </div>
  )
}
