import { effectiveBodyMode } from '@/features/request/lib/body-mode'
import { requestHeaderCount } from '@/features/request/lib/header-count'
import type { RequestNode } from '@/shared/models/api-node.model'

export type RequestTabIndicators = { activeParams: number; hasBody: boolean; hasAuth: boolean; headers: number; responses: number }

export function requestTabIndicators(request: RequestNode): RequestTabIndicators {
  return {
    activeParams: (request.params ?? []).filter((param) => param.enabled && param.name.trim()).length,
    hasBody: effectiveBodyMode(request) !== 'none',
    hasAuth: (request.auth ?? { type: 'none' }).type !== 'none',
    headers: requestHeaderCount(request),
    responses: request.responses?.length ?? 0,
  }
}
