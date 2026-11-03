import {
  type AiConnectStatus,
  type AiToolId,
  aiConnectStatusSchema,
  type NodeInstallProgress,
  nodeInstallProgressSchema,
} from '@/features/ai-connect/models/ai-connect.model'

type InstallableTool = 'codex' | 'claude-cli'

// The only place the renderer talks to the main process about AI tools.
export const aiConnectService = {
  getStatus: async (): Promise<AiConnectStatus> => aiConnectStatusSchema.parse(await window.apiDesktop.aiStatus()),

  installNodeRuntime: async (): Promise<void> => {
    await window.apiDesktop.installNodeRuntime()
  },

  installTool: (id: InstallableTool): Promise<void> => window.apiDesktop.installAiTool(id),

  connectTool: (id: AiToolId): Promise<void> => window.apiDesktop.connectAiTool(id),

  onLog: (handler: (line: string) => void): (() => void) => window.apiDesktop.onAiLog(handler),

  onNodeProgress: (handler: (progress: NodeInstallProgress) => void): (() => void) =>
    window.apiDesktop.onNodeProgress((progress) => {
      const parsed = nodeInstallProgressSchema.safeParse(progress)
      if (parsed.success) handler(parsed.data)
    }),

  onMenuOpen: (handler: () => void): (() => void) => window.apiDesktop.onConnectAiMenu(handler),
}
