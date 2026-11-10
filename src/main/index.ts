import { readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { app, BrowserWindow, dialog, ipcMain, Menu, safeStorage, shell } from 'electron'
import updaterModule from 'electron-updater'
import { z } from 'zod'
import type { WorkspaceVariable, WorkspaceVariables } from '../renderer/src/lib/workspace-variables'
import { scriptRunInputSchema } from '../renderer/src/shared/ipc/script-contract'
import { bodyModeSchema } from '../renderer/src/shared/models/api-node.model'
import { isRecord } from '../renderer/src/shared/utils/record'
import { CHANNELS } from '../shared/ipc/channels'
import { connectAiTool, getAiConnectStatus, installCli } from './ai-connect'
import { assertTrustedSender, isTrustedPage } from './ipc-guard'
import { installNodeRuntime, type NodeRuntimePaths, readNodeRuntime } from './node-runtime'
import { listSavedResponses, readSavedResponse, saveResponse, storeIdSchema } from './response-store'
import { runScript } from './scripts/script-engine'
import { attemptMatches, openSignInBox, parseSignInLink, type SignInAttempt, signInUrl, startSignInAttempt } from './sign-in'
import { localVaultId, removeWorkspaceRows } from './workspace-removal'
import { WorkspaceRows } from './workspace-rows'

// electron-updater is CommonJS; named imports fail when Electron loads the ESM main bundle.
const { autoUpdater } = updaterModule

type UpdateStatus =
  | { state: 'available'; version: string }
  | { state: 'downloading'; version: string; percent: number }
  | { state: 'downloaded'; version: string }
  | { state: 'error'; version: string; message: string }

// Required for app.on('second-instance') to fire on Windows/Linux when the app
// is already running and the OS re-invokes it through the api-docs:// protocol
// (invite links).
if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

const keyValueRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.string(),
  enabled: z.boolean(),
  description: z.string().optional(),
})

const apiRequestSchema = z.object({
  savedResponse: z.object({ workspaceId: storeIdSchema, requestId: storeIdSchema }).optional(),
  method: z.string(),
  url: z.string(),
  headers: z.array(z.object({ name: z.string(), value: z.string(), enabled: z.boolean() })),
  params: z.array(keyValueRowSchema).optional(),
  auth: z
    .discriminatedUnion('type', [
      z.object({ type: z.literal('none') }),
      z.object({ type: z.literal('bearer'), token: z.string() }),
      z.object({ type: z.literal('basic'), username: z.string(), password: z.string() }),
      z.object({ type: z.literal('api-key'), name: z.string(), value: z.string(), location: z.enum(['header', 'query']) }),
    ])
    .optional(),
  body: z.string().optional(),
  bodyMode: bodyModeSchema.optional(),
  bodyFields: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        value: z.string(),
        enabled: z.boolean(),
        type: z.enum(['text', 'file']),
        filePath: z.string().optional(),
        fileName: z.string().optional(),
      }),
    )
    .optional(),
  bodyVariables: z.string().optional(),
  bodyMimeType: z.string().optional(),
  bodyPath: z.string().optional(),
  bodyFileName: z.string().optional(),
})

// Rows read from the local database. Each one is checked before its fields are used.
const dataRowSchema = z.object({ data: z.string() })
const secretRowSchema = z.object({ value: z.instanceof(Uint8Array) })
const keyRowSchema = z.object({ key: z.string() })
const pragmaRowSchema = z.object({ data_version: z.union([z.number(), z.bigint()]) })

