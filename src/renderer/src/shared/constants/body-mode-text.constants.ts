import type { BodyMode } from '@/shared/models/api-node.model'

// Labels for each body mode. They live in the shared `common` namespace, so every feature reads the same words.
export const BODY_MODE_TEXT = {
  'form-data': 'bodyMode.formData',
  urlencoded: 'bodyMode.urlencoded',
  graphql: 'bodyMode.graphql',
  json: 'bodyMode.json',
  xml: 'bodyMode.xml',
  yaml: 'bodyMode.yaml',
  edn: 'bodyMode.edn',
  text: 'bodyMode.text',
  other: 'bodyMode.other',
  file: 'bodyMode.file',
  none: 'bodyMode.none',
} as const satisfies Record<BodyMode, string>
