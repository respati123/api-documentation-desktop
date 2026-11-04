// Returns the example pretty-printed, or null when it is empty or not valid JSON.
export function formatJsonText(text: string): string | null {
  if (text.trim() === '') return null
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return null
  }
}
