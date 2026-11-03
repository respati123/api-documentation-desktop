import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import type { RequestNode } from '@/shared/models/api-node.model'

const minSeconds = 1
const maxSeconds = 3600

function clampSeconds(value: string): number {
  return Math.min(maxSeconds, Math.max(minSeconds, Number(value) || minSeconds))
}

// Owns the send-later and repeat timers, their two dialogs, and the notice that shows while one is waiting.
// Each timer stops when the request builder unmounts.
export function useSendTimersViewModel({
  readRequest,
  send,
}: {
  readRequest: () => RequestNode
  send: (download?: boolean, requestOverride?: RequestNode) => Promise<void>
}) {
  const { t } = useTranslation('request')
  const [delayDialogOpen, setDelayDialogOpen] = useState(false)
  const [delaySeconds, setDelaySeconds] = useState('1')
  const [scheduledSeconds, setScheduledSeconds] = useState<number | null>(null)
  const [repeatDialogOpen, setRepeatDialogOpen] = useState(false)
  const [repeatSeconds, setRepeatSeconds] = useState('5')
  const [repeatRunning, setRepeatRunning] = useState(false)
  const delayTimerRef = useRef<number | undefined>(undefined)
  const repeatTimerRef = useRef<number | undefined>(undefined)
  const repeatRunIdRef = useRef(0)

  useEffect(
    () => () => {
      if (delayTimerRef.current !== undefined) window.clearTimeout(delayTimerRef.current)
      if (repeatTimerRef.current !== undefined) window.clearTimeout(repeatTimerRef.current)
      repeatRunIdRef.current += 1
    },
    [],
  )

  function handleSchedule(event: FormEvent) {
    event.preventDefault()
    const seconds = clampSeconds(delaySeconds)
    const snapshot = structuredClone(readRequest())
    if (delayTimerRef.current !== undefined) window.clearTimeout(delayTimerRef.current)
    setDelayDialogOpen(false)
    setScheduledSeconds(seconds)
    delayTimerRef.current = window.setTimeout(() => {
      delayTimerRef.current = undefined
      setScheduledSeconds(null)
      void send(false, snapshot)
    }, seconds * 1000)
  }

  function handleCancelSchedule() {
    if (delayTimerRef.current !== undefined) window.clearTimeout(delayTimerRef.current)
    delayTimerRef.current = undefined
    setScheduledSeconds(null)
  }

  function handleStopRepeating() {
    repeatRunIdRef.current += 1
    if (repeatTimerRef.current !== undefined) window.clearTimeout(repeatTimerRef.current)
    repeatTimerRef.current = undefined
    setRepeatRunning(false)
  }

  function handleStartRepeating(event: FormEvent) {
    event.preventDefault()
    const intervalMs = clampSeconds(repeatSeconds) * 1000
    const snapshot = structuredClone(readRequest())
    const runId = ++repeatRunIdRef.current
    setRepeatRunning(true)
    setRepeatDialogOpen(false)
    const sendAndSchedule = async () => {
      if (repeatRunIdRef.current !== runId) return
      await send(false, snapshot)
      if (repeatRunIdRef.current !== runId) return
      repeatTimerRef.current = window.setTimeout(() => void sendAndSchedule(), intervalMs)
    }
    void sendAndSchedule()
  }

  const repeatCount = clampSeconds(repeatSeconds)
  let notice: { text: string; actionLabel: string; onAction: () => void } | null = null
  if (scheduledSeconds !== null)
    notice = {
      text: t(REQUEST_TEXT.send.scheduled, { count: scheduledSeconds }),
      actionLabel: t(REQUEST_TEXT.send.cancel),
      onAction: handleCancelSchedule,
    }
  else if (repeatRunning)
    notice = {
      text: t(REQUEST_TEXT.send.repeating, { count: repeatCount }),
      actionLabel: t(REQUEST_TEXT.send.stop),
      onAction: handleStopRepeating,
    }

  return {
    repeatRunning,
    notice,
    onOpenDelay: () => setDelayDialogOpen(true),
    onOpenRepeat: () => setRepeatDialogOpen(true),
    onStopRepeating: handleStopRepeating,
    delayDialog: {
      open: delayDialogOpen,
      onOpenChange: setDelayDialogOpen,
      seconds: delaySeconds,
      onSecondsChange: setDelaySeconds,
      onSubmit: handleSchedule,
    },
    repeatDialog: {
      open: repeatDialogOpen,
      onOpenChange: setRepeatDialogOpen,
      seconds: repeatSeconds,
      onSecondsChange: setRepeatSeconds,
      onSubmit: handleStartRepeating,
    },
  }
}
