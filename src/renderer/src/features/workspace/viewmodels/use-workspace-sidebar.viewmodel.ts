import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { collectionWidthLimit, minCollectionWidth } from '@/features/collection'
import { WORKSPACE_TEXT } from '@/features/workspace/constants/workspace-text.constants'

export type SidebarInput = {
  localWorkspaces: LocalWorkspace[]
  currentWorkspaceId: string
  activeWorkspace: LocalWorkspace | null
  isReadOnly: boolean
  collectionWidth: number
  onActivateWorkspace: (workspaceId: string) => void
  onOpenOpenApi: () => void
  onCreateEnvironment: (name: string) => boolean
  onRenameEnvironment: (id: string, name: string) => boolean
  onDuplicateEnvironment: (id: string) => boolean
  onDeleteEnvironment: (id: string) => void
  onSelectEnvironment: (id: string | null) => void
  onViewEnvironment: (id: string) => void
  viewingEnvironmentId: string | null
  canCreateEnvironment: boolean
}

const workspaceMenuIcon = '⌄'

// The collection sidebar's heading, workspace picker, and resize handle.
export function useWorkspaceSidebarViewModel(input: SidebarInput) {
  const { t } = useTranslation('workspace')
  const { activeWorkspace } = input
  const [panel, setPanel] = useState<'collections' | 'environments'>('collections')
  const [renaming, setRenaming] = useState<{ id: string; draft: string } | null>(null)

  function storageKind(workspace: LocalWorkspace): 'cloud' | 'local' {
    return workspace.cloudId ? 'cloud' : 'local'
  }

  function storageLabel(workspace: LocalWorkspace): string {
    if (!workspace.cloudId) return t(WORKSPACE_TEXT.sidebar.localVault)
    return workspace.role ? t(WORKSPACE_TEXT.sidebar.cloudRole, { role: workspace.role }) : t(WORKSPACE_TEXT.sidebar.cloudLabel)
  }

  const width = Math.round(Math.min(input.collectionWidth, collectionWidthLimit()))
  return {
    label: t(WORKSPACE_TEXT.sidebar.label),
    panel,
    onSelectPanel: setPanel,
    environmentActions: {
      newName: t(WORKSPACE_TEXT.sidebar.newEnvironmentName),
      create: () => input.onCreateEnvironment(t(WORKSPACE_TEXT.sidebar.newEnvironmentName)),
      canCreate: input.canCreateEnvironment,
      renaming,
      startRename: (id: string, name: string) => setRenaming({ id, draft: name }),
      onRenameDraft: (draft: string) => setRenaming((current) => (current ? { ...current, draft } : current)),
      commitRename: () => {
        if (renaming) input.onRenameEnvironment(renaming.id, renaming.draft)
        setRenaming(null)
      },
      cancelRename: () => setRenaming(null),
      view: (id: string) => input.onViewEnvironment(id),
      viewingId: input.viewingEnvironmentId,
      setActive: (id: string) => input.onSelectEnvironment(id),
      duplicate: (id: string) => input.onDuplicateEnvironment(id),
      remove: (id: string) => input.onDeleteEnvironment(id),
      labels: {
        setActive: t(WORKSPACE_TEXT.sidebar.setActive),
        rename: t(WORKSPACE_TEXT.sidebar.rename),
        duplicate: t(WORKSPACE_TEXT.sidebar.duplicate),
        remove: t(WORKSPACE_TEXT.sidebar.remove),
        actions: t(WORKSPACE_TEXT.sidebar.environmentActions),
      },
    },
    panelTabs: {
      collections: t(WORKSPACE_TEXT.sidebar.collectionsTab),
      environments: t(WORKSPACE_TEXT.sidebar.environmentsTab),
    },
    environmentsHeading: t(WORKSPACE_TEXT.sidebar.environmentsHeading),
    manageVariables: t(WORKSPACE_TEXT.sidebar.manageVariables),
    noEnvironments: t(WORKSPACE_TEXT.sidebar.noEnvironments),
    kicker: t(WORKSPACE_TEXT.sidebar.kicker),
    heading: t(WORKSPACE_TEXT.sidebar.heading),
    openApiLabel: t(WORKSPACE_TEXT.sidebar.openApi),
    onOpenApi: input.onOpenOpenApi,
    openApiWorkspaceName: activeWorkspace?.name ?? t(WORKSPACE_TEXT.sidebar.myWorkspace),
    foldersLabel: t(WORKSPACE_TEXT.sidebar.foldersAndRequests),
    picker: {
      value: input.currentWorkspaceId,
      ariaLabel: t(WORKSPACE_TEXT.sidebar.selectWorkspace),
      placeholder: t(WORKSPACE_TEXT.sidebar.choose),
      selected: activeWorkspace ? { kind: storageKind(activeWorkspace), name: activeWorkspace.name } : null,
      options: input.localWorkspaces.map((workspace) => {
        const storage = storageLabel(workspace)
        return { id: workspace.id, name: workspace.name, kind: storageKind(workspace), storage, textValue: `${workspace.name} ${storage}` }
      }),
      onChange: input.onActivateWorkspace,
    },
    menuButton: { label: t(WORKSPACE_TEXT.sidebar.actions), disabled: input.isReadOnly, icon: workspaceMenuIcon },
    resizer: {
      label: t(WORKSPACE_TEXT.sidebar.resize),
      min: minCollectionWidth,
      max: Math.round(collectionWidthLimit()),
      now: width,
      text: t(WORKSPACE_TEXT.sidebar.pixels, { value: width }),
    },
  }
}
