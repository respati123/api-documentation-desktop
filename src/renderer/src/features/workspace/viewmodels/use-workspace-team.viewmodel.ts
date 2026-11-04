import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { NOTIFICATION_TEXT, type NotifyInput } from '@/features/notifications'
import type { CloudWorkspace, CloudWorkspaceRecord } from '@/features/sync'
import { useTeamDialogsViewModel } from '@/features/sync'
import { workspaceStorageService } from '@/features/workspace/services/workspace-storage.service'
import type { WorkspaceVariables } from '@/lib/workspace-variables'
import type { ApiNode } from '@/shared/models/api-node.model'

export type TeamInput = {
  sessionToken: string | null
  accountId: string | null
  activeWorkspace: LocalWorkspace | undefined
  tree: ApiNode[]
  workspaceVariables: WorkspaceVariables
  activeEnvironmentId: string | null
  inviteTokenDraft: string
  setInviteTokenDraft: Dispatch<SetStateAction<string>>
  setSyncStatus: Dispatch<SetStateAction<string>>
  setLocalWorkspaces: Dispatch<SetStateAction<LocalWorkspace[]>>
  setCloudWorkspaces: Dispatch<SetStateAction<CloudWorkspace[]>>
  setCurrentWorkspaceId: Dispatch<SetStateAction<string>>
  setStagedSnapshot: Dispatch<SetStateAction<ApiNode[] | null>>
  setStagedVariables: Dispatch<SetStateAction<WorkspaceVariables | null>>
  stagedWorkspaceIdRef: MutableRefObject<string>
  setTree: Dispatch<SetStateAction<ApiNode[]>>
  setWorkspaceVariables: Dispatch<SetStateAction<WorkspaceVariables>>
  setActiveEnvironmentId: Dispatch<SetStateAction<string | null>>
  resetTabs: (nextTree: ApiNode[]) => void
  onNotify: (input: NotifyInput) => void
}

// Team and invite dialogs, and how a workspace created or joined here becomes the active one.
export function useWorkspaceTeamViewModel(input: TeamInput) {
  const {
    sessionToken,
    accountId,
    activeWorkspace,
    tree,
    workspaceVariables,
    activeEnvironmentId,
    inviteTokenDraft,
    setInviteTokenDraft,
    setSyncStatus,
    setLocalWorkspaces,
    setCloudWorkspaces,
    setCurrentWorkspaceId,
    setStagedSnapshot,
    setStagedVariables,
    stagedWorkspaceIdRef,
    setTree,
    setWorkspaceVariables,
    setActiveEnvironmentId,
    resetTabs,
    onNotify,
  } = input
  const { t: tNotice } = useTranslation('notifications')
  // A cloud workspace this device just created becomes the active one, with its own tabs.
  async function adoptCreatedWorkspace(workspace: LocalWorkspace, cloud: CloudWorkspaceRecord, createdVariables: WorkspaceVariables) {
    await workspaceStorageService.saveWorkspace(workspace)
    setLocalWorkspaces((current) => [...current, workspace])
    setCloudWorkspaces((current) => [...current, { id: cloud.id, name: cloud.name, role: cloud.role, headCommitId: cloud.headCommitId }])
    stagedWorkspaceIdRef.current = workspace.id
    setStagedSnapshot(null)
    setStagedVariables(null)
    setCurrentWorkspaceId(workspace.id)
    setTree(workspace.tree)
    setWorkspaceVariables(createdVariables)
    setActiveEnvironmentId(workspace.activeEnvironmentId ?? null)
    resetTabs(workspace.tree)
  }

  // A workspace joined through an invite is added and opened, with its shared tree.
  async function adoptAcceptedWorkspace(workspace: LocalWorkspace, cloud: CloudWorkspaceRecord, invitedVariables: WorkspaceVariables) {
    await workspaceStorageService.saveWorkspace(workspace)
    setLocalWorkspaces((current) => [...current, workspace])
    setCloudWorkspaces((current) => [...current, { id: cloud.id, name: cloud.name, role: cloud.role, headCommitId: cloud.headCommitId }])
    stagedWorkspaceIdRef.current = workspace.id
    setStagedSnapshot(null)
    setStagedVariables(null)
    setCurrentWorkspaceId(workspace.id)
    setTree(workspace.tree)
    setWorkspaceVariables(invitedVariables)
    setActiveEnvironmentId(workspace.activeEnvironmentId ?? null)
    resetTabs(workspace.tree)
    onNotify({
      id: `joined-${cloud.id}`,
      tone: 'success',
      title: tNotice(NOTIFICATION_TEXT.joined, { name: cloud.name }),
      body: tNotice(NOTIFICATION_TEXT.joinedBody),
    })
  }

  return useTeamDialogsViewModel({
    onNotify,
    sessionToken,
    accountId,
    activeWorkspace,
    tree,
    variables: workspaceVariables,
    activeEnvironmentId,
    inviteToken: inviteTokenDraft,
    onInviteTokenDraftChange: setInviteTokenDraft,
    onInviteTokenUsed: () => setInviteTokenDraft(''),
    onStatus: setSyncStatus,
    onCreated: adoptCreatedWorkspace,
    onAccepted: adoptAcceptedWorkspace,
  })
}
