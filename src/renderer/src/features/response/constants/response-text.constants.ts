export const RESPONSE_TEXT = {
  heading: {
    kicker: 'heading.kicker',
    title: 'heading.title',
    duration: 'heading.duration',
  },
  empty: {
    title: 'empty.title',
    description: 'empty.description',
  },
  loading: {
    title: 'loading.title',
    description: 'loading.description',
  },
  error: {
    title: 'error.title',
  },
  tabs: {
    label: 'tabs.label',
    body: 'tabs.body',
    headers: 'tabs.headers',
    cookies: 'tabs.cookies',
    tests: 'tabs.tests',
    console: 'tabs.console',
  },
  body: {
    empty: 'body.empty',
  },
  headers: {
    empty: 'headers.empty',
  },
  cookies: {
    empty: 'cookies.empty',
    fallbackName: 'cookies.fallbackName',
  },
  tests: {
    empty: 'tests.empty',
    passed: 'tests.passed',
    failed: 'tests.failed',
  },
  console: {
    empty: 'console.empty',
    pre: 'console.pre',
    post: 'console.post',
    truncated: 'console.truncated',
    skippedNoEnvironment: 'console.skippedNoEnvironment',
    skippedSecret: 'console.skippedSecret',
  },
} as const
