import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEST_IDS } from '@/features/request/constants/request-test-ids.constants'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import type { useResponseContractViewModel } from '@/features/request/viewmodels/use-response-contract.viewmodel'
import { DebouncedInput, DebouncedTextarea } from '@/shared/components/debounced-field'
import { Badge, Button, Disclosure, Icon, Label } from '@/shared/ui'

export type ResponseContractViewProps = ReturnType<typeof useResponseContractViewModel>

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
    <div className="grid min-w-0 content-start gap-4" data-testid={REQUEST_TEST_IDS.contract.container}>
      {isEmpty && (
        <p className="max-w-[62ch] text-[12px] leading-5 text-muted-foreground" data-testid={REQUEST_TEST_IDS.contract.empty}>
          {t(REQUEST_TEXT.contract.emptyDescription)}
        </p>
      )}

      {items.map((response) => (
        <Disclosure
          key={response.id}
          summary={
            <>
              <Badge shape="chip" variant={response.isError ? 'destructive' : 'success'}>
                {response.statusCode}
              </Badge>
              <span className="min-w-0 truncate">{response.description}</span>
            </>
          }
        >
          <div className="flex min-w-0 items-end gap-2">
            <div className="grid w-28 shrink-0 gap-1.5">
              <Label htmlFor={`status-${response.id}`}>{t(REQUEST_TEXT.contract.status)}</Label>
              <DebouncedInput
                id={`status-${response.id}`}
                mono
                data-testid={REQUEST_TEST_IDS.contract.status(response.id)}
                aria-label={response.statusLabel}
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
              variant="ghost"
              size="icon"
              data-testid={REQUEST_TEST_IDS.contract.remove(response.id)}
              aria-label={response.removeLabel}
              disabled={readOnly}
              onClick={() => onRemove(response.id)}
            >
              <Icon name="trash" size={14} />
            </Button>
          </div>

          {response.content.map((item) => (
            <section key={item.id} className="grid min-w-0 gap-4">
              <div className="flex items-end gap-2">
                <div className="grid w-full max-w-xs gap-1.5">
                  <Label htmlFor={`content-type-${item.id}`}>{t(REQUEST_TEXT.contract.contentType)}</Label>
                  <DebouncedInput
                    id={`content-type-${item.id}`}
                    mono
                    data-testid={REQUEST_TEST_IDS.contract.mediaType(item.id)}
                    aria-label={item.mediaTypeLabel}
                    value={item.mediaType}
                    readOnly={readOnly}
                    maxLength={160}
                    placeholder={t(REQUEST_TEXT.contract.contentTypePlaceholder)}
                    onValueChange={(value) => onMediaTypeChange(response.id, item.id, value)}
                  />
                </div>
                <Button
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

              <div className="grid min-w-0 gap-1.5">
                <Label htmlFor={`schema-${item.id}`}>{t(REQUEST_TEXT.contract.schema)}</Label>
                <DebouncedTextarea
                  id={`schema-${item.id}`}
                  mono
                  data-testid={REQUEST_TEST_IDS.contract.schema(item.id)}
                  aria-label={item.schemaLabel}
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
                    variant="link"
                    data-testid={REQUEST_TEST_IDS.contract.formatExample(item.id)}
                    disabled={readOnly || !item.canFormat}
                    onClick={() => onFormatExample(response.id, item.id, item.example)}
                  >
                    {t(REQUEST_TEXT.contract.formatExample)}
                  </Button>
                </div>
                <DebouncedTextarea
                  id={`example-${item.id}`}
                  mono
                  data-testid={REQUEST_TEST_IDS.contract.example(item.id)}
                  aria-label={item.exampleLabel}
                  value={item.example}
                  readOnly={readOnly}
                  spellCheck={false}
                  placeholder={t(REQUEST_TEXT.contract.examplePlaceholder)}
                  onValueChange={(value) => onExampleChange(response.id, item.id, value)}
                  onBlur={(event) => onFormatExample(response.id, item.id, event.currentTarget.value)}
                />
                <p className={item.isInvalidJson ? 'text-[12px] text-destructive' : 'text-[12px] text-muted-foreground'}>
                  {t(item.isInvalidJson ? REQUEST_TEXT.contract.invalidJson : REQUEST_TEXT.contract.formatHint)}
                </p>
              </div>
            </section>
          ))}

          <div>
            <Button
              variant="ghost"
              size="sm"
              data-testid={REQUEST_TEST_IDS.contract.addContent(response.id)}
              disabled={readOnly}
              onClick={() => onAddContent(response.id)}
            >
              {t(REQUEST_TEXT.contract.addContent)}
            </Button>
          </div>
        </Disclosure>
      ))}

      <div>
        <Button variant="secondary" data-testid={REQUEST_TEST_IDS.contract.add} disabled={readOnly} onClick={onAdd}>
          {t(REQUEST_TEXT.contract.add)}
        </Button>
      </div>
    </div>
  )
}
