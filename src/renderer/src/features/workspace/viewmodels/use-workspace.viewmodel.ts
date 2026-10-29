import { type FormEvent, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAiConnectViewModel } from '@/features/ai-connect'
import {
  addToTree,
  containsId,
  findNode,
  findParentFolder,
  firstRequestId,
  indexTree,
  initialTree,
  insertNode,
  isFolder,
  isRequest,
  nodeDiffText,
  normalizeSharedTree,
  normalizeSharedVariables,
  normalizeTree,
  removeNode,
  renameFolder,
  updateNode,
  useCollectionTreeViewModel,
} from '@/features/collection'
import { replaceUrlParams, syncUrlParams } from '@/features/request'
import {
  type Applied,
  type CloudWorkspaceRecord,
  changeStatusKey,
  cloudWorkspaceService,
  type PendingMergeState,
  pullWorkspaceChanges,
  pushWorkspaceCommits,
  resolvePendingMerge,
  SYNC_TEXT,
  syncService,
  useCloudCommitDetailsViewModel,
  useCloudHistoryViewModel,
  useCommitDialogStateViewModel,
  useCommitDialogViewModel,
  useDiscardDialogViewModel,
  useMergeDialogViewModel,
  useSyncFooterViewModel,
  useTeamDialogsViewModel,
} from '@/features/sync'
import { useEnvironmentTabViewModel, useVariableQuickEditViewModel, useVariablesDialogViewModel } from '@/features/variables'
import { readStagedSnapshot, readStagedVariables, readTree } from '@/features/workspace/lib/storage'
import { readWorkspaceTabs, workspaceTabKey } from '@/features/workspace/lib/workspace-tabs'
import type { WorkspaceHistoryCommit, WorkspaceTab } from '@/features/workspace/models/workspace.model'
import { appUpdateService, type UpdateStatus } from '@/features/workspace/services/app-update.service'
import { workspaceStorageService } from '@/features/workspace/services/workspace-storage.service'
import { useCloudRealtimeViewModel } from '@/features/workspace/viewmodels/use-cloud-realtime.viewmodel'
import { useCollectionWidthViewModel } from '@/features/workspace/viewmodels/use-collection-width.viewmodel'
import { useWorkspaceChromeViewModel } from '@/features/workspace/viewmodels/use-workspace-chrome.viewmodel'
import { useWorkspacePersistenceViewModel } from '@/features/workspace/viewmodels/use-workspace-persistence.viewmodel'
import { useWorkspaceSessionViewModel } from '@/features/workspace/viewmodels/use-workspace-session.viewmodel'
import { useWorkspaceSidebarViewModel } from '@/features/workspace/viewmodels/use-workspace-sidebar.viewmodel'
import { useWorkspaceTabbarViewModel } from '@/features/workspace/viewmodels/use-workspace-tabbar.viewmodel'
import { apiCall, apiListAll, type CloudWorkspace } from '@/lib/api'
import { diffText } from '@/lib/text-diff'
import { buildStagedSnapshot, getWorkspaceChanges, type WorkspaceChange } from '@/lib/workspace-changes'
import {
  activeVariableValues,
  emptyWorkspaceVariables,
  normalizeWorkspaceVariables,
  preserveLocalSecretValues,
  shareableWorkspaceVariables,
  type WorkspaceEnvironment,
  type WorkspaceVariables,
  workspaceVariablesChangeId,
  workspaceVariablesDiffText,
} from '@/lib/workspace-variables'
import type { VariableSuggestion } from '@/shared/components/variable-field'
import type { ApiNode, FolderNode, RequestNode } from '@/shared/models/api-node.model'

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
  const pendingWorkspaceSaveRef = useRef<LocalWorkspace | null>(null)
  const workspaceSaveTimerRef = useRef<number | undefined>(undefined)
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
  const restoreTabsEvent = useEffectEvent(restoreTabs)
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

  useWorkspacePersistenceViewModel({
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
  const cloudHistoryOpen = commitDialogOpen && commitDialogView === 'history'
  const {
    commits: cloudCommits,
    loading: historyLoading,
    error: historyError,
  } = useCloudHistoryViewModel({ token: sessionToken, cloudId: activeWorkspace?.cloudId ?? null, enabled: cloudHistoryOpen })
  const lastLocalCommit = localCommits.find((commit) => commit.id === activeWorkspace?.localHeadId)
  const committedTree = (lastLocalCommit?.tree ?? activeWorkspace?.baseTree ?? tree) as ApiNode[]
  const committedVariablesSource = lastLocalCommit?.variables ?? activeWorkspace?.baseVariables ?? activeWorkspace?.variables
  const committedVariables = useMemo(() => normalizeWorkspaceVariables(committedVariablesSource), [committedVariablesSource])
  const stageBaseTree = stagedSnapshot ?? committedTree
  const stageBaseVariables = stagedVariables ?? committedVariables
  const workspaceChanges = useMemo(
    () => getWorkspaceChanges(committedTree, tree, committedVariables, workspaceVariables),
    [committedTree, tree, committedVariables, workspaceVariables],
  )
  const pendingPushCount = localCommits.filter((commit) => !commit.pushed).length
  const cloudHeadCommitId = cloudWorkspaces.find((workspace) => workspace.id === activeWorkspace?.cloudId)?.headCommitId
  const showChanges = commitDialogOpen && commitDialogView === 'changes'
  const hasStagedContent = Boolean(stagedSnapshot || stagedVariables)
  const stagedChanges = useMemo(
    () =>
      showChanges && hasStagedContent ? getWorkspaceChanges(committedTree, stageBaseTree, committedVariables, stageBaseVariables) : [],
    [showChanges, hasStagedContent, committedTree, stageBaseTree, committedVariables, stageBaseVariables],
  )
  const unstagedChanges = useMemo(() => {
    if (!showChanges) return []
    if (!hasStagedContent) return workspaceChanges
    return getWorkspaceChanges(stageBaseTree, tree, stageBaseVariables, workspaceVariables)
  }, [showChanges, hasStagedContent, workspaceChanges, stageBaseTree, tree, stageBaseVariables, workspaceVariables])
  const changeById = useMemo(() => new Map(workspaceChanges.map((change) => [change.id, change])), [workspaceChanges])
  const selectedChange = showChanges ? workspaceChanges.find((change) => change.id === selectedChangeId) : undefined
  const diffRows = useMemo(
    () =>
      selectedChange
        ? diffText(
            selectedChange.id === workspaceVariablesChangeId
              ? workspaceVariablesDiffText(committedVariables)
              : nodeDiffText(findNode(committedTree, selectedChange.id)),
            selectedChange.id === workspaceVariablesChangeId
              ? workspaceVariablesDiffText(workspaceVariables)
              : nodeDiffText(treeIndex.nodeById.get(selectedChange.id)),
          )
        : [],
    [selectedChange, committedTree, treeIndex, committedVariables, workspaceVariables],
  )
  const historyCommits = useMemo<WorkspaceHistoryCommit[]>(() => {
    const combined = new Map<string, WorkspaceHistoryCommit>()
    for (const commit of cloudCommits)
      combined.set(commit.id, {
        ...commit,
        pushed: true,
        source: 'cloud',
      })
    for (const commit of localCommits) {
      const cloudVersion = combined.get(commit.id)
      combined.set(commit.id, {
        ...commit,
        pushed: commit.pushed || Boolean(cloudVersion),
        source: cloudVersion ? 'cloud' : 'local',
      })
    }
    return [...combined.values()].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
  }, [cloudCommits, localCommits])
  const historyCommitById = useMemo(() => new Map(historyCommits.map((commit) => [commit.id, commit])), [historyCommits])
  const localCommitIds = useMemo(() => new Set(localCommits.map((commit) => commit.id)), [localCommits])
  const selectedHistoryCommit = historyCommitById.get(selectedHistoryCommitId)
  const historyParentId = selectedHistoryCommit?.parentIds.find((id) => historyCommitById.has(id))
  const historyParentCommit = historyParentId ? historyCommitById.get(historyParentId) : undefined
  const historyDetailIds =
    cloudHistoryOpen && selectedHistoryCommit
      ? [selectedHistoryCommit.id, ...(historyParentId ? [historyParentId] : [])].filter(
          (id) => !Array.isArray(historyCommitById.get(id)?.tree),
        )
      : []
  const {
    detailsById: cloudCommitDetails,
    loading: historyDetailLoading,
    error: historyDetailError,
  } = useCloudCommitDetailsViewModel({ token: sessionToken, cloudId: activeWorkspace?.cloudId ?? null, commitIds: historyDetailIds })
  const selectedHistoryTreeValue =
    selectedHistoryCommit?.tree ?? (selectedHistoryCommit ? cloudCommitDetails.get(selectedHistoryCommit.id)?.tree : undefined)
  const historyParentTreeValue = historyParentCommit?.tree ?? (historyParentId ? cloudCommitDetails.get(historyParentId)?.tree : undefined)
  const historySnapshotsReady = Boolean(
    selectedHistoryCommit &&
      Array.isArray(selectedHistoryTreeValue) &&
      (!historyParentId || Array.isArray(historyParentTreeValue) || historyDetailError),
  )
  const historyAfterTree = useMemo(() => normalizeTree(selectedHistoryTreeValue), [selectedHistoryTreeValue])
  const historyBeforeTree = useMemo(() => {
    if (Array.isArray(historyParentTreeValue)) return normalizeTree(historyParentTreeValue)
    return selectedHistoryCommit && (selectedHistoryCommit.source === 'local' || selectedHistoryCommit.parentIds.length > 0)
      ? ((activeWorkspace?.baseTree as ApiNode[]) ?? [])
      : []
  }, [historyParentTreeValue, selectedHistoryCommit, activeWorkspace?.baseTree])
  const historyBeforeVariables = useMemo(
    () =>
      historyParentCommit?.variables
        ? normalizeWorkspaceVariables(historyParentCommit.variables)
        : historyParentId && cloudCommitDetails.get(historyParentId)?.variables
          ? normalizeWorkspaceVariables(cloudCommitDetails.get(historyParentId)?.variables)
          : selectedHistoryCommit && (selectedHistoryCommit.source === 'local' || selectedHistoryCommit.parentIds.length > 0)
            ? normalizeWorkspaceVariables(activeWorkspace?.baseVariables ?? emptyWorkspaceVariables())
            : emptyWorkspaceVariables(),
    [historyParentCommit, historyParentId, cloudCommitDetails, selectedHistoryCommit, activeWorkspace?.baseVariables],
  )
  const historyAfterVariables = useMemo(
    () =>
      normalizeWorkspaceVariables(
        selectedHistoryCommit?.variables ??
          (selectedHistoryCommit ? cloudCommitDetails.get(selectedHistoryCommit.id)?.variables : undefined),
      ),
    [selectedHistoryCommit, cloudCommitDetails],
  )
  const historyChanges = useMemo(
    () =>
      selectedHistoryCommit && historySnapshotsReady
        ? getWorkspaceChanges(historyBeforeTree, historyAfterTree, historyBeforeVariables, historyAfterVariables)
        : [],
    [selectedHistoryCommit, historySnapshotsReady, historyBeforeTree, historyAfterTree, historyBeforeVariables, historyAfterVariables],
  )
  const selectedHistoryChange = historyChanges.find((change) => change.id === selectedHistoryChangeId)
  const historyDiffRows = useMemo(
    () =>
      selectedHistoryCommit && selectedHistoryChange
        ? diffText(
            selectedHistoryChange.id === workspaceVariablesChangeId
              ? workspaceVariablesDiffText(historyBeforeVariables)
              : nodeDiffText(findNode(historyBeforeTree, selectedHistoryChange.id)),
            selectedHistoryChange.id === workspaceVariablesChangeId
              ? workspaceVariablesDiffText(historyAfterVariables)
              : nodeDiffText(findNode(historyAfterTree, selectedHistoryChange.id)),
          )
        : [],
    [selectedHistoryCommit, selectedHistoryChange, historyBeforeTree, historyAfterTree, historyAfterVariables, historyBeforeVariables],
  )
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

  const aiConnect = useAiConnectViewModel()
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null)
  useEffect(() => appUpdateService.onStatus(setUpdateStatus), [])

  function activateWorkspace(workspaceId: string) {
    const next = localWorkspaces.find((item) => item.id === workspaceId)
    if (!next) return
    if (workspaceSaveTimerRef.current !== undefined) window.clearTimeout(workspaceSaveTimerRef.current)
    const pending = pendingWorkspaceSaveRef.current
    pendingWorkspaceSaveRef.current = null
    workspaceSaveTimerRef.current = undefined
    if (pending) void workspaceStorageService.saveWorkspace(pending)
    setLocalWorkspaces((current) =>
      current.map((item) =>
        item.id === currentWorkspaceId ? { ...item, tree: tree as unknown[], variables: workspaceVariables, activeEnvironmentId } : item,
      ),
    )
    stagedWorkspaceIdRef.current = next.id
    setStagedSnapshot(readStagedSnapshot(next.id))
    setStagedVariables(readStagedVariables(next.id))
    setCurrentWorkspaceId(next.id)
    const nextTree = normalizeTree(next.tree)
    setTree(nextTree)
    const nextVariables = normalizeWorkspaceVariables(next.variables)
    setWorkspaceVariables(nextVariables)
    setActiveEnvironmentId(
      next.activeEnvironmentId && nextVariables.environments.some((environment) => environment.id === next.activeEnvironmentId)
        ? next.activeEnvironmentId
        : null,
    )
    restoreTabs(next.id, nextTree, nextVariables)
    setExpandedFolders(new Set(nextTree.filter(isFolder).map((folder) => folder.id)))
  }

  function persistActiveWorkspace(patch: Partial<LocalWorkspace>) {
    if (!activeWorkspace) return
    const updated = {
      ...activeWorkspace,
      ...patch,
      tree: Object.hasOwn(patch, 'tree') ? (patch.tree as unknown[]) : (tree as unknown[]),
      variables: Object.hasOwn(patch, 'variables') ? patch.variables : workspaceVariables,
      activeEnvironmentId: Object.hasOwn(patch, 'activeEnvironmentId') ? patch.activeEnvironmentId : activeEnvironmentId,
    }
    setLocalWorkspaces((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    void workspaceStorageService.saveWorkspace(updated)
  }

  function updateWorkspaceVariables(next: WorkspaceVariables) {
    if (isReadOnly && JSON.stringify(shareableWorkspaceVariables(next)) !== JSON.stringify(shareableWorkspaceVariables(workspaceVariables)))
      return
    setWorkspaceVariables(next)
    persistActiveWorkspace({ variables: next })
  }

  function updateActiveEnvironment(environmentId: string | null) {
    setActiveEnvironmentId(environmentId)
    persistActiveWorkspace({ activeEnvironmentId: environmentId })
  }

  function openRequestTab(requestId: string) {
    const request = treeIndex.nodeById.get(requestId)
    if (!request || !isRequest(request)) return
    const tab: WorkspaceTab = { kind: 'request', id: requestId }
    if (workspaceTabKey(tab) === activeWorkspaceTabKey) return
    setWorkspaceTabs((current) => (current.some((item) => workspaceTabKey(item) === workspaceTabKey(tab)) ? current : [...current, tab]))
    setActiveWorkspaceTabKey(workspaceTabKey(tab))
    setSelectedRequestId(requestId)
    setSelectedFolderId(treeIndex.parentFolderById.get(requestId) ?? '')
  }

  function openDocsTab(requestId: string) {
    const request = treeIndex.nodeById.get(requestId)
    if (!request || !isRequest(request)) return
    const tab: WorkspaceTab = { kind: 'docs', id: requestId }
    setWorkspaceTabs((current) => (current.some((item) => workspaceTabKey(item) === workspaceTabKey(tab)) ? current : [...current, tab]))
    setActiveWorkspaceTabKey(workspaceTabKey(tab))
    setSelectedRequestId(requestId)
    setSelectedFolderId(treeIndex.parentFolderById.get(requestId) ?? '')
  }

  function openCurrentDocs() {
    const selected = activeRequest && isRequest(activeRequest) ? activeRequest : treeIndex.nodeById.get(firstRequestId(tree))
    if (selected && isRequest(selected)) openDocsTab(selected.id)
  }

  function openEnvironmentTab(environmentId: string) {
    const tab: WorkspaceTab = { kind: 'environment', id: environmentId }
    setWorkspaceTabs((current) => (current.some((item) => workspaceTabKey(item) === workspaceTabKey(tab)) ? current : [...current, tab]))
    setActiveWorkspaceTabKey(workspaceTabKey(tab))
    setActiveEnvironmentId(environmentId)
  }

  function selectWorkspaceTab(tab: WorkspaceTab) {
    if (workspaceTabKey(tab) === activeWorkspaceTabKey) return
    setActiveWorkspaceTabKey(workspaceTabKey(tab))
    if (tab.kind === 'request' || tab.kind === 'docs') {
      setSelectedRequestId(tab.id)
      setSelectedFolderId(treeIndex.parentFolderById.get(tab.id) ?? '')
    } else updateActiveEnvironment(tab.id)
  }

  function closeWorkspaceTab(tab: WorkspaceTab) {
    const key = workspaceTabKey(tab)
    const index = workspaceTabs.findIndex((item) => workspaceTabKey(item) === key)
    if (index < 0) return
    const remaining = workspaceTabs.filter((item) => workspaceTabKey(item) !== key)
    setWorkspaceTabs(remaining)
    if (activeWorkspaceTabKey !== key) return
    const next = remaining[Math.min(index, remaining.length - 1)]
    setActiveWorkspaceTabKey(next ? workspaceTabKey(next) : '')
    if (next?.kind === 'request') {
      setSelectedRequestId(next.id)
      setSelectedFolderId(treeIndex.parentFolderById.get(next.id) ?? '')
    } else if (next?.kind === 'docs') {
      setSelectedRequestId(next.id)
      setSelectedFolderId(treeIndex.parentFolderById.get(next.id) ?? '')
    } else if (next?.kind === 'environment') updateActiveEnvironment(next.id)
  }

  function updateEnvironmentTab(environmentId: string, patch: Partial<WorkspaceEnvironment>) {
    if (isReadOnly) return
    updateWorkspaceVariables({
      ...workspaceVariables,
      environments: workspaceVariables.environments.map((environment) =>
        environment.id === environmentId ? { ...environment, ...patch } : environment,
      ),
    })
  }

  function restoreTabs(workspaceId: string, nextTree: ApiNode[], variables: WorkspaceVariables) {
    const restored = readWorkspaceTabs(workspaceId, nextTree, variables)
    setWorkspaceTabs(restored.tabs)
    setActiveWorkspaceTabKey(restored.activeKey)
    const selectedRequestTab =
      restored.tabs.find((tab) => (tab.kind === 'request' || tab.kind === 'docs') && workspaceTabKey(tab) === restored.activeKey) ??
      restored.tabs.find((tab) => tab.kind === 'request' || tab.kind === 'docs')
    if (selectedRequestTab && (selectedRequestTab.kind === 'request' || selectedRequestTab.kind === 'docs')) {
      setSelectedRequestId(selectedRequestTab.id)
      setSelectedFolderId(findParentFolder(nextTree, selectedRequestTab.id))
    } else {
      setSelectedRequestId(firstRequestId(nextTree))
      setSelectedFolderId(nextTree[0]?.id ?? '')
    }
  }

  function resetTabs(nextTree: ApiNode[]) {
    const requestId = firstRequestId(nextTree)
    const tabs: WorkspaceTab[] = requestId ? [{ kind: 'request', id: requestId }] : []
    setWorkspaceTabs(tabs)
    setActiveWorkspaceTabKey(tabs[0] ? workspaceTabKey(tabs[0]) : '')
    if (requestId) {
      setSelectedRequestId(requestId)
      setSelectedFolderId(findParentFolder(nextTree, requestId))
    } else setSelectedFolderId(nextTree[0]?.id ?? '')
  }

  function openVariableEditor(name: string, sourceValue: string) {
    setQuickEditTarget({ name, sourceValue })
  }

  function saveQuickVariable(name: string, scopeId: string, value: string) {
    const existingEnvironment = workspaceVariables.environments.find((environment) => environment.id === scopeId)
    if (scopeId !== 'global' && existingEnvironment) {
      const existing = existingEnvironment.variables.find((variable) => variable.name.trim() === name)
      const rows = existing
        ? existingEnvironment.variables.map((variable) => (variable.id === existing.id ? { ...variable, value } : variable))
        : [...existingEnvironment.variables, { id: crypto.randomUUID(), name, value, secret: false }]
      updateWorkspaceVariables({
        ...workspaceVariables,
        environments: workspaceVariables.environments.map((environment) =>
          environment.id === scopeId ? { ...environment, variables: rows } : environment,
        ),
      })
    } else {
      const existing = workspaceVariables.globals.find((variable) => variable.name.trim() === name)
      const globals = existing
        ? workspaceVariables.globals.map((variable) => (variable.id === existing.id ? { ...variable, value } : variable))
        : [...workspaceVariables.globals, { id: crypto.randomUUID(), name, value, secret: false }]
      updateWorkspaceVariables({ ...workspaceVariables, globals })
    }
    setQuickEditTarget(null)
  }

  function stageChanges(changes: WorkspaceChange[], staged: boolean) {
    const base = stagedSnapshot ?? committedTree
    const source = staged ? tree : committedTree
    const treeIds = changes.filter((change) => change.id !== workspaceVariablesChangeId).map((change) => change.id)
    const next = buildStagedSnapshot(base, source, new Set(treeIds))
    const nextStage = JSON.stringify(next) === JSON.stringify(committedTree) ? null : next
    setStagedSnapshot(nextStage)
    if (changes.some((change) => change.id === workspaceVariablesChangeId)) {
      const nextVariables = staged ? shareableWorkspaceVariables(workspaceVariables) : null
      setStagedVariables(nextVariables && JSON.stringify(nextVariables) !== JSON.stringify(committedVariables) ? nextVariables : null)
    }
  }

  function stageChange(change: WorkspaceChange, staged: boolean) {
    stageChanges([change], staged)
  }

  async function saveCommit(event: FormEvent) {
    event.preventDefault()
    if (!activeWorkspace || !commitMessage.trim()) return
    const previousTree = committedTree
    if (!stagedChanges.length) {
      setCommitDialogOpen(false)
      setSyncStatus('Stage at least one change before committing.')
      return
    }
    const stagedTree = stagedSnapshot ?? (previousTree as ApiNode[])
    const stagedVariableSnapshot = stagedVariables ?? committedVariables
    if (
      JSON.stringify(previousTree) === JSON.stringify(stagedTree) &&
      JSON.stringify(committedVariables) === JSON.stringify(stagedVariableSnapshot)
    ) {
      setCommitDialogOpen(false)
      setSyncStatus('There are no staged changes to commit.')
      return
    }
    const commit: LocalCommit = {
      id: crypto.randomUUID(),
      parentIds: activeWorkspace.localHeadId ? [activeWorkspace.localHeadId] : [],
      message: commitMessage.trim(),
      tree: stagedTree,
      variables: shareableWorkspaceVariables(stagedVariableSnapshot),
      createdAt: new Date().toISOString(),
      pushed: false,
    }
    await workspaceStorageService.saveCommit(activeWorkspace.id, commit)
    setLocalCommits((current) => [...current.filter((item) => item.id !== commit.id), commit])
    persistActiveWorkspace({ localHeadId: commit.id })
    setStagedSnapshot(null)
    setStagedVariables(null)
    setCommitMessage('')
    setCommitDialogOpen(false)
    setSyncStatus('Commit saved locally.')
  }

  function discardLocalChanges() {
    if (!activeWorkspace) return
    setTree(committedTree)
    const restoredVariables = preserveLocalSecretValues(committedVariables, workspaceVariables)
    setWorkspaceVariables(restoredVariables)
    if (activeEnvironmentId && !restoredVariables.environments.some((environment) => environment.id === activeEnvironmentId)) {
      setActiveEnvironmentId(restoredVariables.environments[0]?.id ?? null)
    }
    setStagedSnapshot(null)
    setStagedVariables(null)
    setDiscardConfirmOpen(false)
    setSyncMenuOpen(false)
    setSyncStatus('Discarded uncommitted changes.')
  }

  // Brings cloud changes in. The workflow decides what happens; this applies the outcome to the workspace's state.
  async function pullWorkspace() {
    if (!sessionToken || !activeWorkspace?.cloudId) return
    setSyncStatus(tSync(SYNC_TEXT.pull.pulling))
    const outcome = await pullWorkspaceChanges({
      token: sessionToken,
      workspace: activeWorkspace,
      tree,
      variables: workspaceVariables,
      activeEnvironmentId,
      translate: (key) => tSync(SYNC_TEXT.pull[key]),
      pullCloud: (input) => syncService.pull(input),
      listCommits: (workspaceId) => workspaceStorageService.listCommits(workspaceId),
      saveWorkspace: (workspace) => workspaceStorageService.saveWorkspace(workspace),
      saveCommit: (workspaceId, commit) => workspaceStorageService.saveCommit(workspaceId, commit),
    })
    if (outcome.kind === 'applied') applyPulledState(outcome.applied)
    if (outcome.kind === 'conflicts') {
      setMergeChoices({})
      setPendingMerge(outcome.pending)
    }
    setSyncStatus(outcome.message)
  }

  // Writes what a pull or a merge decided into the workspace's state. The storage writes already happened in the workflow.
  function applyPulledState(applied: Applied) {
    setLocalWorkspaces((current) => current.map((item) => (item.id === applied.workspace.id ? applied.workspace : item)))
    setTree(applied.tree)
    setWorkspaceVariables(applied.variables)
    setActiveEnvironmentId(applied.activeEnvironmentId)
    setSelectedRequestId(applied.selectedRequestId)
  }

  // Sends local commits. The workflow decides what happens; this applies the outcome to the workspace's state.
  async function pushWorkspace() {
    if (!sessionToken || !activeWorkspace) return
    const outcome = await pushWorkspaceCommits({
      token: sessionToken,
      role: activeWorkspace.role,
      workspace: activeWorkspace,
      tree,
      variables: workspaceVariables,
      translate: (key) => tSync(SYNC_TEXT.push[key]),
      listCommits: (workspaceId) => workspaceStorageService.listCommits(workspaceId),
      saveWorkspace: (workspace) => workspaceStorageService.saveWorkspace(workspace),
      saveCommit: (workspaceId, commit) => workspaceStorageService.saveCommit(workspaceId, commit),
      createCloud: (input) => cloudWorkspaceService.create(input),
      push: (input) => syncService.push(input),
    })
    if (outcome.kind === 'refused' || outcome.kind === 'nothing') {
      setSyncStatus(outcome.message)
      return
    }
    if ('published' in outcome && outcome.published) {
      const { workspace, cloud, rebased } = outcome.published
      setLocalWorkspaces((current) => current.map((item) => (item.id === workspace.id ? workspace : item)))
      setCloudWorkspaces((current) => [...current.filter((item) => item.id !== cloud.id), cloudSummary(cloud)])
      const rebasedById = new Map(rebased.map((item) => [item.id, item]))
      setLocalCommits((current) => current.map((item) => rebasedById.get(item.id) ?? item))
    }
    if (outcome.kind === 'pushed') {
      const pushedById = new Map(outcome.pushed.map((item) => [item.id, item]))
      setLocalCommits((current) => current.map((item) => pushedById.get(item.id) ?? item))
      setLocalWorkspaces((current) => current.map((item) => (item.id === outcome.workspace.id ? outcome.workspace : item)))
      setCloudWorkspaces((current) =>
        current.map((item) =>
          item.id === outcome.workspace.cloudId ? { ...item, headCommitId: outcome.workspace.baseCommitId ?? item.headCommitId } : item,
        ),
      )
      setSyncStatus(outcome.message)
      return
    }
    if (outcome.kind === 'conflict') {
      if (outcome.workspaceAlreadyOnCloud) {
        setSyncStatus(outcome.message)
        await pullWorkspace()
      } else setSyncStatus(outcome.message)
      return
    }
    setSyncStatus(outcome.message)
  }

  // A cloud workspace list entry needs only the fields the sidebar reads.
  function cloudSummary(cloud: CloudWorkspaceRecord): CloudWorkspace {
    return { id: cloud.id, name: cloud.name, role: cloud.role, headCommitId: cloud.headCommitId }
  }

  async function applyMergeResolution() {
    if (!pendingMerge || !activeWorkspace) return
    const outcome = await resolvePendingMerge({
      pending: pendingMerge,
      choices: mergeChoices,
      workspace: activeWorkspace,
      activeEnvironmentId,
      translate: (key) => tSync(SYNC_TEXT.pull[key]),
      saveWorkspace: (workspace) => workspaceStorageService.saveWorkspace(workspace),
      saveCommit: (workspaceId, commit) => workspaceStorageService.saveCommit(workspaceId, commit),
    })
    if (outcome.kind === 'incomplete') return
    applyPulledState(outcome.applied)
    setPendingMerge(null)
    setSyncStatus(outcome.message)
  }

  function createFolderInTree(parentId: string, name: string) {
    if (isReadOnly) return
    const folder: FolderNode = { id: crypto.randomUUID(), kind: 'folder', name, children: [] }
    setTree((current) => addToTree(current, parentId, folder))
    setSelectedFolderId(folder.id)
    setExpandedFolders((current) => new Set(current).add(folder.id))
  }

  // An OpenAPI import adds its folders and opens its first request.
  function importTree(imported: ApiNode[]) {
    setTree((current) => [...current, ...imported])
    const importedRequestId = firstRequestId(imported)
    if (importedRequestId) {
      const tab: WorkspaceTab = { kind: 'request', id: importedRequestId }
      setWorkspaceTabs((current) => [...current.filter((item) => workspaceTabKey(item) !== workspaceTabKey(tab)), tab])
      setActiveWorkspaceTabKey(workspaceTabKey(tab))
      setSelectedRequestId(importedRequestId)
      setSelectedFolderId(findParentFolder(imported, importedRequestId))
    }
    const folders = new Set<string>()
    const collectFolders = (nodes: ApiNode[]) =>
      nodes.forEach((node) => {
        if (node.kind === 'folder') {
          folders.add(node.id)
          collectFolders(node.children)
        }
      })
    collectFolders(imported)
    setExpandedFolders((current) => new Set([...current, ...folders]))
  }

  function renameFolderInTree(folderId: string, name: string) {
    setTree((current) => renameFolder(current, folderId, name))
  }

  function selectFolder(folderId: string) {
    setSelectedFolderId(folderId)
  }

  function toggleFolderExpanded(folderId: string) {
    setExpandedFolders((current) => {
      const next = new Set(current)
      if (next.has(folderId)) next.delete(folderId)
      else next.add(folderId)
      return next
    })
  }

  function createRequest(folderId = selectedFolderId) {
    if (isReadOnly) return
    const request: RequestNode = {
      id: crypto.randomUUID(),
      kind: 'request',
      name: 'Untitled request',
      method: 'GET',
      url: '',
      body: '{\n  \n}',
      bodyMode: 'json',
      bodyFields: [],
      headers: [{ id: crypto.randomUUID(), name: 'Accept', value: '*/*', enabled: true }],
      params: [],
      auth: { type: 'none' },
    }
    setTree((current) => addToTree(current, folderId, request))
    const tab: WorkspaceTab = { kind: 'request', id: request.id }
    setWorkspaceTabs((current) => [...current.filter((item) => workspaceTabKey(item) !== workspaceTabKey(tab)), tab])
    setActiveWorkspaceTabKey(workspaceTabKey(tab))
    setSelectedRequestId(request.id)
    setSelectedFolderId(folderId)
    setExpandedFolders((current) => new Set(current).add(folderId))
  }

  function deleteItem(id: string) {
    if (isReadOnly) return
    const target = treeIndex.nodeById.get(id)
    if (!target) return

    const removedIds = new Set<string>()
    const collectIds = (node: ApiNode) => {
      removedIds.add(node.id)
      if (isFolder(node)) node.children.forEach(collectIds)
    }
    collectIds(target)

    const activeTabIndex = workspaceTabs.findIndex((tab) => workspaceTabKey(tab) === activeWorkspaceTabKey)
    const activeTab = activeTabIndex >= 0 ? workspaceTabs[activeTabIndex] : undefined
    const activeTabRemoved = Boolean(activeTab && removedIds.has(activeTab.id))
    const nextTree = removeNode(tree, target.id).nodes
    const nextTabs = workspaceTabs.filter((tab) => tab.kind === 'environment' || !removedIds.has(tab.id))
    const nextActiveTab = activeTabRemoved ? nextTabs[Math.min(activeTabIndex, nextTabs.length - 1)] : (activeTab ?? nextTabs[0])

    setTree(nextTree)
    setWorkspaceTabs(nextTabs)
    setActiveWorkspaceTabKey(nextActiveTab ? workspaceTabKey(nextActiveTab) : '')
    setExpandedFolders((current) => new Set([...current].filter((folderId) => !removedIds.has(folderId))))
    if (nextActiveTab?.kind === 'request' || nextActiveTab?.kind === 'docs') {
      setSelectedRequestId(nextActiveTab.id)
      setSelectedFolderId(findParentFolder(nextTree, nextActiveTab.id))
    } else {
      const fallbackRequestId = firstRequestId(nextTree)
      setSelectedRequestId(fallbackRequestId)
      setSelectedFolderId(fallbackRequestId ? findParentFolder(nextTree, fallbackRequestId) : (nextTree.find(isFolder)?.id ?? ''))
      if (nextActiveTab?.kind === 'environment') setActiveEnvironmentId(nextActiveTab.id)
    }
  }

  function moveItem(sourceId: string, targetId: string | null) {
    if (isReadOnly) return
    if (sourceId === targetId) return
    const source = treeIndex.nodeById.get(sourceId)
    if (!source || (targetId && containsId(source, targetId))) return
    const originalParent = treeIndex.parentFolderById.get(sourceId) ?? ''
    const target = targetId ? treeIndex.nodeById.get(targetId) : undefined
    const destination =
      target && isRequest(target) ? (treeIndex.parentFolderById.get(target.id) ?? '') : target && isFolder(target) ? target.id : ''
    if (sourceId === destination || (originalParent === destination && targetId === null)) return
    setTree((current) => {
      const removed = removeNode(current, sourceId)
      // Dropping on a request inserts before it; dropping on a folder appends to it.
      return insertNode(removed.nodes, source, targetId)
    })
    if (isRequest(source) && source.id === selectedRequestId) setSelectedFolderId(destination)
    if (isFolder(source)) setExpandedFolders((current) => new Set(current).add(source.id))
    if (target && isFolder(target)) setExpandedFolders((current) => new Set(current).add(target.id))
  }

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
