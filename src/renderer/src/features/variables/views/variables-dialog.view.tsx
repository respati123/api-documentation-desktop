import { Trans, useTranslation } from 'react-i18next'
import { VARIABLES_TEST_IDS } from '@/features/variables/constants/variables-test-ids.constants'
import { VARIABLES_TEXT } from '@/features/variables/constants/variables-text.constants'
import type { useVariablesDialogViewModel } from '@/features/variables/viewmodels/use-variables-dialog.viewmodel'
import { VariableRowsView } from '@/features/variables/views/variable-rows.view'
import { AppDialog } from '@/shared/components/app-dialog'
import { SectionHeading } from '@/shared/components/section-heading'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { cn } from '@/shared/utils/cn'

export type VariablesDialogViewProps = ReturnType<typeof useVariablesDialogViewModel>

export function VariablesDialogView({
  open,
  onOpenChange,
  scope,
  onScopeChange,
  secureStorageAvailable,
  globalRows,
  environmentRows,
  environmentTotal,
  environments,
  noEnvironmentActive,
  onSelectEnvironment,
  createForm,
  selected,
  promptText,
}: VariablesDialogViewProps) {
  const { t } = useTranslation('variables')

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      className="variables-dialog"
      testId={VARIABLES_TEST_IDS.dialog}
      title={t(VARIABLES_TEXT.dialog.title)}
      description={
        <Trans
          t={t}
          i18nKey={VARIABLES_TEXT.dialog.description}
          ns="variables"
          values={{ token: '{{variableName}}' }}
          components={{ code: <code /> }}
        />
      }
    >
      <p className="variable-policy">{t(VARIABLES_TEXT.dialog.policy)}</p>
      {!secureStorageAvailable && (
        <p className="variable-storage-warning" role="status" data-testid={VARIABLES_TEST_IDS.storageWarning}>
          {t(VARIABLES_TEXT.dialog.storageWarning)}
        </p>
      )}
      <Tabs value={scope} onValueChange={onScopeChange} className="variables-tabs">
        <TabsList aria-label={t(VARIABLES_TEXT.dialog.scopeLabel)}>
          <TabsTrigger value="global" data-testid={VARIABLES_TEST_IDS.globalTab}>
            {t(VARIABLES_TEXT.dialog.scopeGlobal)}
          </TabsTrigger>
          <TabsTrigger value="environment" data-testid={VARIABLES_TEST_IDS.environmentsTab}>
            {t(VARIABLES_TEXT.dialog.scopeEnvironments)}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="global" className="variables-pane">
          <p className="variable-scope-help">{t(VARIABLES_TEXT.dialog.globalHelp)}</p>
          <VariableRowsView {...globalRows} />
        </TabsContent>
        <TabsContent value="environment" className="variables-pane">
          <section className="environment-list-section" aria-label={t(VARIABLES_TEXT.environments.sectionLabel)}>
            <SectionHeading
              className="environment-section-heading"
              title={t(VARIABLES_TEXT.environments.listTitle)}
              description={t(VARIABLES_TEXT.environments.listDescription)}
              action={<span className="environment-total">{environmentTotal}</span>}
            />
            <fieldset className="environment-list m-0 min-w-0 border-0 p-0">
              <legend className="sr-only">{t(VARIABLES_TEXT.environments.chooseActive)}</legend>
              <Button
                type="button"
                variant="ghost"
                className={cn('environment-list-item text-base font-normal', noEnvironmentActive && 'environment-list-item-active')}
                data-testid={VARIABLES_TEST_IDS.environmentNone}
                aria-pressed={noEnvironmentActive}
                onClick={() => onSelectEnvironment(null)}
              >
                <span className="environment-item-icon" aria-hidden="true">
                  ◎
                </span>
                <span className="environment-item-copy">
                  <strong>{t(VARIABLES_TEXT.environments.noneTitle)}</strong>
                  <small>{t(VARIABLES_TEXT.environments.noneDescription)}</small>
                </span>
                {noEnvironmentActive && <span className="environment-active-badge">{t(VARIABLES_TEXT.environments.active)}</span>}
              </Button>
              {environments.map((environment) => (
                <Button
                  type="button"
                  variant="ghost"
                  key={environment.id}
                  className={cn('environment-list-item text-base font-normal', environment.isActive && 'environment-list-item-active')}
                  data-testid={VARIABLES_TEST_IDS.environmentItem(environment.id)}
                  aria-pressed={environment.isActive}
                  onClick={() => onSelectEnvironment(environment.id)}
                >
                  <span className="environment-item-icon" aria-hidden="true">
                    ◉
                  </span>
                  <span className="environment-item-copy">
                    <strong>{environment.name}</strong>
                    <small>{environment.countText}</small>
                  </span>
                  {environment.isActive && <span className="environment-active-badge">{t(VARIABLES_TEXT.environments.active)}</span>}
                </Button>
              ))}
            </fieldset>
          </section>
          <div className="environment-create-panel">
            <div className="environment-create-copy">
              <strong>{t(VARIABLES_TEXT.environments.addTitle)}</strong>
              <span>{t(VARIABLES_TEXT.environments.addDescription)}</span>
            </div>
            <form className="environment-create-form" onSubmit={createForm.onSubmit}>
              <Input
                data-testid={VARIABLES_TEST_IDS.environmentNewName}
                aria-label={t(VARIABLES_TEXT.environments.newNameLabel)}
                maxLength={100}
                value={createForm.nameDraft}
                readOnly={createForm.readOnly}
                onChange={(event) => createForm.onNameChange(event.target.value)}
                placeholder={t(VARIABLES_TEXT.environments.newNamePlaceholder)}
              />
              <Button type="submit" size="sm" data-testid={VARIABLES_TEST_IDS.environmentAdd} disabled={!createForm.canSubmit}>
                {t(VARIABLES_TEXT.environments.addButton)}
              </Button>
            </form>
          </div>
          {selected ? (
            <>
              <div className="environment-name-row">
                <Label htmlFor="variables-environment-name">
                  <span>{t(VARIABLES_TEXT.environments.editing)}</span>
                  <Input
                    id="variables-environment-name"
                    data-testid={VARIABLES_TEST_IDS.environmentName}
                    aria-label={t(VARIABLES_TEXT.environments.nameLabel)}
                    maxLength={100}
                    value={selected.name}
                    readOnly={selected.readOnly}
                    onChange={(event) => selected.onNameChange(event.target.value)}
                  />
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  data-testid={VARIABLES_TEST_IDS.environmentDelete}
                  disabled={selected.readOnly}
                  onClick={selected.onDelete}
                >
                  {t(VARIABLES_TEXT.environments.delete)}
                </Button>
              </div>
              <p className="variable-scope-help">{t(VARIABLES_TEXT.environments.overrideHelp)}</p>
              <VariableRowsView {...environmentRows} />
            </>
          ) : (
            <p className="variable-empty environment-empty" data-testid={VARIABLES_TEST_IDS.environmentPrompt}>
              {promptText}
            </p>
          )}
        </TabsContent>
      </Tabs>
    </AppDialog>
  )
}
