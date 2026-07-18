import { Routes, Route, Navigate } from 'react-router-dom'
import Todo from './Todo'
import Dashboard from './Dashboard'

/* Route switch. Home ("/") is the quick to-do bound to today; the full
   daily dashboard lives at "/dashboard". Unknown paths fall back home. */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Todo />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
