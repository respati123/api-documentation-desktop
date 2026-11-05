import { getQuickJS, shouldInterruptAfterDeadline } from 'quickjs-emscripten'
import { z } from 'zod'
import { preludeSource } from './prelude'
import { redactSecrets } from './redact'
import { defaultScriptLimits, type ScriptLimits } from './script-limits'

export type ScriptScope = 'environment' | 'global'

export interface ScriptHeader {
  name: string
  value: string
}

export interface ScriptRequest {
  method: string
  url: string
  headers: ScriptHeader[]
}

export interface ScriptResponse {
  status: number
  elapsedMs: number
  headers: Record<string, string>
  body: string
}

export interface ScriptRunInput {
  phase: 'pre' | 'post'
  source: string
  // Values the script may read. Secret values are included, so the script can use them. They are redacted from everything the script returns.
  variables: { environment: Record<string, string>; globals: Record<string, string> }
  secretValues: string[]
  request: ScriptRequest
  response?: ScriptResponse
}

export interface ScriptCheck {
  name: string
  passed: boolean
  message?: string
}

export interface ScriptRunResult {
  ok: boolean
  error: string | null
  logs: string[]
  logsTruncated: boolean
  checks: ScriptCheck[]
  writes: Array<{ scope: ScriptScope; name: string; value: string }>
  removals: Array<{ scope: ScriptScope; name: string }>
  // The request after a pre-request script, or null for a post-response script.
  request: ScriptRequest | null
}

const stateSchema = z.object({
  logs: z.array(z.string()),
  logsTruncated: z.boolean(),
  checks: z.array(z.object({ name: z.string(), passed: z.boolean(), message: z.string().optional() })),
  writes: z.array(z.object({ scope: z.enum(['environment', 'global']), name: z.string(), value: z.string() })),
  removals: z.array(z.object({ scope: z.enum(['environment', 'global']), name: z.string() })),
  request: z
    .object({
      method: z.string(),
      url: z.string(),
      headers: z.array(z.object({ name: z.string(), value: z.string() })),
    })
    .nullable(),
})

function emptyResult(error: string | null): ScriptRunResult {
  return { ok: false, error, logs: [], logsTruncated: false, checks: [], writes: [], removals: [], request: null }
}

// Only the first matching message is turned into a plain sentence. Anything else is reported as the engine said it.
function explainFailure(message: string, limits: ScriptLimits): string {
  if (message.includes('interrupted')) return `Script stopped: it ran for more than ${limits.timeoutMs / 1000} seconds.`
  if (message.includes('out of memory'))
    return `Script stopped: it used more than ${Math.round(limits.memoryBytes / (1024 * 1024))} MB of memory.`
  return message
}

// The sandbox engine is created once and reused. Each run still gets a new context, so no state carries over between runs.
let quickJs: ReturnType<typeof getQuickJS> | undefined

export async function runScript(input: ScriptRunInput, limitOverrides: Partial<ScriptLimits> = {}): Promise<ScriptRunResult> {
  const limits = { ...defaultScriptLimits, ...limitOverrides }
  if (Buffer.byteLength(input.source, 'utf8') > limits.maxSourceBytes) {
    return emptyResult(`Script is larger than ${limits.maxSourceBytes / 1000} KB.`)
  }

  quickJs ??= getQuickJS()
  const engine = await quickJs
  const context = engine.newContext()
  const redact = (text: string) => redactSecrets(text, input.secretValues)

  try {
    context.runtime.setMemoryLimit(limits.memoryBytes)
    context.runtime.setInterruptHandler(shouldInterruptAfterDeadline(Date.now() + limits.timeoutMs))

    const payload = JSON.stringify({
      phase: input.phase,
      variables: input.variables,
      request: input.request,
      response: input.response ?? null,
      maxLogLines: limits.maxLogLines,
    })
    const payloadHandle = context.newString(payload)
    context.setProp(context.global, '__apidocsInput', payloadHandle)
    payloadHandle.dispose()

    context.unwrapResult(context.evalCode(preludeSource)).dispose()
    context.unwrapResult(context.evalCode(`(function () {\n${input.source}\n})();`)).dispose()

    const stateHandle = context.unwrapResult(context.evalCode('JSON.stringify(globalThis.__apidocsState)'))
    const parsed = stateSchema.safeParse(JSON.parse(String(context.dump(stateHandle))))
    stateHandle.dispose()
    if (!parsed.success) return emptyResult('The script produced no result.')

    return {
      ok: true,
      error: null,
      logs: parsed.data.logs.map(redact),
      logsTruncated: parsed.data.logsTruncated,
      checks: parsed.data.checks.map((check) => ({
        name: redact(check.name),
        passed: check.passed,
        ...(check.message === undefined ? {} : { message: redact(check.message) }),
      })),
      writes: parsed.data.writes,
      removals: parsed.data.removals,
      request: input.phase === 'pre' ? parsed.data.request : null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ...emptyResult(redact(explainFailure(message, limits))) }
  } finally {
    context.dispose()
  }
}
