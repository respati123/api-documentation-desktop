import { AppProviders } from '@/app/app-providers'
import { WorkspacePage } from '@/features/workspace'

function App() {
  return (
    <AppProviders>
      <WorkspacePage />
    </AppProviders>
  )
}

export default App
