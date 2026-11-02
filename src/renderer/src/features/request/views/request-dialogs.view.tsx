import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEST_IDS } from '@/features/request/constants/request-test-ids.constants'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import type { useRequestWorkbenchViewModel } from '@/features/request/viewmodels/use-request-workbench.viewmodel'
import { AppDialog } from '@/shared/components/app-dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'

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
      <form className="dialog-form send-timer-form" onSubmit={onSubmit}>
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
        <Button type="submit" data-testid={REQUEST_TEST_IDS.delay.submit}>
          {t(REQUEST_TEXT.timers.delaySubmit)}
        </Button>
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
      <form className="dialog-form send-timer-form" onSubmit={onSubmit}>
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
        <Button type="submit" data-testid={REQUEST_TEST_IDS.repeat.submit}>
          {t(REQUEST_TEXT.timers.repeatSubmit)}
        </Button>
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
        className="client-code-textarea code-field"
        readOnly
        value={code}
        spellCheck={false}
      />
      <p className="client-code-note">{t(REQUEST_TEXT.clientCode.note)}</p>
      <div className="client-code-actions">
        <span role="status" data-testid={REQUEST_TEST_IDS.clientCode.status}>
          {status}
        </span>
        <Button type="button" data-testid={REQUEST_TEST_IDS.clientCode.copy} onClick={() => void onCopy()}>
          {t(REQUEST_TEXT.clientCode.copy)}
        </Button>
      </div>
    </AppDialog>
  )
}
