import { type FormEvent, useState } from 'react'
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
  const [nameDraft, setNameDraft] = useState('')
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

  function handleCreateEnvironment(event: FormEvent) {
    event.preventDefault()
    const name = nameDraft.trim()
    if (readOnly || !name) return
    const environment = { id: crypto.randomUUID(), name, variables: [] }
    onVariablesChange({ ...variables, environments: [...variables.environments, environment] })
    onActiveEnvironmentChange(environment.id)
    setNameDraft('')
  }

  function handleDeleteEnvironment() {
    if (!selectedEnvironment || readOnly) return
    const remaining = variables.environments.filter((environment) => environment.id !== selectedEnvironment.id)
    onVariablesChange({ ...variables, environments: remaining })
    onActiveEnvironmentChange(remaining[0]?.id ?? null)
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
    createForm: {
      nameDraft,
      readOnly,
      canSubmit: !readOnly && variables.environments.length < maxEnvironments && nameDraft.trim() !== '',
      onNameChange: setNameDraft,
      onSubmit: handleCreateEnvironment,
    },
    selected: selectedEnvironment
      ? {
          name: selectedEnvironment.name,
          readOnly,
          onNameChange: (name: string) => updateEnvironment({ name }),
          onDelete: handleDeleteEnvironment,
        }
      : null,
    promptText: t(variables.environments.length ? VARIABLES_TEXT.environments.selectPrompt : VARIABLES_TEXT.environments.emptyPrompt),
  }
}
