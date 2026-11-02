import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { VARIABLES_TEXT } from '@/features/variables/constants/variables-text.constants'
import { useVariableRowsViewModel } from '@/features/variables/viewmodels/use-variable-rows.viewmodel'
import type { WorkspaceEnvironment, WorkspaceVariables } from '@/lib/workspace-variables'

export const maxEnvironments = 100

type DialogScope = 'global' | 'environment'

// Owns the manage-variables dialog: the scope tab, the new-environment draft, and the environment list.
export function useVariablesDialogViewModel({
  open,
  onOpenChange,
  variables,
  activeEnvironmentId,
  readOnly,
  secureStorageAvailable,
  onVariablesChange,
  onActiveEnvironmentChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  variables: WorkspaceVariables
  activeEnvironmentId: string | null
  readOnly: boolean
  secureStorageAvailable: boolean
  onVariablesChange: (variables: WorkspaceVariables) => void
  onActiveEnvironmentChange: (environmentId: string | null) => void
}) {
  const { t } = useTranslation('variables')
  const [scope, setScope] = useState<DialogScope>('global')
  const selectedEnvironment = variables.environments.find((environment) => environment.id === activeEnvironmentId)

  function updateEnvironment(patch: Partial<WorkspaceEnvironment>) {
    if (!selectedEnvironment) return
    onVariablesChange({
      ...variables,
      environments: variables.environments.map((environment) =>
        environment.id === selectedEnvironment.id ? { ...environment, ...patch } : environment,
      ),
    })
  }

  const globalRows = useVariableRowsViewModel({
    rows: variables.globals,
    readOnly,
    onChange: (rows) => onVariablesChange({ ...variables, globals: rows }),
  })
  const environmentRows = useVariableRowsViewModel({
    rows: selectedEnvironment?.variables ?? [],
    readOnly,
    onChange: (rows) => updateEnvironment({ variables: rows }),
  })

  // Adds an environment with this name and makes it active. Returns false when it was not added.
  function createEnvironment(rawName: string): boolean {
    const name = rawName.trim()
    if (readOnly || !name || variables.environments.length >= maxEnvironments) return false
    const environment = { id: crypto.randomUUID(), name, variables: [] }
    onVariablesChange({ ...variables, environments: [...variables.environments, environment] })
    onActiveEnvironmentChange(environment.id)
    return true
  }

  function deleteEnvironment(id: string) {
    if (readOnly || !variables.environments.some((environment) => environment.id === id)) return
    const remaining = variables.environments.filter((environment) => environment.id !== id)
    onVariablesChange({ ...variables, environments: remaining })
    onActiveEnvironmentChange(remaining[0]?.id ?? null)
  }

  function renameEnvironment(id: string, rawName: string): boolean {
    const name = rawName.trim()
    if (readOnly || !name) return false
    onVariablesChange({
      ...variables,
      environments: variables.environments.map((environment) => (environment.id === id ? { ...environment, name } : environment)),
    })
    return true
  }

  // A copy keeps the values, gets fresh ids, and is named "<name>_copy".
  function duplicateEnvironment(id: string): boolean {
    const source = variables.environments.find((environment) => environment.id === id)
    if (readOnly || !source || variables.environments.length >= maxEnvironments) return false
    const copy = {
      id: crypto.randomUUID(),
      name: `${source.name}_copy`,
      variables: source.variables.map((variable) => ({ ...variable, id: crypto.randomUUID() })),
    }
    onVariablesChange({ ...variables, environments: [...variables.environments, copy] })
    onActiveEnvironmentChange(copy.id)
    return true
  }

  return {
    open,
    onOpenChange,
    scope,
    onScopeChange: (value: string) => setScope(value === 'environment' ? 'environment' : 'global'),
    secureStorageAvailable,
    globalRows,
    environmentRows,
    environmentTotal: t(VARIABLES_TEXT.environments.total, { count: variables.environments.length, max: maxEnvironments }),
    environments: variables.environments.map((environment) => ({
      id: environment.id,
      name: environment.name,
      countText: t(VARIABLES_TEXT.environments.variableCount, { count: environment.variables.length }),
      isActive: environment.id === selectedEnvironment?.id,
    })),
    noEnvironmentActive: !selectedEnvironment,
    onSelectEnvironment: onActiveEnvironmentChange,
    createEnvironment,
    renameEnvironment,
    duplicateEnvironment,
    deleteEnvironment,
    canCreateEnvironment: !readOnly && variables.environments.length < maxEnvironments,
    selected: selectedEnvironment
      ? {
          name: selectedEnvironment.name,
          readOnly,
          onNameChange: (name: string) => updateEnvironment({ name }),
          onDelete: () => deleteEnvironment(selectedEnvironment.id),
        }
      : null,
    promptText: t(variables.environments.length ? VARIABLES_TEXT.environments.selectPrompt : VARIABLES_TEXT.environments.emptyPrompt),
  }
}
