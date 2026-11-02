#!/usr/bin/env node
// Scaffolds a renderer feature (or one more view in an existing feature) that follows AGENTS.md.
// Usage: bun .agents/skills/new-feature/scripts/scaffold.mjs <feature> [--view <view>] [--root <desktop folder>]
// Never overwrites a file. Prints what it created, what it skipped, and the manual steps left.

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const args = process.argv.slice(2)
const flag = (name) => {
  const index = args.indexOf(`--${name}`)
  return index === -1 ? null : args[index + 1]
}
const feature = args.find((arg, i) => !arg.startsWith('--') && !args[i - 1]?.startsWith('--'))
const view = flag('view') ?? feature
const root = flag('root') ?? process.cwd()

const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
if (!feature || !KEBAB.test(feature) || !KEBAB.test(view)) {
  console.error('Usage: scaffold.mjs <feature> [--view <view>] [--root <dir>]  (names in kebab-case English)')
  process.exit(1)
}

const pascal = (name) => name.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('')
const camel = (name) => pascal(name)[0].toLowerCase() + pascal(name).slice(1)
const screaming = (name) => name.replaceAll('-', '_').toUpperCase()

const F = { kebab: feature, pascal: pascal(feature), camel: camel(feature), screaming: screaming(feature) }
const V = { kebab: view, pascal: pascal(view), camel: camel(view) }
const testId = (element) => `${F.kebab}-${V.kebab}-${element}`

const rendererRoot = join(root, 'src', 'renderer', 'src')
const featureRoot = join(rendererRoot, 'features', feature)
const localeRoot = join(rendererRoot, 'shared', 'i18n', 'locales')
const featureImport = `@/features/${feature}`

if (!existsSync(rendererRoot)) {
  console.error(`Renderer folder not found: ${rendererRoot}. Run from the desktop folder or pass --root.`)
  process.exit(1)
}

