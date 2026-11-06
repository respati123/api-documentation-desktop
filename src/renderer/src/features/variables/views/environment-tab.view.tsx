import { useTranslation } from 'react-i18next'
import { VARIABLES_TEST_IDS } from '@/features/variables/constants/variables-test-ids.constants'
import { VARIABLES_TEXT } from '@/features/variables/constants/variables-text.constants'
import type { useEnvironmentTabViewModel } from '@/features/variables/viewmodels/use-environment-tab.viewmodel'
import { VariableRowsView } from '@/features/variables/views/variable-rows.view'
import { StateMessage } from '@/shared/components/state-message'
import { Badge, Button, EnvironmentEditor } from '@/shared/ui'

export type EnvironmentTabViewProps = ReturnType<typeof useEnvironmentTabViewModel>

export function EnvironmentTabView({
  environment,
  sectionLabel,
  readOnly,
  isActive,
  canActivate,
  activeLabel,
  activateLabel,
  duplicateLabel,
  deleteLabel,
  secureStorageAvailable,
  rows,
  onNameChange,
  onActivate,
  onDuplicate,
  onDelete,
}: EnvironmentTabViewProps) {
  const { t } = useTranslation('variables')

  if (!environment) {
    return (
      <section className="flex min-h-0 flex-1" data-testid={VARIABLES_TEST_IDS.tabPanel}>
        <StateMessage
          testId={VARIABLES_TEST_IDS.tabUnavailable}
          title={t(VARIABLES_TEXT.environmentTab.unavailableTitle)}
          description={t(VARIABLES_TEXT.environmentTab.unavailableDescription)}
        />
      </section>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto" data-testid={VARIABLES_TEST_IDS.tabPanel}>
      {!secureStorageAvailable && (
        <p className="variable-storage-warning" role="status" data-testid={VARIABLES_TEST_IDS.tabStorageWarning}>
          {t(VARIABLES_TEXT.dialog.storageWarning)}
        </p>
      )}
      <EnvironmentEditor
        folderLabel={`${sectionLabel} /`}
        name={environment.name}
        nameLabel={t(VARIABLES_TEXT.environments.nameLabel)}
        nameTestId={VARIABLES_TEST_IDS.tabName}
        readOnly={readOnly}
        note={t(VARIABLES_TEXT.environmentTab.policy, { interpolation: { skipOnVariables: true }, variableName: '{{variableName}}' })}
        actions={
          <>
            {isActive ? (
              <Badge variant="success" shape="chip" data-testid={VARIABLES_TEST_IDS.tabActive}>
                {activeLabel}
              </Badge>
            ) : (
              <Button variant="primary" data-testid={VARIABLES_TEST_IDS.tabActivate} disabled={!canActivate} onClick={onActivate}>
                {activateLabel}
              </Button>
            )}
            <Button variant="secondary" data-testid={VARIABLES_TEST_IDS.tabDuplicate} disabled={readOnly} onClick={onDuplicate}>
              {duplicateLabel}
            </Button>
            <Button variant="destructive" data-testid={VARIABLES_TEST_IDS.tabDelete} disabled={readOnly} onClick={onDelete}>
              {deleteLabel}
            </Button>
          </>
        }
        onNameChange={onNameChange}
      >
        <VariableRowsView {...rows} />
      </EnvironmentEditor>
    </div>
  )
}
