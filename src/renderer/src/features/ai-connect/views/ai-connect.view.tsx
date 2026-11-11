import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { AI_CONNECT_TEST_IDS } from '@/features/ai-connect/constants/ai-connect-test-ids.constants'
import { AI_CONNECT_TEXT } from '@/features/ai-connect/constants/ai-connect-text.constants'
import type { useAiConnectViewModel } from '@/features/ai-connect/viewmodels/use-ai-connect.viewmodel'
import { AppDialog } from '@/shared/components/app-dialog'
import { Alert, AlertTitle, Badge, Button, ScrollArea } from '@/shared/ui'

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
      className="ai-connect-dialog"
      title={t(AI_CONNECT_TEXT.dialog.title)}
      description={t(AI_CONNECT_TEXT.dialog.description)}
    >
      <div className="mt-1 grid gap-3">
        <div className="flex min-w-0 items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
          <div className="min-w-0">
            <strong className="block text-sm font-semibold leading-5 text-foreground">{t(AI_CONNECT_TEXT.node.title)}</strong>
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">{node.description}</span>
          </div>
          {node.showInstall && (
            <Button size="sm" data-testid={AI_CONNECT_TEST_IDS.nodeInstall} disabled={node.installDisabled} onClick={node.onInstall}>
              {node.installLabel}
            </Button>
          )}
        </div>
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {tools.map((tool) => (
            <div className="flex min-w-0 items-center justify-between gap-4 px-4 py-3" key={tool.id}>
              <div className="min-w-0 flex-1">
                <strong className="block text-sm font-semibold leading-5 text-foreground">{tool.name}</strong>
                <Badge variant={tool.statusVariant} shape="chip" className="mt-1 max-w-full whitespace-normal break-words">
                  {tool.statusText}
                </Badge>
              </div>
              <div className="flex shrink-0 items-center gap-2">
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
                  <Button
                    size="sm"
                    data-testid={AI_CONNECT_TEST_IDS.toolConnect(tool.id)}
                    disabled={tool.disabled}
                    onClick={tool.onConnect}
                  >
                    {tool.connectLabel}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Alert variant="warning" className="mt-3">
        {t(AI_CONNECT_TEXT.dialog.note)}
      </Alert>
      {errorMessage && (
        <Alert variant="destructive" className="mt-2" data-testid={AI_CONNECT_TEST_IDS.error}>
          <AlertTitle>{errorMessage}</AlertTitle>
        </Alert>
      )}
      {hasLog && (
        <ScrollArea type="auto" className="mt-2 max-h-[180px] rounded-lg border border-border bg-chrome">
          <pre
            className="whitespace-pre-wrap break-words p-3 font-mono text-[11px] leading-5 text-secondary-foreground"
            ref={logRef}
            role="log"
            aria-label={t(AI_CONNECT_TEXT.dialog.logLabel)}
            data-testid={AI_CONNECT_TEST_IDS.log}
          >
            {logText}
          </pre>
        </ScrollArea>
      )}
    </AppDialog>
  )
}
