import { type ChangeEvent, type KeyboardEvent, useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import {
  applyCompletion,
  type CompletionItem,
  type CompletionMatch,
  completionAt,
  type ScriptPhase,
} from '@/features/request/lib/script-completions'
import { getMenuPosition, type MenuPosition, useDebouncedEditorValue } from '@/shared/components/variable-field'

export type ScriptEditorInput = {
  phase: ScriptPhase
  value: string
  onChange: (value: string) => void
}

// One suggestion as the view shows it, with its description already translated.
export type ScriptSuggestion = CompletionItem & { description: string }

// Owns one script field: its draft, the apidocs suggestions for the caret, and the keys that move through them.
export function useScriptEditorViewModel({ phase, value, onChange }: ScriptEditorInput) {
  const { t } = useTranslation('request')
  const [draft, updateDraft, flushDraft] = useDebouncedEditorValue(value, onChange)
  const elementRef = useRef<HTMLTextAreaElement | null>(null)
  const menuId = useId()
  const [match, setMatch] = useState<CompletionMatch | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [position, setPosition] = useState<MenuPosition | null>(null)

  // Opens, moves, or closes the menu for the text before the caret.
  function refresh(element: HTMLTextAreaElement) {
    const next = completionAt(element.value, element.selectionStart ?? element.value.length, phase)
    setMatch(next)
    setSelectedIndex(0)
    if (next) setPosition(getMenuPosition(element))
  }

  function choose(item: CompletionItem) {
    const element = elementRef.current
    if (!element || !match) return
    const next = applyCompletion(element.value, match, item)
    updateDraft(next.value)
    setMatch(null)
    requestAnimationFrame(() => {
      element.focus()
      element.setSelectionRange(next.cursor, next.cursor)
    })
  }

  // The menu follows the field when the page scrolls or the window resizes.
  useEffect(() => {
    if (!match) return
    const update = () => {
      if (elementRef.current) setPosition(getMenuPosition(elementRef.current))
    }
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [match])

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.ctrlKey && event.key === 'Enter') flushDraft()
    const count = match?.items.length ?? 0
    if (!match || count === 0) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setSelectedIndex((current) => (current + direction + count) % count)
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      const item = match.items[selectedIndex] ?? match.items[0]
      choose(item)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setMatch(null)
    }
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    updateDraft(event.target.value)
    refresh(event.target)
  }

  const suggestions: ScriptSuggestion[] = (match?.items ?? []).map((item) => ({
    ...item,
    description: t(item.descriptionKey),
  }))

  return {
    elementRef,
    value: draft,
    menuId,
    menu:
      match && suggestions.length && position
        ? { items: suggestions, selectedIndex, position, label: t(REQUEST_TEXT.completion.label), onChoose: choose }
        : null,
    onChange: handleChange,
    onKeyDown,
    onBlur: () => {
      flushDraft()
      setMatch(null)
    },
    onClick: () => setMatch(null),
  }
}

export type ScriptEditorModel = ReturnType<typeof useScriptEditorViewModel>
