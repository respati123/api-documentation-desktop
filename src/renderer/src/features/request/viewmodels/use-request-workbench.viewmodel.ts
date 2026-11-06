import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import { requestTabIndicators } from '@/features/request/lib/request-tab-indicators'
import { scriptApiEntries, scriptApiGroups } from '@/features/request/lib/script-api'
import type { ScriptContext } from '@/features/request/lib/script-run'
import { httpMethods } from '@/features/request/models/request.model'
import { useAuthEditorViewModel } from '@/features/request/viewmodels/use-auth-editor.viewmodel'
import { useBodyEditorViewModel } from '@/features/request/viewmodels/use-body-editor.viewmodel'
import { useClientCodeViewModel } from '@/features/request/viewmodels/use-client-code.viewmodel'
import { useHeadersEditorViewModel } from '@/features/request/viewmodels/use-headers-editor.viewmodel'
import { useParamsEditorViewModel } from '@/features/request/viewmodels/use-params-editor.viewmodel'
import { useResponseContractViewModel } from '@/features/request/viewmodels/use-response-contract.viewmodel'
import { useScriptEditorViewModel } from '@/features/request/viewmodels/use-script-editor.viewmodel'
import { type SentResult, useSendRequestViewModel } from '@/features/request/viewmodels/use-send-request.viewmodel'
import { useSendTimersViewModel } from '@/features/request/viewmodels/use-send-timers.viewmodel'
import { useResponseViewModel } from '@/features/response'
import type { VariableSuggestion } from '@/shared/components/variable-field'
import type { RequestNode } from '@/shared/models/api-node.model'

export interface RequestWorkbenchInput {
  request: RequestNode
  // The latest edit, which can be newer than `request` while a debounced field is still flushing.
  readLatestRequest: () => RequestNode
  readOnly: boolean
  folderName: string
  suggestions: VariableSuggestion[]
  resolvedVariables: Record<string, string>
  // The variables and the environment the scripts read and write.
  scriptContext: ScriptContext
  // Changes whenever another request opens. Used to reset the response and the URL and name drafts.
  resetKey: string
  onChange: (patch: Partial<RequestNode>) => void
  onSent?: (result: SentResult) => void
  onVariableClick: (name: string, sourceValue: string) => void
}

// Composes the request builder: heading, URL line, send control, the six tabs, and the response panel.
// The Docs tab shows the markdown source or the rendered preview.
export type DocsMode = 'markdown' | 'preview'
const isDocsMode = (value: string): value is DocsMode => value === 'markdown' || value === 'preview'

// The URL with its variables filled in. A secret stays as its token, so its value never shows on screen.
function resolveUrl(url: string, suggestions: VariableSuggestion[]): string {
  const byName = new Map(suggestions.map((item) => [item.name, item]))
  return url.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (token, name: string) => {
    const item = byName.get(name)
    return item?.value && !item.secret ? item.value : token
  })
}

