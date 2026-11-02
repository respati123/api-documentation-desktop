import { describe, expect, it, vi } from 'vitest'
import { type PushDeps, pushWorkspaceCommits } from '@/features/sync/workflows/push-workflow'
import { ApiError } from '@/lib/api'

const translate: PushDeps['translate'] = (key) => key

const workspace: LocalWorkspace = {
  id: 'w1',
  cloudId: 'cloud-1',
  name: 'Platform',
  tree: [],
  baseTree: [],
  variables: { globals: [], environments: [] },
  baseVariables: { globals: [], environments: [] },
  baseCommitId: 'head-0',
  localHeadId: 'local-1',
  role: 'owner',
}

const commit = (id: string, pushed = false): LocalCommit => ({
  id,
  parentIds: [],
  message: id,
  tree: [],
  variables: { globals: [], environments: [] },
  createdAt: '2026-01-01',
  pushed,
})

function deps(overrides: Partial<PushDeps> = {}): PushDeps {
  return {
    token: 't',
    role: 'owner',
    workspace,
    tree: [],
    variables: { globals: [], environments: [] },
    translate,
    listCommits: vi.fn(async () => [commit('a'), commit('b', true)]),
    saveWorkspace: vi.fn(async () => undefined),
    saveCommit: vi.fn(async () => undefined),
    createCloud: vi.fn(async () => ({
      id: 'cloud-new',
      name: 'Platform',
      role: 'owner' as const,
      headCommitId: 'cloud-head',
      tree: [],
      variables: undefined,
    })),
    push: vi.fn(async () => 'head-2'),
    ...overrides,
  }
}

describe('pushWorkspaceCommits', () => {
  it('refuses to push for a viewer and sends nothing', async () => {
    const d = deps({ role: 'viewer' })
    const outcome = await pushWorkspaceCommits(d)
    expect(outcome).toEqual({ kind: 'refused', message: 'viewer' })
    expect(d.push).not.toHaveBeenCalled()
  })

  it('does nothing when every commit is already pushed', async () => {
    const d = deps({ listCommits: vi.fn(async () => [commit('b', true)]) })
    const outcome = await pushWorkspaceCommits(d)
    expect(outcome).toEqual({ kind: 'nothing', message: 'nothing' })
    expect(d.push).not.toHaveBeenCalled()
  })

  it('sends only the unpushed commits and marks them pushed on success', async () => {
    const d = deps()
    const outcome = await pushWorkspaceCommits(d)
    expect(d.push).toHaveBeenCalledWith(expect.objectContaining({ cloudId: 'cloud-1' }))
    const sent = vi.mocked(d.push).mock.calls[0][0].commits
    expect(sent.map((item) => item.id)).toEqual(['a'])
    expect(outcome.kind).toBe('pushed')
    if (outcome.kind !== 'pushed') return
    expect(outcome.workspace).toMatchObject({ baseCommitId: 'head-2', localHeadId: 'head-2' })
    expect(outcome.pushed.map((item) => item.pushed)).toEqual([true])
    expect(outcome.published).toBeNull()
  })

  it('publishes a local workspace first and rebases its pending commits onto the new cloud head', async () => {
    const d = deps({ workspace: { ...workspace, cloudId: null } })
    const outcome = await pushWorkspaceCommits(d)
    expect(d.createCloud).toHaveBeenCalledTimes(1)
    expect(outcome.kind).toBe('pushed')
    if (outcome.kind !== 'pushed') return
    expect(outcome.published?.cloud.id).toBe('cloud-new')
    expect(outcome.published?.rebased[0].parentIds).toEqual(['cloud-head'])
    expect(outcome.workspace.cloudId).toBe('cloud-new')
    expect(vi.mocked(d.push).mock.calls[0][0].cloudId).toBe('cloud-new')
  })

  it('reports a conflict with the cloud when the workspace was already on the cloud', async () => {
    const d = deps({
      push: vi.fn(async () => {
        throw new ApiError('conflict', 409, {})
      }),
    })
    const outcome = await pushWorkspaceCommits(d)
    expect(outcome).toEqual({ kind: 'conflict', message: 'conflictOnCloud', workspaceAlreadyOnCloud: true, published: null })
  })

  it('reports a conflict after publishing, and keeps the published workspace for the caller', async () => {
    const d = deps({
      workspace: { ...workspace, cloudId: null },
      push: vi.fn(async () => {
        throw new ApiError('conflict', 409, {})
      }),
    })
    const outcome = await pushWorkspaceCommits(d)
    expect(outcome.kind).toBe('conflict')
    if (outcome.kind !== 'conflict') return
    expect(outcome.workspaceAlreadyOnCloud).toBe(false)
    expect(outcome.message).toBe('conflictPublished')
    expect(outcome.published?.cloud.id).toBe('cloud-new')
  })

  it('returns the error message for any other failure', async () => {
    const d = deps({
      push: vi.fn(async () => {
        throw new Error('Network down')
      }),
    })
    const outcome = await pushWorkspaceCommits(d)
    expect(outcome).toEqual({ kind: 'error', message: 'Network down', published: null })
  })
})
