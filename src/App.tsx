import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DayData, Plan, Priority, Profile, Task, Theme } from './types'
import { emptyDay } from './types'
import * as api from './lib/api'
import './index.css'

/* ---------- date helpers ---------- */

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

function prettyDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function shiftDay(key: string, delta: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + delta)
  return toKey(dt)
}

/* ---------- app ---------- */

export default function App() {
  const todayKey = toKey(new Date())
  const [profile, setProfile] = useState<Profile>({ name: '' })
  const [theme, setTheme] = useState<Theme>('light')
  const [activeDate, setActiveDate] = useState(todayKey)
  const [day, setDay] = useState<DayData>(emptyDay)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* reflect the active theme onto <html> so tokens cascade to everything */
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  /* load global settings (profile + theme) once on mount */
  useEffect(() => {
    let alive = true
    api
      .fetchSettings()
      .then((s) => {
        if (!alive) return
        setProfile({ name: s.name })
        setTheme(s.theme)
      })
      .catch((e) => alive && setError(String(e?.message ?? e)))
    return () => {
      alive = false
    }
  }, [])

  /* load the active day whenever it changes */
  useEffect(() => {
    let alive = true
    setLoading(true)
    api
      .fetchDay(activeDate)
      .then((d) => {
        if (!alive) return
        setDay(d)
        setError(null)
      })
      .catch((e) => alive && setError(String(e?.message ?? e)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [activeDate])

  /* settings mutations (optimistic, persisted in background) */
  const updateName = useCallback((name: string) => {
    setProfile({ name })
    api.saveSettings({ name }).catch((e) => setError(String(e?.message ?? e)))
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'light' ? 'dark' : 'light'
      api.saveSettings({ theme: next }).catch((e) => setError(String(e?.message ?? e)))
      return next
    })
  }, [])

  /* goal / reflection: optimistic local update, debounce-free persist on change */
  const saveGoal = useCallback(
    (goal: string) => {
      setDay((d) => ({ ...d, goal }))
      api.saveDayField(activeDate, { goal }).catch((e) => setError(String(e?.message ?? e)))
    },
    [activeDate],
  )
  const saveReflection = useCallback(
    (reflection: string) => {
      setDay((d) => ({ ...d, reflection }))
      api
        .saveDayField(activeDate, { reflection })
        .catch((e) => setError(String(e?.message ?? e)))
    },
    [activeDate],
  )

  /* task actions */
  const addTask = useCallback(
    async (title: string, priority: Priority) => {
      try {
        const t = await api.createTask(activeDate, title, priority)
        setDay((d) => ({ ...d, tasks: [t, ...d.tasks] }))
      } catch (e) {
        setError(String((e as Error)?.message ?? e))
      }
    },
    [activeDate],
  )
  const toggleTask = useCallback((id: string) => {
    setDay((d) => {
      const target = d.tasks.find((t) => t.id === id)
      if (target) {
        api.setTaskDone(id, !target.done).catch((e) => setError(String(e?.message ?? e)))
      }
      return { ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }
    })
  }, [])
  const removeTask = useCallback((id: string) => {
    setDay((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }))
    api.deleteTask(id).catch((e) => setError(String(e?.message ?? e)))
  }, [])

  /* plan actions */
  const addPlan = useCallback(
    async (title: string, time: string, note: string) => {
      try {
        const p = await api.createPlan(activeDate, title, time, note)
        setDay((d) => ({
          ...d,
          plans: [...d.plans, p].sort((a, b) => a.time.localeCompare(b.time)),
        }))
      } catch (e) {
        setError(String((e as Error)?.message ?? e))
      }
    },
    [activeDate],
  )
  const removePlan = useCallback((id: string) => {
    setDay((d) => ({ ...d, plans: d.plans.filter((p) => p.id !== id) }))
    api.deletePlan(id).catch((e) => setError(String(e?.message ?? e)))
  }, [])

  /* stats */
  const stats = useMemo(() => {
    const total = day.tasks.length
    const done = day.tasks.filter((t) => t.done).length
    const pct = total === 0 ? 0 : Math.round((done / total) * 100)
    const highOpen = day.tasks.filter((t) => !t.done && t.priority === 'high').length
    return { total, done, pct, highOpen, plans: day.plans.length }
  }, [day])

  const isToday = activeDate === todayKey
  const displayName = profile.name.trim()

  return (
    <div className="app">
      <Sidebar stats={stats} profile={profile} onName={updateName} />

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">{greeting()}{displayName ? `, ${displayName}` : ''}</p>
            <h1 className="page-title">Daily Dashboard</h1>
          </div>
          <div className="topbar-actions">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <div className="date-nav">
              <button className="nav-btn" onClick={() => setActiveDate((k) => shiftDay(k, -1))} aria-label="Previous day">‹</button>
              <div className="date-pill">
                <span className="date-main">{prettyDate(activeDate)}</span>
                {!isToday && (
                  <button className="date-today" onClick={() => setActiveDate(todayKey)}>
                    Jump to today
                  </button>
                )}
              </div>
              <button className="nav-btn" onClick={() => setActiveDate((k) => shiftDay(k, 1))} aria-label="Next day">›</button>
            </div>
          </div>
        </header>

        {error && <div className="banner banner--error">{error}</div>}

        <section className="grid" aria-busy={loading}>
          <GoalCard value={day.goal} onChange={saveGoal} />
          <TasksCard
            tasks={day.tasks}
            onAdd={addTask}
            onToggle={toggleTask}
            onRemove={removeTask}
            pct={stats.pct}
          />
          <PlansCard plans={day.plans} onAdd={addPlan} onRemove={removePlan} />
          <ReflectionCard value={day.reflection} onChange={saveReflection} />
        </section>
      </main>
    </div>
  )
}

