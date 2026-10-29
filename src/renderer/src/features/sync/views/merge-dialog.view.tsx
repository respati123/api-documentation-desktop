import type { ReactElement } from 'react'
import type { useDiscardDialogViewModel, useMergeDialogViewModel } from '@/features/sync/viewmodels/use-merge-dialog.viewmodel'
import { AppDialog } from '@/shared/components/app-dialog'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Label } from '@/shared/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'

type MergeViewModel = ReturnType<typeof useMergeDialogViewModel>

function ChoiceGroup({
  name,
  localLabel,
  remoteLabel,
  local,
  remote,
  onLocal,
  onRemote,
}: {
  name: string
  localLabel: string
  remoteLabel: string
  local: boolean
  remote: boolean
  onLocal: () => void
  onRemote: () => void
}): ReactElement {
  const value = local ? 'local' : remote ? 'remote' : ''
  return (
    <RadioGroup value={value} onValueChange={(next) => (next === 'local' ? onLocal() : onRemote())} className="merge-choices" name={name}>
      <Label className="flex items-center gap-2 text-[12px] text-slate-700">
        <RadioGroupItem value="local" />
        <span>{localLabel}</span>
      </Label>
      <Label className="flex items-center gap-2 text-[12px] text-slate-700">
        <RadioGroupItem value="remote" />
        <span>{remoteLabel}</span>
      </Label>
    </RadioGroup>
  )
}

export function MergeDialogView(props: MergeViewModel): ReactElement {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="merge-dialog">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>
        <div className="merge-conflicts">
          {props.conflicts.map((conflict) => (
            <section key={conflict.id} className="merge-conflict">
              <strong>{conflict.title}</strong>
              <ChoiceGroup
                name={`merge-${conflict.id}`}
                localLabel={conflict.localLabel}
                remoteLabel={conflict.remoteLabel}
                local={conflict.local}
                remote={conflict.remote}
                onLocal={() => props.onChoose(conflict.id, 'local')}
                onRemote={() => props.onChoose(conflict.id, 'remote')}
              />
            </section>
          ))}
          {props.variables && (
            <section className="merge-conflict">
              <strong>{props.variables.title}</strong>
              <ChoiceGroup
                name="merge-workspace-variables"
                localLabel={props.variables.localLabel}
                remoteLabel={props.variables.remoteLabel}
                local={props.variables.local}
                remote={props.variables.remote}
                onLocal={props.variables.onLocal}
                onRemote={props.variables.onRemote}
              />
            </section>
          )}
        </div>
        <Button onClick={props.onSave} disabled={!props.canSave}>
          {props.saveLabel}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export function DiscardDialogView(props: ReturnType<typeof useDiscardDialogViewModel>): ReactElement {
  return (
    <AppDialog
      testId="sync-discard-dialog-container"
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={props.title}
      description={props.description}
    >
      <div className="dialog-actions">
        <Button type="button" variant="outline" onClick={props.onCancel}>
          {props.cancelLabel}
        </Button>
        <Button type="button" variant="destructive" onClick={props.onConfirm}>
          {props.confirmLabel}
        </Button>
      </div>
    </AppDialog>
  )
}
