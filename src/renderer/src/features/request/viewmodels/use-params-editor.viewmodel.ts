import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import type { EditorInput } from '@/features/request/viewmodels/editor.types'
import type { ParamField } from '@/shared/models/api-node.model'

// Owns the query parameters tab: the rows, the description column toggle, and every change to the request.
export function useParamsEditorViewModel({ request, readOnly, suggestions, onVariableClick, onChange }: EditorInput) {
  const { t } = useTranslation('request')
  const params = request.params ?? []
  const [showDescriptions, setShowDescriptions] = useState(false)

  const update = (id: string, patch: Partial<ParamField>) =>
    onChange({ params: params.map((param) => (param.id === id ? { ...param, ...patch } : param)) })

  return {
    readOnly,
    suggestions,
    onVariableClick,
    showDescriptions,
    countText: t(REQUEST_TEXT.params.count, { count: params.length }),
    canDeleteAll: !readOnly && params.length > 0,
    rows: params.map((param, index) => ({
      id: param.id,
      name: param.name,
      value: param.value,
      description: param.description ?? '',
      enabled: param.enabled,
      enableLabel: t(REQUEST_TEXT.params.enableLabel, { position: index + 1 }),
      nameLabel: t(REQUEST_TEXT.params.nameLabel, { position: index + 1 }),
      valueLabel: t(REQUEST_TEXT.params.valueLabel, { position: index + 1 }),
      descriptionLabel: t(REQUEST_TEXT.params.descriptionLabel, { position: index + 1 }),
      removeLabel: t(REQUEST_TEXT.params.removeLabel, { position: index + 1 }),
    })),
    onAdd: () => onChange({ params: [...params, { id: crypto.randomUUID(), name: '', value: '', enabled: true }] }),
    onDeleteAll: () => onChange({ params: [] }),
    onToggleDescriptions: () => setShowDescriptions((shown) => !shown),
    onEnabledChange: (id: string, checked: boolean | 'indeterminate') => update(id, { enabled: checked === true }),
    onNameChange: (id: string, name: string) => update(id, { name }),
    onValueChange: (id: string, value: string) => update(id, { value }),
    onDescriptionChange: (id: string, description: string) => update(id, { description }),
    onRemove: (id: string) => onChange({ params: params.filter((param) => param.id !== id) }),
  }
}
