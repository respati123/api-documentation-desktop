import { describe, expect, it } from 'vitest'
import { visibleToAccount, workspacesForAccount } from '@/features/workspace/lib/account-workspaces'

function workspace(id: string, patch: Partial<LocalWorkspace> = {}): LocalWorkspace {
  return {
    id,
    cloudId: null,
    name: id,
    tree: [],
    baseTree: [],
    baseCommitId: null,
    localHeadId: null,
    accountId: null,
    ...patch,
  }
}

const newVault = (id: string) => () => workspace(id, { name: 'My workspace' })

describe('workspacesForAccount', () => {
  it('creates one device vault when the device has none', () => {
    const result = workspacesForAccount([], 'account-a', [], newVault('vault'))
    expect(result.workspaces.map((item) => item.id)).toEqual(['vault'])
    expect(result.changed.map((item) => item.id)).toEqual(['vault'])
  })

  it('shows the same device vault to every account, and does not create another', () => {
    const stored = [workspace('vault', { accountId: 'account-a' })]
    const forA = workspacesForAccount(stored, 'account-a', [], newVault('vault-b'))
    const forB = workspacesForAccount(stored, 'account-b', [], newVault('vault-b'))
    expect(forA.workspaces.map((item) => item.id)).toEqual(['vault'])
    expect(forB.workspaces.map((item) => item.id)).toEqual(['vault'])
    expect(forB.changed).toEqual([])
  })

  it('does not show another account’s cloud copy', () => {
    const stored = [workspace('vault'), workspace('theirs', { accountId: 'account-b', cloudId: 'cloud-x' })]
    const result = workspacesForAccount(stored, 'account-a', [{ id: 'cloud-x', role: 'editor', headCommitId: 'h1' }], newVault('vault-a'))
    expect(result.workspaces.map((item) => item.id)).toEqual(['vault'])
  })

  it('claims the cloud copy whose role matches what the server lists for this account', () => {
    const stored = [
      workspace('vault'),
      workspace('owner-copy', { cloudId: 'cloud-1', role: 'owner' }),
      workspace('editor-copy', { cloudId: 'cloud-1', role: 'editor' }),
    ]
    const result = workspacesForAccount(stored, 'account-b', [{ id: 'cloud-1', role: 'editor', headCommitId: 'h1' }], newVault('vault-b'))
    const cloudCopies = result.workspaces.filter((item) => item.cloudId === 'cloud-1')
    expect(cloudCopies.map((item) => item.id)).toEqual(['editor-copy'])
    expect(cloudCopies[0].accountId).toBe('account-b')
  })

  it('does not claim a cloud copy the server does not list for this account', () => {
    const stored = [workspace('vault'), workspace('old-copy', { cloudId: 'cloud-gone', role: 'owner' })]
    const result = workspacesForAccount(stored, 'account-a', [], newVault('vault-a'))
    expect(result.workspaces.map((item) => item.id)).toEqual(['vault'])
    expect(result.changed).toEqual([])
  })
})

describe('visibleToAccount', () => {
  const records = [
    workspace('local'),
    workspace('cloud-a', { cloudId: 'c-a', accountId: 'account-a' }),
    workspace('cloud-b', { cloudId: 'c-b', accountId: 'account-b' }),
    workspace('cloud-legacy', { cloudId: 'c-l', accountId: null }),
  ]

  it('shows only local workspaces when nobody is signed in, so no other account’s cloud copy is visible', () => {
    expect(visibleToAccount(records, null).map((item) => item.id)).toEqual(['local'])
  })

  it('shows the local workspaces and only the signed-in account’s own cloud copies', () => {
    expect(visibleToAccount(records, 'account-a').map((item) => item.id)).toEqual(['local', 'cloud-a'])
  })

  it('does not show a legacy cloud copy with no account until it is claimed', () => {
    expect(visibleToAccount(records, 'account-b').map((item) => item.id)).not.toContain('cloud-legacy')
  })
})
