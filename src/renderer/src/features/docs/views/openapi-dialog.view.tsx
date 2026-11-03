import type { ReactElement } from 'react'
import type { useOpenApiDialogViewModel } from '@/features/docs/viewmodels/use-openapi-dialog.viewmodel'
import { AppDialog } from '@/shared/components/app-dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

export type OpenApiDialogViewProps = ReturnType<typeof useOpenApiDialogViewModel>

export function OpenApiDialogView({
  open,
  onOpenChange,
  title,
  description,
  fileInputRef,
  readOnly,
  chooseLabel,
  exportJsonLabel,
  exportYamlLabel,
  addLabel,
  readOnlyText,
  preview,
  error,
  onFileChange,
  onChooseFile,
  onExport,
  onApply,
}: OpenApiDialogViewProps): ReactElement {
  return (
    <AppDialog
      testId="docs-openapi-dialog-container"
      open={open}
      onOpenChange={onOpenChange}
      className="openapi-dialog"
      title={title}
      description={description}
    >
      <Input
        data-testid="docs-openapi-source-input"
        ref={fileInputRef}
        className="sr-only"
        type="file"
        accept=".json,.yaml,.yml,application/json,application/yaml,text/yaml"
        onChange={onFileChange}
      />
      <div className="openapi-actions">
        <Button data-testid="docs-openapi-choose-file-button" type="button" variant="outline" disabled={readOnly} onClick={onChooseFile}>
          {chooseLabel}
        </Button>
        <Button data-testid="docs-openapi-export-json-button" type="button" variant="outline" onClick={() => onExport('json')}>
          {exportJsonLabel}
        </Button>
        <Button data-testid="docs-openapi-export-yaml-button" type="button" variant="outline" onClick={() => onExport('yaml')}>
          {exportYamlLabel}
        </Button>
      </div>
      {preview && (
        <div className="openapi-preview" role="status">
          <div>
            <strong>{preview.title}</strong>
            <span>{preview.fileName}</span>
          </div>
          <p>{preview.foundText}</p>
          <Button data-testid="docs-openapi-import-button" type="button" disabled={readOnly} onClick={onApply}>
            {addLabel}
          </Button>
        </div>
      )}
      {error && (
        <p className="openapi-error" role="alert">
          {error}
        </p>
      )}
      {readOnly && <p className="openapi-read-only">{readOnlyText}</p>}
    </AppDialog>
  )
}
