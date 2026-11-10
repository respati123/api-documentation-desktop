import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { delimiter, dirname, join } from 'node:path'
import { isRecord } from '../renderer/src/shared/utils/record'
import { findOnPath, type NodeRuntimePaths, readNodeRuntime } from './node-runtime'

// Connects the local API Documentation MCP server to AI clients. The MCP server is
// started by the client with the app's own Node runtime, so it works without the
// user's shell PATH.

export const mcpServerName = 'api-documentation'
const mcpPackage = 'api-documentation-mcp@latest'

export type AiToolId = 'codex' | 'claude-cli' | 'claude-desktop' | 'antigravity' | 'gemini'

export type AiToolStatus = {
  id: AiToolId
  supported: boolean
  installed: boolean
  connected: boolean
}

export type AiConnectStatus = {
  node: { installed: boolean; version?: string; source?: 'app' | 'system' }
  tools: AiToolStatus[]
}

const cliPackages: Record<'codex' | 'claude-cli' | 'gemini', { package: string; bin: string }> = {
  codex: { package: '@openai/codex', bin: 'codex' },
  'claude-cli': { package: '@anthropic-ai/claude-code', bin: 'claude' },
  gemini: { package: '@google/gemini-cli', bin: 'gemini' },
}

function toolsDir(userDataDir: string): string {
  return join(userDataDir, 'ai-tools')
}

function appToolBin(userDataDir: string, bin: string): string {
  const name = process.platform === 'win32' ? `${bin}.cmd` : bin
  return join(toolsDir(userDataDir), 'node_modules', '.bin', name)
}

function runtimeEnv(runtime: NodeRuntimePaths): NodeJS.ProcessEnv {
  return { ...process.env, PATH: `${runtime.binDir}${delimiter}${process.env.PATH ?? ''}` }
}

function codexConfigPath(): string {
  return join(process.env.CODEX_HOME || join(homedir(), '.codex'), 'config.toml')
}

function claudeCliConfigPath(): string {
  return join(homedir(), '.claude.json')
}

// Claude Desktop has an official build for macOS and Windows only. On Linux there is no config file to write.
export function claudeDesktopConfigPath(platform: NodeJS.Platform, env: NodeJS.ProcessEnv, home: string): string | null {
  if (platform === 'darwin') return join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')
  if (platform === 'win32' && env.APPDATA) return join(env.APPDATA, 'Claude', 'claude_desktop_config.json')
  return null
}

// Gemini CLI keeps its user settings here, with the MCP servers under mcpServers.
export function geminiSettingsPath(home: string): string {
  return join(home, '.gemini', 'settings.json')
}

// The Gemini CLI commands that replace this app's entry in the user scope. Unlike agy, it takes the command without a -- separator.
export function geminiMcpCommands(command: string[]): { remove: string[]; add: string[] } {
  return {
    remove: ['mcp', 'remove', '-s', 'user', mcpServerName],
    add: ['mcp', 'add', '-s', 'user', mcpServerName, ...command],
  }
}

// Antigravity's agy CLI reads and writes its global MCP servers here. Checked on Linux with agy mcp list.
export function antigravityConfigPath(home: string): string {
  return join(home, '.gemini', 'config', 'mcp_config.json')
}

// The agy commands that replace this app's entry. A command after -- is the server command. Flags come before the name.
export function agyMcpCommands(command: string[]): { remove: string[]; add: string[] } {
  return {
    remove: ['mcp', 'remove', mcpServerName],
    add: ['mcp', 'add', mcpServerName, '--', ...command],
  }
}

