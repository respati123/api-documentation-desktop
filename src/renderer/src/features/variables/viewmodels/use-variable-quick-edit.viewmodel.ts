import { type FormEvent, useEffect, useEffectEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { VARIABLES_TEXT } from '@/features/variables/constants/variables-text.constants'
import type { WorkspaceVariables } from '@/lib/workspace-variables'

export type VariableQuickEditTarget = { name: string; sourceValue: string }

// Owns the quick-edit dialog: which scope is picked, the draft value, and the preview of the reference.
export function useVariableQuickEditViewModel({
  target,
  variables,
  activeEnvironmentId,
  resolvedValues,
  readOnly,
  onClose,
  onSave,
}: {
  target: VariableQuickEditTarget | null
  variables: WorkspaceVariables
  activeEnvironmentId: string | null
  resolvedValues: Record<string, string>
  readOnly: boolean
  onClose: () => void
  onSave: (name: string, scopeId: string, value: string) => void
}) {
  const { t } = useTranslation('variables')
  const activeEnvironment = variables.environments.find((environment) => environment.id === activeEnvironmentId)
  const [scopeId, setScopeId] = useState('global')
  const [draft, setDraft] = useState('')
  const targetName = target?.name

  const findVariable = (name: string, scope: string) =>
    scope === 'global'
      ? variables.globals.find((variable) => variable.name.trim() === name)
      : variables.environments.find((environment) => environment.id === scope)?.variables.find((variable) => variable.name.trim() === name)

  // Reads the latest variables, and runs only when the target or the active environment changes.
  const resetFromTarget = useEffectEvent((name: string, environmentId: string | null) => {
    const environment = variables.environments.find((item) => item.id === environmentId)
    const environmentVariable = environment?.variables.find((variable) => variable.name.trim() === name)
    const globalVariable = variables.globals.find((variable) => variable.name.trim() === name)
    const selected = environmentVariable ?? globalVariable
    const nextScope = environmentVariable && environment ? environment.id : globalVariable ? 'global' : (environment?.id ?? 'global')
    setScopeId(nextScope)
    setDraft(selected?.value ?? '')
  })

  useEffect(() => {
    if (targetName === undefined) return
    resetFromTarget(targetName, activeEnvironmentId)
  }, [targetName, activeEnvironmentId])

  const selectedVariable = target ? findVariable(target.name, scopeId) : undefined
  const canEdit = !readOnly || selectedVariable?.secret === true
  const referencedNames = target ? [...target.sourceValue.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)].map((match) => match[1].trim()) : []
  const secretNames = new Set(
    [...variables.globals, ...(activeEnvironment?.variables ?? [])]
      .filter((variable) => variable.secret)
      .map((variable) => variable.name.trim()),
  )
  const previewHasSecret = referencedNames.some((name) => secretNames.has(name))
  const previewValues = { ...resolvedValues }
  if (target && !(scopeId === 'global' && activeEnvironment?.variables.some((variable) => variable.name.trim() === target.name)))
    previewValues[target.name] = draft
  const preview =
    target?.sourceValue.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (token, rawName: string) => previewValues[rawName.trim()] ?? token) ?? ''

  function changeScope(nextScope: string) {
    setScopeId(nextScope)
    setDraft(target ? (findVariable(target.name, nextScope)?.value ?? '') : '')
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!target || !canEdit) return
    onSave(target.name, scopeId, draft)
  }

  return {
    open: Boolean(target),
    dialogTitle: target?.name ?? t(VARIABLES_TEXT.quickEdit.titleFallback),
    referenceName: target ? `{{${target.name}}}` : `{{${t(VARIABLES_TEXT.quickEdit.referenceFallback)}}}`,
    referenceText: target ? `{{${target.name}}}` : '',
    scopeId,
    scopeLabel:
      scopeId === 'global'
        ? t(VARIABLES_TEXT.quickEdit.scopeGlobal)
        : (activeEnvironment?.name ?? t(VARIABLES_TEXT.quickEdit.scopeFallback)),
    environment: activeEnvironment ? { id: activeEnvironment.id, name: activeEnvironment.name } : null,
    draft,
    valueAriaLabel: t(VARIABLES_TEXT.quickEdit.valueAria, { name: target?.name ?? t(VARIABLES_TEXT.quickEdit.valueAriaFallback) }),
    valueIsSecret: selectedVariable?.secret === true,
    valuePlaceholder: readOnly ? t(VARIABLES_TEXT.quickEdit.placeholderReadOnly) : t(VARIABLES_TEXT.quickEdit.placeholder),
    valueReadOnly: !canEdit,
    hasSelectedVariable: Boolean(selectedVariable),
    previewText: previewHasSecret ? t(VARIABLES_TEXT.quickEdit.previewHidden) : preview || t(VARIABLES_TEXT.quickEdit.previewEmpty),
    showReadOnlyNote: readOnly && selectedVariable?.secret !== true,
    canSave: canEdit,
    onOpenChange: (open: boolean) => {
      if (!open) onClose()
    },
    onClose,
    onDraftChange: setDraft,
    onScopeChange: changeScope,
    onSubmit: submit,
  }
}
