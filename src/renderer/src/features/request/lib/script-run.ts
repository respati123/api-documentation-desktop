import type { ResponseData, SkippedVariable } from '@/features/response'
import type { WorkspaceEnvironment, WorkspaceVariable, WorkspaceVariables } from '@/lib/workspace-variables'
import type { ScriptRequest, ScriptResponse, ScriptRunResult } from '@/shared/ipc/script-contract'
import type { RequestNode } from '@/shared/models/api-node.model'

// What a request's scripts need from the workspace: its variables, the active environment, and a way to save a change.
export interface ScriptContext {
  variables: WorkspaceVariables
  activeEnvironmentId: string | null
  updateVariables: (next: WorkspaceVariables) => void
}

export function activeEnvironment(variables: WorkspaceVariables, environmentId: string | null): WorkspaceEnvironment | undefined {
  return variables.environments.find((environment) => environment.id === environmentId)
}

// The values a script can read: the active environment, and the globals.
export function scriptVariableValues(variables: WorkspaceVariables, environmentId: string | null) {
  const toRecord = (rows: WorkspaceVariable[]) =>
    Object.fromEntries(rows.filter((row) => row.name.trim()).map((row) => [row.name.trim(), row.value]))
  return {
    environment: toRecord(activeEnvironment(variables, environmentId)?.variables ?? []),
    globals: toRecord(variables.globals),
  }
}

// Every secret value in the workspace, so the script result can hide them.
export function secretValuesOf(variables: WorkspaceVariables): string[] {
  const rows = [...variables.globals, ...variables.environments.flatMap((environment) => environment.variables)]
  return rows.filter((row) => row.secret && row.value.length > 0).map((row) => row.value)
}

// The request as a script sees it: only the enabled headers.
export function toScriptRequest(request: RequestNode): ScriptRequest {
  return {
    method: request.method,
    url: request.url,
    headers: (request.headers ?? [])
      .filter((header) => header.enabled && header.name.trim())
      .map((header) => ({ name: header.name, value: header.value })),
  }
}

// Applies the request a pre-request script returned. Disabled headers are kept as they were, because a script never sees them.
export function applyScriptRequest(request: RequestNode, scriptRequest: ScriptRequest): RequestNode {
  const disabled = (request.headers ?? []).filter((header) => !header.enabled)
  const enabled = scriptRequest.headers.map((header) => {
    const existing = (request.headers ?? []).find((item) => item.enabled && item.name === header.name)
    return { id: existing?.id ?? crypto.randomUUID(), name: header.name, value: header.value, enabled: true }
  })
  return { ...request, method: scriptRequest.method, url: scriptRequest.url, headers: [...enabled, ...disabled] }
}

export function scriptResponse(data: ResponseData): ScriptResponse {
  return { status: data.status, elapsedMs: data.duration, headers: data.headers, body: data.body }
}

// Applies the variable writes and removals of one script run. Scripts never change a secret variable, and an environment write needs an active environment.
// Each change that is not saved is returned with its reason.
export function applyVariableChanges(
  variables: WorkspaceVariables,
  environmentId: string | null,
  result: Pick<ScriptRunResult, 'writes' | 'removals'>,
): { variables: WorkspaceVariables; skipped: SkippedVariable[] } {
  let next = variables
  const skipped: SkippedVariable[] = []

  const upsert = (rows: WorkspaceVariable[], name: string, value: string): WorkspaceVariable[] => {
    const existing = rows.find((row) => row.name === name)
    if (existing) return rows.map((row) => (row.name === name ? { ...row, value } : row))
    return [...rows, { id: crypto.randomUUID(), name, value, secret: false }]
  }
  const withEnvironment = (update: (environment: WorkspaceEnvironment) => WorkspaceEnvironment): WorkspaceVariables => ({
    ...next,
    environments: next.environments.map((environment) => (environment.id === environmentId ? update(environment) : environment)),
  })
  // The rows a change in this scope would touch, or null when the scope has none (an environment with no active environment).
  const rowsIn = (scope: 'environment' | 'global'): WorkspaceVariable[] | null =>
    scope === 'global' ? next.globals : (activeEnvironment(next, environmentId)?.variables ?? null)
  const isSecret = (rows: WorkspaceVariable[], name: string) => rows.some((row) => row.name === name && row.secret)

  for (const write of result.writes) {
    const rows = rowsIn(write.scope)
    if (!rows) skipped.push({ name: write.name, reason: 'noEnvironment' })
    else if (isSecret(rows, write.name)) skipped.push({ name: write.name, reason: 'secret' })
    else if (write.scope === 'global') next = { ...next, globals: upsert(next.globals, write.name, write.value) }
    else next = withEnvironment((environment) => ({ ...environment, variables: upsert(environment.variables, write.name, write.value) }))
  }
  for (const removal of result.removals) {
    const rows = rowsIn(removal.scope)
    if (!rows) continue
    if (isSecret(rows, removal.name)) skipped.push({ name: removal.name, reason: 'secret' })
    else if (removal.scope === 'global') next = { ...next, globals: next.globals.filter((row) => row.name !== removal.name) }
    else
      next = withEnvironment((environment) => ({
        ...environment,
        variables: environment.variables.filter((row) => row.name !== removal.name),
      }))
  }
  return { variables: next, skipped }
}
