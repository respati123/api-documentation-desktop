import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useDebouncedEditorValue } from '@/shared/components/variable-field'

describe('useDebouncedEditorValue', () => {
  it('saves a draft that is still waiting to the value it was typed in, not to the value that replaces it', () => {
    const firstRequest = vi.fn()
    const secondRequest = vi.fn()
    const { result, rerender } = renderHook(({ value, onChange }) => useDebouncedEditorValue(value, onChange), {
      initialProps: { value: 'first', onChange: firstRequest },
    })

    act(() => result.current[1]('first, edited'))
    rerender({ value: 'second', onChange: secondRequest })

    expect(firstRequest).toHaveBeenCalledWith('first, edited')
    expect(secondRequest).not.toHaveBeenCalled()
    expect(result.current[0]).toBe('second')
  })

  it('saves nothing when no draft is waiting', () => {
    const onChange = vi.fn()
    const { rerender } = renderHook(({ value }) => useDebouncedEditorValue(value, onChange), { initialProps: { value: 'a' } })
    rerender({ value: 'b' })
    expect(onChange).not.toHaveBeenCalled()
  })
})
