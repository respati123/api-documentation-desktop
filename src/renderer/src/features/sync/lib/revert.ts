import type { PullOutcome } from '@/features/sync/workflows/pull-workflow'

// A revert is finished when the pull that follows it applied the new head, or found nothing to do.
export function revertSucceeded(kind: PullOutcome['kind']): boolean {
  return kind === 'applied' || kind === 'upToDate'
}

// Reverting to the commit that is already the head would create an empty commit, so it is refused.
export function canRevertTo(commitId: string, headCommitId: string | null): boolean {
  return commitId !== headCommitId
}
