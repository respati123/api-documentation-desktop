import { type Dispatch, type SetStateAction, useEffect, useEffectEvent } from 'react'
import { type CloudWorkspace, cloudWorkspaceService, syncService } from '@/features/sync'
import { parseWorkspaceEvent, type WorkspaceUpdateEvent } from '@/features/workspace/models/workspace.model'
import { apiWebSocketUrl } from '@/lib/api'

export type CloudRealtimeInput = {
  sessionToken: string | null
  setCloudWorkspaces: Dispatch<SetStateAction<CloudWorkspace[]>>
  // Called for each head move. The owner of the workspace state decides whether to pull, or to ask the user to.
  onWorkspaceUpdated: (event: WorkspaceUpdateEvent) => void
  // Called when a workspace was created, renamed, or changed role, so the copies on this device can follow.
  onWorkspaceChanged: () => void
}

// The cloud workspace list. Callers keep their last known list when a request fails.
async function fetchCloudWorkspaces(token: string): Promise<CloudWorkspace[]> {
  return cloudWorkspaceService.list(token)
}

// Keeps the cloud list live over the sync event socket. The list is fetched on every connect, and again on each workspace.changed event.
// A workspace.updated event moves that workspace's head commit without a fetch.
export function useCloudRealtimeViewModel(input: CloudRealtimeInput) {
  const { sessionToken, setCloudWorkspaces } = input
  const workspaceUpdated = useEffectEvent((event: WorkspaceUpdateEvent) => input.onWorkspaceUpdated(event))
  const workspaceChanged = useEffectEvent(() => input.onWorkspaceChanged())

  useEffect(() => {
    if (!sessionToken) return
    let active = true
    let socket: WebSocket | undefined
    let reconnectTimer: number | undefined
    let reconnectAttempt = 0

    const refreshCloudWorkspaces = async () => {
      try {
        const workspaces = await fetchCloudWorkspaces(sessionToken)
        if (active) setCloudWorkspaces(workspaces)
      } catch {
        // Keep the last known list when the network is temporarily unavailable. The next connect or event refreshes it.
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

    const handleEvent = (raw: string) => {
      const event = parseWorkspaceEvent(raw)
      if (!event) return
      if (event.type === 'workspace.changed') {
        void refreshCloudWorkspaces()
        workspaceChanged()
        return
      }
      setCloudWorkspaces((current) =>
        current.map((workspace) => (workspace.id === event.workspaceId ? { ...workspace, headCommitId: event.headCommitId } : workspace)),
      )
      workspaceUpdated(event)
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
            void refreshCloudWorkspaces()
          },
          { once: true },
        )
        connection.addEventListener('message', (messageEvent) => handleEvent(String(messageEvent.data)))
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
