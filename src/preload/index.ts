import { contextBridge, ipcRenderer } from 'electron'
import type { WorkspaceVariables } from '../renderer/src/lib/workspace-variables'
import { CHANNELS } from '../shared/ipc/channels'

let pendingInviteToken: string | null = null
const inviteHandlers = new Set<(token: string) => void>()

ipcRenderer.on(CHANNELS.invite.token, (_event, token: string) => {
  pendingInviteToken = token
  inviteHandlers.forEach((handler) => {
    handler(token)
  })
  if (inviteHandlers.size) pendingInviteToken = null
})

type AiToolId = 'codex' | 'claude-cli' | 'claude-desktop'
type AiConnectStatus = {
  node: { installed: boolean; version?: string; source?: 'app' | 'system' }
  tools: Array<{ id: AiToolId; supported: boolean; installed: boolean; connected: boolean }>
}
type NodeInstallProgress = { stage: 'checking' | 'downloading' | 'verifying' | 'extracting' | 'done'; percent?: number }

type UpdateStatus =
  | { state: 'available'; version: string }
  | { state: 'downloading'; version: string; percent: number }
  | { state: 'downloaded'; version: string }
  | { state: 'error'; version: string; message: string }
const updateHandlers = new Set<(status: UpdateStatus) => void>()
ipcRenderer.on(CHANNELS.update.status, (_event, status: UpdateStatus) =>
  updateHandlers.forEach((handler) => {
    handler(status)
  }),
)

let pendingAuthCode: string | null = null
const authCodeHandlers = new Set<(code: string) => void>()

ipcRenderer.on(CHANNELS.auth.code, (_event, code: string) => {
  pendingAuthCode = code
  authCodeHandlers.forEach((handler) => {
    handler(code)
  })
  if (authCodeHandlers.size) pendingAuthCode = null
})

