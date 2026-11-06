import type { KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { SYNC_TEXT } from '@/features/sync/constants/sync-text.constants'

export type SyncMenuItem = {
  key: string
  icon: string
  label: string
  detail: string | null
  disabled: boolean
  autoFocus: boolean
  onSelect: () => void
}

export type SyncFooterInput = {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspace: { name: string; cloudId: string | null; baseCommitId: string | null } | null
  signedIn: boolean
  readOnly: boolean
  changeCount: number
  historyCount: number
  pendingPushCount: number
  cloudHeadCommitId: string | null | undefined
  actions: {
    openHistory: () => void
    discard: () => void
    openCommit: () => void
    pull: () => void
    push: () => void
  }
}

// Labels, menu items, and status lines for the sidebar's sync footer. The derived flags and the push-disabled reason are decided here.
export function useSyncFooterViewModel(input: SyncFooterInput) {
  const { t } = useTranslation('sync')
  const { workspace, actions, pendingPushCount: pending } = input
  const cloud = Boolean(workspace?.cloudId)
  const cloudUpdateAvailable = Boolean(workspace?.cloudId && input.cloudHeadCommitId && input.cloudHeadCommitId !== workspace?.baseCommitId)
  const pendingLabel = t(SYNC_TEXT.footer.pendingToPush, { count: pending })

  const pushDisabledReason = !input.signedIn
    ? t(SYNC_TEXT.footer.signIn)
    : input.readOnly
      ? t(SYNC_TEXT.footer.viewerReadOnly)
      : !pending
        ? cloud
          ? t(SYNC_TEXT.footer.commitBeforePush)
          : t(SYNC_TEXT.footer.commitFirst)
        : ''

  // Every item closes the menu first, then runs its action, as the menu always did.
  const choose = (action: () => void) => () => {
    input.onOpenChange(false)
    action()
  }

  const localItems: SyncMenuItem[] = [
    {
      key: 'history',
      icon: '◷',
      label: t(SYNC_TEXT.footer.history),
      detail: input.historyCount > 0 ? String(input.historyCount) : null,
      disabled: false,
      autoFocus: true,
      onSelect: choose(actions.openHistory),
    },
    {
      key: 'discard',
      icon: '↶',
      label: t(SYNC_TEXT.footer.discard),
      detail: null,
      disabled: !input.changeCount,
      autoFocus: false,
      onSelect: choose(actions.discard),
    },
    {
      key: 'commit',
      icon: '⬡',
      label: t(SYNC_TEXT.footer.commit),
      detail: input.changeCount > 0 ? String(input.changeCount) : null,
      disabled: input.readOnly || !input.changeCount,
      autoFocus: false,
      onSelect: choose(actions.openCommit),
    },
  ]
  const cloudItems: SyncMenuItem[] = [
    {
      key: 'pull',
      icon: '↓',
      label: t(SYNC_TEXT.footer.pull),
      detail: cloudUpdateAvailable ? t(SYNC_TEXT.footer.updatesAvailable) : null,
      disabled: !input.signedIn || !cloud,
      autoFocus: false,
      onSelect: choose(actions.pull),
    },
    {
      key: 'push',
      icon: '↑',
      label: t(SYNC_TEXT.footer.push),
      detail: pending > 0 ? t(SYNC_TEXT.footer.pushCount, { count: pending }) : null,
      disabled: !input.signedIn || input.readOnly || !pending,
      autoFocus: false,
      onSelect: choose(actions.push),
    },
  ]

  const statusLines: { key: string; text: string; className?: string }[] = []
  if (input.changeCount > 0) statusLines.push({ key: 'changes', text: t(SYNC_TEXT.footer.localChange, { count: input.changeCount }) })
  if (pending > 0 && cloud) statusLines.push({ key: 'pending', text: pendingLabel })
  if (pending > 0 && !cloud) statusLines.push({ key: 'localCommits', text: t(SYNC_TEXT.footer.localCommit, { count: pending }) })
  if (cloudUpdateAvailable)
    statusLines.push({ key: 'cloudUpdate', text: t(SYNC_TEXT.footer.cloudUpdatesAvailable), className: 'sidebar-cloud-status' })
  const idle = !input.changeCount && !pending && !cloudUpdateAvailable
  if (idle && !cloud) statusLines.push({ key: 'saved', text: t(SYNC_TEXT.footer.savedLocally) })
  if (idle && cloud && input.cloudHeadCommitId) statusLines.push({ key: 'upToDate', text: t(SYNC_TEXT.footer.cloudUpToDate) })
  if (cloud && !input.cloudHeadCommitId) statusLines.push({ key: 'checking', text: t(SYNC_TEXT.footer.checkingCloud) })

  const statusAria = cloud ? pendingLabel : t(SYNC_TEXT.footer.savedLocally)
  const indicators: { key: string; text: string; title: string }[] = []
  if (cloudUpdateAvailable) indicators.push({ key: 'update', text: '↓', title: t(SYNC_TEXT.footer.cloudUpdatesAvailable) })
  if (pending > 0 && cloud) indicators.push({ key: 'push', text: `↑${pending}`, title: pendingLabel })
  if (!cloudUpdateAvailable && (!pending || !cloud))
    indicators.push({ key: 'idle', text: '•', title: cloud ? t(SYNC_TEXT.footer.upToDate) : t(SYNC_TEXT.footer.savedLocally) })

  // Arrow keys move focus between enabled menu items, and Escape closes the menu.
  function onMenuKeyDown(event: KeyboardEvent<HTMLElement>) {
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)'))
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const activeIndex = active ? items.indexOf(active) : -1
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      items[(activeIndex + direction + items.length) % items.length]?.focus()
    } else if (event.key === 'Escape') input.onOpenChange(false)
  }

  return {
    open: input.open,
    cloud,
    close: () => input.onOpenChange(false),
    toggle: () => input.onOpenChange(!input.open),
    onMenuKeyDown,
    closeLabel: t(SYNC_TEXT.footer.closeMenu),
    menuLabel: t(SYNC_TEXT.footer.menuLabel),
    title: workspace?.name ?? t(SYNC_TEXT.footer.defaultName),
    subtitle: cloud
      ? cloudUpdateAvailable
        ? t(SYNC_TEXT.footer.cloudUpdatesAvailable)
        : t(SYNC_TEXT.footer.cloudWorkspace)
      : t(SYNC_TEXT.footer.localVault),
    triggerLabel: t(SYNC_TEXT.footer.trigger),
    trigger: {
      disabled: !workspace,
      ariaLabel: cloudUpdateAvailable
        ? t(SYNC_TEXT.footer.metaUpdate, { status: statusAria, update: t(SYNC_TEXT.footer.cloudUpdatesAvailable) })
        : statusAria,
      changeCount: input.changeCount,
      indicators,
    },
    chevron: '⌃',
    localItems,
    cloudItems,
    pushDisabledReason,
    statusLines,
    // One line for the top bar, such as "2 local changes, 1 commit to push".
    summary: statusLines.map((line) => line.text).join(', '),
  }
}
