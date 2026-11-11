import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import AdminSeed from './pages/admin/AdminSeed'

const Page = ({ title }) => <h1 className="text-2xl font-bold">{title}</h1>

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Page title="Welcome to KitHuddle" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute role="admin"><Admin /></ProtectedRoute>} />
        <Route path="/admin/seed" element={<ProtectedRoute role="admin"><AdminSeed /></ProtectedRoute>} />

        <Route path="*" element={<Page title="Page not found" />} />
      </Route>
    </Routes>
  )
}
