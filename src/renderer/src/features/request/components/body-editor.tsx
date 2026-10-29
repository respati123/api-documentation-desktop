import { useState } from 'react'
import type { SavedRequest } from '@/features/workspace'
import { type BodyField, type BodyMode, bodyModes } from '@/lib/merge'
import { LabeledField } from '@/shared/components/labeled-field'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { VariableInput, type VariableSuggestion, VariableTextarea } from '@/shared/components/variable-field'
import { cn } from '@/shared/utils/cn'

export const bodyModeLabels: Record<BodyMode, string> = {
  'form-data': 'Form Data',
  urlencoded: 'Form URL Encoded',
  graphql: 'GraphQL',
  json: 'JSON',
  xml: 'XML',
  yaml: 'YAML',
  edn: 'EDN',
  text: 'Plain Text',
  other: 'Other',
  file: 'File',
  none: 'No Body',
}

export function BodyEditor({
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
  const [fileError, setFileError] = useState('')
  const mode = request.bodyMode ?? (request.body.trim() ? 'json' : 'none')
  const fields = request.bodyFields ?? []
  const updateField = (id: string, patch: Partial<BodyField>) =>
    onChange({ bodyFields: fields.map((field) => (field.id === id ? { ...field, ...patch } : field)) })

  async function chooseFile(onSelected: (file: { path: string; name: string }) => void) {
    setFileError('')
    try {
      const file = await window.apiDesktop.selectFile()
      if (file) onSelected(file)
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Could not select a file.')
    }
  }

  function addField() {
    onChange({ bodyFields: [...fields, { id: crypto.randomUUID(), name: '', value: '', enabled: true, type: 'text' }] })
  }

  const help =
    mode === 'form-data'
      ? 'Multipart encoding is generated automatically. File attachments stay on this device.'
      : mode === 'urlencoded'
        ? 'Enabled keys and values are URL encoded before sending.'
        : mode === 'graphql'
          ? 'The query and variables are sent as a JSON GraphQL request.'
          : mode === 'file'
            ? 'The selected file is sent as the raw request body.'
            : mode === 'none'
              ? 'This request will be sent without a body.'
              : `Content-Type: ${mode === 'other' ? request.bodyMimeType || 'text/plain' : bodyContentType(mode)}`

  return (
    <div className="body-composer">
      <div className="body-toolbar">
        <Select value={mode} onValueChange={(value) => onChange({ bodyMode: value as BodyMode })} disabled={readOnly}>
          <SelectTrigger aria-label="Body type" className="body-mode-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {bodyModes.map((item) => (
              <SelectItem key={item} value={item}>
                {bodyModeLabels[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="body-mode-help">{help}</span>
      </div>

      {(mode === 'form-data' || mode === 'urlencoded') && (
        <div className="body-fields">
          <div className={cn('body-fields-heading', mode === 'urlencoded' && 'body-fields-heading-urlencoded')}>
            <span aria-hidden="true" />
            <span>Key</span>
            {mode === 'form-data' && <span>Type</span>}
            <span>{mode === 'form-data' ? 'Value or file' : 'Value'}</span>
            <span aria-hidden="true" />
          </div>
          {fields.map((field, index) => (
            <div className={cn('body-field-row', mode === 'urlencoded' && 'body-field-row-urlencoded')} key={field.id}>
              <input
                aria-label={`Enable field ${index + 1}`}
                className="body-field-enabled"
                type="checkbox"
                checked={field.enabled}
                disabled={readOnly}
                onChange={(event) => updateField(field.id, { enabled: event.target.checked })}
              />
              <VariableInput
                aria-label={`Body key ${index + 1}`}
                value={field.name}
                suggestions={suggestions}
                onVariableClick={onVariableClick}
                readOnly={readOnly}
                placeholder="Key"
                onValueChange={(value) => updateField(field.id, { name: value })}
              />
              {mode === 'form-data' && (
                <Select
                  value={field.type}
                  onValueChange={(value) => updateField(field.id, { type: value as BodyField['type'] })}
                  disabled={readOnly}
                >
                  <SelectTrigger aria-label={`Field type ${index + 1}`} className="body-field-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="file">File</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {mode === 'form-data' && field.type === 'file' ? (
                <div className="body-file-control">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={readOnly}
                    onClick={() => void chooseFile((file) => updateField(field.id, { filePath: file.path, fileName: file.name }))}
                  >
                    Choose file
                  </Button>
                  <span title={field.filePath}>
                    {field.filePath
                      ? field.fileName || 'Selected file'
                      : field.fileName
                        ? `${field.fileName} · choose on this device`
                        : 'No file selected'}
                  </span>
                </div>
              ) : (
                <VariableInput
                  aria-label={`Body value ${index + 1}`}
                  value={field.value}
                  suggestions={suggestions}
                  onVariableClick={onVariableClick}
                  readOnly={readOnly}
                  placeholder="Value"
                  onValueChange={(value) => updateField(field.id, { value })}
                />
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="body-remove-field"
                disabled={readOnly}
                onClick={() => onChange({ bodyFields: fields.filter((item) => item.id !== field.id) })}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="body-add-field" disabled={readOnly} onClick={addField}>
            Add field
          </Button>
        </div>
      )}

      {mode === 'graphql' && (
        <div className="body-raw-fields">
          <label>
            <span>Query</span>
            <VariableTextarea
              className="code-field"
              aria-label="GraphQL query"
              value={request.body}
              suggestions={suggestions}
              onVariableClick={onVariableClick}
              readOnly={readOnly}
              onValueChange={(value) => onChange({ body: value })}
              placeholder="query { ... }"
            />
          </label>
          <label>
            <span>Variables (JSON)</span>
            <VariableTextarea
              className="code-field body-variables"
              aria-label="GraphQL variables"
              value={request.bodyVariables ?? '{}'}
              suggestions={suggestions}
              onVariableClick={onVariableClick}
              readOnly={readOnly}
              onValueChange={(value) => onChange({ bodyVariables: value })}
              placeholder="{}"
            />
          </label>
        </div>
      )}

      {['json', 'xml', 'yaml', 'edn', 'text', 'other'].includes(mode) && (
        <div className="body-raw-fields">
          {mode === 'other' && (
            <LabeledField className="body-mime-field" label="Content-Type">
              <VariableInput
                aria-label="Body content type"
                value={request.bodyMimeType ?? 'text/plain'}
                suggestions={suggestions}
                onVariableClick={onVariableClick}
                readOnly={readOnly}
                onValueChange={(value) => onChange({ bodyMimeType: value })}
                placeholder="application/octet-stream"
              />
            </LabeledField>
          )}
          <VariableTextarea
            className="code-field"
            aria-label={`${bodyModeLabels[mode]} request body`}
            value={request.body}
            suggestions={suggestions}
            onVariableClick={onVariableClick}
            readOnly={readOnly}
            onValueChange={(value) => onChange({ body: value })}
            placeholder={mode === 'json' ? '{\n  \n}' : `Enter ${bodyModeLabels[mode]} body`}
          />
        </div>
      )}

      {mode === 'file' && (
        <div className="body-file-picker">
          <Button
            type="button"
            variant="outline"
            disabled={readOnly}
            onClick={() => void chooseFile((file) => onChange({ bodyPath: file.path, bodyFileName: file.name }))}
          >
            Choose file
          </Button>
          <span title={request.bodyPath}>
            {request.bodyPath
              ? request.bodyFileName || 'Selected file'
              : request.bodyFileName
                ? `${request.bodyFileName} · choose on this device`
                : 'No file selected'}
          </span>
          <label>
            <span>Content-Type</span>
            <VariableInput
              aria-label="File content type"
              value={request.bodyMimeType ?? 'application/octet-stream'}
              suggestions={suggestions}
              onVariableClick={onVariableClick}
              readOnly={readOnly}
              onValueChange={(value) => onChange({ bodyMimeType: value })}
            />
          </label>
          <p className="body-local-file-note">
            The file stays on this device. Teammates need to select their own copy after pulling the request.
          </p>
        </div>
      )}

      {fileError && (
        <p className="body-file-error" role="alert">
          {fileError}
        </p>
      )}
    </div>
  )
}

export function bodyContentType(mode: BodyMode): string {
  switch (mode) {
    case 'graphql':
    case 'json':
      return 'application/json'
    case 'xml':
      return 'application/xml'
    case 'yaml':
      return 'application/yaml'
    case 'edn':
      return 'application/edn'
    default:
      return 'text/plain'
  }
}
