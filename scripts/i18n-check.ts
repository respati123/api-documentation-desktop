// Checks that every locale namespace has the same keys in `en` and `id`, and that every key named in a
// `*-text.constants.ts` file exists in `en`. Run with `bun run i18n-check`.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dir, '../src/renderer/src')
const localesDir = join(root, 'shared/i18n/locales')

function flatten(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, child]) => flatten(child, prefix ? `${prefix}.${key}` : key))
}

// i18next plural forms (key_one, key_other) differ by language, so compare them by their base name.
function readKeys(language: string, file: string): string[] {
  const keys = flatten(JSON.parse(readFileSync(join(localesDir, language, file), 'utf8')))
  return [...new Set(keys.map((key) => key.replace(/_(zero|one|two|few|many|other)$/, '')))].sort()
}

const problems: string[] = []
const enFiles = readdirSync(join(localesDir, 'en')).filter((file) => file.endsWith('.json'))
const idFiles = readdirSync(join(localesDir, 'id')).filter((file) => file.endsWith('.json'))

for (const file of new Set([...enFiles, ...idFiles])) {
  if (!enFiles.includes(file)) problems.push(`en/${file} is missing`)
  else if (!idFiles.includes(file)) problems.push(`id/${file} is missing`)
  else {
    const en = new Set(readKeys('en', file))
    const id = new Set(readKeys('id', file))
    for (const key of en) if (!id.has(key)) problems.push(`id/${file} is missing "${key}"`)
    for (const key of id) if (!en.has(key)) problems.push(`en/${file} is missing "${key}"`)
  }
}

function constantFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return constantFiles(path)
    return entry.name.endsWith('-text.constants.ts') ? [path] : []
  })
}

// A feature's constants name keys of the namespace that matches its folder. Shared constants use `common`.
for (const file of constantFiles(root)) {
  const feature = /features\/([^/]+)\//.exec(file)?.[1]
  const namespace = feature ? feature : 'common'
  if (!enFiles.includes(`${namespace}.json`)) {
    problems.push(`${file}: no locale file en/${namespace}.json`)
    continue
  }
  const known = new Set(readKeys('en', `${namespace}.json`))
  for (const [, key] of readFileSync(file, 'utf8').matchAll(/:\s*'([^']+)'/g)) {
    if (!known.has(key)) problems.push(`${file}: key "${key}" is not in en/${namespace}.json`)
  }
}

if (problems.length > 0) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(`i18n-check: ${enFiles.length} namespaces in sync.`)
