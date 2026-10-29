import type { WorkspaceVariable } from '@/lib/workspace-variables'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

export function VariableRows({
  rows,
  readOnly,
  onChange,
}: {
  rows: WorkspaceVariable[]
  readOnly: boolean
  onChange: (rows: WorkspaceVariable[]) => void
}) {
  function update(id: string, patch: Partial<WorkspaceVariable>) {
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  return (
    <div className="variable-scope-body">
      <div className="variable-table" role="table" aria-label="Variables">
        <div className="variable-table-heading" role="row">
          <span role="columnheader">Name</span>
          <span role="columnheader">Value</span>
          <span role="columnheader">Secret</span>
          <span aria-hidden="true" />
        </div>
        {rows.map((row, index) => (
          <div className="variable-table-row" role="row" key={row.id}>
            <Input
              aria-label={`Variable name ${index + 1}`}
              maxLength={160}
              value={row.name}
              readOnly={readOnly}
              onChange={(event) => update(row.id, { name: event.target.value })}
              placeholder="e.g. baseUrl"
            />
            <Input
              aria-label={`Variable value ${index + 1}`}
              type={row.secret ? 'password' : 'text'}
              autoComplete="off"
              value={row.value}
              readOnly={readOnly && !row.secret}
              onChange={(event) => update(row.id, { value: event.target.value })}
              placeholder={row.secret ? 'Secret value stays local' : 'Value'}
            />
            <label className="variable-secret-toggle">
              <input
                type="checkbox"
                checked={row.secret}
                disabled={readOnly}
                onChange={(event) => update(row.id, { secret: event.target.checked })}
              />
              <span>Secret</span>
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="variable-remove"
              aria-label={`Delete variable ${row.name || index + 1}`}
              disabled={readOnly}
              onClick={() => onChange(rows.filter((item) => item.id !== row.id))}
            >
              ×
            </Button>
          </div>
        ))}
        {!rows.length && <p className="variable-empty">No variables yet.</p>}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="variable-add"
        disabled={readOnly || rows.length >= 500}
        onClick={() => onChange([...rows, { id: crypto.randomUUID(), name: '', value: '', secret: false }])}
      >
        Add variable
      </Button>
    </div>
  )
}