type LocalWorkspace = {
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

let localDatabase: DatabaseSync | undefined
// The rows the window last read or wrote. A save of a row that changed outside the app is refused.
const workspaceRows = new WorkspaceRows()
let mainWindow: BrowserWindow | undefined
let pendingInviteToken: string | undefined
let activeSignIn: SignInAttempt | undefined

// Routes api-docs:// links the operating system hands to the app: invites, and the end of a browser sign-in.
function receiveDeepLink(link: string): void {
  if (link.startsWith('api-docs://auth/')) {
    receiveSignInLink(link)
    return
  }
  receiveInviteLink(link)
}

// Ends a browser sign-in. A link that does not match the attempt in progress is ignored, so a stale or forged link does nothing.
function receiveSignInLink(link: string): void {
  const parsed = parseSignInLink(link)
  if (!parsed || !attemptMatches(activeSignIn, parsed.state)) return
  const attempt = activeSignIn
  activeSignIn = undefined
  if (!attempt) return
  let token: string
  try {
    token = openSignInBox(attempt.privateKey, parsed.box)
  } catch {
    sendToWindow(CHANNELS.auth.failed, 'sign-in-failed')
    return
  }
  sendToWindow(CHANNELS.auth.session, token)
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
}

// Handles api-docs://invite?token=... links.
function receiveInviteLink(link: string): void {
  try {
    const token = new URL(link).searchParams.get('token')
    if (!token) return
    pendingInviteToken = token
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(CHANNELS.invite.token, token)
      pendingInviteToken = undefined
    }
  } catch {
    /* Ignore unrelated protocol links. */
  }
}

function database(): DatabaseSync {
  if (!localDatabase) {
    localDatabase = new DatabaseSync(join(app.getPath('userData'), 'workspace.sqlite'))
    localDatabase.exec('PRAGMA busy_timeout = 5000;')
    localDatabase.exec(`
      CREATE TABLE IF NOT EXISTS workspaces (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS commits (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS secrets (key TEXT PRIMARY KEY, value BLOB NOT NULL);
      CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    `)
  }
  return localDatabase
}

let databaseWatchTimer: NodeJS.Timeout | undefined
function watchExternalWorkspaceChanges(): void {
  if (databaseWatchTimer) return
  const db = database()
  let observedVersion = Number(pragmaRowSchema.parse(db.prepare('PRAGMA data_version').get()).data_version)
  databaseWatchTimer = setInterval(() => {
    try {
      const currentVersion = Number(pragmaRowSchema.parse(db.prepare('PRAGMA data_version').get()).data_version)
      if (currentVersion === observedVersion) return
      observedVersion = currentVersion
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(CHANNELS.workspace.externalChange)
    } catch (error) {
      console.error('Could not check for external workspace changes:', error)
    }
  }, 500)
  databaseWatchTimer.unref()
}

function stripSecretVariableValues(value: WorkspaceVariables | undefined): WorkspaceVariables {
  const variables = value ?? { globals: [], environments: [] }
  const cleanRows = (rows: WorkspaceVariables['globals']) => rows.map((item) => ({ ...item, value: item.secret ? '' : item.value }))
  return {
    globals: cleanRows(variables.globals),
    environments: variables.environments.map((environment) => ({ ...environment, variables: cleanRows(environment.variables) })),
  }
}

function restoreSecretVariableValues(workspaceId: string, value: WorkspaceVariables | undefined): WorkspaceVariables {
  const variables = value ?? { globals: [], environments: [] }
  if (!safeStorage.isEncryptionAvailable()) return variables
  const restoreRows = (rows: WorkspaceVariables['globals']) =>
    rows.map((item) => {
      if (!item.secret) return item
      const key = `workspace-variable:${workspaceId}:${item.id}`
      const row = secretRowSchema.optional().parse(database().prepare('SELECT value FROM secrets WHERE key = ?').get(key))
      return row ? { ...item, value: safeStorage.decryptString(Buffer.from(row.value)) } : item
    })
  return {
    globals: restoreRows(variables.globals),
    environments: variables.environments.map((environment) => ({ ...environment, variables: restoreRows(environment.variables) })),
  }
}

