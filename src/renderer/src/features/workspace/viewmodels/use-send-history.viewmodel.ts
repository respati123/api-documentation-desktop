import { useState } from 'react'
import type { SentResult } from '@/features/request'

export type SendHistoryEntry = SentResult & { key: string; at: string }

const LIMIT = 100

// The requests sent in this session, newest first. It is not saved, so it starts empty each time the app opens.
export function useSendHistoryViewModel() {
  const [entries, setEntries] = useState<SendHistoryEntry[]>([])
  const lastSendById = new Map<string, 'ok' | 'error'>()
  for (const entry of [...entries].reverse()) lastSendById.set(entry.requestId, entry.status < 400 ? 'ok' : 'error')

  return {
    entries,
    lastSendById,
    add: (result: SentResult) =>
      setEntries((current) =>
        [
          {
            ...result,
            key: crypto.randomUUID(),
            at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...current,
        ].slice(0, LIMIT),
      ),
  }
}
