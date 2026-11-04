import { type CloudVariables, cloudVariablesService, isVariablesRevisionConflict } from '@/features/sync/services/cloud-variables.service'

export type VariablesSaveResult = { kind: 'saved'; revision: number } | { kind: 'conflict'; remote: CloudVariables }

type VariablesApi = Pick<typeof cloudVariablesService, 'put' | 'get'>

// Saves the variables at the revision this device read. When the cloud changed them since, the cloud version is returned, so the
// user can choose which one to keep. Nothing is overwritten here.
export async function saveVariablesToCloud(
  input: { token: string; cloudId: string; variables: unknown; baseRevision: number },
  api: VariablesApi = cloudVariablesService,
): Promise<VariablesSaveResult> {
  try {
    const saved = await api.put(input)
    return { kind: 'saved', revision: saved.revision }
  } catch (error) {
    if (!isVariablesRevisionConflict(error)) throw error
    return { kind: 'conflict', remote: await api.get({ token: input.token, cloudId: input.cloudId }) }
  }
}

export type VariablesChoice = 'mine' | 'cloud'

// "mine" keeps this device's variables and saves them on top of the cloud revision.
// "cloud" takes the cloud variables. Nothing is sent, so this device's edit is dropped only because the user chose it.
export function resolveVariablesConflict(
  choice: VariablesChoice,
  local: unknown,
  remote: CloudVariables,
): { variables: unknown; baseRevision: number; sendToCloud: boolean } {
  if (choice === 'mine') return { variables: local, baseRevision: remote.revision, sendToCloud: true }
  return { variables: remote.variables, baseRevision: remote.revision, sendToCloud: false }
}
