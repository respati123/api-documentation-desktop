import { AiConnectView } from '@/features/ai-connect'
import {
  CollectionMenuView,
  CollectionTreeView,
  CreateFolderDialogView,
  collectionWidthLimit,
  DeleteItemDialogView,
  firstRequestId,
  isFolder,
  isRequest,
  minCollectionWidth,
  WorkspaceStorageIcon,
} from '@/features/collection'

import { ApiReferencePage, OpenApiDialog } from '@/features/docs'
import { RequestWorkbenchPage } from '@/features/request'
import {
  AuthDialog,
  CommitDialogView,
  CreateWorkspaceDialogView,
  DiscardDialogView,
  MergeDialogView,
  TeamDialogView,
} from '@/features/sync'
import { EnvironmentTabView, VariableQuickEditView, VariablesDialogView } from '@/features/variables'
import { workspaceTabKey } from '@/features/workspace/lib/workspace-tabs'

import type { useWorkspaceViewModel } from '@/features/workspace/viewmodels/use-workspace.viewmodel'
import { StateMessage } from '@/shared/components/state-message'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'

import { cn } from '@/shared/utils/cn'

export type WorkspaceViewProps = ReturnType<typeof useWorkspaceViewModel>

export function WorkspaceView({
  collectionWidth,
  appShellRef,
  tree,
  workspaceVariables,
  activeEnvironmentId,
  setVariablesDialogOpen,
  openApiDialogOpen,
  setOpenApiDialogOpen,
  variableQuickEdit,
  requestWorkbench,
  collection,
  team,
  commitDialog,
  mergeDialog,
  discardDialog,
  importTree,
  variablesDialog,
  environmentTab,
  localWorkspaces,
  currentWorkspaceId,
  workspaceTabs,
  activeWorkspaceTabKey,
  sessionToken,
  user,
  authOpenRequest,
  authError,
  syncMenuOpen,
  setSyncMenuOpen,
  setDiscardConfirmOpen,
  syncStatus,
  treeIndex,
  startCollectionResize,
  moveCollectionResize,
  finishCollectionResize,
  handleCollectionResizeKeyDown,
  activeFolder,
  activeWorkspaceTab,
  activeDocsRequest,
  activeWorkspace,
  isReadOnly,
  workspaceChanges,
  pendingPushCount,
  cloudHeadCommitId,
  cloudUpdateAvailable,
  pushDisabledReason,
  changeById,
  historyCommits,
  beginBrowserSignIn,
  clearAuthError,
  accountMenuOpen,
  setAccountMenuOpen,
  accountMenuRef,
  aiConnect,
  updateStatus,
  onDownloadUpdate,
  setUpdateStatus,
  signOut,
  activateWorkspace,
  updateActiveEnvironment,
  openRequestTab,
  openCurrentDocs,
  openEnvironmentTab,
  selectWorkspaceTab,
  closeWorkspaceTab,
  pullWorkspace,
  pushWorkspace,
}: WorkspaceViewProps) {
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
                      team.openCreateWorkspace()
                    }}
                  >
                    New cloud workspace
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountMenuOpen(false)
                      team.openTeam()
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
            <Button size="sm" onClick={() => void onDownloadUpdate(updateStatus.version)}>
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

      <AiConnectView {...aiConnect} />
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
      <VariablesDialogView {...variablesDialog} />
      <VariableQuickEditView {...variableQuickEdit} />
      <OpenApiDialog
        open={openApiDialogOpen}
        onOpenChange={setOpenApiDialogOpen}
        tree={tree}
        workspaceName={activeWorkspace?.name ?? 'My workspace'}
        readOnly={Boolean(isReadOnly)}
        onImport={importTree}
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
          <CreateFolderDialogView folderDialog={collection.folderDialog} />
        </div>

        <nav
          className="tree-list"
          aria-label="Workspace folders and requests"
          onDragOver={collection.handlers.allowDrop}
          onDrop={(event) => collection.handlers.drop(event, null)}
        >
          <div className="workspace-root-line">
            <Select value={currentWorkspaceId} onValueChange={activateWorkspace}>
              <SelectTrigger
                aria-label="Select workspace"
                className="workspace-root-select"
                onContextMenu={collection.handlers.openRootContext}
                onKeyDown={collection.handlers.openRootKeyboard}
                onDragOver={collection.handlers.allowDrop}
                onDrop={(event) => collection.handlers.drop(event, null)}
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
              type="button"
              className="tree-menu-trigger workspace-menu-trigger"
              aria-label="Workspace actions"
              aria-haspopup="menu"
              disabled={isReadOnly}
              onClick={collection.handlers.openRootDropdown}
            >
              ⌄
            </button>
          </div>
          <CollectionTreeView {...collection} />
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
                  // biome-ignore lint/a11y/noAutofocus: an open menu moves focus to its first item, as the menu pattern expects
                  autoFocus
                  onClick={() => {
                    setSyncMenuOpen(false)
                    commitDialog.openHistory()
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
                    commitDialog.openChanges()
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
            {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: the label summarizes the children, which stay readable */}
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

      {/* biome-ignore lint/a11y/useSemanticElements: a resizer needs a separator with value controls, which hr does not offer */}
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
                      <span className="workspace-tab-change" role="img" aria-label="Has uncommitted changes" />
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
          <EnvironmentTabView {...environmentTab} />
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
                testId="workspace-main-docs-unavailable-state"
                title="Endpoint docs unavailable"
                description="Choose an endpoint in the collection to open its documentation."
              />
            </section>
          )
        ) : requestWorkbench ? (
          <RequestWorkbenchPage {...requestWorkbench} />
        ) : (
          <section className="request-card">
            <StateMessage
              testId="workspace-main-no-request-state"
              title="No request selected"
              description="Choose a request or create one in the selected folder."
            />
          </section>
        )}
      </section>
      {collection.menu && <CollectionMenuView {...collection.menu} />}
      <CreateWorkspaceDialogView createWorkspace={team.createWorkspace} />
      <TeamDialogView team={team.team} />

      <DiscardDialogView {...discardDialog} />

      <DeleteItemDialogView deleteDialog={collection.deleteDialog} />

      <CommitDialogView {...commitDialog} />

      <MergeDialogView {...mergeDialog} />
      {syncStatus && (
        <div className="sync-toast" role="status">
          {syncStatus}
        </div>
      )}
    </main>
  )
}
