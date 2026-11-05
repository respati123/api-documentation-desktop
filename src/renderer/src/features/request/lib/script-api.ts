import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'

export type ScriptPhase = 'pre' | 'post'

export type ScriptApiGroup = 'vars' | 'request' | 'response' | 'checks' | 'assert'

export type ScriptApiEntry = {
  group: ScriptApiGroup
  // The call as the script writes it. It is code, so it is not translated.
  signature: string
  // The i18n key of the one-line description.
  descriptionKey: string
  // Only works in this phase. Without it, the entry works in both.
  phase?: ScriptPhase
}

const { completion } = REQUEST_TEXT

// The apidocs API as a script can use it. The editor declarations (lib/script-typings) and the in-app reference both read this list,
// and a test checks that every entry is declared there.
export const scriptApiEntries: ScriptApiEntry[] = [
  { group: 'vars', signature: 'apidocs.vars.get(name)', descriptionKey: completion.varsGet },
  { group: 'vars', signature: 'apidocs.vars.set(name, value, options?)', descriptionKey: completion.varsSet },
  { group: 'vars', signature: 'apidocs.vars.has(name)', descriptionKey: completion.varsHas },
  { group: 'vars', signature: 'apidocs.vars.remove(name, options?)', descriptionKey: completion.varsRemove },
  { group: 'request', signature: 'apidocs.req.url', descriptionKey: completion.reqUrl, phase: 'pre' },
  { group: 'request', signature: 'apidocs.req.method', descriptionKey: completion.reqMethod, phase: 'pre' },
  { group: 'request', signature: 'apidocs.req.setHeader(name, value)', descriptionKey: completion.reqSetHeader, phase: 'pre' },
  { group: 'request', signature: 'apidocs.req.dropHeader(name)', descriptionKey: completion.reqDropHeader, phase: 'pre' },
  { group: 'response', signature: 'apidocs.res.status', descriptionKey: completion.resStatus, phase: 'post' },
  { group: 'response', signature: 'apidocs.res.elapsed', descriptionKey: completion.resElapsed, phase: 'post' },
  { group: 'response', signature: 'apidocs.res.header(name)', descriptionKey: completion.resHeader, phase: 'post' },
  { group: 'response', signature: 'apidocs.res.text()', descriptionKey: completion.resText, phase: 'post' },
  { group: 'response', signature: 'apidocs.res.data()', descriptionKey: completion.resData, phase: 'post' },
  { group: 'checks', signature: 'apidocs.check(name, fn)', descriptionKey: completion.check },
  { group: 'checks', signature: 'apidocs.log(...values)', descriptionKey: completion.log },
  { group: 'assert', signature: 'apidocs.assert(value).equals(expected)', descriptionKey: completion.assertEquals },
  { group: 'assert', signature: 'apidocs.assert(value).isTrue()', descriptionKey: completion.assertIsTrue },
  { group: 'assert', signature: 'apidocs.assert(value).isFalse()', descriptionKey: completion.assertIsFalse },
  { group: 'assert', signature: 'apidocs.assert(value).includes(item)', descriptionKey: completion.assertIncludes },
  { group: 'assert', signature: 'apidocs.assert(value).below(max)', descriptionKey: completion.assertBelow },
  { group: 'assert', signature: 'apidocs.assert(value).above(min)', descriptionKey: completion.assertAbove },
  { group: 'assert', signature: 'apidocs.assert(value).hasKey(key)', descriptionKey: completion.assertHasKey },
]

// The groups of the reference, in the order the reference shows them, with the key of each group's title.
export const scriptApiGroups: { key: ScriptApiGroup; titleKey: string }[] = [
  { key: 'vars', titleKey: REQUEST_TEXT.reference.groupVars },
  { key: 'request', titleKey: REQUEST_TEXT.reference.groupRequest },
  { key: 'response', titleKey: REQUEST_TEXT.reference.groupResponse },
  { key: 'checks', titleKey: REQUEST_TEXT.reference.groupChecks },
  { key: 'assert', titleKey: REQUEST_TEXT.reference.groupAssert },
]
