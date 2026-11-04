// Fills {placeholders} in a dictionary string. Burmese and English order words
// differently, so sentences with values in them can't be built by concatenation.
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
