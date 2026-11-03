import type { ReactElement } from 'react'
import { useWorkspaceViewModel } from '@/features/workspace/viewmodels/use-workspace.viewmodel'
import { WorkspaceView } from '@/features/workspace/views/workspace.view'

export function WorkspacePage(): ReactElement {
  const viewModel = useWorkspaceViewModel()
  return <WorkspaceView {...viewModel} />
}
