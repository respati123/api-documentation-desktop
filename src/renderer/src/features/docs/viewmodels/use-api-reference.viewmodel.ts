import { useTranslation } from 'react-i18next'
import { DOCS_TEXT } from '@/features/docs/constants/docs-text.constants'
import { bodyModeOf, isSensitiveName, maskedValue, schemaForDisplay } from '@/features/docs/lib/api-reference'
import { BODY_MODE_TEXT } from '@/shared/constants/body-mode-text.constants'
import type { RequestNode } from '@/shared/models/api-node.model'

export type CodeBlockModel = { label: string; value: string }

export type PayloadModel =
  | { kind: 'text'; text: string }
  | { kind: 'fields'; rows: { id: string; name: string; value: string }[] }
  | { kind: 'blocks'; blocks: CodeBlockModel[] }

export type DocTableModel = {
  title: string
  rows: { id: string; name: string; example: string; description: string }[]
}

export type ResponseModel = {
  id: string
  statusCode: string
  isError: boolean
  description: string
  contents: { id: string; mediaType: string; blocks: CodeBlockModel[]; emptyText: string | null }[]
  emptyText: string | null
}

// Builds everything the API reference page shows. The view only lays it out.
export function useApiReferenceViewModel({
  request,
  folderName,
  onOpenRequest,
  onOpenOpenApi,
}: {
  request: RequestNode
  folderName: string
  onOpenRequest: () => void
  onOpenOpenApi: () => void
}) {
  const { t } = useTranslation('docs')
  const { t: tCommon } = useTranslation('common')
  const mode = bodyModeOf(request)
  const modeLabel = tCommon(BODY_MODE_TEXT[mode])
  const auth = request.auth ?? { type: 'none' as const }

  const table = (
    title: string,
    items: { id: string; name: string; value: string; description?: string }[],
    emptyExample: string,
  ): DocTableModel => ({
    title,
    rows: items.map((item) => ({
      id: item.id,
      name: item.name,
      example: isSensitiveName(item.name) ? maskedValue : item.value || emptyExample,
      description: item.description || t(DOCS_TEXT.reference.noDescription),
    })),
  })

  const pathParams = (request.pathParams ?? []).filter((item) => item.name.trim())
  const params = (request.params ?? []).filter((item) => item.enabled && item.name.trim())
  const headers = (request.headers ?? []).filter((item) => item.enabled && item.name.trim())

  const pathTable = pathParams.length
    ? table(
        t(DOCS_TEXT.reference.pathParams),
        pathParams.map((item) => ({ ...item, value: item.value || t(DOCS_TEXT.reference.required) })),
        t(DOCS_TEXT.reference.required),
      )
    : null
  const queryTable = params.length ? table(t(DOCS_TEXT.reference.queryParams), params, t(DOCS_TEXT.reference.noExample)) : null
  const headerTable = headers.length ? table(t(DOCS_TEXT.reference.headers), headers, t(DOCS_TEXT.reference.noExample)) : null

  function payload(): PayloadModel {
    if (mode === 'none') return { kind: 'text', text: t(DOCS_TEXT.reference.noBody) }
    if (mode === 'form-data' || mode === 'urlencoded') {
      const fields = (request.bodyFields ?? []).filter((field) => field.enabled && field.name.trim())
      if (!fields.length) return { kind: 'text', text: t(DOCS_TEXT.reference.noFields) }
      return {
        kind: 'fields',
        rows: fields.map((field) => ({
          id: field.id,
          name: field.name,
          value: isSensitiveName(field.name)
            ? maskedValue
            : field.type === 'file'
              ? field.fileName || t(DOCS_TEXT.reference.file)
              : field.value || t(DOCS_TEXT.reference.noExample),
        })),
      }
    }
    if (mode === 'file')
      return { kind: 'text', text: t(DOCS_TEXT.reference.rawFile, { type: request.bodyMimeType || 'application/octet-stream' }) }
    if (mode === 'graphql')
      return {
        kind: 'blocks',
        blocks: [
          { label: t(DOCS_TEXT.reference.graphqlQuery), value: request.body || t(DOCS_TEXT.reference.noCodeProvided) },
          { label: t(DOCS_TEXT.reference.variables), value: request.bodyVariables || '{}' },
        ],
      }
    return {
      kind: 'blocks',
      blocks: [
        { label: t(DOCS_TEXT.reference.payload, { mode: modeLabel }), value: request.body || t(DOCS_TEXT.reference.noCodeProvided) },
      ],
    }
  }

  const responses = (request.responses ?? []).map(
    (response): ResponseModel => ({
      id: response.id,
      statusCode: response.statusCode || t(DOCS_TEXT.reference.statusFallback),
      isError: /^([45])/.test(response.statusCode),
      description: response.description || t(DOCS_TEXT.reference.responseFallback),
      contents: response.content.map((content) => {
        const blocks: CodeBlockModel[] = []
        if (content.schema.trim())
          blocks.push({
            label: t(DOCS_TEXT.reference.schema),
            value: schemaForDisplay(content.schema, request.openApiSchemas),
          })
        if (content.example.trim()) blocks.push({ label: t(DOCS_TEXT.reference.examplePayload), value: content.example })
        return {
          id: content.id,
          mediaType: content.mediaType || t(DOCS_TEXT.reference.contentFallback),
          blocks,
          emptyText: blocks.length ? null : t(DOCS_TEXT.reference.noSchemaOrExample),
        }
      }),
      emptyText: response.content.length ? null : t(DOCS_TEXT.reference.noResponseBody),
    }),
  )

  const authDescription =
    auth.type === 'none'
      ? t(DOCS_TEXT.reference.authNone)
      : auth.type === 'api-key'
        ? auth.name
          ? t(DOCS_TEXT.reference.authApiKeyNamed, {
              location: auth.location === 'header' ? t(DOCS_TEXT.reference.locationHeader) : t(DOCS_TEXT.reference.locationQuery),
              name: auth.name,
            })
          : t(DOCS_TEXT.reference.authApiKey, {
              location: auth.location === 'header' ? t(DOCS_TEXT.reference.locationHeader) : t(DOCS_TEXT.reference.locationQuery),
            })
        : auth.type === 'basic'
          ? t(DOCS_TEXT.reference.authBasic)
          : t(DOCS_TEXT.reference.authBearer)

  return {
    ariaLabel: t(DOCS_TEXT.reference.ariaLabel, { name: request.name }),
    kicker: t(DOCS_TEXT.reference.kicker, { folder: folderName }),
    name: request.name,
    openApiLabel: t(DOCS_TEXT.reference.openApi),
    openRequestLabel: t(DOCS_TEXT.reference.openRequest),
    onOpenRequest,
    onOpenOpenApi,
    method: request.method,
    methodClass: `method-${request.method.toLowerCase()}`,
    routeText: request.url || t(DOCS_TEXT.reference.noUrl),
    deprecated: Boolean(request.deprecated),
    deprecatedLabel: t(DOCS_TEXT.reference.deprecated),
    deprecationReason: request.deprecated && request.deprecationReason ? request.deprecationReason : null,
    overview: request.documentation?.trim() ? request.documentation : null,
    overviewLabel: t(DOCS_TEXT.reference.overview),
    requestLabel: t(DOCS_TEXT.reference.request),
    authenticationLabel: t(DOCS_TEXT.reference.authentication),
    authDescription,
    bodyTypeLabel: t(DOCS_TEXT.reference.bodyType),
    bodyTypeName: modeLabel,
    tableHeadings: [t(DOCS_TEXT.reference.columnName), t(DOCS_TEXT.reference.columnExample), t(DOCS_TEXT.reference.columnDescription)],
    tables: [pathTable, queryTable, headerTable].filter((table): table is DocTableModel => table !== null),
    bodyLabel: t(DOCS_TEXT.reference.body),
    payload: payload(),
    responsesLabel: t(DOCS_TEXT.reference.responses),
    responseCount: t(DOCS_TEXT.reference.documented, { count: responses.length }),
    noResponse:
      responses.length === 0
        ? { title: t(DOCS_TEXT.reference.noResponseTitle), description: t(DOCS_TEXT.reference.noResponseDescription) }
        : null,
    responses,
  }
}
