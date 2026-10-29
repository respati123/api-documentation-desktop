import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import type { BodyMode } from '@/shared/models/api-node.model'

// One locale key per body mode, so no view builds a key from the mode name.
export const BODY_MODE_TEXT = {
  'form-data': REQUEST_TEXT.body.modeFormData,
  urlencoded: REQUEST_TEXT.body.modeUrlencoded,
  graphql: REQUEST_TEXT.body.modeGraphql,
  json: REQUEST_TEXT.body.modeJson,
  xml: REQUEST_TEXT.body.modeXml,
  yaml: REQUEST_TEXT.body.modeYaml,
  edn: REQUEST_TEXT.body.modeEdn,
  text: REQUEST_TEXT.body.modeText,
  other: REQUEST_TEXT.body.modeOther,
  file: REQUEST_TEXT.body.modeFile,
  none: REQUEST_TEXT.body.modeNone,
} as const satisfies Record<BodyMode, string>
