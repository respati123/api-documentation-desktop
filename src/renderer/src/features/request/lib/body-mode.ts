import type { BodyMode, RequestNode } from '@/shared/models/api-node.model'

// A request saved before body modes existed has no mode, so a non-empty body counts as JSON.
export function effectiveBodyMode(request: Pick<RequestNode, 'bodyMode' | 'body'>): BodyMode {
  return request.bodyMode ?? (request.body.trim() ? 'json' : 'none')
}
