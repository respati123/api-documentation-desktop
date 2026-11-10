import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  agyMcpCommands,
  antigravityConfigPath,
  claudeDesktopConfigPath,
  geminiMcpCommands,
  geminiSettingsPath,
  windowsCommandLine,
} from './ai-connect'

describe('windowsCommandLine', () => {
  it('quotes the npm path under Program Files, so cmd.exe does not cut it at the space', () => {
    expect(
      windowsCommandLine('C:\\Program Files\\nodejs\\npm.cmd', [
        'install',
        '--prefix',
        'C:\\Users\\Jane\\AppData\\Roaming\\app\\ai-tools',
        '@openai/codex',
      ]),
    ).toBe('"C:\\Program Files\\nodejs\\npm.cmd" install --prefix C:\\Users\\Jane\\AppData\\Roaming\\app\\ai-tools @openai/codex')
  })

  it('quotes an argument that has a space, such as a user folder with a space in its name', () => {
    expect(windowsCommandLine('codex.cmd', ['--prefix', 'C:\\Users\\Jane Doe\\ai-tools'])).toBe(
      'codex.cmd --prefix "C:\\Users\\Jane Doe\\ai-tools"',
    )
  })

  it('leaves plain parts unquoted', () => {
    expect(windowsCommandLine('codex.cmd', ['mcp', 'remove', 'api-documentation'])).toBe('codex.cmd mcp remove api-documentation')
  })

  it('quotes cmd.exe special characters', () => {
    expect(windowsCommandLine('C:\\Tools\\a&b.cmd', ['x|y'])).toBe('"C:\\Tools\\a&b.cmd" "x|y"')
  })

  it('refuses a double quote, which cmd.exe cannot carry safely', () => {
    expect(() => windowsCommandLine('npm.cmd', ['say "hi"'])).toThrow(/double quote/)
  })
})

describe('config file locations per operating system', () => {
  it('finds Claude Desktop on macOS and Windows, and not on Linux, where Claude Desktop has no official build', () => {
    expect(claudeDesktopConfigPath('darwin', {}, '/Users/ana')).toBe(
      '/Users/ana/Library/Application Support/Claude/claude_desktop_config.json',
    )
    expect(claudeDesktopConfigPath('win32', { APPDATA: 'C:\\Users\\ana\\AppData\\Roaming' }, 'C:\\Users\\ana')).toBe(
      join('C:\\Users\\ana\\AppData\\Roaming', 'Claude', 'claude_desktop_config.json'),
    )
    expect(claudeDesktopConfigPath('linux', {}, '/home/ana')).toBeNull()
  })

  it('refuses Claude Desktop on Windows when APPDATA is not set', () => {
    expect(claudeDesktopConfigPath('win32', {}, 'C:\\Users\\ana')).toBeNull()
  })

  it('reads the Antigravity global MCP file from the home folder, the same way on every system', () => {
    expect(antigravityConfigPath('/home/ana')).toBe(join('/home/ana', '.gemini', 'config', 'mcp_config.json'))
    expect(antigravityConfigPath('C:\\Users\\ana')).toBe(join('C:\\Users\\ana', '.gemini', 'config', 'mcp_config.json'))
  })
})

describe('agy mcp commands', () => {
  it('removes the old entry, then adds this app as the server, with the command after --', () => {
    expect(agyMcpCommands(['/app/node', '/app/npx-cli.js', '-y', 'api-documentation-mcp@latest'])).toEqual({
      remove: ['mcp', 'remove', 'api-documentation'],
      add: ['mcp', 'add', 'api-documentation', '--', '/app/node', '/app/npx-cli.js', '-y', 'api-documentation-mcp@latest'],
    })
  })
})

describe('Gemini CLI', () => {
  it('keeps its user settings in the home folder, in the file the CLI reads', () => {
    expect(geminiSettingsPath('/home/ana')).toBe(join('/home/ana', '.gemini', 'settings.json'))
  })

  it('removes and adds this app in the user scope, with the command after the name and no -- separator', () => {
    expect(geminiMcpCommands(['/app/node', '/app/npx-cli.js', '-y', 'api-documentation-mcp@latest'])).toEqual({
      remove: ['mcp', 'remove', '-s', 'user', 'api-documentation'],
      add: ['mcp', 'add', '-s', 'user', 'api-documentation', '/app/node', '/app/npx-cli.js', '-y', 'api-documentation-mcp@latest'],
    })
  })
})
