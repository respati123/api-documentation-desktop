import type { SavedRequest } from '@/models/workspace.model'

export function toApiRequest(request: SavedRequest): ApiRequest {
  return {
    method: request.method,
    url: request.url,
    headers: request.headers ?? [],
    params: request.params ?? [],
    auth: request.auth ?? { type: 'none' },
    body: request.body,
    bodyMode: request.bodyMode ?? (request.body.trim() ? 'json' : 'none'),
    bodyFields: request.bodyFields ?? [],
    bodyVariables: request.bodyVariables ?? '{}',
    bodyMimeType: request.bodyMimeType,
    bodyPath: request.bodyPath,
    bodyFileName: request.bodyFileName,
  }
}
