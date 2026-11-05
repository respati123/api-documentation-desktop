import { getQuickJS, shouldInterruptAfterDeadline } from 'quickjs-emscripten'
import { z } from 'zod'
import type { ScriptRunInput, ScriptRunResult } from '../../renderer/src/shared/ipc/script-contract'
import { preludeSource } from './prelude'
import { redactSecrets } from './redact'
import { defaultScriptLimits, type ScriptLimits } from './script-limits'

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

function emptyResult(error: string | null, errorLine: number | null = null): ScriptRunResult {
  return { ok: false, error, errorLine, logs: [], logsTruncated: false, checks: [], writes: [], removals: [], request: null }
}

// The file name the user's script is evaluated under, so QuickJS reports its errors as `user-script.js:line:column`.
const scriptFileName = 'user-script.js'

const quickJsErrorSchema = z.object({ message: z.unknown().optional(), stack: z.string().optional(), lineNumber: z.number().optional() })

// The message of a dumped QuickJS error. A script can throw a plain value, so anything else is turned into text.
function messageOf(dumped: unknown): string {
  if (typeof dumped === 'string') return dumped
  const parsed = quickJsErrorSchema.safeParse(dumped)
  return parsed.success && parsed.data.message !== undefined ? String(parsed.data.message) : String(dumped)
}

// The line of the user's script where the error happened. Syntax errors give it directly. A runtime error gives it in the first stack frame in the script.
// Lines are not shifted, because the wrapper starts on the same line as the script.
function errorLineOf(dumped: unknown): number | null {
  const parsed = quickJsErrorSchema.safeParse(dumped)
  if (!parsed.success) return null
  if (parsed.data.lineNumber !== undefined) return parsed.data.lineNumber
  const frame = new RegExp(`${scriptFileName.replace('.', '\\.')}:(\\d+):\\d+`).exec(parsed.data.stack ?? '')
  return frame ? Number(frame[1]) : null
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
    const script = context.evalCode(`(function () { ${input.source}\n})();`, scriptFileName)
    if ('error' in script && script.error) {
      const dumped = context.dump(script.error)
      script.error.dispose()
      const message = messageOf(dumped)
      // A script the engine stopped has no reliable line: the interrupt reports where the check ran, not where the loop was.
      const stopped = message.includes('interrupted') || message.includes('out of memory')
      return emptyResult(redact(explainFailure(message, limits)), stopped ? null : errorLineOf(dumped))
    }
    context.unwrapResult(script).dispose()

    const stateHandle = context.unwrapResult(context.evalCode('JSON.stringify(globalThis.__apidocsState)'))
    const parsed = stateSchema.safeParse(JSON.parse(String(context.dump(stateHandle))))
    stateHandle.dispose()
    if (!parsed.success) return emptyResult('The script produced no result.')

    return {
      ok: true,
      error: null,
      errorLine: null,
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
