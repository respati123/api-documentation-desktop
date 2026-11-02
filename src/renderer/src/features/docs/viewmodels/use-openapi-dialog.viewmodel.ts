import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DOCS_TEXT } from '@/features/docs/constants/docs-text.constants'
import { importOpenApi, serializeOpenApi } from '@/lib/openapi'
import type { ApiNode } from '@/shared/models/api-node.model'

type Preview = { tree: ApiNode[]; title: string; fileName: string; requestCount: number }

// Owns the OpenAPI dialog: reading a file for preview, exporting, and adding an import to the workspace.
export function useOpenApiDialogViewModel({
  open,
  onOpenChange,
  tree,
  workspaceName,
  readOnly,
  onImport,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tree: ApiNode[]
  workspaceName: string
  readOnly: boolean
  onImport: (tree: ApiNode[]) => void
}) {
  const { t } = useTranslation('docs')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) return
    setPreview(null)
    setError('')
  }, [open])

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    setError('')
    try {
      const imported = importOpenApi(await file.text())
      setPreview({ ...imported, fileName: file.name })
    } catch (reason) {
      setPreview(null)
      setError(reason instanceof Error ? reason.message : t(DOCS_TEXT.openapi.readFallback))
    }
  }

  function exportFile(format: 'json' | 'yaml') {
    try {
      const content = serializeOpenApi(tree, workspaceName, format)
      const slug =
        workspaceName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'workspace'
      const url = URL.createObjectURL(new Blob([content], { type: format === 'json' ? 'application/json' : 'application/yaml' }))
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${slug}.openapi.${format}`
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t(DOCS_TEXT.openapi.exportFallback))
    }
  }

  function applyImport() {
    if (!preview || readOnly) return
    onImport(preview.tree)
    setPreview(null)
    onOpenChange(false)
  }

  return {
    open,
    onOpenChange,
    title: t(DOCS_TEXT.openapi.title),
    description: t(DOCS_TEXT.openapi.description),
    fileInputRef,
    readOnly,
    chooseLabel: t(DOCS_TEXT.openapi.choose),
    exportJsonLabel: t(DOCS_TEXT.openapi.exportJson),
    exportYamlLabel: t(DOCS_TEXT.openapi.exportYaml),
    addLabel: t(DOCS_TEXT.openapi.addRequests),
    readOnlyText: t(DOCS_TEXT.openapi.readOnly),
    preview: preview
      ? {
          title: preview.title,
          fileName: preview.fileName,
          foundText: t(DOCS_TEXT.openapi.found, { count: preview.requestCount, workspace: workspaceName }),
        }
      : null,
    error: error || null,
    onFileChange: (event: ChangeEvent<HTMLInputElement>) => void readFile(event),
    onChooseFile: () => fileInputRef.current?.click(),
    onExport: exportFile,
    onApply: applyImport,
  }
}
