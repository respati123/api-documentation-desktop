import { describe, expect, it } from 'vitest'
import type { ScriptRunInput } from '../../renderer/src/shared/ipc/script-contract'
import { runScript } from './script-engine'

const baseRequest = { method: 'GET', url: 'https://api.example.com/users', headers: [{ name: 'Accept', value: '*/*' }] }

function pre(source: string, overrides: Partial<ScriptRunInput> = {}): ScriptRunInput {
  return {
    phase: 'pre',
    source,
    variables: { environment: { baseUrl: 'https://api.example.com' }, globals: { apiVersion: 'v1' } },
    secretValues: [],
    request: baseRequest,
    ...overrides,
  }
}

const response = {
  status: 201,
  elapsedMs: 42,
  headers: { 'Content-Type': 'application/json', 'X-Trace': 'abc' },
  body: '{"data":{"accessToken":"tok-1"},"ok":true}',
}

function post(source: string, overrides: Partial<ScriptRunInput> = {}): ScriptRunInput {
  return { ...pre(source), phase: 'post', response, ...overrides }
}

describe('apidocs.vars', () => {
  it('reads environment values first, then globals', async () => {
    const result = await runScript(
      pre('apidocs.log(apidocs.vars.get("baseUrl"), apidocs.vars.get("apiVersion"), apidocs.vars.get("missing"))'),
    )
    expect(result.ok).toBe(true)
    expect(result.logs).toEqual(['https://api.example.com v1 undefined'])
  })

  it('records a write to the environment by default, and a write to globals when asked', async () => {
    const result = await runScript(pre('apidocs.vars.set("token", "t1"); apidocs.vars.set("shared", "s1", { scope: "global" })'))
    expect(result.writes).toEqual([
      { scope: 'environment', name: 'token', value: 't1' },
      { scope: 'global', name: 'shared', value: 's1' },
    ])
  })

  it('reports has and remove, and records the removal', async () => {
    const result = await runScript(
      pre('apidocs.check("has", () => apidocs.assert(apidocs.vars.has("baseUrl")).isTrue()); apidocs.vars.remove("baseUrl")'),
    )
    expect(result.checks).toEqual([{ name: 'has', passed: true }])
    expect(result.removals).toEqual([{ scope: 'environment', name: 'baseUrl' }])
  })
})

describe('apidocs.req (pre-request)', () => {
  it('changes the URL, the method, and headers, and returns the changed request', async () => {
    const result = await runScript(
      pre(
        'apidocs.req.url = apidocs.vars.get("baseUrl") + "/me"; apidocs.req.method = "post"; apidocs.req.setHeader("authorization", "Bearer x"); apidocs.req.dropHeader("Accept")',
      ),
    )
    expect(result.ok).toBe(true)
    expect(result.request).toEqual({
      method: 'POST',
      url: 'https://api.example.com/me',
      headers: [{ name: 'authorization', value: 'Bearer x' }],
    })
  })

  it('refuses to change the request in a post-response script', async () => {
    const result = await runScript(post('apidocs.req.setHeader("x", "y")'))
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/only be changed in a pre-request script/)
  })
})

describe('apidocs.res (post-response)', () => {
  it('reads the status, the elapsed time, a header without regard to case, the text, and parsed JSON', async () => {
    const result = await runScript(
      post(`
        apidocs.log(apidocs.res.status, apidocs.res.elapsed, apidocs.res.header("x-trace"))
        apidocs.log(apidocs.res.text().length)
        apidocs.log(apidocs.res.data().data.accessToken)
      `),
    )
    expect(result.ok).toBe(true)
    expect(result.logs).toEqual(['201 42 abc', String(response.body.length), 'tok-1'])
  })

  it('reports an error when the body is not JSON, in a check or at the top level', async () => {
    const result = await runScript(
      post('apidocs.res.text; apidocs.check("json", () => apidocs.res.data())', { response: { ...response, body: 'plain' } }),
    )
    expect(result.checks).toEqual([{ name: 'json', passed: false, message: 'The response body is not valid JSON.' }])
  })

  it('refuses to read the response in a pre-request script', async () => {
    const result = await runScript(pre('apidocs.res.status'))
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/only available in a post-response script/)
  })
})

