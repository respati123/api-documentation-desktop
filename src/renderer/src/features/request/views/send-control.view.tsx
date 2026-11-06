import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEST_IDS } from '@/features/request/constants/request-test-ids.constants'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import type { useRequestWorkbenchViewModel } from '@/features/request/viewmodels/use-request-workbench.viewmodel'
import {
  Button,
  ButtonGroup,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  Icon,
} from '@/shared/ui'

export type SendControlViewProps = ReturnType<typeof useRequestWorkbenchViewModel>['send']

// The Send button and its options menu, joined as one control.
export function SendControlView({
  isSending,
  label,
  downloadAfterSend,
  repeatRunning,
  onSendNow,
  onSendAndDownload,
  onToggleDownload,
  onOpenClientCode,
  onOpenDelay,
  onOpenRepeat,
  onStopRepeating,
}: SendControlViewProps): ReactElement {
  const { t } = useTranslation('request')

  return (
    <ButtonGroup className="h-[38px] max-[760px]:ml-auto">
      <Button variant="send" size="lg" type="submit" data-testid={REQUEST_TEST_IDS.send.submit} disabled={isSending}>
        {label}
        <kbd className="max-[760px]:hidden">{t(REQUEST_TEXT.send.shortcutHint)}</kbd>
        {downloadAfterSend && (
          <span className="text-[12px] opacity-80" title={t(REQUEST_TEXT.send.downloadAfter)}>
            <span aria-hidden="true">↓</span>
            <span className="sr-only">{t(REQUEST_TEXT.send.downloadAfter)}</span>
          </span>
        )}
      </Button>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="send"
            size="lg"
            type="button"
            data-testid={REQUEST_TEST_IDS.send.options}
            aria-label={t(REQUEST_TEXT.send.optionsLabel)}
          >
            <Icon name="chevron" size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" aria-label={t(REQUEST_TEXT.send.menuLabel)} data-testid={REQUEST_TEST_IDS.send.menu}>
          <DropdownMenuLabel>{t(REQUEST_TEXT.send.sectionBasic)}</DropdownMenuLabel>
          <DropdownMenuItem data-testid={REQUEST_TEST_IDS.send.sendNow} onSelect={onSendNow}>
            {t(REQUEST_TEXT.send.sendNow)}
            <DropdownMenuShortcut>{t(REQUEST_TEXT.send.shortcut)}</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem data-testid={REQUEST_TEST_IDS.send.clientCode} onSelect={onOpenClientCode}>
            {t(REQUEST_TEXT.send.clientCode)}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>{t(REQUEST_TEXT.send.sectionAdvanced)}</DropdownMenuLabel>
          <DropdownMenuItem data-testid={REQUEST_TEST_IDS.send.delay} onSelect={onOpenDelay}>
            {t(REQUEST_TEXT.send.delay)}
          </DropdownMenuItem>
          {repeatRunning ? (
            <DropdownMenuItem data-testid={REQUEST_TEST_IDS.send.stopRepeating} onSelect={onStopRepeating}>
              {t(REQUEST_TEXT.send.stopRepeating)}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem data-testid={REQUEST_TEST_IDS.send.repeat} onSelect={onOpenRepeat}>
              {t(REQUEST_TEXT.send.repeat)}
            </DropdownMenuItem>
          )}
          <DropdownMenuCheckboxItem
            data-testid={REQUEST_TEST_IDS.send.downloadToggle}
            checked={downloadAfterSend}
            onSelect={onToggleDownload}
          >
            {t(REQUEST_TEXT.send.downloadAfter)}
          </DropdownMenuCheckboxItem>
          <DropdownMenuItem data-testid={REQUEST_TEST_IDS.send.sendDownload} onSelect={onSendAndDownload}>
            {t(REQUEST_TEXT.send.sendDownload)}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}
