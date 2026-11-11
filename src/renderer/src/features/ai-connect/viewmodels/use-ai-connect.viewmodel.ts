import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AI_CONNECT_TEXT } from '@/features/ai-connect/constants/ai-connect-text.constants'
import { type AiToolId, installableToolSchema } from '@/features/ai-connect/models/ai-connect.model'
import { aiConnectService } from '@/features/ai-connect/services/ai-connect.service'

export const aiConnectKeys = {
  all: ['ai-connect'] as const,
  status: () => [...aiConnectKeys.all, 'status'] as const,
}

const LOG_LIMIT = 200
const toolIds: AiToolId[] = ['codex', 'claude-cli', 'claude-desktop', 'antigravity', 'gemini']
const toolNames = {
  codex: AI_CONNECT_TEXT.tools.codex,
  'claude-cli': AI_CONNECT_TEXT.tools.claudeCli,
  'claude-desktop': AI_CONNECT_TEXT.tools.claudeDesktop,
  antigravity: AI_CONNECT_TEXT.tools.antigravity,
  gemini: AI_CONNECT_TEXT.tools.gemini,
} satisfies Record<AiToolId, string>

type Action = { label: string; run: () => Promise<unknown> }

function getStatusVariant(
  supported: boolean,
  connected: boolean,
  installed: boolean,
  id: AiToolId,
): 'outline' | 'success' | 'secondary' | 'warning' {
  if (!supported) return 'outline'
  if (connected) return 'success'
  if (installed || id === 'claude-desktop') return 'secondary'
  return 'warning'
}

// Owns the connect-AI dialog: its open state, the tool status query, the install and connect actions,
// and the live setup log. The main process menu can open it too.
export function useAiConnectViewModel() {
  const { t } = useTranslation('ai-connect')
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [nodeProgress, setNodeProgress] = useState<number | null>(null)
  const logRef = useRef<HTMLPreElement>(null)

  const statusQuery = useQuery({
    queryKey: aiConnectKeys.status(),
    queryFn: aiConnectService.getStatus,
    enabled: open,
    staleTime: 0,
  })

  const action = useMutation({
    mutationFn: ({ run }: Action) => run(),
    onSettled: async () => {
      setNodeProgress(null)
      await queryClient.invalidateQueries({ queryKey: aiConnectKeys.status() })
    },
  })
  const busy = action.isPending ? action.variables.label : null

  function openDialog() {
    action.reset()
    setOpen(true)
  }

  const handleMenuOpen = useEffectEvent(openDialog)
  useEffect(() => aiConnectService.onMenuOpen(() => handleMenuOpen()), [])

  useEffect(() => {
    if (!open) return
    const offLog = aiConnectService.onLog((line) => setLog((current) => [...current.slice(-(LOG_LIMIT - 1)), line]))
    const offNode = aiConnectService.onNodeProgress((progress) =>
      setNodeProgress(progress.stage === 'downloading' ? (progress.percent ?? 0) : null),
    )
    return () => {
      offLog()
      offNode()
    }
  }, [open])

  useEffect(() => {
    if (log.length) logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [log])

  const status = statusQuery.data
  const nodeReady = Boolean(status?.node.installed)

  function describeNode(): string {
    if (!nodeReady) return t(AI_CONNECT_TEXT.node.needed)
    const source = status?.node.source === 'system' ? AI_CONNECT_TEXT.node.sourceSystem : AI_CONNECT_TEXT.node.sourceApp
    return t(AI_CONNECT_TEXT.node.installed, { version: status?.node.version, source: t(source) })
  }

  function nodeInstallLabel(): string {
    if (busy !== 'node') return t(AI_CONNECT_TEXT.node.install)
    return nodeProgress !== null ? t(AI_CONNECT_TEXT.node.downloading, { percent: nodeProgress }) : t(AI_CONNECT_TEXT.node.installing)
  }

  const tools = toolIds.map((id) => {
    const tool = status?.tools.find((item) => item.id === id)
    const supported = tool?.supported ?? true
    const installed = tool?.installed ?? false
    const connected = tool?.connected ?? false
    // The app installs only Codex and Claude CLI. Antigravity and Claude Desktop come from their own installers.
    const installable = installableToolSchema.safeParse(id)
    const needsInstall = installable.success && !installed
    let statusText = t(AI_CONNECT_TEXT.tools.notInstalled)
    if (!supported) statusText = t(AI_CONNECT_TEXT.tools.unsupported)
    else if (connected) statusText = t(AI_CONNECT_TEXT.tools.connected)
    else if (installed || id === 'claude-desktop') statusText = t(AI_CONNECT_TEXT.tools.notConnected)
    else if (id === 'antigravity') statusText = t(AI_CONNECT_TEXT.tools.antigravityNotInstalled)

    return {
      id,
      name: t(toolNames[id]),
      statusText,
      statusVariant: getStatusVariant(supported, connected, installed, id),
      showInstall: supported && needsInstall,
      showConnect: supported && (installed || id === 'claude-desktop'),
      installLabel: t(busy === id ? AI_CONNECT_TEXT.tools.installing : AI_CONNECT_TEXT.tools.install),
      connectLabel: t(
        busy === id ? AI_CONNECT_TEXT.tools.connecting : connected ? AI_CONNECT_TEXT.tools.reconnect : AI_CONNECT_TEXT.tools.connect,
      ),
      disabled: Boolean(busy) || !nodeReady,
      onInstall: () => {
        if (installable.success) action.mutate({ label: id, run: () => aiConnectService.installTool(installable.data) })
      },
      onConnect: () => action.mutate({ label: id, run: () => aiConnectService.connectTool(id) }),
    }
  })

  return {
    open,
    onOpenChange: (next: boolean) => {
      if (busy) return
      if (next) openDialog()
      else setOpen(false)
    },
    node: {
      description: describeNode(),
      showInstall: !nodeReady,
      installLabel: nodeInstallLabel(),
      installDisabled: Boolean(busy),
      onInstall: () => action.mutate({ label: 'node', run: aiConnectService.installNodeRuntime }),
    },
    tools,
    errorMessage: action.error ? action.error.message || t(AI_CONNECT_TEXT.dialog.errorFallback) : null,
    hasLog: log.length > 0,
    logText: log.join('\n'),
    logRef,
  }
}
