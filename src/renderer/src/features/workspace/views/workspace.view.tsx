import { AiConnectDialog } from '@/features/ai-connect'
import {
  CollectionFolderIcon,
  collectionWidthLimit,
  findParentFolder,
  firstRequestId,
  isFolder,
  isRequest,
  minCollectionWidth,
  WorkspaceStorageIcon,
} from '@/features/collection'
import { ApiReferencePage, OpenApiDialog } from '@/features/docs'
import { AuthEditor, BodyEditor, HeaderEditor, ParamsEditor, ResponseEditor } from '@/features/request'
import { ResponseInspector } from '@/features/response'
import { AuthDialog, ChangeRow, changeStatusCode, changeStatusText, HistoryChangeRow } from '@/features/sync'
import { VariableQuickEditView, VariableRows, VariablesDialog } from '@/features/variables'
import { workspaceTabKey } from '@/features/workspace/lib/workspace-tabs'
import type { TreeNode, WorkspaceTab } from '@/features/workspace/models/workspace.model'
import type { useWorkspaceViewModel } from '@/features/workspace/viewmodels/use-workspace.viewmodel'
import { cn } from '@/lib/utils'
import { workspaceVariablesChangeId } from '@/lib/workspace-variables'
import { DebouncedInput, DebouncedTextarea } from '@/shared/components/debounced-field'
import { StateMessage } from '@/shared/components/state-message'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Textarea } from '@/shared/components/ui/textarea'
import { VariableUrlField } from '@/shared/components/variable-field'

export type WorkspaceViewProps = ReturnType<typeof useWorkspaceViewModel>

