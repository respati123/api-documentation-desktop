import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppErrorBoundary } from '@/shared/errors/app-error-boundary'

let shouldThrow = true

function Flaky() {
  if (shouldThrow) throw new Error('render failed')
  return <p data-testid="shared-flaky-content">ready</p>
}

describe('AppErrorBoundary', () => {
  afterEach(() => {
    shouldThrow = true
    vi.restoreAllMocks()
  })

  it('shows the fallback when a child fails to render', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(
      <AppErrorBoundary>
        <Flaky />
      </AppErrorBoundary>,
    )
    expect(screen.getByTestId('shared-error-fallback-container')).toBeInTheDocument()
    expect(screen.queryByTestId('shared-flaky-content')).not.toBeInTheDocument()
  })

  it('renders the child again after the user clicks try again', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(
      <AppErrorBoundary>
        <Flaky />
      </AppErrorBoundary>,
    )
    shouldThrow = false
    fireEvent.click(screen.getByTestId('shared-error-fallback-retry-button'))
    expect(screen.getByTestId('shared-flaky-content')).toBeInTheDocument()
  })
})
