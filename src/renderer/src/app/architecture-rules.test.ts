// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parse } from '@babel/parser'
import * as t from '@babel/types'
import { describe, expect, it } from 'vitest'

// Enforces references/architecture.md: absolute imports, feature boundaries, and MVVM layer rules.

const RENDERER_ROOT = fileURLToPath(new URL('..', import.meta.url))
// shared/ui is a copy of the storybook library made by `bun run sync-ui`. It uses relative imports and is not edited here.
const SYNCED_UI_DIR = join(RENDERER_ROOT, 'shared', 'ui')
const ALLOWED_VIEW_HOOKS = new Set(['useTranslation'])
const REACT_PACKAGE = /^(react|react-dom|react-i18next|@tanstack\/react-.+)(\/.*)?$/

const listSourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      return name === 'node_modules' || full === SYNCED_UI_DIR ? [] : listSourceFiles(full)
    }
    return /\.tsx?$/.test(name) && !name.endsWith('.d.ts') ? [full] : []
  })

const parseFile = (file: string, code: string): t.File =>
  parse(code, {
    sourceType: 'module',
    errorRecovery: true,
    plugins: file.endsWith('.tsx') ? ['typescript', 'jsx'] : ['typescript'],
  })

const memberPath = (node: t.Node): string | null =>
  (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) && t.isIdentifier(node.object) && t.isIdentifier(node.property)
    ? `${node.object.name}.${node.property.name}`
    : null

const moduleSpecifier = (node: t.Node): string | null => {
  if ((t.isImportDeclaration(node) || t.isExportAllDeclaration(node) || t.isExportNamedDeclaration(node)) && node.source) {
    return node.source.value
  }
  if (t.isImportExpression(node) && t.isStringLiteral(node.source)) return node.source.value
  if (t.isCallExpression(node)) {
    const [first] = node.arguments
    const isDynamicImport = t.isImport(node.callee)
    const callee = memberPath(node.callee)
    const isMock = callee === 'vi.mock' || callee === 'vi.doMock'
    if ((isDynamicImport || isMock) && t.isStringLiteral(first)) return first.value
  }
  return null
}

const calledName = (node: t.CallExpression): string => {
  if (t.isIdentifier(node.callee)) return node.callee.name
  if (t.isMemberExpression(node.callee) && t.isIdentifier(node.callee.property)) return node.callee.property.name
  return ''
}

const checkFile = (file: string): string[] => {
  const rel = relative(RENDERER_ROOT, file).split(sep).join('/')
  const code = readFileSync(file, 'utf8')
  const problems: string[] = []
  const report = (node: t.Node, message: string): void => {
    problems.push(`${rel}:${node.loc?.start.line ?? 0} ${message}`)
  }

  const ownFeature = rel.match(/^features\/([^/]+)\//)?.[1] ?? null
  const isTest = /\.test\.tsx?$/.test(rel)
  const isView = !isTest && /\/views\/[^/]+\.tsx$/.test(rel)
  const isPage = !isTest && /\/pages\/[^/]+\.tsx$/.test(rel)
  const isService = !isTest && /\/services\/[^/]+\.ts$/.test(rel)
  const isPureHelper = !isTest && (rel.startsWith('lib/') || rel.startsWith('shared/utils/') || /^features\/[^/]+\/lib\//.test(rel))
  const isShared = rel.startsWith('shared/') || rel.startsWith('lib/')

  t.traverse(parseFile(file, code), {
    enter(node) {
      const specifier = moduleSpecifier(node)
      if (specifier !== null) {
        if (specifier.startsWith('./') || specifier.startsWith('../')) {
          report(node, `relative import "${specifier}". Use the @/ alias.`)
        }
        const target = specifier.match(/^@\/features\/([^/]+)(\/.*)?$/)
        if (target) {
          const [, targetFeature, deepPath] = target
          if (isShared) report(node, `shared/ and lib/ must not import from features ("${specifier}").`)
          if (deepPath && targetFeature !== ownFeature) {
            report(node, `deep import into another feature ("${specifier}"). Import from @/features/${targetFeature}.`)
          }
        }
        if ((isView || isPage) && specifier.includes('/services/')) {
          report(node, `views and pages must not import services ("${specifier}"). Use the ViewModel.`)
        }
        if ((isService || isPureHelper) && REACT_PACKAGE.test(specifier)) {
          report(node, `services and pure helpers must not import React ("${specifier}").`)
        }
      }

      if (isView && t.isCallExpression(node)) {
        const name = calledName(node)
        if (/^use[A-Z]/.test(name) && !ALLOWED_VIEW_HOOKS.has(name)) {
          report(node, `view calls ${name}(). Move state and effects to the ViewModel.`)
        }
        if (name === 'fetch') report(node, 'view calls fetch(). Fetch in a service through the ViewModel.')
      }

      if (!isTest && !isService && memberPath(node) === 'window.apiDesktop') {
        report(node, 'window.apiDesktop is used outside a service.')
      }
    },
  })

  return problems
}

describe('renderer architecture rules', () => {
  const files = listSourceFiles(RENDERER_ROOT)

  it('finds renderer source files', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it('follows import, boundary, and layer rules', () => {
    expect(files.flatMap(checkFile)).toEqual([])
  })
})
