// The name for a copy of a request: "<name>-Copy", then "<name>-Copy-1", "<name>-Copy-2", and so on, skipping names that a sibling already uses.
export function copyName(name: string, siblingNames: readonly string[]): string {
  const taken = new Set(siblingNames)
  const first = `${name}-Copy`
  if (!taken.has(first)) return first
  let number = 1
  while (taken.has(`${name}-Copy-${number}`)) number += 1
  return `${name}-Copy-${number}`
}
