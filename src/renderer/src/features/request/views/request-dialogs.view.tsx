import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEST_IDS } from '@/features/request/constants/request-test-ids.constants'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import type { useRequestWorkbenchViewModel } from '@/features/request/viewmodels/use-request-workbench.viewmodel'
import { AppDialog } from '@/shared/components/app-dialog'
import { Button, Input, Label, Textarea } from '@/shared/ui'

type TimerDialogProps = ReturnType<typeof useRequestWorkbenchViewModel>['delayDialog']
export type ClientCodeDialogProps = ReturnType<typeof useRequestWorkbenchViewModel>['clientCode']

export function DelayDialogView({ open, onOpenChange, seconds, onSecondsChange, onSubmit }: TimerDialogProps): ReactElement {
  const { t } = useTranslation('request')

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      testId={REQUEST_TEST_IDS.delay.dialog}
      title={t(REQUEST_TEXT.timers.delayTitle)}
      description={t(REQUEST_TEXT.timers.delayDescription)}
    >
      <form className="grid gap-3" onSubmit={onSubmit}>
        <Label htmlFor="send-delay-seconds">{t(REQUEST_TEXT.timers.delayLabel)}</Label>
        <Input
          id="send-delay-seconds"
          data-testid={REQUEST_TEST_IDS.delay.input}
          type="number"
          min="1"
          max="3600"
          value={seconds}
          onChange={(event) => onSecondsChange(event.target.value)}
        />
        <div className="flex justify-end">
          <Button variant="primary" type="submit" data-testid={REQUEST_TEST_IDS.delay.submit}>
            {t(REQUEST_TEXT.timers.delaySubmit)}
          </Button>
        </div>
      </form>
    </AppDialog>
  )
}

export function RepeatDialogView({ open, onOpenChange, seconds, onSecondsChange, onSubmit }: TimerDialogProps): ReactElement {
  const { t } = useTranslation('request')

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      testId={REQUEST_TEST_IDS.repeat.dialog}
      title={t(REQUEST_TEXT.timers.repeatTitle)}
      description={t(REQUEST_TEXT.timers.repeatDescription)}
    >
      <form className="grid gap-3" onSubmit={onSubmit}>
        <Label htmlFor="repeat-interval-seconds">{t(REQUEST_TEXT.timers.repeatLabel)}</Label>
        <Input
          id="repeat-interval-seconds"
          data-testid={REQUEST_TEST_IDS.repeat.input}
          type="number"
          min="1"
          max="3600"
          value={seconds}
          onChange={(event) => onSecondsChange(event.target.value)}
        />
        <div className="flex justify-end">
          <Button variant="primary" type="submit" data-testid={REQUEST_TEST_IDS.repeat.submit}>
            {t(REQUEST_TEXT.timers.repeatSubmit)}
          </Button>
        </div>
      </form>
    </AppDialog>
  )
}

export function ClientCodeDialogView({ open, onOpenChange, code, status, onCopy }: ClientCodeDialogProps): ReactElement {
  const { t } = useTranslation('request')

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      className="client-code-dialog"
      testId={REQUEST_TEST_IDS.clientCode.dialog}
      title={t(REQUEST_TEXT.clientCode.title)}
      description={t(REQUEST_TEXT.clientCode.description)}
    >
      <Textarea
        data-testid={REQUEST_TEST_IDS.clientCode.textarea}
        aria-label={t(REQUEST_TEXT.clientCode.textareaLabel)}
        className="min-h-[220px] font-mono text-xs"
        readOnly
        value={code}
        spellCheck={false}
      />
      <p className="text-[12px] leading-[1.6] text-muted-foreground">{t(REQUEST_TEXT.clientCode.note)}</p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] text-muted-foreground" role="status" data-testid={REQUEST_TEST_IDS.clientCode.status}>
          {status}
        </span>
        <Button variant="secondary" type="button" data-testid={REQUEST_TEST_IDS.clientCode.copy} onClick={() => void onCopy()}>
          {t(REQUEST_TEXT.clientCode.copy)}
        </Button>
      </div>
    </AppDialog>
  )
}
