import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VariableRows } from '@/components/variable-rows'
import { cn } from '@/lib/utils'
import type { WorkspaceEnvironment, WorkspaceVariable, WorkspaceVariables } from '@/lib/workspace-variables'

export function VariablesDialog({
  open,
  onOpenChange,
  variables,
  activeEnvironmentId,
  readOnly,
  secureStorageAvailable,
  onVariablesChange,
  onActiveEnvironmentChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  variables: WorkspaceVariables
  activeEnvironmentId: string | null
  readOnly: boolean
  secureStorageAvailable: boolean
  onVariablesChange: (variables: WorkspaceVariables) => void
  onActiveEnvironmentChange: (environmentId: string | null) => void
}) {
  const [scope, setScope] = useState('global')
  const [environmentNameDraft, setEnvironmentNameDraft] = useState('')
  const selectedEnvironment = variables.environments.find((environment) => environment.id === activeEnvironmentId)

  function updateGlobalRows(rows: WorkspaceVariable[]) {
    onVariablesChange({ ...variables, globals: rows })
  }

  function updateEnvironment(patch: Partial<WorkspaceEnvironment>) {
    if (!selectedEnvironment) return
    onVariablesChange({
      ...variables,
      environments: variables.environments.map((environment) =>
        environment.id === selectedEnvironment.id ? { ...environment, ...patch } : environment,
      ),
    })
  }

  function createEnvironment(event: FormEvent) {
    event.preventDefault()
    const name = environmentNameDraft.trim()
    if (readOnly || !name) return
    const environment = { id: crypto.randomUUID(), name, variables: [] }
    onVariablesChange({ ...variables, environments: [...variables.environments, environment] })
    onActiveEnvironmentChange(environment.id)
    setEnvironmentNameDraft('')
  }

  function deleteEnvironment() {
    if (!selectedEnvironment || readOnly) return
    const remaining = variables.environments.filter((environment) => environment.id !== selectedEnvironment.id)
    onVariablesChange({ ...variables, environments: remaining })
    onActiveEnvironmentChange(remaining[0]?.id ?? null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="variables-dialog">
        <DialogHeader>
          <DialogTitle>Manage variables</DialogTitle>
          <DialogDescription>
            Use <code>{'{{variableName}}'}</code> in request URLs, params, headers, auth, or body.
          </DialogDescription>
        </DialogHeader>
        <p className="variable-policy">
          Regular values are shared in workspace commits. Mark credentials as Secret to keep their values on this device and out of cloud
          sync.
        </p>
        {!secureStorageAvailable && (
          <p className="variable-storage-warning" role="status">
            Secure storage is unavailable. Secret values will last only until the app closes.
          </p>
        )}
        <Tabs value={scope} onValueChange={setScope} className="variables-tabs">
          <TabsList aria-label="Variable scope">
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="environment">Environments</TabsTrigger>
          </TabsList>
          <TabsContent value="global" className="variables-pane">
            <p className="variable-scope-help">
              Global variables are available throughout this workspace. The active environment overrides a global variable with the same
              name.
            </p>
            <VariableRows rows={variables.globals} readOnly={readOnly} onChange={updateGlobalRows} />
          </TabsContent>
          <TabsContent value="environment" className="variables-pane">
            <section className="environment-list-section" aria-label="Environment list">
              <div className="environment-section-heading">
                <div>
                  <strong>Environment list</strong>
                  <span>Choose one to edit. Requests use the active environment.</span>
                </div>
                <span className="environment-total">{variables.environments.length} / 100</span>
              </div>
              <div className="environment-list" role="group" aria-label="Choose active environment">
                <button
                  type="button"
                  className={cn('environment-list-item', !selectedEnvironment && 'environment-list-item-active')}
                  aria-pressed={!selectedEnvironment}
                  onClick={() => onActiveEnvironmentChange(null)}
                >
                  <span className="environment-item-icon" aria-hidden="true">
                    ◎
                  </span>
                  <span className="environment-item-copy">
                    <strong>No active environment</strong>
                    <small>Requests use Global variables only</small>
                  </span>
                  {!selectedEnvironment && <span className="environment-active-badge">Active</span>}
                </button>
                {variables.environments.map((environment) => (
                  <button
                    type="button"
                    key={environment.id}
                    className={cn('environment-list-item', selectedEnvironment?.id === environment.id && 'environment-list-item-active')}
                    aria-pressed={selectedEnvironment?.id === environment.id}
                    onClick={() => onActiveEnvironmentChange(environment.id)}
                  >
                    <span className="environment-item-icon" aria-hidden="true">
                      ◉
                    </span>
                    <span className="environment-item-copy">
                      <strong>{environment.name}</strong>
                      <small>
                        {environment.variables.length} variable{environment.variables.length === 1 ? '' : 's'}
                      </small>
                    </span>
                    {selectedEnvironment?.id === environment.id && <span className="environment-active-badge">Active</span>}
                  </button>
                ))}
              </div>
            </section>
            <div className="environment-create-panel">
              <div className="environment-create-copy">
                <strong>Add environment</strong>
                <span>Create a separate set of values, such as Development or Staging.</span>
              </div>
              <form className="environment-create-form" onSubmit={createEnvironment}>
                <Input
                  aria-label="New environment name"
                  maxLength={100}
                  value={environmentNameDraft}
                  readOnly={readOnly}
                  onChange={(event) => setEnvironmentNameDraft(event.target.value)}
                  placeholder="e.g. Development"
                />
                <Button type="submit" size="sm" disabled={readOnly || variables.environments.length >= 100 || !environmentNameDraft.trim()}>
                  Add environment
                </Button>
              </form>
            </div>
            {selectedEnvironment ? (
              <>
                <div className="environment-name-row">
                  <label>
                    <span>Editing environment</span>
                    <Input
                      aria-label="Environment name"
                      maxLength={100}
                      value={selectedEnvironment.name}
                      readOnly={readOnly}
                      onChange={(event) => updateEnvironment({ name: event.target.value })}
                    />
                  </label>
                  <Button type="button" variant="ghost" size="sm" disabled={readOnly} onClick={deleteEnvironment}>
                    Delete environment
                  </Button>
                </div>
                <p className="variable-scope-help">Values in this environment replace matching Global values when it is active.</p>
                <VariableRows
                  rows={selectedEnvironment.variables}
                  readOnly={readOnly}
                  onChange={(rows) => updateEnvironment({ variables: rows })}
                />
              </>
            ) : (
              <p className="variable-empty environment-empty">
                {variables.environments.length
                  ? 'Select an environment above to view and edit its variables.'
                  : 'No environments yet. Add one above to create your first set of environment variables.'}
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
