import type { ComponentProps, ReactElement } from 'react'
import { ApiReferencePage } from '@/features/docs'
import { RequestWorkbenchPage } from '@/features/request'
import { EnvironmentTabView } from '@/features/variables'
import type { useWorkspaceTabbarViewModel } from '@/features/workspace/viewmodels/use-workspace-tabbar.viewmodel'
import { StateMessage } from '@/shared/components/state-message'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { cn } from '@/shared/utils/cn'

type TabbarViewModel = ReturnType<typeof useWorkspaceTabbarViewModel>

function TabBadge({ badge }: { badge: TabbarViewModel['tabs'][number]['badge'] }): ReactElement {
  if (badge.kind === 'docs')
    return (
      <span className="workspace-tab-docs" aria-hidden="true">
        {badge.label}
      </span>
    )
  if (badge.kind === 'method') return <span className={badge.className}>{badge.label}</span>
  return (
    <span className="workspace-tab-environment" aria-hidden="true">
      {badge.glyph}
    </span>
  )
}

export function WorkspaceTabbarView({ tabbar }: { tabbar: TabbarViewModel }): ReactElement {
  const env = tabbar.environment
  return (
    <div className="workspace-tabs-row">
      <div className="workspace-tabbar" role="tablist" aria-label={tabbar.listLabel}>
        {tabbar.tabs.map((tab) => (
          <div className="workspace-tab-item" key={tab.key}>
            <Button
              type="button"
              variant="ghost"
              role="tab"
              aria-selected={tab.active}
              data-testid="workspace-tabbar-tab"
              className={cn('workspace-tab min-h-0 justify-start font-normal focus-visible:ring-0', tab.active && 'workspace-tab-active')}
              onClick={tab.onSelect}
            >
              <TabBadge badge={tab.badge} />
              <span className="workspace-tab-title">{tab.title}</span>
              {tab.changed && <span className="workspace-tab-change" role="img" aria-label={tabbar.changedLabel} />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="workspace-tab-close min-h-0 px-0 font-normal focus-visible:ring-0"
              data-testid="workspace-tabbar-close"
              aria-label={tab.closeLabel}
              onClick={tab.onClose}
            >
              ×
            </Button>
          </div>
        ))}
        {tabbar.emptyText && <span className="workspace-tab-empty">{tabbar.emptyText}</span>}
      </div>
      <div className="workspace-tab-actions">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="workspace-docs-button"
          data-testid="workspace-tabbar-read-docs"
          disabled={tabbar.readDocs.disabled}
          onClick={tabbar.readDocs.onClick}
        >
          {tabbar.readDocs.label}
        </Button>
        <div className="active-environment-control">
          <span>{env.label}</span>
          <Select value={env.value} onValueChange={env.onChange} disabled={env.disabled}>
            <SelectTrigger
              aria-label={env.ariaLabel}
              className="active-environment-select"
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="workspace-variables-button"
          data-testid="workspace-tabbar-variables"
          disabled={tabbar.variables.disabled}
          onClick={tabbar.variables.onClick}
        >
          {tabbar.variables.label}
        </Button>
      </div>
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
