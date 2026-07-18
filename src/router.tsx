import { useSyncExternalStore } from 'react'

/* ------------------------------------------------------------------
   Tiny history-based router — no dependencies.
   Exposes the current pathname as a reactive value and a `navigate`
   helper for programmatic pushes. The accessible <Link> component
   lives in ./Link so this module stays hook/util-only.
   ------------------------------------------------------------------ */

function subscribe(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange)
  window.addEventListener('app:navigate', onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener('app:navigate', onChange)
  }
}

function getPath(): string {
  return window.location.pathname || '/'
}

/** Reactive current pathname. Re-renders on back/forward and navigate(). */
export function usePath(): string {
  return useSyncExternalStore(subscribe, getPath, () => '/')
}

/** Push a new path without reloading the page. */
export function navigate(to: string): void {
  if (to === getPath()) return
  window.history.pushState({}, '', to)
  window.dispatchEvent(new Event('app:navigate'))
}
