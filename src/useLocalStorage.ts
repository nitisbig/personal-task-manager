import { useCallback, useEffect, useState } from 'react'

/**
 * Persist a piece of state to localStorage. Reads once on mount (lazy init)
 * and writes whenever the value changes. Safe against corrupt/missing data.
 */
export function useLocalStorage<T>(
  key: string,
  initial: T | (() => T),
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) return JSON.parse(raw) as T
    } catch {
      // ignore parse errors and fall back to initial
    }
    return initial instanceof Function ? (initial as () => T)() : initial
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage may be full or unavailable; ignore
    }
  }, [key, value])

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => (next instanceof Function ? (next as (p: T) => T)(prev) : next))
  }, [])

  return [value, set]
}

/** Small helper for unique IDs without extra deps. */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}
