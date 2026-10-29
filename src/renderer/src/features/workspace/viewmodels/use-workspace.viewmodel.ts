import { useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAiConnectViewModel } from '@/features/ai-connect'
import {
  firstRequestId,
  indexTree,
  initialTree,
  isFolder,
  isRequest,
  normalizeSharedTree,
  normalizeSharedVariables,
  normalizeTree,
  updateNode,
  useCollectionTreeViewModel,
} from '@/features/collection'
import { replaceUrlParams, syncUrlParams } from '@/features/request'
import {
  type CloudWorkspaceRecord,
  changeStatusKey,
  type PendingMergeState,
  useCommitDialogStateViewModel,
  useCommitDialogViewModel,
  useDiscardDialogViewModel,
  useMergeDialogViewModel,
  useSyncFooterViewModel,
  useTeamDialogsViewModel,
} from '@/features/sync'
import { useEnvironmentTabViewModel, useVariableQuickEditViewModel, useVariablesDialogViewModel } from '@/features/variables'
import { readStagedSnapshot, readStagedVariables, readTree } from '@/features/workspace/lib/storage'
import { workspaceTabKey } from '@/features/workspace/lib/workspace-tabs'
import type { WorkspaceTab } from '@/features/workspace/models/workspace.model'
import { appUpdateService, type UpdateStatus } from '@/features/workspace/services/app-update.service'
import { workspaceStorageService } from '@/features/workspace/services/workspace-storage.service'
import { useCloudRealtimeViewModel } from '@/features/workspace/viewmodels/use-cloud-realtime.viewmodel'
import { useCollectionWidthViewModel } from '@/features/workspace/viewmodels/use-collection-width.viewmodel'
import { useWorkspaceChangesViewModel } from '@/features/workspace/viewmodels/use-workspace-changes.viewmodel'
import { useWorkspaceChromeViewModel } from '@/features/workspace/viewmodels/use-workspace-chrome.viewmodel'
import { useCommitHistoryViewModel } from '@/features/workspace/viewmodels/use-workspace-history.viewmodel'
import { useWorkspaceNavigationViewModel } from '@/features/workspace/viewmodels/use-workspace-navigation.viewmodel'
import { useWorkspacePersistenceViewModel } from '@/features/workspace/viewmodels/use-workspace-persistence.viewmodel'
import { useWorkspaceSessionViewModel } from '@/features/workspace/viewmodels/use-workspace-session.viewmodel'
import { useWorkspaceSidebarViewModel } from '@/features/workspace/viewmodels/use-workspace-sidebar.viewmodel'
import { useWorkspaceSyncActionsViewModel } from '@/features/workspace/viewmodels/use-workspace-sync-actions.viewmodel'
import { useWorkspaceTabbarViewModel } from '@/features/workspace/viewmodels/use-workspace-tabbar.viewmodel'
import { useWorkspaceTreeActionsViewModel } from '@/features/workspace/viewmodels/use-workspace-tree-actions.viewmodel'
import { apiCall, apiListAll, type CloudWorkspace } from '@/lib/api'
import type { WorkspaceChange } from '@/lib/workspace-changes'
import {
  activeVariableValues,
  emptyWorkspaceVariables,
  normalizeWorkspaceVariables,
  type WorkspaceVariables,
  workspaceVariablesChangeId,
} from '@/lib/workspace-variables'
import type { VariableSuggestion } from '@/shared/components/variable-field'
import type { ApiNode, RequestNode } from '@/shared/models/api-node.model'

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
  const restoreTabsEvent = useEffectEvent((workspaceId: string, nextTree: ApiNode[], variables: WorkspaceVariables) =>
    navigation.restoreTabs(workspaceId, nextTree, variables),
  )
  useEffect(() => {
    let active = true
    const legacyTree = readTree()
    void workspaceStorageService
      .secureStorageAvailable()
      .then((available) => {
        if (active) setSecureStorageAvailable(available)
      })
      .catch(() => {
        if (active) setSecureStorageAvailable(false)
      })
    void workspaceStorageService
      .loadWorkspace(legacyTree)
      .then(async (defaultWorkspace) => {
        const storedRecords = await workspaceStorageService.listWorkspaces()
        if (!active) return
        const records = storedRecords.map((item) => ({
          ...item,
          tree: normalizeTree(item.tree),
          baseTree: normalizeTree(item.baseTree),
          variables: normalizeWorkspaceVariables(item.variables),
          baseVariables: normalizeSharedVariables(item.baseVariables ?? item.variables),
          activeEnvironmentId: item.activeEnvironmentId ?? null,
        }))
        const current = records.find((item) => item.id === defaultWorkspace.id) ?? {
          ...defaultWorkspace,
          tree: normalizeTree(defaultWorkspace.tree),
          baseTree: normalizeTree(defaultWorkspace.baseTree),
          variables: normalizeWorkspaceVariables(defaultWorkspace.variables),
          baseVariables: normalizeSharedVariables(defaultWorkspace.baseVariables ?? defaultWorkspace.variables),
          activeEnvironmentId: defaultWorkspace.activeEnvironmentId ?? null,
        }
        setLocalWorkspaces(records.length ? records : [current])
        setCurrentWorkspaceId(current.id)
        stagedWorkspaceIdRef.current = current.id
        setStagedSnapshot(readStagedSnapshot(current.id))
        setStagedVariables(readStagedVariables(current.id))
        const normalizedTree = normalizeTree(current.tree)
        setTree(normalizedTree)
        const normalizedVariables = normalizeWorkspaceVariables(current.variables)
        setWorkspaceVariables(normalizedVariables)
        const savedEnvironmentId =
          current.activeEnvironmentId &&
          normalizedVariables.environments.some((environment) => environment.id === current.activeEnvironmentId)
            ? current.activeEnvironmentId
            : null
        setActiveEnvironmentId(savedEnvironmentId)
        restoreTabsEvent(current.id, normalizedTree, normalizedVariables)
        setExpandedFolders(new Set(normalizedTree.filter(isFolder).map((folder) => folder.id)))
        localStorage.removeItem('api-docs-workspace')
        localStorage.removeItem('api-docs-collections')
        setStorageLoaded(true)
      })
      .catch((error) => setAuthError(error instanceof Error ? error.message : 'Could not load local workspace.'))
    return () => {
      active = false
    }
  }, [setAuthError])

  useEffect(
    () =>
      workspaceStorageService.onExternalChange(() => {
        void workspaceStorageService
          .listWorkspaces()
          .then((storedRecords) => {
            const records = storedRecords.map((item) => ({
              ...item,
              tree: normalizeTree(item.tree),
              baseTree: normalizeTree(item.baseTree),
              variables: normalizeWorkspaceVariables(item.variables),
              baseVariables: normalizeSharedVariables(item.baseVariables ?? item.variables),
              activeEnvironmentId: item.activeEnvironmentId ?? null,
            }))
            setLocalWorkspaces(records)
            const current = records.find((item) => item.id === currentWorkspaceId)
            if (!current) return
            setTree(current.tree)
            setWorkspaceVariables(current.variables ?? emptyWorkspaceVariables())
            setActiveEnvironmentId(current.activeEnvironmentId)
          })
          .catch((error) => setSyncStatus(error instanceof Error ? error.message : 'Could not refresh workspace changes.'))
      }),
    [currentWorkspaceId],
  )

  const findLocalWorkspaceByCloudId = useEffectEvent((cloudId: string) => localWorkspaces.find((item) => item.cloudId === cloudId))
  useEffect(() => {
    if (!sessionToken || !user || !storageLoaded) return
    let active = true
    void apiListAll<CloudWorkspace>('/api/workspaces', 'workspaces', { token: sessionToken })
      .then(async (workspaces) => {
        const records: LocalWorkspace[] = []
        for (const cloud of workspaces) {
          if (!active) return
          const existing = findLocalWorkspaceByCloudId(cloud.id)
          if (existing) {
            records.push({ ...existing, name: cloud.name, role: cloud.role })
          } else {
            const result = await apiCall<{ workspace: CloudWorkspace & { tree: ApiNode[]; variables?: WorkspaceVariables } }>(
              `/api/workspaces/${cloud.id}/sync/pull`,
              { token: sessionToken },
            )
            const remoteTree = normalizeSharedTree(result.workspace.tree)
            const remoteVariables = normalizeSharedVariables(result.workspace.variables)
            records.push({
              id: crypto.randomUUID(),
              cloudId: cloud.id,
              name: cloud.name,
              tree: remoteTree,
              baseTree: remoteTree,
              variables: remoteVariables,
              baseVariables: remoteVariables,
              activeEnvironmentId: remoteVariables.environments[0]?.id ?? null,
              baseCommitId: result.workspace.headCommitId,
              localHeadId: result.workspace.headCommitId,
              role: cloud.role,
            })
          }
        }
        if (!active) return
        setCloudWorkspaces(workspaces)
        if (records.length) {
          await Promise.all(records.map((record) => workspaceStorageService.saveWorkspace(record)))
          setLocalWorkspaces((current) => {
            const localOnly = current.filter((item) => !item.cloudId)
            return [...localOnly, ...records]
          })
        }
      })
      .catch((error) => {
        if (active) setSyncStatus(error instanceof Error ? error.message : 'Could not load cloud workspaces.')
      })
    return () => {
      active = false
    }
  }, [sessionToken, user, storageLoaded])

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
  const activeRequest = treeIndex.nodeById.get(selectedRequestId)
  const activeRequestRef = useRef<RequestNode | undefined>(undefined)
  useLayoutEffect(() => {
    activeRequestRef.current = activeRequest && isRequest(activeRequest) ? activeRequest : undefined
  }, [activeRequest])
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

  // A cloud workspace this device just created becomes the active one, with its own tabs.
  async function adoptCreatedWorkspace(workspace: LocalWorkspace, cloud: CloudWorkspaceRecord, createdVariables: WorkspaceVariables) {
    await workspaceStorageService.saveWorkspace(workspace)
    setLocalWorkspaces((current) => [...current, workspace])
    setCloudWorkspaces((current) => [...current, { id: cloud.id, name: cloud.name, role: cloud.role, headCommitId: cloud.headCommitId }])
    stagedWorkspaceIdRef.current = workspace.id
    setStagedSnapshot(null)
    setStagedVariables(null)
    setCurrentWorkspaceId(workspace.id)
    setWorkspaceVariables(createdVariables)
    setActiveEnvironmentId(workspace.activeEnvironmentId ?? null)
    resetTabs(workspace.tree as ApiNode[])
  }

  // A workspace joined through an invite is added and opened, with its shared tree.
  async function adoptAcceptedWorkspace(workspace: LocalWorkspace, cloud: CloudWorkspaceRecord, invitedVariables: WorkspaceVariables) {
    await workspaceStorageService.saveWorkspace(workspace)
    setLocalWorkspaces((current) => [...current, workspace])
    setCloudWorkspaces((current) => [...current, { id: cloud.id, name: cloud.name, role: cloud.role, headCommitId: cloud.headCommitId }])
    stagedWorkspaceIdRef.current = workspace.id
    setStagedSnapshot(null)
    setStagedVariables(null)
    setCurrentWorkspaceId(workspace.id)
    setTree(workspace.tree as ApiNode[])
    setWorkspaceVariables(invitedVariables)
    setActiveEnvironmentId(workspace.activeEnvironmentId ?? null)
    resetTabs(workspace.tree as ApiNode[])
  }

  function updateActiveRequest(patch: Partial<RequestNode>) {
    const request =
      activeRequestRef.current?.id === selectedRequestId ? activeRequestRef.current : treeIndex.nodeById.get(selectedRequestId)
    if (!request || !isRequest(request)) return
    let synchronizedPatch = patch
    if ('url' in patch && !('params' in patch) && typeof patch.url === 'string') {
      synchronizedPatch = { ...patch, params: syncUrlParams(patch.url, request.params ?? []) }
    } else if ('params' in patch && !('url' in patch)) {
      const params = patch.params ?? []
      synchronizedPatch = { ...patch, url: replaceUrlParams(request.url, params) }
    }
    activeRequestRef.current = { ...request, ...synchronizedPatch }
    setTree((current) => {
      return updateNode(current, selectedRequestId, synchronizedPatch)
    })
  }

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
    activeRequest,
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

  // The active request as the user last edited it. Each editor reads this at send or copy time.
  const readActiveRequest = (): RequestNode => {
    const latest = activeRequestRef.current?.id === selectedRequestId ? activeRequestRef.current : activeRequest
    return latest && isRequest(latest) ? latest : (activeRequest as RequestNode)
  }
  const builderRequest = activeWorkspaceTab?.kind === 'request' && activeRequest && isRequest(activeRequest) ? activeRequest : null
  const requestWorkbench = builderRequest
    ? {
        request: builderRequest,
        resetKey: `${currentWorkspaceId}:${builderRequest.id}`,
        readLatestRequest: readActiveRequest,
        readOnly: Boolean(isReadOnly),
        folderName: activeFolder && isFolder(activeFolder) ? activeFolder.name : '',
        statusText: activeWorkspace?.cloudId ? (activeWorkspace.role ?? '') : 'Saved locally',
        suggestions: variableSuggestions,
        resolvedVariables,
        onChange: updateActiveRequest,
        onOpenDocs: () => openDocsTab(builderRequest.id),
        onVariableClick: openVariableEditor,
      }
    : null

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
  const team = useTeamDialogsViewModel({
    sessionToken,
    activeWorkspace,
    tree,
    variables: workspaceVariables,
    activeEnvironmentId,
    inviteToken: inviteTokenDraft,
    onInviteTokenDraftChange: setInviteTokenDraft,
    onInviteTokenUsed: () => setInviteTokenDraft(''),
    onStatus: setSyncStatus,
    onCreated: adoptCreatedWorkspace,
    onAccepted: adoptAcceptedWorkspace,
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
