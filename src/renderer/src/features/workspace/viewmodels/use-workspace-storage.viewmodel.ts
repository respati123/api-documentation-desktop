import { type Dispatch, type MutableRefObject, type SetStateAction, useEffect, useEffectEvent, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { isFolder, normalizeSharedTree, normalizeSharedVariables, normalizeTree } from '@/features/collection'
import { type CloudWorkspace, cloudWorkspaceService, syncService } from '@/features/sync'
import { WORKSPACE_TEXT } from '@/features/workspace/constants/workspace-text.constants'
import { needsPull, workspacesForAccount } from '@/features/workspace/lib/account-workspaces'
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

type AccountSnapshot = {
  workspaces: LocalWorkspace[]
  listed: CloudWorkspace[] | null
  refreshedIds: string[]
}

// Stored records are migrated on read, so every node and variable the app uses has the current shape.
function normalizeStoredWorkspace(item: LocalWorkspace): LocalWorkspace {
  return {
    ...item,
    tree: normalizeTree(item.tree),
    baseTree: normalizeTree(item.baseTree),
    variables: normalizeWorkspaceVariables(item.variables),
    baseVariables: normalizeSharedVariables(item.baseVariables ?? item.variables),
    activeEnvironmentId: item.activeEnvironmentId ?? null,
  }
}

function newLocalVault(name: string): LocalWorkspace {
  return {
    id: crypto.randomUUID(),
    cloudId: null,
    name,
    tree: [],
    baseTree: [],
    variables: emptyWorkspaceVariables(),
    baseVariables: emptyWorkspaceVariables(),
    activeEnvironmentId: null,
    baseCommitId: null,
    localHeadId: null,
    role: null,
    accountId: null,
  }
}

// A new local copy of a cloud workspace, built from the server's current head.
async function pullCopy(token: string, cloud: CloudWorkspace, accountId: string | null): Promise<LocalWorkspace> {
  const result = await syncService.pull({ token, cloudId: cloud.id })
  const tree = normalizeSharedTree(result.tree)
  const variables = normalizeSharedVariables(result.variables)
  return {
    id: crypto.randomUUID(),
    cloudId: cloud.id,
    name: cloud.name,
    tree,
    baseTree: tree,
    variables,
    baseVariables: variables,
    activeEnvironmentId: variables.environments[0]?.id ?? null,
    baseCommitId: result.headCommitId,
    localHeadId: result.headCommitId,
    role: cloud.role,
    accountId,
  }
}

// Replaces an existing copy's tree with the server's head. The copy keeps its id, its account, and its active environment when that still exists.
async function refreshCopy(token: string, copy: LocalWorkspace, cloud: CloudWorkspace): Promise<LocalWorkspace> {
  const fresh = await pullCopy(token, cloud, copy.accountId ?? null)
  const keptEnvironment = copy.activeEnvironmentId && fresh.variables?.environments.some((item) => item.id === copy.activeEnvironmentId)
  return {
    ...copy,
    name: cloud.name,
    role: cloud.role,
    tree: fresh.tree,
    baseTree: fresh.tree,
    variables: fresh.variables,
    baseVariables: fresh.variables,
    activeEnvironmentId: keptEnvironment ? copy.activeEnvironmentId : fresh.activeEnvironmentId,
    baseCommitId: fresh.baseCommitId,
    localHeadId: fresh.localHeadId,
  }
}

// Loads the saved workspaces at startup and keeps them in step with other windows, with the signed-in account, and with the cloud workspace list.
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
  const { t } = useTranslation('workspace')
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

  // Sign-in: this account gets its own workspaces. Device copies are claimed, cloud copies are pulled when behind, and copies the server no longer lists are dropped.
  // If the server cannot be reached, the account keeps its copies and only its local vault is claimed.
  const syncAccountWorkspaces = useEffectEvent(async (token: string, accountId: string): Promise<AccountSnapshot> => {
    const stored = (await workspaceStorageService.listWorkspaces()).map(normalizeStoredWorkspace)
    const listed = await cloudWorkspaceService.list(token).catch(() => null)
    const entries = listed
      ? listed.map((cloud) => ({ id: cloud.id, role: cloud.role, headCommitId: cloud.headCommitId }))
      : stored
          .filter((item) => item.accountId === accountId && item.cloudId)
          .map((item) => ({ id: item.cloudId ?? '', role: item.role ?? 'viewer', headCommitId: item.baseCommitId }))
    const plan = workspacesForAccount(stored, accountId, entries, () => ({
      ...newLocalVault(t(WORKSPACE_TEXT.sidebar.defaultVaultName)),
      accountId,
    }))

    const workspaces = [...plan.workspaces]
    const changed = new Map(plan.changed.map((item) => [item.id, item]))
    const refreshedIds: string[] = []
    if (listed) {
      for (const cloud of listed) {
        const index = workspaces.findIndex((item) => item.cloudId === cloud.id)
        try {
          if (index === -1) {
            const created = await pullCopy(token, cloud, accountId)
            workspaces.push(created)
            changed.set(created.id, created)
          } else if (needsPull(workspaces[index], cloud.headCommitId)) {
            const refreshed = await refreshCopy(token, workspaces[index], cloud)
            workspaces[index] = refreshed
            changed.set(refreshed.id, refreshed)
            refreshedIds.push(refreshed.id)
          } else {
            const renamed = { ...workspaces[index], name: cloud.name, role: cloud.role }
            workspaces[index] = renamed
            changed.set(renamed.id, renamed)
          }
        } catch {
          // A failed pull keeps the copy as it is. The next sign-in or event tries again.
        }
      }
    }

    const listedIds = new Set(listed?.map((cloud) => cloud.id))
    const visible = listed ? workspaces.filter((item) => !item.cloudId || listedIds.has(item.cloudId)) : workspaces
    await Promise.all([...changed.values()].map((item) => workspaceStorageService.saveWorkspace(item)))
    return { workspaces: visible, listed, refreshedIds }
  })

  const applyAccountSnapshot = useEffectEvent((result: AccountSnapshot) => {
    if (result.listed) {
      cloudListReadyRef.current = true
      setCloudWorkspaces(result.listed)
    }
    setLocalWorkspaces(result.workspaces)
    const current = result.workspaces.find((item) => item.id === currentWorkspaceId)
    if (!current) {
      const fallback = result.workspaces.find((item) => !item.cloudId) ?? result.workspaces[0]
      if (fallback) activateStoredWorkspace(fallback)
      return
    }
    if (result.refreshedIds.includes(current.id)) activateStoredWorkspace(current)
  })

  // While signed in, a workspace another account saved on this device is not shown.
  const visibleRecords = useEffectEvent((records: LocalWorkspace[]) =>
    user ? records.filter((item) => item.accountId === user.id) : records,
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
        const records = storedRecords.map(normalizeStoredWorkspace)
        const current = records.find((item) => item.id === defaultWorkspace.id) ?? normalizeStoredWorkspace(defaultWorkspace)
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
            const records = visibleRecords(storedRecords.map(normalizeStoredWorkspace))
            setLocalWorkspaces(records)
            const current = records.find((item) => item.id === currentWorkspaceId)
            if (!current) {
              const fallback = records.find((item) => !item.cloudId) ?? records[0]
              if (fallback) activateStoredWorkspace(fallback)
              return
            }
            setTree(current.tree)
            setWorkspaceVariables(current.variables ?? emptyWorkspaceVariables())
            setActiveEnvironmentId(current.activeEnvironmentId ?? null)
          })
          .catch((error) => setSyncStatus(error instanceof Error ? error.message : 'Could not refresh workspace changes.'))
      }),
    [currentWorkspaceId, setLocalWorkspaces, setTree, setWorkspaceVariables, setActiveEnvironmentId, setSyncStatus],
  )

  useEffect(() => {
    if (!sessionToken || !user || !storageLoaded) return
    let active = true
    void syncAccountWorkspaces(sessionToken, user.id)
      .then((result) => {
        if (active) applyAccountSnapshot(result)
      })
      .catch((error) => {
        if (active) setSyncStatus(error instanceof Error ? error.message : 'Could not load cloud workspaces.')
      })
    return () => {
      active = false
    }
  }, [sessionToken, user, storageLoaded, setSyncStatus])

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
