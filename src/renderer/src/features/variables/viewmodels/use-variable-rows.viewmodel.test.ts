import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useVariableRowsViewModel } from '@/features/variables/viewmodels/use-variable-rows.viewmodel'
import type { WorkspaceVariable } from '@/lib/workspace-variables'

const secretRow: WorkspaceVariable = { id: 'a', name: 'token', value: 'abc', secret: true }
const plainRow: WorkspaceVariable = { id: 'b', name: 'baseUrl', value: 'https://api.test', secret: false }

describe('useVariableRowsViewModel', () => {
  it('numbers the field labels from one', () => {
    const { result } = renderHook(() => useVariableRowsViewModel({ rows: [secretRow, plainRow], readOnly: false, onChange: vi.fn() }))
    expect(result.current.rows.map((row) => row.nameLabel)).toEqual(['Variable name 1', 'Variable name 2'])
  })

  it('masks secret values and keeps them editable in a read-only workspace', () => {
    const { result } = renderHook(() => useVariableRowsViewModel({ rows: [secretRow, plainRow], readOnly: true, onChange: vi.fn() }))
    expect(result.current.rows[0]).toMatchObject({ valueType: 'password', valueReadOnly: false })
    expect(result.current.rows[1]).toMatchObject({ valueType: 'text', valueReadOnly: true })
  })

  it('warns when a row name uses the reserved response. prefix', () => {
    const reserved: WorkspaceVariable = { id: 'c', name: 'response.login', value: '', secret: false }
    const { result } = renderHook(() => useVariableRowsViewModel({ rows: [plainRow, reserved], readOnly: false, onChange: vi.fn() }))
    expect(result.current.reservedNameMessage).toBeDefined()
  })

  it('shows no warning for ordinary names', () => {
    const { result } = renderHook(() => useVariableRowsViewModel({ rows: [secretRow, plainRow], readOnly: false, onChange: vi.fn() }))
    expect(result.current.reservedNameMessage).toBeUndefined()
  })

  it('appends an empty row when adding', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useVariableRowsViewModel({ rows: [plainRow], readOnly: false, onChange }))
    result.current.onAdd()
    const next = onChange.mock.calls[0][0] as WorkspaceVariable[]
    expect(next).toHaveLength(2)
    expect(next[1]).toMatchObject({ name: '', value: '', secret: false })
  })

  it('removes only the row with the given id', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useVariableRowsViewModel({ rows: [secretRow, plainRow], readOnly: false, onChange }))
    result.current.onRemove('a')
    expect(onChange).toHaveBeenCalledWith([plainRow])
  })

  it('treats the indeterminate checkbox state as not secret', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useVariableRowsViewModel({ rows: [secretRow], readOnly: false, onChange }))
    result.current.onSecretChange('a', 'indeterminate')
    expect(onChange).toHaveBeenCalledWith([{ ...secretRow, secret: false }])
  })

  it('does not allow adding in a read-only workspace', () => {
    const { result } = renderHook(() => useVariableRowsViewModel({ rows: [], readOnly: true, onChange: vi.fn() }))
    expect(result.current.canAdd).toBe(false)
    expect(result.current.isEmpty).toBe(true)
  })
})
