import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useResponseContractViewModel } from '@/features/request/viewmodels/use-response-contract.viewmodel'
import type { ResponseDefinition } from '@/shared/models/api-node.model'

const responses: ResponseDefinition[] = [
  {
    id: 'response-1',
    statusCode: '200',
    description: 'OK',
    content: [{ id: 'content-1', mediaType: 'application/json', schema: '', example: '{"a":1}' }],
  },
]

describe('useResponseContractViewModel.onFormatExample', () => {
  it('pretty-prints the text it is given when it is valid JSON', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useResponseContractViewModel({ responses, readOnly: false, onChange }))
    result.current.onFormatExample('response-1', 'content-1', '{"a":1,"b":[2]}')
    const saved = onChange.mock.calls[0][0] as ResponseDefinition[]
    expect(saved[0].content[0].example).toBe('{\n  "a": 1,\n  "b": [\n    2\n  ]\n}')
  })

  it('leaves the text alone when it is not valid JSON', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useResponseContractViewModel({ responses, readOnly: false, onChange }))
    result.current.onFormatExample('response-1', 'content-1', '{ a: 1 }')
    expect(onChange).not.toHaveBeenCalled()
  })
})
