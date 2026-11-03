import { beforeEach, describe, expect, it, vi } from 'vitest'
import { aiConnectService } from '@/features/ai-connect/services/ai-connect.service'

const apiDesktop = {
  aiStatus: vi.fn(),
  installNodeRuntime: vi.fn(),
  installAiTool: vi.fn(),
  connectAiTool: vi.fn(),
  onAiLog: vi.fn(),
  onNodeProgress: vi.fn(),
  onConnectAiMenu: vi.fn(),
}

describe('aiConnectService', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    Object.defineProperty(window, 'apiDesktop', { value: apiDesktop, configurable: true })
  })

  it('returns the status when the main process answers with the expected shape', async () => {
    const status = {
      node: { installed: true, version: 'v22', source: 'app' },
      tools: [{ id: 'codex', supported: true, installed: false, connected: false }],
    }
    apiDesktop.aiStatus.mockResolvedValue(status)
    await expect(aiConnectService.getStatus()).resolves.toEqual(status)
  })

  it('throws when the status has an unknown tool id', async () => {
    apiDesktop.aiStatus.mockResolvedValue({
      node: { installed: true },
      tools: [{ id: 'other', supported: true, installed: true, connected: true }],
    })
    await expect(aiConnectService.getStatus()).rejects.toThrow()
  })

  it('passes the tool id through to install and connect', async () => {
    apiDesktop.installAiTool.mockResolvedValue(undefined)
    apiDesktop.connectAiTool.mockResolvedValue(undefined)
    await aiConnectService.installTool('claude-cli')
    await aiConnectService.connectTool('claude-desktop')
    expect(apiDesktop.installAiTool).toHaveBeenCalledWith('claude-cli')
    expect(apiDesktop.connectAiTool).toHaveBeenCalledWith('claude-desktop')
  })

  it('forwards valid progress events and drops malformed ones', () => {
    const handler = vi.fn()
    apiDesktop.onNodeProgress.mockImplementation((listener: (progress: unknown) => void) => {
      listener({ stage: 'downloading', percent: 40 })
      listener({ stage: 'unknown' })
      return () => undefined
    })
    aiConnectService.onNodeProgress(handler)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({ stage: 'downloading', percent: 40 })
  })
})
