import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'

const { completion } = REQUEST_TEXT

// The TypeScript declarations of the apidocs object, which the script editor reads for suggestions and errors.
// They follow the sandbox prelude (src/main/scripts/prelude.ts). Each description is translated through `describe`.
// Both pre-request and post-response scripts share one declaration, so req and res are marked with the phase that can use them.
export function buildScriptTypings(describe: (key: string) => string): string {
  const d = (key: string) => describe(key)
  return `
interface ApiDocsVars {
  /** ${d(completion.varsGet)} */
  get(name: string): string | undefined;
  /** ${d(completion.varsSet)} */
  set(name: string, value: unknown, options?: { scope?: 'environment' | 'global' }): void;
  /** ${d(completion.varsHas)} */
  has(name: string): boolean;
  /** ${d(completion.varsRemove)} */
  remove(name: string, options?: { scope?: 'environment' | 'global' }): void;
}

interface ApiDocsRequest {
  /** ${d(completion.reqUrl)} */
  url: string;
  /** ${d(completion.reqMethod)} */
  method: string;
  /** ${d(completion.reqSetHeader)} */
  setHeader(name: string, value: string): void;
  /** ${d(completion.reqDropHeader)} */
  dropHeader(name: string): void;
}

interface ApiDocsResponse {
  /** ${d(completion.resStatus)} */
  readonly status: number;
  /** ${d(completion.resElapsed)} */
  readonly elapsed: number;
  /** ${d(completion.resHeader)} */
  header(name: string): string | undefined;
  /** ${d(completion.resText)} */
  text(): string;
  /** ${d(completion.resData)} */
  data(): any;
}

interface ApiDocsAssertion {
  /** ${d(completion.assertEquals)} */
  equals(expected: unknown): void;
  /** ${d(completion.assertIsTrue)} */
  isTrue(): void;
  /** ${d(completion.assertIsFalse)} */
  isFalse(): void;
  /** ${d(completion.assertIncludes)} */
  includes(item: unknown): void;
  /** ${d(completion.assertBelow)} */
  below(max: number): void;
  /** ${d(completion.assertAbove)} */
  above(min: number): void;
  /** ${d(completion.assertHasKey)} */
  hasKey(key: string): void;
}

interface ApiDocs {
  /** ${d(completion.vars)} */
  vars: ApiDocsVars;
  /** ${d(completion.req)} */
  req: ApiDocsRequest;
  /** ${d(completion.res)} */
  res: ApiDocsResponse;
  /** ${d(completion.check)} */
  check(name: string, fn: () => void): void;
  /** ${d(completion.assert)} */
  assert(value: unknown): ApiDocsAssertion;
  /** ${d(completion.log)} */
  log(...values: unknown[]): void;
}

/** ${d(completion.apidocs)} */
declare const apidocs: ApiDocs;
`
}
