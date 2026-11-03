// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parse } from '@babel/parser'
import * as t from '@babel/types'
import { describe, expect, it } from 'vitest'

// Enforces references/security.md and references/main-process.md by reading the source of src/main and src/preload.

const SRC_ROOT = fileURLToPath(new URL('..', import.meta.url))

const REQUIRED_WEB_PREFERENCES: Record<string, boolean> = {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
}
const FORBIDDEN_WEB_PREFERENCES: Record<string, boolean> = {
  webSecurity: false,
  allowRunningInsecureContent: true,
  webviewTag: true,
  nodeIntegrationInWorker: true,
  nodeIntegrationInSubFrames: true,
}
const IPC_CHANNEL_CALLS = new Set([
  'ipcMain.handle',
  'ipcMain.handleOnce',
  'ipcMain.on',
  'ipcMain.once',
  'ipcRenderer.invoke',
  'ipcRenderer.send',
  'ipcRenderer.on',
  'ipcRenderer.once',
])

interface SourceFile {
  rel: string
  code: string
  ast: t.File
}

const listSources = (dir: string): SourceFile[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return name === 'node_modules' ? [] : listSources(full)
    if (!/\.tsx?$/.test(name) || name.endsWith('.d.ts') || /\.test\.tsx?$/.test(name)) return []
    const code = readFileSync(full, 'utf8')
    const ast = parse(code, { sourceType: 'module', errorRecovery: true, plugins: ['typescript'] })
    return [{ rel: relative(SRC_ROOT, full).split(sep).join('/'), code, ast }]
  })

const at = (file: SourceFile, node: t.Node): string => `${file.rel}:${node.loc?.start.line ?? 0}`

const textOf = (file: SourceFile, node: t.Node): string => file.code.slice(node.start ?? 0, node.end ?? 0)

const memberPath = (node: t.Node): string | null =>
  t.isMemberExpression(node) && t.isIdentifier(node.object) && t.isIdentifier(node.property)
    ? `${node.object.name}.${node.property.name}`
    : null

const keyName = (property: t.ObjectProperty): string | null => {
  if (t.isIdentifier(property.key)) return property.key.name
  if (t.isStringLiteral(property.key)) return property.key.value
  return null
}

const mainFiles = listSources(join(SRC_ROOT, 'main'))
const preloadFiles = listSources(join(SRC_ROOT, 'preload'))
const allFiles = [...mainFiles, ...preloadFiles]

const collect = (files: SourceFile[], check: (file: SourceFile, node: t.Node, parent: t.Node | null) => string | null): string[] =>
  files.flatMap((file) => {
    const problems: string[] = []
    t.traverse(file.ast, {
      enter(node, ancestors) {
        const parent = ancestors.at(-1)?.node ?? null
        const problem = check(file, node, parent)
        if (problem) problems.push(`${at(file, node)} ${problem}`)
      },
    })
    return problems
  })

describe('BrowserWindow security', () => {
  it('every webPreferences object keeps the required settings', () => {
    let found = 0
    const problems = collect(mainFiles, (_file, node) => {
      if (!t.isObjectProperty(node) || keyName(node) !== 'webPreferences') return null
      if (!t.isObjectExpression(node.value)) return 'webPreferences must be an object literal so it can be checked.'
      found += 1

      const values = new Map<string, boolean>()
      for (const property of node.value.properties) {
        const key = t.isObjectProperty(property) ? keyName(property) : null
        if (key && t.isObjectProperty(property) && t.isBooleanLiteral(property.value)) values.set(key, property.value.value)
      }
      const wrong = [
        ...Object.entries(REQUIRED_WEB_PREFERENCES)
          .filter(([key, expected]) => values.get(key) !== expected)
          .map(([key, expected]) => `${key} must be ${expected}`),
        ...Object.entries(FORBIDDEN_WEB_PREFERENCES)
          .filter(([key, forbidden]) => values.get(key) === forbidden)
          .map(([key, forbidden]) => `${key} must not be ${forbidden}`),
      ]
      return wrong.length > 0 ? `webPreferences: ${wrong.join(', ')}.` : null
    })

    expect(found).toBeGreaterThan(0)
    expect(problems).toEqual([])
  })

  it('blocks new windows and foreign navigation', () => {
    const code = mainFiles.map((file) => file.code).join('\n')
    expect(code).toContain('setWindowOpenHandler')
    expect(code).toContain('will-navigate')
  })
})

describe('IPC rules', () => {
  it('channel names come from CHANNELS, never string literals', () => {
    const problems = collect(allFiles, (_file, node) => {
      if (!t.isCallExpression(node)) return null
      const callee = memberPath(node.callee)
      if (!callee || !IPC_CHANNEL_CALLS.has(callee)) return null
      const [channel] = node.arguments
      return t.isStringLiteral(channel) || t.isTemplateLiteral(channel) ? `${callee} uses a literal channel. Use CHANNELS.` : null
    })
    expect(problems).toEqual([])
  })

  it('does not use synchronous IPC', () => {
    const problems = collect(allFiles, (_file, node) =>
      t.isMemberExpression(node) && t.isIdentifier(node.property) && node.property.name === 'sendSync' ? 'sendSync is not allowed.' : null,
    )
    expect(problems).toEqual([])
  })

  it('inline ipcMain.handle callbacks validate input and check the sender', () => {
    const problems = collect(mainFiles, (file, node) => {
      if (!t.isCallExpression(node) || memberPath(node.callee) !== 'ipcMain.handle') return null
      const handler = node.arguments[1]
      if (!t.isArrowFunctionExpression(handler) && !t.isFunctionExpression(handler)) return null
      const body = textOf(file, handler)
      const missing = [
        /\.(safeParse|parse)\(/.test(body) ? null : 'parse its input with zod',
        body.includes('assertTrustedSender(') ? null : 'call assertTrustedSender',
      ].filter((item): item is string => item !== null)
      return missing.length > 0 ? `handler does not ${missing.join(' or ')}.` : null
    })
    expect(problems).toEqual([])
  })

  it('preload never exposes ipcRenderer itself', () => {
    const problems = collect(preloadFiles, (_file, node, parent) => {
      if (!t.isIdentifier(node) || node.name !== 'ipcRenderer' || !parent) return null
      const isMemberUse = (t.isMemberExpression(parent) || t.isOptionalMemberExpression(parent)) && parent.object === node
      const isImport = t.isImportSpecifier(parent) || t.isImportDefaultSpecifier(parent) || t.isImportNamespaceSpecifier(parent)
      return isMemberUse || isImport ? null : 'ipcRenderer is passed or exposed directly.'
    })
    expect(problems).toEqual([])
  })
})
