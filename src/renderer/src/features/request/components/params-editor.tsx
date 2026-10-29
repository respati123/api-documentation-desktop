import { useState } from 'react'
import type { SavedRequest } from '@/features/workspace'
import type { ParamField } from '@/lib/merge'
import { cn } from '@/shared/utils/cn'
import { DebouncedInput } from '@/shared/components/debounced-field'
import { KeyValueTable } from '@/shared/components/key-value-table'
import { Button } from '@/shared/components/ui/button'
import { VariableInput, type VariableSuggestion } from '@/shared/components/variable-field'

export function ParamsEditor({
  request,
  readOnly,
  suggestions,
  onVariableClick,
  onChange,
}: {
  request: SavedRequest
  readOnly: boolean
  suggestions: VariableSuggestion[]
  onVariableClick: (name: string, sourceValue: string) => void
  onChange: (patch: Partial<SavedRequest>) => void
}) {
  const params = request.params ?? []
  const [showDescriptions, setShowDescriptions] = useState(false)
  const updateParam = (id: string, patch: Partial<ParamField>) =>
    onChange({ params: params.map((param) => (param.id === id ? { ...param, ...patch } : param)) })
  const addParam = () => onChange({ params: [...params, { id: crypto.randomUUID(), name: '', value: '', enabled: true }] })

  return (
    <div className="params-editor">
      <div className="params-toolbar">
        <Button type="button" variant="ghost" size="sm" disabled={readOnly} onClick={addParam}>
          ＋ Add
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={readOnly || params.length === 0} onClick={() => onChange({ params: [] })}>
          Delete all
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={showDescriptions}
          onClick={() => setShowDescriptions((shown) => !shown)}
        >
          Description
        </Button>
        <span className="params-count">{params.length} params</span>
      </div>
      <KeyValueTable
        label="Query parameters"
        columns={[null, 'Parameter', 'Value', showDescriptions ? 'Description' : false]}
        rows={params}
        readOnly={readOnly}
        classNames={{
          table: 'params-table',
          heading: cn('params-heading', showDescriptions && 'params-heading-with-description'),
          entry: 'params-entry',
          row: cn('params-row', showDescriptions && 'params-row-with-description'),
          remove: 'param-remove',
        }}
        renderCells={(param, index) => (
          <>
            <input
              aria-label={`Enable parameter ${index + 1}`}
              className="param-enabled"
              type="checkbox"
              checked={param.enabled}
              disabled={readOnly}
              onChange={(event) => updateParam(param.id, { enabled: event.target.checked })}
            />
            <VariableInput
              aria-label={`Parameter name ${index + 1}`}
              value={param.name}
              suggestions={suggestions}
              onVariableClick={onVariableClick}
              readOnly={readOnly}
              placeholder="Parameter"
              onValueChange={(value) => updateParam(param.id, { name: value })}
            />
            <VariableInput
              aria-label={`Parameter value ${index + 1}`}
              value={param.value}
              suggestions={suggestions}
              onVariableClick={onVariableClick}
              readOnly={readOnly}
              placeholder="Value"
              onValueChange={(value) => updateParam(param.id, { value })}
            />
            {showDescriptions && (
              <DebouncedInput
                aria-label={`Description for parameter ${index + 1}`}
                value={param.description ?? ''}
                readOnly={readOnly}
                placeholder="Description"
                onValueChange={(value) => updateParam(param.id, { description: value })}
              />
            )}
          </>
        )}
        removeLabel={(_param, index) => `Delete parameter ${index + 1}`}
        onRemove={(param) => onChange({ params: params.filter((item) => item.id !== param.id) })}
      />
    </div>
  )
}
