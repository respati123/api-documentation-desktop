// True when a copy has commits or edits that the cloud head does not have yet.
export function hasUnpushedChanges(copy: {
  localHeadId: string | null
  baseCommitId: string | null
  tree: unknown
  baseTree: unknown
  variables: unknown
  baseVariables: unknown
}): boolean {
  return (
    copy.localHeadId !== copy.baseCommitId ||
    JSON.stringify(copy.tree) !== JSON.stringify(copy.baseTree) ||
    JSON.stringify(copy.variables) !== JSON.stringify(copy.baseVariables)
  )
}
