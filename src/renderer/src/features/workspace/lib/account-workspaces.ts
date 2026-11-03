type ListedCloudWorkspace = { id: string; role: 'owner' | 'editor' | 'viewer'; headCommitId: string | null }

// Decides which stored local workspaces belong to an account on this device.
// A workspace with no accountId was saved before accounts existed. The first account that signs in claims it.
// Each cloud copy is claimed by the account the server lists it for, preferring the copy whose role matches.
// Copies claimed by another account are left out of the result.
export function workspacesForAccount(
  stored: LocalWorkspace[],
  accountId: string,
  listed: ListedCloudWorkspace[],
  newVault: () => LocalWorkspace,
): { workspaces: LocalWorkspace[]; changed: LocalWorkspace[] } {
  const all = [...stored]
  const changed: LocalWorkspace[] = []
  const mine = () => all.filter((item) => item.accountId === accountId)
  const claim = (item: LocalWorkspace) => {
    const next = { ...item, accountId }
    all[all.findIndex((other) => other.id === item.id)] = next
    changed.push(next)
  }

  if (!mine().some((item) => !item.cloudId)) {
    const legacyVault = all.find((item) => !item.accountId && !item.cloudId)
    if (legacyVault) claim(legacyVault)
    else {
      const vault = { ...newVault(), accountId }
      all.push(vault)
      changed.push(vault)
    }
  }

  for (const entry of listed) {
    if (mine().some((item) => item.cloudId === entry.id)) continue
    const candidates = all.filter((item) => !item.accountId && item.cloudId === entry.id)
    const pick = candidates.find((item) => item.role === entry.role) ?? candidates[0]
    if (pick) claim(pick)
  }

  return { workspaces: mine(), changed }
}

// A copy needs a pull when the server has a newer head and the copy has no unpushed commits or edits.
export function needsPull(copy: LocalWorkspace, headCommitId: string | null): boolean {
  if (!headCommitId || copy.baseCommitId === headCommitId) return false
  const hasUnpushedCommits = copy.localHeadId !== copy.baseCommitId
  const hasEdits = JSON.stringify(copy.tree) !== JSON.stringify(copy.baseTree)
  return !hasUnpushedCommits && !hasEdits
}