/* ---------- theme toggle ---------- */

function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {isDark ? <MoonIcon /> : <SunIcon />}
      </span>
      <span className="theme-toggle-label">{isDark ? 'Dark' : 'Light'}</span>
    </button>
  )
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

/* ---------- sidebar ---------- */

function Sidebar({
  stats,
  profile,
  onName,
}: {
  stats: { total: number; done: number; pct: number; highOpen: number; plans: number }
  profile: Profile
  onName: (name: string) => void
}) {
  const initials =
    profile.name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase()

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
          </svg>
        </div>
        <span className="brand-name">Momentum</span>
      </div>

      <div className="profile">
        <div className="avatar">
          {initials || (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
            </svg>
          )}
        </div>
        <input
          className="name-input"
          placeholder="Your name"
          value={profile.name}
          onChange={(e) => onName(e.target.value)}
          maxLength={32}
        />
      </div>

      <div className="ring-wrap">
        <ProgressRing pct={stats.pct} />
        <p className="ring-caption">
          {stats.done} of {stats.total} tasks done
        </p>
      </div>

      <div className="stat-list">
        <Stat label="Completion" value={`${stats.pct}%`} />
        <Stat label="Open tasks" value={stats.total - stats.done} />
        <Stat label="High priority" value={stats.highOpen} accent={stats.highOpen > 0} />
        <Stat label="Planned items" value={stats.plans} />
      </div>

      <p className="saved-note">Synced to your Supabase workspace</p>
    </aside>
  )
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className={`stat-value${accent ? ' is-accent' : ''}`}>{value}</span>
    </div>
  )
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 52
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c
  return (
    <svg className="ring" viewBox="0 0 120 120" width="120" height="120">
      <circle className="ring-bg" cx="60" cy="60" r={r} />
      <circle
        className="ring-fg"
        cx="60"
        cy="60"
        r={r}
        strokeDasharray={c}
        strokeDashoffset={offset}
      />
      <text x="60" y="66" textAnchor="middle" className="ring-text">
        {pct}%
      </text>
    </svg>
  )
}

/* ---------- cards ---------- */

function Card({
  title,
  subtitle,
  span,
  children,
}: {
  title: string
  subtitle?: string
  span?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`card${span ? ' card--wide' : ''}`}>
      <div className="card-head">
        <h2 className="card-title">{title}</h2>
        {subtitle && <span className="card-sub">{subtitle}</span>}
      </div>
      {children}
    </div>
  )
}

function GoalCard({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Card title="Today's Goal" subtitle="Your one thing">
      <textarea
        className="goal-input"
        placeholder="What's the single most important outcome for today?"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
    </Card>
  )
}

function TasksCard({
  tasks,
  onAdd,
  onToggle,
  onRemove,
  pct,
}: {
  tasks: Task[]
  onAdd: (title: string, p: Priority) => void
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  pct: number
}) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    onAdd(t, priority)
    setTitle('')
    setPriority('medium')
  }

  return (
    <Card title="Tasks" subtitle={`${tasks.filter((t) => t.done).length}/${tasks.length}`} span>
      <form className="task-form" onSubmit={submit}>
        <input
          className="task-input"
          placeholder="Add a task and press Enter…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          className="prio-select"
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          aria-label="Priority"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button className="add-btn" type="submit">Add</button>
      </form>

      <div className="progress-bar" aria-hidden>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <ul className="task-list">
        {tasks.length === 0 && <li className="empty">No tasks yet — add your first above.</li>}
        {tasks.map((t) => (
          <li key={t.id} className={`task${t.done ? ' is-done' : ''}`}>
            <button
              className="check"
              onClick={() => onToggle(t.id)}
              aria-label={t.done ? 'Mark incomplete' : 'Mark complete'}
            >
              {t.done ? '✓' : ''}
            </button>
            <span className="task-title">{t.title}</span>
            <span className={`badge badge--${t.priority}`}>{t.priority}</span>
            <button className="del" onClick={() => onRemove(t.id)} aria-label="Delete task">
              ×
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function PlansCard({
  plans,
  onAdd,
  onRemove,
}: {
  plans: Plan[]
  onAdd: (title: string, time: string, note: string) => void
  onRemove: (id: string) => void
}) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('09:00')
  const [note, setNote] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    onAdd(t, time, note.trim())
    setTitle('')
    setNote('')
  }

  return (
    <Card title="Schedule & Plan" subtitle="Time-blocked">
      <form className="plan-form" onSubmit={submit}>
        <div className="plan-row">
          <input
            className="plan-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            aria-label="Time"
          />
          <input
            className="plan-title"
            placeholder="Block title (e.g. Deep work)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="plan-row">
          <input
            className="plan-note"
            placeholder="Optional note…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button className="add-btn" type="submit">Add</button>
        </div>
      </form>

      <ul className="timeline">
        {plans.length === 0 && <li className="empty">Plan your day in blocks.</li>}
        {plans.map((p) => (
          <li key={p.id} className="tl-item">
            <span className="tl-time">{p.time}</span>
            <span className="tl-dot" />
            <div className="tl-body">
              <span className="tl-title">{p.title}</span>
              {p.note && <span className="tl-note">{p.note}</span>}
            </div>
            <button className="del" onClick={() => onRemove(p.id)} aria-label="Delete plan">
              ×
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function ReflectionCard({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Card title="Reflection & Notes" subtitle="End of day">
      <textarea
        className="reflect-input"
        placeholder="What went well? What would you change tomorrow?"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
      />
    </Card>
  )
}
