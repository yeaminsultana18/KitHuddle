import { useState } from 'react'
import { seedDatabase } from '../../seed/seedData'

export default function AdminSeed() {
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSeed() {
    setBusy(true)
    setStatus('')
    try {
      const n = await seedDatabase()
      setStatus(`Done: ${n.categories} categories and ${n.products} products saved.`)
    } catch (err) {
      setStatus(`Failed: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow">
      <h1 className="mb-2 text-2xl font-semibold">Seed sample data</h1>
      <p className="mb-4 text-sm text-gray-600">
        Saves 3 categories and 12 products. Running it again resets them to the sample values.
      </p>
      <button
        onClick={handleSeed}
        disabled={busy}
        className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {busy ? 'Saving...' : 'Seed the database'}
      </button>
      {status && <p className="mt-4 text-sm">{status}</p>}
    </div>
  )
}