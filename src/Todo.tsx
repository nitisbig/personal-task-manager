import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from './Link'
import './index.css'

/* ------------------------------------------------------------------
   Minimal, highly-accessible to-do — the app's home route ("/").
   One flat list you can check off and star. Persisted to
   localStorage so it's instant and works offline, no backend.
   ------------------------------------------------------------------ */

interface Item {
  id: string
  title: string
  done: boolean
  starred: boolean
}

const STORAGE_KEY = 'todo.items.v1'

const seed = (): Item[] => [
  { id: 'a', title: 'Schedule next project meeting', done: false, starred: false },
  { id: 'b', title: 'Give feedback on Tom’s design proposal', done: false, starred: false },
  { id: 'c', title: 'Coffee with Cecilia', done: false, starred: true },
  { id: 'd', title: 'Write doc for upcoming tasks', done: false, starred: false },
  { id: 'e', title: 'Sketch new landing page wireframe', done: false, starred: false },
]

function load(): Item[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed()
    const parsed = JSON.parse(raw) as Item[]
    return Array.isArray(parsed) ? parsed : seed()
  } catch {
    return seed()
  }
}

function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export default function Todo() {
  const [items, setItems] = useState<Item[]>(load)
  const [draft, setDraft] = useState('')
  const liveRef = useRef<HTMLParagraphElement>(null)

  /* persist on every change */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* storage full or blocked — stay in-memory, no crash */
    }
  }, [items])

  const remaining = useMemo(() => items.filter((i) => !i.done).length, [items])

  const announce = (msg: string) => {
    if (liveRef.current) liveRef.current.textContent = msg
  }

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const title = draft.trim()
    if (!title) return
    setItems((prev) => [...prev, { id: newId(), title, done: false, starred: false }])
    setDraft('')
    announce(`Added ${title}`)
  }

  const toggleDone = (id: string) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
    )

  const toggleStar = (id: string) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, starred: !i.starred } : i)),
    )

  const remove = (id: string) => {
    const gone = items.find((i) => i.id === id)
    setItems((prev) => prev.filter((i) => i.id !== id))
    if (gone) announce(`Removed ${gone.title}`)
  }

  const allDone = items.length > 0 && remaining === 0

  return (
    <div className="todo-screen">
      <main className="todo-window" aria-labelledby="todo-title">
        <div className="todo-titlebar">
          <span className="todo-lights" aria-hidden="true">
            <i className="tl tl--r" />
            <i className="tl tl--y" />
            <i className="tl tl--g" />
          </span>
          <span className="todo-status" aria-hidden="true">
            {allDone ? 'Done.' : `${remaining} left`}
          </span>
        </div>

        <div className="todo-body">
          <h1 id="todo-title" className="todo-heading">
            Work
          </h1>

          <form className="todo-add" onSubmit={add}>
            <label htmlFor="todo-new" className="sr-only">
              Add a task
            </label>
            <input
              id="todo-new"
              className="todo-add-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a task…"
              autoComplete="off"
            />
            <button className="todo-add-btn" type="submit" disabled={!draft.trim()}>
              Add
            </button>
          </form>

          <ul className="todo-list" role="list">
            {items.length === 0 && (
              <li className="todo-empty">Nothing here yet — add your first task above.</li>
            )}
            {items.map((item) => (
              <li key={item.id} className={`todo-item${item.done ? ' is-done' : ''}`}>
                <input
                  type="checkbox"
                  className="todo-check"
                  id={`chk-${item.id}`}
                  checked={item.done}
                  onChange={() => toggleDone(item.id)}
                />
                <label className="todo-text" htmlFor={`chk-${item.id}`}>
                  {item.title}
                </label>

                <button
                  type="button"
                  className={`todo-star${item.starred ? ' is-on' : ''}`}
                  aria-pressed={item.starred}
                  aria-label={item.starred ? `Unstar ${item.title}` : `Star ${item.title}`}
                  onClick={() => toggleStar(item.id)}
                >
                  <StarIcon filled={item.starred} />
                </button>

                <button
                  type="button"
                  className="todo-del"
                  aria-label={`Delete ${item.title}`}
                  onClick={() => remove(item.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>

        <p ref={liveRef} className="sr-only" role="status" aria-live="polite" />
      </main>

      <Link to="/dashboard" className="todo-more">
        Open full dashboard →
      </Link>
    </div>
  )
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 17.3 6.2 20.6l1.1-6.5L2.5 9.5l6.5-1L12 2.5l3 6 6.5 1-4.8 4.6 1.1 6.5z" />
    </svg>
  )
}
