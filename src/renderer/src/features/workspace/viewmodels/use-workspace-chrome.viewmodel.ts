import type { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { WORKSPACE_TEXT } from '@/features/workspace/constants/workspace-text.constants'
import type { UpdateStatus } from '@/features/workspace/services/app-update.service'

export type ChromeInput = {
  user: { email: string } | null
  isCloudOwner: boolean
  updateStatus: UpdateStatus | null
  accountMenuOpen: boolean
  setAccountMenuOpen: Dispatch<SetStateAction<boolean>>
  onNewCloudWorkspace: () => void
  onTeam: () => void
  onSignOut: () => void
  onDownloadUpdate: (version: string) => void
  onDismissUpdate: () => void
}

// The topbar's account menu, update button, and update dialog. The dialog's state and text are decided here.
export function useWorkspaceChromeViewModel(input: ChromeInput) {
  const { t } = useTranslation('workspace')
  const { updateStatus } = input
  const closeMenu = () => input.setAccountMenuOpen(false)

  const updateButton =
    updateStatus?.state === 'available'
      ? {
          label: t(WORKSPACE_TEXT.topbar.updateTo, { version: updateStatus.version }),
          onClick: () => input.onDownloadUpdate(updateStatus.version),
        }
      : null

  const dialogOpen = Boolean(updateStatus && updateStatus.state !== 'available')
  const failed = updateStatus?.state === 'error'
  const version = updateStatus?.version ?? ''
  const dialog = {
    open: dialogOpen,
    onOpenChange: (open: boolean) => {
      if (!open && failed) input.onDismissUpdate()
    },
    failed,
    title: failed ? t(WORKSPACE_TEXT.update.failed) : t(WORKSPACE_TEXT.update.updatingTo, { version }),
    description:
      updateStatus?.state === 'error'
        ? updateStatus.message
        : updateStatus?.state === 'downloaded'
          ? t(WORKSPACE_TEXT.update.downloadComplete)
          : t(WORKSPACE_TEXT.update.downloading),
    percent: updateStatus?.state === 'downloading' ? updateStatus.percent : null,
    closeLabel: t(WORKSPACE_TEXT.update.close),
    onClose: input.onDismissUpdate,
  }

  return {
    wordmark: t(WORKSPACE_TEXT.topbar.wordmark),
    updateButton,
    dialog,
    account: input.user
      ? {
          email: input.user.email,
          initial: input.user.email.charAt(0).toUpperCase(),
          label: t(WORKSPACE_TEXT.topbar.account),
          open: input.accountMenuOpen,
          toggle: () => input.setAccountMenuOpen((open) => !open),
          items: [
            {
              key: 'new',
              label: t(WORKSPACE_TEXT.topbar.newCloudWorkspace),
              onSelect: () => {
                closeMenu()
                input.onNewCloudWorkspace()
              },
            },
            {
              key: 'team',
              label: input.isCloudOwner ? t(WORKSPACE_TEXT.topbar.team) : t(WORKSPACE_TEXT.topbar.joinWorkspace),
              onSelect: () => {
                closeMenu()
                input.onTeam()
              },
            },
            {
              key: 'signOut',
              label: t(WORKSPACE_TEXT.topbar.signOut),
              onSelect: () => {
                closeMenu()
                input.onSignOut()
              },
            },
          ],
        }
      : null,
  }
}
