import type { useVariableQuickEditViewModel } from '@/features/variables/viewmodels/use-variable-quick-edit.viewmodel'
import { AppDialog } from '@/shared/components/app-dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'

export type VariableQuickEditViewProps = ReturnType<typeof useVariableQuickEditViewModel>

export function VariableQuickEditView({
  open,
  dialogTitle,
  referenceName,
  referenceText,
  scopeId,
  scopeLabel,
  environment,
  draft,
  valueLabel,
  valueIsSecret,
  valuePlaceholder,
  valueReadOnly,
  hasSelectedVariable,
  previewText,
  showReadOnlyNote,
  canSave,
  onOpenChange,
  onClose,
  onDraftChange,
  onScopeChange,
  onSubmit,
}: VariableQuickEditViewProps) {
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      className="variable-quick-dialog"
      eyebrow={<span className="variable-editor-eyebrow">Workspace variable</span>}
      title={dialogTitle}
      description={
        <>
          Change a saved value here. The request keeps using the same <code>{`{{${referenceName}}}`}</code> reference.
        </>
      }
    >
      <form className="variable-quick-form" onSubmit={onSubmit}>
        <div className="variable-quick-reference">
          <span>Reference</span>
          <code>{referenceText}</code>
        </div>
        <label className="variable-quick-label">
          <span>Scope</span>
          <Select value={scopeId} onValueChange={onScopeChange}>
            <SelectTrigger aria-label="Variable scope">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global</SelectItem>
              {environment && <SelectItem value={environment.id}>{environment.name}</SelectItem>}
            </SelectContent>
          </Select>
        </label>
        <label className="variable-quick-label">
          <span>Value{valueIsSecret && <span className="variable-secret-badge">Secret · this device</span>}</span>
          <Input
            autoFocus
            aria-label={`Value for ${valueLabel}`}
            type={valueIsSecret ? 'password' : 'text'}
            autoComplete="off"
            value={draft}
            readOnly={valueReadOnly}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder={valuePlaceholder}
          />
        </label>
        {!hasSelectedVariable && <p className="variable-create-note">Saving creates this variable in {scopeLabel}.</p>}
        <div className="variable-quick-preview">
          <span>In this field</span>
          <code>{previewText}</code>
        </div>
        {showReadOnlyNote && (
          <p className="variable-create-note">This workspace is read only. Secret values can still be saved on this device.</p>
        )}
        <div className="variable-quick-actions">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSave}>
            Save value
          </Button>
        </div>
      </form>
    </AppDialog>
  )
}
