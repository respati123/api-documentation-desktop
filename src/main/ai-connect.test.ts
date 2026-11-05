import { describe, expect, it } from 'vitest'
import { windowsCommandLine } from './ai-connect'

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
