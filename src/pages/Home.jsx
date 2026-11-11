import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="rounded-lg bg-white p-8 text-center shadow">
      <img
        src="/kithuddle-logo.webp"
        alt="KitHuddle"
        className="mx-auto mb-4 h-auto w-full max-w-xs object-contain md:max-w-sm"
      />
      <p className="mb-6 text-gray-600">Sports kits for you and your whole team.</p>
      <Link to="/products" className="inline-block rounded bg-blue-600 px-6 py-3 font-medium text-white">
        Start shopping
      </Link>
    </div>
  )
}