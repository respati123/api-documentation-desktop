import type { WorkspaceChange } from '@/lib/workspace-changes'

// One-letter code shown on a change badge. Untracked is U, deleted is D, and anything else reads as modified.
export function changeStatusCode(status?: WorkspaceChange['status']): string {
  return status === 'added' ? 'U' : status === 'deleted' ? 'D' : 'M'
}

// The locale key for the status word. A ViewModel translates it, so no view holds the English text.
export function changeStatusKey(status?: WorkspaceChange['status']): string {
  return status === 'added' ? 'changes.untracked' : status === 'deleted' ? 'changes.deleted' : 'changes.modified'
}
