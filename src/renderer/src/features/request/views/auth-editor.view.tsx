import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEST_IDS } from '@/features/request/constants/request-test-ids.constants'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import type { useAuthEditorViewModel } from '@/features/request/viewmodels/use-auth-editor.viewmodel'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { VariableInput } from '@/shared/components/variable-field'

// Matches the auth field captions in styles.css: 12px, semibold, slate-700, normal line height.
const authLabelClass = 'text-[12px] font-semibold leading-normal text-slate-700'

export type AuthEditorViewProps = ReturnType<typeof useAuthEditorViewModel>

export function AuthEditorView({
  readOnly,
  suggestions,
  onVariableClick,
  type,
  typeOptions,
  bearer,
  basic,
  apiKey,
  helpText,
  onTypeChange,
  onTokenChange,
  onUsernameChange,
  onPasswordChange,
  onKeyNameChange,
  onKeyValueChange,
  onLocationChange,
}: AuthEditorViewProps): ReactElement {
  const { t } = useTranslation('request')

  return (
    <div className="auth-editor" data-testid={REQUEST_TEST_IDS.auth.container}>
      <div className="auth-type-label">
        <Label className={authLabelClass} htmlFor="request-auth-type">
          {t(REQUEST_TEXT.auth.typeLabel)}
        </Label>
        <Select value={type} onValueChange={onTypeChange} disabled={readOnly}>
          <SelectTrigger
            id="request-auth-type"
            data-testid={REQUEST_TEST_IDS.auth.type}
            aria-label={t(REQUEST_TEXT.auth.typeLabel)}
            className="auth-type-select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {bearer && (
        <div className="auth-field">
          <Label className={authLabelClass} htmlFor="request-auth-token">
            {t(REQUEST_TEXT.auth.token)}
          </Label>
          <VariableInput
            id="request-auth-token"
            data-testid={REQUEST_TEST_IDS.auth.token}
            aria-label={t(REQUEST_TEXT.auth.tokenAria)}
            type="password"
            autoComplete="off"
            value={bearer.token}
            suggestions={suggestions}
            onVariableClick={onVariableClick}
            readOnly={readOnly}
            onValueChange={onTokenChange}
            placeholder={t(REQUEST_TEXT.auth.tokenPlaceholder)}
          />
        </div>
      )}
      {basic && (
        <div className="auth-field-grid">
          <div className="auth-field">
            <Label className={authLabelClass} htmlFor="request-auth-username">
              {t(REQUEST_TEXT.auth.username)}
            </Label>
            <VariableInput
              id="request-auth-username"
              data-testid={REQUEST_TEST_IDS.auth.username}
              aria-label={t(REQUEST_TEXT.auth.usernameAria)}
              autoComplete="off"
              value={basic.username}
              suggestions={suggestions}
              onVariableClick={onVariableClick}
              readOnly={readOnly}
              onValueChange={onUsernameChange}
              placeholder={t(REQUEST_TEXT.auth.usernamePlaceholder)}
            />
          </div>
          <div className="auth-field">
            <Label className={authLabelClass} htmlFor="request-auth-password">
              {t(REQUEST_TEXT.auth.password)}
            </Label>
            <VariableInput
              id="request-auth-password"
              data-testid={REQUEST_TEST_IDS.auth.password}
              aria-label={t(REQUEST_TEXT.auth.passwordAria)}
              type="password"
              autoComplete="new-password"
              value={basic.password}
              suggestions={suggestions}
              onVariableClick={onVariableClick}
              readOnly={readOnly}
              onValueChange={onPasswordChange}
              placeholder={t(REQUEST_TEXT.auth.passwordPlaceholder)}
            />
          </div>
        </div>
      )}
      {apiKey && (
        <div className="auth-field-grid">
          <div className="auth-field">
            <Label className={authLabelClass} htmlFor="request-auth-key-name">
              {t(REQUEST_TEXT.auth.key)}
            </Label>
            <VariableInput
              id="request-auth-key-name"
              data-testid={REQUEST_TEST_IDS.auth.keyName}
              aria-label={t(REQUEST_TEXT.auth.keyAria)}
              autoComplete="off"
              value={apiKey.name}
              suggestions={suggestions}
              onVariableClick={onVariableClick}
              readOnly={readOnly}
              onValueChange={onKeyNameChange}
              placeholder={t(REQUEST_TEXT.auth.keyPlaceholder)}
            />
          </div>
          <div className="auth-field">
            <Label className={authLabelClass} htmlFor="request-auth-key-value">
              {t(REQUEST_TEXT.auth.value)}
            </Label>
            <VariableInput
              id="request-auth-key-value"
              data-testid={REQUEST_TEST_IDS.auth.keyValue}
              aria-label={t(REQUEST_TEXT.auth.valueAria)}
              type="password"
              autoComplete="off"
              value={apiKey.value}
              suggestions={suggestions}
              onVariableClick={onVariableClick}
              readOnly={readOnly}
              onValueChange={onKeyValueChange}
              placeholder={t(REQUEST_TEXT.auth.valuePlaceholder)}
            />
          </div>
          <div className="auth-field">
            <Label className={authLabelClass} htmlFor="request-auth-location">
              {t(REQUEST_TEXT.auth.addTo)}
            </Label>
            <Select value={apiKey.location} onValueChange={onLocationChange} disabled={readOnly}>
              <SelectTrigger
                id="request-auth-location"
                data-testid={REQUEST_TEST_IDS.auth.location}
                aria-label={t(REQUEST_TEXT.auth.locationAria)}
                className="auth-location-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="header">{t(REQUEST_TEXT.auth.locationHeader)}</SelectItem>
                <SelectItem value="query">{t(REQUEST_TEXT.auth.locationQuery)}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      <p className="auth-help" data-testid={REQUEST_TEST_IDS.auth.help}>
        {helpText}
      </p>
    </div>
  )
}
