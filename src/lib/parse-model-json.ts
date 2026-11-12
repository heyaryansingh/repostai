/**
 * Parses a JSON object out of raw model text. Models often wrap the JSON in
 * code fences of any case (```JSON) or add prose before/after it, which broke
 * the old prefix/suffix stripping. Takes the outermost {...} span instead.
 */
export function parseModelJson(text: string): Record<string, unknown> {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) {
    throw new Error('Model response did not contain a JSON object')
  }
  return JSON.parse(text.slice(start, end + 1))
}
