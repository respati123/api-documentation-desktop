type ListedCloudWorkspace = { id: string; role: 'owner' | 'editor' | 'viewer'; headCommitId: string | null }

// Decides which stored workspaces this account sees on this device.
// Local workspaces belong to the device, as in Insomnia's Local Vault. Every account sees them, and the device keeps one vault.
// Cloud copies belong to an account. Each one is claimed by the account the server lists it for, preferring the copy whose role matches.
// A cloud copy claimed by another account is left out of the result.
export function workspacesForAccount(
  stored: LocalWorkspace[],
  accountId: string,
  listed: ListedCloudWorkspace[],
  newVault: () => LocalWorkspace,
): { workspaces: LocalWorkspace[]; changed: LocalWorkspace[] } {
  const all = [...stored]
  const changed: LocalWorkspace[] = []

  if (!all.some((item) => !item.cloudId)) {
    const vault = newVault()
    all.push(vault)
    changed.push(vault)
  }

  for (const entry of listed) {
    if (all.some((item) => item.cloudId === entry.id && item.accountId === accountId)) continue
    const candidates = all.filter((item) => !item.accountId && item.cloudId === entry.id)
    const pick = candidates.find((item) => item.role === entry.role) ?? candidates[0]
    if (!pick) continue
    const claimed = { ...pick, accountId }
    all[all.findIndex((other) => other.id === pick.id)] = claimed
    changed.push(claimed)
  }

  return { workspaces: all.filter((item) => !item.cloudId || item.accountId === accountId), changed }
}
