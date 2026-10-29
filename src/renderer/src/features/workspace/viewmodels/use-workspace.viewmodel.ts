import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAiConnectViewModel } from '@/features/ai-connect'
import { firstRequestId, indexTree, initialTree, isFolder, useCollectionTreeViewModel } from '@/features/collection'
import {
  changeStatusKey,
  type PendingMergeState,
  useCommitDialogStateViewModel,
  useCommitDialogViewModel,
  useDiscardDialogViewModel,
  useMergeDialogViewModel,
  useSyncFooterViewModel,
} from '@/features/sync'
import { useEnvironmentTabViewModel, useVariableQuickEditViewModel, useVariablesDialogViewModel } from '@/features/variables'
import { readTree } from '@/features/workspace/lib/storage'
import { workspaceTabKey } from '@/features/workspace/lib/workspace-tabs'
import type { WorkspaceTab } from '@/features/workspace/models/workspace.model'
import { appUpdateService, type UpdateStatus } from '@/features/workspace/services/app-update.service'
import { useCloudRealtimeViewModel } from '@/features/workspace/viewmodels/use-cloud-realtime.viewmodel'
import { useCollectionWidthViewModel } from '@/features/workspace/viewmodels/use-collection-width.viewmodel'
import { useWorkspaceChangesViewModel } from '@/features/workspace/viewmodels/use-workspace-changes.viewmodel'
import { useWorkspaceChromeViewModel } from '@/features/workspace/viewmodels/use-workspace-chrome.viewmodel'
import { useCommitHistoryViewModel } from '@/features/workspace/viewmodels/use-workspace-history.viewmodel'
import { useWorkspaceNavigationViewModel } from '@/features/workspace/viewmodels/use-workspace-navigation.viewmodel'
import { useWorkspacePersistenceViewModel } from '@/features/workspace/viewmodels/use-workspace-persistence.viewmodel'
import { useWorkspaceRequestViewModel } from '@/features/workspace/viewmodels/use-workspace-request.viewmodel'
import { useWorkspaceSessionViewModel } from '@/features/workspace/viewmodels/use-workspace-session.viewmodel'
import { useWorkspaceSidebarViewModel } from '@/features/workspace/viewmodels/use-workspace-sidebar.viewmodel'
import { useWorkspaceStorageViewModel } from '@/features/workspace/viewmodels/use-workspace-storage.viewmodel'
import { useWorkspaceSyncActionsViewModel } from '@/features/workspace/viewmodels/use-workspace-sync-actions.viewmodel'
import { useWorkspaceTabbarViewModel } from '@/features/workspace/viewmodels/use-workspace-tabbar.viewmodel'
import { useWorkspaceTeamViewModel } from '@/features/workspace/viewmodels/use-workspace-team.viewmodel'
import { useWorkspaceTreeActionsViewModel } from '@/features/workspace/viewmodels/use-workspace-tree-actions.viewmodel'
import type { CloudWorkspace } from '@/lib/api'
import type { WorkspaceChange } from '@/lib/workspace-changes'
import {
  activeVariableValues,
  emptyWorkspaceVariables,
  type WorkspaceVariables,
  workspaceVariablesChangeId,
} from '@/lib/workspace-variables'
import type { VariableSuggestion } from '@/shared/components/variable-field'
import type { ApiNode } from '@/shared/models/api-node.model'

