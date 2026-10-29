import type { ReactElement } from 'react'
import { useOpenApiDialogViewModel } from '@/features/docs/viewmodels/use-openapi-dialog.viewmodel'
import { OpenApiDialogView } from '@/features/docs/views/openapi-dialog.view'
import type { ApiNode } from '@/shared/models/api-node.model'

export function OpenApiDialog(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tree: ApiNode[]
  workspaceName: string
  readOnly: boolean
  onImport: (tree: ApiNode[]) => void
}): ReactElement {
  const viewModel = useOpenApiDialogViewModel(props)
  return <OpenApiDialogView {...viewModel} />
}
