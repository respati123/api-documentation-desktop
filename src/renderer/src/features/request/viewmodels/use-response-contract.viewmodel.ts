import { useTranslation } from 'react-i18next'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import { formatJsonText } from '@/features/request/lib/format-json'
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
        // The first digit of the code, as a class such as 2xx, or empty when the code is not a number.
        isError: /^[45]/.test(response.statusCode.trim()),
        statusClass: /^[1-5]/.test(response.statusCode.trim()) ? `${response.statusCode.trim()[0]}xx` : '',
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
          canFormat: formatJsonText(item.example) !== null,
          // Text that is not empty and not valid JSON. It stays as typed, and the field says so.
          isInvalidJson: item.example.trim() !== '' && formatJsonText(item.example) === null,
        })),
      }
    }),
    onAdd: () =>
      onChange([
        ...responses,
        { id: crypto.randomUUID(), statusCode: '200', description: t(REQUEST_TEXT.contract.defaultDescription), content: [newContent()] },
      ]),
    // Saves a received response as an example. A saved response with the same status is updated.
    onSaveExample: (example: { statusCode: string; description: string; mediaType: string; body: string }) => {
      const found = responses.find((item) => item.statusCode === example.statusCode)
      const content: ResponseContent = { ...newContent(), mediaType: example.mediaType, example: example.body }
      if (!found) {
        onChange([
          ...responses,
          { id: crypto.randomUUID(), statusCode: example.statusCode, description: example.description, content: [content] },
        ])
        return
      }
      const [first, ...rest] = found.content
      updateResponse(found.id, { content: [first ? { ...first, example: example.body } : content, ...rest] })
    },
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
    // Takes the text the field holds now. Called when the field loses focus, so the value is not yet in `responses`.
    onFormatExample: (id: string, contentId: string, example: string) => {
      const formatted = formatJsonText(example)
      if (formatted !== null) updateContent(id, contentId, { example: formatted })
    },
  }
}
