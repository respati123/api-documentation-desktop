import { describe, expect, it } from 'vitest'
import { hasUnpushedChanges } from '@/features/workspace/lib/unpushed-changes'

const base = {
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
})
