import { useMutation } from '@tanstack/react-query'
import type { ClipboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import { bodyContentType } from '@/features/request/lib/body-content-type'
import { effectiveBodyMode } from '@/features/request/lib/body-mode'
import { checkJsonBody, formatPastedJson } from '@/features/request/lib/json-body'
import type { PickedFile } from '@/features/request/models/request.model'
import { requestService } from '@/features/request/services/request.service'
import type { EditorInput } from '@/features/request/viewmodels/editor.types'
import { BODY_MODE_TEXT } from '@/shared/constants/body-mode-text.constants'
import { type BodyField, bodyFieldSchema, bodyModeSchema, bodyModes } from '@/shared/models/api-node.model'

const rawModes = ['json', 'xml', 'yaml', 'edn', 'text', 'other']

// Owns the body tab: the body type, the form fields, the raw editors, and the file picker.
export function useBodyEditorViewModel({ request, readOnly, suggestions, onVariableClick, onChange }: EditorInput) {
  const { t } = useTranslation('request')
  const mode = effectiveBodyMode(request)
  const fields = request.bodyFields ?? []
  const pickFile = useMutation({ mutationFn: requestService.selectFile })

  const updateField = (id: string, patch: Partial<BodyField>) =>
    onChange({ bodyFields: fields.map((field) => (field.id === id ? { ...field, ...patch } : field)) })

  function choose(onSelected: (file: PickedFile) => void) {
    pickFile.mutate(undefined, {
      onSuccess: (file) => {
        if (file) onSelected(file)
      },
    })
  }

  function describeFile(path: string | undefined, name: string | undefined): string {
    if (path) return name || t(REQUEST_TEXT.body.selectedFile)
    return name ? t(REQUEST_TEXT.body.chooseOnDevice, { name }) : t(REQUEST_TEXT.body.noFile)
  }

  const modeLabel = t(BODY_MODE_TEXT[mode], { ns: 'common' })
  const helpByMode: Record<string, string> = {
    'form-data': t(REQUEST_TEXT.body.helpFormData),
    urlencoded: t(REQUEST_TEXT.body.helpUrlencoded),
    graphql: t(REQUEST_TEXT.body.helpGraphql),
    file: t(REQUEST_TEXT.body.helpFile),
    none: t(REQUEST_TEXT.body.helpNone),
  }
  const contentType = mode === 'other' ? request.bodyMimeType || 'text/plain' : bodyContentType(mode)
  const isJson = mode === 'json'
  const jsonCheck = isJson ? checkJsonBody(request.body ?? '') : null
  const jsonMessage =
    jsonCheck?.status === 'valid'
      ? t(REQUEST_TEXT.body.jsonValid)
      : jsonCheck?.status === 'invalid'
        ? t(REQUEST_TEXT.body.jsonInvalid, { line: jsonCheck.line, column: jsonCheck.column })
        : null

  return {
    readOnly,
    suggestions,
    onVariableClick,
    mode,
    modeOptions: bodyModes.map((value) => ({ value, label: t(BODY_MODE_TEXT[value], { ns: 'common' }) })),
    helpText: helpByMode[mode] ?? t(REQUEST_TEXT.body.helpContentType, { type: contentType }),
    isFields: mode === 'form-data' || mode === 'urlencoded',
    isFormData: mode === 'form-data',
    isGraphql: mode === 'graphql',
    isRaw: rawModes.includes(mode),
    isOther: mode === 'other',
    isFile: mode === 'file',
    isJson,
    jsonInvalid: jsonCheck?.status === 'invalid',
    jsonMessage,
    formatJsonDisabled: jsonCheck?.status !== 'valid',
    onFormatJson: () => {
      if (jsonCheck?.status === 'valid') onChange({ body: jsonCheck.formatted })
    },
    // Object-style text pasted into the JSON editor is rewritten and formatted in place. Anything else pastes as usual.
    onRawPaste: (event: ClipboardEvent<HTMLTextAreaElement>) => {
      if (!isJson || readOnly) return
      const target = event.currentTarget
      const pasted = event.clipboardData.getData('text')
      const next = target.value.slice(0, target.selectionStart) + pasted + target.value.slice(target.selectionEnd)
      const formatted = formatPastedJson(next)
      if (formatted === null) return
      event.preventDefault()
      onChange({ body: formatted })
    },
    // The editor flushes its draft before blur, so the text is read from the element, not from the request.
    onRawBlur: (text: string) => {
      if (!isJson) return
      const check = checkJsonBody(text)
      if (check.status === 'valid' && check.formatted !== text) onChange({ body: check.formatted })
    },
    rows: fields.map((field, index) => ({
      id: field.id,
      name: field.name,
      value: field.value,
      enabled: field.enabled,
      type: field.type,
      isFile: field.type === 'file',
      filePath: field.filePath ?? '',
      fileText: describeFile(field.filePath, field.fileName),
      enableLabel: t(REQUEST_TEXT.body.enableLabel, { position: index + 1 }),
      keyLabel: t(REQUEST_TEXT.body.keyLabel, { position: index + 1 }),
      typeLabel: t(REQUEST_TEXT.body.typeLabelField, { position: index + 1 }),
      valueLabel: t(REQUEST_TEXT.body.valueLabel, { position: index + 1 }),
    })),
    query: request.body,
    variables: request.bodyVariables ?? '{}',
    // A JSON literal, not prose, so it is not translated.
    variablesPlaceholder: '{}',
    rawValue: request.body,
    rawAriaLabel: t(REQUEST_TEXT.body.rawAria, { mode: modeLabel }),
    rawPlaceholder: mode === 'json' ? t(REQUEST_TEXT.body.rawPlaceholderJson) : t(REQUEST_TEXT.body.rawPlaceholder, { mode: modeLabel }),
    otherContentType: request.bodyMimeType ?? 'text/plain',
    fileContentType: request.bodyMimeType ?? 'application/octet-stream',
    filePath: request.bodyPath ?? '',
    fileText: describeFile(request.bodyPath, request.bodyFileName),
    errorMessage: pickFile.error ? pickFile.error.message || t(REQUEST_TEXT.body.fileErrorFallback) : null,
    onModeChange: (value: string) => {
      const parsed = bodyModeSchema.safeParse(value)
      if (parsed.success) onChange({ bodyMode: parsed.data })
    },
    onAddField: () => onChange({ bodyFields: [...fields, { id: crypto.randomUUID(), name: '', value: '', enabled: true, type: 'text' }] }),
    onRemoveField: (id: string) => onChange({ bodyFields: fields.filter((field) => field.id !== id) }),
    onEnabledChange: (id: string, checked: boolean | 'indeterminate') => updateField(id, { enabled: checked === true }),
    onKeyChange: (id: string, name: string) => updateField(id, { name }),
    onValueChange: (id: string, value: string) => updateField(id, { value }),
    onFieldTypeChange: (id: string, value: string) => {
      const parsed = bodyFieldSchema.shape.type.safeParse(value)
      if (parsed.success) updateField(id, { type: parsed.data })
    },
    onChooseFieldFile: (id: string) => choose((file) => updateField(id, { filePath: file.path, fileName: file.name })),
    onChooseBodyFile: () => choose((file) => onChange({ bodyPath: file.path, bodyFileName: file.name })),
    onQueryChange: (body: string) => onChange({ body }),
    onVariablesChange: (bodyVariables: string) => onChange({ bodyVariables }),
    onRawChange: (body: string) => onChange({ body }),
    onContentTypeChange: (bodyMimeType: string) => onChange({ bodyMimeType }),
  }
}
