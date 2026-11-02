import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import { buildCurlCommand } from '@/features/request/lib/curl'
import { resolveRequestVariables } from '@/lib/workspace-variables'
import type { RequestNode } from '@/shared/models/api-node.model'

// Owns the generate-client-code dialog: the cURL command and the copy status.
export function useClientCodeViewModel({
  readRequest,
  resolvedVariables,
}: {
  readRequest: () => RequestNode
  resolvedVariables: Record<string, string>
}) {
  const { t } = useTranslation('request')
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('')

  function handleOpen() {
    const request = readRequest()
    try {
      setCode(buildCurlCommand(resolveRequestVariables(request, resolvedVariables)))
      setStatus('')
    } catch (error) {
      setCode(buildCurlCommand(request))
      setStatus(error instanceof Error ? error.message : t(REQUEST_TEXT.clientCode.unresolved))
    }
    setOpen(true)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setStatus(t(REQUEST_TEXT.clientCode.copied))
    } catch {
      setStatus(t(REQUEST_TEXT.clientCode.clipboardUnavailable))
    }
  }

  return { open, onOpenChange: setOpen, code, status, onOpen: handleOpen, onCopy: handleCopy }
}
