import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { normalizeSharedTree, normalizeSharedVariables } from '@/features/collection'
import { SYNC_TEXT } from '@/features/sync/constants/sync-text.constants'
import { inviteTokenFrom, isValidEmail, normalizeEmail } from '@/features/sync/lib/invite'
import type { CloudWorkspaceRecord } from '@/features/sync/models/cloud-workspace.model'
import { cloudWorkspaceService } from '@/features/sync/services/cloud-workspace.service'
import { emptyWorkspaceVariables, type WorkspaceVariables } from '@/lib/workspace-variables'
import type { ApiNode } from '@/shared/models/api-node.model'

type Role = 'editor' | 'viewer'

export type TeamDialogsInput = {
  sessionToken: string | null
  activeWorkspace: { cloudId: string | null; name: string; role?: 'owner' | 'editor' | 'viewer' | null } | undefined
  tree: ApiNode[]
  variables: WorkspaceVariables
  activeEnvironmentId: string | null
  inviteToken: string
  onInviteTokenDraftChange: (value: string) => void
  onInviteTokenUsed: () => void
  onStatus: (text: string) => void
  // The workspace saves a new cloud workspace and applies it to its own state: the list, the active one, and its tabs.
  onCreated: (workspace: LocalWorkspace, cloud: CloudWorkspaceRecord, variables: WorkspaceVariables) => Promise<void>
  onAccepted: (workspace: LocalWorkspace, cloud: CloudWorkspaceRecord, variables: WorkspaceVariables) => Promise<void>
}

