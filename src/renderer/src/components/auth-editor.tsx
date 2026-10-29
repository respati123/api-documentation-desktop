import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { VariableInput, type VariableSuggestion } from '@/components/variable-field'
import type { RequestAuth } from '@/lib/merge'
import type { SavedRequest } from '@/models/workspace.model'

export function AuthEditor({
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
  const auth = request.auth ?? { type: 'none' as const }
  const setAuthType = (type: string) => {
    if (type === 'bearer') onChange({ auth: { type, token: '' } })
    else if (type === 'basic') onChange({ auth: { type, username: '', password: '' } })
    else if (type === 'api-key') onChange({ auth: { type, name: '', value: '', location: 'header' } })
    else onChange({ auth: { type: 'none' } })
  }
  const updateAuth = (patch: Partial<Extract<RequestAuth, { type: 'bearer' | 'basic' | 'api-key' }>>) => {
    if (auth.type !== 'none') onChange({ auth: { ...auth, ...patch } as RequestAuth })
  }

  return (
    <div className="auth-editor">
      <label className="auth-type-label">
        <span>Authorization type</span>
        <Select value={auth.type} onValueChange={setAuthType} disabled={readOnly}>
          <SelectTrigger aria-label="Authorization type" className="auth-type-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="api-key">API Key</SelectItem>
            <SelectItem value="basic">Basic Auth</SelectItem>
            <SelectItem value="bearer">Bearer Token</SelectItem>
          </SelectContent>
        </Select>
      </label>
      {auth.type === 'bearer' && (
        <label className="auth-field">
          <span>Token</span>
          <VariableInput
            aria-label="Bearer token"
            type="password"
            autoComplete="off"
            value={auth.token}
            suggestions={suggestions}
            onVariableClick={onVariableClick}
            readOnly={readOnly}
            onValueChange={(value) => updateAuth({ token: value })}
            placeholder="Enter token"
          />
        </label>
      )}
      {auth.type === 'basic' && (
        <div className="auth-field-grid">
          <label className="auth-field">
            <span>Username</span>
            <VariableInput
              aria-label="Basic auth username"
              autoComplete="off"
              value={auth.username}
              suggestions={suggestions}
              onVariableClick={onVariableClick}
              readOnly={readOnly}
              onValueChange={(value) => updateAuth({ username: value })}
              placeholder="Username"
            />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <VariableInput
              aria-label="Basic auth password"
              type="password"
              autoComplete="new-password"
              value={auth.password}
              suggestions={suggestions}
              onVariableClick={onVariableClick}
              readOnly={readOnly}
              onValueChange={(value) => updateAuth({ password: value })}
              placeholder="Password"
            />
          </label>
        </div>
      )}
      {auth.type === 'api-key' && (
        <div className="auth-field-grid">
          <label className="auth-field">
            <span>Key</span>
            <VariableInput
              aria-label="API key name"
              autoComplete="off"
              value={auth.name}
              suggestions={suggestions}
              onVariableClick={onVariableClick}
              readOnly={readOnly}
              onValueChange={(value) => updateAuth({ name: value })}
              placeholder="e.g. X-API-Key"
            />
          </label>
          <label className="auth-field">
            <span>Value</span>
            <VariableInput
              aria-label="API key value"
              type="password"
              autoComplete="off"
              value={auth.value}
              suggestions={suggestions}
              onVariableClick={onVariableClick}
              readOnly={readOnly}
              onValueChange={(value) => updateAuth({ value })}
              placeholder="Enter API key"
            />
          </label>
          <label className="auth-field">
            <span>Add to</span>
            <Select
              value={auth.location}
              onValueChange={(location) => updateAuth({ location: location as 'header' | 'query' })}
              disabled={readOnly}
            >
              <SelectTrigger aria-label="API key location" className="auth-location-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="header">Header</SelectItem>
                <SelectItem value="query">Query params</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>
      )}
      {auth.type === 'none' && <p className="auth-help">This request will not add an authorization header.</p>}
      {auth.type !== 'none' && (
        <p className="auth-help">Credentials are applied when the request is sent and override matching authorization headers.</p>
      )}
    </div>
  )
}
