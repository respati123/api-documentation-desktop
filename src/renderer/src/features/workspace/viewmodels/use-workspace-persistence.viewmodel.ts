import { type Dispatch, type SetStateAction, useEffect, useEffectEvent, useRef } from 'react'
import type { WorkspaceTab } from '@/features/workspace/models/workspace.model'
import { workspaceStorageService } from '@/features/workspace/services/workspace-storage.service'
import { shareableWorkspaceVariables, type WorkspaceVariables } from '@/lib/workspace-variables'
import type { ApiNode } from '@/shared/models/api-node.model'

export type PersistenceInput = {
  tree: ApiNode[]
  workspaceVariables: WorkspaceVariables
  activeEnvironmentId: string | null
  localWorkspaces: LocalWorkspace[]
  currentWorkspaceId: string
  storageLoaded: boolean
  workspaceTabs: WorkspaceTab[]
  activeWorkspaceTabKey: string
  stagedSnapshot: ApiNode[] | null
  stagedVariables: WorkspaceVariables | null
  isStagedFor: (workspaceId: string) => boolean
  setLocalCommits: Dispatch<SetStateAction<LocalCommit[]>>
}

// Writes the workspace, its open tabs, and its staged changes to storage as they change. The workspace save waits briefly so typing does not write on every key.
export function useWorkspacePersistenceViewModel(input: PersistenceInput) {
  const {
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
    isStagedFor,
    setLocalCommits,
  } = input
  const stagedFor = useEffectEvent((workspaceId: string) => isStagedFor(workspaceId))
  const pendingWorkspaceSaveRef = useRef<LocalWorkspace | null>(null)
  const workspaceSaveTimerRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!storageLoaded || !currentWorkspaceId) return
    const current = localWorkspaces.find((item) => item.id === currentWorkspaceId)
    if (!current) return
    const pending = pendingWorkspaceSaveRef.current
    if (workspaceSaveTimerRef.current !== undefined) window.clearTimeout(workspaceSaveTimerRef.current)
    if (pending && pending.id !== currentWorkspaceId) void workspaceStorageService.saveWorkspace(pending)
    pendingWorkspaceSaveRef.current = { ...current, tree: tree as unknown[], variables: workspaceVariables, activeEnvironmentId }
    workspaceSaveTimerRef.current = window.setTimeout(() => {
      const latest = pendingWorkspaceSaveRef.current
      pendingWorkspaceSaveRef.current = null
      workspaceSaveTimerRef.current = undefined
      if (latest) void workspaceStorageService.saveWorkspace(latest)
    }, 350)
  }, [tree, workspaceVariables, activeEnvironmentId, localWorkspaces, currentWorkspaceId, storageLoaded])

  // Cancels the queued save and returns the workspace it held, so the caller can write it at once.
  function takePendingSave(): LocalWorkspace | null {
    if (workspaceSaveTimerRef.current !== undefined) window.clearTimeout(workspaceSaveTimerRef.current)
    const pending = pendingWorkspaceSaveRef.current
    pendingWorkspaceSaveRef.current = null
    workspaceSaveTimerRef.current = undefined
    return pending
  }

  useEffect(
    () => () => {
      if (workspaceSaveTimerRef.current !== undefined) window.clearTimeout(workspaceSaveTimerRef.current)
      if (pendingWorkspaceSaveRef.current) void workspaceStorageService.saveWorkspace(pendingWorkspaceSaveRef.current)
    },
    [],
  )

  useEffect(() => {
    if (!storageLoaded || !currentWorkspaceId) return
    localStorage.setItem(
      `api-docs-open-tabs-${currentWorkspaceId}`,
      JSON.stringify({ tabs: workspaceTabs, activeKey: activeWorkspaceTabKey }),
    )
  }, [workspaceTabs, activeWorkspaceTabKey, currentWorkspaceId, storageLoaded])

  useEffect(() => {
    if (!currentWorkspaceId) {
      setLocalCommits([])
      return
    }
    let active = true
    void workspaceStorageService
      .listCommits(currentWorkspaceId)
      .then((commits) => {
        if (active) setLocalCommits(commits as LocalCommit[])
      })
      .catch(() => {
        if (active) setLocalCommits([])
      })
    return () => {
      active = false
    }
  }, [currentWorkspaceId, setLocalCommits])

  useEffect(() => {
    if (!currentWorkspaceId || !stagedFor(currentWorkspaceId)) return
    const key = `api-docs-staged-${currentWorkspaceId}`
    if (stagedSnapshot) localStorage.setItem(key, JSON.stringify(stagedSnapshot))
    else localStorage.removeItem(key)
  }, [stagedSnapshot, currentWorkspaceId])

  useEffect(() => {
    if (!currentWorkspaceId || !stagedFor(currentWorkspaceId)) return
    const key = `api-docs-staged-variables-${currentWorkspaceId}`
    if (stagedVariables) localStorage.setItem(key, JSON.stringify(shareableWorkspaceVariables(stagedVariables)))
    else localStorage.removeItem(key)
  }, [stagedVariables, currentWorkspaceId])
  return { takePendingSave }
}
