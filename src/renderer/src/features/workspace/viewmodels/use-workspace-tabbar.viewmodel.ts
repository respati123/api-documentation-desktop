import { type MouseEvent, useState } from 'react'
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
  canCreateRequest: boolean
  onSelectTab: (tab: WorkspaceTab) => void
  onCloseTab: (tab: WorkspaceTab) => void
  onCloseOtherTabs: (tab: WorkspaceTab) => void
  onCloseAllTabs: () => void
  onNewRequest: () => void
  onDuplicateTab: (tab: WorkspaceTab) => void
  onRevealTab: (tab: WorkspaceTab) => void
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
export type TabMenuItem = {
  key: string
  label: string
  disabled: boolean
  onSelect: () => void
}

export function useWorkspaceTabbarViewModel(input: TabbarInput) {
  const { t } = useTranslation('workspace')
  const [menu, setMenu] = useState<{ key: string; x: number; y: number } | null>(null)

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
        onContextMenu: (event: MouseEvent<HTMLElement>) => {
          event.preventDefault()
          setMenu({ key, x: event.clientX, y: event.clientY })
        },
      },
    ]
  })

  const contextTab = menu ? input.tabs.find((tab) => workspaceTabKey(tab) === menu.key) : undefined
  const contextIsDocumentable = contextTab?.kind === 'request' || contextTab?.kind === 'docs'
  const menuLabels = {
    newRequest: t(WORKSPACE_TEXT.tabs.menu.newRequest),
    duplicate: t(WORKSPACE_TEXT.tabs.menu.duplicate),
    close: t(WORKSPACE_TEXT.tabs.menu.close),
    forceClose: t(WORKSPACE_TEXT.tabs.menu.forceClose),
    closeOthers: t(WORKSPACE_TEXT.tabs.menu.closeOthers),
    closeAll: t(WORKSPACE_TEXT.tabs.menu.closeAll),
    forceCloseAll: t(WORKSPACE_TEXT.tabs.menu.forceCloseAll),
    reveal: t(WORKSPACE_TEXT.tabs.menu.reveal),
  }
  // Each group is separated by a divider in the view. Items that need the clicked tab are disabled when there is none.
  const contextMenuGroups: TabMenuItem[][] = [
    [
      { key: 'new-request', label: menuLabels.newRequest, disabled: false, onSelect: input.onNewRequest },
      {
        key: 'duplicate',
        label: menuLabels.duplicate,
        disabled: !contextIsDocumentable,
        onSelect: () => {
          if (contextTab && contextIsDocumentable) input.onDuplicateTab(contextTab)
        },
      },
    ],
    [
      {
        key: 'close',
        label: menuLabels.close,
        disabled: !contextTab,
        onSelect: () => contextTab && input.onCloseTab(contextTab),
      },
      {
        key: 'force-close',
        label: menuLabels.forceClose,
        disabled: !contextTab,
        onSelect: () => contextTab && input.onCloseTab(contextTab),
      },
      {
        key: 'close-others',
        label: menuLabels.closeOthers,
        disabled: !contextTab || input.tabs.length < 2,
        onSelect: () => contextTab && input.onCloseOtherTabs(contextTab),
      },
      {
        key: 'close-all',
        label: menuLabels.closeAll,
        disabled: !input.tabs.length,
        onSelect: input.onCloseAllTabs,
      },
      {
        key: 'force-close-all',
        label: menuLabels.forceCloseAll,
        disabled: !input.tabs.length,
        onSelect: input.onCloseAllTabs,
      },
    ],
    [
      {
        key: 'reveal',
        label: menuLabels.reveal,
        disabled: !contextTab,
        onSelect: () => contextTab && input.onRevealTab(contextTab),
      },
    ],
  ]

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
    contextMenu: {
      open: menu !== null,
      position: { x: menu?.x ?? 0, y: menu?.y ?? 0 },
      onOpenChange: (open: boolean) => {
        if (!open) setMenu(null)
      },
      groups: contextMenuGroups,
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
      newRequest: {
        label: t(WORKSPACE_TEXT.main.newRequest),
        disabled: !input.canCreateRequest,
        onClick: input.onNewRequest,
      },
    },
  }
}
