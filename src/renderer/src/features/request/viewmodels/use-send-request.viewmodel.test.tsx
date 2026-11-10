import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ScriptContext } from '@/features/request/lib/script-run'
import { requestService } from '@/features/request/services/request.service'
import { useSendRequestViewModel } from '@/features/request/viewmodels/use-send-request.viewmodel'
import type { ResponseData } from '@/features/response'
import { savedResponseService } from '@/features/response'
import type { WorkspaceVariables } from '@/lib/workspace-variables'
import type { ScriptRunResult } from '@/shared/ipc/script-contract'
import type { RequestNode } from '@/shared/models/api-node.model'

const okResponse: ResponseData = { status: 200, statusText: 'OK', duration: 5, headers: {}, body: '{}' }

function scriptRun(overrides: Partial<ScriptRunResult> = {}): ScriptRunResult {
  return {
    ok: true,
    error: null,
    errorLine: null,
    logs: [],
    logsTruncated: false,
    checks: [],
    writes: [],
    removals: [],
    request: null,
    ...overrides,
  }
}

const variables: WorkspaceVariables = {
  globals: [],
  environments: [{ id: 'dev', name: 'Dev', variables: [{ id: 'e1', name: 'baseUrl', value: 'https://a.example.com', secret: false }] }],
}

function makeRequest(overrides: Partial<RequestNode>): RequestNode {
  return {
    id: 'r1',
    kind: 'request',
    name: 'Me',
    method: 'GET',
    url: '{{baseUrl}}/me',
    body: '',
    headers: [],
    ...overrides,
  } as RequestNode
}

