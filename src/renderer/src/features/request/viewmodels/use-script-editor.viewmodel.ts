import type { editor as MonacoEditor } from 'monaco-editor'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { REQUEST_TEXT } from '@/features/request/constants/request-text.constants'
import { apidocsTypingsPath, loadScriptMonaco } from '@/features/request/lib/script-monaco'
import { buildScriptTypings } from '@/features/request/lib/script-typings'
import { useDebouncedEditorValue } from '@/shared/components/variable-field'

type StandaloneEditor = MonacoEditor.IStandaloneCodeEditor

export type ScriptEditorInput = {
  phase: 'pre' | 'post'
  value: string
  onChange: (value: string) => void
  readOnly: boolean
  ariaLabel: string
  // The line where the last run of this script failed, and the message. Null when that run did not fail with a line.
  runErrorLine: number | null
  runErrorMessage: string
}

// Every editor gets its own model, so each script keeps its own undo history and markers.
let modelCount = 0

// Owns one script field: a Monaco editor with JavaScript diagnostics, and the apidocs declarations it completes from.
export function useScriptEditorViewModel({
  phase,
  value,
  onChange,
  readOnly,
  ariaLabel,
  runErrorLine,
  runErrorMessage,
}: ScriptEditorInput) {
  const { t } = useTranslation('request')
  const [draft, updateDraft, flushDraft] = useDebouncedEditorValue(value, onChange)
  // The tab hides this field when it is not open, so the container is known only when it is on screen.
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const editorRef = useRef<StandaloneEditor | null>(null)
  const [ready, setReady] = useState(false)
  const [modelPath] = useState(() => {
    modelCount += 1
    return `file:///request-${phase}-script-${modelCount}.js`
  })
  // Monaco's listeners are attached once, so they read the latest values and callbacks through this ref.
  const latest = useRef({ draft, updateDraft, flushDraft, ariaLabel, readOnly })
  useLayoutEffect(() => {
    latest.current = { draft, updateDraft, flushDraft, ariaLabel, readOnly }
  })

  // Creates the editor when the container is on screen and the library has loaded, and disposes it when the container goes away.
  useEffect(() => {
    if (!container) return
    let disposed = false
    let subscription: { dispose(): void } | null = null
    let created: StandaloneEditor | null = null
    void loadScriptMonaco().then((monaco) => {
      if (disposed) return
      const model = monaco.editor.createModel(latest.current.draft, 'javascript', monaco.Uri.parse(modelPath))
      created = monaco.editor.create(container, {
        model,
        ariaLabel: latest.current.ariaLabel,
        readOnly: latest.current.readOnly,
        minimap: { enabled: false },
        lineNumbers: 'on',
        fontSize: 12,
        lineHeight: 20,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        tabSize: 2,
        wordWrap: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 8, bottom: 8 },
        scrollbar: { alwaysConsumeMouseWheel: false },
      })
      const editor = created
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => latest.current.flushDraft())
      subscription = editor.onDidChangeModelContent(() => {
        const next = editor.getValue()
        if (next !== latest.current.draft) latest.current.updateDraft(next)
      })
      editor.onDidBlurEditorWidget(() => latest.current.flushDraft())
      editorRef.current = editor
      setReady(true)
    })
    return () => {
      disposed = true
      subscription?.dispose()
      if (created) {
        created.getModel()?.dispose()
        created.dispose()
      }
      editorRef.current = null
      setReady(false)
    }
  }, [container, modelPath])

  // A value that changes outside the editor, such as another request opening, is written into it.
  useEffect(() => {
    const editor = editorRef.current
    if (editor && editor.getValue() !== draft) editor.setValue(draft)
  }, [draft])

  useEffect(() => {
    editorRef.current?.updateOptions({ readOnly })
  }, [readOnly])

  // The line where the last run failed is marked. A later run replaces the mark, and a run with no line clears it.
  useEffect(() => {
    if (!ready) return
    void loadScriptMonaco().then((monaco) => {
      const model = editorRef.current?.getModel()
      if (!model) return
      const markers =
        runErrorLine === null
          ? []
          : [
              {
                severity: monaco.MarkerSeverity.Error,
                message: runErrorMessage,
                startLineNumber: Math.min(runErrorLine, model.getLineCount()),
                startColumn: 1,
                endLineNumber: Math.min(runErrorLine, model.getLineCount()),
                endColumn: model.getLineMaxColumn(Math.min(runErrorLine, model.getLineCount())),
              },
            ]
      monaco.editor.setModelMarkers(model, 'apidocs-run', markers)
    })
  }, [ready, runErrorLine, runErrorMessage])

  // The declarations follow the app language, so the descriptions in the completions match the rest of the screen.
  useEffect(() => {
    void loadScriptMonaco().then((monaco) => {
      monaco.typescript.javascriptDefaults.setExtraLibs([{ content: buildScriptTypings((key) => t(key)), filePath: apidocsTypingsPath }])
    })
  }, [t])

  return {
    containerRef: setContainer,
    ready,
    loadingText: t(REQUEST_TEXT.workbench.scriptsLoading),
  }
}

export type ScriptEditorModel = ReturnType<typeof useScriptEditorViewModel>
