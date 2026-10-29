import { useMutation } from '@tanstack/react-query'
import { useEffect, useEffectEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import { toApiRequest } from '@/features/request/lib/api-request'
import { requestService } from '@/features/request/services/request.service'
import { downloadResponse, type ResponseState } from '@/features/response'
import { resolveRequestVariables } from '@/lib/workspace-variables'
import type { RequestNode } from '@/shared/models/api-node.model'

type SendInput = { request: RequestNode; download: boolean; resetKey: string }

// Owns sending: the mutation, the response it produces, the download option, and the Ctrl+Enter shortcut.
export function useSendRequestViewModel({
  readRequest,
  resolvedVariables,
  resetKey,
}: {
  readRequest: () => RequestNode
  resolvedVariables: Record<string, string>
  // Changes when another request opens, so an old response never shows under the new request.
  resetKey: string
}) {
  const { t } = useTranslation('request')
  const [downloadAfterSend, setDownloadAfterSend] = useState(false)

  const mutation = useMutation({
    mutationFn: async ({ request }: SendInput) => {
      if (!request.url.trim()) throw new Error(t(REQUEST_TEXT.send.urlRequired))
      return requestService.send(toApiRequest(resolveRequestVariables(request, resolvedVariables)))
    },
    onSuccess: (data, { request, download }) => {
      if (download || downloadAfterSend) downloadResponse(data, request.name)
    },
  })

  let response: ResponseState = { kind: 'empty' }
  const belongsHere = mutation.variables?.resetKey === resetKey
  if (!belongsHere) response = { kind: 'empty' }
  else if (mutation.isPending) response = { kind: 'loading' }
  else if (mutation.isError) response = { kind: 'error', message: mutation.error.message || t(REQUEST_TEXT.send.failed) }
  else if (mutation.data) response = { kind: 'success', data: mutation.data }

  // Resolves when the request finishes, whether it worked or not. The result lands in `response`.
  async function send(download = false, requestOverride?: RequestNode): Promise<void> {
    await mutation.mutateAsync({ request: requestOverride ?? readRequest(), download, resetKey }).catch(() => undefined)
  }

  const handleShortcut = useEffectEvent((event: KeyboardEvent) => {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault()
      if (!mutation.isPending) void send()
    }
  })
  useEffect(() => {
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  return {
    response,
    isSending: mutation.isPending,
    downloadAfterSend,
    onToggleDownload: () => setDownloadAfterSend((enabled) => !enabled),
    send,
  }
}