describe('apidocs.check and apidocs.assert', () => {
  it('records a passing check and a failing check with its message', async () => {
    const result = await runScript(
      post(`
        apidocs.check("status is 201", () => apidocs.assert(apidocs.res.status).equals(201))
        apidocs.check("status is 200", () => apidocs.assert(apidocs.res.status).equals(200))
      `),
    )
    expect(result.checks).toEqual([
      { name: 'status is 201', passed: true },
      { name: 'status is 200', passed: false, message: 'Expected 201 to equal 200' },
    ])
  })

  it('supports each assertion method', async () => {
    const result = await runScript(
      post(`
        apidocs.check("equals objects", () => apidocs.assert({ a: [1, 2] }).equals({ a: [1, 2] }))
        apidocs.check("true", () => apidocs.assert(true).isTrue())
        apidocs.check("false", () => apidocs.assert(false).isFalse())
        apidocs.check("includes text", () => apidocs.assert("hello world").includes("world"))
        apidocs.check("includes item", () => apidocs.assert([{ id: 1 }]).includes({ id: 1 }))
        apidocs.check("below", () => apidocs.assert(3).below(10))
        apidocs.check("above", () => apidocs.assert(30).above(10))
        apidocs.check("has key", () => apidocs.assert({ id: 1 }).hasKey("id"))
      `),
    )
    expect(result.checks.every((check) => check.passed)).toBe(true)
    expect(result.checks).toHaveLength(8)
  })
})

describe('apidocs.log', () => {
  it('keeps at most maxLogLines lines and marks the log as truncated', async () => {
    const result = await runScript(pre('for (var i = 0; i < 10; i++) apidocs.log("line", i)'), { maxLogLines: 4 })
    expect(result.logs).toHaveLength(4)
    expect(result.logsTruncated).toBe(true)
  })
})

describe('limits', () => {
  it('stops a script that runs too long, with a plain sentence', async () => {
    const result = await runScript(pre('while (true) {}'), { timeoutMs: 200 })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/Script stopped: it ran for more than 0.2 seconds/)
  })

  it('stops a script that uses too much memory, with a plain sentence', async () => {
    const result = await runScript(pre('var keep = []; while (true) keep.push(new Array(10000).fill(1));'), {
      memoryBytes: 2 * 1024 * 1024,
      timeoutMs: 2_000,
    })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/Script stopped: it used more than 2 MB of memory|Script stopped: it ran for more than/)
  }, 15_000)

  it('refuses a script larger than the size limit before it runs', async () => {
    const result = await runScript(pre(`var padding = "${'x'.repeat(60_000)}";`))
    expect(result.ok).toBe(false)
    expect(result.error).toBe('Script is larger than 50 KB.')
  })
})

describe('sandbox', () => {
  it('has no require, fetch, process, timers, or console', async () => {
    const result = await runScript(
      pre(`
        apidocs.check("no host access", () => {
          apidocs.assert([typeof require, typeof fetch, typeof process, typeof setTimeout, typeof console, typeof Buffer]).equals(["undefined", "undefined", "undefined", "undefined", "undefined", "undefined"]);
        })
      `),
    )
    expect(result.checks).toEqual([{ name: 'no host access', passed: true }])
  })

  it('says that apidocs.send is not supported in this version', async () => {
    const result = await runScript(pre('apidocs.send("https://example.com")'))
    expect(result.error).toBe('apidocs.send is not supported in this version.')
  })

  it('reports a syntax error and a runtime error as failures', async () => {
    expect((await runScript(pre('var = ;'))).ok).toBe(false)
    const runtime = await runScript(pre('null.value'))
    expect(runtime.ok).toBe(false)
    expect(runtime.error).toBeTruthy()
  })
})

describe('secret redaction', () => {
  it('removes a secret value from logs, check names, check messages, and errors', async () => {
    const result = await runScript(
      post(
        `
        apidocs.log("token is", "sekret-42")
        apidocs.check("uses sekret-42", () => apidocs.assert("sekret-42").equals("other"))
      `,
        { secretValues: ['sekret-42'] },
      ),
    )
    expect(JSON.stringify(result)).not.toContain('sekret-42')
    expect(result.logs).toEqual(['token is <secret>'])
    expect(result.checks[0].name).toBe('uses <secret>')
  })
})
