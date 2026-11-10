import { Routes, Route } from 'react-router-dom'

const Page = ({ title }) => <h1 className="p-6 text-2xl font-bold">{title}</h1>

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Page title="Home" />} />
      <Route path="/login" element={<Page title="Login" />} />
      <Route path="/register" element={<Page title="Register" />} />
      <Route path="/profile" element={<Page title="Profile" />} />
      <Route path="*" element={<Page title="Page not found" />} />
    </Routes>
  )
}