export function useRequestWorkbenchViewModel({
  request,
  readLatestRequest,
  readOnly,
  folderName,
  suggestions,
  resolvedVariables,
  scriptContext,
  resetKey,
  onChange,
  onSent,
  onVariableClick,
}: RequestWorkbenchInput) {
  const { t } = useTranslation('request')
  const [docsMode, setDocsMode] = useState<DocsMode>('preview')
  // A choice of tab belongs to the request it was made on. Another request opens on its own default tab.
  const [tabChoice, setTabChoice] = useState<{ tab: string; key: string } | null>(null)
  const editorInput = { request, readOnly, suggestions, onVariableClick, onChange }

  const params = useParamsEditorViewModel(editorInput)
  const body = useBodyEditorViewModel(editorInput)
  const auth = useAuthEditorViewModel(editorInput)
  const headers = useHeadersEditorViewModel(editorInput)
  const contract = useResponseContractViewModel({
    responses: request.responses ?? [],
    readOnly,
    onChange: (responses) => onChange({ responses }),
  })
  const sender = useSendRequestViewModel({ readRequest: readLatestRequest, scriptContext, resetKey, onSent })
  // The editors mark the line where their script failed in the last run, so they read that run.
  const preRun = sender.scripts?.pre ?? null
  const postRun = sender.scripts?.post ?? null
  const preScript = useScriptEditorViewModel({
    phase: 'pre',
    value: request.preScript ?? '',
    onChange: (script: string) => onChange({ preScript: script }),
    readOnly,
    ariaLabel: t(REQUEST_TEXT.workbench.preScriptLabel),
    runErrorLine: preRun && !preRun.ok ? preRun.errorLine : null,
    runErrorMessage: preRun?.error ?? '',
  })
  const postScript = useScriptEditorViewModel({
    phase: 'post',
    value: request.postScript ?? '',
    onChange: (script: string) => onChange({ postScript: script }),
    readOnly,
    ariaLabel: t(REQUEST_TEXT.workbench.postScriptLabel),
    runErrorLine: postRun && !postRun.ok ? postRun.errorLine : null,
    runErrorMessage: postRun?.error ?? '',
  })
  const timers = useSendTimersViewModel({ readRequest: readLatestRequest, send: sender.send })
  const clientCode = useClientCodeViewModel({ readRequest: readLatestRequest, resolvedVariables })
  const response = useResponseViewModel({
    response: sender.response,
    scripts: sender.scripts,
    onSaveExample: readOnly ? undefined : contract.onSaveExample,
  })
  const indicators = requestTabIndicators(request)
  const resolved = resolveUrl(request.url, suggestions)
  const unresolved = resolved === request.url && resolved.includes('{{')
  const scriptReference = {
    title: t(REQUEST_TEXT.reference.title),
    groups: scriptApiGroups.map((group) => ({
      key: group.key,
      title: t(group.titleKey),
      entries: scriptApiEntries
        .filter((entry) => entry.group === group.key)
        .map((entry) => ({
          signature: entry.signature,
          description: t(entry.descriptionKey),
          phase:
            entry.phase === 'pre' ? t(REQUEST_TEXT.reference.preOnly) : entry.phase === 'post' ? t(REQUEST_TEXT.reference.postOnly) : '',
        })),
    })),
  }

  return {
    readOnly,
    folderLabel: t(REQUEST_TEXT.workbench.kicker, { folder: folderName || t(REQUEST_TEXT.workbench.fallbackFolder) }),
    resolvedUrl: unresolved ? t(REQUEST_TEXT.workbench.unresolved) : resolved,
    name: request.name,
    method: request.method,
    methods: [...httpMethods],
    url: request.url,
    suggestions,
    onVariableClick,
    onNameChange: (name: string) => onChange({ name }),
    onMethodChange: (method: string) => onChange({ method }),
    onUrlChange: (url: string) => onChange({ url }),
    send: {
      isSending: sender.isSending,
      label: t(sender.isSending ? REQUEST_TEXT.send.sending : REQUEST_TEXT.send.send),
      downloadAfterSend: sender.downloadAfterSend,
      repeatRunning: timers.repeatRunning,
      notice: timers.notice,
      onSubmit: (event: FormEvent) => {
        event.preventDefault()
        void sender.send()
      },
      onSendNow: () => void sender.send(),
      onSendAndDownload: () => void sender.send(true),
      onToggleDownload: sender.onToggleDownload,
      onOpenClientCode: clientCode.onOpen,
      onOpenDelay: timers.onOpenDelay,
      onOpenRepeat: timers.onOpenRepeat,
      onStopRepeating: timers.onStopRepeating,
    },
    tabs: {
      value: tabChoice?.key === resetKey ? tabChoice.tab : indicators.hasBody ? 'body' : 'params',
      onChange: (tab: string) => setTabChoice({ tab, key: resetKey }),
      hasScripts: Boolean(request.preScript?.trim() || request.postScript?.trim()),
      activeParams: indicators.activeParams,
      activeParamsText: t(REQUEST_TEXT.tabs.paramsActive, { count: indicators.activeParams }),
      hasBody: indicators.hasBody,
      hasAuth: indicators.hasAuth,
      headers: indicators.headers,
      headersText: t(REQUEST_TEXT.tabs.headersActive, { count: indicators.headers }),
      responses: indicators.responses,
    },
    docs: {
      value: request.documentation ?? '',
      onChange: (documentation: string) => onChange({ documentation }),
      mode: docsMode,
      modeOptions: [
        { value: 'markdown', label: t(REQUEST_TEXT.workbench.modeMarkdown) },
        { value: 'preview', label: t(REQUEST_TEXT.workbench.modePreview) },
      ],
      onModeChange: (mode: string) => {
        if (isDocsMode(mode)) setDocsMode(mode)
      },
    },
    scripts: { pre: preScript, post: postScript, reference: scriptReference },
    params,
    body,
    auth,
    headers,
    contract,
    delayDialog: timers.delayDialog,
    repeatDialog: timers.repeatDialog,
    clientCode,
    response,
  }
}
