import { supabase } from './supabase'
import type { DayData, Plan, Priority, Task, Theme } from '../types'
import { emptyDay } from '../types'

/* ---------- row types (snake_case, as stored) ---------- */

interface TaskRow {
  id: string
  day_date: string
  title: string
  priority: Priority
  done: boolean
  created_at: string
}

interface PlanRow {
  id: string
  day_date: string
  title: string
  time: string
  note: string
  created_at: string
}

const toTask = (r: TaskRow): Task => ({
  id: r.id,
  title: r.title,
  priority: r.priority,
  done: r.done,
  createdAt: Date.parse(r.created_at),
})

const toPlan = (r: PlanRow): Plan => ({
  id: r.id,
  title: r.title,
  time: r.time,
  note: r.note,
  createdAt: Date.parse(r.created_at),
})

/* ---------- settings (profile name + theme) ---------- */

export interface Settings {
  name: string
  theme: Theme
}

export async function fetchSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .select('name, theme')
    .eq('id', 1)
    .single()
  if (error) throw error
  return { name: data.name, theme: data.theme as Theme }
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', 1)
  if (error) throw error
}

/* ---------- days ---------- */

/** Make sure the day row exists before inserting child rows (FK requirement). */
async function ensureDay(date: string): Promise<void> {
  const { error } = await supabase
    .from('days')
    .upsert({ date }, { onConflict: 'date', ignoreDuplicates: true })
  if (error) throw error
}

export async function fetchDay(date: string): Promise<DayData> {
  const [dayRes, tasksRes, plansRes] = await Promise.all([
    supabase.from('days').select('goal, reflection').eq('date', date).maybeSingle(),
    supabase.from('tasks').select('*').eq('day_date', date).order('created_at', { ascending: false }),
    supabase.from('plans').select('*').eq('day_date', date).order('time', { ascending: true }),
  ])
  if (dayRes.error) throw dayRes.error
  if (tasksRes.error) throw tasksRes.error
  if (plansRes.error) throw plansRes.error

  const base = emptyDay()
  return {
    goal: dayRes.data?.goal ?? base.goal,
    reflection: dayRes.data?.reflection ?? base.reflection,
    tasks: (tasksRes.data as TaskRow[]).map(toTask),
    plans: (plansRes.data as PlanRow[]).map(toPlan),
  }
}

export async function saveDayField(
  date: string,
  patch: { goal?: string; reflection?: string },
): Promise<void> {
  const { error } = await supabase
    .from('days')
    .upsert(
      { date, ...patch, updated_at: new Date().toISOString() },
      { onConflict: 'date' },
    )
  if (error) throw error
}

/* ---------- tasks ---------- */

export async function createTask(
  date: string,
  title: string,
  priority: Priority,
): Promise<Task> {
  await ensureDay(date)
  const { data, error } = await supabase
    .from('tasks')
    .insert({ day_date: date, title, priority })
    .select('*')
    .single()
  if (error) throw error
  return toTask(data as TaskRow)
}

export async function setTaskDone(id: string, done: boolean): Promise<void> {
  const { error } = await supabase.from('tasks').update({ done }).eq('id', id)
  if (error) throw error
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

/* ---------- plans ---------- */

export async function createPlan(
  date: string,
  title: string,
  time: string,
  note: string,
): Promise<Plan> {
  await ensureDay(date)
  const { data, error } = await supabase
    .from('plans')
    .insert({ day_date: date, title, time, note })
    .select('*')
    .single()
  if (error) throw error
  return toPlan(data as PlanRow)
}

export async function deletePlan(id: string): Promise<void> {
  const { error } = await supabase.from('plans').delete().eq('id', id)
  if (error) throw error
}
