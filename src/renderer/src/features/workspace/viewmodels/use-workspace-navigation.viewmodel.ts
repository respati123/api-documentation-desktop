import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { findParentFolder, firstRequestId, type indexTree, isFolder, isRequest, normalizeTree } from '@/features/collection'
import { readStagedSnapshot, readStagedVariables } from '@/features/workspace/lib/storage'
import { readWorkspaceTabs, workspaceTabKey } from '@/features/workspace/lib/workspace-tabs'
import type { WorkspaceTab } from '@/features/workspace/models/workspace.model'
import { workspaceStorageService } from '@/features/workspace/services/workspace-storage.service'
import {
  normalizeWorkspaceVariables,
  shareableWorkspaceVariables,
  type WorkspaceEnvironment,
  type WorkspaceVariables,
} from '@/lib/workspace-variables'
import type { ApiNode } from '@/shared/models/api-node.model'

export type NavigationInput = {
  localWorkspaces: LocalWorkspace[]
  setLocalWorkspaces: Dispatch<SetStateAction<LocalWorkspace[]>>
  currentWorkspaceId: string
  setCurrentWorkspaceId: Dispatch<SetStateAction<string>>
  activeWorkspace: LocalWorkspace | undefined
  isReadOnly: boolean
  tree: ApiNode[]
  setTree: Dispatch<SetStateAction<ApiNode[]>>
  treeIndex: ReturnType<typeof indexTree>
  workspaceVariables: WorkspaceVariables
  setWorkspaceVariables: Dispatch<SetStateAction<WorkspaceVariables>>
  activeEnvironmentId: string | null
  setActiveEnvironmentId: Dispatch<SetStateAction<string | null>>
  workspaceTabs: WorkspaceTab[]
  setWorkspaceTabs: Dispatch<SetStateAction<WorkspaceTab[]>>
  activeWorkspaceTabKey: string
  setActiveWorkspaceTabKey: Dispatch<SetStateAction<string>>
  setSelectedRequestId: Dispatch<SetStateAction<string>>
  setSelectedFolderId: Dispatch<SetStateAction<string>>
  setExpandedFolders: Dispatch<SetStateAction<Set<string>>>
  activeRequest: ApiNode | undefined
  setStagedSnapshot: Dispatch<SetStateAction<ApiNode[] | null>>
  setStagedVariables: Dispatch<SetStateAction<WorkspaceVariables | null>>
  stagedWorkspaceIdRef: MutableRefObject<string>
  setQuickEditTarget: Dispatch<SetStateAction<{ name: string; sourceValue: string } | null>>
  takePendingSave: () => LocalWorkspace | null
}

// Switching workspaces, opening and closing tabs, and changing the active environment and its variables.
export function useWorkspaceNavigationViewModel(input: NavigationInput) {
  const {
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
  } = input
  function activateWorkspace(workspaceId: string) {
    const next = localWorkspaces.find((item) => item.id === workspaceId)
    if (!next) return
    const pending = takePendingSave()
    if (pending) void workspaceStorageService.saveWorkspace(pending)
    setLocalWorkspaces((current) =>
      current.map((item) =>
        item.id === currentWorkspaceId ? { ...item, tree: tree, variables: workspaceVariables, activeEnvironmentId } : item,
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
      tree: patch.tree ?? tree,
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

  return {
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
    restoreTabs,
    resetTabs,
    openVariableEditor,
    saveQuickVariable,
  }
}
