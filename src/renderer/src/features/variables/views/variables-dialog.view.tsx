import { Trans, useTranslation } from 'react-i18next'
import { VARIABLES_TEST_IDS } from '@/features/variables/constants/variables-test-ids.constants'
import { VARIABLES_TEXT } from '@/features/variables/constants/variables-text.constants'
import type { useVariablesDialogViewModel } from '@/features/variables/viewmodels/use-variables-dialog.viewmodel'
import { VariableRowsView } from '@/features/variables/views/variable-rows.view'
import { AppDialog } from '@/shared/components/app-dialog'
import { Button, Input, Label, Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui'
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
  selected,
  promptText,
}: VariablesDialogViewProps) {
  const { t } = useTranslation('variables')

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      className="grid max-h-[calc(100vh-32px)] gap-4 overflow-auto"
      testId={VARIABLES_TEST_IDS.dialog}
      title={t(VARIABLES_TEXT.dialog.title)}
      description={
        <Trans
          t={t}
          i18nKey={VARIABLES_TEXT.dialog.description}
          ns="variables"
          values={{ token: '{{variableName}}' }}
          components={{ code: <code className="font-mono text-foreground" /> }}
        />
      }
    >
      <p className="text-[12px] leading-[1.6] text-muted-foreground">{t(VARIABLES_TEXT.dialog.policy)}</p>
      {!secureStorageAvailable && (
        <p className="text-[12px] text-destructive" role="status" data-testid={VARIABLES_TEST_IDS.storageWarning}>
          {t(VARIABLES_TEXT.dialog.storageWarning)}
        </p>
      )}
      <Tabs value={scope} onValueChange={onScopeChange} className="grid gap-4">
        <TabsList aria-label={t(VARIABLES_TEXT.dialog.scopeLabel)}>
          <TabsTrigger value="global" data-testid={VARIABLES_TEST_IDS.globalTab}>
            {t(VARIABLES_TEXT.dialog.scopeGlobal)}
          </TabsTrigger>
          <TabsTrigger value="environment" data-testid={VARIABLES_TEST_IDS.environmentsTab}>
            {t(VARIABLES_TEXT.dialog.scopeEnvironments)}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="global" className="grid gap-4">
          <p className="text-[12px] leading-[1.6] text-muted-foreground">{t(VARIABLES_TEXT.dialog.globalHelp)}</p>
          <VariableRowsView {...globalRows} />
        </TabsContent>
        <TabsContent value="environment" className="grid gap-4">
          <section className="grid gap-2" aria-label={t(VARIABLES_TEXT.environments.sectionLabel)}>
            <div className="flex items-center justify-between gap-4">
              <div className="grid">
                <strong className="text-[13px] font-semibold text-foreground">{t(VARIABLES_TEXT.environments.listTitle)}</strong>
                <span className="text-[12px] text-muted-foreground">{t(VARIABLES_TEXT.environments.listDescription)}</span>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{environmentTotal}</span>
            </div>
            <fieldset className="m-0 grid min-w-0 gap-1 border-0 p-0">
              <legend className="sr-only">{t(VARIABLES_TEXT.environments.chooseActive)}</legend>
              <Button
                variant="ghost"
                aria-pressed={noEnvironmentActive}
                data-testid={VARIABLES_TEST_IDS.environmentNone}
                className={cn('h-auto justify-start gap-3 px-3 py-2 text-left', noEnvironmentActive && 'bg-muted text-foreground')}
                onClick={() => onSelectEnvironment(null)}
              >
                <span aria-hidden="true">◎</span>
                <span className="grid min-w-0 flex-1">
                  <strong className="font-semibold">{t(VARIABLES_TEXT.environments.noneTitle)}</strong>
                  <small className="text-[11px] text-muted-foreground">{t(VARIABLES_TEXT.environments.noneDescription)}</small>
                </span>
                {noEnvironmentActive && <span className="text-[11px] text-primary">{t(VARIABLES_TEXT.environments.active)}</span>}
              </Button>
              {environments.map((environment) => (
                <Button
                  variant="ghost"
                  key={environment.id}
                  aria-pressed={environment.isActive}
                  data-testid={VARIABLES_TEST_IDS.environmentItem(environment.id)}
                  className={cn('h-auto justify-start gap-3 px-3 py-2 text-left', environment.isActive && 'bg-muted text-foreground')}
                  onClick={() => onSelectEnvironment(environment.id)}
                >
                  <span aria-hidden="true">◉</span>
                  <span className="grid min-w-0 flex-1">
                    <strong className="truncate font-semibold">{environment.name}</strong>
                    <small className="text-[11px] text-muted-foreground">{environment.countText}</small>
                  </span>
                  {environment.isActive && <span className="text-[11px] text-primary">{t(VARIABLES_TEXT.environments.active)}</span>}
                </Button>
              ))}
            </fieldset>
          </section>
          {selected ? (
            <>
              <div className="flex flex-wrap items-end gap-3">
                <Label htmlFor="variables-environment-name" className="grid min-w-0 flex-1 gap-1">
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
                  variant="destructive"
                  size="sm"
                  data-testid={VARIABLES_TEST_IDS.environmentDelete}
                  disabled={selected.readOnly}
                  onClick={selected.onDelete}
                >
                  {t(VARIABLES_TEXT.environments.delete)}
                </Button>
              </div>
              <p className="text-[12px] leading-[1.6] text-muted-foreground">{t(VARIABLES_TEXT.environments.overrideHelp)}</p>
              <VariableRowsView {...environmentRows} />
            </>
          ) : (
            <p className="text-[13px] leading-[1.6] text-muted-foreground" data-testid={VARIABLES_TEST_IDS.environmentPrompt}>
              {promptText}
            </p>
          )}
        </TabsContent>
      </Tabs>
    </AppDialog>
  )
}
