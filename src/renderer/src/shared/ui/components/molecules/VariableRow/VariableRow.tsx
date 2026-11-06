import { Icon } from '../../../icons/Icon'
import { Button } from '../../atoms/Button/Button'
import { Checkbox } from '../../atoms/Checkbox/Checkbox'
import { Input } from '../../atoms/Input/Input'
import './VariableRow.css'

export interface VariableRowData {
  id: string
  name: string
  value: string
  secret: boolean
}

// Test ids for the controls in one row. Optional, so the library works without an app's id scheme.
export interface VariableRowTestIds {
  name?: string
  value?: string
  secret?: string
  remove?: string
}

export interface VariableRowProps {
  row: VariableRowData
  readOnly?: boolean
  /** Makes only the value read-only, for example a non-secret value in a read-only scope. Falls back to readOnly. */
  valueReadOnly?: boolean
  namePlaceholder: string
  valuePlaceholder: string
  /** Used for a secret value. Falls back to valuePlaceholder. */
  secretValuePlaceholder?: string
  nameLabel: string
  valueLabel: string
  secretLabel: string
  removeLabel: string
  testIds?: VariableRowTestIds
  onNameChange: (name: string) => void
  onValueChange: (value: string) => void
  onSecretChange: (secret: boolean) => void
  onRemove: () => void
}

// One variable: its name, its value, whether it is secret, and a remove button.
// A secret value is shown as a password field, so it never appears on screen as plain text.
export function VariableRow({
  row,
  readOnly = false,
  valueReadOnly,
  namePlaceholder,
  valuePlaceholder,
  secretValuePlaceholder,
  nameLabel,
  valueLabel,
  secretLabel,
  removeLabel,
  testIds,
  onNameChange,
  onValueChange,
  onSecretChange,
  onRemove,
}: VariableRowProps) {
  return (
    <div className="variable-row">
      <Input
        mono
        data-testid={testIds?.name}
        aria-label={nameLabel}
        placeholder={namePlaceholder}
        maxLength={160}
        value={row.name}
        readOnly={readOnly}
        onChange={(event) => onNameChange(event.target.value)}
      />
      <Input
        mono
        data-testid={testIds?.value}
        aria-label={valueLabel}
        type={row.secret ? 'password' : 'text'}
        autoComplete="off"
        placeholder={row.secret ? (secretValuePlaceholder ?? valuePlaceholder) : valuePlaceholder}
        value={row.value}
        readOnly={valueReadOnly ?? readOnly}
        onChange={(event) => onValueChange(event.target.value)}
      />
      <div className="variable-row__secret">
        <Checkbox
          data-testid={testIds?.secret}
          aria-label={secretLabel}
          checked={row.secret}
          disabled={readOnly}
          onChange={(event) => onSecretChange(event.target.checked)}
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        data-testid={testIds?.remove}
        aria-label={removeLabel}
        disabled={readOnly}
        onClick={onRemove}
      >
        <Icon name="trash" size={14} />
      </Button>
    </div>
  )
}