function writeWorkspaceSecrets(db: DatabaseSync, workspaceId: string, secretRows: WorkspaceVariable[], canEncrypt: boolean): void {
  const prefix = `workspace-variable:${workspaceId}:`
  const activeKeys = new Set(secretRows.map((item) => `${prefix}${item.id}`))
  const existing = z.array(keyRowSchema).parse(db.prepare('SELECT key FROM secrets').all())
  for (const row of existing)
    if (row.key.startsWith(prefix) && !activeKeys.has(row.key)) db.prepare('DELETE FROM secrets WHERE key = ?').run(row.key)
  if (!canEncrypt) return
  for (const item of secretRows) {
    const key = `${prefix}${item.id}`
    if (!item.value) db.prepare('DELETE FROM secrets WHERE key = ?').run(key)
    else {
      const encrypted = safeStorage.encryptString(item.value)
      db.prepare('INSERT INTO secrets (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, encrypted)
    }
  }
}

// Refuses the save, and tells the window, when the workspace changed outside the app since it was last read. The window then reloads it.
function persistWorkspace(workspace: LocalWorkspace, overwrite = false): boolean {
  const db = database()
  // An overwrite is the user's choice to keep their version. The app forgets what it last saw, so the save goes through.
  if (overwrite) workspaceRows.forget(workspace.id)
  const variables = workspace.variables ?? { globals: [], environments: [] }
  const secretRows = [...variables.globals, ...variables.environments.flatMap((environment) => environment.variables)].filter(
    (item) => item.secret,
  )
  const canEncrypt = safeStorage.isEncryptionAvailable()
  const saved = workspaceRows.save(db, workspace.id, () => {
    writeWorkspaceSecrets(db, workspace.id, secretRows, canEncrypt)
    const data = JSON.stringify({
      ...workspace,
      variables: stripSecretVariableValues(variables),
      baseVariables: stripSecretVariableValues(workspace.baseVariables),
    })
    db.prepare('INSERT INTO workspaces (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data').run(workspace.id, data)
    return data
  })
  if (!saved) {
    sendToWindow(CHANNELS.workspace.conflict, workspace.id)
    sendToWindow(CHANNELS.workspace.externalChange)
    return false
  }
  return canEncrypt || secretRows.every((item) => !item.value)
}

const aiToolSchema = z.enum(['codex', 'claude-cli', 'claude-desktop', 'antigravity', 'gemini'])
const installableToolSchema = z.enum(['codex', 'claude-cli', 'gemini'])

function cookieList(value: string | null): string[] {
  return value ? [value] : []
}

function isWorkspaceVariables(value: unknown): value is WorkspaceVariables {
  return isRecord(value) && Array.isArray(value.globals) && Array.isArray(value.environments)
}

function isLocalWorkspace(value: unknown): value is LocalWorkspace {
  return isRecord(value) && typeof value.id === 'string' && Array.isArray(value.tree) && Array.isArray(value.baseTree)
}

function parseStoredRecord(text: string): Record<string, unknown> {
  const value: unknown = JSON.parse(text)
  if (!isRecord(value)) throw new TypeError('Stored data is not an object.')
  return value
}

function loadWorkspaceData(value: string): LocalWorkspace {
  const parsed: unknown = JSON.parse(value)
  if (!isLocalWorkspace(parsed)) throw new TypeError('Stored workspace is damaged.')
  return {
    ...parsed,
    variables: restoreSecretVariableValues(parsed.id, isWorkspaceVariables(parsed.variables) ? parsed.variables : undefined),
  }
}

function isExternalLink(url: string): boolean {
  try {
    const protocol = new URL(url).protocol
    return protocol === 'https:' || protocol === 'mailto:'
  } catch {
    return false
  }
}

function createWindow(): void {
  const appTitle = app.isPackaged ? 'API Documentation' : 'API Documentation (DEVELOPMENT)'
  const window = new BrowserWindow({
    title: appTitle,
    width: 1440,
    height: 900,
    minWidth: 860,
    minHeight: 620,
    backgroundColor: '#ffffff',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  mainWindow = window
  // Windows never open inside the app. Only https and mailto links leave the app, in the system browser.
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalLink(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })
  window.webContents.on('will-navigate', (event, url) => {
    if (!isTrustedPage(url)) event.preventDefault()
  })
  // Check again when the user brings the app back to the front.
  window.on('focus', () => checkForUpdatesNow?.())
  // The page title in index.html would otherwise replace the environment label.
  window.webContents.on('page-title-updated', (event) => {
    event.preventDefault()
    window.setTitle(appTitle)
  })
  window.on('closed', () => {
    if (mainWindow === window) mainWindow = undefined
  })
  window.webContents.once('did-finish-load', () => {
    if (pendingInviteToken) {
      window.webContents.send(CHANNELS.invite.token, pendingInviteToken)
      pendingInviteToken = undefined
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

ipcMain.handle(CHANNELS.request.send, async (event, ...args: unknown[]) => {
  assertTrustedSender(event)
  const [request] = z.tuple([apiRequestSchema]).parse(args)
  const startedAt = performance.now()
  const targetUrl = new URL(request.url)
  if (request.params !== undefined) targetUrl.search = ''
  for (const param of request.params ?? []) {
    if (param.enabled && param.name.trim()) targetUrl.searchParams.append(param.name, param.value)
  }
  const headers = new Headers()
  for (const header of request.headers ?? []) {
    if (header.enabled && header.name.trim()) headers.append(header.name.trim(), header.value)
  }
  if (!headers.has('Accept')) headers.set('Accept', '*/*')
  if (!headers.has('User-Agent')) headers.set('User-Agent', 'API-Documentation/0.1.0')
  const auth = request.auth ?? { type: 'none' as const }
  if (auth.type === 'bearer' && auth.token) headers.set('Authorization', `Bearer ${auth.token}`)
  if (auth.type === 'basic' && (auth.username || auth.password))
    headers.set('Authorization', `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`)
  if (auth.type === 'api-key' && auth.name.trim() && auth.value) {
    if (auth.location === 'query') targetUrl.searchParams.append(auth.name, auth.value)
    else headers.set(auth.name, auth.value)
  }
  const mode = request.bodyMode ?? (request.body?.trim() ? 'json' : 'none')
  let requestBody: BodyInit | undefined
  const canSendBody = !['GET', 'HEAD'].includes(request.method.toUpperCase()) && mode !== 'none'
  if (mode !== 'none' && !(mode === 'form-data' && canSendBody) && !headers.has('Content-Type')) {
    const contentType =
      mode === 'form-data'
        ? 'multipart/form-data'
        : mode === 'urlencoded'
          ? 'application/x-www-form-urlencoded;charset=UTF-8'
          : mode === 'file'
            ? request.bodyMimeType || 'application/octet-stream'
            : mode === 'other'
              ? request.bodyMimeType || 'text/plain'
              : mode === 'graphql' || mode === 'json'
                ? 'application/json'
                : mode === 'xml'
                  ? 'application/xml'
                  : mode === 'yaml'
                    ? 'application/yaml'
                    : mode === 'edn'
                      ? 'application/edn'
                      : 'text/plain'
    headers.set('Content-Type', contentType)
  }

  if (canSendBody) {
    if (mode === 'form-data') {
      const form = new FormData()
      for (const field of request.bodyFields ?? []) {
        if (!field.enabled || !field.name) continue
        if (field.type === 'file') {
          if (!field.filePath) throw new Error(`Choose a file for the "${field.name}" field before sending.`)
          const bytes = new Uint8Array(await readFile(field.filePath))
          form.append(field.name, new Blob([bytes]), field.fileName || basename(field.filePath))
        } else form.append(field.name, field.value)
      }
      headers.delete('Content-Type')
      requestBody = form
    } else if (mode === 'urlencoded') {
      const form = new URLSearchParams()
      for (const field of request.bodyFields ?? []) if (field.enabled && field.name) form.append(field.name, field.value)
      if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8')
      requestBody = form
    } else if (mode === 'file') {
      if (!request.bodyPath) throw new Error('Choose a file before sending this request.')
      if (!headers.has('Content-Type')) headers.set('Content-Type', request.bodyMimeType || 'application/octet-stream')
      requestBody = new Uint8Array(await readFile(request.bodyPath))
    } else if (mode === 'graphql') {
      let variables: unknown = {}
      try {
        variables = JSON.parse(request.bodyVariables || '{}')
      } catch {
        throw new Error('GraphQL variables must contain valid JSON.')
      }
      if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
      requestBody = JSON.stringify({ query: request.body ?? '', variables })
    } else {
      const contentType =
        mode === 'other'
          ? request.bodyMimeType || 'text/plain'
          : mode === 'json'
            ? 'application/json'
            : mode === 'xml'
              ? 'application/xml'
              : mode === 'yaml'
                ? 'application/yaml'
                : mode === 'edn'
                  ? 'application/edn'
                  : 'text/plain'
      if (!headers.has('Content-Type')) headers.set('Content-Type', contentType)
      requestBody = request.body ?? ''
    }
  }

  let response: Response
  try {
    response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: requestBody,
    })
  } catch (error) {
    const cause = error && typeof error === 'object' && 'cause' in error ? error.cause : undefined
    const details = isRecord(cause) ? cause : undefined
    const code = typeof details?.code === 'string' ? details.code : undefined
    const reason =
      code === 'ECONNREFUSED'
        ? 'The server refused the connection. Check that the API is running and the host and port are correct.'
        : code === 'ENOTFOUND' || code === 'EAI_AGAIN'
          ? 'The hostname could not be resolved. Check the URL and network connection.'
          : code === 'ETIMEDOUT'
            ? 'The connection timed out. Check the server and network.'
            : code?.startsWith('CERT_') || code?.startsWith('ERR_TLS_')
              ? 'The TLS certificate could not be verified.'
              : (typeof details?.message === 'string' && details.message) ||
                (error instanceof Error ? error.message : 'Unknown network error.')
    throw new Error(`Could not reach ${targetUrl.origin}. ${reason}${code ? ` (${code})` : ''}`)
  }
  const body = await response.text()
  if (request.savedResponse) {
    // Saving is best effort: a failed save never fails the request, and the response is still returned.
    await saveResponse(app.getPath('userData'), {
      ...request.savedResponse,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body,
    }).catch(() => undefined)
  }

  return {
    status: response.status,
    statusText: response.statusText,
    duration: Math.round(performance.now() - startedAt),
    headers: Object.fromEntries(response.headers.entries()),
    cookies:
      typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie()
        : cookieList(response.headers.get('set-cookie')),
    body,
  }
})

const savedResponseTargetSchema = z.object({ workspaceId: storeIdSchema, requestId: storeIdSchema })

ipcMain.handle(CHANNELS.response.listSaved, async (event, ...args: unknown[]) => {
  assertTrustedSender(event)
  const [input] = z.tuple([z.object({ workspaceId: storeIdSchema })]).parse(args)
  return listSavedResponses(app.getPath('userData'), input.workspaceId)
})

ipcMain.handle(CHANNELS.response.readSaved, async (event, ...args: unknown[]) => {
  assertTrustedSender(event)
  const [target] = z.tuple([savedResponseTargetSchema]).parse(args)
  return (await readSavedResponse(app.getPath('userData'), target.workspaceId, target.requestId)) ?? null
})

ipcMain.handle(CHANNELS.scripts.run, async (event, ...args: unknown[]) => {
  assertTrustedSender(event)
  const [input] = z.tuple([scriptRunInputSchema]).parse(args)
  return runScript(input)
})

ipcMain.handle(CHANNELS.file.select, async (event, ...args: unknown[]) => {
  assertTrustedSender(event)
  z.tuple([]).parse(args)
  const result = await dialog.showOpenDialog({ properties: ['openFile'] })
  const path = result.filePaths[0]
  return result.canceled || !path ? null : { path, name: basename(path) }
})

ipcMain.handle(CHANNELS.workspace.load, (event, ...args: unknown[]) => {
  assertTrustedSender(event)
  const [legacyTree] = z.tuple([z.unknown()]).parse(args)
  const db = database()
  const saved = dataRowSchema.optional().parse(db.prepare('SELECT data FROM workspaces WHERE id = ?').get('local-default'))
  if (saved) {
    workspaceRows.remember('local-default', saved.data)
    return loadWorkspaceData(saved.data)
  }
  const tree = Array.isArray(legacyTree) ? legacyTree : []
  const variables = { globals: [], environments: [] }
  const workspace: LocalWorkspace = {
    id: 'local-default',
    cloudId: null,
    name: 'My workspace',
    tree,
    baseTree: tree,
    variables,
    baseVariables: variables,
    activeEnvironmentId: null,
    baseCommitId: null,
    localHeadId: null,
  }
  const data = JSON.stringify(workspace)
  db.prepare('INSERT INTO workspaces (id, data) VALUES (?, ?)').run(workspace.id, data)
  workspaceRows.remember(workspace.id, data)
  return workspace
})

ipcMain.handle(CHANNELS.workspace.save, (event, ...args: unknown[]) => {
  assertTrustedSender(event)
  const [workspace, options] = z
    .tuple([z.custom<LocalWorkspace>(isLocalWorkspace), z.object({ overwrite: z.boolean() }).optional()])
    .parse(args)
  return persistWorkspace(workspace, options?.overwrite ?? false)
})

ipcMain.handle(CHANNELS.workspace.remove, (event, ...args: unknown[]) => {
  assertTrustedSender(event)
  const [workspaceId] = z.tuple([z.string()]).parse(args)
  if (workspaceId === localVaultId) return false
  workspaceRows.forget(workspaceId)
  return removeWorkspaceRows(database(), workspaceId)
})

ipcMain.handle(CHANNELS.workspace.list, (event, ...args: unknown[]) => {
  assertTrustedSender(event)
  z.tuple([]).parse(args)
  return z
    .array(dataRowSchema)
    .parse(database().prepare('SELECT data FROM workspaces ORDER BY rowid').all())
    .map((row) => {
      const workspace = loadWorkspaceData(row.data)
      workspaceRows.remember(workspace.id, row.data)
      return workspace
    })
})

ipcMain.handle(CHANNELS.commit.save, (event, ...args: unknown[]) => {
  assertTrustedSender(event)
  const [workspaceId, commit] = z.tuple([z.string(), z.custom<Record<string, unknown>>(isRecord)]).parse(args)
  const id = commit.id
  if (typeof id !== 'string') throw new TypeError('Commit id is required.')
  const safeCommit = {
    ...commit,
    variables: stripSecretVariableValues(isWorkspaceVariables(commit.variables) ? commit.variables : undefined),
  }
  database()
    .prepare('INSERT OR REPLACE INTO commits (id, workspace_id, data) VALUES (?, ?, ?)')
    .run(id, workspaceId, JSON.stringify(safeCommit))
})

ipcMain.handle(CHANNELS.commit.list, (event, ...args: unknown[]) => {
  assertTrustedSender(event)
  const [id] = z.tuple([z.string()]).parse(args)
  return z
    .array(dataRowSchema)
    .parse(database().prepare('SELECT data FROM commits WHERE workspace_id = ? ORDER BY rowid').all(id))
    .map((row) => {
      const commit = parseStoredRecord(row.data)
      return { ...commit, variables: stripSecretVariableValues(isWorkspaceVariables(commit.variables) ? commit.variables : undefined) }
    })
})

ipcMain.handle(CHANNELS.secret.available, (event, ...args: unknown[]) => {
  assertTrustedSender(event)
  z.tuple([]).parse(args)
  return safeStorage.isEncryptionAvailable()
})

ipcMain.handle(CHANNELS.auth.begin, async (event, ...args: unknown[]) => {
  assertTrustedSender(event)
  const [cloudUrl] = z.tuple([z.string()]).parse(args)
  let base: URL
  try {
    base = new URL(cloudUrl)
  } catch {
    throw new TypeError('Invalid cloud URL.')
  }
  if (base.protocol !== 'http:' && base.protocol !== 'https:') throw new TypeError('Cloud URL must be http or https.')
  activeSignIn = startSignInAttempt()
  await shell.openExternal(signInUrl(activeSignIn, base))
})

ipcMain.handle(CHANNELS.session.load, (event, ...args: unknown[]) => {
  assertTrustedSender(event)
  z.tuple([]).parse(args)
  if (!safeStorage.isEncryptionAvailable()) return null
  const row = secretRowSchema.optional().parse(database().prepare('SELECT value FROM secrets WHERE key = ?').get('api-session'))
  return row ? safeStorage.decryptString(Buffer.from(row.value)) : null
})

ipcMain.handle(CHANNELS.session.save, (event, ...args: unknown[]) => {
  assertTrustedSender(event)
  const [token] = z.tuple([z.string()]).parse(args)
  if (!safeStorage.isEncryptionAvailable()) return false
  const encrypted = safeStorage.encryptString(token)
  database()
    .prepare('INSERT INTO secrets (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run('api-session', encrypted)
  return true
})

ipcMain.handle(CHANNELS.session.clear, (event, ...args: unknown[]) => {
  assertTrustedSender(event)
  z.tuple([]).parse(args)
  database().prepare('DELETE FROM secrets WHERE key = ?').run('api-session')
})

// The signed-in account id is not a secret. The MCP server reads it to tag workspaces it creates.
ipcMain.handle(CHANNELS.account.setActive, (event, ...args: unknown[]) => {
  assertTrustedSender(event)
  const [userId] = z.tuple([z.string().min(1).max(200).nullable()]).parse(args)
  const db = database()
  if (userId === null) db.prepare('DELETE FROM app_settings WHERE key = ?').run('active-account')
  else
    db.prepare('INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(
      'active-account',
      userId,
    )
})

let latestUpdateStatus: UpdateStatus | undefined
const updateCheckIntervalMs = 10 * 60 * 1000
let checkForUpdatesNow: (() => void) | undefined
const minUpdateCheckGapMs = 60 * 1000

// Auto-update runs only in packaged builds. The feed comes from the publish
// config in package.json; API_DOCS_UPDATE_URL overrides it for local testing.
function setupAutoUpdate(): void {
  if (!app.isPackaged) return
  if (process.env.API_DOCS_UPDATE_URL) autoUpdater.setFeedURL({ provider: 'generic', url: process.env.API_DOCS_UPDATE_URL })
  // Nothing is downloaded until the user asks for it; the download starts from downloadUpdate().
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false
  const sendUpdateStatus = (status: UpdateStatus) => {
    latestUpdateStatus = status
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(CHANNELS.update.status, status)
  }
  autoUpdater.on('update-available', (info) => sendUpdateStatus({ state: 'available', version: info.version }))
  autoUpdater.on('download-progress', (progress) => {
    const version = latestUpdateStatus && 'version' in latestUpdateStatus ? latestUpdateStatus.version : ''
    sendUpdateStatus({ state: 'downloading', version, percent: Math.floor(progress.percent) })
  })
  autoUpdater.on('update-downloaded', (info) => {
    sendUpdateStatus({ state: 'downloaded', version: info.version })
    // Restart automatically once the download is complete, after a short pause so the dialog can show it.
    setTimeout(() => autoUpdater.quitAndInstall(), 1500)
  })
  autoUpdater.on('error', (error) => {
    console.error('Auto-update failed:', error)
    if (latestUpdateStatus?.state === 'downloading') {
      sendUpdateStatus({ state: 'error', version: latestUpdateStatus.version, message: error.message })
    }
  })
  // Skip while an update is already found or downloading, and never check twice within a minute
  // (window focus and the timer can fire close together).
  let lastCheckAt = 0
  checkForUpdatesNow = () => {
    if (latestUpdateStatus && ['available', 'downloading', 'downloaded'].includes(latestUpdateStatus.state)) return
    if (Date.now() - lastCheckAt < minUpdateCheckGapMs) return
    lastCheckAt = Date.now()
    void autoUpdater.checkForUpdates().catch((error) => console.error('Auto-update check failed:', error))
  }
  checkForUpdatesNow()
  setInterval(() => checkForUpdatesNow?.(), updateCheckIntervalMs).unref()
}

ipcMain.handle(CHANNELS.update.download, (event, ...args: unknown[]) => {
  assertTrustedSender(event)
  const [version] = z.tuple([z.string()]).parse(args)
  // Show the progress dialog immediately, before the first progress event arrives.
  latestUpdateStatus = { state: 'downloading', version, percent: 0 }
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(CHANNELS.update.status, latestUpdateStatus)
  void autoUpdater.downloadUpdate().catch((error: Error) => console.error('Auto-update download failed:', error))
})
ipcMain.handle(CHANNELS.update.latest, (event, ...args: unknown[]) => {
  assertTrustedSender(event)
  z.tuple([]).parse(args)
  return latestUpdateStatus ?? null
})
function sendToWindow(channel: string, payload?: unknown): void {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload)
}

async function requireNodeRuntime(): Promise<NodeRuntimePaths> {
  const status = await readNodeRuntime(join(app.getPath('userData'), 'runtime'))
  if (!status.installed) throw new Error('Node.js is not installed yet. Install it first from Connect MCP.')
  return status
}

ipcMain.handle(CHANNELS.ai.status, (event, ...args: unknown[]) => {
  assertTrustedSender(event)
  z.tuple([]).parse(args)
  return getAiConnectStatus(app.getPath('userData'))
})
ipcMain.handle(CHANNELS.ai.installNode, async (event, ...args: unknown[]) => {
  assertTrustedSender(event)
  z.tuple([]).parse(args)
  const status = await installNodeRuntime(join(app.getPath('userData'), 'runtime'), (progress) =>
    sendToWindow(CHANNELS.ai.nodeProgress, progress),
  )
  return status.installed ? status.version : null
})
ipcMain.handle(CHANNELS.ai.installTool, async (event, ...args: unknown[]) => {
  assertTrustedSender(event)
  const [id] = z.tuple([installableToolSchema]).parse(args)
  const runtime = await requireNodeRuntime()
  await installCli(app.getPath('userData'), runtime, id, (line) => sendToWindow(CHANNELS.ai.log, line))
})
ipcMain.handle(CHANNELS.ai.connect, async (event, ...args: unknown[]) => {
  assertTrustedSender(event)
  const [id] = z.tuple([aiToolSchema]).parse(args)
  const runtime = await requireNodeRuntime()
  await connectAiTool(app.getPath('userData'), runtime, id, (line) => sendToWindow(CHANNELS.ai.log, line))
})

function showAbout(): void {
  const options = {
    type: 'info' as const,
    title: 'About API Documentation',
    message: 'API Documentation',
    detail: `Version ${app.getVersion()}`,
  }
  if (mainWindow && !mainWindow.isDestroyed()) void dialog.showMessageBox(mainWindow, options)
  else void dialog.showMessageBox(options)
}

function buildApplicationMenu(): Menu {
  return Menu.buildFromTemplate([
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' as const }] : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
    {
      role: 'help',
      submenu: [
        { label: 'Connect MCP…', click: () => sendToWindow(CHANNELS.menu.connectAi) },
        { type: 'separator' },
        { label: 'About API Documentation', click: showAbout },
      ],
    },
  ])
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(buildApplicationMenu())
  watchExternalWorkspaceChanges()
  setupAutoUpdate()
  if (process.defaultApp && process.argv.length >= 2) app.setAsDefaultProtocolClient('api-docs', process.execPath, [process.argv[1]])
  else app.setAsDefaultProtocolClient('api-docs')
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  if (databaseWatchTimer) clearInterval(databaseWatchTimer)
})

app.on('open-url', (event, url) => {
  event.preventDefault()
  receiveDeepLink(url)
})

app.on('second-instance', (_event, commandLine) => {
  const link = commandLine.find((argument) => argument.startsWith('api-docs://'))
  if (link) receiveDeepLink(link)
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

const launchLink = process.argv.find((argument) => argument.startsWith('api-docs://'))
if (launchLink) receiveDeepLink(launchLink)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
