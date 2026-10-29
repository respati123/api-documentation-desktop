import { Trans, useTranslation } from 'react-i18next'
import { VARIABLES_TEST_IDS } from '@/features/variables/constants/variables-test-ids.constants'
import { VARIABLES_TEXT } from '@/features/variables/constants/variables-text.constants'
import type { useVariableQuickEditViewModel } from '@/features/variables/viewmodels/use-variable-quick-edit.viewmodel'
import { AppDialog } from '@/shared/components/app-dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
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
  valueAriaLabel,
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
  const { t } = useTranslation('variables')

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      className="variable-quick-dialog"
      testId={VARIABLES_TEST_IDS.quickEdit}
      eyebrow={<span className="variable-editor-eyebrow">{t(VARIABLES_TEXT.quickEdit.eyebrow)}</span>}
      title={dialogTitle}
      description={
        <Trans
          t={t}
          i18nKey={VARIABLES_TEXT.quickEdit.description}
          ns="variables"
          values={{ reference: referenceName }}
          components={{ code: <code /> }}
        />
      }
    >
      <form className="variable-quick-form" onSubmit={onSubmit}>
        <div className="variable-quick-reference">
          <span>{t(VARIABLES_TEXT.quickEdit.referenceLabel)}</span>
          <code>{referenceText}</code>
        </div>
        <div className="variable-quick-label">
          <Label htmlFor="variable-quick-scope">{t(VARIABLES_TEXT.quickEdit.scopeLabel)}</Label>
          <Select value={scopeId} onValueChange={onScopeChange}>
            <SelectTrigger
              id="variable-quick-scope"
              data-testid={VARIABLES_TEST_IDS.quickScope}
              aria-label={t(VARIABLES_TEXT.quickEdit.scopeAria)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">{t(VARIABLES_TEXT.quickEdit.scopeGlobal)}</SelectItem>
              {environment && <SelectItem value={environment.id}>{environment.name}</SelectItem>}
            </SelectContent>
          </Select>
        </div>
        <div className="variable-quick-label">
          <Label htmlFor="variable-quick-value">
            {t(VARIABLES_TEXT.quickEdit.valueLabel)}
            {valueIsSecret && <span className="variable-secret-badge">{t(VARIABLES_TEXT.quickEdit.secretBadge)}</span>}
          </Label>
          <Input
            id="variable-quick-value"
            data-testid={VARIABLES_TEST_IDS.quickValue}
            autoFocus
            aria-label={valueAriaLabel}
            type={valueIsSecret ? 'password' : 'text'}
            autoComplete="off"
            value={draft}
            readOnly={valueReadOnly}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder={valuePlaceholder}
          />
        </div>
        {!hasSelectedVariable && <p className="variable-create-note">{t(VARIABLES_TEXT.quickEdit.createNote, { scope: scopeLabel })}</p>}
        <div className="variable-quick-preview">
          <span>{t(VARIABLES_TEXT.quickEdit.previewLabel)}</span>
          <code>{previewText}</code>
        </div>
        {showReadOnlyNote && <p className="variable-create-note">{t(VARIABLES_TEXT.quickEdit.readOnlyNote)}</p>}
        <div className="variable-quick-actions">
          <Button type="button" variant="outline" data-testid={VARIABLES_TEST_IDS.quickCancel} onClick={onClose}>
            {t(VARIABLES_TEXT.quickEdit.cancel)}
          </Button>
          <Button type="submit" data-testid={VARIABLES_TEST_IDS.quickSave} disabled={!canSave}>
            {t(VARIABLES_TEXT.quickEdit.save)}
          </Button>
        </div>
      </form>
    </AppDialog>
  )
}
