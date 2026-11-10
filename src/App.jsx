import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'

const Page = ({ title }) => <h1 className="text-2xl font-bold">{title}</h1>

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Page title="Welcome to KitHuddle" />} />
        <Route path="/login" element={<Page title="Login" />} />
        <Route path="/register" element={<Page title="Register" />} />
        <Route path="/profile" element={<Page title="Profile" />} />
        <Route path="/admin" element={<Page title="Admin" />} />
        <Route path="*" element={<Page title="Page not found" />} />
      </Route>
    </Routes>
  )
}