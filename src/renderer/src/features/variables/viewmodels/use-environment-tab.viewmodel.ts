import { useTranslation } from 'react-i18next'
import { VARIABLES_TEXT } from '@/features/variables/constants/variables-text.constants'
import { useVariableRowsViewModel } from '@/features/variables/viewmodels/use-variable-rows.viewmodel'
import type { WorkspaceEnvironment } from '@/lib/workspace-variables'

// Owns the environment tab in the workspace: the name field, the use-for-requests button, and its rows.
export function useEnvironmentTabViewModel({
  environment,
  isActive,
  readOnly,
  secureStorageAvailable,
  onUpdate,
  onActivate,
  onDuplicate,
  onDelete,
}: {
  environment: WorkspaceEnvironment | null
  isActive: boolean
  readOnly: boolean
  secureStorageAvailable: boolean
  onUpdate: (environmentId: string, patch: Partial<WorkspaceEnvironment>) => void
  onActivate: (environmentId: string) => void
  onDuplicate: (environmentId: string) => void
  onDelete: (environmentId: string) => void
}) {
  const { t } = useTranslation('variables')
  const rows = useVariableRowsViewModel({
    rows: environment?.variables ?? [],
    readOnly,
    onChange: (next) => {
      if (environment) onUpdate(environment.id, { variables: next })
    },
  })

  return {
    environment: environment ? { id: environment.id, name: environment.name } : null,
    sectionLabel: t(VARIABLES_TEXT.environmentTab.sectionLabel, { name: environment?.name ?? '' }),
    readOnly,
    isActive,
    canActivate: !readOnly && !isActive,
    activeLabel: t(VARIABLES_TEXT.environments.active),
    activateLabel: t(VARIABLES_TEXT.environmentTab.useForRequests),
    duplicateLabel: t(VARIABLES_TEXT.environmentTab.duplicate),
    deleteLabel: t(VARIABLES_TEXT.environmentTab.delete),
    secureStorageAvailable,
    rows,
    onNameChange: (name: string) => {
      if (environment) onUpdate(environment.id, { name })
    },
    onActivate: () => {
      if (environment) onActivate(environment.id)
    },
    onDuplicate: () => {
      if (environment) onDuplicate(environment.id)
    },
    onDelete: () => {
      if (environment) onDelete(environment.id)
    },
  }
}
