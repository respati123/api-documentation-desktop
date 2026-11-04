import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { SYNC_TEXT } from '@/features/sync/constants/sync-text.constants'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'

// Shown when a save of the workspace variables was refused because the cloud changed them. Both choices are explicit,
// so nothing is replaced without the user's choice. Closing the dialog changes nothing.
export function VariablesConflictDialogView({
  open,
  onKeepMine,
  onUseCloud,
}: {
  open: boolean
  onKeepMine: () => void
  onUseCloud: () => void
}): ReactElement {
  const { t } = useTranslation('sync')
  return (
    <Dialog open={open}>
      <DialogContent data-testid="sync-variables-conflict-dialog">
        <DialogHeader>
          <DialogTitle>{t(SYNC_TEXT.variablesConflict.title)}</DialogTitle>
          <DialogDescription>{t(SYNC_TEXT.variablesConflict.description)}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" data-testid="sync-variables-conflict-use-cloud" onClick={onUseCloud}>
            {t(SYNC_TEXT.variablesConflict.useCloud)}
          </Button>
          <Button type="button" data-testid="sync-variables-conflict-keep-mine" onClick={onKeepMine}>
            {t(SYNC_TEXT.variablesConflict.keepMine)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
