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
  requestNodeSchema,
} from '@/shared/models/api-node.model'
import { isRecord } from '@/shared/utils/record'

// Turns one stored node, in any saved version, into a node the app can use. Anything that still does not match the model is dropped.
export function migrateNode(value: unknown): ApiNode | null {
  if (!isRecord(value)) return null
  const item = value
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
    const parsed = requestNodeSchema.safeParse({
      ...item,
      name: typeof item.name === 'string' ? item.name : 'Untitled request',
      method: typeof item.method === 'string' ? item.method : 'GET',
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
      preScript: typeof item.preScript === 'string' ? item.preScript : undefined,
      postScript: typeof item.postScript === 'string' ? item.postScript : undefined,
      responses: normalizeResponseDefinitions(item.responses),
      openApiSchemas: isRecord(item.openApiSchemas) ? item.openApiSchemas : undefined,
    })
    return parsed.success ? parsed.data : null
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
    const children = item.requests.flatMap((request): RequestNode[] => {
      if (!isRecord(request) || typeof request.id !== 'string') return []
      const url = String(request.url || '')
      const migratedUrl = splitUrlParams(url)
      const parsed = requestNodeSchema.safeParse({
        id: request.id,
        kind: 'request',
        name: String(request.name || 'Untitled request'),
        method: String(request.method || 'GET'),
        url: migratedUrl.url,
        body: String(request.body || ''),
        headers: [{ id: crypto.randomUUID(), name: 'Accept', value: '*/*', enabled: true }],
        params: migratedUrl.params,
        auth: { type: 'none' },
      })
      return parsed.success ? [parsed.data] : []
    })
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
  if (!isRecord(value)) return false
  const field = value
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
    if (!isRecord(item)) return []
    const response = item
    if (typeof response.statusCode !== 'string') return []
    const content: ResponseContent[] = Array.isArray(response.content)
      ? response.content.flatMap((entry): ResponseContent[] => {
          if (!isRecord(entry)) return []
          const media = entry
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
  if (!isRecord(value)) return false
  const field = value
  return (
    typeof field.id === 'string' &&
    typeof field.name === 'string' &&
    typeof field.value === 'string' &&
    typeof field.enabled === 'boolean' &&
    (field.description === undefined || typeof field.description === 'string')
  )
}

export function isParamField(value: unknown): value is ParamField {
  if (!isRecord(value)) return false
  const field = value
  return (
    typeof field.id === 'string' &&
    typeof field.name === 'string' &&
    typeof field.value === 'string' &&
    typeof field.enabled === 'boolean' &&
    (field.description === undefined || typeof field.description === 'string')
  )
}

export function isRequestAuth(value: unknown): value is RequestAuth {
  if (!isRecord(value)) return false
  const auth = value
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
