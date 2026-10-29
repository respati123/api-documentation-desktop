import type { ReactElement } from 'react'
import { type RequestWorkbenchInput, useRequestWorkbenchViewModel } from '@/features/request/viewmodels/use-request-workbench.viewmodel'
import { RequestWorkbenchView } from '@/features/request/views/request-workbench.view'

export type RequestWorkbenchPageProps = RequestWorkbenchInput

export function RequestWorkbenchPage(props: RequestWorkbenchPageProps): ReactElement {
  const viewModel = useRequestWorkbenchViewModel(props)
  return <RequestWorkbenchView {...viewModel} />
}
