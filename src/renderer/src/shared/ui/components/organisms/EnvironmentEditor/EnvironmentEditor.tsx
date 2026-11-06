import type { ReactNode } from 'react'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
import { VariableTable, type VariableTableProps } from '../../molecules/VariableTable/VariableTable'
import './EnvironmentEditor.css'

export interface EnvironmentEditorProps {
  folderLabel: string
  name: string
  nameLabel: string
  nameTestId?: string
  readOnly?: boolean
  /** Used by the built-in actions only. Pass `actions` to use the app's own buttons instead. */
  isActive?: boolean
  activeLabel?: string
  setActiveLabel?: string
  duplicateLabel?: string
  deleteLabel?: string
  onNameChange: (name: string) => void
  onSetActive?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  /** The variable table. Pass `children` instead when the app renders its own table. */
  variables?: VariableTableProps
  children?: ReactNode
  /** Short help under the table, such as how variables are used in requests. */
  note?: ReactNode
  /** Replaces the built-in Set active, Duplicate, and Delete buttons. Use it when the app has its own actions. */
  actions?: ReactNode
}

// The environment tab: the name with its actions above, then the variables for that environment.
export function EnvironmentEditor({
  folderLabel,
  name,
  nameLabel,
  nameTestId,
  readOnly = false,
  isActive,
  activeLabel,
  setActiveLabel,
  duplicateLabel,
  deleteLabel,
  onNameChange,
  onSetActive,
  onDuplicate,
  onDelete,
  variables,
  children,
  note,
  actions,
}: EnvironmentEditorProps) {
  return (
    <section className="environment-editor">
      <div className="environment-editor__head">
        <span className="environment-editor__folder">{folderLabel}</span>
        <Input
          className="environment-editor__name"
          data-testid={nameTestId}
          aria-label={nameLabel}
          maxLength={100}
          value={name}
          readOnly={readOnly}
          onChange={(event) => onNameChange(event.target.value)}
        />
        <div className="environment-editor__actions">
          {actions ?? (
            <>
              {isActive ? (
                <span className="environment-editor__active">{activeLabel}</span>
              ) : (
                <Button variant="primary" onClick={onSetActive} disabled={readOnly}>
                  {setActiveLabel}
                </Button>
              )}
              <Button variant="secondary" onClick={onDuplicate} disabled={readOnly}>
                {duplicateLabel}
              </Button>
              <Button variant="destructive" onClick={onDelete} disabled={readOnly}>
                {deleteLabel}
              </Button>
            </>
          )}
        </div>
      </div>
      {children ?? (variables && <VariableTable {...variables} />)}
      {note && <p className="environment-editor__note">{note}</p>}
    </section>
  )
}