async function readJson(path: string): Promise<Record<string, unknown>> {
  try {
    const parsed: unknown = JSON.parse(await readFile(path, 'utf8'))
    return isRecord(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

async function resolveCli(userDataDir: string, id: 'codex' | 'claude-cli' | 'gemini'): Promise<string | null> {
  const appBin = appToolBin(userDataDir, cliPackages[id].bin)
  if (existsSync(appBin)) return appBin
  return findOnPath(cliPackages[id].bin)
}

export async function getAiConnectStatus(userDataDir: string): Promise<AiConnectStatus> {
  const runtime = await readNodeRuntime(join(userDataDir, 'runtime'))
  const codexConfig = await readFile(codexConfigPath(), 'utf8').catch(() => '')
  const claudeCli = await readJson(claudeCliConfigPath())
  const desktopPath = claudeDesktopConfigPath(process.platform, process.env, homedir())
  const desktop = desktopPath ? await readJson(desktopPath) : {}
  const desktopServers = isRecord(desktop.mcpServers) ? desktop.mcpServers : {}
  const cliServers = isRecord(claudeCli.mcpServers) ? claudeCli.mcpServers : {}
  const gemini = await readJson(geminiSettingsPath(homedir()))
  const geminiServers = isRecord(gemini.mcpServers) ? gemini.mcpServers : {}
  const antigravity = await readJson(antigravityConfigPath(homedir()))
  const antigravityServers = isRecord(antigravity.mcpServers) ? antigravity.mcpServers : {}

  return {
    node: runtime.installed ? { installed: true, version: runtime.version, source: runtime.source } : { installed: false },
    tools: [
      {
        id: 'codex',
        supported: true,
        installed: Boolean(await resolveCli(userDataDir, 'codex')),
        connected: codexConfig.includes(`[mcp_servers.${mcpServerName}]`),
      },
      {
        id: 'claude-cli',
        supported: true,
        installed: Boolean(await resolveCli(userDataDir, 'claude-cli')),
        connected: Boolean(cliServers[mcpServerName]),
      },
      {
        id: 'claude-desktop',
        supported: desktopPath !== null,
        installed: desktopPath !== null && existsSync(dirname(desktopPath)),
        connected: Boolean(desktopServers[mcpServerName]),
      },
      {
        id: 'antigravity',
        supported: true,
        installed: Boolean(await findOnPath('agy')),
        connected: Boolean(antigravityServers[mcpServerName]),
      },
      {
        id: 'gemini',
        supported: true,
        installed: Boolean(await resolveCli(userDataDir, 'gemini')),
        connected: Boolean(geminiServers[mcpServerName]),
      },
    ],
  }
}

export type AiLogLine = (line: string) => void

// On Windows, npm and the CLIs are .cmd files, so they run through cmd.exe. Node joins the file and the arguments with spaces
// and does not quote them, so a path such as C:\Program Files\nodejs\npm.cmd is cut at its first space.
// This builds the command line with each part quoted. A double quote in a part is refused, because cmd.exe cannot carry it safely.
export function windowsCommandLine(file: string, args: string[]): string {
  return [file, ...args]
    .map((part) => {
      if (part.includes('"')) throw new Error(`A command part cannot contain a double quote: ${part}`)
      return /[\s&()^|<>]/.test(part) ? `"${part}"` : part
    })
    .join(' ')
}

function runCommand(file: string, args: string[], env: NodeJS.ProcessEnv, onLine: AiLogLine, cwd?: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const stdio: ['ignore', 'pipe', 'pipe'] = ['ignore', 'pipe', 'pipe']
    const child =
      process.platform === 'win32'
        ? spawn(windowsCommandLine(file, args), { env, cwd, shell: true, stdio })
        : spawn(file, args, { env, cwd, stdio })
    const forward = (chunk: Buffer) => {
      for (const line of chunk.toString().split(/\r?\n/)) if (line.trim()) onLine(line)
    }
    child.stdout.on('data', forward)
    child.stderr.on('data', forward)
    child.on('error', reject)
    child.on('close', (code) => resolve(code ?? 1))
  })
}

export async function installCli(
  userDataDir: string,
  runtime: NodeRuntimePaths,
  id: 'codex' | 'claude-cli' | 'gemini',
  onLine: AiLogLine,
): Promise<void> {
  const dir = toolsDir(userDataDir)
  await mkdir(dir, { recursive: true })
  onLine(`Installing ${cliPackages[id].package} into the app folder…`)
  const code = await runCommand(
    runtime.npm,
    ['install', '--prefix', dir, '--no-audit', '--no-fund', cliPackages[id].package],
    runtimeEnv(runtime),
    onLine,
  )
  if (code !== 0) throw new Error(`npm install failed for ${cliPackages[id].package} (exit ${code}).`)
  onLine('Install finished.')
}

function mcpCommand(runtime: NodeRuntimePaths): string[] {
  return [runtime.node, runtime.npxCli, '-y', mcpPackage]
}

async function connectWithCli(
  userDataDir: string,
  runtime: NodeRuntimePaths,
  id: 'codex' | 'claude-cli',
  onLine: AiLogLine,
): Promise<void> {
  const bin = await resolveCli(userDataDir, id)
  if (!bin) throw new Error(`${cliPackages[id].bin} is not installed yet. Install it first.`)
  const env = runtimeEnv(runtime)
  const scope = id === 'claude-cli' ? ['--scope', 'user'] : []
  const removeArgs = id === 'codex' ? ['mcp', 'remove', mcpServerName] : ['mcp', 'remove', mcpServerName, '--scope', 'user']
  // Replacing an existing entry keeps the command and args current. Removal failing is fine when none exists.
  await runCommand(bin, removeArgs, env, () => {}).catch(() => 0)
  onLine(`Registering ${mcpServerName} with ${cliPackages[id].bin}…`)
  const addArgs = [
    ...(id === 'codex' ? ['mcp', 'add', mcpServerName] : ['mcp', 'add', ...scope, mcpServerName]),
    '--',
    ...mcpCommand(runtime),
  ]
  const code = await runCommand(bin, addArgs, env, onLine)
  if (code !== 0) throw new Error(`${cliPackages[id].bin} mcp add failed (exit ${code}).`)
  onLine(`Connected. Start a new ${cliPackages[id].bin} session to use the tools.`)
}

async function connectAntigravity(runtime: NodeRuntimePaths, onLine: AiLogLine): Promise<void> {
  const bin = await findOnPath('agy')
  if (!bin) throw new Error('agy is not installed yet. Install Antigravity first, then connect again.')
  const env = runtimeEnv(runtime)
  const commands = agyMcpCommands(mcpCommand(runtime))
  // Replacing an existing entry keeps the command and args current. Removal failing is fine when none exists.
  await runCommand(bin, commands.remove, env, () => {}).catch(() => 0)
  onLine(`Registering ${mcpServerName} with agy…`)
  const code = await runCommand(bin, commands.add, env, onLine)
  if (code !== 0) throw new Error(`agy mcp add failed (exit ${code}).`)
  onLine('Connected. Start a new Antigravity session to use the tools.')
}

async function connectGemini(userDataDir: string, runtime: NodeRuntimePaths, onLine: AiLogLine): Promise<void> {
  const bin = await resolveCli(userDataDir, 'gemini')
  if (!bin) throw new Error('gemini is not installed yet. Install it first.')
  const env = runtimeEnv(runtime)
  const commands = geminiMcpCommands(mcpCommand(runtime))
  // Replacing an existing entry keeps the command and args current. Removal failing is fine when none exists.
  await runCommand(bin, commands.remove, env, () => {}).catch(() => 0)
  onLine(`Registering ${mcpServerName} with gemini…`)
  const code = await runCommand(bin, commands.add, env, onLine)
  if (code !== 0) throw new Error(`gemini mcp add failed (exit ${code}).`)
  onLine('Connected. Start a new Gemini CLI session to use the tools.')
}

async function connectClaudeDesktop(runtime: NodeRuntimePaths, onLine: AiLogLine): Promise<void> {
  const path = claudeDesktopConfigPath(process.platform, process.env, homedir())
  if (!path) throw new Error('Claude Desktop is not available on this operating system.')
  const config = await readJson(path)
  const servers = isRecord(config.mcpServers) ? config.mcpServers : {}
  const [command, ...args] = mcpCommand(runtime)
  servers[mcpServerName] = { command, args }
  config.mcpServers = servers
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`)
  onLine(`Wrote ${path}`)
  onLine('Restart Claude Desktop to load the API Documentation tools.')
}

export async function connectAiTool(userDataDir: string, runtime: NodeRuntimePaths, id: AiToolId, onLine: AiLogLine): Promise<void> {
  if (id === 'claude-desktop') return connectClaudeDesktop(runtime, onLine)
  if (id === 'antigravity') return connectAntigravity(runtime, onLine)
  if (id === 'gemini') return connectGemini(userDataDir, runtime, onLine)
  return connectWithCli(userDataDir, runtime, id, onLine)
}
