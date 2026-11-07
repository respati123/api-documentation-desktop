import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAiConnectViewModel } from '@/features/ai-connect'
import {
  firstRequestId,
  indexTree,
  initialTree,
  isFolder,
  normalizeSharedTree,
  normalizeSharedVariables,
  useCollectionTreeViewModel,
} from '@/features/collection'
import { NOTIFICATION_TEXT, teamUpdateDismissMs, useNotificationsViewModel } from '@/features/notifications'
import {
  type CloudWorkspace,
  changeStatusKey,
  type PendingMergeState,
  SYNC_TEXT,
  syncService,
  useCommitDialogStateViewModel,
  useCommitDialogViewModel,
  useDiscardDialogViewModel,
  useMergeDialogViewModel,
  useSyncFooterViewModel,
} from '@/features/sync'
import { useEnvironmentTabViewModel, useVariableQuickEditViewModel, useVariablesDialogViewModel } from '@/features/variables'
import { refreshedToHead } from '@/features/workspace/lib/head-refresh'
import { pullNoticeNeeded, pushedByTeammate } from '@/features/workspace/lib/live-update-notice'
import { referenceGroups } from '@/features/workspace/lib/reference-groups'
import { readTree } from '@/features/workspace/lib/storage'
import { hasUnpushedChanges } from '@/features/workspace/lib/unpushed-changes'
import { workspaceTabKey } from '@/features/workspace/lib/workspace-tabs'
import type { WorkspaceTab, WorkspaceUpdateEvent } from '@/features/workspace/models/workspace.model'
import { appUpdateService, type UpdateStatus } from '@/features/workspace/services/app-update.service'
import { workspaceStorageService } from '@/features/workspace/services/workspace-storage.service'
import { useCloudRealtimeViewModel } from '@/features/workspace/viewmodels/use-cloud-realtime.viewmodel'
import { useCollectionWidthViewModel } from '@/features/workspace/viewmodels/use-collection-width.viewmodel'
import { useSendHistoryViewModel } from '@/features/workspace/viewmodels/use-send-history.viewmodel'
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
  // On narrow windows the side panel is an overlay. This decides whether it is shown.
  // In a narrow window the side panel is a drawer, so it starts closed.
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 760)
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false)
  const [localCommits, setLocalCommits] = useState<LocalCommit[]>([])
  const [stagedSnapshot, setStagedSnapshot] = useState<ApiNode[] | null>(null)
  const [stagedVariables, setStagedVariables] = useState<WorkspaceVariables | null>(null)
  const stagedWorkspaceIdRef = useRef('')
  const [syncStatus, setSyncStatus] = useState('')
  const [pendingMerge, setPendingMerge] = useState<PendingMergeState | null>(null)
  const [mergeChoices, setMergeChoices] = useState<Record<string, 'local' | 'remote'>>({})
  const treeIndex = indexTree(tree)
  const notifications = useNotificationsViewModel()
  const storage = useWorkspaceStorageViewModel({
    sessionToken,
    user,
    storageLoaded,
    setStorageLoaded,
    currentWorkspaceId,
    setCurrentWorkspaceId,
    localWorkspaces,
    setLocalWorkspaces,
    cloudWorkspaces,
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
    onNotify: notifications.notify,
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
    setCloudWorkspaces,
    onWorkspaceUpdated: (event) => void handleWorkspaceUpdated(event),
    onWorkspaceChanged: () => void storage.refreshAccount(),
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
  const resolvedVariables = activeVariableValues(workspaceVariables, activeEnvironmentId)
  const variableSuggestions: VariableSuggestion[] = (() => {
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
  })()

  const aiConnect = useAiConnectViewModel()
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null)
  const { t: tNotice } = useTranslation('notifications')
  const announceUpdate = useEffectEvent((status: UpdateStatus) => {
    if (status.state === 'available') {
      notifications.notify({
        id: `update-${status.version}`,
        tone: 'action',
        title: tNotice(NOTIFICATION_TEXT.updateAvailable, { version: status.version }),
        body: tNotice(NOTIFICATION_TEXT.updateAvailableBody),
        actionLabel: tNotice(NOTIFICATION_TEXT.updateDownload),
        onAction: () => void appUpdateService.download(status.version),
      })
    }
    if (status.state === 'downloaded') {
      notifications.notify({
        id: `update-ready-${status.version}`,
        tone: 'success',
        title: tNotice(NOTIFICATION_TEXT.updateReady),
        body: tNotice(NOTIFICATION_TEXT.updateReadyBody),
      })
    }
  })
  useEffect(
    () =>
      appUpdateService.onStatus((status) => {
        setUpdateStatus(status)
        announceUpdate(status)
      }),
    [],
  )

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
    viewEnvironment,
    selectWorkspaceTab,
    closeWorkspaceTab,
    closeOtherWorkspaceTabs,
    closeAllWorkspaceTabs,
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
    onDuplicate: (id) => {
      variablesDialog.duplicateEnvironment(id)
    },
    onDelete: variablesDialog.deleteEnvironment,
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

  const scriptContext = { variables: workspaceVariables, activeEnvironmentId, updateVariables: updateWorkspaceVariables }
  const sendHistory = useSendHistoryViewModel()
  const { activeRequest, updateActiveRequest, requestWorkbench } = useWorkspaceRequestViewModel({
    selectedRequestId,
    activeFolder,
    treeIndex,
    setTree,
    currentWorkspaceId,
    isReadOnly,
    activeWorkspaceTab,
    variableSuggestions,
    resolvedVariables,
    onSent: sendHistory.add,
    openVariableEditor,
    scriptContext,
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
  const { stageChanges, stageChange, saveCommit, discardLocalChanges, pullWorkspace, pushWorkspace, applyMergeResolution, revertToCommit } =
    syncActions
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
  const {
    createFolderInTree,
    importTree,
    renameFolderInTree,
    selectFolder,
    toggleFolderExpanded,
    createRequest,
    duplicateRequest,
    revealRequestInTree,
    deleteItem,
    moveItem,
  } = treeActions

  const { t: tSync } = useTranslation('sync')

  // A teammate pushed to a cloud workspace. A copy with no unpushed work moves to the new head. Otherwise the user is asked to pull.
  // The user keeps the version on screen. It is written over the saved one, which the user has now chosen to replace.
  async function keepMyVersion() {
    if (!activeWorkspace) return
    const saved = await workspaceStorageService.saveWorkspace(
      { ...activeWorkspace, tree, variables: workspaceVariables, activeEnvironmentId },
      { overwrite: true },
    )
    if (saved) storage.clearSaveConflict()
  }

  async function handleWorkspaceUpdated(event: WorkspaceUpdateEvent) {
    const actor = event.actorEmail ?? tSync(SYNC_TEXT.live.unnamed)
    const commits =
      event.commitCount === 1 ? tSync(SYNC_TEXT.live.oneCommit) : tSync(SYNC_TEXT.live.manyCommits, { count: event.commitCount ?? 0 })
    const pushed =
      event.message === undefined
        ? tSync(SYNC_TEXT.live.pushed, { actor, commits })
        : tSync(SYNC_TEXT.live.pushedWithMessage, { actor, commits, message: event.message })
    try {
      const result = await autoUpdateFromHead(event.workspaceId)
      // Every push from a teammate is announced. A copy that could not follow the head asks for a manual pull, so that notice stays until dismissed.
      if (pushedByTeammate(event, user?.id ?? null)) {
        const pullNeeded = pullNoticeNeeded(event, user?.id ?? null, result)
        const message = pullNeeded ? pushed : tSync(SYNC_TEXT.live.updated, { actor })
        setSyncStatus(message)
        const changes = event.changes ?? []
        notifications.notify({
          id: `pull-${event.headCommitId}`,
          tone: pullNeeded ? 'action' : 'info',
          // A team update leaves on its own. The pull button stays while this copy cannot follow the head by itself.
          autoDismissMs: teamUpdateDismissMs,
          title: tNotice(NOTIFICATION_TEXT.teamUpdate),
          body: message,
          details: changes.map((change) => ({
            label: change.method ? `${change.method} ${change.name}` : change.name,
            kind: change.status,
          })),
          moreCount: Math.max(0, (event.changeTotal ?? changes.length) - changes.length),
          ...(pullNeeded ? { actionLabel: tNotice(NOTIFICATION_TEXT.pullNow), onAction: () => void pullWorkspace() } : {}),
        })
      }
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : pushed)
    }
  }

  // Moves an open or background copy of a cloud workspace to its head, when that copy has no unpushed work.
  async function autoUpdateFromHead(cloudId: string): Promise<'active' | 'background' | 'skipped'> {
    if (!sessionToken || !user) return 'skipped'
    if (activeWorkspace?.cloudId === cloudId) {
      if (hasUnpushedChanges({ ...activeWorkspace, tree, variables: workspaceVariables })) return 'skipped'
      await pullWorkspace()
      return 'active'
    }
    const stored = await workspaceStorageService.listWorkspaces()
    const copy = stored.find((item) => item.cloudId === cloudId && item.accountId === user.id)
    if (!copy || hasUnpushedChanges(copy)) return 'skipped'
    const pulled = await syncService.pull({ token: sessionToken, cloudId })
    const next = refreshedToHead(copy, {
      headCommitId: pulled.headCommitId,
      tree: normalizeSharedTree(pulled.tree),
      variables: normalizeSharedVariables(pulled.variables),
    })
    await workspaceStorageService.saveWorkspace(next)
    setLocalWorkspaces((current) => current.map((item) => (item.id === next.id ? next : item)))
    return 'background'
  }
  const statusText = (status: WorkspaceChange['status']) => tSync(changeStatusKey(status))
  const commitDialog = useCommitDialogViewModel({
    open: commitDialogOpen,
    view: commitDialogView,
    message: commitMessage,
    readOnly: Boolean(isReadOnly),
    cloudConnected: Boolean(activeWorkspace?.cloudId),
    cloudHeadId: activeWorkspace?.baseCommitId ?? null,
    signedIn: Boolean(sessionToken),
    changeCount: workspaceChanges.length,
    changes: workspaceChanges,
    staged: stagedChanges,
    unstaged: unstagedChanges,
    selectedChangeId: selectedChange?.id ?? '',
    selectedChange,
    diffRows,
    pendingPushCount,
    syncStatus,
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
      selectedChangeId: selectedHistoryChange?.id ?? '',
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
      onPush: pushWorkspace,
      onSelectHistoryCommit: (commitId) => {
        setSelectedHistoryCommitId(commitId)
      },
      onSelectHistoryChange: setSelectedHistoryChangeId,
      onRevertHistoryCommit: (commitId) => void revertToCommit(commitId),
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
    onNotify: notifications.notify,
    sessionToken,
    accountId: user?.id ?? null,
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
      duplicateRequest,
      openRequest: openRequestTab,
      openDocs: openDocsTab,
      createFolder: createFolderInTree,
      createRequest,
      renameFolder: renameFolderInTree,
      deleteItem,
      moveItem,
      setExpandedFolders,
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
    onCreateEnvironment: variablesDialog.createEnvironment,
    onRenameEnvironment: variablesDialog.renameEnvironment,
    onDuplicateEnvironment: variablesDialog.duplicateEnvironment,
    onDeleteEnvironment: variablesDialog.deleteEnvironment,
    onSelectEnvironment: updateActiveEnvironment,
    onViewEnvironment: viewEnvironment,
    viewingEnvironmentId: activeEnvironmentTab?.id ?? null,
    canCreateEnvironment: variablesDialog.canCreateEnvironment,
    onShowSidebar: () => setSidebarOpen(true),
    historyRows: sendHistory.entries.flatMap((entry) => {
      const node = treeIndex.nodeById.get(entry.requestId)
      if (!node || isFolder(node)) return []
      return [
        {
          key: entry.key,
          requestId: entry.requestId,
          method: node.method,
          name: node.name,
          detail: `${entry.status} ${entry.statusText}, ${entry.duration} ms, ${entry.at}`,
          ok: entry.status < 400,
          active: node.id === selectedRequestId,
        },
      ]
    }),
    referenceGroups: referenceGroups(
      tree,
      activeWorkspaceTab?.kind === 'environment' ? '' : selectedRequestId,
      activeWorkspace?.name ?? '',
    ),
    onOpenRequest: openRequestTab,
    onOpenDocs: openDocsTab,
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
    canCreateRequest: Boolean(activeWorkspace) && !isReadOnly,
    onSelectTab: selectWorkspaceTab,
    onCloseTab: closeWorkspaceTab,
    onCloseOtherTabs: closeOtherWorkspaceTabs,
    onCloseAllTabs: closeAllWorkspaceTabs,
    onNewRequest: () => createRequest(),
    onDuplicateTab: (tab) => duplicateRequest(tab.id),
    onRevealTab: (tab) => {
      sidebar.onSelectPanel(tab.kind === 'environment' ? 'environments' : 'collections')
      if (tab.kind !== 'environment') revealRequestInTree(tab.id)
    },
    onReadDocs: openCurrentDocs,
    onOpenVariables: () => setVariablesDialogOpen(true),
    onEnvironmentChange: updateActiveEnvironment,
    onOpenRequest: openRequestTab,
    onOpenOpenApi: () => setOpenApiDialogOpen(true),
  })
  return {
    chrome,
    notifications: notifications.stack,
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
    lastSendById: sendHistory.lastSendById,
    sidebarOpen,
    openSidebar: () => setSidebarOpen(true),
    toggleSidebar: () => setSidebarOpen((open) => !open),
    closeSidebar: () => setSidebarOpen(false),
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
    saveConflictDialog: {
      open: storage.saveConflict !== null,
      onKeepMine: () => void keepMyVersion(),
      onUseSaved: () => void storage.loadSavedVersion(),
    },
  }
}
