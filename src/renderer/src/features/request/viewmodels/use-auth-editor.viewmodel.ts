import { useTranslation } from 'react-i18next'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import { apiKeyLocationSchema, authTypeSchema } from '@/features/request/models/request.model'
import type { EditorInput } from '@/features/request/viewmodels/editor.types'

// Owns the authorization tab. Each handler edits one credential field of the current auth type.
export function useAuthEditorViewModel({ request, readOnly, suggestions, onVariableClick, onChange }: EditorInput) {
  const { t } = useTranslation('request')
  const auth = request.auth ?? { type: 'none' as const }

  return {
    readOnly,
    suggestions,
    onVariableClick,
    type: auth.type,
    typeOptions: [
      { value: 'none', label: t(REQUEST_TEXT.auth.none) },
      { value: 'api-key', label: t(REQUEST_TEXT.auth.apiKey) },
      { value: 'basic', label: t(REQUEST_TEXT.auth.basic) },
      { value: 'bearer', label: t(REQUEST_TEXT.auth.bearer) },
    ],
    bearer: auth.type === 'bearer' ? { token: auth.token } : null,
    basic: auth.type === 'basic' ? { username: auth.username, password: auth.password } : null,
    apiKey: auth.type === 'api-key' ? { name: auth.name, value: auth.value, location: auth.location } : null,
    helpText: auth.type === 'none' ? t(REQUEST_TEXT.auth.helpNone) : t(REQUEST_TEXT.auth.helpCredentials),
    onTypeChange: (value: string) => {
      const parsed = authTypeSchema.safeParse(value)
      if (!parsed.success) return
      if (parsed.data === 'bearer') onChange({ auth: { type: 'bearer', token: '' } })
      else if (parsed.data === 'basic') onChange({ auth: { type: 'basic', username: '', password: '' } })
      else if (parsed.data === 'api-key') onChange({ auth: { type: 'api-key', name: '', value: '', location: 'header' } })
      else onChange({ auth: { type: 'none' } })
    },
    onTokenChange: (token: string) => {
      if (auth.type === 'bearer') onChange({ auth: { ...auth, token } })
    },
    onUsernameChange: (username: string) => {
      if (auth.type === 'basic') onChange({ auth: { ...auth, username } })
    },
    onPasswordChange: (password: string) => {
      if (auth.type === 'basic') onChange({ auth: { ...auth, password } })
    },
    onKeyNameChange: (name: string) => {
      if (auth.type === 'api-key') onChange({ auth: { ...auth, name } })
    },
    onKeyValueChange: (value: string) => {
      if (auth.type === 'api-key') onChange({ auth: { ...auth, value } })
    },
    onLocationChange: (value: string) => {
      const parsed = apiKeyLocationSchema.safeParse(value)
      if (auth.type === 'api-key' && parsed.success) onChange({ auth: { ...auth, location: parsed.data } })
    },
  }
}
