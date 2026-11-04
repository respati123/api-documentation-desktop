import { X } from 'lucide-react'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEST_IDS } from '@/features/request/constants/request-test-ids.constants'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import type { useResponseContractViewModel } from '@/features/request/viewmodels/use-response-contract.viewmodel'
import { DebouncedInput, DebouncedTextarea } from '@/shared/components/debounced-field'
import { SectionHeading } from '@/shared/components/section-heading'
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
    <div className="grid min-w-0 content-start gap-5" data-testid={REQUEST_TEST_IDS.contract.container}>
      <SectionHeading
        className="flex items-center justify-between gap-4"
        title={t(REQUEST_TEXT.contract.title)}
        description={t(REQUEST_TEXT.contract.description)}
        action={
          <Button type="button" variant="outline" size="sm" data-testid={REQUEST_TEST_IDS.contract.add} disabled={readOnly} onClick={onAdd}>
            {t(REQUEST_TEXT.contract.add)}
          </Button>
        }
      />
      {isEmpty && (
        <div
          className="grid gap-2 rounded-lg border border-dashed border-border p-6 text-center"
          data-testid={REQUEST_TEST_IDS.contract.empty}
        >
          <strong className="text-sm font-medium text-foreground">{t(REQUEST_TEXT.contract.emptyTitle)}</strong>
          <span className="text-sm text-muted-foreground">{t(REQUEST_TEXT.contract.emptyDescription)}</span>
        </div>
      )}
      {items.map((response) => (
        <article key={response.id} className="grid min-w-0 gap-4 rounded-lg border border-border bg-card p-4 text-card-foreground">
          <div className="grid items-end gap-3 md:grid-cols-[120px_minmax(0,1fr)_auto]">
            <div className="grid gap-1.5">
              <Label htmlFor={`status-${response.id}`}>{t(REQUEST_TEXT.contract.status)}</Label>
              <div className="flex items-center gap-2">
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
                {response.statusClass && <Badge variant={statusVariant(response.statusClass)}>{response.statusClass}</Badge>}
              </div>
            </div>
            <div className="grid min-w-0 gap-1.5">
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
              data-testid={REQUEST_TEST_IDS.contract.remove(response.id)}
              aria-label={response.removeLabel}
              disabled={readOnly}
              onClick={() => onRemove(response.id)}
            >
              <X className="size-4" />
            </Button>
          </div>

          {response.content.map((item) => (
            <section key={item.id} className="grid min-w-0 gap-3 border-t border-border pt-4">
              <div className="flex flex-wrap items-end gap-3">
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
                    className="min-h-32 font-mono text-xs"
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
                      onClick={() => onFormatExample(response.id, item.id)}
                    >
                      {t(REQUEST_TEXT.contract.formatExample)}
                    </Button>
                  </div>
                  <DebouncedTextarea
                    id={`example-${item.id}`}
                    data-testid={REQUEST_TEST_IDS.contract.example(item.id)}
                    aria-label={item.exampleLabel}
                    className="min-h-32 font-mono text-xs"
                    value={item.example}
                    readOnly={readOnly}
                    spellCheck={false}
                    placeholder={t(REQUEST_TEXT.contract.examplePlaceholder)}
                    onValueChange={(value) => onExampleChange(response.id, item.id, value)}
                  />
                </div>
              </div>
            </section>
          ))}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="justify-self-start"
            data-testid={REQUEST_TEST_IDS.contract.addContent(response.id)}
            disabled={readOnly}
            onClick={() => onAddContent(response.id)}
          >
            {t(REQUEST_TEXT.contract.addContent)}
          </Button>
        </article>
      ))}
    </div>
  )
}
