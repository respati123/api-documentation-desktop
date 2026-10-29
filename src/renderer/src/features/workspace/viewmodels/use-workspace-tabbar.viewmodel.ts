import { useTranslation } from 'react-i18next'
import { isRequest } from '@/features/collection'
import { WORKSPACE_TEXT } from '@/features/workspace/constants/workspace-text.constants'
import { workspaceTabKey } from '@/features/workspace/lib/workspace-tabs'
import type { WorkspaceTab } from '@/features/workspace/models/workspace.model'
import type { WorkspaceEnvironment } from '@/lib/workspace-variables'
import type { ApiNode, RequestNode } from '@/shared/models/api-node.model'

// The Select value that means "no environment". It is never a real environment id.
export const NO_ENVIRONMENT = 'none'

export type TabbarInput = {
  tabs: WorkspaceTab[]
  environments: WorkspaceEnvironment[]
  nodeById: ReadonlyMap<string, ApiNode>
  changeById: ReadonlyMap<string, unknown>
  activeTabKey: string
  activeTab: WorkspaceTab | undefined
  activeEnvironmentId: string | null
  hasRequests: boolean
  hasWorkspace: boolean
  activeFolderName: string | null
  activeDocsRequest: ApiNode | undefined
  hasRequestWorkbench: boolean
  onSelectTab: (tab: WorkspaceTab) => void
  onCloseTab: (tab: WorkspaceTab) => void
  onReadDocs: () => void
  onOpenVariables: () => void
  onEnvironmentChange: (environmentId: string | null) => void
  onOpenRequest: (requestId: string) => void
  onOpenOpenApi: () => void
}

export type TabBadge =
  | { kind: 'docs'; label: string }
  | { kind: 'method'; label: string; className: string }
  | { kind: 'environment'; glyph: string }

const environmentGlyph = '◎'

// The workspace tab bar, its environment picker, and which pane shows below it.
export function useWorkspaceTabbarViewModel(input: TabbarInput) {
  const { t } = useTranslation('workspace')

  const tabs = input.tabs.flatMap((tab) => {
    const node = tab.kind === 'request' || tab.kind === 'docs' ? input.nodeById.get(tab.id) : undefined
    const request = node && isRequest(node) ? node : undefined
    const environment = tab.kind === 'environment' ? input.environments.find((item) => item.id === tab.id) : undefined
    if ((tab.kind === 'request' || tab.kind === 'docs') && !request) return []
    if (tab.kind === 'environment' && !environment) return []

    const title =
      tab.kind === 'docs'
        ? t(WORKSPACE_TEXT.tabs.docsTitle, { name: request?.name ?? t(WORKSPACE_TEXT.tabs.request) })
        : (request?.name ?? environment?.name ?? t(WORKSPACE_TEXT.tabs.environment))
    const badge: TabBadge =
      tab.kind === 'docs'
        ? { kind: 'docs', label: t(WORKSPACE_TEXT.tabs.docsBadge) }
        : request
          ? { kind: 'method', label: request.method, className: `workspace-tab-method method-${request.method.toLowerCase()}` }
          : { kind: 'environment', glyph: environmentGlyph }
    const key = workspaceTabKey(tab)
    return [
      {
        key,
        active: key === input.activeTabKey,
        title,
        badge,
        changed: tab.kind !== 'environment' && Boolean(request && input.changeById.has(request.id)),
        closeLabel: t(WORKSPACE_TEXT.tabs.close, { title }),
        onSelect: () => input.onSelectTab(tab),
        onClose: () => input.onCloseTab(tab),
      },
    ]
  })

  const environmentValue = input.environments.some((environment) => environment.id === input.activeEnvironmentId)
    ? (input.activeEnvironmentId ?? NO_ENVIRONMENT)
    : NO_ENVIRONMENT

  const docsRequest: RequestNode | null = input.activeDocsRequest && isRequest(input.activeDocsRequest) ? input.activeDocsRequest : null
  const pane =
    input.activeTab?.kind === 'environment'
      ? 'environment'
      : input.activeTab?.kind === 'docs'
        ? docsRequest
          ? 'docs'
          : 'docsUnavailable'
        : input.hasRequestWorkbench
          ? 'request'
          : 'empty'

  return {
    listLabel: t(WORKSPACE_TEXT.tabs.list),
    emptyText: input.tabs.length ? null : t(WORKSPACE_TEXT.tabs.empty),
    tabs,
    changedLabel: t(WORKSPACE_TEXT.tabs.changed),
    readDocs: { label: t(WORKSPACE_TEXT.tabs.readDocs), disabled: !input.hasRequests, onClick: input.onReadDocs },
    environment: {
      label: t(WORKSPACE_TEXT.tabs.environmentLabel),
      ariaLabel: t(WORKSPACE_TEXT.tabs.activeEnvironment),
      value: environmentValue,
      placeholder: t(WORKSPACE_TEXT.tabs.noEnvironment),
      disabled: !input.environments.length,
      options: [
        { value: NO_ENVIRONMENT, label: t(WORKSPACE_TEXT.tabs.noEnvironment) },
        ...input.environments.map((environment) => ({ value: environment.id, label: environment.name })),
      ],
      onChange: (value: string) => input.onEnvironmentChange(value === NO_ENVIRONMENT ? null : value),
    },
    variables: { label: t(WORKSPACE_TEXT.tabs.variables), disabled: !input.hasWorkspace, onClick: input.onOpenVariables },
    pane,
    docsRequest,
    docsFolderName: input.activeFolderName ?? t(WORKSPACE_TEXT.main.folderFallback),
    onOpenDocsRequest: () => {
      if (docsRequest) input.onOpenRequest(docsRequest.id)
    },
    onOpenOpenApi: input.onOpenOpenApi,
    main: {
      requestLabel: t(WORKSPACE_TEXT.main.requestWorkspace),
      docsUnavailable: t(WORKSPACE_TEXT.main.docsUnavailable),
      docsUnavailableDescription: t(WORKSPACE_TEXT.main.docsUnavailableDescription),
      noRequest: t(WORKSPACE_TEXT.main.noRequest),
      noRequestDescription: t(WORKSPACE_TEXT.main.noRequestDescription),
    },
  }
}
