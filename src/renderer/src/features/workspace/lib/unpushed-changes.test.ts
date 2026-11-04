import { describe, expect, it } from 'vitest'
import { hasUnpushedChanges } from '@/features/workspace/lib/unpushed-changes'
import type { ApiNode } from '@/shared/models/api-node.model'

const base: Parameters<typeof hasUnpushedChanges>[0] = {
  localHeadId: 'head-1',
  baseCommitId: 'head-1',
  tree: [{ id: 'f', kind: 'folder', name: 'Users', children: [] }],
  baseTree: [{ id: 'f', kind: 'folder', name: 'Users', children: [] }],
  variables: { globals: [], environments: [] },
  baseVariables: { globals: [], environments: [] },
}

describe('hasUnpushedChanges', () => {
  it('is false when the copy matches the cloud head', () => {
    expect(hasUnpushedChanges(base)).toBe(false)
  })

  it('is true when local commits are not pushed', () => {
    expect(hasUnpushedChanges({ ...base, localHeadId: 'local-2' })).toBe(true)
  })

  it('is true when the collection was edited', () => {
    expect(hasUnpushedChanges({ ...base, tree: [{ id: 'f', kind: 'folder', name: 'Edited', children: [] }] })).toBe(true)
  })

  it('is true when the variables were edited', () => {
    expect(
      hasUnpushedChanges({ ...base, variables: { globals: [{ id: 'g', name: 'host', value: 'x', secret: false }], environments: [] } }),
    ).toBe(true)
  })

  it('is false when only a secret value differs, because the cloud never stores secret values', () => {
    const shared = { globals: [{ id: 's', name: 'token', value: '', secret: true }], environments: [] }
    const local = { globals: [{ id: 's', name: 'token', value: 'device-secret', secret: true }], environments: [] }

    expect(hasUnpushedChanges({ ...base, variables: local, baseVariables: shared })).toBe(false)
  })

  it('is false when only a local file path differs', () => {
    const fileBody = { id: 'r', kind: 'request', name: 'Upload', method: 'POST', url: 'https://x.test/up', body: '', bodyMode: 'file' }
    const shared = [fileBody as ApiNode]
    const local = [{ ...fileBody, bodyPath: '/home/someone/report.pdf' } as ApiNode]

    expect(hasUnpushedChanges({ ...base, tree: local, baseTree: shared })).toBe(false)
  })

  it('is false when only the local path of a form file field differs', () => {
    const field = { id: 'f', name: 'avatar', value: '', enabled: true, type: 'file', fileName: 'a.png' }
    const request = { id: 'r', kind: 'request', name: 'Form', method: 'POST', url: 'https://x.test/form', body: '', bodyMode: 'form-data' }
    const shared = [{ ...request, bodyFields: [field] } as ApiNode]
    const local = [{ ...request, bodyFields: [{ ...field, filePath: '/home/someone/a.png' }] } as ApiNode]

    expect(hasUnpushedChanges({ ...base, tree: local, baseTree: shared })).toBe(false)
  })

  it('is true when a request URL differs', () => {
    const shared = [{ id: 'r', kind: 'request', name: 'Get', method: 'GET', url: 'https://x.test/a', body: '' } as ApiNode]
    const local = [{ id: 'r', kind: 'request', name: 'Get', method: 'GET', url: 'https://x.test/b', body: '' } as ApiNode]

    expect(hasUnpushedChanges({ ...base, tree: local, baseTree: shared })).toBe(true)
  })

  it('is true when a variable is added', () => {
    const local = { globals: [{ id: 'g2', name: 'region', value: 'id', secret: false }], environments: [] }

    expect(hasUnpushedChanges({ ...base, variables: local })).toBe(true)
  })
})
