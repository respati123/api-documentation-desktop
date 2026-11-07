import { describe, expect, it } from 'vitest'
import { getWorkspaceChanges } from '@/lib/workspace-changes'
import type { ApiNode, FolderNode, RequestNode } from '@/shared/models/api-node.model'

const request = (id: string, name: string, method: string, url: string): RequestNode => ({
  id,
  kind: 'request',
  name,
  method,
  url,
  body: '',
})
const folder = (id: string, name: string, children: ApiNode[]): FolderNode => ({ id, kind: 'folder', name, children })

describe('getWorkspaceChanges', () => {
  it('says the method and the folder of a changed request', () => {
    const before = [folder('users', 'Users', [request('r', 'Get list', 'GET', '/users')])]
    const after = [folder('users', 'Users', [request('r', 'Get list', 'GET', '/users?page=1')])]
    expect(getWorkspaceChanges(before, after)).toEqual([{ id: 'r', name: 'Get list', status: 'modified', method: 'GET', folder: 'Users' }])
  })

  it('keeps the folder of a deleted request, from the tree it was in', () => {
    const before = [folder('users', 'Users', [request('r', 'Get list', 'DELETE', '/users')])]
    expect(getWorkspaceChanges(before, [folder('users', 'Users', [])])).toEqual([
      { id: 'r', name: 'Get list', status: 'deleted', method: 'DELETE', folder: 'Users' },
    ])
  })

  it('gives a top-level folder no method and no parent folder', () => {
    expect(getWorkspaceChanges([], [folder('users', 'Users', [])])).toEqual([{ id: 'users', name: 'Users', status: 'added' }])
  })
})
