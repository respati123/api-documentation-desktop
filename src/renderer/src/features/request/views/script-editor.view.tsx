import type { ReactElement } from 'react'
import type { ScriptEditorModel } from '@/features/request/viewmodels/use-script-editor.viewmodel'

export type ScriptEditorViewProps = Pick<ScriptEditorModel, 'containerRef' | 'ready' | 'loadingText'> & {
  id: string
  testId: string
}

// A Monaco editor for one script. Monaco mounts into the container; this view only shows the loading line until it is ready.
export function ScriptEditorView({ containerRef, ready, loadingText, id, testId }: ScriptEditorViewProps): ReactElement {
  return (
    <div
      id={id}
      data-testid={testId}
      className="relative h-48 min-h-[120px] w-full min-w-0 overflow-hidden rounded-[12px] border border-border bg-chrome"
    >
      <div ref={containerRef} className="h-full w-full" />
      {!ready && <p className="absolute inset-0 m-0 p-3 font-mono text-[12px] text-muted-foreground">{loadingText}</p>}
    </div>
  )
}
