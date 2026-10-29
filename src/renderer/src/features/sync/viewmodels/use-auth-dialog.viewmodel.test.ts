import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useAuthDialogViewModel } from '@/features/sync/viewmodels/use-auth-dialog.viewmodel'

const base = {
  showTrigger: true,
  onBeginSignIn: vi.fn(async () => undefined),
  openRequest: 0,
  initialError: '',
  onOpen: vi.fn(),
}

describe('useAuthDialogViewModel', () => {
  it('stays closed until something asks it to open', () => {
    const { result } = renderHook(() => useAuthDialogViewModel(base))
    expect(result.current.open).toBe(false)
  })

  it('opens when a new open request arrives', async () => {
    const { result, rerender } = renderHook((props) => useAuthDialogViewModel(props), { initialProps: base })
    rerender({ ...base, openRequest: 1 })
    await waitFor(() => expect(result.current.open).toBe(true))
  })

  it('shows the error from the last failed sign-in attempt', async () => {
    const onBeginSignIn = vi.fn(async () => {
      throw new Error('Browser is unavailable.')
    })
    const { result } = renderHook(() => useAuthDialogViewModel({ ...base, onBeginSignIn }))
    await act(async () => result.current.onSignIn())
    await waitFor(() => expect(result.current.errorText).toBe('Browser is unavailable.'))
    expect(result.current.pending).toBe(false)
  })

  it('shows an error handed in from the workspace when there is no local one', () => {
    const { result } = renderHook(() => useAuthDialogViewModel({ ...base, initialError: 'Session expired.' }))
    expect(result.current.errorText).toBe('Session expired.')
  })

  it('reports no error when there is none', () => {
    const { result } = renderHook(() => useAuthDialogViewModel(base))
    expect(result.current.errorText).toBeNull()
  })
})
