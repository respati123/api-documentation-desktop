// True when a copy has commits or edits that the cloud head does not have yet.
// A copy without variables (saved before variables existed) is compared as if both sides were missing.
export function hasUnpushedChanges(copy: {
  localHeadId?: string | null
  baseCommitId?: string | null
  tree: unknown
  baseTree: unknown
  variables?: unknown
  baseVariables?: unknown
}): boolean {
  return (
    (copy.localHeadId ?? null) !== (copy.baseCommitId ?? null) ||
    JSON.stringify(copy.tree) !== JSON.stringify(copy.baseTree) ||
    JSON.stringify(copy.variables) !== JSON.stringify(copy.baseVariables)
  )
}
