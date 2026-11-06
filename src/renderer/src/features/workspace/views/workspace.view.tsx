import type { ReactElement } from 'react'
import { AiConnectView } from '@/features/ai-connect'
import { CollectionMenuView, DeleteItemDialogView } from '@/features/collection'
import { OpenApiDialog } from '@/features/docs'
import { NotificationStackView } from '@/features/notifications'
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
import { SaveConflictDialogView } from '@/features/workspace/views/save-conflict-dialog.view'
import { WorkspaceMainView } from '@/features/workspace/views/workspace-main.view'
import { WorkspaceSidebarView } from '@/features/workspace/views/workspace-sidebar.view'
import { WorkspaceTopbarView, WorkspaceUpdateDialogView } from '@/features/workspace/views/workspace-topbar.view'
import { styleWithVariables } from '@/shared/components/css-variables'
import { AppShell, IconRail, type IconRailItem } from '@/shared/ui'

export type WorkspaceViewProps = ReturnType<typeof useWorkspaceViewModel>

// The workspace screen: the icon rail, top bar, side panel, and main pane in one shell. The dialogs sit above it.
export function WorkspaceView(props: WorkspaceViewProps): ReactElement {
  const { sidebar } = props
  const railItems: IconRailItem[] = [
    {
      key: 'collections',
      label: sidebar.panelTabs.collections,
      icon: 'folder',
      pressed: sidebar.panel === 'collections',
      onSelect: () => {
        sidebar.onSelectPanel('collections')
        props.openSidebar()
      },
    },
    {
      key: 'environments',
      label: sidebar.panelTabs.environments,
      icon: 'sliders',
      pressed: sidebar.panel === 'environments',
      onSelect: () => {
        sidebar.onSelectPanel('environments')
        props.openSidebar()
      },
    },
    {
      key: 'history',
      label: sidebar.panelTabs.history,
      icon: 'clock',
      pressed: sidebar.panel === 'history',
      testId: 'workspace-rail-history',
      onSelect: () => {
        sidebar.onSelectPanel('history')
        props.openSidebar()
      },
    },
    {
      key: 'reference',
      label: sidebar.panelTabs.reference,
      icon: 'layers',
      pressed: sidebar.panel === 'reference',
      testId: 'workspace-rail-reference',
      onSelect: () => {
        sidebar.onSelectPanel('reference')
        props.openSidebar()
      },
    },
    {
      key: 'sync',
      label: sidebar.panelTabs.sync,
      icon: 'arrows',
      disabled: !props.syncFooter.cloud,
      testId: 'workspace-rail-sync',
      onSelect: props.syncFooter.toggle,
    },
    {
      key: 'ai',
      label: sidebar.panelTabs.aiConnect,
      icon: 'sparkle',
      testId: 'workspace-rail-ai-connect',
      onSelect: () => props.aiConnect.onOpenChange(true),
    },
  ]

  return (
    <>
      <AppShell
        shellRef={props.appShellRef}
        style={styleWithVariables({ '--app-sidebar-width': `${props.collectionWidth}px` })}
        sidebarOpen={props.sidebarOpen}
        onSidebarClose={props.closeSidebar}
        closeSidebarLabel={sidebar.label}
        rail={<IconRail appName={props.chrome.wordmark} items={railItems} />}
        topBar={
          <WorkspaceTopbarView
            chrome={props.chrome}
            syncMenu={props.syncFooter}
            picker={sidebar.picker}
            environment={props.tabbar.environment}
            sidebarToggle={{ label: sidebar.label, expanded: props.sidebarOpen, onToggle: props.toggleSidebar }}
            auth={{
              showTrigger: !props.user,
              onBeginSignIn: props.beginBrowserSignIn,
              openRequest: props.authOpenRequest,
              initialError: props.authError,
              onOpen: props.clearAuthError,
            }}
          />
        }
        sidebar={
          <WorkspaceSidebarView
            sidebar={sidebar}
            collection={props.collection}
            lastSendById={props.lastSendById}
            environment={props.tabbar.environment}
            resize={{
              onPointerDown: props.startCollectionResize,
              onPointerMove: props.moveCollectionResize,
              onPointerUp: props.finishCollectionResize,
              onKeyDown: props.handleCollectionResizeKeyDown,
            }}
          />
        }
      >
        <WorkspaceMainView tabbar={props.tabbar} environmentTab={props.environmentTab} requestWorkbench={props.requestWorkbench} />
      </AppShell>

      <AiConnectView {...props.aiConnect} />
      <WorkspaceUpdateDialogView dialog={props.chrome.dialog} />
      <VariablesDialogView {...props.variablesDialog} />
      <SaveConflictDialogView {...props.saveConflictDialog} />
      <VariableQuickEditView {...props.variableQuickEdit} />
      <OpenApiDialog
        open={props.openApiDialogOpen}
        onOpenChange={props.setOpenApiDialogOpen}
        tree={props.tree}
        workspaceName={sidebar.openApiWorkspaceName}
        readOnly={Boolean(props.isReadOnly)}
        onImport={props.importTree}
      />

      {props.collection.menu && <CollectionMenuView {...props.collection.menu} />}
      <CreateWorkspaceDialogView createWorkspace={props.team.createWorkspace} />
      <TeamDialogView team={props.team.team} />
      <DiscardDialogView {...props.discardDialog} />
      <DeleteItemDialogView deleteDialog={props.collection.deleteDialog} />
      <CommitDialogView {...props.commitDialog} />
      <MergeDialogView {...props.mergeDialog} />
      <NotificationStackView {...props.notifications} />
      <SyncToastView message={props.syncStatus} />
    </>
  )
}
