// Copies the UI library source from the storybook project into src/renderer/src/shared/ui.
// One way only: storybook is the source, shared/ui is a copy. Never edit the copy by hand; change storybook and sync again.
//
//   bun run sync-ui [path-to-storybook]      (default: ../storybook, or $UI_LIBRARY_DIR)
//
// Stories, the demo App and the dev entry are left out. Everything else under src/ is mirrored.
import { cpSync, existsSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const desktopRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = resolve(process.argv[2] ?? process.env.UI_LIBRARY_DIR ?? join(desktopRoot, '..', 'storybook'), 'src')
const target = join(desktopRoot, 'src', 'renderer', 'src', 'shared', 'ui')
const entries = ['components', 'icons', 'lib', 'styles', 'index.ts']

if (!existsSync(join(source, 'index.ts'))) {
  console.error(`No UI library at ${source}. Pass the storybook folder: bun run sync-ui <path>`)
  process.exit(1)
}

rmSync(target, { recursive: true, force: true })
let files = 0
const copy = (from, to) => {
  if (statSync(from).isDirectory()) {
    for (const name of readdirSync(from)) copy(join(from, name), join(to, name))
    return
  }
  if (from.endsWith('.stories.tsx') || from.endsWith('.stories.ts') || from.endsWith('.mdx')) return
  cpSync(from, to, { recursive: true })
  files += 1
}
for (const entry of entries) copy(join(source, entry), join(target, entry))

writeFileSync(
  join(target, 'README.md'),
  `# shared/ui

A copy of the API Documentation UI library, made by \`bun run sync-ui\` from \`api-documentation/storybook/src\`.
Do not edit these files. Change the library in storybook, then sync again.
Import from \`@/shared/ui\` only, never from a deep path.
`,
)
console.log(`Synced ${files} files from ${source} to ${target}`)