export function WorkspaceView({
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
  draggedId,
  setDraggedId,
  response,
  setResponse,
  responseView,
  setResponseView,
  sendMenuOpen,
  setSendMenuOpen,
  downloadAfterSend,
  setDownloadAfterSend,
  sendDelayDialogOpen,
  setSendDelayDialogOpen,
  sendDelaySeconds,
  setSendDelaySeconds,
  sendNotice,
  repeatDialogOpen,
  setRepeatDialogOpen,
  repeatIntervalSeconds,
  setRepeatIntervalSeconds,
  repeatRunning,
  clientCodeDialogOpen,
  setClientCodeDialogOpen,
  clientCode,
  clientCodeStatus,
  sendOptionsButtonRef,
  newFolderName,
  setNewFolderName,
  folderDialogOpen,
  setFolderDialogOpen,
  newFolderParentId,
  contextMenu,
  setContextMenu,
  deleteConfirmTarget,
  setDeleteConfirmTarget,
  renamingFolderId,
  folderNameDraft,
  setFolderNameDraft,
  cancelRenameOnBlur,
  sessionToken,
  user,
  authOpenRequest,
  authError,
  createWorkspaceOpen,
  setCreateWorkspaceOpen,
  cloudWorkspaceName,
  setCloudWorkspaceName,
  teamDialogOpen,
  setTeamDialogOpen,
  inviteRole,
  setInviteRole,
  inviteEmailDraft,
  setInviteEmailDraft,
  inviteLink,
  inviteTokenDraft,
  setInviteTokenDraft,
  inviteError,
  setInviteError,
  inviteNotice,
  setInviteNotice,
  commitDialogOpen,
  setCommitDialogOpen,
  commitDialogView,
  setCommitDialogView,
  syncMenuOpen,
  setSyncMenuOpen,
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
  setHistoryDetailError,
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
  requestTabIndicators,
  activeWorkspace,
  isReadOnly,
  workspaceChanges,
  pendingPushCount,
  cloudHeadCommitId,
  cloudUpdateAvailable,
  pushDisabledReason,
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
  executeRequest,
  beginBrowserSignIn,
  clearAuthError,
  accountMenuOpen,
  setAccountMenuOpen,
  accountMenuRef,
  aiConnectOpen,
  setAiConnectOpen,
  updateStatus,
  setUpdateStatus,
  signOut,
  activateWorkspace,
  createCloudWorkspace,
  createInvite,
  acceptInvite,
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
  createFolder,
  openCreateFolder,
  openContextMenu,
  openDropdownMenu,
  openContextMenuFromKeyboard,
  createRequestFromMenu,
  renameFolderFromMenu,
  openDeleteConfirmFromMenu,
  confirmDeleteCollectionItem,
  commitFolderRename,
  cancelFolderRename,
  toggleFolder,
  handleDrop,
  sendRequest,
  openClientCode,
  copyClientCode,
  scheduleRequest,
  cancelScheduledRequest,
  stopRepeating,
  startRepeating,
}: WorkspaceViewProps) {
  function renderTree(nodes: TreeNode[], depth = 0): React.ReactNode {
    return nodes.map((node) =>
      isFolder(node) ? (
        <div key={node.id} className="tree-node" style={{ '--tree-depth': depth } as React.CSSProperties}>
          <div className="tree-folder-line">
            {renamingFolderId === node.id ? (
              <div className="tree-row folder-row folder-row-editing">
                <span className="tree-disclosure" aria-hidden="true">
                  {expandedFolders.has(node.id) ? '⌄' : '›'}
                </span>
                <CollectionFolderIcon open={expandedFolders.has(node.id)} />
                <Input
                  autoFocus
                  aria-label="Folder name"
                  className="folder-name-editor"
                  maxLength={100}
                  value={folderNameDraft}
                  onChange={(event) => setFolderNameDraft(event.target.value)}
                  onBlur={() => {
                    if (cancelRenameOnBlur.current) {
                      cancelRenameOnBlur.current = false
                      return
                    }
                    commitFolderRename(node.id)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      commitFolderRename(node.id)
                    }
                    if (event.key === 'Escape') {
                      event.preventDefault()
                      cancelFolderRename()
                    }
                  }}
                />
                <span className="tree-count">{treeIndex.requestCountByFolderId.get(node.id) ?? 0}</span>
              </div>
            ) : (
              <button
                className={cn(
                  'tree-row',
                  'folder-row',
                  selectedFolderId === node.id && 'tree-row-selected',
                  draggedId === node.id && 'tree-row-dragging',
                )}
                aria-expanded={expandedFolders.has(node.id)}
                aria-haspopup="menu"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/plain', node.id)
                  event.dataTransfer.effectAllowed = 'move'
                  setDraggedId(node.id)
                }}
                onDragEnd={() => setDraggedId(null)}
                onDragOver={(event) => {
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                }}
                onDrop={(event) => handleDrop(event, node.id)}
                onClick={() => toggleFolder(node.id)}
                onContextMenu={(event) => openContextMenu(event, node.id, node.id)}
                onKeyDown={(event) => openContextMenuFromKeyboard(event, node.id, node.id)}
              >
                <span className="tree-disclosure" aria-hidden="true">
                  {expandedFolders.has(node.id) ? '⌄' : '›'}
                </span>
                <CollectionFolderIcon open={expandedFolders.has(node.id)} />
                <span className="tree-label">{node.name}</span>
                <span className="tree-count">{treeIndex.requestCountByFolderId.get(node.id) ?? 0}</span>
              </button>
            )}
            <button
              className="tree-menu-trigger"
              aria-label={`Actions for ${node.name}`}
              aria-haspopup="menu"
              disabled={isReadOnly}
              onClick={(event) => openDropdownMenu(event, node.id, node.id)}
            >
              ⌄
            </button>
            {changeById.has(node.id) && (
              <span
                className={`change-badge change-${changeById.get(node.id)?.status}`}
                aria-label={`${changeStatusText(changeById.get(node.id)?.status)}: ${node.name}`}
              >
                {changeStatusCode(changeById.get(node.id)?.status)}
              </span>
            )}
          </div>
          {expandedFolders.has(node.id) && (
            <div className="tree-children">
              {node.children.length ? (
                renderTree(node.children, depth + 1)
              ) : (
                <div className="tree-empty" style={{ '--tree-depth': depth + 1 } as React.CSSProperties}>
                  Empty folder
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div key={node.id} className="tree-request-line" style={{ '--tree-depth': depth } as React.CSSProperties}>
          <button
            className={cn(
              'tree-row',
              'request-row',
              (activeWorkspaceTab?.kind === 'request' || activeWorkspaceTab?.kind === 'docs') &&
                selectedRequestId === node.id &&
                'tree-row-selected',
              draggedId === node.id && 'tree-row-dragging',
            )}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', node.id)
              event.dataTransfer.effectAllowed = 'move'
              setDraggedId(node.id)
            }}
            onDragEnd={() => setDraggedId(null)}
            onDragOver={(event) => {
              event.preventDefault()
              event.dataTransfer.dropEffect = 'move'
            }}
            onDrop={(event) => handleDrop(event, node.id)}
            onClick={() => (activeWorkspaceTab?.kind === 'docs' ? openDocsTab(node.id) : openRequestTab(node.id))}
            onContextMenu={(event) => openContextMenu(event, treeIndex.parentFolderById.get(node.id) ?? '', node.id)}
            onKeyDown={(event) => openContextMenuFromKeyboard(event, treeIndex.parentFolderById.get(node.id) ?? '', node.id)}
          >
            <span className={`method method-${node.method.toLowerCase()}`}>{node.method}</span>
            <span className="tree-label request-copy">
              <strong title={node.name}>{node.name}</strong>
            </span>
            {changeById.has(node.id) && (
              <span
                className={`change-badge change-${changeById.get(node.id)?.status}`}
                aria-label={`${changeStatusText(changeById.get(node.id)?.status)}: ${node.name}`}
              >
                {changeStatusCode(changeById.get(node.id)?.status)}
              </span>
            )}
          </button>
          <button
            type="button"
            className="tree-menu-trigger request-menu-trigger"
            aria-label={`Actions for ${node.name}`}
            aria-haspopup="menu"
            disabled={isReadOnly}
            onClick={(event) => openDropdownMenu(event, treeIndex.parentFolderById.get(node.id) ?? '', node.id)}
          >
            ⌄
          </button>
        </div>
      ),
    )
  }

  return (
    <main ref={appShellRef} className="app-shell" style={{ '--sidebar-width': `${collectionWidth}px` } as React.CSSProperties}>
      <header className="topbar">
        <div className="wordmark">API Documentation</div>
        <div className="topbar-actions">
          {user && (
            <div className="account-menu-wrap" ref={accountMenuRef}>
              <button
                type="button"
                className="account-trigger"
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                onClick={() => setAccountMenuOpen((open) => !open)}
              >
                <span className="account-avatar-chip" aria-hidden="true">
                  {user.email.charAt(0).toUpperCase()}
                </span>
                <span className="signed-in-email">{user.email}</span>
              </button>
              {accountMenuOpen && (
                <div className="account-menu" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountMenuOpen(false)
                      setCreateWorkspaceOpen(true)
                    }}
                  >
                    New cloud workspace
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountMenuOpen(false)
                      setInviteError('')
                      setInviteNotice('')
                      setTeamDialogOpen(true)
                    }}
                  >
                    {activeWorkspace?.cloudId && activeWorkspace.role === 'owner' ? 'Team' : 'Join workspace'}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountMenuOpen(false)
                      void signOut()
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
          {updateStatus?.state === 'available' && (
            <Button size="sm" onClick={() => void window.apiDesktop.downloadUpdate(updateStatus.version)}>
              Update to v{updateStatus.version}
            </Button>
          )}
          <AuthDialog
            showTrigger={!user}
            onBeginSignIn={beginBrowserSignIn}
            openRequest={authOpenRequest}
            initialError={authError}
            onOpen={clearAuthError}
          />
        </div>
      </header>

      <AiConnectDialog open={aiConnectOpen} onOpenChange={setAiConnectOpen} />
      <Dialog
        open={Boolean(updateStatus && updateStatus.state !== 'available')}
        onOpenChange={(open) => {
          if (!open && updateStatus?.state === 'error') setUpdateStatus(null)
        }}
      >
        <DialogContent>
          {updateStatus?.state === 'error' ? (
            <>
              <DialogHeader>
                <DialogTitle>Update failed</DialogTitle>
                <DialogDescription>{updateStatus.message}</DialogDescription>
              </DialogHeader>
              <div className="dialog-form">
                <Button type="button" onClick={() => setUpdateStatus(null)}>
                  Close
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Updating to v{updateStatus?.version}</DialogTitle>
                <DialogDescription>
                  {updateStatus?.state === 'downloaded'
                    ? 'Download complete. Restarting to finish the update…'
                    : 'Downloading the update. The app will restart when it is ready.'}
                </DialogDescription>
              </DialogHeader>
              {updateStatus?.state === 'downloading' && (
                <div className="dialog-form">
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--graphite-line-soft)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${updateStatus.percent}%`,
                        height: '100%',
                        background: 'var(--graphite-blue)',
                        transition: 'width 200ms ease',
                      }}
                    />
                  </div>
                  <p>{updateStatus.percent}%</p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      <VariablesDialog
        open={variablesDialogOpen}
        onOpenChange={setVariablesDialogOpen}
        variables={workspaceVariables}
        activeEnvironmentId={activeEnvironmentId}
        readOnly={Boolean(isReadOnly)}
        secureStorageAvailable={secureStorageAvailable}
        onVariablesChange={updateWorkspaceVariables}
        onActiveEnvironmentChange={(id) => (id ? openEnvironmentTab(id) : updateActiveEnvironment(null))}
      />
      <VariableQuickEditView {...variableQuickEdit} />
      <OpenApiDialog
        open={openApiDialogOpen}
        onOpenChange={setOpenApiDialogOpen}
        tree={tree}
        workspaceName={activeWorkspace?.name ?? 'My workspace'}
        readOnly={Boolean(isReadOnly)}
        onImport={(imported) => {
          setTree((current) => [...current, ...imported])
          const importedRequestId = firstRequestId(imported)
          if (importedRequestId) {
            const tab: WorkspaceTab = { kind: 'request', id: importedRequestId }
            setWorkspaceTabs((current) => [...current.filter((item) => workspaceTabKey(item) !== workspaceTabKey(tab)), tab])
            setActiveWorkspaceTabKey(workspaceTabKey(tab))
            setSelectedRequestId(importedRequestId)
            setSelectedFolderId(findParentFolder(imported, importedRequestId))
            setResponse({ kind: 'empty' })
          }
          const folders = new Set<string>()
          const collectFolders = (nodes: TreeNode[]) =>
            nodes.forEach((node) => {
              if (node.kind === 'folder') {
                folders.add(node.id)
                collectFolders(node.children)
              }
            })
          collectFolders(imported)
          setExpandedFolders((current) => new Set([...current, ...folders]))
        }}
      />

      <aside className="sidebar" aria-label="Workspace">
        <div className="sidebar-heading">
          <div>
            <p className="sidebar-kicker">Workspace</p>
            <h1>Collections</h1>
          </div>
          <Button type="button" variant="outline" size="sm" className="openapi-trigger" onClick={() => setOpenApiDialogOpen(true)}>
            OpenAPI
          </Button>
          <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create folder</DialogTitle>
                <DialogDescription>
                  Create a folder inside{' '}
                  {newFolderParentId ? (treeIndex.nodeById.get(newFolderParentId)?.name ?? 'the selected folder') : 'Workspace'}.
                </DialogDescription>
              </DialogHeader>
              <form className="dialog-form" onSubmit={createFolder}>
                <label htmlFor="folder-name">Folder name</label>
                <Input
                  id="folder-name"
                  autoFocus
                  value={newFolderName}
                  onChange={(event) => setNewFolderName(event.target.value)}
                  placeholder="e.g. Payments API"
                />
                <Button type="submit" disabled={!newFolderName.trim()}>
                  Create folder
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <nav
          className="tree-list"
          aria-label="Workspace folders and requests"
          onDragOver={(event) => {
            event.preventDefault()
            event.dataTransfer.dropEffect = 'move'
          }}
          onDrop={(event) => handleDrop(event, null)}
        >
          <div className="workspace-root-line">
            <Select value={currentWorkspaceId} onValueChange={activateWorkspace}>
              <SelectTrigger
                aria-label="Select workspace"
                className="workspace-root-select"
                onContextMenu={(event) => openContextMenu(event, '')}
                onKeyDown={(event) => openContextMenuFromKeyboard(event, '')}
                onDragOver={(event) => {
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                }}
                onDrop={(event) => handleDrop(event, null)}
              >
                <SelectValue className="workspace-root-name" placeholder="Choose workspace">
                  {activeWorkspace && (
                    <span className="workspace-selected-value">
                      <WorkspaceStorageIcon kind={activeWorkspace.cloudId ? 'cloud' : 'local'} />
                      <span className="workspace-selected-name">{activeWorkspace.name}</span>
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="workspace-select-content">
                {localWorkspaces.map((workspace) => {
                  const isCloudWorkspace = Boolean(workspace.cloudId)
                  const storageLabel = isCloudWorkspace ? `Cloud${workspace.role ? ` · ${workspace.role}` : ''}` : 'Local vault'
                  return (
                    <SelectItem key={workspace.id} value={workspace.id} textValue={`${workspace.name} ${storageLabel}`}>
                      <span className="workspace-option">
                        <WorkspaceStorageIcon kind={isCloudWorkspace ? 'cloud' : 'local'} className="workspace-option-icon" />
                        <span className="workspace-option-name">{workspace.name}</span>
                        <small className="workspace-option-meta">{storageLabel}</small>
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <button
              className="tree-menu-trigger workspace-menu-trigger"
              aria-label="Workspace actions"
              aria-haspopup="menu"
              disabled={isReadOnly}
              onClick={(event) => openDropdownMenu(event, '')}
            >
              ⌄
            </button>
          </div>
          {tree.length ? renderTree(tree) : <p className="collection-empty">Workspace is empty. Add a folder or request to get started.</p>}
        </nav>
        <div className="sidebar-footer">
          {syncMenuOpen && (
            <>
              <button
                type="button"
                className="sidebar-sync-dismiss"
                aria-label="Close sync menu"
                onMouseDown={() => setSyncMenuOpen(false)}
              />
              <div
                id="sidebar-sync-menu"
                className="sidebar-sync-menu"
                role="menu"
                aria-label="Workspace sync actions"
                onKeyDown={(event) => {
                  const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)'))
                  const activeIndex = items.indexOf(document.activeElement as HTMLButtonElement)
                  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault()
                    const direction = event.key === 'ArrowDown' ? 1 : -1
                    items[(activeIndex + direction + items.length) % items.length]?.focus()
                  } else if (event.key === 'Escape') setSyncMenuOpen(false)
                }}
              >
                <div className="sidebar-sync-menu-heading">
                  <WorkspaceStorageIcon kind={activeWorkspace?.cloudId ? 'cloud' : 'local'} className="sidebar-sync-menu-icon" />
                  <div>
                    <strong>{activeWorkspace?.name ?? 'Workspace'}</strong>
                    <small>
                      {activeWorkspace?.cloudId ? (cloudUpdateAvailable ? 'Cloud updates available' : 'Cloud workspace') : 'Local vault'}
                    </small>
                  </div>
                </div>
                <div className="sidebar-sync-menu-divider" />
                <button
                  type="button"
                  role="menuitem"
                  autoFocus
                  onClick={() => {
                    setSyncMenuOpen(false)
                    setCommitDialogView('history')
                    setSelectedHistoryCommitId('')
                    setSelectedHistoryChangeId('')
                    setCommitDialogOpen(true)
                  }}
                >
                  <span aria-hidden="true">◷</span>History{historyCommits.length > 0 && <small>{historyCommits.length}</small>}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={!workspaceChanges.length}
                  onClick={() => {
                    setSyncMenuOpen(false)
                    setDiscardConfirmOpen(true)
                  }}
                >
                  <span aria-hidden="true">↶</span>Discard local changes
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={isReadOnly || !workspaceChanges.length}
                  onClick={() => {
                    setSyncMenuOpen(false)
                    setCommitDialogView('changes')
                    setCommitMessage('')
                    setSelectedChangeId('')
                    setCommitDialogOpen(true)
                  }}
                >
                  <span aria-hidden="true">⬡</span>Commit{workspaceChanges.length > 0 && <small>{workspaceChanges.length}</small>}
                </button>
                <div className="sidebar-sync-menu-divider" />
                <button
                  type="button"
                  role="menuitem"
                  disabled={!sessionToken || !activeWorkspace?.cloudId}
                  onClick={() => {
                    setSyncMenuOpen(false)
                    void pullWorkspace()
                  }}
                >
                  <span aria-hidden="true">↓</span>Pull{cloudUpdateAvailable && <small>Updates available</small>}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={!sessionToken || isReadOnly || !pendingPushCount}
                  onClick={() => {
                    setSyncMenuOpen(false)
                    void pushWorkspace()
                  }}
                >
                  <span aria-hidden="true">↑</span>Push
                  {pendingPushCount > 0 && (
                    <small>
                      {pendingPushCount} {pendingPushCount === 1 ? 'commit' : 'commits'}
                    </small>
                  )}
                </button>
                {pushDisabledReason && (
                  <p className="sidebar-sync-hint" role="status">
                    {pushDisabledReason}
                  </p>
                )}
              </div>
            </>
          )}
          <button
            type="button"
            className="sidebar-sync-trigger"
            aria-haspopup="menu"
            aria-expanded={syncMenuOpen}
            aria-controls="sidebar-sync-menu"
            disabled={!activeWorkspace}
            onClick={() => setSyncMenuOpen((open) => !open)}
          >
            <WorkspaceStorageIcon kind={activeWorkspace?.cloudId ? 'cloud' : 'local'} className="sidebar-sync-trigger-icon" />
            <span className="sidebar-sync-trigger-label">Changes</span>
            {workspaceChanges.length > 0 && <span className="sidebar-sync-trigger-count">{workspaceChanges.length}</span>}
            <span
              className="sidebar-sync-trigger-meta"
              aria-label={`${activeWorkspace?.cloudId ? `${pendingPushCount} commits to push` : 'Saved locally'}${cloudUpdateAvailable ? ', cloud update available' : ''}`}
            >
              {cloudUpdateAvailable && <span title="Cloud updates available">↓</span>}
              {pendingPushCount > 0 && activeWorkspace?.cloudId && (
                <span title={`${pendingPushCount} commits to push`}>↑{pendingPushCount}</span>
              )}
              {!cloudUpdateAvailable && (!pendingPushCount || !activeWorkspace?.cloudId) && (
                <span title={activeWorkspace?.cloudId ? 'Up to date' : 'Saved locally'}>•</span>
              )}
            </span>
            <span className="sidebar-sync-trigger-chevron" aria-hidden="true">
              ⌃
            </span>
          </button>
          <div className="sidebar-footer-status" role="status" aria-live="polite">
            {workspaceChanges.length > 0 && (
              <span>
                {workspaceChanges.length} local {workspaceChanges.length === 1 ? 'change' : 'changes'}
              </span>
            )}
            {pendingPushCount > 0 && activeWorkspace?.cloudId && (
              <span>
                {pendingPushCount} {pendingPushCount === 1 ? 'commit' : 'commits'} to push
              </span>
            )}
            {pendingPushCount > 0 && !activeWorkspace?.cloudId && (
              <span>
                {pendingPushCount} local {pendingPushCount === 1 ? 'commit' : 'commits'}
              </span>
            )}
            {cloudUpdateAvailable && <span className="sidebar-cloud-status">Cloud updates available</span>}
            {!workspaceChanges.length && !pendingPushCount && !cloudUpdateAvailable && !activeWorkspace?.cloudId && (
              <span>Saved locally</span>
            )}
            {!workspaceChanges.length && !pendingPushCount && !cloudUpdateAvailable && activeWorkspace?.cloudId && cloudHeadCommitId && (
              <span>Cloud workspace up to date</span>
            )}
            {!cloudHeadCommitId && activeWorkspace?.cloudId && <span>Checking cloud status…</span>}
          </div>
        </div>
      </aside>

      <div
        className="sidebar-resizer"
        role="separator"
        aria-label="Resize collections panel"
        aria-orientation="vertical"
        aria-valuemin={minCollectionWidth}
        aria-valuemax={Math.round(collectionWidthLimit())}
        aria-valuenow={Math.round(Math.min(collectionWidth, collectionWidthLimit()))}
        aria-valuetext={`${Math.round(Math.min(collectionWidth, collectionWidthLimit()))} pixels`}
        tabIndex={0}
        onPointerDown={startCollectionResize}
        onPointerMove={moveCollectionResize}
        onPointerUp={finishCollectionResize}
        onPointerCancel={finishCollectionResize}
        onLostPointerCapture={finishCollectionResize}
        onKeyDown={handleCollectionResizeKeyDown}
      />

      <section className="workspace" aria-label="Request workspace">
        <div className="workspace-tabs-row">
          <div className="workspace-tabbar" role="tablist" aria-label="Open workspace tabs">
            {workspaceTabs.map((tab) => {
              const request = tab.kind === 'request' || tab.kind === 'docs' ? treeIndex.nodeById.get(tab.id) : undefined
              const environment =
                tab.kind === 'environment' ? workspaceVariables.environments.find((item) => item.id === tab.id) : undefined
              if (
                ((tab.kind === 'request' || tab.kind === 'docs') && (!request || !isRequest(request))) ||
                (tab.kind === 'environment' && !environment)
              )
                return null
              const title =
                tab.kind === 'docs'
                  ? `${request && isRequest(request) ? request.name : 'Request'} · Docs`
                  : request && isRequest(request)
                    ? request.name
                    : (environment?.name ?? 'Environment')
              const isActive = workspaceTabKey(tab) === activeWorkspaceTabKey
              return (
                <div className="workspace-tab-item" key={workspaceTabKey(tab)}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={cn('workspace-tab', isActive && 'workspace-tab-active')}
                    onClick={() => selectWorkspaceTab(tab)}
                  >
                    {tab.kind === 'docs' ? (
                      <span className="workspace-tab-docs" aria-hidden="true">
                        DOCS
                      </span>
                    ) : request && isRequest(request) ? (
                      <span className={`workspace-tab-method method-${request.method.toLowerCase()}`}>{request.method}</span>
                    ) : (
                      <span className="workspace-tab-environment" aria-hidden="true">
                        ◎
                      </span>
                    )}
                    <span className="workspace-tab-title">{title}</span>
                    {tab.kind !== 'environment' && request && isRequest(request) && changeById.has(request.id) && (
                      <span className="workspace-tab-change" aria-label="Has uncommitted changes" />
                    )}
                  </button>
                  <button
                    type="button"
                    className="workspace-tab-close"
                    aria-label={`Close ${title} tab`}
                    onClick={() => closeWorkspaceTab(tab)}
                  >
                    ×
                  </button>
                </div>
              )
            })}
            {!workspaceTabs.length && <span className="workspace-tab-empty">Open a request from the collection.</span>}
          </div>
          <div className="workspace-tab-actions">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="workspace-docs-button"
              disabled={!firstRequestId(tree)}
              onClick={openCurrentDocs}
            >
              Read docs
            </Button>
            <div className="active-environment-control">
              <span>Environment</span>
              <Select
                value={
                  workspaceVariables.environments.some((environment) => environment.id === activeEnvironmentId)
                    ? (activeEnvironmentId as string)
                    : 'none'
                }
                onValueChange={(id) => (id === 'none' ? updateActiveEnvironment(null) : openEnvironmentTab(id))}
                disabled={!workspaceVariables.environments.length}
              >
                <SelectTrigger aria-label="Active environment" className="active-environment-select">
                  <SelectValue placeholder="No environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No environment</SelectItem>
                  {workspaceVariables.environments.map((environment) => (
                    <SelectItem key={environment.id} value={environment.id}>
                      {environment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="workspace-variables-button"
              disabled={!activeWorkspace}
              onClick={() => setVariablesDialogOpen(true)}
            >
              Variables
            </Button>
          </div>
        </div>
        {activeWorkspaceTab?.kind === 'environment' ? (
          activeEnvironmentTab ? (
            <section className="request-card environment-tab-panel" aria-label={`${activeEnvironmentTab.name} environment`}>
              <div className="environment-tab-heading">
                <div>
                  <p className="section-kicker">Environment / Variables</p>
                  <Input
                    aria-label="Environment name"
                    maxLength={100}
                    value={activeEnvironmentTab.name}
                    readOnly={isReadOnly}
                    onChange={(event) => updateEnvironmentTab(activeEnvironmentTab.id, { name: event.target.value })}
                  />
                </div>
                <Button
                  type="button"
                  variant={activeEnvironmentId === activeEnvironmentTab.id ? 'default' : 'outline'}
                  size="sm"
                  disabled={isReadOnly || activeEnvironmentId === activeEnvironmentTab.id}
                  onClick={() => updateActiveEnvironment(activeEnvironmentTab.id)}
                >
                  {activeEnvironmentId === activeEnvironmentTab.id ? 'Active for requests' : 'Use for requests'}
                </Button>
              </div>
              <p className="variable-policy">
                Values here override matching Global variables when this environment is active. Secret values stay on this device and out of
                cloud sync.
              </p>
              {!secureStorageAvailable && (
                <p className="variable-storage-warning" role="status">
                  Secure storage is unavailable. Secret values will last only until the app closes.
                </p>
              )}
              <VariableRows
                rows={activeEnvironmentTab.variables}
                readOnly={Boolean(isReadOnly)}
                onChange={(rows) => updateEnvironmentTab(activeEnvironmentTab.id, { variables: rows })}
              />
            </section>
          ) : (
            <section className="request-card workspace-full-panel">
              <StateMessage title="Environment unavailable" description="It may have been removed from this workspace." />
            </section>
          )
        ) : activeWorkspaceTab?.kind === 'docs' ? (
          activeDocsRequest && isRequest(activeDocsRequest) ? (
            <ApiReferencePage
              request={activeDocsRequest}
              folderName={activeFolder && isFolder(activeFolder) ? activeFolder.name : 'Workspace'}
              onOpenRequest={() => openRequestTab(activeDocsRequest.id)}
              onOpenOpenApi={() => setOpenApiDialogOpen(true)}
            />
          ) : (
            <section className="request-card docs-page">
              <StateMessage
                title="Endpoint docs unavailable"
                description="Choose an endpoint in the collection to open its documentation."
              />
            </section>
          )
        ) : (
          <>
            <form className="request-card" onSubmit={sendRequest}>
              {activeWorkspaceTab?.kind === 'request' && activeRequest && isRequest(activeRequest) ? (
                <>
                  <div className="request-card-heading">
                    <div>
                      <p className="section-kicker">
                        {activeFolder && isFolder(activeFolder) ? activeFolder.name : 'Workspace'} / Request builder
                      </p>
                      <DebouncedInput
                        key={`${currentWorkspaceId}:${activeRequest.id}:name`}
                        aria-label="Request name"
                        className="request-name-input"
                        value={activeRequest.name}
                        readOnly={isReadOnly}
                        onValueChange={(value) => updateActiveRequest({ name: value })}
                      />
                    </div>
                    <div className="request-heading-actions">
                      <span className="request-status">{activeWorkspace?.cloudId ? activeWorkspace.role : 'Saved locally'}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="request-view-docs"
                        onClick={() => openDocsTab(activeRequest.id)}
                      >
                        View docs
                      </Button>
                    </div>
                  </div>
                  <div className="request-line">
                    <Select
                      value={activeRequest.method}
                      onValueChange={(value) => updateActiveRequest({ method: value })}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger aria-label="HTTP method" className="method-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <VariableUrlField
                      key={`${currentWorkspaceId}:${activeRequest.id}:url`}
                      aria-label="Request URL"
                      className="url-input"
                      value={activeRequest.url}
                      suggestions={variableSuggestions}
                      onVariableClick={openVariableEditor}
                      readOnly={isReadOnly}
                      onValueChange={(value) => updateActiveRequest({ url: value })}
                      spellCheck={false}
                      placeholder="https://api.example.com/resource"
                    />
                    <div className="send-control">
                      <Button type="submit" className="send-primary" disabled={response.kind === 'loading'}>
                        {response.kind === 'loading' ? 'Sending…' : 'Send'}
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="send-options-trigger"
                        ref={sendOptionsButtonRef}
                        aria-label="Send options"
                        aria-haspopup="menu"
                        aria-expanded={sendMenuOpen}
                        onClick={() => setSendMenuOpen((open) => !open)}
                      >
                        ⌄
                      </Button>
                      {sendMenuOpen && (
                        <>
                          <button
                            type="button"
                            className="send-menu-dismiss"
                            aria-label="Close send options"
                            onClick={() => setSendMenuOpen(false)}
                          />
                          <div
                            className="send-options-menu"
                            role="menu"
                            aria-label="Send request options"
                            onKeyDown={(event) => {
                              const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role^="menuitem"]'))
                              const activeIndex = items.indexOf(document.activeElement as HTMLButtonElement)
                              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                                event.preventDefault()
                                const direction = event.key === 'ArrowDown' ? 1 : -1
                                items[(activeIndex + direction + items.length) % items.length]?.focus()
                              } else if (event.key === 'Escape') {
                                event.preventDefault()
                                setSendMenuOpen(false)
                                sendOptionsButtonRef.current?.focus()
                              }
                            }}
                          >
                            <div className="send-menu-section">Basic</div>
                            <button
                              type="button"
                              role="menuitem"
                              autoFocus
                              onClick={() => {
                                setSendMenuOpen(false)
                                void executeRequest()
                              }}
                            >
                              <span>Send Now</span>
                              <kbd>Ctrl + Enter</kbd>
                            </button>
                            <button type="button" role="menuitem" onClick={openClientCode}>
                              <span>Generate Client Code</span>
                            </button>
                            <div className="send-menu-section send-menu-section-advanced">Advanced</div>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setSendMenuOpen(false)
                                setSendDelayDialogOpen(true)
                              }}
                            >
                              <span>Send After Delay</span>
                            </button>
                            {repeatRunning ? (
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setSendMenuOpen(false)
                                  stopRepeating()
                                }}
                              >
                                <span>Stop Repeating</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setSendMenuOpen(false)
                                  setRepeatDialogOpen(true)
                                }}
                              >
                                <span>Repeat on Interval</span>
                              </button>
                            )}
                            <button
                              type="button"
                              role="menuitemcheckbox"
                              className="send-menu-toggle"
                              aria-checked={downloadAfterSend}
                              onClick={() => setDownloadAfterSend((enabled) => !enabled)}
                            >
                              <span className="send-menu-check" aria-hidden="true">
                                {downloadAfterSend ? '✓' : ''}
                              </span>
                              <span>Download After Send</span>
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="send-menu-last"
                              onClick={() => {
                                setSendMenuOpen(false)
                                void executeRequest(true)
                              }}
                            >
                              <span>Send And Download</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {(sendNotice || repeatRunning) && (
                    <div className="send-schedule-notice" role="status">
                      <span>
                        {sendNotice || `Repeating every ${repeatIntervalSeconds} second${Number(repeatIntervalSeconds) === 1 ? '' : 's'}.`}
                      </span>
                      <Button type="button" variant="ghost" size="sm" onClick={sendNotice ? cancelScheduledRequest : stopRepeating}>
                        {sendNotice ? 'Cancel' : 'Stop'}
                      </Button>
                    </div>
                  )}
                  <Tabs defaultValue="params" className="request-tabs">
                    <TabsList aria-label="Request configuration">
                      <TabsTrigger value="params">
                        Params
                        {requestTabIndicators?.activeParams ? (
                          <span className="request-tab-count" aria-hidden="true">
                            {requestTabIndicators.activeParams}
                          </span>
                        ) : null}
                        {requestTabIndicators?.activeParams ? (
                          <span className="sr-only">{requestTabIndicators.activeParams} active parameters</span>
                        ) : null}
                      </TabsTrigger>
                      <TabsTrigger value="body">
                        Body
                        {requestTabIndicators?.hasBody && (
                          <>
                            <span className="request-tab-dot" aria-hidden="true" />
                            <span className="sr-only">Body configured</span>
                          </>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="auth">
                        Auth
                        {requestTabIndicators?.hasAuth && (
                          <>
                            <span className="request-tab-dot" aria-hidden="true" />
                            <span className="sr-only">Authorization configured</span>
                          </>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="headers">
                        Headers
                        {requestTabIndicators?.headers ? (
                          <span className="request-tab-count" aria-hidden="true">
                            {requestTabIndicators.headers}
                          </span>
                        ) : null}
                        {requestTabIndicators?.headers ? (
                          <span className="sr-only">{requestTabIndicators.headers} active headers</span>
                        ) : null}
                      </TabsTrigger>
                      <TabsTrigger value="responses">
                        Responses
                        {activeRequest.responses?.length ? (
                          <span className="request-tab-count">{activeRequest.responses.length}</span>
                        ) : null}
                      </TabsTrigger>
                      <TabsTrigger value="docs">Docs</TabsTrigger>
                    </TabsList>
                    <TabsContent value="params" className="editor-pane">
                      <ParamsEditor
                        key={`${currentWorkspaceId}:${activeRequest.id}`}
                        request={activeRequest}
                        readOnly={isReadOnly}
                        suggestions={variableSuggestions}
                        onVariableClick={openVariableEditor}
                        onChange={updateActiveRequest}
                      />
                    </TabsContent>
                    <TabsContent value="body" className="editor-pane">
                      <BodyEditor
                        key={`${currentWorkspaceId}:${activeRequest.id}`}
                        request={activeRequest}
                        readOnly={isReadOnly}
                        suggestions={variableSuggestions}
                        onVariableClick={openVariableEditor}
                        onChange={updateActiveRequest}
                      />
                    </TabsContent>
                    <TabsContent value="auth" className="editor-pane">
                      <AuthEditor
                        key={`${currentWorkspaceId}:${activeRequest.id}`}
                        request={activeRequest}
                        readOnly={isReadOnly}
                        suggestions={variableSuggestions}
                        onVariableClick={openVariableEditor}
                        onChange={updateActiveRequest}
                      />
                    </TabsContent>
                    <TabsContent value="headers" className="editor-pane">
                      <HeaderEditor
                        key={`${currentWorkspaceId}:${activeRequest.id}`}
                        request={activeRequest}
                        readOnly={isReadOnly}
                        suggestions={variableSuggestions}
                        onVariableClick={openVariableEditor}
                        onChange={updateActiveRequest}
                      />
                    </TabsContent>
                    <TabsContent value="responses" className="editor-pane">
                      <ResponseEditor
                        key={`${currentWorkspaceId}:${activeRequest.id}`}
                        responses={activeRequest.responses ?? []}
                        readOnly={isReadOnly}
                        onChange={(responses) => updateActiveRequest({ responses })}
                      />
                    </TabsContent>
                    <TabsContent value="docs" className="editor-pane">
                      <DebouncedTextarea
                        key={`${currentWorkspaceId}:${activeRequest.id}:docs`}
                        aria-label="Request documentation"
                        className="request-docs-field"
                        maxLength={100000}
                        placeholder="Describe this endpoint, its inputs, and expected response."
                        value={activeRequest.documentation ?? ''}
                        readOnly={isReadOnly}
                        onValueChange={(value) => updateActiveRequest({ documentation: value })}
                      />
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <StateMessage title="No request selected" description="Choose a request or create one in the selected folder." />
              )}
            </form>
            <Dialog open={sendDelayDialogOpen} onOpenChange={setSendDelayDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send after delay</DialogTitle>
                  <DialogDescription>Run this request once after the selected delay.</DialogDescription>
                </DialogHeader>
                <form className="dialog-form send-timer-form" onSubmit={scheduleRequest}>
                  <label htmlFor="send-delay-seconds">Delay in seconds</label>
                  <Input
                    id="send-delay-seconds"
                    type="number"
                    min="1"
                    max="3600"
                    value={sendDelaySeconds}
                    onChange={(event) => setSendDelaySeconds(event.target.value)}
                  />
                  <Button type="submit">Schedule request</Button>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={repeatDialogOpen} onOpenChange={setRepeatDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Repeat request</DialogTitle>
                  <DialogDescription>Send the current request repeatedly until you stop it.</DialogDescription>
                </DialogHeader>
                <form className="dialog-form send-timer-form" onSubmit={startRepeating}>
                  <label htmlFor="repeat-interval-seconds">Interval in seconds</label>
                  <Input
                    id="repeat-interval-seconds"
                    type="number"
                    min="1"
                    max="3600"
                    value={repeatIntervalSeconds}
                    onChange={(event) => setRepeatIntervalSeconds(event.target.value)}
                  />
                  <Button type="submit">Start repeating</Button>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={clientCodeDialogOpen} onOpenChange={setClientCodeDialogOpen}>
              <DialogContent className="client-code-dialog">
                <DialogHeader>
                  <DialogTitle>Generate Client Code</DialogTitle>
                  <DialogDescription>cURL command for the current request.</DialogDescription>
                </DialogHeader>
                <Textarea
                  aria-label="Generated cURL command"
                  className="client-code-textarea code-field"
                  readOnly
                  value={clientCode}
                  spellCheck={false}
                />
                <p className="client-code-note">The command includes the authorization values configured for this request.</p>
                <div className="client-code-actions">
                  <span role="status">{clientCodeStatus}</span>
                  <Button type="button" onClick={() => void copyClientCode()}>
                    Copy code
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <ResponseInspector response={response} responseView={responseView} onResponseViewChange={setResponseView} />
          </>
        )}
      </section>
      {contextMenu && !isReadOnly && (
        <>
          <div className="context-menu-dismiss" aria-hidden="true" onMouseDown={() => setContextMenu(null)} />
          <div
            className="tree-context-menu"
            role="menu"
            aria-label="Collection item actions"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onKeyDown={(event) => {
              const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'))
              const activeIndex = items.indexOf(document.activeElement as HTMLButtonElement)
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault()
                const direction = event.key === 'ArrowDown' ? 1 : -1
                items[(activeIndex + direction + items.length) % items.length]?.focus()
              } else if (event.key === 'Escape') setContextMenu(null)
            }}
          >
            <button role="menuitem" autoFocus onClick={() => openCreateFolder(contextMenu.parentFolderId)}>
              <span aria-hidden="true">＋</span>Create folder
            </button>
            <button role="menuitem" onClick={createRequestFromMenu}>
              <span aria-hidden="true">↳</span>Create request
            </button>
            {contextMenu.targetNodeId &&
              (() => {
                const target = treeIndex.nodeById.get(contextMenu.targetNodeId)
                return target && isFolder(target) ? (
                  <>
                    <div className="tree-context-menu-divider" role="separator" />
                    <button role="menuitem" onClick={renameFolderFromMenu}>
                      <span aria-hidden="true">✎</span>Rename folder
                    </button>
                    <button role="menuitem" className="context-menu-danger" onClick={openDeleteConfirmFromMenu}>
                      <span aria-hidden="true">×</span>Delete folder
                    </button>
                  </>
                ) : target && isRequest(target) ? (
                  <>
                    <div className="tree-context-menu-divider" role="separator" />
                    <button role="menuitem" className="context-menu-danger" onClick={openDeleteConfirmFromMenu}>
                      <span aria-hidden="true">×</span>Delete request
                    </button>
                  </>
                ) : null
              })()}
          </div>
        </>
      )}
      <Dialog open={createWorkspaceOpen} onOpenChange={setCreateWorkspaceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create cloud workspace</DialogTitle>
            <DialogDescription>Publish the current local workspace so your team can join it.</DialogDescription>
          </DialogHeader>
          <form className="dialog-form" onSubmit={createCloudWorkspace}>
            <label htmlFor="cloud-workspace-name">Workspace name</label>
            <Input
              id="cloud-workspace-name"
              autoFocus
              required
              maxLength={100}
              value={cloudWorkspaceName}
              onChange={(event) => setCloudWorkspaceName(event.target.value)}
              placeholder="e.g. Platform API"
            />
            <Button type="submit" disabled={!sessionToken || !cloudWorkspaceName.trim()}>
              Create workspace
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Workspace team</DialogTitle>
            <DialogDescription>
              {activeWorkspace?.role === 'owner'
                ? `Invite a teammate to ${activeWorkspace.name} by email.`
                : 'Paste an invite link to join a workspace.'}
            </DialogDescription>
          </DialogHeader>
          <div className="dialog-form">
            {activeWorkspace?.role === 'owner' && (
              <>
                <p className="invite-help">
                  The invitation is single-use, expires in 7 days, and must be accepted by the invited account email.
                </p>
                <label htmlFor="invite-email">Teammate email</label>
                <Input
                  id="invite-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={inviteEmailDraft}
                  onChange={(event) => setInviteEmailDraft(event.target.value)}
                  placeholder="teammate@example.com"
                />
                <label htmlFor="invite-role">Invite role</label>
                <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as 'editor' | 'viewer')}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" onClick={() => void createInvite()}>
                  Send invitation
                </Button>
              </>
            )}
            {inviteLink && (
              <div className="invite-link-row">
                <Input aria-label="Invite link" readOnly value={inviteLink} />
                <Button type="button" variant="outline" onClick={() => void navigator.clipboard.writeText(inviteLink)}>
                  Copy
                </Button>
              </div>
            )}
            <form className="invite-accept-form" onSubmit={acceptInvite}>
              <label htmlFor="invite-token">Accept an invite</label>
              <Input
                id="invite-token"
                value={inviteTokenDraft}
                onChange={(event) => setInviteTokenDraft(event.target.value)}
                placeholder="Paste invite link or token"
              />
              <Button type="submit" variant="outline" disabled={!inviteTokenDraft.trim()}>
                Join workspace
              </Button>
            </form>
            {inviteError && (
              <p className="dialog-error" role="status">
                {inviteError}
              </p>
            )}
            {inviteNotice && (
              <p className="dialog-success" role="status">
                {inviteNotice}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={discardConfirmOpen} onOpenChange={setDiscardConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard local changes?</DialogTitle>
            <DialogDescription>
              This restores the collection and variable definitions to the latest local commit. Uncommitted edits will be lost; secret
              values remain stored on this device.
            </DialogDescription>
          </DialogHeader>
          <div className="dialog-actions">
            <Button type="button" variant="outline" onClick={() => setDiscardConfirmOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={discardLocalChanges}>
              Discard changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteConfirmTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{deleteConfirmTarget?.kind === 'folder' ? 'Delete folder?' : 'Delete request?'}</DialogTitle>
            <DialogDescription>
              {deleteConfirmTarget?.kind === 'folder'
                ? (() => {
                    const requestCount = treeIndex.requestCountByFolderId.get(deleteConfirmTarget.id) ?? 0
                    return `Delete “${deleteConfirmTarget.name}” and all of its contents (${requestCount} request${requestCount === 1 ? '' : 's'})? This appears in Changes and will only be shared after you commit and push.`
                  })()
                : `Delete “${deleteConfirmTarget?.name ?? 'this request'}”? This appears in Changes and will only be shared after you commit and push.`}
            </DialogDescription>
          </DialogHeader>
          <div className="dialog-actions">
            <Button type="button" variant="outline" onClick={() => setDeleteConfirmTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDeleteCollectionItem}>
              Delete {deleteConfirmTarget?.kind ?? 'item'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={commitDialogOpen} onOpenChange={setCommitDialogOpen}>
        <DialogContent className="changes-dialog">
          <DialogHeader>
            <DialogTitle>{commitDialogView === 'changes' ? 'Commit changes' : 'Commit history'}</DialogTitle>
            <DialogDescription>
              {commitDialogView === 'changes'
                ? 'Stage the workspace changes you want in this commit. Commit locally, then push to share them with your team.'
                : activeWorkspace?.cloudId
                  ? 'Browse local and cloud commits. Select a commit to inspect its changed items and diff.'
                  : 'Browse commits saved on this device. Connect this workspace to cloud to see your team’s commits.'}
            </DialogDescription>
          </DialogHeader>
          <div className="commit-view-tabs" role="tablist" aria-label="Workspace changes and history">
            <button
              type="button"
              role="tab"
              aria-selected={commitDialogView === 'changes'}
              disabled={Boolean(isReadOnly)}
              onClick={() => setCommitDialogView('changes')}
            >
              Changes <span>{workspaceChanges.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={commitDialogView === 'history'}
              onClick={() => {
                setCommitDialogView('history')
                setSelectedHistoryCommitId('')
                setSelectedHistoryChangeId('')
              }}
            >
              History <span>{historyCommits.length}</span>
            </button>
          </div>
          {commitDialogView === 'changes' ? (
            <form className="changes-layout" onSubmit={saveCommit}>
              <div className="changes-sidebar changes-sidebar-commit">
                <label htmlFor="commit-message">Commit message</label>
                <Input
                  id="commit-message"
                  autoFocus
                  required
                  maxLength={200}
                  value={commitMessage}
                  onChange={(event) => setCommitMessage(event.target.value)}
                  placeholder="e.g. Add billing endpoints"
                />
                <div className="changes-list-scroll">
                  <section className="change-list-section">
                    <div className="change-list-heading">
                      <strong>Staged changes</strong>
                      <span>{stagedChanges.length}</span>
                      <button
                        type="button"
                        className="text-action"
                        onClick={() => {
                          setStagedSnapshot(null)
                          setStagedVariables(null)
                        }}
                        disabled={!stagedChanges.length}
                      >
                        Unstage all
                      </button>
                    </div>
                    {stagedChanges.length ? (
                      stagedChanges.map((change) => (
                        <ChangeRow
                          key={`staged-${change.id}`}
                          change={change}
                          selected={selectedChange?.id === change.id}
                          onSelect={() => setSelectedChangeId(change.id)}
                          actionLabel="Unstage"
                          onAction={() => stageChange(change, false)}
                        />
                      ))
                    ) : (
                      <p className="change-empty">Stage your changes to commit them.</p>
                    )}
                  </section>
                  <section className="change-list-section">
                    <div className="change-list-heading">
                      <strong>Changes</strong>
                      <span>{unstagedChanges.length}</span>
                      <button
                        type="button"
                        className="text-action"
                        onClick={() => stageChanges(unstagedChanges, true)}
                        disabled={!unstagedChanges.length}
                      >
                        Stage all
                      </button>
                    </div>
                    {unstagedChanges.length ? (
                      unstagedChanges.map((change) => (
                        <ChangeRow
                          key={`unstaged-${change.id}`}
                          change={change}
                          selected={selectedChange?.id === change.id}
                          onSelect={() => setSelectedChangeId(change.id)}
                          actionLabel="Stage"
                          onAction={() => stageChange(change, true)}
                        />
                      ))
                    ) : (
                      <p className="change-empty">No unstaged changes.</p>
                    )}
                  </section>
                </div>
                <div className="changes-sidebar-footer">
                  <Button type="submit" disabled={!commitMessage.trim() || !stagedChanges.length}>
                    Commit
                  </Button>
                </div>
              </div>
              <section className="diff-view" aria-label="Selected change diff">
                {selectedChange ? (
                  <>
                    <header className="diff-file-header">
                      <span className={`change-badge change-${selectedChange.status}`}>{changeStatusCode(selectedChange.status)}</span>
                      <strong title={selectedChange.name}>{selectedChange.name}</strong>
                      <span>{changeStatusText(selectedChange.status)}</span>
                    </header>
                    <div className="diff-column-headings">
                      <span>Previous</span>
                      <span>Working tree</span>
                    </div>
                    <div className="diff-scroll" role="region" aria-label={`Diff for ${selectedChange.name}`}>
                      {diffRows.map((row, index) => (
                        <div className="diff-row" key={`${row.kind}-${row.leftLine ?? 'x'}-${row.rightLine ?? 'x'}-${index}`}>
                          <div className={`diff-cell ${row.kind === 'removed' ? 'diff-cell-removed' : ''}`}>
                            <span className="diff-gutter">{row.leftLine ?? ''}</span>
                            <code>{row.leftText || ' '}</code>
                          </div>
                          <div className={`diff-cell ${row.kind === 'added' ? 'diff-cell-added' : ''}`}>
                            <span className="diff-gutter">{row.rightLine ?? ''}</span>
                            <code>{row.rightText || ' '}</code>
                          </div>
                        </div>
                      ))}
                      {diffRows.length > 0 && diffRows.every((row) => row.kind === 'same') && (
                        <p className="diff-note">No content changes. This item moved within the workspace.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="diff-empty">Select a changed item to compare it.</div>
                )}
              </section>
            </form>
          ) : (
            <div className="changes-layout history-layout">
              <div className="changes-sidebar history-sidebar">
                <section className="change-list-section">
                  <div className="change-list-heading">
                    <strong>Commits</strong>
                    <span>{historyCommits.length}</span>
                  </div>
                  {historyLoading && (
                    <p className="change-empty" role="status">
                      Loading cloud history…
                    </p>
                  )}
                  {historyError && (
                    <p className="history-error" role="status">
                      Cloud history could not load: {historyError}. Local commits are still shown.
                    </p>
                  )}
                  {!historyCommits.length && !historyLoading && (
                    <p className="change-empty">No commits yet. Make a change, stage it, and commit to start the history.</p>
                  )}
                  {historyCommits.map((commit) => {
                    const status =
                      commit.source === 'cloud' ? (localCommitIds.has(commit.id) ? 'Pushed' : 'Cloud') : commit.pushed ? 'Pushed' : 'Local'
                    return (
                      <button
                        key={commit.id}
                        type="button"
                        className={cn('history-commit-row', selectedHistoryCommit?.id === commit.id && 'history-commit-row-selected')}
                        aria-pressed={selectedHistoryCommit?.id === commit.id}
                        onClick={() => {
                          setSelectedHistoryCommitId(commit.id)
                          setSelectedHistoryChangeId('')
                          setHistoryDetailError('')
                        }}
                      >
                        <span className={`history-commit-state history-commit-${status.toLowerCase()}`}>{status}</span>
                        <span className="history-commit-copy">
                          <strong title={commit.message}>{commit.message}</strong>
                          <small>{new Date(commit.createdAt).toLocaleString()}</small>
                        </span>
                      </button>
                    )
                  })}
                </section>
                {selectedHistoryCommit && (
                  <section className="change-list-section" aria-busy={historyDetailLoading}>
                    <div className="change-list-heading">
                      <strong>Changed items</strong>
                      <span>{historySnapshotsReady ? historyChanges.length : '…'}</span>
                    </div>
                    {historySnapshotsReady && historyChanges.length ? (
                      historyChanges.map((change) => (
                        <HistoryChangeRow
                          key={change.id}
                          change={change}
                          selected={selectedHistoryChange?.id === change.id}
                          onSelect={() => setSelectedHistoryChangeId(change.id)}
                        />
                      ))
                    ) : historySnapshotsReady ? (
                      <p className="change-empty">This commit has no visible content changes.</p>
                    ) : historyDetailError ? (
                      <p className="history-error" role="status">
                        Commit details could not load: {historyDetailError}
                      </p>
                    ) : (
                      <p className="change-empty" role="status">
                        Loading commit details…
                      </p>
                    )}
                  </section>
                )}
              </div>
              <section className="diff-view" aria-label="Selected commit diff">
                {selectedHistoryCommit && selectedHistoryChange ? (
                  <>
                    <header className="diff-file-header">
                      <span className={`change-badge change-${selectedHistoryChange.status}`}>
                        {changeStatusCode(selectedHistoryChange.status)}
                      </span>
                      <strong title={selectedHistoryChange.name}>{selectedHistoryChange.name}</strong>
                      <span>{changeStatusText(selectedHistoryChange.status)}</span>
                    </header>
                    <div className="diff-column-headings">
                      <span>Parent version</span>
                      <span>{selectedHistoryCommit.message}</span>
                    </div>
                    <div className="diff-scroll" role="region" aria-label={`Commit diff for ${selectedHistoryChange.name}`}>
                      {historyDiffRows.map((row, index) => (
                        <div className="diff-row" key={`${row.kind}-${row.leftLine ?? 'x'}-${row.rightLine ?? 'x'}-${index}`}>
                          <div className={`diff-cell ${row.kind === 'removed' ? 'diff-cell-removed' : ''}`}>
                            <span className="diff-gutter">{row.leftLine ?? ''}</span>
                            <code>{row.leftText || ' '}</code>
                          </div>
                          <div className={`diff-cell ${row.kind === 'added' ? 'diff-cell-added' : ''}`}>
                            <span className="diff-gutter">{row.rightLine ?? ''}</span>
                            <code>{row.rightText || ' '}</code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="diff-empty">
                    {selectedHistoryCommit && historyDetailError
                      ? `Could not load commit details: ${historyDetailError}`
                      : selectedHistoryCommit && !historySnapshotsReady
                        ? 'Loading selected commit…'
                        : selectedHistoryCommit
                          ? 'Select a changed item to view its diff.'
                          : historyLoading && !historyCommits.length
                            ? 'Loading cloud commit history…'
                            : historyCommits.length
                              ? 'Select a commit to view its changed items.'
                              : 'Commit history will appear here after your first commit.'}
                  </div>
                )}
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!pendingMerge}
        onOpenChange={(open) => {
          if (!open) setPendingMerge(null)
        }}
      >
        <DialogContent className="merge-dialog">
          <DialogHeader>
            <DialogTitle>Resolve workspace conflicts</DialogTitle>
            <DialogDescription>Choose which version to keep for each item changed both locally and in the cloud.</DialogDescription>
          </DialogHeader>
          <div className="merge-conflicts">
            {pendingMerge?.conflicts.map((conflict) => (
              <section key={conflict.id} className="merge-conflict">
                <strong>{conflict.local?.name ?? conflict.remote?.name ?? 'Deleted item'}</strong>
                <div className="merge-choices">
                  <label>
                    <input
                      type="radio"
                      name={`merge-${conflict.id}`}
                      checked={mergeChoices[conflict.id] === 'local'}
                      onChange={() => setMergeChoices((current) => ({ ...current, [conflict.id]: 'local' }))}
                    />
                    <span>Keep local{conflict.local ? `: ${conflict.local.name}` : ' (deleted)'}</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={`merge-${conflict.id}`}
                      checked={mergeChoices[conflict.id] === 'remote'}
                      onChange={() => setMergeChoices((current) => ({ ...current, [conflict.id]: 'remote' }))}
                    />
                    <span>Keep cloud{conflict.remote ? `: ${conflict.remote.name}` : ' (deleted)'}</span>
                  </label>
                </div>
              </section>
            ))}
            {pendingMerge?.variableConflict && (
              <section className="merge-conflict">
                <strong>Workspace variables</strong>
                <div className="merge-choices">
                  <label>
                    <input
                      type="radio"
                      name={`merge-${workspaceVariablesChangeId}`}
                      checked={mergeChoices[workspaceVariablesChangeId] === 'local'}
                      onChange={() => setMergeChoices((current) => ({ ...current, [workspaceVariablesChangeId]: 'local' }))}
                    />
                    <span>Keep local variable definitions and shared values</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={`merge-${workspaceVariablesChangeId}`}
                      checked={mergeChoices[workspaceVariablesChangeId] === 'remote'}
                      onChange={() => setMergeChoices((current) => ({ ...current, [workspaceVariablesChangeId]: 'remote' }))}
                    />
                    <span>Keep cloud variable definitions and shared values</span>
                  </label>
                </div>
              </section>
            )}
          </div>
          <Button
            onClick={() => void applyMergeResolution()}
            disabled={
              !pendingMerge ||
              pendingMerge.conflicts.some((item) => !mergeChoices[item.id]) ||
              Boolean(pendingMerge?.variableConflict && !mergeChoices[workspaceVariablesChangeId])
            }
          >
            Save merge
          </Button>
        </DialogContent>
      </Dialog>
      {syncStatus && (
        <div className="sync-toast" role="status">
          {syncStatus}
        </div>
      )}
    </main>
  )
}
