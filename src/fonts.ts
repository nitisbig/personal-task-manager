/* Font options for the home to-do heading + list. The `key` is what we
   persist to daily_dashboard.settings.todo_font. `google` marks families
   loaded from Google Fonts (see the <link> in index.html); the rest are
   system stacks that need no network. `handwritten` fonts render larger
   (see .todo-body[data-hand] in index.css) since they read small. */

export interface FontOption {
  key: string
  label: string
  /** CSS font-family value applied to the to-do card. */
  stack: string
  /** True when the family comes from Google Fonts. */
  google: boolean
  /** True for the cursive/handwritten group (gets a size bump). */
  handwritten: boolean
}

export const FONTS: FontOption[] = [
  // — handwritten —
  { key: 'caveat', label: 'Caveat', stack: "'Caveat', cursive", google: true, handwritten: true },
  { key: 'patrick-hand', label: 'Patrick Hand', stack: "'Patrick Hand', cursive", google: true, handwritten: true },
  { key: 'shadows-into-light', label: 'Shadows Into Light', stack: "'Shadows Into Light', cursive", google: true, handwritten: true },
  { key: 'gaegu', label: 'Gaegu', stack: "'Gaegu', cursive", google: true, handwritten: true },
  // — major / everyday —
  { key: 'system', label: 'System sans', stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", google: false, handwritten: false },
  { key: 'inter', label: 'Inter', stack: "'Inter', system-ui, sans-serif", google: false, handwritten: false },
  { key: 'serif', label: 'Serif', stack: "Georgia, 'Times New Roman', serif", google: false, handwritten: false },
  { key: 'mono', label: 'Monospace', stack: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", google: false, handwritten: false },
]

export const DEFAULT_FONT = 'caveat'

const byKey = new Map(FONTS.map((f) => [f.key, f]))

/** Look up a font option by key, falling back to the default. */
export function fontFor(key: string): FontOption {
  return byKey.get(key) ?? byKey.get(DEFAULT_FONT)!
}
