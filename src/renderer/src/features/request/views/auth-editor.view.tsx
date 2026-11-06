import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEST_IDS } from '@/features/request/constants/request-test-ids.constants'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import type { useAuthEditorViewModel } from '@/features/request/viewmodels/use-auth-editor.viewmodel'
import { VariableInput } from '@/shared/components/variable-field'
import { Label, SegmentedControl, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui'

const fieldClass = 'grid min-w-0 gap-1.5'
const fieldGridClass = 'grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4'

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
    <div className="grid min-w-0 content-start gap-4" data-testid={REQUEST_TEST_IDS.auth.container}>
      <div>
        <SegmentedControl
          label={t(REQUEST_TEXT.auth.typeLabel)}
          options={typeOptions}
          value={type}
          disabled={readOnly}
          testId={REQUEST_TEST_IDS.auth.type}
          onChange={onTypeChange}
        />
      </div>
      {bearer && (
        <div className={fieldClass}>
          <Label htmlFor="request-auth-token">{t(REQUEST_TEXT.auth.token)}</Label>
          <VariableInput
            id="request-auth-token"
            mono
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
        <div className={fieldGridClass}>
          <div className={fieldClass}>
            <Label htmlFor="request-auth-username">{t(REQUEST_TEXT.auth.username)}</Label>
            <VariableInput
              id="request-auth-username"
              mono
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
          <div className={fieldClass}>
            <Label htmlFor="request-auth-password">{t(REQUEST_TEXT.auth.password)}</Label>
            <VariableInput
              id="request-auth-password"
              mono
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
        <div className={fieldGridClass}>
          <div className={fieldClass}>
            <Label htmlFor="request-auth-key-name">{t(REQUEST_TEXT.auth.key)}</Label>
            <VariableInput
              id="request-auth-key-name"
              mono
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
          <div className={fieldClass}>
            <Label htmlFor="request-auth-key-value">{t(REQUEST_TEXT.auth.value)}</Label>
            <VariableInput
              id="request-auth-key-value"
              mono
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
          <div className={fieldClass}>
            <Label htmlFor="request-auth-location">{t(REQUEST_TEXT.auth.addTo)}</Label>
            <Select value={apiKey.location} onValueChange={onLocationChange} disabled={readOnly}>
              <SelectTrigger
                id="request-auth-location"
                data-testid={REQUEST_TEST_IDS.auth.location}
                aria-label={t(REQUEST_TEXT.auth.locationAria)}
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
      <p className="max-w-[62ch] text-[12px] leading-5 text-muted-foreground" data-testid={REQUEST_TEST_IDS.auth.help}>
        {helpText}
      </p>
    </div>
  )
}
