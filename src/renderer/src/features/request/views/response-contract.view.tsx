import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEST_IDS } from '@/features/request/constants/request-test-ids.constants'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import type { useResponseContractViewModel } from '@/features/request/viewmodels/use-response-contract.viewmodel'
import { DebouncedInput, DebouncedTextarea } from '@/shared/components/debounced-field'
import { SectionHeading } from '@/shared/components/section-heading'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'

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
}: ResponseContractViewProps): ReactElement {
  const { t } = useTranslation('request')

  return (
    <div className="responses-editor" data-testid={REQUEST_TEST_IDS.contract.container}>
      <SectionHeading
        className="responses-editor-heading"
        title={t(REQUEST_TEXT.contract.title)}
        description={t(REQUEST_TEXT.contract.description)}
        action={
          <Button type="button" variant="outline" size="sm" data-testid={REQUEST_TEST_IDS.contract.add} disabled={readOnly} onClick={onAdd}>
            {t(REQUEST_TEXT.contract.add)}
          </Button>
        }
      />
      {isEmpty && (
        <div className="responses-empty" data-testid={REQUEST_TEST_IDS.contract.empty}>
          <strong>{t(REQUEST_TEXT.contract.emptyTitle)}</strong>
          <span>{t(REQUEST_TEXT.contract.emptyDescription)}</span>
        </div>
      )}
      {items.map((response) => (
        <article className="response-definition" key={response.id}>
          <div className="response-definition-heading">
            <div>
              <Label htmlFor={`status-${response.id}`}>{t(REQUEST_TEXT.contract.status)}</Label>
              <DebouncedInput
                id={`status-${response.id}`}
                data-testid={REQUEST_TEST_IDS.contract.status(response.id)}
                aria-label={response.statusLabel}
                value={response.statusCode}
                readOnly={readOnly}
                maxLength={12}
                placeholder={t(REQUEST_TEXT.contract.statusPlaceholder)}
                onValueChange={(value) => onStatusChange(response.id, value)}
              />
            </div>
            <div className="response-description-field">
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
              size="sm"
              className="response-remove"
              data-testid={REQUEST_TEST_IDS.contract.remove(response.id)}
              aria-label={response.removeLabel}
              disabled={readOnly}
              onClick={() => onRemove(response.id)}
            >
              ×
            </Button>
          </div>
          {response.content.map((item) => (
            <section className="response-content-definition" key={item.id}>
              <div className="response-content-heading">
                <div>
                  <Label htmlFor={`content-type-${item.id}`}>{t(REQUEST_TEXT.contract.contentType)}</Label>
                  <DebouncedInput
                    id={`content-type-${item.id}`}
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
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="response-remove"
                  data-testid={REQUEST_TEST_IDS.contract.removeContent(item.id)}
                  aria-label={response.removeContentLabel}
                  disabled={readOnly}
                  onClick={() => onRemoveContent(response.id, item.id)}
                >
                  {t(REQUEST_TEXT.contract.removeContent)}
                </Button>
              </div>
              <div className="response-content-fields">
                <div>
                  <Label htmlFor={`schema-${item.id}`}>{t(REQUEST_TEXT.contract.schema)}</Label>
                  <DebouncedTextarea
                    id={`schema-${item.id}`}
                    data-testid={REQUEST_TEST_IDS.contract.schema(item.id)}
                    aria-label={item.schemaLabel}
                    className="response-code-editor"
                    value={item.schema}
                    readOnly={readOnly}
                    spellCheck={false}
                    placeholder={t(REQUEST_TEXT.contract.schemaPlaceholder)}
                    onValueChange={(value) => onSchemaChange(response.id, item.id, value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`example-${item.id}`}>{t(REQUEST_TEXT.contract.example)}</Label>
                  <DebouncedTextarea
                    id={`example-${item.id}`}
                    data-testid={REQUEST_TEST_IDS.contract.example(item.id)}
                    aria-label={item.exampleLabel}
                    className="response-code-editor"
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
            className="response-add-content"
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
