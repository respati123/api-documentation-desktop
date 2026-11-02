// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parse } from '@babel/parser'
import * as t from '@babel/types'
import { describe, expect, it } from 'vitest'

// Enforces references/testing.md: interactive shadcn elements carry a data-testid in [feature]-[component]-[element] form.

const RENDERER_ROOT = fileURLToPath(new URL('..', import.meta.url))

const INTERACTIVE_TAGS = new Set([
  'Button',
  'Input',
  'Textarea',
  'SelectTrigger',
  'Checkbox',
  'Switch',
  'RadioGroupItem',
  'Slider',
  'Toggle',
  'ToggleGroupItem',
  'TabsTrigger',
  'DropdownMenuItem',
  'ContextMenuItem',
  'MenubarItem',
  'CommandItem',
  'CommandInput',
  'DialogContent',
  'AlertDialogContent',
  'SheetContent',
  'DrawerContent',
  'PopoverContent',
])

const TEST_ID_FORMAT = /^[a-z0-9]+(-[a-z0-9]+){2,}$/

const isCheckedFile = (rel: string): boolean =>
  rel.endsWith('.tsx') &&
  !rel.endsWith('.test.tsx') &&
  (/^features\/[^/]+\/(views|pages|components)\//.test(rel) ||
    (rel.startsWith('shared/components/') && !rel.startsWith('shared/components/ui/')))

const listFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (name === 'node_modules') return []
    return statSync(full).isDirectory() ? listFiles(full) : [full]
  })

const tagName = (name: t.JSXOpeningElement['name']): string => {
  if (t.isJSXIdentifier(name)) return name.name
  if (t.isJSXMemberExpression(name)) return name.property.name
  return ''
}

const checkFile = (file: string, rel: string): string[] => {
  const ast = parse(readFileSync(file, 'utf8'), { sourceType: 'module', errorRecovery: true, plugins: ['typescript', 'jsx'] })
  const problems: string[] = []

  t.traverse(ast, {
    enter(node) {
      if (!t.isJSXOpeningElement(node)) return
      const tag = tagName(node.name)
      if (!INTERACTIVE_TAGS.has(tag)) return

      const line = node.loc?.start.line ?? 0
      const hasSpread = node.attributes.some((attribute) => t.isJSXSpreadAttribute(attribute))
      const testId = node.attributes.find(
        (attribute): attribute is t.JSXAttribute =>
          t.isJSXAttribute(attribute) && t.isJSXIdentifier(attribute.name) && attribute.name.name === 'data-testid',
      )

      if (!testId && !hasSpread) problems.push(`${rel}:${line} <${tag}> has no data-testid.`)
      if (testId && t.isStringLiteral(testId.value) && !TEST_ID_FORMAT.test(testId.value.value)) {
        problems.push(`${rel}:${line} data-testid "${testId.value.value}" is not [feature]-[component]-[element].`)
      }
    },
  })

  return problems
}

describe('data-testid rules', () => {
  it('every interactive element has a well-formed data-testid', () => {
    const problems = listFiles(RENDERER_ROOT)
      .map((file) => ({ file, rel: relative(RENDERER_ROOT, file).split(sep).join('/') }))
      .filter(({ rel }) => isCheckedFile(rel))
      .flatMap(({ file, rel }) => checkFile(file, rel))

    expect(problems).toEqual([])
  })
})
