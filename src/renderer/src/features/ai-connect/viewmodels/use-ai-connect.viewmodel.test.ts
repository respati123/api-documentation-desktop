import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearTestQueries, QueryWrapper } from '@/app/test-utils'
import type { AiConnectStatus } from '@/features/ai-connect/models/ai-connect.model'
import { aiConnectService } from '@/features/ai-connect/services/ai-connect.service'
import { useAiConnectViewModel } from '@/features/ai-connect/viewmodels/use-ai-connect.viewmodel'

vi.mock('@/features/ai-connect/services/ai-connect.service')

const idle: AiConnectStatus = {
  node: { installed: true, version: 'v22.1.0', source: 'app' },
  tools: [
    { id: 'codex', supported: true, installed: false, connected: false },
    { id: 'claude-cli', supported: true, installed: true, connected: false },
    { id: 'claude-desktop', supported: false, installed: false, connected: false },
  ],
}

let openFromMenu: () => void = () => undefined

function setup(status: AiConnectStatus = idle) {
  vi.mocked(aiConnectService.getStatus).mockResolvedValue(status)
  vi.mocked(aiConnectService.onLog).mockReturnValue(() => undefined)
  vi.mocked(aiConnectService.onNodeProgress).mockReturnValue(() => undefined)
  vi.mocked(aiConnectService.onMenuOpen).mockImplementation((handler) => {
    openFromMenu = handler
    return () => undefined
  })
  return renderHook(() => useAiConnectViewModel(), { wrapper: QueryWrapper })
}

describe('useAiConnectViewModel', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    clearTestQueries()
  })

  it('stays closed and does not ask for the status until it opens', () => {
    const { result } = setup()
    expect(result.current.open).toBe(false)
    expect(aiConnectService.getStatus).not.toHaveBeenCalled()
  })

  it('opens from the app menu and describes each tool', async () => {
    const { result } = setup()
    act(() => openFromMenu())
    await waitFor(() => expect(result.current.node.description).toContain('v22.1.0'))
    expect(result.current.node.showInstall).toBe(false)
    const [codex, cli, desktop] = result.current.tools
    expect(codex).toMatchObject({ showInstall: true, showConnect: false, statusText: 'Not installed' })
    expect(cli).toMatchObject({ showInstall: false, showConnect: true, statusText: 'Not connected yet' })
    expect(desktop).toMatchObject({ showInstall: false, showConnect: false, statusText: 'Not available on this operating system.' })
  })

  it('asks to install Node.js first when it is missing', async () => {
    const { result } = setup({ node: { installed: false }, tools: idle.tools })
    act(() => openFromMenu())
    await waitFor(() => expect(result.current.node.showInstall).toBe(true))
    expect(result.current.node.description).toContain('Needed to run the MCP server')
    expect(result.current.tools.every((tool) => tool.disabled)).toBe(true)
  })

  it('shows the main process message when connecting fails', async () => {
    vi.mocked(aiConnectService.connectTool).mockRejectedValue(new Error('Config file is locked'))
    const { result } = setup()
    act(() => openFromMenu())
    await waitFor(() => expect(result.current.tools[1].showConnect).toBe(true))
    act(() => result.current.tools[1].onConnect())
    await waitFor(() => expect(result.current.errorMessage).toBe('Config file is locked'))
  })

  it('refreshes the status after an action finishes', async () => {
    vi.mocked(aiConnectService.connectTool).mockResolvedValue(undefined)
    const { result } = setup()
    act(() => openFromMenu())
    await waitFor(() => expect(aiConnectService.getStatus).toHaveBeenCalledTimes(1))
    act(() => result.current.tools[1].onConnect())
    await waitFor(() => expect(aiConnectService.getStatus).toHaveBeenCalledTimes(2))
  })
})
