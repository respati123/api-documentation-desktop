import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEST_IDS } from '@/features/request/constants/request-test-ids.constants'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import type { useRequestWorkbenchViewModel } from '@/features/request/viewmodels/use-request-workbench.viewmodel'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'

export type SendControlViewProps = ReturnType<typeof useRequestWorkbenchViewModel>['send']

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
    <div className="relative flex h-[38px] min-w-[118px] max-[1040px]:col-span-full max-[1040px]:w-full">
      <Button
        type="submit"
        className="h-[38px] min-h-[38px] min-w-0 flex-1 rounded-l-[7px] rounded-r-none px-4"
        data-testid={REQUEST_TEST_IDS.send.submit}
        disabled={isSending}
      >
        {label}
      </Button>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="h-[38px] min-h-[38px] w-[36px] shrink-0 rounded-l-none rounded-r-[7px] border-l border-primary-foreground/30 p-0 text-[18px] shadow-none"
            data-testid={REQUEST_TEST_IDS.send.options}
            aria-label={t(REQUEST_TEXT.send.optionsLabel)}
          >
            ⌄
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
    </div>
  )
}
