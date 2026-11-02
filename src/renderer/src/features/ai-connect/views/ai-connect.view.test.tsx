import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { AiConnectView, type AiConnectViewProps } from '@/features/ai-connect/views/ai-connect.view'

function props(overrides: Partial<AiConnectViewProps> = {}): AiConnectViewProps {
  return {
    open: true,
    onOpenChange: vi.fn(),
    node: { description: 'Needed to run', showInstall: true, installLabel: 'Install Node.js', installDisabled: false, onInstall: vi.fn() },
    tools: [
      {
        id: 'codex',
        name: 'Codex',
        statusText: 'Not installed',
        showInstall: true,
        showConnect: false,
        installLabel: 'Install',
        connectLabel: 'Connect',
        disabled: false,
        onInstall: vi.fn(),
        onConnect: vi.fn(),
      },
    ],
    errorMessage: null,
    hasLog: false,
    logText: '',
    logRef: createRef<HTMLPreElement>(),
    ...overrides,
  }
}

describe('AiConnectView', () => {
  it('calls the install handlers when the buttons are clicked', () => {
    const view = props()
    render(<AiConnectView {...view} />)
    fireEvent.click(screen.getByTestId('ai-connect-node-install-button'))
    fireEvent.click(screen.getByTestId('ai-connect-tool-install-button-codex'))
    expect(view.node.onInstall).toHaveBeenCalledTimes(1)
    expect(view.tools[0].onInstall).toHaveBeenCalledTimes(1)
  })

  it('shows the error and the log only when they exist', () => {
    const { rerender } = render(<AiConnectView {...props()} />)
    expect(screen.queryByTestId('ai-connect-dialog-error')).not.toBeInTheDocument()
    expect(screen.queryByTestId('ai-connect-dialog-log')).not.toBeInTheDocument()
    rerender(<AiConnectView {...props({ errorMessage: 'Boom', hasLog: true, logText: 'step 1' })} />)
    expect(screen.getByTestId('ai-connect-dialog-error')).toHaveTextContent('Boom')
    expect(screen.getByTestId('ai-connect-dialog-log')).toHaveTextContent('step 1')
  })

  it('disables the tool button while an action runs', () => {
    const view = props()
    view.tools[0].disabled = true
    render(<AiConnectView {...view} />)
    expect(screen.getByTestId('ai-connect-tool-install-button-codex')).toBeDisabled()
  })
})
