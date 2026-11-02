import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useVariablesDialogViewModel } from '@/features/variables/viewmodels/use-variables-dialog.viewmodel'
import type { WorkspaceVariables } from '@/lib/workspace-variables'

const variables: WorkspaceVariables = {
  globals: [],
  environments: [
    { id: 'dev', name: 'Development', variables: [{ id: 'v', name: 'host', value: 'dev', secret: false }] },
    { id: 'prod', name: 'Production', variables: [] },
  ],
}

function setup(overrides: { readOnly?: boolean; activeEnvironmentId?: string | null } = {}) {
  const onVariablesChange = vi.fn()
  const onActiveEnvironmentChange = vi.fn()
  const hook = renderHook(() =>
    useVariablesDialogViewModel({
      open: true,
      onOpenChange: vi.fn(),
      variables,
      activeEnvironmentId: overrides.activeEnvironmentId === undefined ? 'dev' : overrides.activeEnvironmentId,
      readOnly: overrides.readOnly ?? false,
      secureStorageAvailable: true,
      onVariablesChange,
      onActiveEnvironmentChange,
    }),
  )
  return { ...hook, onVariablesChange, onActiveEnvironmentChange }
}

describe('useVariablesDialogViewModel', () => {
  it('marks only the active environment and counts its variables', () => {
    const { result } = setup()
    expect(result.current.environments).toEqual([
      { id: 'dev', name: 'Development', countText: '1 variable', isActive: true },
      { id: 'prod', name: 'Production', countText: '0 variables', isActive: false },
    ])
    expect(result.current.noEnvironmentActive).toBe(false)
  })

  it('creates a trimmed environment and makes it active', () => {
    const { result, onVariablesChange, onActiveEnvironmentChange } = setup()
    act(() => result.current.createEnvironment('  Staging  '))
    const next = onVariablesChange.mock.calls[0][0] as WorkspaceVariables
    expect(next.environments.at(-1)).toMatchObject({ name: 'Staging', variables: [] })
    expect(onActiveEnvironmentChange).toHaveBeenCalledWith(next.environments.at(-1)?.id)
  })

  it('ignores a blank environment name', () => {
    const { result, onVariablesChange } = setup()
    act(() => result.current.createEnvironment('   '))
    expect(onVariablesChange).not.toHaveBeenCalled()
  })

  it('selects the first remaining environment after deleting the active one', () => {
    const { result, onVariablesChange, onActiveEnvironmentChange } = setup()
    act(() => result.current.selected?.onDelete())
    expect((onVariablesChange.mock.calls[0][0] as WorkspaceVariables).environments.map((item) => item.id)).toEqual(['prod'])
    expect(onActiveEnvironmentChange).toHaveBeenCalledWith('prod')
  })

  it('cannot create or delete environments in a read-only workspace', () => {
    const { result, onVariablesChange } = setup({ readOnly: true })
    act(() => result.current.createEnvironment('Staging'))
    act(() => result.current.selected?.onDelete())
    expect(onVariablesChange).not.toHaveBeenCalled()
  })

  it('asks to select an environment when none is active', () => {
    const { result } = setup({ activeEnvironmentId: null })
    expect(result.current.selected).toBeNull()
    expect(result.current.promptText).toBe('Select an environment above to view and edit its variables.')
  })
})
