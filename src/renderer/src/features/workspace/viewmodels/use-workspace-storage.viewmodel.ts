import { type Dispatch, type MutableRefObject, type SetStateAction, useEffect, useEffectEvent, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { isFolder, normalizeSharedTree, normalizeSharedVariables, normalizeTree } from '@/features/collection'
import { type CloudWorkspace, cloudWorkspaceService, syncService } from '@/features/sync'
import { WORKSPACE_TEXT } from '@/features/workspace/constants/workspace-text.constants'
import { removedFromCloud, visibleToAccount, workspacesForAccount } from '@/features/workspace/lib/account-workspaces'
import { applyCloudList } from '@/features/workspace/lib/cloud-workspace-sync'
import { readStagedSnapshot, readStagedVariables, readTree } from '@/features/workspace/lib/storage'
import { hasUnpushedChanges } from '@/features/workspace/lib/unpushed-changes'
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
  // A copy the cloud no longer lists was kept because it still has local changes.
  keptLocal: boolean
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

// A first local copy of a cloud workspace, built from the server's current head. Only used for a workspace the device has never had.
async function pullCopy(token: string, cloud: CloudWorkspace, accountId: string): Promise<LocalWorkspace> {
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

  // Sign-in: this account gets its own workspaces. Device copies are claimed, and copies the server no longer lists are dropped.
  // Nothing is pulled from the server here. Pulling the head into a local copy, and merging, is always a manual step.
  // If the server cannot be reached, the account keeps its copies and only its local vault is claimed.
  const syncAccountWorkspaces = useEffectEvent(async (token: string, accountId: string): Promise<AccountSnapshot> => {
    const stored = (await workspaceStorageService.listWorkspaces()).map(normalizeStoredWorkspace)
    const listed = await cloudWorkspaceService.list(token).catch(() => null)
    const entries = listed
      ? listed.map((cloud) => ({ id: cloud.id, role: cloud.role, headCommitId: cloud.headCommitId }))
      : stored
          .filter((item) => item.accountId === accountId && item.cloudId)
          .map((item) => ({ id: item.cloudId ?? '', role: item.role ?? 'viewer', headCommitId: item.baseCommitId }))
    const plan = workspacesForAccount(stored, accountId, entries, () => newLocalVault(t(WORKSPACE_TEXT.sidebar.defaultVaultName)))

    // Only the name and role come from the server here. The tree stays as it is until the user pulls.
    const workspaces = plan.workspaces.map((item) => {
      const cloud = listed?.find((entry) => entry.id === item.cloudId)
      return cloud ? { ...item, name: cloud.name, role: cloud.role } : item
    })
    const changed = new Map(plan.changed.map((item) => [item.id, item]))
    // A cloud workspace this account has never had on this device is cloned once, so it can be opened. Changes after that are pulled by hand.
    for (const cloud of listed ?? []) {
      if (workspaces.some((item) => item.cloudId === cloud.id)) continue
      try {
        const copy = await pullCopy(token, cloud, accountId)
        workspaces.push(copy)
        changed.set(copy.id, copy)
      } catch {
        // Not reachable right now. The workspace is cloned on the next sign-in.
      }
    }
    // A copy the cloud no longer lists is removed from this device, unless it still has local changes. Removing it is not a silent loss, because the cloud no longer has it.
    const gone = listed
      ? removedFromCloud(
          workspaces,
          accountId,
          listed.map((cloud) => cloud.id),
          (copy) => hasUnpushedChanges(copy),
        )
      : { remove: [], kept: [] }
    const removedIds = new Set<string>()
    for (const copy of gone.remove) {
      changed.delete(copy.id)
      try {
        if (await workspaceStorageService.removeWorkspace(copy.id)) removedIds.add(copy.id)
      } catch {
        // Stays on this device for now. The next sign-in tries again.
      }
    }
    const visible = visibleToAccount(
      workspaces.filter((item) => !removedIds.has(item.id)),
      accountId,
    )
    for (const item of visible) if (changed.has(item.id) || item.cloudId) changed.set(item.id, item)
    await Promise.all([...changed.values()].map((item) => workspaceStorageService.saveWorkspace(item)))
    return { workspaces: visible, listed, keptLocal: gone.kept.length > 0 }
  })

  const applyAccountSnapshot = useEffectEvent((result: AccountSnapshot) => {
    if (result.listed) {
      cloudListReadyRef.current = true
      setCloudWorkspaces(result.listed)
    }
    setLocalWorkspaces(result.workspaces)
    if (result.keptLocal) setSyncStatus(t(WORKSPACE_TEXT.storage.removedKept))
    const current = result.workspaces.find((item) => item.id === currentWorkspaceId)
    if (current) return
    const fallback = result.workspaces.find((item) => !item.cloudId) ?? result.workspaces[0]
    if (fallback) activateStoredWorkspace(fallback)
  })

  // While signed in, another account's cloud copy saved on this device is not shown. Local workspaces belong to the device, so they are.
  const visibleRecords = useEffectEvent((records: LocalWorkspace[]) => visibleToAccount(records, user?.id ?? null))
  const storageMessage = useEffectEvent((key: keyof typeof WORKSPACE_TEXT.storage) => t(WORKSPACE_TEXT.storage[key]))

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
        const records = visibleRecords(storedRecords.map(normalizeStoredWorkspace))
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
      .catch((error) => setAuthError(error instanceof Error ? error.message : storageMessage('loadFailed')))
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
          .catch((error) => setSyncStatus(error instanceof Error ? error.message : storageMessage('refreshFailed')))
      }),
    [currentWorkspaceId, setLocalWorkspaces, setTree, setWorkspaceVariables, setActiveEnvironmentId, setSyncStatus],
  )

  // A save was refused because the workspace changed outside the app. The reloaded version is already shown, so say what happened.
  useEffect(
    () =>
      workspaceStorageService.onConflict(() => {
        setSyncStatus(t(WORKSPACE_TEXT.storage.conflict))
      }),
    [setSyncStatus, t],
  )

  // The MCP server tags workspaces it creates with the signed-in account, so the account id is written where it can read it.
  useEffect(() => {
    if (!storageLoaded) return
    workspaceStorageService.setActiveAccount(user?.id ?? null).catch((error) => {
      setSyncStatus(error instanceof Error ? error.message : storageMessage('accountFailed'))
    })
  }, [storageLoaded, user?.id, setSyncStatus])

  useEffect(() => {
    if (!sessionToken || !user || !storageLoaded) return
    let active = true
    void syncAccountWorkspaces(sessionToken, user.id)
      .then((result) => {
        if (active) applyAccountSnapshot(result)
      })
      .catch((error) => {
        if (active) setSyncStatus(error instanceof Error ? error.message : storageMessage('cloudListFailed'))
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

  // Runs the sign-in sync again. The cloud says a workspace was created, renamed, or changed role, and the copies on this device follow.
  const refreshAccount = useEffectEvent(async () => {
    if (!sessionToken || !user) return
    try {
      applyAccountSnapshot(await syncAccountWorkspaces(sessionToken, user.id))
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : storageMessage('cloudListFailed'))
    }
  })

  return { refreshAccount }
}
