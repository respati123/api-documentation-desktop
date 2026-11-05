import type { ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { REQUEST_TEST_IDS } from '@/features/request/constants/request-test-ids.constants'
import type { ScriptEditorModel } from '@/features/request/viewmodels/use-script-editor.viewmodel'
import { plainButtonClass } from '@/shared/components/plain-button'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { cn } from '@/shared/utils/cn'

export type ScriptEditorViewProps = ScriptEditorModel & {
  id: string
  testId: string
  ariaLabel: string
  placeholder: string
  readOnly: boolean
  maxLength: number
}

// A script field with apidocs suggestions. Typing `apidocs.` opens the menu, and Enter or Tab inserts the selected name.
export function ScriptEditorView({
  elementRef,
  value,
  menuId,
  menu,
  onChange,
  onKeyDown,
  onBlur,
  onClick,
  id,
  testId,
  ariaLabel,
  placeholder,
  readOnly,
  maxLength,
}: ScriptEditorViewProps): ReactElement {
  return (
    <>
      <Textarea
        ref={elementRef}
        id={id}
        data-testid={testId}
        aria-label={ariaLabel}
        className="min-h-48 resize-y bg-muted/40 font-mono text-xs leading-5"
        maxLength={maxLength}
        spellCheck={false}
        placeholder={placeholder}
        value={value}
        readOnly={readOnly}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        onClick={onClick}
        role="combobox"
        aria-haspopup="listbox"
        aria-controls={menu ? menuId : undefined}
        aria-expanded={Boolean(menu)}
        aria-autocomplete="list"
        aria-activedescendant={menu ? `${menuId}-option-${menu.selectedIndex}` : undefined}
      />
      {menu &&
        createPortal(
          <div
            id={menuId}
            className="variable-suggestions"
            role="listbox"
            aria-label={menu.label}
            style={menu.position}
            data-testid={REQUEST_TEST_IDS.scriptCompletionMenu}
          >
            {menu.items.map((item, index) => (
              <Button
                type="button"
                variant="ghost"
                role="option"
                id={`${menuId}-option-${index}`}
                aria-selected={index === menu.selectedIndex}
                className={cn(
                  plainButtonClass,
                  'variable-suggestion',
                  'script-suggestion',
                  index === menu.selectedIndex && 'variable-suggestion-active',
                )}
                data-testid={REQUEST_TEST_IDS.scriptCompletionItem}
                key={item.label}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => menu.onChoose(item)}
              >
                <span className="variable-suggestion-name">{item.label}</span>
                <span className="script-suggestion-text">
                  <code>{item.signature}</code>
                  <small>{item.description}</small>
                </span>
              </Button>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
