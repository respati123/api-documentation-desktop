import { z } from 'zod'

export const bodyModes = ['form-data', 'urlencoded', 'graphql', 'json', 'xml', 'yaml', 'edn', 'text', 'other', 'file', 'none'] as const
export const bodyModeSchema = z.enum(bodyModes)
export type BodyMode = z.infer<typeof bodyModeSchema>

export function isBodyMode(value: unknown): value is BodyMode {
  return bodyModeSchema.safeParse(value).success
}

export const bodyFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.string(),
  enabled: z.boolean(),
  type: z.enum(['text', 'file']),
  filePath: z.string().optional(),
  fileName: z.string().optional(),
})
export type BodyField = z.infer<typeof bodyFieldSchema>

// Headers and query parameters share one shape.
const keyValueFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.string(),
  enabled: z.boolean(),
  description: z.string().optional(),
})
export const headerFieldSchema = keyValueFieldSchema
export type HeaderField = z.infer<typeof headerFieldSchema>
export const paramFieldSchema = keyValueFieldSchema
export type ParamField = z.infer<typeof paramFieldSchema>

export const requestAuthSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('none') }),
  z.object({ type: z.literal('bearer'), token: z.string() }),
  z.object({ type: z.literal('basic'), username: z.string(), password: z.string() }),
  z.object({ type: z.literal('api-key'), name: z.string(), value: z.string(), location: z.enum(['header', 'query']) }),
])
export type RequestAuth = z.infer<typeof requestAuthSchema>

export const responseContentSchema = z.object({ id: z.string(), mediaType: z.string(), schema: z.string(), example: z.string() })
export type ResponseContent = z.infer<typeof responseContentSchema>

export const responseDefinitionSchema = z.object({
  id: z.string(),
  statusCode: z.string(),
  description: z.string(),
  content: z.array(responseContentSchema),
})
export type ResponseDefinition = z.infer<typeof responseDefinitionSchema>

export const requestNodeSchema = z.object({
  id: z.string(),
  kind: z.literal('request'),
  name: z.string(),
  method: z.string(),
  url: z.string(),
  body: z.string(),
  bodyMode: bodyModeSchema.optional(),
  bodyFields: z.array(bodyFieldSchema).optional(),
  bodyVariables: z.string().optional(),
  bodyMimeType: z.string().optional(),
  bodyPath: z.string().optional(),
  bodyFileName: z.string().optional(),
  headers: z.array(headerFieldSchema).optional(),
  params: z.array(paramFieldSchema).optional(),
  pathParams: z.array(paramFieldSchema).optional(),
  auth: requestAuthSchema.optional(),
  documentation: z.string().optional(),
  responses: z.array(responseDefinitionSchema).optional(),
  openApiSchemas: z.record(z.string(), z.unknown()).optional(),
  deprecated: z.boolean().optional(),
  deprecationReason: z.string().optional(),
})
export type RequestNode = z.infer<typeof requestNodeSchema>

export const folderNodeSchema = z.object({
  id: z.string(),
  kind: z.literal('folder'),
  name: z.string(),
  get children() {
    return z.array(apiNodeSchema)
  },
})
export type FolderNode = z.infer<typeof folderNodeSchema>

export const apiNodeSchema = z.discriminatedUnion('kind', [requestNodeSchema, folderNodeSchema])
export type ApiNode = z.infer<typeof apiNodeSchema>