contextBridge.exposeInMainWorld('apiDesktop', {
  sendRequest: (request: ApiRequest) => ipcRenderer.invoke(CHANNELS.request.send, request),
  selectFile: (): Promise<{ path: string; name: string } | null> => ipcRenderer.invoke(CHANNELS.file.select),
  loadWorkspace: (legacyTree: unknown[]) => ipcRenderer.invoke(CHANNELS.workspace.load, legacyTree),
  saveWorkspace: (workspace: LocalWorkspace): Promise<boolean> => ipcRenderer.invoke(CHANNELS.workspace.save, workspace),
  listWorkspaces: () => ipcRenderer.invoke(CHANNELS.workspace.list),
  removeWorkspace: (workspaceId: string): Promise<boolean> => ipcRenderer.invoke(CHANNELS.workspace.remove, workspaceId),
  onExternalWorkspaceChange: (handler: () => void) => {
    const listener = () => handler()
    ipcRenderer.on(CHANNELS.workspace.externalChange, listener)
    return () => ipcRenderer.removeListener(CHANNELS.workspace.externalChange, listener)
  },
  onWorkspaceConflict: (handler: (workspaceId: string) => void) => {
    const listener = (_event: unknown, workspaceId: unknown) => {
      if (typeof workspaceId === 'string') handler(workspaceId)
    }
    ipcRenderer.on(CHANNELS.workspace.conflict, listener)
    return () => ipcRenderer.removeListener(CHANNELS.workspace.conflict, listener)
  },
  secureStorageAvailable: (): Promise<boolean> => ipcRenderer.invoke(CHANNELS.secret.available),
  saveCommit: (workspaceId: string, commit: LocalCommit) => ipcRenderer.invoke(CHANNELS.commit.save, workspaceId, commit),
  listCommits: (workspaceId: string) => ipcRenderer.invoke(CHANNELS.commit.list, workspaceId),
  loadSession: () => ipcRenderer.invoke(CHANNELS.session.load),
  saveSession: (token: string) => ipcRenderer.invoke(CHANNELS.session.save, token),
  clearSession: () => ipcRenderer.invoke(CHANNELS.session.clear),
  setActiveAccount: (userId: string | null) => ipcRenderer.invoke(CHANNELS.account.setActive, userId),
  onInviteToken: (handler: (token: string) => void) => {
    inviteHandlers.add(handler)
    if (pendingInviteToken) {
      handler(pendingInviteToken)
      pendingInviteToken = null
    }
    return () => inviteHandlers.delete(handler)
  },
  downloadUpdate: (version: string): Promise<void> => ipcRenderer.invoke(CHANNELS.update.download, version),
  aiStatus: (): Promise<AiConnectStatus> => ipcRenderer.invoke(CHANNELS.ai.status),
  installNodeRuntime: (): Promise<string | null> => ipcRenderer.invoke(CHANNELS.ai.installNode),
  installAiTool: (id: 'codex' | 'claude-cli'): Promise<void> => ipcRenderer.invoke(CHANNELS.ai.installTool, id),
  connectAiTool: (id: AiToolId): Promise<void> => ipcRenderer.invoke(CHANNELS.ai.connect, id),
  onNodeProgress: (handler: (progress: NodeInstallProgress) => void) => {
    const listener = (_event: unknown, progress: NodeInstallProgress) => handler(progress)
    ipcRenderer.on(CHANNELS.ai.nodeProgress, listener)
    return () => ipcRenderer.removeListener(CHANNELS.ai.nodeProgress, listener)
  },
  onAiLog: (handler: (line: string) => void) => {
    const listener = (_event: unknown, line: string) => handler(line)
    ipcRenderer.on(CHANNELS.ai.log, listener)
    return () => ipcRenderer.removeListener(CHANNELS.ai.log, listener)
  },
  onConnectAiMenu: (handler: () => void) => {
    const listener = () => handler()
    ipcRenderer.on(CHANNELS.menu.connectAi, listener)
    return () => ipcRenderer.removeListener(CHANNELS.menu.connectAi, listener)
  },
  onUpdateStatus: (handler: (status: UpdateStatus) => void) => {
    updateHandlers.add(handler)
    void ipcRenderer.invoke(CHANNELS.update.latest).then((status: UpdateStatus | null) => {
      if (status) handler(status)
    })
    return () => updateHandlers.delete(handler)
  },
  beginBrowserSignIn: (cloudUrl: string): Promise<void> => ipcRenderer.invoke(CHANNELS.auth.begin, cloudUrl),
  onAuthCode: (handler: (code: string) => void) => {
    authCodeHandlers.add(handler)
    if (pendingAuthCode) {
      handler(pendingAuthCode)
      pendingAuthCode = null
    }
    return () => authCodeHandlers.delete(handler)
  },
})

export type LocalWorkspace = {
  id: string
  cloudId: string | null
  name: string
  tree: unknown[]
  baseTree: unknown[]
  variables?: WorkspaceVariables
  baseVariables?: WorkspaceVariables
  activeEnvironmentId?: string | null
  baseCommitId: string | null
  localHeadId: string | null
  role?: 'owner' | 'editor' | 'viewer' | null
}

export type LocalCommit = {
  id: string
  parentIds: string[]
  message: string
  tree: unknown[]
  variables?: WorkspaceVariables
  createdAt: string
  pushed: boolean
}

export type ApiRequest = {
  method: string
  url: string
  headers: Array<{ name: string; value: string; enabled: boolean }>
  params?: Array<{ id: string; name: string; value: string; enabled: boolean; description?: string }>
  auth?:
    | { type: 'none' }
    | { type: 'bearer'; token: string }
    | { type: 'basic'; username: string; password: string }
    | { type: 'api-key'; name: string; value: string; location: 'header' | 'query' }
  body?: string
  bodyMode?: 'form-data' | 'urlencoded' | 'graphql' | 'json' | 'xml' | 'yaml' | 'edn' | 'text' | 'other' | 'file' | 'none'
  bodyFields?: Array<{
    id: string
    name: string
    value: string
    enabled: boolean
    type: 'text' | 'file'
    filePath?: string
    fileName?: string
  }>
  bodyVariables?: string
  bodyMimeType?: string
  bodyPath?: string
  bodyFileName?: string
}

export type ApiResponse = {
  status: number
  statusText: string
  duration: number
  headers: Record<string, string>
  body: string
}
