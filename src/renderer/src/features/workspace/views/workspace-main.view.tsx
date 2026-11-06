import { FileText } from 'lucide-react'
import { type ComponentProps, Fragment, type ReactElement } from 'react'
import { ApiReferencePage } from '@/features/docs'
import { RequestWorkbenchPage } from '@/features/request'
import { EnvironmentTabView } from '@/features/variables'
import type { useWorkspaceTabbarViewModel } from '@/features/workspace/viewmodels/use-workspace-tabbar.viewmodel'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Icon,
  MethodTag,
  StatusDot,
  TabStrip,
  TabStripItem,
} from '@/shared/ui'

type TabbarViewModel = ReturnType<typeof useWorkspaceTabbarViewModel>

// Right-click menu for a tab. The trigger is a zero-size anchor at the click point, and the menu is controlled by the ViewModel.
function TabContextMenuView({ menu }: { menu: TabbarViewModel['contextMenu'] }): ReactElement {
  return (
    <DropdownMenu open={menu.open} onOpenChange={menu.onOpenChange}>
      <DropdownMenuTrigger asChild>
        <span aria-hidden="true" className="pointer-events-none fixed size-px" style={{ left: menu.position.x, top: menu.position.y }} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" data-testid="workspace-tabbar-tab-menu">
        {menu.groups.map((group, index) => (
          <Fragment key={group.map((item) => item.key).join('|')}>
            {index > 0 && <DropdownMenuSeparator />}
            {group.map((item) => (
              <DropdownMenuItem
                key={item.key}
                disabled={item.disabled}
                data-testid={`workspace-tabbar-menu-${item.key}`}
                onSelect={item.onSelect}
              >
                {item.label}
              </DropdownMenuItem>
            ))}
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function TabBadge({ badge }: { badge: TabbarViewModel['tabs'][number]['badge'] }): ReactElement {
  if (badge.kind === 'docs')
    return (
      <span className="shrink-0 text-[8px] font-extrabold tracking-[.03em] text-primary" aria-hidden="true">
        {badge.label}
      </span>
    )
  if (badge.kind === 'method') return <MethodTag method={badge.method} />
  return <Icon name="sliders" size={14} />
}

type EmptyAction = { label: string; disabled: boolean; onClick: () => void }

// The pane shown when no request is open. It fills the pane, explains the next step, and offers the action that starts it.
function EmptyPaneView({
  testId,
  title,
  description,
  action,
}: {
  testId: string
  title: string
  description: string
  action?: EmptyAction
}): ReactElement {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-4" data-testid={testId}>
      <div className="flex max-w-[320px] flex-col items-center gap-2 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-hidden="true">
          <FileText size={18} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <h2 className="mt-2 text-[15px] font-semibold text-foreground">{title}</h2>
        <p className="text-[13px] leading-[1.6] text-muted-foreground">{description}</p>
        {action && (
          <Button
            variant="primary"
            size="sm"
            className="mt-4"
            disabled={action.disabled}
            data-testid="workspace-main-empty-new-request"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
      </div>
    </div>
  )
}

export function WorkspaceTabbarView({ tabbar }: { tabbar: TabbarViewModel }): ReactElement {
  return (
    <>
      <TabStrip
        label={tabbar.listLabel}
        addLabel={tabbar.addRequest.label}
        addTestId="workspace-tabbar-add-request"
        onAdd={tabbar.addRequest.disabled ? undefined : tabbar.addRequest.onClick}
      >
        {tabbar.tabs.map((tab) => (
          <TabStripItem
            key={tab.key}
            leading={<TabBadge badge={tab.badge} />}
            label={tab.title}
            trailing={tab.badge.kind === 'environment' && tab.badge.isActive ? <StatusDot tone="ok" /> : undefined}
            active={tab.active}
            dirty={tab.changed}
            dirtyLabel={tabbar.changedLabel}
            closeLabel={tab.closeLabel}
            testIds={{ tab: 'workspace-tabbar-tab', close: 'workspace-tabbar-close' }}
            onSelect={tab.onSelect}
            onClose={tab.onClose}
            onContextMenu={(event) => {
              event.preventDefault()
              tab.onContextMenu(event)
            }}
          />
        ))}
      </TabStrip>
      <TabContextMenuView menu={tabbar.contextMenu} />
    </>
  )
}

export function WorkspaceMainView({
  tabbar,
  environmentTab,
  requestWorkbench,
}: {
  tabbar: TabbarViewModel
  environmentTab: ComponentProps<typeof EnvironmentTabView>
  requestWorkbench: ComponentProps<typeof RequestWorkbenchPage> | null
}): ReactElement {
  const main = tabbar.main
  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden" aria-label={main.requestLabel}>
      <WorkspaceTabbarView tabbar={tabbar} />
      {tabbar.pane === 'environment' && <EnvironmentTabView {...environmentTab} />}
      {tabbar.pane === 'docs' && tabbar.docsRequest && (
        <ApiReferencePage
          request={tabbar.docsRequest}
          folderName={tabbar.docsFolderName}
          onOpenRequest={tabbar.onOpenDocsRequest}
          onOpenOpenApi={tabbar.onOpenOpenApi}
        />
      )}
      {tabbar.pane === 'docsUnavailable' && (
        <EmptyPaneView
          testId="workspace-main-docs-unavailable-state"
          title={main.docsUnavailable}
          description={main.docsUnavailableDescription}
        />
      )}
      {tabbar.pane === 'request' && requestWorkbench && <RequestWorkbenchPage {...requestWorkbench} />}
      {tabbar.pane === 'empty' && (
        <EmptyPaneView
          testId="workspace-main-no-request-state"
          title={main.noRequest}
          description={main.noRequestDescription}
          action={main.newRequest}
        />
      )}
    </section>
  )
}