export function useWorkspaceViewModel() {
  const {
    collectionWidth,
    appShellRef,
    startCollectionResize,
    moveCollectionResize,
    finishCollectionResize,
    handleCollectionResizeKeyDown,
  } = useCollectionWidthViewModel()
  const [tree, setTree] = useState<ApiNode[]>(initialTree)
  const [workspaceVariables, setWorkspaceVariables] = useState<WorkspaceVariables>(emptyWorkspaceVariables())
  const [activeEnvironmentId, setActiveEnvironmentId] = useState<string | null>(null)
  const [variablesDialogOpen, setVariablesDialogOpen] = useState(false)
  const [openApiDialogOpen, setOpenApiDialogOpen] = useState(false)
  const [quickEditTarget, setQuickEditTarget] = useState<{ name: string; sourceValue: string } | null>(null)
  const [secureStorageAvailable, setSecureStorageAvailable] = useState(true)
  const [localWorkspaces, setLocalWorkspaces] = useState<LocalWorkspace[]>([])
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState('')
  const [storageLoaded, setStorageLoaded] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState(() => firstRequestId(readTree()))
  const [workspaceTabs, setWorkspaceTabs] = useState<WorkspaceTab[]>(() => {
    const requestId = firstRequestId(readTree())
    return requestId ? [{ kind: 'request', id: requestId }] : []
  })
  const [activeWorkspaceTabKey, setActiveWorkspaceTabKey] = useState(() => {
    const requestId = firstRequestId(readTree())
    return requestId ? `request:${requestId}` : ''
  })
  const [selectedFolderId, setSelectedFolderId] = useState(() => readTree()[0]?.id ?? '')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    () =>
      new Set(
        readTree()
          .filter(isFolder)
          .map((folder) => folder.id),
      ),
  )
  const session = useWorkspaceSessionViewModel({
    onStatus: (message) => setSyncStatus(message),
    onOpenTeam: () => team.openTeam(),
    onSignedOut: () => {
      setCloudWorkspaces([])
      team.clearInviteLink()
    },
  })
  const {
    sessionToken,
    user,
    authOpenRequest,
    authError,
    setAuthError,
    inviteTokenDraft,
    setInviteTokenDraft,
    accountMenuOpen,
    setAccountMenuOpen,
    accountMenuRef,
    beginBrowserSignIn,
    clearAuthError,
    signOut,
  } = session
  const [cloudWorkspaces, setCloudWorkspaces] = useState<CloudWorkspace[]>([])
  const commitState = useCommitDialogStateViewModel()
  const {
    commitDialogOpen,
    setCommitDialogOpen,
    commitDialogView,
    setCommitDialogView,
    commitMessage,
    setCommitMessage,
    selectedChangeId,
    setSelectedChangeId,
    selectedHistoryCommitId,
    setSelectedHistoryCommitId,
    selectedHistoryChangeId,
    setSelectedHistoryChangeId,
  } = commitState
  const [syncMenuOpen, setSyncMenuOpen] = useState(false)
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false)
  const [localCommits, setLocalCommits] = useState<LocalCommit[]>([])
  const [stagedSnapshot, setStagedSnapshot] = useState<ApiNode[] | null>(null)
  const [stagedVariables, setStagedVariables] = useState<WorkspaceVariables | null>(null)
  const stagedWorkspaceIdRef = useRef('')
  const [syncStatus, setSyncStatus] = useState('')
  const [pendingMerge, setPendingMerge] = useState<PendingMergeState | null>(null)
  const [mergeChoices, setMergeChoices] = useState<Record<string, 'local' | 'remote'>>({})
  const treeIndex = useMemo(() => indexTree(tree), [tree])
  useWorkspaceStorageViewModel({
    sessionToken,
    user,
    storageLoaded,
    setStorageLoaded,
    currentWorkspaceId,
    setCurrentWorkspaceId,
    localWorkspaces,
    setLocalWorkspaces,
    setCloudWorkspaces,
    setSecureStorageAvailable,
    setTree,
    setWorkspaceVariables,
    setActiveEnvironmentId,
    setExpandedFolders,
    setStagedSnapshot,
    setStagedVariables,
    stagedWorkspaceIdRef,
    setAuthError,
    setSyncStatus,
    restoreTabs: (workspaceId, nextTree, variables) => navigation.restoreTabs(workspaceId, nextTree, variables),
  })
  const { takePendingSave } = useWorkspacePersistenceViewModel({
    tree,
    workspaceVariables,
    activeEnvironmentId,
    localWorkspaces,
    currentWorkspaceId,
    storageLoaded,
    workspaceTabs,
    activeWorkspaceTabKey,
    stagedSnapshot,
    stagedVariables,
    isStagedFor: (workspaceId) => stagedWorkspaceIdRef.current === workspaceId,
    setLocalCommits,
  })
  useEffect(() => {
    const next = workspaceTabs.filter((tab) =>
      tab.kind === 'environment'
        ? workspaceVariables.environments.some((environment) => environment.id === tab.id)
        : treeIndex.nodeById.get(tab.id)?.kind === 'request',
    )
    if (next.length === workspaceTabs.length) return
    setWorkspaceTabs(next)
    if (!next.some((tab) => workspaceTabKey(tab) === activeWorkspaceTabKey)) {
      const fallback = next.at(-1)
      setActiveWorkspaceTabKey(fallback ? workspaceTabKey(fallback) : '')
      if (fallback?.kind === 'request') {
        setSelectedRequestId(fallback.id)
        setSelectedFolderId(treeIndex.parentFolderById.get(fallback.id) ?? '')
      } else if (fallback?.kind === 'docs') {
        setSelectedRequestId(fallback.id)
        setSelectedFolderId(treeIndex.parentFolderById.get(fallback.id) ?? '')
      } else if (fallback?.kind === 'environment') setActiveEnvironmentId(fallback.id)
    }
  }, [treeIndex, workspaceVariables, workspaceTabs, activeWorkspaceTabKey])
  const activeFolder = treeIndex.nodeById.get(selectedFolderId)
  const activeWorkspaceTab = workspaceTabs.find((tab) => workspaceTabKey(tab) === activeWorkspaceTabKey)
  const activeDocsRequest = activeWorkspaceTab?.kind === 'docs' ? treeIndex.nodeById.get(activeWorkspaceTab.id) : undefined
  const activeEnvironmentTab =
    activeWorkspaceTab?.kind === 'environment'
      ? workspaceVariables.environments.find((environment) => environment.id === activeWorkspaceTab.id)
      : undefined
  const activeWorkspace = localWorkspaces.find((item) => item.id === currentWorkspaceId)
  const isReadOnly = activeWorkspace?.role === 'viewer'
  useCloudRealtimeViewModel({
    sessionToken,
    cloudWorkspaceCount: cloudWorkspaces.length,
    setCloudWorkspaces,
    onStatus: setSyncStatus,
  })
  const changes = useWorkspaceChangesViewModel({
    tree,
    workspaceVariables,
    localCommits,
    activeWorkspace,
    cloudWorkspaces,
    stagedSnapshot,
    stagedVariables,
    commitDialogOpen,
    commitDialogView,
    selectedChangeId,
    treeIndex,
  })
  const {
    committedTree,
    committedVariables,
    workspaceChanges,
    pendingPushCount,
    cloudHeadCommitId,
    stagedChanges,
    unstagedChanges,
    changeById,
    selectedChange,
    diffRows,
  } = changes
  const history = useCommitHistoryViewModel({
    sessionToken,
    activeWorkspace,
    localCommits,
    commitDialogOpen,
    commitDialogView,
    selectedHistoryCommitId,
    selectedHistoryChangeId,
  })
  const {
    historyLoading,
    historyError,
    historyCommits,
    localCommitIds,
    selectedHistoryCommit,
    historyDetailLoading,
    historyDetailError,
    historySnapshotsReady,
    historyChanges,
    selectedHistoryChange,
    historyDiffRows,
  } = history
  const resolvedVariables = useMemo(
    () => activeVariableValues(workspaceVariables, activeEnvironmentId),
    [workspaceVariables, activeEnvironmentId],
  )
  const variableSuggestions = useMemo<VariableSuggestion[]>(() => {
    const environment = workspaceVariables.environments.find((item) => item.id === activeEnvironmentId)
    const seen = new Set<string>()
    const suggestions: VariableSuggestion[] = []
    for (const variable of [...(environment?.variables ?? []), ...workspaceVariables.globals]) {
      const name = variable.name.trim()
      if (!name || seen.has(name)) continue
      seen.add(name)
      suggestions.push({
        name,
        scope: environment?.variables.includes(variable) ? environment.name : 'Global',
        value: variable.value,
        secret: variable.secret,
      })
    }
    return suggestions
  }, [workspaceVariables, activeEnvironmentId])

  const aiConnect = useAiConnectViewModel()
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null)
  useEffect(() => appUpdateService.onStatus(setUpdateStatus), [])

  const navigation = useWorkspaceNavigationViewModel({
    localWorkspaces,
    setLocalWorkspaces,
    currentWorkspaceId,
    setCurrentWorkspaceId,
    activeWorkspace,
    isReadOnly,
    tree,
    setTree,
    treeIndex,
    workspaceVariables,
    setWorkspaceVariables,
    activeEnvironmentId,
    setActiveEnvironmentId,
    workspaceTabs,
    setWorkspaceTabs,
    activeWorkspaceTabKey,
    setActiveWorkspaceTabKey,
    setSelectedRequestId,
    setSelectedFolderId,
    setExpandedFolders,
    activeRequest: treeIndex.nodeById.get(selectedRequestId),
    setStagedSnapshot,
    setStagedVariables,
    stagedWorkspaceIdRef,
    setQuickEditTarget,
    takePendingSave,
  })
  const {
    activateWorkspace,
    persistActiveWorkspace,
    updateWorkspaceVariables,
    updateActiveEnvironment,
    openRequestTab,
    openDocsTab,
    openCurrentDocs,
    openEnvironmentTab,
    selectWorkspaceTab,
    closeWorkspaceTab,
    updateEnvironmentTab,
    resetTabs,
    openVariableEditor,
    saveQuickVariable,
  } = navigation

  const variablesDialog = useVariablesDialogViewModel({
    open: variablesDialogOpen,
    onOpenChange: setVariablesDialogOpen,
    variables: workspaceVariables,
    activeEnvironmentId,
    readOnly: Boolean(isReadOnly),
    secureStorageAvailable,
    onVariablesChange: updateWorkspaceVariables,
    onActiveEnvironmentChange: (id) => (id ? openEnvironmentTab(id) : updateActiveEnvironment(null)),
  })
  const environmentTab = useEnvironmentTabViewModel({
    environment: activeEnvironmentTab ?? null,
    isActive: activeEnvironmentTab?.id === activeEnvironmentId,
    readOnly: Boolean(isReadOnly),
    secureStorageAvailable,
    onUpdate: updateEnvironmentTab,
    onActivate: updateActiveEnvironment,
  })
  const variableQuickEdit = useVariableQuickEditViewModel({
    target: quickEditTarget,
    variables: workspaceVariables,
    activeEnvironmentId,
    resolvedValues: resolvedVariables,
    readOnly: Boolean(isReadOnly),
    onClose: () => setQuickEditTarget(null),
    onSave: saveQuickVariable,
  })

  const { activeRequest, updateActiveRequest, requestWorkbench } = useWorkspaceRequestViewModel({
    selectedRequestId,
    activeFolder,
    treeIndex,
    setTree,
    activeWorkspace,
    currentWorkspaceId,
    isReadOnly,
    activeWorkspaceTab,
    variableSuggestions,
    resolvedVariables,
    openDocsTab,
    openVariableEditor,
  })

  const syncActions = useWorkspaceSyncActionsViewModel({
    setSyncStatus,
    activeWorkspace,
    committedTree,
    committedVariables,
    workspaceVariables,
    tree,
    sessionToken,
    stagedSnapshot,
    stagedVariables,
    stagedChanges,
    commitMessage,
    activeEnvironmentId,
    pendingMerge,
    mergeChoices,
    setStagedSnapshot,
    setStagedVariables,
    setLocalWorkspaces,
    setLocalCommits,
    setCloudWorkspaces,
    setCommitDialogOpen,
    setCommitMessage,
    setSyncMenuOpen,
    setDiscardConfirmOpen,
    setWorkspaceVariables,
    setTree,
    setActiveEnvironmentId,
    setSelectedRequestId,
    setPendingMerge,
    setMergeChoices,
    persistActiveWorkspace,
  })
  const { stageChanges, stageChange, saveCommit, discardLocalChanges, pullWorkspace, pushWorkspace, applyMergeResolution } = syncActions
  const treeActions = useWorkspaceTreeActionsViewModel({
    tree,
    setTree,
    treeIndex,
    isReadOnly,
    selectedRequestId,
    setSelectedRequestId,
    selectedFolderId,
    setSelectedFolderId,
    setExpandedFolders,
    workspaceTabs,
    setWorkspaceTabs,
    activeWorkspaceTabKey,
    setActiveWorkspaceTabKey,
    setActiveEnvironmentId,
  })
  const { createFolderInTree, importTree, renameFolderInTree, selectFolder, toggleFolderExpanded, createRequest, deleteItem, moveItem } =
    treeActions

  const { t: tSync } = useTranslation('sync')
  const statusText = (status: WorkspaceChange['status']) => tSync(changeStatusKey(status))
  const commitDialog = useCommitDialogViewModel({
    open: commitDialogOpen,
    view: commitDialogView,
    message: commitMessage,
    readOnly: Boolean(isReadOnly),
    cloudConnected: Boolean(activeWorkspace?.cloudId),
    changeCount: workspaceChanges.length,
    staged: stagedChanges,
    unstaged: unstagedChanges,
    selectedChangeId,
    selectedChange,
    diffRows,
    history: {
      commits: historyCommits,
      localCommitIds,
      selectedCommit: selectedHistoryCommit,
      loading: historyLoading,
      error: historyError,
      detailLoading: historyDetailLoading,
      detailError: historyDetailError,
      snapshotsReady: historySnapshotsReady,
      changes: historyChanges,
      selectedChangeId: selectedHistoryChangeId,
      selectedChange: selectedHistoryChange,
      diffRows: historyDiffRows,
    },
    actions: {
      onOpenChange: setCommitDialogOpen,
      onViewChange: (view) => {
        setCommitDialogView(view)
        if (view === 'history') {
          setSelectedHistoryCommitId('')
          setSelectedHistoryChangeId('')
        }
      },
      onMessageChange: setCommitMessage,
      onSubmit: (event) => void saveCommit(event),
      onSelectChange: setSelectedChangeId,
      onStage: stageChange,
      onStageAll: stageChanges,
      onUnstageAll: () => {
        setStagedSnapshot(null)
        setStagedVariables(null)
      },
      onSelectHistoryCommit: (commitId) => {
        setSelectedHistoryCommitId(commitId)
      },
      onSelectHistoryChange: setSelectedHistoryChangeId,
      onOpenHistory: () => {
        setCommitDialogView('history')
        setSelectedHistoryCommitId('')
        setSelectedHistoryChangeId('')
        setCommitDialogOpen(true)
      },
      onOpenChanges: () => {
        setCommitDialogView('changes')
        setCommitMessage('')
        setSelectedChangeId('')
        setCommitDialogOpen(true)
      },
    },
  })
  const mergeDialog = useMergeDialogViewModel({
    conflicts: pendingMerge ? pendingMerge.conflicts : null,
    variableConflict: Boolean(pendingMerge?.variableConflict),
    choices: mergeChoices,
    variablesKey: workspaceVariablesChangeId,
    onChoose: (id, choice) => setMergeChoices((current) => ({ ...current, [id]: choice })),
    onSave: () => void applyMergeResolution(),
    onClose: () => setPendingMerge(null),
  })
  const discardDialog = useDiscardDialogViewModel({
    open: discardConfirmOpen,
    onOpenChange: setDiscardConfirmOpen,
    onConfirm: discardLocalChanges,
  })
  const team = useWorkspaceTeamViewModel({
    sessionToken,
    activeWorkspace,
    tree,
    workspaceVariables,
    activeEnvironmentId,
    inviteTokenDraft,
    setInviteTokenDraft,
    setSyncStatus,
    setLocalWorkspaces,
    setCloudWorkspaces,
    setCurrentWorkspaceId,
    setStagedSnapshot,
    setStagedVariables,
    stagedWorkspaceIdRef,
    setTree,
    setWorkspaceVariables,
    setActiveEnvironmentId,
    resetTabs,
  })
  const collection = useCollectionTreeViewModel({
    tree,
    isReadOnly: Boolean(isReadOnly),
    selectedRequestId,
    selectedFolderId,
    activeTabKind: activeWorkspaceTab?.kind ?? null,
    expandedFolders,
    changes: changeById,
    actions: {
      selectFolder,
      toggleFolderExpanded,
      openRequest: openRequestTab,
      openDocs: openDocsTab,
      createFolder: createFolderInTree,
      createRequest,
      renameFolder: renameFolderInTree,
      deleteItem,
      moveItem,
    },
  })

  const syncFooter = useSyncFooterViewModel({
    open: syncMenuOpen,
    onOpenChange: setSyncMenuOpen,
    workspace: activeWorkspace
      ? { name: activeWorkspace.name, cloudId: activeWorkspace.cloudId, baseCommitId: activeWorkspace.baseCommitId }
      : null,
    signedIn: Boolean(sessionToken),
    readOnly: isReadOnly,
    changeCount: workspaceChanges.length,
    historyCount: historyCommits.length,
    pendingPushCount,
    cloudHeadCommitId,
    actions: {
      openHistory: commitDialog.openHistory,
      discard: () => setDiscardConfirmOpen(true),
      openCommit: commitDialog.openChanges,
      pull: () => void pullWorkspace(),
      push: () => void pushWorkspace(),
    },
  })

  const chrome = useWorkspaceChromeViewModel({
    user,
    isCloudOwner: Boolean(activeWorkspace?.cloudId && activeWorkspace.role === 'owner'),
    updateStatus,
    accountMenuOpen,
    setAccountMenuOpen,
    onNewCloudWorkspace: team.openCreateWorkspace,
    onTeam: team.openTeam,
    onSignOut: signOut,
    onDownloadUpdate: appUpdateService.download,
    onDismissUpdate: () => setUpdateStatus(null),
  })
  const sidebar = useWorkspaceSidebarViewModel({
    localWorkspaces,
    currentWorkspaceId,
    activeWorkspace: activeWorkspace ?? null,
    isReadOnly: Boolean(isReadOnly),
    collectionWidth,
    onActivateWorkspace: activateWorkspace,
    onOpenOpenApi: () => setOpenApiDialogOpen(true),
  })
  const tabbar = useWorkspaceTabbarViewModel({
    tabs: workspaceTabs,
    environments: workspaceVariables.environments,
    nodeById: treeIndex.nodeById,
    changeById,
    activeTabKey: activeWorkspaceTabKey,
    activeTab: activeWorkspaceTab,
    activeEnvironmentId,
    hasRequests: Boolean(firstRequestId(tree)),
    hasWorkspace: Boolean(activeWorkspace),
    activeFolderName: activeFolder && isFolder(activeFolder) ? activeFolder.name : null,
    activeDocsRequest,
    hasRequestWorkbench: Boolean(requestWorkbench),
    onSelectTab: selectWorkspaceTab,
    onCloseTab: closeWorkspaceTab,
    onReadDocs: openCurrentDocs,
    onOpenVariables: () => setVariablesDialogOpen(true),
    onEnvironmentChange: (environmentId) => (environmentId === null ? updateActiveEnvironment(null) : openEnvironmentTab(environmentId)),
    onOpenRequest: openRequestTab,
    onOpenOpenApi: () => setOpenApiDialogOpen(true),
  })
  return {
    chrome,
    sidebar,
    tabbar,
    syncFooter,
    collection,
    team,
    commitDialog,
    mergeDialog,
    discardDialog,
    importTree,
    statusText,
    requestWorkbench,
    collectionWidth,
    appShellRef,
    tree,
    setTree,
    workspaceVariables,
    activeEnvironmentId,
    variablesDialogOpen,
    setVariablesDialogOpen,
    openApiDialogOpen,
    setOpenApiDialogOpen,
    quickEditTarget,
    setQuickEditTarget,
    variableQuickEdit,
    variablesDialog,
    environmentTab,
    secureStorageAvailable,
    localWorkspaces,
    currentWorkspaceId,
    selectedRequestId,
    setSelectedRequestId,
    workspaceTabs,
    setWorkspaceTabs,
    activeWorkspaceTabKey,
    setActiveWorkspaceTabKey,
    selectedFolderId,
    setSelectedFolderId,
    expandedFolders,
    setExpandedFolders,
    sessionToken,
    user,
    authOpenRequest,
    authError,
    inviteTokenDraft,
    setInviteTokenDraft,
    commitDialogOpen,
    setCommitDialogOpen,
    commitDialogView,
    setCommitDialogView,
    discardConfirmOpen,
    setDiscardConfirmOpen,
    commitMessage,
    setCommitMessage,
    setSelectedChangeId,
    setSelectedHistoryCommitId,
    setSelectedHistoryChangeId,
    historyLoading,
    historyDetailLoading,
    historyError,
    historyDetailError,
    setStagedSnapshot,
    setStagedVariables,
    syncStatus,
    pendingMerge,
    setPendingMerge,
    mergeChoices,
    setMergeChoices,
    treeIndex,
    startCollectionResize,
    moveCollectionResize,
    finishCollectionResize,
    handleCollectionResizeKeyDown,
    activeRequest,
    activeFolder,
    activeWorkspaceTab,
    activeDocsRequest,
    activeEnvironmentTab,
    activeWorkspace,
    isReadOnly,
    workspaceChanges,
    pendingPushCount,
    cloudHeadCommitId,
    stagedChanges,
    unstagedChanges,
    changeById,
    selectedChange,
    diffRows,
    historyCommits,
    localCommitIds,
    selectedHistoryCommit,
    historySnapshotsReady,
    historyChanges,
    selectedHistoryChange,
    historyDiffRows,
    resolvedVariables,
    variableSuggestions,
    updateActiveRequest,
    beginBrowserSignIn,
    clearAuthError,
    accountMenuOpen,
    setAccountMenuOpen,
    accountMenuRef,
    aiConnect,
    updateStatus,
    onDownloadUpdate: appUpdateService.download,
    setUpdateStatus,
    signOut,
    activateWorkspace,
    updateWorkspaceVariables,
    updateActiveEnvironment,
    openRequestTab,
    openDocsTab,
    openCurrentDocs,
    openEnvironmentTab,
    selectWorkspaceTab,
    closeWorkspaceTab,
    updateEnvironmentTab,
    openVariableEditor,
    saveQuickVariable,
    stageChanges,
    stageChange,
    saveCommit,
    discardLocalChanges,
    pullWorkspace,
    pushWorkspace,
    applyMergeResolution,
  }
}