// Owns the two cloud dialogs: creating a cloud workspace and the team dialog (invite, copy, accept).
export function useTeamDialogsViewModel(input: TeamDialogsInput) {
  const { t } = useTranslation('sync')
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [teamOpen, setTeamOpen] = useState(false)
  const [role, setRole] = useState<Role>('editor')
  const [email, setEmail] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!input.sessionToken || !createName.trim()) return
    input.onStatus(t(SYNC_TEXT.createWorkspace.creating))
    try {
      // A new cloud workspace starts empty. The local workspace's tree and variables stay local.
      const emptyVariables = emptyWorkspaceVariables()
      const cloud = await cloudWorkspaceService.create({
        token: input.sessionToken,
        name: createName.trim(),
        tree: [],
        variables: emptyVariables,
      })
      const createdTree = normalizeSharedTree(cloud.tree ?? [])
      const createdVariables = normalizeSharedVariables(cloud.variables ?? emptyVariables)
      const workspace: LocalWorkspace = {
        id: crypto.randomUUID(),
        cloudId: cloud.id,
        name: cloud.name,
        tree: createdTree,
        baseTree: createdTree,
        variables: createdVariables,
        baseVariables: createdVariables,
        activeEnvironmentId: null,
        baseCommitId: cloud.headCommitId,
        localHeadId: cloud.headCommitId,
        role: 'owner',
      }
      await input.onCreated(workspace, cloud, createdVariables)
      setCreateName('')
      setCreateOpen(false)
      input.onStatus(t(SYNC_TEXT.createWorkspace.created))
    } catch (reason) {
      input.onStatus(reason instanceof Error ? reason.message : t(SYNC_TEXT.createWorkspace.failed))
    }
  }

  async function handleInvite() {
    if (!input.sessionToken || !input.activeWorkspace?.cloudId) return
    setError('')
    setNotice('')
    const address = normalizeEmail(email)
    if (!isValidEmail(address)) {
      setError(t(SYNC_TEXT.team.invalidEmail))
      return
    }
    try {
      const result = await cloudWorkspaceService.invite({
        token: input.sessionToken,
        cloudId: input.activeWorkspace.cloudId,
        email: address,
        role,
      })
      setInviteLink(`api-docs://invite?token=${encodeURIComponent(result.token)}`)
      setNotice(result.emailSent ? t(SYNC_TEXT.team.sentTo, { email: address }) : t(SYNC_TEXT.team.emailFailed))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t(SYNC_TEXT.team.inviteFailed))
    }
  }

  async function handleAccept(event: FormEvent) {
    event.preventDefault()
    if (!input.sessionToken) {
      setError(t(SYNC_TEXT.team.signInFirst))
      return
    }
    const token = inviteTokenFrom(input.inviteToken)
    if (!token) {
      setError(t(SYNC_TEXT.team.invalidToken))
      return
    }
    setError('')
    setNotice('')
    try {
      const cloud = await cloudWorkspaceService.accept({ token: input.sessionToken, inviteToken: token })
      const invitedTree = normalizeSharedTree(cloud.tree ?? [])
      const invitedVariables = normalizeSharedVariables(cloud.variables)
      const workspace: LocalWorkspace = {
        id: crypto.randomUUID(),
        cloudId: cloud.id,
        name: cloud.name,
        tree: invitedTree,
        baseTree: invitedTree,
        variables: invitedVariables,
        baseVariables: invitedVariables,
        activeEnvironmentId: invitedVariables.environments[0]?.id ?? null,
        baseCommitId: cloud.headCommitId,
        localHeadId: cloud.headCommitId,
        role: cloud.role,
      }
      await input.onAccepted(workspace, cloud, invitedVariables)
      input.onInviteTokenUsed()
      setInviteLink('')
      setNotice(t(SYNC_TEXT.team.accepted))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t(SYNC_TEXT.team.acceptFailed))
    }
  }

  const isOwner = input.activeWorkspace?.role === 'owner'

  return {
    openCreateWorkspace: () => setCreateOpen(true),
    openTeam: () => {
      setError('')
      setNotice('')
      setTeamOpen(true)
    },
    clearInviteLink: () => setInviteLink(''),
    createWorkspace: {
      open: createOpen,
      onOpenChange: setCreateOpen,
      title: t(SYNC_TEXT.createWorkspace.title),
      description: t(SYNC_TEXT.createWorkspace.description),
      nameLabel: t(SYNC_TEXT.createWorkspace.nameLabel),
      namePlaceholder: t(SYNC_TEXT.createWorkspace.namePlaceholder),
      submitLabel: t(SYNC_TEXT.createWorkspace.submit),
      name: createName,
      onNameChange: setCreateName,
      canSubmit: Boolean(input.sessionToken) && createName.trim() !== '',
      onSubmit: handleCreate,
    },
    team: {
      open: teamOpen,
      onOpenChange: setTeamOpen,
      title: t(SYNC_TEXT.team.title),
      description: isOwner
        ? t(SYNC_TEXT.team.descriptionOwner, { name: input.activeWorkspace?.name ?? '' })
        : t(SYNC_TEXT.team.descriptionJoin),
      isOwner,
      singleUseText: t(SYNC_TEXT.team.singleUse),
      emailLabel: t(SYNC_TEXT.team.emailLabel),
      emailPlaceholder: t(SYNC_TEXT.team.emailPlaceholder),
      roleLabel: t(SYNC_TEXT.team.roleLabel),
      roleOptions: [
        { value: 'editor', label: t(SYNC_TEXT.team.roleEditor) },
        { value: 'viewer', label: t(SYNC_TEXT.team.roleViewer) },
      ],
      role,
      onRoleChange: (value: string) => setRole(value === 'viewer' ? 'viewer' : 'editor'),
      email,
      onEmailChange: setEmail,
      sendLabel: t(SYNC_TEXT.team.send),
      onSend: () => void handleInvite(),
      inviteLink,
      linkLabel: t(SYNC_TEXT.team.linkLabel),
      copyLabel: t(SYNC_TEXT.team.copy),
      onCopy: () => void navigator.clipboard.writeText(inviteLink),
      acceptLabel: t(SYNC_TEXT.team.acceptLabel),
      tokenPlaceholder: t(SYNC_TEXT.team.tokenPlaceholder),
      token: input.inviteToken,
      onTokenChange: input.onInviteTokenDraftChange,
      joinLabel: t(SYNC_TEXT.team.join),
      canAccept: input.inviteToken.trim() !== '',
      onAccept: handleAccept,
      error: error || null,
      notice: notice || null,
    },
  }
}
