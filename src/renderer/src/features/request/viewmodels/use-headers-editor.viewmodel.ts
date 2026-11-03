import { type DragEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import { effectiveBodyMode } from '@/features/request/lib/body-mode'
import { generatedHeaders, hasCustomContentType } from '@/features/request/lib/generated-headers'
import type { EditorInput } from '@/features/request/viewmodels/editor.types'
import type { HeaderField } from '@/shared/models/api-node.model'

// Owns the headers tab: custom rows, drag-to-reorder, and the read-only list of headers the app adds.
export function useHeadersEditorViewModel({ request, readOnly, suggestions, onVariableClick, onChange }: EditorInput) {
  const { t } = useTranslation('request')
  const headers = request.headers ?? []
  const [showDescriptions, setShowDescriptions] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const update = (id: string, patch: Partial<HeaderField>) =>
    onChange({ headers: headers.map((header) => (header.id === id ? { ...header, ...patch } : header)) })

  function moveTo(targetId: string) {
    if (!draggedId || draggedId === targetId) return
    const reordered = [...headers]
    const sourceIndex = reordered.findIndex((header) => header.id === draggedId)
    const targetIndex = reordered.findIndex((header) => header.id === targetId)
    if (sourceIndex < 0 || targetIndex < 0) return
    const [moved] = reordered.splice(sourceIndex, 1)
    reordered.splice(targetIndex, 0, moved)
    onChange({ headers: reordered })
    setDraggedId(null)
  }

  const mode = effectiveBodyMode(request)

  return {
    readOnly,
    suggestions,
    onVariableClick,
    showDescriptions,
    countText: t(REQUEST_TEXT.headers.count, { count: headers.length }),
    canDeleteAll: !readOnly && headers.length > 0,
    rows: headers.map((header, index) => ({
      id: header.id,
      name: header.name,
      value: header.value,
      description: header.description ?? '',
      enabled: header.enabled,
      reorderLabel: t(REQUEST_TEXT.headers.reorderLabel, { position: index + 1 }),
      enableLabel: t(REQUEST_TEXT.headers.enableLabel, { position: index + 1 }),
      nameLabel: t(REQUEST_TEXT.headers.nameLabel, { position: index + 1 }),
      valueLabel: t(REQUEST_TEXT.headers.valueLabel, { position: index + 1 }),
      descriptionLabel: t(REQUEST_TEXT.headers.descriptionLabel, { position: index + 1 }),
      removeLabel: t(REQUEST_TEXT.headers.removeLabel, { position: index + 1 }),
    })),
    generated: generatedHeaders(request, {
      hostValue: t(REQUEST_TEXT.headers.hostValue),
      multipartBoundary: t(REQUEST_TEXT.headers.multipartBoundary),
      basicValue: t(REQUEST_TEXT.headers.basicValue),
    }).map((header) => ({ ...header, enabledLabel: t(REQUEST_TEXT.headers.generatedEnabled, { name: header.name }) })),
    helpText:
      mode === 'form-data'
        ? t(REQUEST_TEXT.headers.helpFormData)
        : hasCustomContentType(request)
          ? t(REQUEST_TEXT.headers.helpCustomContentType)
          : '',
    onAdd: () => onChange({ headers: [...headers, { id: crypto.randomUUID(), name: '', value: '', enabled: true }] }),
    onDeleteAll: () => onChange({ headers: [] }),
    onToggleDescriptions: () => setShowDescriptions((shown) => !shown),
    onEnabledChange: (id: string, checked: boolean | 'indeterminate') => update(id, { enabled: checked === true }),
    onNameChange: (id: string, name: string) => update(id, { name }),
    onValueChange: (id: string, value: string) => update(id, { value }),
    onDescriptionChange: (id: string, description: string) => update(id, { description }),
    onRemove: (id: string) => onChange({ headers: headers.filter((header) => header.id !== id) }),
    onDragStart: (id: string, event: DragEvent) => {
      setDraggedId(id)
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', id)
    },
    onDragEnd: () => setDraggedId(null),
    onDragOver: (event: DragEvent) => {
      if (draggedId) event.preventDefault()
    },
    onDrop: (id: string, event: DragEvent) => {
      event.preventDefault()
      moveTo(id)
    },
  }
}
