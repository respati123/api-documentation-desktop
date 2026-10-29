import { useTranslation } from 'react-i18next'
import { VARIABLES_TEST_IDS } from '@/features/variables/constants/variables-test-ids.constants'
import { VARIABLES_TEXT } from '@/features/variables/constants/variables-text.constants'
import type { useEnvironmentTabViewModel } from '@/features/variables/viewmodels/use-environment-tab.viewmodel'
import { VariableRowsView } from '@/features/variables/views/variable-rows.view'
import { StateMessage } from '@/shared/components/state-message'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

export type EnvironmentTabViewProps = ReturnType<typeof useEnvironmentTabViewModel>

export function EnvironmentTabView({
  environment,
  sectionLabel,
  readOnly,
  isActive,
  canActivate,
  activateLabel,
  secureStorageAvailable,
  rows,
  onNameChange,
  onActivate,
}: EnvironmentTabViewProps) {
  const { t } = useTranslation('variables')

  if (!environment) {
    return (
      <section className="request-card workspace-full-panel" data-testid={VARIABLES_TEST_IDS.tabPanel}>
        <StateMessage
          testId={VARIABLES_TEST_IDS.tabUnavailable}
          title={t(VARIABLES_TEXT.environmentTab.unavailableTitle)}
          description={t(VARIABLES_TEXT.environmentTab.unavailableDescription)}
        />
      </section>
    )
  }

  return (
    <section className="request-card environment-tab-panel" aria-label={sectionLabel} data-testid={VARIABLES_TEST_IDS.tabPanel}>
      <div className="environment-tab-heading">
        <div>
          <p className="section-kicker">{t(VARIABLES_TEXT.environmentTab.kicker)}</p>
          <Input
            data-testid={VARIABLES_TEST_IDS.tabName}
            aria-label={t(VARIABLES_TEXT.environments.nameLabel)}
            maxLength={100}
            value={environment.name}
            readOnly={readOnly}
            onChange={(event) => onNameChange(event.target.value)}
          />
        </div>
        <Button
          type="button"
          variant={isActive ? 'default' : 'outline'}
          size="sm"
          data-testid={VARIABLES_TEST_IDS.tabActivate}
          disabled={!canActivate}
          onClick={onActivate}
        >
          {activateLabel}
        </Button>
      </div>
      <p className="variable-policy">{t(VARIABLES_TEXT.environmentTab.policy)}</p>
      {!secureStorageAvailable && (
        <p className="variable-storage-warning" role="status" data-testid={VARIABLES_TEST_IDS.tabStorageWarning}>
          {t(VARIABLES_TEXT.dialog.storageWarning)}
        </p>
      )}
      <VariableRowsView {...rows} />
    </section>
  )
}
