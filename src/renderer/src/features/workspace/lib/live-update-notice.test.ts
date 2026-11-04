import { describe, expect, it } from 'vitest'
import { pullNoticeNeeded, pushedByTeammate } from '@/features/workspace/lib/live-update-notice'
import { parseWorkspaceEvent } from '@/features/workspace/models/workspace.model'

describe('pushedByTeammate', () => {
  it('is false for the user’s own push and true for anyone else’s', () => {
    expect(pushedByTeammate({ actorId: 'me' }, 'me')).toBe(false)
    expect(pushedByTeammate({ actorId: 'them' }, 'me')).toBe(true)
    expect(pushedByTeammate({}, 'me')).toBe(true)
    expect(pushedByTeammate({ actorId: 'them' }, null)).toBe(true)
  })
})

describe('pullNoticeNeeded', () => {
  it('does not ask to pull after the user’s own push that was skipped', () => {
    expect(pullNoticeNeeded({ actorId: 'me' }, 'me', 'skipped')).toBe(false)
  })

  it('asks to pull after a teammate’s push that was skipped', () => {
    expect(pullNoticeNeeded({ actorId: 'them' }, 'me', 'skipped')).toBe(true)
  })

  it('asks when the event does not say who pushed, as older servers do', () => {
    expect(pullNoticeNeeded({}, 'me', 'skipped')).toBe(true)
  })

  it('asks when nobody is signed in', () => {
    expect(pullNoticeNeeded({ actorId: 'them' }, null, 'skipped')).toBe(true)
  })

  it('never asks when the copy was updated', () => {
    expect(pullNoticeNeeded({ actorId: 'them' }, 'me', 'background')).toBe(false)
    expect(pullNoticeNeeded({ actorId: 'them' }, 'me', 'active')).toBe(false)
  })
})

describe('parseWorkspaceEvent', () => {
  it('keeps the actor id, so the app can tell whose push it was', () => {
    const event = parseWorkspaceEvent(
      JSON.stringify({
        type: 'workspace.updated',
        workspaceId: 'w1',
        headCommitId: 'c1',
        actorId: 'me',
        actorEmail: 'a@b.c',
        commitCount: 1,
      }),
    )
    expect(event && 'actorId' in event ? event.actorId : undefined).toBe('me')
  })
})
