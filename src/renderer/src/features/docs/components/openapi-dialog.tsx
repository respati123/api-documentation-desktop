import { useEffect, useRef, useState } from 'react'
import type { TreeNode } from '@/features/workspace'
import { importOpenApi, serializeOpenApi } from '@/lib/openapi'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'

export function OpenApiDialog({
  open,
  onOpenChange,
  tree,
  workspaceName,
  readOnly,
  onImport,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tree: TreeNode[]
  workspaceName: string
  readOnly: boolean
  onImport: (tree: TreeNode[]) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<{ tree: TreeNode[]; title: string; fileName: string; requestCount: number } | null>(null)
  const [error, setError] = useState('')
  const requestCount = (nodes: TreeNode[]): number =>
    nodes.reduce((count, node) => count + (node.kind === 'folder' ? requestCount(node.children) : 1), 0)

  useEffect(() => {
    if (open) return
    setPreview(null)
    setError('')
  }, [open])

  async function readFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    setError('')
    try {
      const imported = importOpenApi(await file.text())
      setPreview({ ...imported, fileName: file.name })
    } catch (reason) {
      setPreview(null)
      setError(reason instanceof Error ? reason.message : 'Could not read this OpenAPI file.')
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
      setError(reason instanceof Error ? reason.message : 'Could not export this workspace.')
    }
  }

  function applyImport() {
    if (!preview || readOnly) return
    onImport(preview.tree)
    setPreview(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="openapi-dialog">
        <DialogHeader>
          <DialogTitle>OpenAPI</DialogTitle>
          <DialogDescription>
            Import an OpenAPI 3.0 or 3.1 file into this workspace, or export its current requests. Imports are added to the workspace.
          </DialogDescription>
        </DialogHeader>
        <input
          ref={fileInputRef}
          className="sr-only"
          type="file"
          accept=".json,.yaml,.yml,application/json,application/yaml,text/yaml"
          onChange={(event) => void readFile(event)}
        />
        <div className="openapi-actions">
          <Button type="button" variant="outline" disabled={readOnly} onClick={() => fileInputRef.current?.click()}>
            Choose OpenAPI file
          </Button>
          <Button type="button" variant="outline" onClick={() => exportFile('json')}>
            Export JSON
          </Button>
          <Button type="button" variant="outline" onClick={() => exportFile('yaml')}>
            Export YAML
          </Button>
        </div>
        {preview && (
          <div className="openapi-preview" role="status">
            <div>
              <strong>{preview.title}</strong>
              <span>{preview.fileName}</span>
            </div>
            <p>
              {preview.requestCount} request{preview.requestCount === 1 ? '' : 's'} found. They will be added to {workspaceName}.
            </p>
            <Button type="button" disabled={readOnly} onClick={applyImport}>
              Add requests
            </Button>
          </div>
        )}
        {error && (
          <p className="openapi-error" role="alert">
            {error}
          </p>
        )}
        {readOnly && <p className="openapi-read-only">This workspace is read only. You can still export its requests.</p>}
      </DialogContent>
    </Dialog>
  )
}
