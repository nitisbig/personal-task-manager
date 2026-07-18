/* Shared date helpers. Dates are handled as local-time "YYYY-MM-DD" keys
   so a day matches the user's calendar day, not UTC. */

/** Local date → "YYYY-MM-DD" key. */
export function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

/** Today's key in local time. */
export function todayKey(): string {
  return toKey(new Date())
}

/** "YYYY-MM-DD" → e.g. "Saturday, July 18, 2026". */
export function prettyDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Shift a date key by whole days (negative = earlier). */
export function shiftDay(key: string, delta: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + delta)
  return toKey(dt)
}
