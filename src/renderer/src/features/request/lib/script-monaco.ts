import type * as Monaco from 'monaco-editor'

export type ScriptMonaco = typeof Monaco

let loading: Promise<ScriptMonaco> | null = null

// Loads Monaco once, with its workers bundled into the app, so the editor needs no network access.
// JavaScript diagnostics are turned on, and the library is limited to ES2022 so that browser globals such as console are reported as errors,
// because the sandbox does not provide them.
export function loadScriptMonaco(): Promise<ScriptMonaco> {
  loading ??= import('monaco-editor').then((monaco) => {
    // Each worker is imported when Monaco asks for it, so tests and the first render do not load the workers.
    Object.assign(self, {
      MonacoEnvironment: {
        getWorker: (_workerId: string, label: string) =>
          label === 'typescript' || label === 'javascript'
            ? import('monaco-editor/language/typescript/ts.worker.js?worker').then(({ default: Worker }) => new Worker())
            : import('monaco-editor/editor/editor.worker.js?worker').then(({ default: Worker }) => new Worker()),
      },
    })
    const javascript = monaco.typescript.javascriptDefaults
    javascript.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false })
    javascript.setCompilerOptions({
      allowNonTsExtensions: true,
      allowJs: true,
      // Without checkJs, TypeScript reports only syntax errors in .js files, so unknown names such as console or fetch would not be flagged.
      checkJs: true,
      target: monaco.typescript.ScriptTarget.ESNext,
      lib: ['es2022'],
    })
    return monaco
  })
  return loading
}

export const apidocsTypingsPath = 'file:///apidocs.d.ts'
