import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="rounded-lg bg-white p-8 text-center shadow">
      <h1 className="mb-2 text-3xl font-bold">Welcome to KitHuddle</h1>
      <p className="mb-6 text-gray-600">
        Sports kits for you and your whole team.
      </p>
      <Link to="/products" className="rounded bg-blue-600 px-6 py-3 font-medium text-white">
        Start shopping
      </Link>
    </div>
  )
}