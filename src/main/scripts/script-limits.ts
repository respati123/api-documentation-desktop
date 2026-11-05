// Limits for one script run. Tests pass smaller values, so a limit can be reached quickly.
export interface ScriptLimits {
  maxSourceBytes: number
  timeoutMs: number
  memoryBytes: number
  maxLogLines: number
}

export const defaultScriptLimits: ScriptLimits = {
  maxSourceBytes: 50_000,
  timeoutMs: 2_000,
  memoryBytes: 32 * 1024 * 1024,
  maxLogLines: 200,
}
