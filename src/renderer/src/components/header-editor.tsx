import { memo, useState } from 'react'
import { DebouncedInput } from '@/components/debounced-field'
import { Button } from '@/components/ui/button'
import { VariableInput, type VariableSuggestion } from '@/components/variable-field'
import type { HeaderField } from '@/lib/merge'
import type { SavedRequest } from '@/models/workspace.model'

export type HeaderEditorProps = {
  request: SavedRequest
  readOnly: boolean
  suggestions: VariableSuggestion[]
  onVariableClick: (name: string, sourceValue: string) => void
  onChange: (patch: Partial<SavedRequest>) => void
}

export function HeaderEditorView({ request, readOnly, suggestions, onVariableClick, onChange }: HeaderEditorProps) {
  const headers = request.headers ?? []
  const [showDescriptions, setShowDescriptions] = useState(false)
  const [draggedHeaderId, setDraggedHeaderId] = useState<string | null>(null)
  const updateHeader = (id: string, patch: Partial<HeaderField>) =>
    onChange({ headers: headers.map((header) => (header.id === id ? { ...header, ...patch } : header)) })
  const addHeader = () => onChange({ headers: [...headers, { id: crypto.randomUUID(), name: '', value: '', enabled: true }] })
  const removeHeader = (id: string) => onChange({ headers: headers.filter((header) => header.id !== id) })
  const moveHeader = (targetId: string) => {
    if (!draggedHeaderId || draggedHeaderId === targetId) return
    const reordered = [...headers]
    const sourceIndex = reordered.findIndex((header) => header.id === draggedHeaderId)
    const targetIndex = reordered.findIndex((header) => header.id === targetId)
    if (sourceIndex < 0 || targetIndex < 0) return
    const [header] = reordered.splice(sourceIndex, 1)
    reordered.splice(targetIndex, 0, header)
    onChange({ headers: reordered })
    setDraggedHeaderId(null)
  }
  const enabledHeader = (name: string) =>
    headers.find((header) => header.enabled && header.name.trim().toLowerCase() === name.toLowerCase())
  const mode = request.bodyMode ?? (request.body.trim() ? 'json' : 'none')
  const generated: Array<{ name: string; value: string }> = []
  const customAccept = enabledHeader('Accept')
  const customHost = enabledHeader('Host')
  const customAgent = enabledHeader('User-Agent')
  const customContentType = enabledHeader('Content-Type')

  if (!customAccept) generated.push({ name: 'Accept', value: '*/*' })
  if (!customHost) generated.push({ name: 'Host', value: '<calculated at runtime>' })
  if (!customAgent) generated.push({ name: 'User-Agent', value: 'API-Documentation/0.1.0' })
  if (mode !== 'none') {
    const canSendBody = !['GET', 'HEAD'].includes(request.method.toUpperCase())
    const contentType =
      mode === 'form-data'
        ? canSendBody
          ? 'multipart/form-data; boundary=<generated at send time>'
          : 'multipart/form-data'
        : mode === 'urlencoded'
          ? 'application/x-www-form-urlencoded;charset=UTF-8'
          : mode === 'file'
            ? request.bodyMimeType || 'application/octet-stream'
            : mode === 'other'
              ? request.bodyMimeType || 'text/plain'
              : mode === 'graphql' || mode === 'json'
                ? 'application/json'
                : mode === 'xml'
                  ? 'application/xml'
                  : mode === 'yaml'
                    ? 'application/yaml'
                    : mode === 'edn'
                      ? 'application/edn'
                      : 'text/plain'
    if (!customContentType || mode === 'form-data')
      generated.push({
        name: 'Content-Type',
        value: mode === 'form-data' ? contentType : customContentType ? customContentType.value : contentType,
      })
  }
  const auth = request.auth ?? { type: 'none' as const }
  if (auth.type === 'bearer' && auth.token)
    generated.push({ name: 'Authorization', value: `Bearer ${'•'.repeat(Math.min(auth.token.length, 12))}` })
  if (auth.type === 'basic' && (auth.username || auth.password))
    generated.push({ name: 'Authorization', value: 'Basic <generated from credentials>' })
  if (auth.type === 'api-key' && auth.location === 'header' && auth.name && auth.value)
    generated.push({ name: auth.name, value: '•'.repeat(Math.min(auth.value.length, 12)) })

  return (
    <div className="headers-editor">
      <div className="headers-toolbar">
        <Button type="button" variant="ghost" size="sm" disabled={readOnly} onClick={addHeader}>
          ＋ Add
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={readOnly || headers.length === 0}
          onClick={() => onChange({ headers: [] })}
        >
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
        <span className="headers-count">{headers.length} custom</span>
      </div>
      <div className="headers-table" role="table" aria-label="Request headers">
        <div className="headers-heading" role="row">
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span role="columnheader">Header</span>
          <span role="columnheader">Value</span>
          <span aria-hidden="true" />
        </div>
        {headers.map((header, index) => (
          <div
            className="headers-entry"
            key={header.id}
            onDragOver={(event) => {
              if (draggedHeaderId) event.preventDefault()
            }}
            onDrop={(event) => {
              event.preventDefault()
              moveHeader(header.id)
            }}
          >
            <div className="headers-row" role="row">
              <button
                type="button"
                className="header-drag-handle"
                draggable={!readOnly}
                aria-label={`Reorder header ${index + 1}`}
                onDragStart={(event) => {
                  setDraggedHeaderId(header.id)
                  event.dataTransfer.effectAllowed = 'move'
                  event.dataTransfer.setData('text/plain', header.id)
                }}
                onDragEnd={() => setDraggedHeaderId(null)}
                disabled={readOnly}
              >
                ⠿
              </button>
              <input
                aria-label={`Enable header ${index + 1}`}
                className="header-enabled"
                type="checkbox"
                checked={header.enabled}
                disabled={readOnly}
                onChange={(event) => updateHeader(header.id, { enabled: event.target.checked })}
              />
              <VariableInput
                aria-label={`Header name ${index + 1}`}
                value={header.name}
                suggestions={suggestions}
                onVariableClick={onVariableClick}
                readOnly={readOnly}
                placeholder="Header"
                onValueChange={(value) => updateHeader(header.id, { name: value })}
              />
              <VariableInput
                aria-label={`Header value ${index + 1}`}
                value={header.value}
                suggestions={suggestions}
                onVariableClick={onVariableClick}
                readOnly={readOnly}
                placeholder="Value"
                onValueChange={(value) => updateHeader(header.id, { value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="header-remove"
                aria-label={`Delete header ${index + 1}`}
                disabled={readOnly}
                onClick={() => removeHeader(header.id)}
              >
                ×
              </Button>
            </div>
            {showDescriptions && (
              <DebouncedInput
                className="header-description"
                aria-label={`Description for header ${index + 1}`}
                value={header.description ?? ''}
                readOnly={readOnly}
                placeholder="Description"
                onValueChange={(value) => updateHeader(header.id, { description: value })}
              />
            )}
          </div>
        ))}
        <div className="headers-generated-label">Generated at send time</div>
        {generated.map((header) => (
          <div className="headers-generated-row" role="row" key={header.name}>
            <span aria-hidden="true" />
            <input className="header-enabled" type="checkbox" checked disabled aria-label={`${header.name} is generated`} />
            <span className="header-generated-name">{header.name}</span>
            <span className="header-generated-value">{header.value}</span>
            <span className="header-generated-status">Auto</span>
          </div>
        ))}
      </div>
      {mode === 'form-data' && (
        <p className="headers-help">Multipart Content-Type includes a boundary generated when the request is sent.</p>
      )}
      {customContentType && mode !== 'form-data' && (
        <p className="headers-help">This custom Content-Type overrides the value inferred from the body type.</p>
      )}
    </div>
  )
}

export const HeaderEditor = memo(
  HeaderEditorView,
  (previous, next) =>
    previous.request.id === next.request.id &&
    previous.request.headers === next.request.headers &&
    previous.request.bodyMode === next.request.bodyMode &&
    previous.request.body === next.request.body &&
    previous.request.bodyMimeType === next.request.bodyMimeType &&
    previous.request.method === next.request.method &&
    previous.request.auth === next.request.auth &&
    previous.readOnly === next.readOnly &&
    previous.suggestions === next.suggestions,
)
