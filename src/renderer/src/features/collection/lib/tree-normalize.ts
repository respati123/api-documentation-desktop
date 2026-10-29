import { hasUrlQuery, mergeUrlParamRows, replaceUrlParams, splitUrlParams } from '@/features/request'
import { stripLocalFilePaths } from '@/lib/merge'
import { normalizeWorkspaceVariables, shareableWorkspaceVariables, type WorkspaceVariables } from '@/lib/workspace-variables'
import {
  type ApiNode,
  type BodyField,
  type HeaderField,
  isBodyMode,
  type ParamField,
  type RequestAuth,
  type RequestNode,
  type ResponseContent,
  type ResponseDefinition,
} from '@/shared/models/api-node.model'

export function migrateNode(value: unknown): ApiNode | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (item.kind === 'request' && typeof item.id === 'string') {
    const body = typeof item.body === 'string' ? item.body : ''
    const url = typeof item.url === 'string' ? item.url : ''
    const storedParams = Array.isArray(item.params) ? item.params.filter(isParamField) : []
    const parsedUrl = splitUrlParams(url)
    const params = hasUrlQuery(url)
      ? mergeUrlParamRows(parsedUrl.params, storedParams)
      : Array.isArray(item.params)
        ? storedParams
        : parsedUrl.params
    const synchronizedUrl =
      hasUrlQuery(url) && params.length !== parsedUrl.params.length
        ? replaceUrlParams(url, params)
        : !hasUrlQuery(url) && params.length
          ? replaceUrlParams(url, params)
          : url
    return {
      ...item,
      url: synchronizedUrl,
      params,
      auth: isRequestAuth(item.auth) ? item.auth : { type: 'none' },
      body,
      bodyMode: isBodyMode(item.bodyMode) ? item.bodyMode : body.trim() ? 'json' : 'none',
      bodyFields: Array.isArray(item.bodyFields) ? item.bodyFields.filter(isBodyField) : [],
      headers: Array.isArray(item.headers)
        ? item.headers.filter(isHeaderField)
        : [{ id: crypto.randomUUID(), name: 'Accept', value: '*/*', enabled: true }],
      pathParams: Array.isArray(item.pathParams) ? item.pathParams.filter(isParamField) : [],
      documentation: typeof item.documentation === 'string' ? item.documentation : '',
      responses: normalizeResponseDefinitions(item.responses),
      ...(item.openApiSchemas && typeof item.openApiSchemas === 'object' && !Array.isArray(item.openApiSchemas)
        ? { openApiSchemas: item.openApiSchemas as Record<string, unknown> }
        : {}),
    } as unknown as RequestNode
  }
  if (item.kind === 'folder' && typeof item.id === 'string' && Array.isArray(item.children)) {
    return {
      id: item.id,
      kind: 'folder',
      name: String(item.name || 'Untitled folder'),
      children: item.children.map(migrateNode).filter((node): node is ApiNode => node !== null),
    }
  }
  // Keep collections and requests created by the previous version.
  if (typeof item.id === 'string' && Array.isArray(item.requests)) {
    const children = item.requests
      .map((request) => {
        if (!request || typeof request !== 'object') return null
        const saved = request as Record<string, unknown>
        if (typeof saved.id !== 'string') return null
        const url = String(saved.url || '')
        const migratedUrl = splitUrlParams(url)
        return {
          id: saved.id,
          kind: 'request' as const,
          name: String(saved.name || 'Untitled request'),
          method: String(saved.method || 'GET'),
          url: migratedUrl.url,
          body: String(saved.body || ''),
          headers: [{ id: crypto.randomUUID(), name: 'Accept', value: '*/*', enabled: true }],
          params: migratedUrl.params,
          auth: { type: 'none' as const },
        }
      })
      .filter((node) => node !== null) as unknown as RequestNode[]
    return { id: item.id, kind: 'folder', name: String(item.name || 'Untitled folder'), children }
  }
  return null
}

export function normalizeTree(value: unknown): ApiNode[] {
  return Array.isArray(value) ? value.map(migrateNode).filter((node): node is ApiNode => node !== null) : []
}

export function normalizeSharedTree(value: unknown): ApiNode[] {
  return stripLocalFilePaths(normalizeTree(value))
}

export function normalizeSharedVariables(value: unknown): WorkspaceVariables {
  return shareableWorkspaceVariables(normalizeWorkspaceVariables(value))
}

export function isBodyField(value: unknown): value is BodyField {
  if (!value || typeof value !== 'object') return false
  const field = value as Record<string, unknown>
  return (
    typeof field.id === 'string' &&
    typeof field.name === 'string' &&
    typeof field.value === 'string' &&
    typeof field.enabled === 'boolean' &&
    (field.type === 'text' || field.type === 'file') &&
    (field.filePath === undefined || typeof field.filePath === 'string') &&
    (field.fileName === undefined || typeof field.fileName === 'string')
  )
}

export function normalizeResponseDefinitions(value: unknown): ResponseDefinition[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item): ResponseDefinition[] => {
    if (!item || typeof item !== 'object') return []
    const response = item as Record<string, unknown>
    if (typeof response.statusCode !== 'string') return []
    const content: ResponseContent[] = Array.isArray(response.content)
      ? response.content.flatMap((entry): ResponseContent[] => {
          if (!entry || typeof entry !== 'object') return []
          const media = entry as Record<string, unknown>
          if (typeof media.mediaType !== 'string') return []
          return [
            {
              id: typeof media.id === 'string' ? media.id : crypto.randomUUID(),
              mediaType: media.mediaType,
              schema: typeof media.schema === 'string' ? media.schema : '',
              example: typeof media.example === 'string' ? media.example : '',
            },
          ]
        })
      : []
    return [
      {
        id: typeof response.id === 'string' ? response.id : crypto.randomUUID(),
        statusCode: response.statusCode,
        description: typeof response.description === 'string' ? response.description : '',
        content,
      },
    ]
  })
}

export function isHeaderField(value: unknown): value is HeaderField {
  if (!value || typeof value !== 'object') return false
  const field = value as Record<string, unknown>
  return (
    typeof field.id === 'string' &&
    typeof field.name === 'string' &&
    typeof field.value === 'string' &&
    typeof field.enabled === 'boolean' &&
    (field.description === undefined || typeof field.description === 'string')
  )
}

export function isParamField(value: unknown): value is ParamField {
  if (!value || typeof value !== 'object') return false
  const field = value as Record<string, unknown>
  return (
    typeof field.id === 'string' &&
    typeof field.name === 'string' &&
    typeof field.value === 'string' &&
    typeof field.enabled === 'boolean' &&
    (field.description === undefined || typeof field.description === 'string')
  )
}

export function isRequestAuth(value: unknown): value is RequestAuth {
  if (!value || typeof value !== 'object') return false
  const auth = value as Record<string, unknown>
  if (auth.type === 'none') return true
  if (auth.type === 'bearer') return typeof auth.token === 'string'
  if (auth.type === 'basic') return typeof auth.username === 'string' && typeof auth.password === 'string'
  return (
    auth.type === 'api-key' &&
    typeof auth.name === 'string' &&
    typeof auth.value === 'string' &&
    (auth.location === 'header' || auth.location === 'query')
  )
}