const files = {
  [join(featureRoot, 'constants', `${feature}-text.constants.ts`)]: `export const ${F.screaming}_TEXT = {
  title: 'title',
  empty: 'empty',
  retry: 'retry',
} as const
`,

  [join(featureRoot, 'models', `${feature}.model.ts`)]: `import { z } from 'zod'

export const ${F.camel}ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
})
export const ${F.camel}ListSchema = z.array(${F.camel}ItemSchema)

export type ${F.pascal}Item = z.infer<typeof ${F.camel}ItemSchema>
`,

  [join(featureRoot, 'services', `${feature}.service.ts`)]: `import { ${F.camel}ListSchema, type ${F.pascal}Item } from '${featureImport}/models/${feature}.model'
import { apiCall } from '@/shared/services/api-client'

// Replace the endpoint and match apiCall's real signature (or use window.apiDesktop for main-process data).
export const ${F.camel}Service = {
  list: async (): Promise<${F.pascal}Item[]> => ${F.camel}ListSchema.parse(await apiCall('/api/${feature}')),
}
`,

  [join(featureRoot, 'viewmodels', `${feature}.keys.ts`)]: `export const ${F.camel}Keys = {
  all: ['${feature}'] as const,
  list: () => [...${F.camel}Keys.all, 'list'] as const,
}
`,

  [join(featureRoot, 'viewmodels', `use-${view}.viewmodel.ts`)]: `import { useQuery } from '@tanstack/react-query'

import { ${F.camel}Service } from '${featureImport}/services/${feature}.service'
import { ${F.camel}Keys } from '${featureImport}/viewmodels/${feature}.keys'
import type { ${V.pascal}ViewProps } from '${featureImport}/views/${view}.view'

export const use${V.pascal}ViewModel = (): ${V.pascal}ViewProps => {
  const query = useQuery({
    queryKey: ${F.camel}Keys.list(),
    queryFn: () => ${F.camel}Service.list(),
    staleTime: 60_000,
  })

  const items = query.data ?? []

  return {
    status: query.status,
    items,
    isEmpty: query.status === 'success' && items.length === 0,
    errorMessage: query.error ? query.error.message : null,
    onRetry: () => {
      void query.refetch()
    },
  }
}
`,

  [join(featureRoot, 'viewmodels', `use-${view}.viewmodel.test.ts`)]: `import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ${F.camel}Service } from '${featureImport}/services/${feature}.service'
import { use${V.pascal}ViewModel } from '${featureImport}/viewmodels/use-${view}.viewmodel'

vi.mock('${featureImport}/services/${feature}.service')

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }, children)

describe('use${V.pascal}ViewModel', () => {
  it('returns items on success', async () => {
    vi.mocked(${F.camel}Service.list).mockResolvedValue([{ id: '1', name: 'First' }])
    const { result } = renderHook(() => use${V.pascal}ViewModel(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.isEmpty).toBe(false)
  })

  it('returns the backend message on error', async () => {
    vi.mocked(${F.camel}Service.list).mockRejectedValue(new Error('Backend says no'))
    const { result } = renderHook(() => use${V.pascal}ViewModel(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.errorMessage).toBe('Backend says no')
  })
})
`,

  [join(featureRoot, 'views', `${view}.view.tsx`)]: `import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

import type { ${F.pascal}Item } from '${featureImport}/models/${feature}.model'
import { ${F.screaming}_TEXT } from '${featureImport}/constants/${feature}-text.constants'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'

export interface ${V.pascal}ViewProps {
  status: 'pending' | 'error' | 'success'
  items: ${F.pascal}Item[]
  isEmpty: boolean
  errorMessage: string | null
  onRetry: () => void
}

export const ${V.pascal}View = ({ status, items, isEmpty, errorMessage, onRetry }: ${V.pascal}ViewProps): ReactElement => {
  const { t } = useTranslation('${feature}')

  return (
    <section data-testid="${testId('container')}" className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t(${F.screaming}_TEXT.title)}</h2>
      {status === 'pending' ? <Skeleton data-testid="${testId('skeleton')}" className="h-24 w-full" /> : null}
      {status === 'error' ? (
        <Alert data-testid="${testId('error')}" variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
          <Button data-testid="${testId('retry-button')}" variant="outline" onClick={onRetry}>
            {t(${F.screaming}_TEXT.retry)}
          </Button>
        </Alert>
      ) : null}
      {isEmpty ? <p data-testid="${testId('empty')}" className="text-muted-foreground">{t(${F.screaming}_TEXT.empty)}</p> : null}
      {items.map((item) => (
        <div key={item.id} data-testid="${testId('item')}">
          {item.name}
        </div>
      ))}
    </section>
  )
}
`,

  [join(featureRoot, 'views', `${view}.view.test.tsx`)]: `import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ${V.pascal}View, type ${V.pascal}ViewProps } from '${featureImport}/views/${view}.view'

const defaultProps: ${V.pascal}ViewProps = {
  status: 'success',
  items: [{ id: '1', name: 'First' }],
  isEmpty: false,
  errorMessage: null,
  onRetry: vi.fn(),
}

describe('${V.pascal}View', () => {
  it('renders a row per item', () => {
    render(<${V.pascal}View {...defaultProps} />)
    expect(screen.getAllByTestId('${testId('item')}')).toHaveLength(1)
  })

  it('shows the skeleton while pending', () => {
    render(<${V.pascal}View {...defaultProps} status="pending" items={[]} />)
    expect(screen.getByTestId('${testId('skeleton')}')).toBeTruthy()
  })

  it('calls onRetry from the error state', () => {
    const onRetry = vi.fn()
    render(<${V.pascal}View {...defaultProps} status="error" items={[]} errorMessage="Failed" onRetry={onRetry} />)
    fireEvent.click(screen.getByTestId('${testId('retry-button')}'))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
`,

  [join(featureRoot, 'pages', `${view}.page.tsx`)]: `import type { ReactElement } from 'react'

import { use${V.pascal}ViewModel } from '${featureImport}/viewmodels/use-${view}.viewmodel'
import { ${V.pascal}View } from '${featureImport}/views/${view}.view'

export const ${V.pascal}Page = (): ReactElement => {
  const vm = use${V.pascal}ViewModel()
  return <${V.pascal}View {...vm} />
}
`,

  [join(featureRoot, 'index.ts')]: `export { ${V.pascal}Page } from '${featureImport}/pages/${view}.page'
`,

  [join(localeRoot, 'en', `${feature}.json`)]: `${JSON.stringify({ title: F.pascal, empty: 'Nothing here yet.', retry: 'Try again' }, null, 2)}
`,

  [join(localeRoot, 'id', `${feature}.json`)]: `${JSON.stringify({ title: F.pascal, empty: 'Belum ada data.', retry: 'Coba lagi' }, null, 2)}
`,
}

const created = []
const skipped = []
for (const [path, content] of Object.entries(files)) {
  const rel = path.slice(root.length + 1)
  if (existsSync(path)) {
    skipped.push(rel)
    continue
  }
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
  created.push(rel)
}

console.log(`Created (${created.length}):`)
for (const rel of created) console.log(`  + ${rel}`)
if (skipped.length > 0) {
  console.log(`Skipped, already exists (${skipped.length}):`)
  for (const rel of skipped) console.log(`  = ${rel}`)
}

const todo = [
  `Register the "${feature}" namespace in shared/i18n/index.ts if it is not loaded automatically.`,
  'Replace the placeholder schema, endpoint, and locale text with the real ones (en first, then id).',
  `Wire ${V.pascal}Page into the app routing or composition root.`,
]
if (skipped.some((rel) => rel.endsWith('index.ts'))) {
  todo.unshift(`Add "export { ${V.pascal}Page } from '${featureImport}/pages/${view}.page'" to features/${feature}/index.ts.`)
}
console.log('\nManual steps left:')
for (const step of todo) console.log(`  - ${step}`)
