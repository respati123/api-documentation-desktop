import type { ReactElement } from 'react'
import { useApiReferenceViewModel } from '@/features/docs/viewmodels/use-api-reference.viewmodel'
import { ApiReferenceView } from '@/features/docs/views/api-reference.view'
import type { RequestNode } from '@/shared/models/api-node.model'

export function ApiReferencePage(props: {
  request: RequestNode
  folderName: string
  onOpenRequest: () => void
  onOpenOpenApi: () => void
}): ReactElement {
  const viewModel = useApiReferenceViewModel(props)
  return <ApiReferenceView {...viewModel} />
}
