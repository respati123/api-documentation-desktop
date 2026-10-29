import { type Dispatch, type SetStateAction, useEffect, useEffectEvent } from 'react'
import { type CloudWorkspace, cloudWorkspaceService, syncService } from '@/features/sync'
import { workspaceUpdateEventSchema } from '@/features/workspace/models/workspace.model'
import { apiWebSocketUrl } from '@/lib/api'

export type CloudRealtimeInput = {
  sessionToken: string | null
  cloudWorkspaceCount: number
  setCloudWorkspaces: Dispatch<SetStateAction<CloudWorkspace[]>>
  onStatus: (message: string) => void
}

// The cloud workspace list. Callers keep their last known list when a request fails.
async function fetchCloudWorkspaces(token: string): Promise<CloudWorkspace[]> {
  return cloudWorkspaceService.list(token)
}

// Keeps cloud head commits fresh: a 30-second poll while cloud workspaces exist, and a refresh on every reconnect of the sync event socket.
export function useCloudRealtimeViewModel(input: CloudRealtimeInput) {
  const { sessionToken, cloudWorkspaceCount, setCloudWorkspaces } = input
  const reportStatus = useEffectEvent((message: string) => input.onStatus(message))

  useEffect(() => {
    if (!sessionToken || !cloudWorkspaceCount) return
    let active = true
    const refreshCloudHeads = async () => {
      try {
        const workspaces = await fetchCloudWorkspaces(sessionToken)
        if (active) setCloudWorkspaces(workspaces)
      } catch {
        // Keep the last known cloud status when the network is temporarily unavailable.
      }
    }
    void refreshCloudHeads()
    const timer = window.setInterval(() => void refreshCloudHeads(), 30_000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [sessionToken, cloudWorkspaceCount, setCloudWorkspaces])

  useEffect(() => {
    if (!sessionToken) return
    let active = true
    let socket: WebSocket | undefined
    let reconnectTimer: number | undefined
    let reconnectAttempt = 0

    const refreshCloudHeads = async () => {
      try {
        const workspaces = await fetchCloudWorkspaces(sessionToken)
        if (active) setCloudWorkspaces(workspaces)
      } catch {
        // The existing polling fallback will retry when the current workspace is cloud-backed.
      }
    }

    const scheduleReconnect = () => {
      if (!active || reconnectTimer !== undefined) return
      const delay = Math.min(30_000, 1_000 * 2 ** Math.min(reconnectAttempt, 5))
      reconnectAttempt += 1
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = undefined
        void connect()
      }, delay)
    }

    const connect = async () => {
      try {
        const ticket = await syncService.eventsTicket(sessionToken)
        if (!active) return
        const endpoint = new URL(apiWebSocketUrl('/api/sync/events'))
        endpoint.searchParams.set('ticket', ticket)
        const connection = new WebSocket(endpoint.toString())
        socket = connection
        connection.addEventListener(
          'open',
          () => {
            reconnectAttempt = 0
            void refreshCloudHeads()
          },
          { once: true },
        )
        connection.addEventListener('message', (messageEvent) => {
          try {
            const update = workspaceUpdateEventSchema.parse(JSON.parse(String(messageEvent.data)))
            setCloudWorkspaces((current) =>
              current.map((workspace) =>
                workspace.id === update.workspaceId ? { ...workspace, headCommitId: update.headCommitId } : workspace,
              ),
            )
            const count = update.commitCount === 1 ? '1 commit' : `${update.commitCount ?? 0} commits`
            const actor = update.actorEmail ?? 'A teammate'
            const message = update.message === undefined ? '' : `: “${update.message}”`
            reportStatus(`${actor} pushed ${count}${message}. Pull to get updates.`)
          } catch {
            // Ignore malformed messages and keep the sync connection available.
          }
        })
        connection.addEventListener('close', scheduleReconnect, { once: true })
        connection.addEventListener('error', () => connection.close(), { once: true })
      } catch {
        scheduleReconnect()
      }
    }

    void connect()
    return () => {
      active = false
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer)
      socket?.close(1000, 'Session ended')
    }
  }, [sessionToken, setCloudWorkspaces])
}
