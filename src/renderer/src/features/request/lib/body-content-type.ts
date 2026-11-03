import type { BodyMode } from '@/shared/models/api-node.model'

export function bodyContentType(mode: BodyMode): string {
  switch (mode) {
    case 'graphql':
    case 'json':
      return 'application/json'
    case 'xml':
      return 'application/xml'
    case 'yaml':
      return 'application/yaml'
    case 'edn':
      return 'application/edn'
    default:
      return 'text/plain'
  }
}
