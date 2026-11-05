// Replaces every secret value in a text with <secret>. Longer values go first, so a value that contains a shorter one is not cut in two.
export function redactSecrets(text: string, secretValues: readonly string[]): string {
  const values = secretValues.filter((value) => value.length > 0).sort((a, b) => b.length - a.length)
  let redacted = text
  for (const value of values) redacted = redacted.split(value).join('<secret>')
  return redacted
}
