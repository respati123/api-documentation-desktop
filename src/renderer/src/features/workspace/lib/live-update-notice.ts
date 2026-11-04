export type LiveUpdateResult = 'active' | 'background' | 'skipped'

// A push from anyone but the signed-in user. An event that does not name its sender counts as a teammate's, since it cannot be shown to be the user's own.
export function pushedByTeammate(event: { actorId?: string }, userId: string | null): boolean {
  return event.actorId === undefined || userId === null || event.actorId !== userId
}

// A copy that could not move to a teammate's new head asks for a manual pull. The user's own push does not need that request.
export function pullNoticeNeeded(event: { actorId?: string }, userId: string | null, result: LiveUpdateResult): boolean {
  return result === 'skipped' && pushedByTeammate(event, userId)
}
