import { useTranslation } from 'react-i18next'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import type { ResponseContent, ResponseDefinition } from '@/shared/models/api-node.model'

// Owns the response contract tab: the documented status codes and their payloads.
export function useResponseContractViewModel({
  responses,
  readOnly,
  onChange,
}: {
  responses: ResponseDefinition[]
  readOnly: boolean
  onChange: (responses: ResponseDefinition[]) => void
}) {
  const { t } = useTranslation('request')

  const newContent = (): ResponseContent => ({ id: crypto.randomUUID(), mediaType: 'application/json', schema: '', example: '' })
  const updateResponse = (id: string, patch: Partial<ResponseDefinition>) =>
    onChange(responses.map((response) => (response.id === id ? { ...response, ...patch } : response)))
  const updateContent = (responseId: string, contentId: string, patch: Partial<ResponseContent>) =>
    onChange(
      responses.map((response) =>
        response.id === responseId
          ? { ...response, content: response.content.map((item) => (item.id === contentId ? { ...item, ...patch } : item)) }
          : response,
      ),
    )

  return {
    readOnly,
    isEmpty: responses.length === 0,
    items: responses.map((response, index) => {
      const name = response.statusCode || String(index + 1)
      return {
        id: response.id,
        statusCode: response.statusCode,
        description: response.description,
        statusLabel: t(REQUEST_TEXT.contract.statusAria, { position: index + 1 }),
        descriptionLabel: t(REQUEST_TEXT.contract.descriptionAria, { position: index + 1 }),
        removeLabel: t(REQUEST_TEXT.contract.removeResponse, { name }),
        removeContentLabel: t(REQUEST_TEXT.contract.removeContentAria, { name }),
        content: response.content.map((item, contentIndex) => ({
          id: item.id,
          mediaType: item.mediaType,
          schema: item.schema,
          example: item.example,
          mediaTypeLabel: t(REQUEST_TEXT.contract.contentTypeAria, { position: index + 1, content: contentIndex + 1 }),
          schemaLabel: t(REQUEST_TEXT.contract.schemaAria, { position: index + 1, content: contentIndex + 1 }),
          exampleLabel: t(REQUEST_TEXT.contract.exampleAria, { position: index + 1, content: contentIndex + 1 }),
        })),
      }
    }),
    onAdd: () =>
      onChange([
        ...responses,
        { id: crypto.randomUUID(), statusCode: '200', description: t(REQUEST_TEXT.contract.defaultDescription), content: [newContent()] },
      ]),
    onRemove: (id: string) => onChange(responses.filter((response) => response.id !== id)),
    onStatusChange: (id: string, statusCode: string) => updateResponse(id, { statusCode }),
    onDescriptionChange: (id: string, description: string) => updateResponse(id, { description }),
    onAddContent: (id: string) => {
      const response = responses.find((item) => item.id === id)
      if (response) updateResponse(id, { content: [...response.content, newContent()] })
    },
    onRemoveContent: (id: string, contentId: string) => {
      const response = responses.find((item) => item.id === id)
      if (response) updateResponse(id, { content: response.content.filter((item) => item.id !== contentId) })
    },
    onMediaTypeChange: (id: string, contentId: string, mediaType: string) => updateContent(id, contentId, { mediaType }),
    onSchemaChange: (id: string, contentId: string, schema: string) => updateContent(id, contentId, { schema }),
    onExampleChange: (id: string, contentId: string, example: string) => updateContent(id, contentId, { example }),
  }
}
