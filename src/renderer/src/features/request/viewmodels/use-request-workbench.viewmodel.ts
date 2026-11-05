import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import { requestTabIndicators } from '@/features/request/lib/request-tab-indicators'
import { httpMethods } from '@/features/request/models/request.model'
import { useAuthEditorViewModel } from '@/features/request/viewmodels/use-auth-editor.viewmodel'
import { useBodyEditorViewModel } from '@/features/request/viewmodels/use-body-editor.viewmodel'
import { useClientCodeViewModel } from '@/features/request/viewmodels/use-client-code.viewmodel'
import { useHeadersEditorViewModel } from '@/features/request/viewmodels/use-headers-editor.viewmodel'
import { useParamsEditorViewModel } from '@/features/request/viewmodels/use-params-editor.viewmodel'
import { useResponseContractViewModel } from '@/features/request/viewmodels/use-response-contract.viewmodel'
import { useSendRequestViewModel } from '@/features/request/viewmodels/use-send-request.viewmodel'
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
  statusText: string
  suggestions: VariableSuggestion[]
  resolvedVariables: Record<string, string>
  // Changes whenever another request opens. Used to reset the response and the URL and name drafts.
  resetKey: string
  onChange: (patch: Partial<RequestNode>) => void
  onOpenDocs: () => void
  onVariableClick: (name: string, sourceValue: string) => void
}

// Composes the request builder: heading, URL line, send control, the six tabs, and the response panel.
// The Docs tab shows the markdown source or the rendered preview.
export type DocsMode = 'markdown' | 'preview'

export function useRequestWorkbenchViewModel({
  request,
  readLatestRequest,
  readOnly,
  folderName,
  statusText,
  suggestions,
  resolvedVariables,
  resetKey,
  onChange,
  onOpenDocs,
  onVariableClick,
}: RequestWorkbenchInput) {
  const { t } = useTranslation('request')
  const [docsMode, setDocsMode] = useState<DocsMode>('markdown')
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
  const sender = useSendRequestViewModel({ readRequest: readLatestRequest, resolvedVariables, resetKey })
  const timers = useSendTimersViewModel({ readRequest: readLatestRequest, send: sender.send })
  const clientCode = useClientCodeViewModel({ readRequest: readLatestRequest, resolvedVariables })
  const response = useResponseViewModel({ response: sender.response })
  const indicators = requestTabIndicators(request)

  return {
    readOnly,
    kicker: t(REQUEST_TEXT.workbench.kicker, { folder: folderName || t(REQUEST_TEXT.workbench.fallbackFolder) }),
    statusText,
    name: request.name,
    method: request.method,
    methods: [...httpMethods],
    url: request.url,
    suggestions,
    onVariableClick,
    onNameChange: (name: string) => onChange({ name }),
    onMethodChange: (method: string) => onChange({ method }),
    onUrlChange: (url: string) => onChange({ url }),
    onOpenDocs,
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
      onModeChange: setDocsMode,
    },
    scripts: {
      pre: { value: request.preScript ?? '', onChange: (preScript: string) => onChange({ preScript }) },
      post: { value: request.postScript ?? '', onChange: (postScript: string) => onChange({ postScript }) },
    },
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
