import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { WORKSPACE_TEXT } from '@/features/workspace/constants/workspace-text.constants'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'

// Shown when the workspace changed outside the app while the user had edits that were not saved. Their edit stays on screen until they choose.
export function SaveConflictDialogView({
  open,
  onKeepMine,
  onUseSaved,
}: {
  open: boolean
  onKeepMine: () => void
  onUseSaved: () => void
}): ReactElement {
  const { t } = useTranslation('workspace')
  return (
    <Dialog open={open}>
      <DialogContent data-testid="workspace-save-conflict-dialog">
        <DialogHeader>
          <DialogTitle>{t(WORKSPACE_TEXT.storage.conflictTitle)}</DialogTitle>
          <DialogDescription>{t(WORKSPACE_TEXT.storage.conflictDescription)}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" data-testid="workspace-save-conflict-use-saved" onClick={onUseSaved}>
            {t(WORKSPACE_TEXT.storage.useSaved)}
          </Button>
          <Button type="button" data-testid="workspace-save-conflict-keep-mine" onClick={onKeepMine}>
            {t(WORKSPACE_TEXT.storage.keepMine)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
