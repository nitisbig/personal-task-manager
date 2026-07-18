import { usePath } from './router'
import Todo from './Todo'
import Dashboard from './Dashboard'

/* Route switch. Home ("/") is the minimal to-do; the full
   daily dashboard now lives at "/dashboard". Unknown paths
   fall back to the to-do home. */
export default function App() {
  const path = usePath()

  if (path === '/dashboard') return <Dashboard />
  return <Todo />
}
