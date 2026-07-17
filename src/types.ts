export type Priority = 'low' | 'medium' | 'high'

export type Theme = 'light' | 'dark'

export interface Task {
  id: string
  title: string
  priority: Priority
  done: boolean
  createdAt: number
}

export interface Plan {
  id: string
  title: string
  time: string // e.g. "09:00"
  note: string
  createdAt: number
}

export interface DayData {
  goal: string
  tasks: Task[]
  plans: Plan[]
  reflection: string
}

export interface Profile {
  name: string
}

export const emptyDay = (): DayData => ({
  goal: '',
  tasks: [],
  plans: [],
  reflection: '',
})
