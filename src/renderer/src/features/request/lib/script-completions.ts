import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'

export type ScriptPhase = 'pre' | 'post'

export type CompletionItem = {
  // The name inserted into the script.
  label: string
  // The signature shown in the menu. It is code, so it is not translated.
  signature: string
  // The i18n key of the one-line description.
  descriptionKey: string
  // Only offered in this phase. Without it, the item is offered in both.
  phase?: ScriptPhase
}

export type CompletionMatch = {
  // The text from `start` to `end` is replaced when an item is chosen.
  start: number
  end: number
  items: CompletionItem[]
}

const { completion } = REQUEST_TEXT

const apidocsItem: CompletionItem = { label: 'apidocs', signature: 'apidocs', descriptionKey: completion.apidocs }

const rootItems: CompletionItem[] = [
  { label: 'vars', signature: 'apidocs.vars', descriptionKey: completion.vars },
  { label: 'req', signature: 'apidocs.req', descriptionKey: completion.req, phase: 'pre' },
  { label: 'res', signature: 'apidocs.res', descriptionKey: completion.res, phase: 'post' },
  { label: 'check', signature: 'apidocs.check(name, fn)', descriptionKey: completion.check },
  { label: 'assert', signature: 'apidocs.assert(value)', descriptionKey: completion.assert },
  { label: 'log', signature: 'apidocs.log(...values)', descriptionKey: completion.log },
]

const memberItems: Record<'vars' | 'req' | 'res', CompletionItem[]> = {
  vars: [
    { label: 'get', signature: 'vars.get(name)', descriptionKey: completion.varsGet },
    { label: 'set', signature: 'vars.set(name, value, options?)', descriptionKey: completion.varsSet },
    { label: 'has', signature: 'vars.has(name)', descriptionKey: completion.varsHas },
    { label: 'remove', signature: 'vars.remove(name)', descriptionKey: completion.varsRemove },
  ],
  req: [
    { label: 'url', signature: 'req.url', descriptionKey: completion.reqUrl, phase: 'pre' },
    { label: 'method', signature: 'req.method', descriptionKey: completion.reqMethod, phase: 'pre' },
    { label: 'setHeader', signature: 'req.setHeader(name, value)', descriptionKey: completion.reqSetHeader, phase: 'pre' },
    { label: 'dropHeader', signature: 'req.dropHeader(name)', descriptionKey: completion.reqDropHeader, phase: 'pre' },
  ],
  res: [
    { label: 'status', signature: 'res.status', descriptionKey: completion.resStatus, phase: 'post' },
    { label: 'elapsed', signature: 'res.elapsed', descriptionKey: completion.resElapsed, phase: 'post' },
    { label: 'header', signature: 'res.header(name)', descriptionKey: completion.resHeader, phase: 'post' },
    { label: 'text', signature: 'res.text()', descriptionKey: completion.resText, phase: 'post' },
    { label: 'data', signature: 'res.data()', descriptionKey: completion.resData, phase: 'post' },
  ],
}

// Methods on the value returned by apidocs.assert(...).
const assertItems: CompletionItem[] = [
  { label: 'equals', signature: 'assert(v).equals(expected)', descriptionKey: completion.assertEquals },
  { label: 'isTrue', signature: 'assert(v).isTrue()', descriptionKey: completion.assertIsTrue },
  { label: 'isFalse', signature: 'assert(v).isFalse()', descriptionKey: completion.assertIsFalse },
  { label: 'includes', signature: 'assert(v).includes(item)', descriptionKey: completion.assertIncludes },
  { label: 'below', signature: 'assert(v).below(max)', descriptionKey: completion.assertBelow },
  { label: 'above', signature: 'assert(v).above(min)', descriptionKey: completion.assertAbove },
  { label: 'hasKey', signature: 'assert(v).hasKey(key)', descriptionKey: completion.assertHasKey },
]

function keepForPhase(items: CompletionItem[], phase: ScriptPhase, prefix: string, end: number): CompletionMatch | null {
  const query = prefix.toLowerCase()
  const filtered = items.filter((item) => (item.phase === undefined || item.phase === phase) && item.label.toLowerCase().startsWith(query))
  if (!filtered.length) return null
  return { start: end - prefix.length, end, items: filtered }
}

// The completions for the text before the caret. Returns null when the caret is not in a place that completes.
// `apidocs.` lists its members, `apidocs.vars.` lists the vars methods, and a typed `ap` offers `apidocs`.
export function completionAt(value: string, cursor: number, phase: ScriptPhase): CompletionMatch | null {
  const before = value.slice(0, cursor)

  const assertChain = /(?<![\w$])apidocs\.assert\([^\n]*\)\.(\w*)$/.exec(before)
  if (assertChain) return keepForPhase(assertItems, phase, assertChain[1], cursor)

  const member = /(?<![\w$])apidocs((?:\.\w+)*)\.(\w*)$/.exec(before)
  if (member) {
    const path = member[1].split('.').filter(Boolean)
    const items = path.length === 0 ? rootItems : path.length === 1 && isMemberName(path[0]) ? memberItems[path[0]] : null
    return items ? keepForPhase(items, phase, member[2], cursor) : null
  }

  const word = /(?<![\w$.])(\w+)$/.exec(before)
  if (word && word[1].length >= 2) return keepForPhase([apidocsItem], phase, word[1], cursor)
  return null
}

function isMemberName(name: string): name is keyof typeof memberItems {
  return name === 'vars' || name === 'req' || name === 'res'
}

// The value after the chosen item replaces the text it completes, and the caret goes to the end of the inserted name.
export function applyCompletion(value: string, match: CompletionMatch, item: CompletionItem): { value: string; cursor: number } {
  return {
    value: `${value.slice(0, match.start)}${item.label}${value.slice(match.end)}`,
    cursor: match.start + item.label.length,
  }
}
