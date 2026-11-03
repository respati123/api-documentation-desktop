import { type Dispatch, type MutableRefObject, type SetStateAction, useEffect, useEffectEvent, useRef } from 'react'
import { isFolder, normalizeSharedTree, normalizeSharedVariables, normalizeTree } from '@/features/collection'
import { type CloudWorkspace, cloudWorkspaceService, syncService } from '@/features/sync'
import { applyCloudList } from '@/features/workspace/lib/cloud-workspace-sync'
import { readStagedSnapshot, readStagedVariables, readTree } from '@/features/workspace/lib/storage'
import type { ApiUser } from '@/features/workspace/models/cloud-session.model'
import { workspaceStorageService } from '@/features/workspace/services/workspace-storage.service'
import { emptyWorkspaceVariables, normalizeWorkspaceVariables, type WorkspaceVariables } from '@/lib/workspace-variables'
import type { ApiNode } from '@/shared/models/api-node.model'

export type StorageInput = {
  sessionToken: string | null
  user: ApiUser | null
  storageLoaded: boolean
  setStorageLoaded: Dispatch<SetStateAction<boolean>>
  currentWorkspaceId: string
  setCurrentWorkspaceId: Dispatch<SetStateAction<string>>
  localWorkspaces: LocalWorkspace[]
  setLocalWorkspaces: Dispatch<SetStateAction<LocalWorkspace[]>>
  cloudWorkspaces: CloudWorkspace[]
  setCloudWorkspaces: Dispatch<SetStateAction<CloudWorkspace[]>>
  setSecureStorageAvailable: Dispatch<SetStateAction<boolean>>
  setTree: Dispatch<SetStateAction<ApiNode[]>>
  setWorkspaceVariables: Dispatch<SetStateAction<WorkspaceVariables>>
  setActiveEnvironmentId: Dispatch<SetStateAction<string | null>>
  setExpandedFolders: Dispatch<SetStateAction<Set<string>>>
  setStagedSnapshot: Dispatch<SetStateAction<ApiNode[] | null>>
  setStagedVariables: Dispatch<SetStateAction<WorkspaceVariables | null>>
  stagedWorkspaceIdRef: MutableRefObject<string>
  setAuthError: Dispatch<SetStateAction<string>>
  setSyncStatus: Dispatch<SetStateAction<string>>
  restoreTabs: (workspaceId: string, nextTree: ApiNode[], variables: WorkspaceVariables) => void
}

// Loads the saved workspaces at startup and keeps them in step with other windows and with the cloud workspace list.
export function useWorkspaceStorageViewModel(input: StorageInput) {
  const {
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
    restoreTabs,
  } = input
  const restoreTabsEvent = useEffectEvent((workspaceId: string, nextTree: ApiNode[], variables: WorkspaceVariables) =>
    restoreTabs(workspaceId, nextTree, variables),
  )
  // Set once the cloud list has loaded. Before that, the local list cannot be checked against the server.
  const cloudListReadyRef = useRef(false)

  // Opens a stored workspace the same way startup does.
  const activateStoredWorkspace = useEffectEvent((workspace: LocalWorkspace) => {
    const nextVariables = workspace.variables ?? emptyWorkspaceVariables()
    const environmentId = workspace.activeEnvironmentId ?? null
    const nextTree = workspace.tree
    stagedWorkspaceIdRef.current = workspace.id
    setStagedSnapshot(readStagedSnapshot(workspace.id))
    setStagedVariables(readStagedVariables(workspace.id))
    setCurrentWorkspaceId(workspace.id)
    setTree(nextTree)
    setWorkspaceVariables(nextVariables)
    setActiveEnvironmentId(environmentId && nextVariables.environments.some((item) => item.id === environmentId) ? environmentId : null)
    restoreTabsEvent(workspace.id, nextTree, nextVariables)
    setExpandedFolders(new Set(nextTree.filter(isFolder).map((folder) => folder.id)))
  })

  // Brings the local list in line with the server's cloud list. If the open workspace is dropped, another one is opened.
  const applyCloudSnapshot = useEffectEvent((cloudRecords: LocalWorkspace[]) => {
    const next = applyCloudList(localWorkspaces, cloudRecords, currentWorkspaceId)
    setLocalWorkspaces(next.workspaces)
    if (next.currentId === currentWorkspaceId) return
    const fallback = next.workspaces.find((item) => item.id === next.currentId)
    if (fallback) activateStoredWorkspace(fallback)
  })
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
  }, [
    setAuthError,
    setSecureStorageAvailable,
    setLocalWorkspaces,
    setCurrentWorkspaceId,
    setStagedSnapshot,
    setStagedVariables,
    stagedWorkspaceIdRef,
    setTree,
    setWorkspaceVariables,
    setActiveEnvironmentId,
    setExpandedFolders,
    setStorageLoaded,
  ])

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
    [currentWorkspaceId, setLocalWorkspaces, setTree, setWorkspaceVariables, setActiveEnvironmentId, setSyncStatus],
  )

  const findLocalWorkspaceByCloudId = useEffectEvent((cloudId: string) => localWorkspaces.find((item) => item.cloudId === cloudId))
  useEffect(() => {
    if (!sessionToken || !user || !storageLoaded) return
    let active = true
    void cloudWorkspaceService
      .list(sessionToken)
      .then(async (workspaces) => {
        const records: LocalWorkspace[] = []
        for (const cloud of workspaces) {
          if (!active) return
          const existing = findLocalWorkspaceByCloudId(cloud.id)
          if (existing) {
            records.push({ ...existing, name: cloud.name, role: cloud.role })
          } else {
            const result = await syncService.pull({ token: sessionToken, cloudId: cloud.id })
            const remoteTree = normalizeSharedTree(result.tree)
            const remoteVariables = normalizeSharedVariables(result.variables)
            records.push({
              id: crypto.randomUUID(),
              cloudId: cloud.id,
              name: cloud.name,
              tree: remoteTree,
              baseTree: remoteTree,
              variables: remoteVariables,
              baseVariables: remoteVariables,
              activeEnvironmentId: remoteVariables.environments[0]?.id ?? null,
              baseCommitId: result.headCommitId,
              localHeadId: result.headCommitId,
              role: cloud.role,
            })
          }
        }
        if (!active) return
        cloudListReadyRef.current = true
        setCloudWorkspaces(workspaces)
        await Promise.all(records.map((record) => workspaceStorageService.saveWorkspace(record)))
        if (active) applyCloudSnapshot(records)
      })
      .catch((error) => {
        if (active) setSyncStatus(error instanceof Error ? error.message : 'Could not load cloud workspaces.')
      })
    return () => {
      active = false
    }
  }, [sessionToken, user, storageLoaded, setCloudWorkspaces, setSyncStatus])

  // The cloud list is refreshed while the app runs. A workspace the server stops listing (deleted or access removed) is dropped here too.
  const dropUnlistedCloudWorkspaces = useEffectEvent((listedIds: string[]) => {
    const listed = new Set(listedIds)
    if (!localWorkspaces.some((item) => item.cloudId && !listed.has(item.cloudId))) return
    applyCloudSnapshot(localWorkspaces.filter((item) => item.cloudId && listed.has(item.cloudId)))
  })
  useEffect(() => {
    if (cloudListReadyRef.current) dropUnlistedCloudWorkspaces(cloudWorkspaces.map((item) => item.id))
  }, [cloudWorkspaces])
}
