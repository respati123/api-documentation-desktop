import { useTranslation } from 'react-i18next'
import { SYNC_TEXT } from '@/features/sync/constants/sync-text.constants'

export type MergeConflictInput = { id: string; local: { name: string } | null; remote: { name: string } | null }
export type MergeChoice = 'local' | 'remote'

export type MergeDialogInput = {
  conflicts: MergeConflictInput[] | null
  variableConflict: boolean
  choices: Record<string, MergeChoice>
  variablesKey: string
  onChoose: (id: string, choice: MergeChoice) => void
  onSave: () => void
  onClose: () => void
}

// Turns the pending merge into the conflict list the dialog shows, with the choice already made for each item.
export function useMergeDialogViewModel(input: MergeDialogInput) {
  const { t } = useTranslation('sync')
  const { choices } = input

  const conflicts = (input.conflicts ?? []).map((conflict) => ({
    id: conflict.id,
    title: conflict.local?.name ?? conflict.remote?.name ?? t(SYNC_TEXT.merge.deletedItem),
    localLabel: `${t(SYNC_TEXT.merge.keepLocal)}${conflict.local ? `: ${conflict.local.name}` : ` ${t(SYNC_TEXT.merge.deleted)}`}`,
    remoteLabel: `${t(SYNC_TEXT.merge.keepCloud)}${conflict.remote ? `: ${conflict.remote.name}` : ` ${t(SYNC_TEXT.merge.deleted)}`}`,
    local: choices[conflict.id] === 'local',
    remote: choices[conflict.id] === 'remote',
  }))

  const canSave =
    input.conflicts !== null &&
    (input.conflicts ?? []).every((item) => Boolean(choices[item.id])) &&
    (!input.variableConflict || Boolean(choices[input.variablesKey]))

  return {
    title: t(SYNC_TEXT.merge.title),
    description: t(SYNC_TEXT.merge.description),
    conflicts,
    variables: input.variableConflict
      ? {
          title: t(SYNC_TEXT.merge.variables),
          localLabel: t(SYNC_TEXT.merge.keepLocalVariables),
          remoteLabel: t(SYNC_TEXT.merge.keepCloudVariables),
          local: choices[input.variablesKey] === 'local',
          remote: choices[input.variablesKey] === 'remote',
          onLocal: () => input.onChoose(input.variablesKey, 'local'),
          onRemote: () => input.onChoose(input.variablesKey, 'remote'),
        }
      : null,
    onChoose: input.onChoose,
    saveLabel: t(SYNC_TEXT.merge.save),
    canSave,
    open: input.conflicts !== null,
    onOpenChange: (open: boolean) => {
      if (!open) input.onClose()
    },
    onSave: input.onSave,
  }
}

export function useDiscardDialogViewModel({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  const { t } = useTranslation('sync')
  return {
    open,
    onOpenChange,
    title: t(SYNC_TEXT.discard.title),
    description: t(SYNC_TEXT.discard.description),
    cancelLabel: t(SYNC_TEXT.discard.cancel),
    confirmLabel: t(SYNC_TEXT.discard.confirm),
    onCancel: () => onOpenChange(false),
    onConfirm,
  }
}
