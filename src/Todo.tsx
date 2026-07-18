import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Priority, Task, Theme } from './types'
import * as api from './lib/api'
import { prettyDate, todayKey } from './date'
import { DEFAULT_FONT, FONTS, fontFor } from './fonts'
import './index.css'

/* ------------------------------------------------------------------
   Quick to-do — the app's home route ("/"). Bound to *today*: it shows
   the current date, uses the day's Goal as its heading ("my target"),
   and reads/writes the same daily_dashboard.tasks the full dashboard
   uses, so both screens stay in sync. The list font is user-selectable
   and persisted alongside the other settings.
   ------------------------------------------------------------------ */

const NEW_TASK_PRIORITY: Priority = 'medium'

export default function Todo() {
  const today = todayKey()
  const [goal, setGoal] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [theme, setTheme] = useState<Theme>('light')
  const [font, setFont] = useState<string>(DEFAULT_FONT)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const liveRef = useRef<HTMLParagraphElement>(null)

  /* reflect the active theme onto <html> so tokens cascade (shared with dashboard) */
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  /* load settings (theme + font) once */
  useEffect(() => {
    let alive = true
    api
      .fetchSettings()
      .then((s) => {
        if (!alive) return
        setTheme(s.theme)
        setFont(s.font)
      })
      .catch((e) => alive && setError(String(e?.message ?? e)))
    return () => {
      alive = false
    }
  }, [])

  /* load today's goal + tasks */
  useEffect(() => {
    let alive = true
    setLoading(true)
    api
      .fetchDay(today)
      .then((d) => {
        if (!alive) return
        setGoal(d.goal)
        setTasks(d.tasks)
        setError(null)
      })
      .catch((e) => alive && setError(String(e?.message ?? e)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [today])

  const remaining = useMemo(() => tasks.filter((t) => !t.done).length, [tasks])

  const announce = (msg: string) => {
    if (liveRef.current) liveRef.current.textContent = msg
  }

  const add = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const title = draft.trim()
      if (!title) return
      setDraft('')
      try {
        const t = await api.createTask(today, title, NEW_TASK_PRIORITY)
        setTasks((prev) => [t, ...prev])
        announce(`Added ${title}`)
      } catch (err) {
        setError(String((err as Error)?.message ?? err))
      }
    },
    [draft, today],
  )

  const toggleDone = useCallback((id: string) => {
    setTasks((prev) => {
      const target = prev.find((t) => t.id === id)
      if (target) {
        api.setTaskDone(id, !target.done).catch((e) => setError(String(e?.message ?? e)))
      }
      return prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    })
  }, [])

  const remove = useCallback(
    (id: string) => {
      const gone = tasks.find((t) => t.id === id)
      setTasks((prev) => prev.filter((t) => t.id !== id))
      api.deleteTask(id).catch((e) => setError(String(e?.message ?? e)))
      if (gone) announce(`Removed ${gone.title}`)
    },
    [tasks],
  )

  const changeFont = useCallback((key: string) => {
    setFont(key)
    api.saveSettings({ font: key }).catch((e) => setError(String(e?.message ?? e)))
  }, [])

  const allDone = tasks.length > 0 && remaining === 0
  const selected = fontFor(font)
  const target = goal.trim()

  return (
    <div className="todo-screen">
      <main
        className="todo-window"
        aria-labelledby="todo-title"
        style={{ ['--todo-font' as string]: selected.stack }}
      >
        <div className="todo-titlebar">
          <span className="todo-lights" aria-hidden="true">
            <i className="tl tl--r" />
            <i className="tl tl--y" />
            <i className="tl tl--g" />
          </span>
          <span className="todo-status" aria-hidden="true">
            {allDone ? 'Done.' : `${remaining} left`}
          </span>

          <label className="todo-font-picker">
            <span className="sr-only">To-do font</span>
            <select
              className="todo-font-select"
              value={font}
              onChange={(e) => changeFont(e.target.value)}
              aria-label="To-do font"
            >
              <optgroup label="Handwritten">
                {FONTS.filter((f) => f.handwritten).map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Other">
                {FONTS.filter((f) => !f.handwritten).map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
        </div>

        <div className="todo-body" data-hand={selected.handwritten ? '' : undefined}>
          <div className="todo-head">
            <p className="todo-date">{prettyDate(today)}</p>
            <h1 id="todo-title" className="todo-heading">
              {target || 'Set your target for today'}
            </h1>
          </div>

          {error && <p className="todo-error" role="alert">{error}</p>}

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

          <ul className="todo-list" role="list" aria-busy={loading}>
            {!loading && tasks.length === 0 && (
              <li className="todo-empty">Nothing here yet — add your first task above.</li>
            )}
            {tasks.map((task) => (
              <li key={task.id} className={`todo-item${task.done ? ' is-done' : ''}`}>
                <input
                  type="checkbox"
                  className="todo-check"
                  id={`chk-${task.id}`}
                  checked={task.done}
                  onChange={() => toggleDone(task.id)}
                />
                <label className="todo-text" htmlFor={`chk-${task.id}`}>
                  {task.title}
                </label>

                <span className={`badge badge--${task.priority}`}>{task.priority}</span>

                <button
                  type="button"
                  className="todo-del"
                  aria-label={`Delete ${task.title}`}
                  onClick={() => remove(task.id)}
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
