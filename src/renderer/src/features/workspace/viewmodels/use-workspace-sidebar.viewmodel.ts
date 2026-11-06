import { useEffect, useEffectEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { COLLECTION_FILTER_INPUT_ID, collectionWidthLimit, minCollectionWidth } from '@/features/collection'
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
  onShowSidebar: () => void
  historyRows: { key: string; requestId: string; method: string; name: string; detail: string; ok: boolean; active: boolean }[]
  referenceGroups: { key: string; title: string; rows: { id: string; method: string; name: string; path: string; active: boolean }[] }[]
  onOpenRequest: (requestId: string) => void
  onOpenDocs: (requestId: string) => void
}

export type SidebarPanel = 'collections' | 'environments' | 'history' | 'reference'

const workspaceMenuIcon = '⌄'

// The collection sidebar's heading, workspace picker, and resize handle.
export function useWorkspaceSidebarViewModel(input: SidebarInput) {
  const { t } = useTranslation('workspace')
  const { activeWorkspace } = input
  const [panel, setPanel] = useState<SidebarPanel>('collections')

  // Ctrl K opens Collections and moves focus to the filter.
  const handleShortcut = useEffectEvent((event: KeyboardEvent) => {
    if (!event.ctrlKey || event.key.toLowerCase() !== 'k') return
    event.preventDefault()
    setPanel('collections')
    input.onShowSidebar()
    requestAnimationFrame(() => document.getElementById(COLLECTION_FILTER_INPUT_ID)?.focus())
  })
  useEffect(() => {
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const [renaming, setRenaming] = useState<{ id: string; draft: string } | null>(null)

  function storageKind(workspace: LocalWorkspace): 'cloud' | 'local' {
    return workspace.cloudId ? 'cloud' : 'local'
  }

  function storageLabel(workspace: LocalWorkspace): string {
    if (!workspace.cloudId) return t(WORKSPACE_TEXT.sidebar.localVault)
    return workspace.role ? t(WORKSPACE_TEXT.sidebar.cloudRole, { role: workspace.role }) : t(WORKSPACE_TEXT.sidebar.cloudLabel)
  }

  const width = Math.round(Math.min(input.collectionWidth, collectionWidthLimit()))
  const titles: Record<SidebarPanel, string> = {
    collections: t(WORKSPACE_TEXT.sidebar.heading),
    environments: t(WORKSPACE_TEXT.sidebar.environmentsHeading),
    history: t(WORKSPACE_TEXT.sidebar.historyTab),
    reference: t(WORKSPACE_TEXT.sidebar.referenceTab),
  }

  return {
    label: t(WORKSPACE_TEXT.sidebar.label),
    title: titles[panel],
    panel,
    history: { rows: input.historyRows, empty: t(WORKSPACE_TEXT.sidebar.historyEmpty), onOpen: input.onOpenRequest },
    reference: { groups: input.referenceGroups, empty: t(WORKSPACE_TEXT.sidebar.referenceEmpty), onOpen: input.onOpenDocs },
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
      history: t(WORKSPACE_TEXT.sidebar.historyTab),
      reference: t(WORKSPACE_TEXT.sidebar.referenceTab),
      sync: t(WORKSPACE_TEXT.sidebar.syncTab),
      aiConnect: t(WORKSPACE_TEXT.sidebar.aiConnectTab),
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
