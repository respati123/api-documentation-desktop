import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

// Enforces the UI rules in AGENTS.md: no raw HTML controls, no text literals, no logic in views, and
// `t()` called only with constants. Files that still break a rule are listed in `legacyViolations`.
// The list only shrinks: a listed file that is clean fails the test until you delete its line.

const root = join(__dirname, '..')
const SYNCED_UI_DIR = join(root, 'shared', 'ui')
const rawElements = new Set(['button', 'input', 'select', 'textarea', 'label', 'table', 'hr', 'a'])
const textAttributes = new Set(['aria-label', 'title', 'placeholder', 'alt', 'label'])
const interactiveComponents = new Set(['Button', 'Input', 'Textarea', 'SelectTrigger', 'TabsTrigger'])
const hookNames = new Set(['useState', 'useEffect', 'useLayoutEffect', 'useReducer', 'useRef', 'useMemo', 'useCallback'])

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    // shared/ui is the synced copy of the UI library (`bun run sync-ui`). It defines the controls, so the rules do not apply to it.
    if (entry.isDirectory()) return path === SYNCED_UI_DIR ? [] : sourceFiles(path)
    return entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx') ? [path] : []
  })
}

function findViolations(path: string): string[] {
  const text = readFileSync(path, 'utf8')
  const file = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const isView = path.endsWith('.view.tsx')
  const found = new Set<string>()
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node) && /\p{L}/u.test(node.text)) found.add('text literal')
    if (ts.isJsxAttribute(node) && textAttributes.has(node.name.getText()) && node.initializer && ts.isStringLiteral(node.initializer))
      found.add('text literal')
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText()
      if (rawElements.has(tag)) found.add('raw element')
      const hasTestId = node.attributes.properties.some(
        (attribute) => ts.isJsxSpreadAttribute(attribute) || (ts.isJsxAttribute(attribute) && attribute.name.getText() === 'data-testid'),
      )
      if ((interactiveComponents.has(tag) || rawElements.has(tag)) && !hasTestId) found.add('missing data-testid')
    }
    if (ts.isCallExpression(node)) {
      const callee = node.expression.getText()
      if (callee === 't' && node.arguments[0] && (ts.isStringLiteral(node.arguments[0]) || ts.isTemplateExpression(node.arguments[0])))
        found.add('literal translation key')
      if (isView && hookNames.has(callee)) found.add('hook in view')
      if (isView && (callee === 'fetch' || callee.startsWith('window.apiDesktop'))) found.add('data call in view')
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return [...found].sort()
}

const legacyViolations = new Set<string>([])

describe('UI rules', () => {
  const files = sourceFiles(root).map((path) => relative(root, path))

  it.each(files)('%s follows the UI rules or is listed as legacy', (file) => {
    const violations = findViolations(join(root, file))
    if (legacyViolations.has(file)) expect(violations, `${file} is clean now. Remove it from legacyViolations.`).not.toEqual([])
    else expect(violations).toEqual([])
  })
})
