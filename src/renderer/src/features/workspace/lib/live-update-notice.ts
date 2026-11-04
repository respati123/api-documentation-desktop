export type LiveUpdateResult = 'active' | 'background' | 'skipped'

// A copy that could not move to a teammate's new head asks for a manual pull. The user's own push does not need that request.
export function pullNoticeNeeded(event: { actorId?: string }, userId: string | null, result: LiveUpdateResult): boolean {
  if (result !== 'skipped') return false
  return event.actorId === undefined || userId === null || event.actorId !== userId
}
