import { type ComponentProps, Fragment, type ReactElement } from 'react'
import { ApiReferencePage } from '@/features/docs'
import { RequestWorkbenchPage } from '@/features/request'
import { EnvironmentTabView } from '@/features/variables'
import type { useWorkspaceTabbarViewModel } from '@/features/workspace/viewmodels/use-workspace-tabbar.viewmodel'
import { CONTEXT_MENU_ITEM, CONTEXT_MENU_PANEL, CONTEXT_MENU_SEPARATOR } from '@/shared/components/context-menu'
import { styleWithVariables } from '@/shared/components/css-variables'
import { StateMessage } from '@/shared/components/state-message'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { cn } from '@/shared/utils/cn'

type TabbarViewModel = ReturnType<typeof useWorkspaceTabbarViewModel>

// Right-click menu for a tab. It uses the same look as the collection menu. The trigger is a zero-size anchor at the click point, and the menu is controlled by the ViewModel.
function TabContextMenuView({ menu }: { menu: TabbarViewModel['contextMenu'] }): ReactElement {
  return (
    <DropdownMenu open={menu.open} onOpenChange={menu.onOpenChange}>
      <DropdownMenuTrigger asChild>
        <span
          aria-hidden="true"
          className="pointer-events-none fixed top-[var(--menu-y)] left-[var(--menu-x)] size-px"
          style={styleWithVariables({ '--menu-x': `${menu.position.x}px`, '--menu-y': `${menu.position.y}px` })}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={CONTEXT_MENU_PANEL} data-testid="workspace-tabbar-tab-menu">
        {menu.groups.map((group, index) => (
          <Fragment key={group.map((item) => item.key).join('|')}>
            {index > 0 && <DropdownMenuSeparator className={CONTEXT_MENU_SEPARATOR} />}
            {group.map((item) => (
              <DropdownMenuItem
                key={item.key}
                disabled={item.disabled}
                className={CONTEXT_MENU_ITEM}
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
  if (badge.kind === 'method') return <span className={badge.className}>{badge.label}</span>
  return (
    <span className="text-[14px] leading-none text-primary" aria-hidden="true">
      {badge.glyph}
    </span>
  )
}

export function WorkspaceTabbarView({ tabbar }: { tabbar: TabbarViewModel }): ReactElement {
  const env = tabbar.environment
  return (
    <div className="col-span-full row-start-1 flex min-w-0 items-end gap-4 bg-background px-4 pt-2 max-[720px]:mb-2 max-[720px]:gap-2">
      <div
        className="flex min-w-0 flex-1 items-end gap-0 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label={tabbar.listLabel}
      >
        {tabbar.tabs.map((tab) => (
          <div
            className={cn(
              'group flex h-[36px] min-w-0 max-w-[220px] shrink-0 items-center rounded-t-[8px] pr-2 transition-colors',
              tab.active ? 'bg-card shadow-[0_-1px_0_var(--border)_inset]' : 'text-muted-foreground hover:bg-muted/60',
            )}
            key={tab.key}
          >
            <Button
              type="button"
              variant="ghost"
              role="tab"
              aria-selected={tab.active}
              data-testid="workspace-tabbar-tab"
              className={cn(
                'h-[36px] min-h-0 min-w-0 max-w-[190px] justify-start gap-2 rounded-none rounded-t-[8px] bg-transparent px-4 text-left text-[12px] font-normal text-inherit hover:bg-transparent focus-visible:ring-0',
                tab.active ? 'font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={tab.onSelect}
              onContextMenu={tab.onContextMenu}
            >
              <TabBadge badge={tab.badge} />
              <span className="min-w-0 truncate">{tab.title}</span>
              {tab.changed && <span className="size-[6px] shrink-0 rounded-full bg-warning" role="img" aria-label={tabbar.changedLabel} />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={cn(
                'size-[22px] min-h-0 shrink-0 rounded-md p-0 text-[15px] font-normal leading-none text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-0',
                tab.active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
              )}
              data-testid="workspace-tabbar-close"
              aria-label={tab.closeLabel}
              onClick={tab.onClose}
              onContextMenu={tab.onContextMenu}
            >
              ×
            </Button>
          </div>
        ))}
        {tabbar.emptyText && <span className="self-center px-2 pb-2 text-[12px] text-muted-foreground">{tabbar.emptyText}</span>}
      </div>
      <div className="flex min-w-0 shrink-0 items-center pb-2 max-[720px]:pb-2">
        <Select value={env.value} onValueChange={env.onChange} disabled={env.disabled}>
          <SelectTrigger
            aria-label={env.ariaLabel}
            className="h-[30px] min-h-[30px] w-[160px] rounded-md border-border bg-card text-[12px] font-medium text-foreground max-[720px]:w-[124px]"
            data-testid="workspace-tabbar-environment-select"
          >
            <SelectValue placeholder={env.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {env.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <TabContextMenuView menu={tabbar.contextMenu} />
    </div>
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
    <section className="workspace" aria-label={main.requestLabel}>
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
        <section className="request-card docs-page">
          <StateMessage
            testId="workspace-main-docs-unavailable-state"
            title={main.docsUnavailable}
            description={main.docsUnavailableDescription}
          />
        </section>
      )}
      {tabbar.pane === 'request' && requestWorkbench && <RequestWorkbenchPage {...requestWorkbench} />}
      {tabbar.pane === 'empty' && (
        <section className="request-card">
          <StateMessage testId="workspace-main-no-request-state" title={main.noRequest} description={main.noRequestDescription} />
        </section>
      )}
    </section>
  )
}
