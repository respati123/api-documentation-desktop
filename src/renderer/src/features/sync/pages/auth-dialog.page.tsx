import type { ReactElement } from 'react'
import { useAuthDialogViewModel } from '@/features/sync/viewmodels/use-auth-dialog.viewmodel'
import { AuthDialogView } from '@/features/sync/views/auth-dialog.view'

export function AuthDialog(props: {
  showTrigger: boolean
  onBeginSignIn: () => Promise<void>
  openRequest: number
  initialError: string
  onOpen: () => void
}): ReactElement {
  const viewModel = useAuthDialogViewModel(props)
  return <AuthDialogView {...viewModel} />
}
