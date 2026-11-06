import { type Dispatch, type SetStateAction, useLayoutEffect, useRef } from 'react'
import { type indexTree, isFolder, isRequest, updateNode } from '@/features/collection'
import { replaceUrlParams, type ScriptContext, type SentResult, syncUrlParams } from '@/features/request'
import type { WorkspaceTab } from '@/features/workspace/models/workspace.model'
import type { VariableSuggestion } from '@/shared/components/variable-field'
import type { ApiNode, RequestNode } from '@/shared/models/api-node.model'

export type RequestInput = {
  selectedRequestId: string
  activeFolder: ApiNode | undefined
  treeIndex: ReturnType<typeof indexTree>
  setTree: Dispatch<SetStateAction<ApiNode[]>>
  currentWorkspaceId: string
  isReadOnly: boolean
  activeWorkspaceTab: WorkspaceTab | undefined
  variableSuggestions: VariableSuggestion[]
  resolvedVariables: Record<string, string>
  scriptContext: ScriptContext
  onSent: (result: SentResult) => void
  openVariableEditor: (name: string, sourceValue: string) => void
}

// The active request: its latest edits, the workbench it feeds, and the state those edits are read from.
export function useWorkspaceRequestViewModel(input: RequestInput) {
  const {
    selectedRequestId,
    activeFolder,
    treeIndex,
    setTree,
    currentWorkspaceId,
    isReadOnly,
    activeWorkspaceTab,
    variableSuggestions,
    resolvedVariables,
    scriptContext,
    onSent,
    openVariableEditor,
  } = input
  const activeRequest = treeIndex.nodeById.get(selectedRequestId)
  const activeRequestRef = useRef<RequestNode | undefined>(undefined)
  useLayoutEffect(() => {
    activeRequestRef.current = activeRequest && isRequest(activeRequest) ? activeRequest : undefined
  }, [activeRequest])
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

  // The active request as the user last edited it. Each editor reads this at send or copy time.
  const readLatestRequest = (fallback: RequestNode): RequestNode => {
    const latest = activeRequestRef.current?.id === selectedRequestId ? activeRequestRef.current : activeRequest
    return latest && isRequest(latest) ? latest : fallback
  }
  const builderRequest = activeWorkspaceTab?.kind === 'request' && activeRequest && isRequest(activeRequest) ? activeRequest : null
  const requestWorkbench = builderRequest
    ? {
        request: builderRequest,
        resetKey: `${currentWorkspaceId}:${builderRequest.id}`,
        readLatestRequest: () => readLatestRequest(builderRequest),
        readOnly: Boolean(isReadOnly),
        folderName: activeFolder && isFolder(activeFolder) ? activeFolder.name : '',
        suggestions: variableSuggestions,
        resolvedVariables,
        scriptContext,
        onChange: updateActiveRequest,
        onSent,
        onVariableClick: openVariableEditor,
      }
    : null

  return { activeRequest, updateActiveRequest, requestWorkbench }
}
