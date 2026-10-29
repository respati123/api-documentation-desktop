import { type FormEvent, useEffect, useRef, useState } from 'react'
import { isRequest } from '@/features/collection'
import type { ApiNode, RequestNode } from '@/shared/models/api-node.model'

type ExecuteRequest = (download?: boolean, requestOverride?: RequestNode) => Promise<void>

// Owns the send-later and repeat timers. Each timer stops on unmount.
export function useSendTimersViewModel({
  readRequest,
  executeRequest,
}: {
  readRequest: () => ApiNode | undefined
  executeRequest: ExecuteRequest
}) {
  const [sendDelayDialogOpen, setSendDelayDialogOpen] = useState(false)
  const [sendDelaySeconds, setSendDelaySeconds] = useState('1')
  const [sendNotice, setSendNotice] = useState('')
  const [repeatDialogOpen, setRepeatDialogOpen] = useState(false)
  const [repeatIntervalSeconds, setRepeatIntervalSeconds] = useState('5')
  const [repeatRunning, setRepeatRunning] = useState(false)
  const sendDelayTimerRef = useRef<number | undefined>(undefined)
  const repeatTimerRef = useRef<number | undefined>(undefined)
  const repeatRunIdRef = useRef(0)
  useEffect(
    () => () => {
      if (sendDelayTimerRef.current !== undefined) window.clearTimeout(sendDelayTimerRef.current)
      if (repeatTimerRef.current !== undefined) window.clearTimeout(repeatTimerRef.current)
      repeatRunIdRef.current += 1
    },
    [],
  )

  function scheduleRequest(event: FormEvent) {
    event.preventDefault()
    const request = readRequest()
    if (!request || !isRequest(request)) return
    const seconds = Math.min(3600, Math.max(1, Number(sendDelaySeconds) || 1))
    const requestSnapshot = structuredClone(request)
    if (sendDelayTimerRef.current !== undefined) window.clearTimeout(sendDelayTimerRef.current)
    setSendDelayDialogOpen(false)
    setSendNotice(`Sending in ${seconds} second${seconds === 1 ? '' : 's'}.`)
    sendDelayTimerRef.current = window.setTimeout(() => {
      sendDelayTimerRef.current = undefined
      setSendNotice('')
      void executeRequest(false, requestSnapshot)
    }, seconds * 1000)
  }

  function cancelScheduledRequest() {
    if (sendDelayTimerRef.current !== undefined) window.clearTimeout(sendDelayTimerRef.current)
    sendDelayTimerRef.current = undefined
    setSendNotice('')
  }

  function stopRepeating() {
    repeatRunIdRef.current += 1
    if (repeatTimerRef.current !== undefined) window.clearTimeout(repeatTimerRef.current)
    repeatTimerRef.current = undefined
    setRepeatRunning(false)
  }

  function startRepeating(event: FormEvent) {
    event.preventDefault()
    const request = readRequest()
    if (!request || !isRequest(request)) return
    const intervalMs = Math.min(3600, Math.max(1, Number(repeatIntervalSeconds) || 1)) * 1000
    const requestSnapshot = structuredClone(request)
    const runId = ++repeatRunIdRef.current
    setRepeatRunning(true)
    setRepeatDialogOpen(false)
    const sendAndSchedule = async () => {
      if (repeatRunIdRef.current !== runId) return
      await executeRequest(false, requestSnapshot)
      if (repeatRunIdRef.current !== runId) return
      repeatTimerRef.current = window.setTimeout(() => void sendAndSchedule(), intervalMs)
    }
    void sendAndSchedule()
  }

  return {
    sendDelayDialogOpen,
    setSendDelayDialogOpen,
    sendDelaySeconds,
    setSendDelaySeconds,
    sendNotice,
    repeatDialogOpen,
    setRepeatDialogOpen,
    repeatIntervalSeconds,
    setRepeatIntervalSeconds,
    repeatRunning,
    scheduleRequest,
    cancelScheduledRequest,
    stopRepeating,
    startRepeating,
  }
}
