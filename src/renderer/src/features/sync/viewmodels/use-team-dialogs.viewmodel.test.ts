import { act, renderHook, waitFor } from '@testing-library/react'
import type { FormEvent } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cloudWorkspaceService } from '@/features/sync/services/cloud-workspace.service'
import { type TeamDialogsInput, useTeamDialogsViewModel } from '@/features/sync/viewmodels/use-team-dialogs.viewmodel'

vi.mock('@/features/sync/services/cloud-workspace.service')

const submitEvent = { preventDefault: vi.fn() } as unknown as FormEvent

function input(overrides: Partial<TeamDialogsInput> = {}): TeamDialogsInput {
  return {
    sessionToken: 'token-1',
    activeWorkspace: { cloudId: 'cloud-1', name: 'Platform', role: 'owner' },
    tree: [],
    variables: { globals: [], environments: [] },
    activeEnvironmentId: null,
    inviteToken: '',
    onInviteTokenDraftChange: vi.fn(),
    onInviteTokenUsed: vi.fn(),
    onStatus: vi.fn(),
    onCreated: vi.fn(async () => undefined),
    onAccepted: vi.fn(async () => undefined),
    ...overrides,
  }
}

describe('useTeamDialogsViewModel', () => {
  beforeEach(() => vi.resetAllMocks())

  it('does not create a workspace without a signed-in session', async () => {
    const data = input({ sessionToken: null })
    const { result } = renderHook(() => useTeamDialogsViewModel(data))
    act(() => result.current.createWorkspace.onNameChange('New'))
    await act(async () => result.current.createWorkspace.onSubmit(submitEvent))
    expect(cloudWorkspaceService.create).not.toHaveBeenCalled()
  })

  it('creates a cloud workspace and hands it to the workspace', async () => {
    vi.mocked(cloudWorkspaceService.create).mockResolvedValue({
      id: 'cloud-9',
      name: 'New',
      role: 'owner',
      headCommitId: 'c1',
      tree: [],
      variables: undefined,
    })
    const data = input()
    const { result } = renderHook(() => useTeamDialogsViewModel(data))
    act(() => result.current.createWorkspace.onNameChange('  New  '))
    await act(async () => result.current.createWorkspace.onSubmit(submitEvent))
    expect(cloudWorkspaceService.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'New', token: 'token-1' }))
    expect(data.onCreated).toHaveBeenCalledWith(
      expect.objectContaining({ cloudId: 'cloud-9', role: 'owner' }),
      expect.anything(),
      expect.anything(),
    )
  })

  it('rejects an invalid teammate email before calling the service', async () => {
    const { result } = renderHook(() => useTeamDialogsViewModel(input()))
    act(() => result.current.team.onEmailChange('not-an-email'))
    await act(async () => result.current.team.onSend())
    expect(result.current.team.error).toBe('Enter a valid email address for the teammate.')
    expect(cloudWorkspaceService.invite).not.toHaveBeenCalled()
  })

  it('shows the invite link and the email notice after a successful invite', async () => {
    vi.mocked(cloudWorkspaceService.invite).mockResolvedValue({ token: 'abc', emailSent: true })
    const { result } = renderHook(() => useTeamDialogsViewModel(input()))
    act(() => result.current.team.onEmailChange('  Ada@Example.com '))
    await act(async () => result.current.team.onSend())
    await waitFor(() => expect(result.current.team.inviteLink).toBe('api-docs://invite?token=abc'))
    expect(cloudWorkspaceService.invite).toHaveBeenCalledWith(expect.objectContaining({ email: 'ada@example.com', role: 'editor' }))
    expect(result.current.team.notice).toBe('Invitation sent to ada@example.com. It expires in 7 days.')
  })

  it('clears the old error and notice when the team dialog opens again', async () => {
    const { result } = renderHook(() => useTeamDialogsViewModel(input()))
    act(() => result.current.team.onEmailChange('bad'))
    await act(async () => result.current.team.onSend())
    expect(result.current.team.error).not.toBeNull()
    act(() => result.current.openTeam())
    expect(result.current.team.error).toBeNull()
    expect(result.current.team.open).toBe(true)
  })

  it('asks for a token before accepting an invite', async () => {
    const { result } = renderHook(() => useTeamDialogsViewModel(input({ inviteToken: '   ' })))
    await act(async () => result.current.team.onAccept(submitEvent))
    expect(result.current.team.error).toBe('Paste a valid invite link or token.')
    expect(cloudWorkspaceService.accept).not.toHaveBeenCalled()
  })
})
