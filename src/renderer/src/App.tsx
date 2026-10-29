import { useWorkspaceViewModel } from '@/features/workspace/viewmodels/use-workspace.viewmodel'
import { WorkspaceView } from '@/features/workspace/views/workspace.view'

function App() {
  const viewModel = useWorkspaceViewModel()
  return <WorkspaceView {...viewModel} />
}

export default App
