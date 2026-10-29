import type { WorkspaceVariable } from '@/lib/workspace-variables'
import { KeyValueTable } from '@/shared/components/key-value-table'
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
      <KeyValueTable
        label="Variables"
        columns={['Name', 'Value', 'Secret']}
        rows={rows}
        readOnly={readOnly}
        classNames={{ table: 'variable-table', heading: 'variable-table-heading', row: 'variable-table-row', remove: 'variable-remove' }}
        renderCells={(row, index) => (
          <>
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
          </>
        )}
        removeLabel={(row, index) => `Delete variable ${row.name || index + 1}`}
        onRemove={(row) => onChange(rows.filter((item) => item.id !== row.id))}
        empty={!rows.length && <p className="variable-empty">No variables yet.</p>}
      />
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
