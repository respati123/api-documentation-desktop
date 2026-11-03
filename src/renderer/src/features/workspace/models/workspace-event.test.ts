import { describe, expect, it } from 'vitest'
import { parseWorkspaceEvent } from '@/features/workspace/models/workspace.model'

describe('parseWorkspaceEvent', () => {
  it('reads a workspace.updated event', () => {
    const event = parseWorkspaceEvent(JSON.stringify({ type: 'workspace.updated', workspaceId: 'w1', headCommitId: 'c2', commitCount: 1 }))
    expect(event).toEqual({ type: 'workspace.updated', workspaceId: 'w1', headCommitId: 'c2', commitCount: 1 })
  })

  it('reads a workspace.changed event with its reason', () => {
    const event = parseWorkspaceEvent(JSON.stringify({ type: 'workspace.changed', workspaceId: 'w1', reason: 'deleted' }))
    expect(event).toEqual({ type: 'workspace.changed', workspaceId: 'w1', reason: 'deleted' })
  })

  it('returns null for a malformed or unknown message', () => {
    expect(parseWorkspaceEvent('not json')).toBeNull()
    expect(parseWorkspaceEvent(JSON.stringify({ type: 'something.else' }))).toBeNull()
    expect(parseWorkspaceEvent(JSON.stringify({ type: 'workspace.changed' }))).toBeNull()
  })
})
