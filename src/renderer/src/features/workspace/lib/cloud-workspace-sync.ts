// Brings the local workspace list in line with the server's cloud list. A cloud-linked workspace the server no longer lists is dropped.
// If the active workspace is dropped, the selection moves to a local workspace. When nothing would remain, the list is left alone.
export function applyCloudList(
  local: LocalWorkspace[],
  cloud: LocalWorkspace[],
  currentId: string,
): { workspaces: LocalWorkspace[]; currentId: string } {
  const workspaces = [...local.filter((item) => !item.cloudId), ...cloud]
  if (!workspaces.length) return { workspaces: local, currentId }
  if (workspaces.some((item) => item.id === currentId)) return { workspaces, currentId }
  const fallback = workspaces.find((item) => !item.cloudId) ?? workspaces[0]
  return { workspaces, currentId: fallback.id }
}
