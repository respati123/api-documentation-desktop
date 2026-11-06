import { type ComponentProps, useRef } from 'react'
import { VariableTextarea } from '@/shared/components/variable-field'
import { CodeGutter } from '@/shared/ui'

// A code field with line numbers, filling its pane. The numbers scroll with the text.
export function VariableCodeEditor({ onScroll, ...props }: ComponentProps<typeof VariableTextarea>) {
  const gutterRef = useRef<HTMLDivElement>(null)
  return (
    <div className="code-editor">
      <div ref={gutterRef} className="code-editor__gutter">
        <CodeGutter text={props.value} />
      </div>
      <div className="code-editor__field">
        <VariableTextarea
          {...props}
          mono
          wrap="off"
          spellCheck={false}
          onScroll={(event) => {
            if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop
            onScroll?.(event)
          }}
        />
      </div>
    </div>
  )
}
