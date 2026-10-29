import { type FormEvent, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { WorkspaceVariables } from '@/lib/workspace-variables'

export function VariableQuickEditDialog({
  target,
  variables,
  activeEnvironmentId,
  resolvedValues,
  readOnly,
  onClose,
  onSave,
}: {
  target: { name: string; sourceValue: string } | null
  variables: WorkspaceVariables
  activeEnvironmentId: string | null
  resolvedValues: Record<string, string>
  readOnly: boolean
  onClose: () => void
  onSave: (name: string, scopeId: string, value: string) => void
}) {
  const activeEnvironment = variables.environments.find((environment) => environment.id === activeEnvironmentId)
  const [scopeId, setScopeId] = useState('global')
  const [draft, setDraft] = useState('')

  const findVariable = (name: string, scope: string) =>
    scope === 'global'
      ? variables.globals.find((variable) => variable.name.trim() === name)
      : variables.environments.find((environment) => environment.id === scope)?.variables.find((variable) => variable.name.trim() === name)

  useEffect(() => {
    if (!target) return
    const environmentVariable = activeEnvironment?.variables.find((variable) => variable.name.trim() === target.name)
    const globalVariable = variables.globals.find((variable) => variable.name.trim() === target.name)
    const selected = environmentVariable ?? globalVariable
    const nextScope =
      environmentVariable && activeEnvironment ? activeEnvironment.id : globalVariable ? 'global' : (activeEnvironment?.id ?? 'global')
    setScopeId(nextScope)
    setDraft(selected?.value ?? '')
  }, [target?.name, activeEnvironmentId])

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

  return (
    <Dialog
      open={Boolean(target)}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="variable-quick-dialog">
        <DialogHeader>
          <span className="variable-editor-eyebrow">Workspace variable</span>
          <DialogTitle>{target?.name ?? 'Edit variable'}</DialogTitle>
          <DialogDescription>
            Change a saved value here. The request keeps using the same <code>{`{{${target?.name ?? 'name'}}}`}</code> reference.
          </DialogDescription>
        </DialogHeader>
        <form className="variable-quick-form" onSubmit={submit}>
          <div className="variable-quick-reference">
            <span>Reference</span>
            <code>{target ? `{{${target.name}}}` : ''}</code>
          </div>
          <label className="variable-quick-label">
            <span>Scope</span>
            <Select value={scopeId} onValueChange={changeScope}>
              <SelectTrigger aria-label="Variable scope">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global</SelectItem>
                {activeEnvironment && <SelectItem value={activeEnvironment.id}>{activeEnvironment.name}</SelectItem>}
              </SelectContent>
            </Select>
          </label>
          <label className="variable-quick-label">
            <span>Value{selectedVariable?.secret && <span className="variable-secret-badge">Secret · this device</span>}</span>
            <Input
              autoFocus
              aria-label={`Value for ${target?.name ?? 'variable'}`}
              type={selectedVariable?.secret ? 'password' : 'text'}
              autoComplete="off"
              value={draft}
              readOnly={!canEdit}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={readOnly ? 'No local secret value saved' : 'Enter a value'}
            />
          </label>
          {!selectedVariable && (
            <p className="variable-create-note">
              Saving creates this variable in {scopeId === 'global' ? 'Global' : (activeEnvironment?.name ?? 'the active environment')}.
            </p>
          )}
          <div className="variable-quick-preview">
            <span>In this field</span>
            <code>{previewHasSecret ? 'Preview hidden because this reference uses a secret value.' : preview || 'Nothing to preview'}</code>
          </div>
          {readOnly && !selectedVariable?.secret && (
            <p className="variable-create-note">This workspace is read only. Secret values can still be saved on this device.</p>
          )}
          <div className="variable-quick-actions">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canEdit}>
              Save value
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
