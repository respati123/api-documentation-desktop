import { useMutation } from '@tanstack/react-query'
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import { toApiRequest } from '@/features/request/lib/api-request'
import {
  applyScriptRequest,
  applyVariableChanges,
  type ScriptContext,
  scriptResponse,
  scriptVariableValues,
  secretValuesOf,
  toScriptRequest,
} from '@/features/request/lib/script-run'
import { requestService } from '@/features/request/services/request.service'
import { downloadResponse, type ResponseData, type ResponseState, type ScriptRuns } from '@/features/response'
import { activeVariableValues, resolveRequestVariables } from '@/lib/workspace-variables'
import type { ScriptRunResult } from '@/shared/ipc/script-contract'
import type { RequestNode } from '@/shared/models/api-node.model'

type SendInput = { request: RequestNode; download: boolean; resetKey: string }

// A send either reaches the server, or stops with a message. Either way the script runs that happened are kept for the Inspector.
type SendOutcome =
  | { status: 'sent'; response: ResponseData; scripts: ScriptRuns }
  | { status: 'failed'; message: string; scripts: ScriptRuns }

// Owns sending: the scripts around the request, the mutation, the response it produces, the download option, and the Ctrl+Enter shortcut.
export function useSendRequestViewModel({
  readRequest,
  scriptContext,
  resetKey,
}: {
  readRequest: () => RequestNode
  scriptContext: ScriptContext
  // Changes when another request opens, so an old response never shows under the new request.
  resetKey: string
}) {
  const { t } = useTranslation('request')
  const [downloadAfterSend, setDownloadAfterSend] = useState(false)
  // A repeat timer can call send from an earlier render, so the send reads the variables through this ref.
  const contextRef = useRef(scriptContext)
  useLayoutEffect(() => {
    contextRef.current = scriptContext
  })

  // Runs the pre-request script, sends the request it returns, then runs the post-response script.
  // Variable writes are saved as each script finishes, and the next step uses the saved values.
  async function runSend(request: RequestNode): Promise<SendOutcome> {
    const context = contextRef.current
    const environmentId = context.activeEnvironmentId
    const scripts: ScriptRuns = { pre: null, post: null, skipped: [] }
    let variables = context.variables
    const applyRun = (run: ScriptRunResult) => {
      const applied = applyVariableChanges(variables, environmentId, run)
      variables = applied.variables
      scripts.skipped.push(...applied.skipped)
      if (run.writes.length > 0 || run.removals.length > 0) context.updateVariables(variables)
    }

    try {
      let current = request
      const preScript = request.preScript ?? ''
      if (preScript.trim()) {
        const pre = await requestService.runScript({
          phase: 'pre',
          source: preScript,
          variables: scriptVariableValues(variables, environmentId),
          secretValues: secretValuesOf(variables),
          request: toScriptRequest(request),
        })
        scripts.pre = pre
        if (!pre.ok) return { status: 'failed', message: pre.error ?? t(REQUEST_TEXT.send.preScriptFailed), scripts }
        if (pre.request) current = applyScriptRequest(request, pre.request)
        applyRun(pre)
      }

      if (!current.url.trim()) return { status: 'failed', message: t(REQUEST_TEXT.send.urlRequired), scripts }
      const data = await requestService.send(toApiRequest(resolveRequestVariables(current, activeVariableValues(variables, environmentId))))

      const postScript = current.postScript ?? ''
      if (postScript.trim()) {
        const post = await requestService.runScript({
          phase: 'post',
          source: postScript,
          variables: scriptVariableValues(variables, environmentId),
          secretValues: secretValuesOf(variables),
          request: toScriptRequest(current),
          response: scriptResponse(data),
        })
        scripts.post = post
        applyRun(post)
      }
      return { status: 'sent', response: data, scripts }
    } catch (error) {
      return {
        status: 'failed',
        message: error instanceof Error && error.message ? error.message : t(REQUEST_TEXT.send.failed),
        scripts,
      }
    }
  }

  const mutation = useMutation({
    mutationFn: ({ request }: SendInput) => runSend(request),
    onSuccess: (outcome, { request, download }) => {
      if (outcome.status === 'sent' && (download || downloadAfterSend)) downloadResponse(outcome.response, request.name)
    },
  })

  const belongsHere = mutation.variables?.resetKey === resetKey
  const outcome = belongsHere ? mutation.data : undefined
  let response: ResponseState = { kind: 'empty' }
  if (!belongsHere) response = { kind: 'empty' }
  else if (mutation.isPending) response = { kind: 'loading' }
  else if (mutation.isError) response = { kind: 'error', message: mutation.error.message || t(REQUEST_TEXT.send.failed) }
  else if (outcome?.status === 'sent') response = { kind: 'success', data: outcome.response }
  else if (outcome?.status === 'failed') response = { kind: 'error', message: outcome.message }
  const scripts = outcome?.scripts ?? null

  // Resolves when the request finishes, whether it worked or not. The result lands in `response` and `scripts`.
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
    scripts,
    isSending: mutation.isPending,
    downloadAfterSend,
    onToggleDownload: () => setDownloadAfterSend((enabled) => !enabled),
    send,
  }
}
