import type { ReactElement } from 'react'
import type { useCollectionTreeViewModel } from '@/features/collection/viewmodels/use-collection-tree.viewmodel'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

type ViewModel = ReturnType<typeof useCollectionTreeViewModel>

export function CreateFolderDialogView({ folderDialog }: { folderDialog: ViewModel['folderDialog'] }): ReactElement {
  return (
    <Dialog open={folderDialog.open} onOpenChange={folderDialog.onOpenChange}>
      <DialogContent data-testid="collection-folder-dialog">
        <DialogHeader>
          <DialogTitle>{folderDialog.title}</DialogTitle>
          <DialogDescription>{folderDialog.description}</DialogDescription>
        </DialogHeader>
        <form className="dialog-form" onSubmit={folderDialog.onSubmit}>
          <Label htmlFor="folder-name" className="text-[13px] font-semibold leading-normal text-slate-700">
            {folderDialog.label}
          </Label>
          <Input
            data-testid="collection-folder-name-input"
            id="folder-name"
            autoFocus
            value={folderDialog.name}
            onChange={(event) => folderDialog.onNameChange(event.target.value)}
            placeholder={folderDialog.placeholder}
          />
          <Button data-testid="collection-folder-submit-button" type="submit" disabled={!folderDialog.canSubmit}>
            {folderDialog.submit}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function DeleteItemDialogView({ deleteDialog }: { deleteDialog: ViewModel['deleteDialog'] }): ReactElement {
  return (
    <Dialog open={deleteDialog.open} onOpenChange={deleteDialog.onOpenChange}>
      <DialogContent data-testid="collection-delete-dialog">
        <DialogHeader>
          <DialogTitle>{deleteDialog.title}</DialogTitle>
          <DialogDescription>{deleteDialog.description}</DialogDescription>
        </DialogHeader>
        <div className="dialog-actions">
          <Button data-testid="collection-delete-cancel-button" type="button" variant="outline" onClick={deleteDialog.onCancel}>
            {deleteDialog.cancel}
          </Button>
          <Button data-testid="collection-delete-confirm-button" type="button" variant="destructive" onClick={deleteDialog.onConfirm}>
            {deleteDialog.confirm}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
