import { effectiveBodyMode } from '@/features/request/lib/body-mode'
import type { RequestNode } from '@/shared/models/api-node.model'

// How many headers the request sends: the enabled custom ones plus the ones the app adds itself.
export function requestHeaderCount(request: RequestNode): number {
  const names = new Set(
    (request.headers ?? []).filter((header) => header.enabled && header.name.trim()).map((header) => header.name.trim().toLowerCase()),
  )
  for (const name of ['accept', 'host', 'user-agent']) names.add(name)
  if (effectiveBodyMode(request) !== 'none') names.add('content-type')
  const auth = request.auth ?? { type: 'none' as const }
  if (auth.type === 'bearer' && auth.token) names.add('authorization')
  if (auth.type === 'basic' && (auth.username || auth.password)) names.add('authorization')
  if (auth.type === 'api-key' && auth.location === 'header' && auth.name.trim() && auth.value) names.add(auth.name.trim().toLowerCase())
  return names.size
}
