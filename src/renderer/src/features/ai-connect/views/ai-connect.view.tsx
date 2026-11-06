import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { AI_CONNECT_TEST_IDS } from '@/features/ai-connect/constants/ai-connect-test-ids.constants'
import { AI_CONNECT_TEXT } from '@/features/ai-connect/constants/ai-connect-text.constants'
import type { useAiConnectViewModel } from '@/features/ai-connect/viewmodels/use-ai-connect.viewmodel'
import { AppDialog } from '@/shared/components/app-dialog'
import { Button } from '@/shared/ui'

export type AiConnectViewProps = ReturnType<typeof useAiConnectViewModel>

export function AiConnectView({
  open,
  onOpenChange,
  node,
  tools,
  errorMessage,
  hasLog,
  logText,
  logRef,
}: AiConnectViewProps): ReactElement {
  const { t } = useTranslation('ai-connect')

  return (
    <AppDialog
      testId={AI_CONNECT_TEST_IDS.dialog}
      open={open}
      onOpenChange={onOpenChange}
      title={t(AI_CONNECT_TEXT.dialog.title)}
      description={t(AI_CONNECT_TEXT.dialog.description)}
    >
      <div className="mt-3 grid gap-2">
        <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2.5">
          <div>
            <strong className="block text-[13px] text-slate-900">{t(AI_CONNECT_TEXT.node.title)}</strong>
            <span className="mt-0.5 block text-xs text-slate-500">{node.description}</span>
          </div>
          {node.showInstall && (
            <Button size="sm" data-testid={AI_CONNECT_TEST_IDS.nodeInstall} disabled={node.installDisabled} onClick={node.onInstall}>
              {node.installLabel}
            </Button>
          )}
        </div>
        {tools.map((tool) => (
          <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2.5" key={tool.id}>
            <div>
              <strong className="block text-[13px] text-slate-900">{tool.name}</strong>
              <span className="mt-0.5 block text-xs text-slate-500">{tool.statusText}</span>
            </div>
            <div className="flex shrink-0 gap-1.5">
              {tool.showInstall && (
                <Button
                  size="sm"
                  variant="secondary"
                  data-testid={AI_CONNECT_TEST_IDS.toolInstall(tool.id)}
                  disabled={tool.disabled}
                  onClick={tool.onInstall}
                >
                  {tool.installLabel}
                </Button>
              )}
              {tool.showConnect && (
                <Button size="sm" data-testid={AI_CONNECT_TEST_IDS.toolConnect(tool.id)} disabled={tool.disabled} onClick={tool.onConnect}>
                  {tool.connectLabel}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">{t(AI_CONNECT_TEXT.dialog.note)}</p>
      {errorMessage && (
        <p className="m-0 text-xs leading-normal text-red-800" role="alert" data-testid={AI_CONNECT_TEST_IDS.error}>
          {errorMessage}
        </p>
      )}
      {hasLog && (
        <pre
          className="mt-2.5 max-h-[180px] overflow-auto whitespace-pre-wrap rounded-md border border-slate-300 bg-slate-900 p-2.5 font-mono text-[11px] leading-normal text-slate-200"
          ref={logRef}
          role="log"
          aria-label={t(AI_CONNECT_TEXT.dialog.logLabel)}
          data-testid={AI_CONNECT_TEST_IDS.log}
        >
          {logText}
        </pre>
      )}
    </AppDialog>
  )
}
