import { describe, expect, it } from 'vitest'
import { applyCloudList } from '@/features/workspace/lib/cloud-workspace-sync'

function workspace(id: string, cloudId: string | null): LocalWorkspace {
  return { id, cloudId, name: id, tree: [], baseTree: [], baseCommitId: null, localHeadId: null }
}

describe('applyCloudList', () => {
  it('keeps local-only workspaces and replaces cloud-linked ones with the server list', () => {
    const local = [workspace('local-default', null), workspace('cloud-a-local', 'cloud-a')]
    const server = [workspace('cloud-a-local', 'cloud-a')]
    const result = applyCloudList(local, server, 'local-default')
    expect(result.workspaces.map((item) => item.id)).toEqual(['local-default', 'cloud-a-local'])
    expect(result.currentId).toBe('local-default')
  })

  it('drops a cloud workspace the server no longer lists, even when the server list is empty', () => {
    const local = [workspace('local-default', null), workspace('testing', 'cloud-t')]
    const result = applyCloudList(local, [], 'local-default')
    expect(result.workspaces.map((item) => item.id)).toEqual(['local-default'])
  })

  it('moves the active selection to a local workspace when the active cloud workspace is dropped', () => {
    const local = [workspace('local-default', null), workspace('testing', 'cloud-t')]
    const result = applyCloudList(local, [], 'testing')
    expect(result.currentId).toBe('local-default')
  })

  it('keeps the active selection when the active workspace is still listed', () => {
    const local = [workspace('local-default', null), workspace('cloud-a-local', 'cloud-a')]
    const result = applyCloudList(local, [workspace('cloud-a-local', 'cloud-a')], 'cloud-a-local')
    expect(result.currentId).toBe('cloud-a-local')
  })

  it('leaves the list alone when nothing would remain', () => {
    const local = [workspace('testing', 'cloud-t')]
    const result = applyCloudList(local, [], 'testing')
    expect(result.workspaces).toBe(local)
    expect(result.currentId).toBe('testing')
  })
})
