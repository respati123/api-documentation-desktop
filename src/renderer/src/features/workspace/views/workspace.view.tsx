import type { CSSProperties, ReactElement } from 'react'
import { AiConnectView } from '@/features/ai-connect'
import { CollectionMenuView, DeleteItemDialogView } from '@/features/collection'
import { OpenApiDialog } from '@/features/docs'
import {
  CommitDialogView,
  CreateWorkspaceDialogView,
  DiscardDialogView,
  MergeDialogView,
  SyncToastView,
  TeamDialogView,
} from '@/features/sync'
import { VariableQuickEditView, VariablesDialogView } from '@/features/variables'
import type { useWorkspaceViewModel } from '@/features/workspace/viewmodels/use-workspace.viewmodel'
import { WorkspaceMainView } from '@/features/workspace/views/workspace-main.view'
import { WorkspaceSidebarView } from '@/features/workspace/views/workspace-sidebar.view'
import { WorkspaceTopbarView, WorkspaceUpdateDialogView } from '@/features/workspace/views/workspace-topbar.view'

export type WorkspaceViewProps = ReturnType<typeof useWorkspaceViewModel>

// The workspace screen: it arranges the topbar, sidebar, and main pane, and renders the dialogs that sit above them.
export function WorkspaceView(props: WorkspaceViewProps): ReactElement {
  return (
    <main ref={props.appShellRef} className="app-shell" style={{ '--sidebar-width': `${props.collectionWidth}px` } as CSSProperties}>
      <WorkspaceTopbarView
        chrome={props.chrome}
        accountMenuRef={props.accountMenuRef}
        auth={{
          showTrigger: !props.user,
          onBeginSignIn: props.beginBrowserSignIn,
          openRequest: props.authOpenRequest,
          initialError: props.authError,
          onOpen: props.clearAuthError,
        }}
      />

      <AiConnectView {...props.aiConnect} />
      <WorkspaceUpdateDialogView dialog={props.chrome.dialog} />
      <VariablesDialogView {...props.variablesDialog} />
      <VariableQuickEditView {...props.variableQuickEdit} />
      <OpenApiDialog
        open={props.openApiDialogOpen}
        onOpenChange={props.setOpenApiDialogOpen}
        tree={props.tree}
        workspaceName={props.sidebar.openApiWorkspaceName}
        readOnly={Boolean(props.isReadOnly)}
        onImport={props.importTree}
      />

      <WorkspaceSidebarView
        sidebar={props.sidebar}
        collection={props.collection}
        syncFooter={props.syncFooter}
        resize={{
          onPointerDown: props.startCollectionResize,
          onPointerMove: props.moveCollectionResize,
          onPointerUp: props.finishCollectionResize,
          onKeyDown: props.handleCollectionResizeKeyDown,
        }}
      />
      <WorkspaceMainView tabbar={props.tabbar} environmentTab={props.environmentTab} requestWorkbench={props.requestWorkbench} />

      {props.collection.menu && <CollectionMenuView {...props.collection.menu} />}
      <CreateWorkspaceDialogView createWorkspace={props.team.createWorkspace} />
      <TeamDialogView team={props.team.team} />
      <DiscardDialogView {...props.discardDialog} />
      <DeleteItemDialogView deleteDialog={props.collection.deleteDialog} />
      <CommitDialogView {...props.commitDialog} />
      <MergeDialogView {...props.mergeDialog} />
      <SyncToastView message={props.syncStatus} />
    </main>
  )
}
