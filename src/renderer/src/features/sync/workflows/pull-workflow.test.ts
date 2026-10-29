import { describe, expect, it, vi } from 'vitest'
import {
  type PendingMergeState,
  type PullDeps,
  pullWorkspaceChanges,
  type ResolveDeps,
  resolvePendingMerge,
} from '@/features/sync/workflows/pull-workflow'
import type { ApiNode } from '@/shared/models/api-node.model'

const empty = { globals: [], environments: [] }
const translate = (key: string) => key as never

const base: LocalWorkspace = {
  id: 'w1',
  cloudId: 'cloud-1',
  name: 'Platform',
  tree: [],
  baseTree: [],
  variables: empty,
  baseVariables: empty,
  baseCommitId: 'head-1',
  localHeadId: 'head-1',
  role: 'owner',
}

function deps(overrides: Partial<PullDeps> = {}): PullDeps {
  return {
    token: 't',
    workspace: base,
    tree: [],
    variables: empty,
    activeEnvironmentId: null,
    translate,
    pullCloud: vi.fn(async () => ({ headCommitId: 'head-2', tree: [], variables: empty })),
    listCommits: vi.fn(async () => []),
    saveWorkspace: vi.fn(async () => undefined),
    saveCommit: vi.fn(async () => undefined),
    ...overrides,
  }
}

describe('pullWorkspaceChanges', () => {
  it('reports up to date when the cloud head is the one the workspace already has', async () => {
    const outcome = await pullWorkspaceChanges(
      deps({ pullCloud: vi.fn(async () => ({ headCommitId: 'head-1', tree: [], variables: empty })) }),
    )
    expect(outcome).toEqual({ kind: 'upToDate', message: 'upToDate' })
  })

  it('blocks the pull while local changes are not yet committed', async () => {
    const local: LocalCommit = {
      id: 'head-1',
      parentIds: [],
      message: 'x',
      tree: [],
      variables: empty,
      createdAt: '2026-01-01',
      pushed: true,
    }
    const outcome = await pullWorkspaceChanges(
      deps({
        listCommits: vi.fn(async () => [local]),
        tree: [{ id: 'unsaved' } as unknown as ApiNode],
      }),
    )
    expect(outcome).toEqual({ kind: 'blocked', message: 'blocked' })
  })

  it('fast-forwards when nothing local is unpublished', async () => {
    const outcome = await pullWorkspaceChanges(deps())
    expect(outcome.kind).toBe('applied')
    if (outcome.kind !== 'applied') return
    expect(outcome.applied.workspace).toMatchObject({ baseCommitId: 'head-2', localHeadId: 'head-2' })
    expect(outcome.applied.mergeCommit).toBeNull()
  })

  it('creates a merge commit when the local head has moved past the base and nothing conflicts', async () => {
    const outcome = await pullWorkspaceChanges(
      deps({
        workspace: { ...base, localHeadId: 'local-9' },
        listCommits: vi.fn(async () => [
          { id: 'local-9', parentIds: [], message: 'm', tree: [], variables: empty, createdAt: '2026-01-01', pushed: false },
        ]),
      }),
    )
    expect(outcome.kind).toBe('applied')
    if (outcome.kind !== 'applied') return
    expect(outcome.applied.mergeCommit?.parentIds).toEqual(['local-9', 'head-2'])
    expect(outcome.applied.workspace.localHeadId).toBe(outcome.applied.mergeCommit?.id)
  })

  it('reports a failure from the cloud as its message', async () => {
    const outcome = await pullWorkspaceChanges(
      deps({
        pullCloud: vi.fn(async () => {
          throw new Error('Offline')
        }),
      }),
    )
    expect(outcome).toEqual({ kind: 'failed', message: 'Offline' })
  })
})

const requestNode = (name: string): ApiNode => ({ id: 'r', kind: 'request', name, method: 'GET', url: 'https://x.test', body: '' })

// Base, local, and remote all changed the same request in different ways, so the merge cannot decide alone.
const conflictPending: PendingMergeState = {
  remoteHeadId: 'head-2',
  remoteTree: [requestNode('remote')],
  localTree: [requestNode('local')],
  baseTree: [requestNode('base')],
  localHeadId: 'local-1',
  conflicts: [{ id: 'r', local: requestNode('local'), remote: requestNode('remote') }],
  remoteVariables: empty,
  localVariables: empty,
  baseVariables: empty,
  variableConflict: false,
}

function resolveDeps(overrides: Partial<ResolveDeps> = {}): ResolveDeps {
  return {
    pending: conflictPending,
    choices: {},
    workspace: base,
    activeEnvironmentId: null,
    translate,
    saveWorkspace: vi.fn(async () => undefined),
    saveCommit: vi.fn(async () => undefined),
    ...overrides,
  }
}

describe('resolvePendingMerge', () => {
  it('does nothing until every conflict has a choice', async () => {
    const d = resolveDeps()
    expect(await resolvePendingMerge(d)).toEqual({ kind: 'incomplete' })
    expect(d.saveCommit).not.toHaveBeenCalled()
    expect(d.saveWorkspace).not.toHaveBeenCalled()
  })

  it('applies the chosen side and records a merge commit with both heads as parents', async () => {
    const d = resolveDeps({ choices: { r: 'remote' } })
    const outcome = await resolvePendingMerge(d)
    expect(outcome.kind).toBe('resolved')
    if (outcome.kind !== 'resolved') return
    expect(outcome.applied.mergeCommit?.parentIds).toEqual(['local-1', 'head-2'])
    expect(outcome.applied.tree).toEqual([requestNode('remote')])
    expect(d.saveCommit).toHaveBeenCalledTimes(1)
    expect(outcome.applied.workspace.baseCommitId).toBe('head-2')
  })
})