function renderSend(request: RequestNode, context: ScriptContext) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
  return renderHook(() => useSendRequestViewModel({ readRequest: () => request, scriptContext: context, resetKey: 'workspace:r1' }), {
    wrapper,
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useSendRequestViewModel scripts', () => {
  it('does not send when the pre-request script stops, and shows its error', async () => {
    const send = vi.spyOn(requestService, 'send').mockResolvedValue(okResponse)
    vi.spyOn(requestService, 'runScript').mockResolvedValue(
      scriptRun({ ok: false, error: 'Script stopped: it ran for more than 2 seconds.' }),
    )
    const updateVariables = vi.fn()
    const { result } = renderSend(makeRequest({ preScript: 'while (true) {}' }), {
      variables,
      activeEnvironmentId: 'dev',
      updateVariables,
    })

    await act(async () => {
      await result.current.send()
    })

    expect(send).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(result.current.response).toEqual({ kind: 'error', message: 'Script stopped: it ran for more than 2 seconds.' }),
    )
    expect(result.current.scripts?.pre?.ok).toBe(false)
    expect(updateVariables).not.toHaveBeenCalled()
  })

  it('runs the pre-script, sends the changed request, runs the post-script, and saves each variable write', async () => {
    const pre = vi.spyOn(requestService, 'runScript')
    pre.mockImplementation(async (input) => {
      if (input.phase === 'pre') {
        expect(input.variables.environment.baseUrl).toBe('https://a.example.com')
        return scriptRun({
          request: { method: 'GET', url: '{{baseUrl}}/me', headers: [{ name: 'X-Trace', value: '1' }] },
          writes: [{ scope: 'environment', name: 'baseUrl', value: 'https://b.example.com' }],
        })
      }
      expect(input.response?.status).toBe(200)
      return scriptRun({
        checks: [{ name: 'status is 200', passed: true }],
        writes: [{ scope: 'global', name: 'token', value: 'abc' }],
      })
    })
    const send = vi.spyOn(requestService, 'send').mockResolvedValue(okResponse)
    const updateVariables = vi.fn()
    const { result } = renderSend(
      makeRequest({ preScript: 'apidocs.vars.set("baseUrl", "https://b.example.com")', postScript: 'apidocs.check("x", () => {})' }),
      {
        variables,
        activeEnvironmentId: 'dev',
        updateVariables,
      },
    )

    await act(async () => {
      await result.current.send()
    })

    // The request went out with the variable the pre-script changed, and the header it added.
    expect(send).toHaveBeenCalledTimes(1)
    const sent = send.mock.calls[0][0]
    expect(sent.url).toBe('https://b.example.com/me')
    expect(sent.headers).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'X-Trace', value: '1' })]))

    await waitFor(() => expect(result.current.response).toEqual({ kind: 'success', data: okResponse }))
    expect(result.current.scripts?.post?.checks).toEqual([{ name: 'status is 200', passed: true }])

    // Each script's writes were saved: the environment change first, then the global token.
    expect(updateVariables).toHaveBeenCalledTimes(2)
    const last = updateVariables.mock.calls[1][0] as WorkspaceVariables
    expect(last.environments[0].variables.find((row) => row.name === 'baseUrl')?.value).toBe('https://b.example.com')
    expect(last.globals.find((row) => row.name === 'token')?.value).toBe('abc')
  })

  it('keeps the response when the post-script fails, and reports the script error', async () => {
    vi.spyOn(requestService, 'send').mockResolvedValue(okResponse)
    vi.spyOn(requestService, 'runScript').mockResolvedValue(scriptRun({ ok: false, error: 'ReferenceError: nope is not defined' }))
    const { result } = renderSend(makeRequest({ postScript: 'nope()' }), {
      variables,
      activeEnvironmentId: 'dev',
      updateVariables: vi.fn(),
    })

    await act(async () => {
      await result.current.send()
    })

    await waitFor(() => expect(result.current.response.kind).toBe('success'))
    expect(result.current.scripts?.post?.error).toBe('ReferenceError: nope is not defined')
  })

  it('sends with no scripts exactly as before', async () => {
    const send = vi.spyOn(requestService, 'send').mockResolvedValue(okResponse)
    const runScript = vi.spyOn(requestService, 'runScript')
    const { result } = renderSend(makeRequest({}), { variables, activeEnvironmentId: 'dev', updateVariables: vi.fn() })

    await act(async () => {
      await result.current.send()
    })

    expect(runScript).not.toHaveBeenCalled()
    expect(send.mock.calls[0][0].url).toBe('https://a.example.com/me')
    await waitFor(() => expect(result.current.scripts).toEqual({ pre: null, post: null, skipped: [] }))
  })

  it('asks the main process to save the response under its workspace and request', async () => {
    const send = vi.spyOn(requestService, 'send').mockResolvedValue(okResponse)
    const { result } = renderSend(makeRequest({ id: 'login' }), {
      variables,
      activeEnvironmentId: 'dev',
      updateVariables: vi.fn(),
      workspaceId: 'local-default',
    })

    await act(async () => {
      await result.current.send()
    })

    expect(send.mock.calls[0][0].savedResponse).toEqual({ workspaceId: 'local-default', requestId: 'login' })
  })

  it('does not ask to save a response when the workspace is unknown', async () => {
    const send = vi.spyOn(requestService, 'send').mockResolvedValue(okResponse)
    const { result } = renderSend(makeRequest({ id: 'login' }), { variables, activeEnvironmentId: 'dev', updateVariables: vi.fn() })

    await act(async () => {
      await result.current.send()
    })

    expect(send.mock.calls[0][0].savedResponse).toBeUndefined()
  })
  it('reads the saved response a request refers to, and sends the value from it', async () => {
    const send = vi.spyOn(requestService, 'send').mockResolvedValue(okResponse)
    const read = vi.spyOn(savedResponseService, 'read').mockResolvedValue({
      savedAt: '2026-11-10T10:00:00.000Z',
      status: 200,
      statusText: 'OK',
      headers: {},
      body: '{"data":{"id":7}}',
      truncated: false,
    })
    const { result } = renderSend(makeRequest({ id: 'me', url: 'https://a.example.com/users/{{response.login.body.$.data.id}}' }), {
      variables,
      activeEnvironmentId: 'dev',
      updateVariables: vi.fn(),
      workspaceId: 'local-default',
    })

    await act(async () => {
      await result.current.send()
    })

    expect(read).toHaveBeenCalledWith('local-default', 'login')
    expect(send.mock.calls[0][0].url).toBe('https://a.example.com/users/7')
  })

  it('stops before sending when the referred response has not been saved yet', async () => {
    const send = vi.spyOn(requestService, 'send').mockResolvedValue(okResponse)
    vi.spyOn(savedResponseService, 'read').mockResolvedValue(undefined)
    const { result } = renderSend(makeRequest({ id: 'me', url: 'https://a.example.com/users/{{response.login.body.$.data.id}}' }), {
      variables,
      activeEnvironmentId: 'dev',
      updateVariables: vi.fn(),
      workspaceId: 'local-default',
    })

    await act(async () => {
      await result.current.send()
    })

    expect(send).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(result.current.response).toEqual({ kind: 'error', message: 'Request "login" has no saved response yet. Send it first.' }),
    )
  })
})
