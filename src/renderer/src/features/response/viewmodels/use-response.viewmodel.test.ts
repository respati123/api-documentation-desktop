import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ResponseState } from '@/features/response/models/response.model'
import { useResponseViewModel } from '@/features/response/viewmodels/use-response.viewmodel'

const success: ResponseState = {
  kind: 'success',
  data: {
    status: 404,
    statusText: 'Not Found',
    duration: 12,
    headers: { 'content-type': 'application/json' },
    cookies: ['sid=abc; Path=/; HttpOnly', '=orphan'],
    body: '{"error":"missing"}',
  },
}

describe('useResponseViewModel', () => {
  it('reports no meta or rows before a response arrives', () => {
    const { result } = renderHook(() => useResponseViewModel({ response: { kind: 'empty' } }))
    expect(result.current).toMatchObject({ kind: 'empty', meta: null, headerRows: [], cookieRows: [], bodyText: '' })
  })

  it('marks the loading state as busy', () => {
    const { result } = renderHook(() => useResponseViewModel({ response: { kind: 'loading' } }))
    expect(result.current.isBusy).toBe(true)
  })

  it('passes the backend error message through unchanged', () => {
    const { result } = renderHook(() => useResponseViewModel({ response: { kind: 'error', message: 'connect ECONNREFUSED' } }))
    expect(result.current.errorMessage).toBe('connect ECONNREFUSED')
  })

  it('builds the status line, the duration, and the error flag from a success', () => {
    const { result } = renderHook(() => useResponseViewModel({ response: success }))
    expect(result.current.meta).toEqual({ statusText: '404 Not Found', isErrorStatus: true, durationText: '12 ms' })
    expect(result.current.bodyText).toBe('{\n  "error": "missing"\n}')
  })

  it('names a cookie without a name by its position', () => {
    const { result } = renderHook(() => useResponseViewModel({ response: success }))
    expect(result.current.cookieRows.map((row) => row.name)).toEqual(['sid', 'Cookie 2'])
    expect(result.current.cookieRows[0]).toMatchObject({ value: 'abc', attributes: 'Path=/ · HttpOnly', hasAttributes: true })
  })

  it('shows the empty-body text when the body is empty', () => {
    const empty: ResponseState = { kind: 'success', data: { status: 204, statusText: 'No Content', duration: 1, headers: {}, body: '' } }
    const { result } = renderHook(() => useResponseViewModel({ response: empty }))
    expect(result.current.bodyText).toBe('Response body is empty.')
  })

  it('returns to the body tab when a new response replaces the old one', () => {
    const { result, rerender } = renderHook(({ response }) => useResponseViewModel({ response }), { initialProps: { response: success } })
    act(() => result.current.onTabChange('headers'))
    expect(result.current.tab).toBe('headers')
    rerender({ response: { ...success } })
    expect(result.current.tab).toBe('body')
  })

  it('ignores a tab name it does not know', () => {
    const { result } = renderHook(() => useResponseViewModel({ response: success }))
    act(() => result.current.onTabChange('nope'))
    expect(result.current.tab).toBe('body')
  })
})
