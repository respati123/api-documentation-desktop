import { describe, expect, it } from 'vitest'
import { workspacesForAccount } from '@/features/workspace/lib/account-workspaces'

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
  it('gives the first account the device vault that predates accounts', () => {
    const stored = [workspace('legacy-vault')]
    const result = workspacesForAccount(stored, 'account-a', [], newVault('vault-a'))
    expect(result.workspaces.map((item) => item.id)).toEqual(['legacy-vault'])
    expect(result.workspaces[0].accountId).toBe('account-a')
    expect(result.changed.map((item) => item.id)).toEqual(['legacy-vault'])
  })

  it('gives a second account its own empty vault instead of the first account’s vault', () => {
    const stored = [workspace('legacy-vault', { accountId: 'account-a' })]
    const result = workspacesForAccount(stored, 'account-b', [], newVault('vault-b'))
    expect(result.workspaces.map((item) => item.id)).toEqual(['vault-b'])
    expect(result.workspaces[0].accountId).toBe('account-b')
  })

  it('does not show another account’s workspaces', () => {
    const stored = [workspace('mine', { accountId: 'account-a' }), workspace('theirs', { accountId: 'account-b', cloudId: 'cloud-x' })]
    const result = workspacesForAccount(stored, 'account-a', [{ id: 'cloud-x', role: 'editor', headCommitId: 'h1' }], newVault('vault-a'))
    expect(result.workspaces.map((item) => item.id)).toEqual(['mine'])
  })

  it('claims the cloud copy whose role matches what the server lists for this account', () => {
    const stored = [
      workspace('owner-copy', { cloudId: 'cloud-1', role: 'owner' }),
      workspace('editor-copy', { cloudId: 'cloud-1', role: 'editor' }),
      workspace('vault', { accountId: 'account-a' }),
    ]
    const result = workspacesForAccount(stored, 'account-b', [{ id: 'cloud-1', role: 'editor', headCommitId: 'h1' }], newVault('vault-b'))
    const cloudCopies = result.workspaces.filter((item) => item.cloudId === 'cloud-1')
    expect(cloudCopies.map((item) => item.id)).toEqual(['editor-copy'])
    expect(cloudCopies[0].accountId).toBe('account-b')
  })

  it('does not claim a cloud copy the server does not list for this account', () => {
    const stored = [workspace('old-copy', { cloudId: 'cloud-gone', role: 'owner' }), workspace('vault', { accountId: 'account-a' })]
    const result = workspacesForAccount(stored, 'account-a', [], newVault('vault-a'))
    expect(result.workspaces.map((item) => item.id)).toEqual(['vault'])
    expect(result.changed).toEqual([])
  })
})
