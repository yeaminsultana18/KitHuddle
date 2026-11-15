import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const CATEGORIES = [
  { id: 'football', name: 'Football' },
  { id: 'cricket', name: 'Cricket' },
  { id: 'running', name: 'Running' },
]

const input = 'w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-normal'

export default function FilterPanel({ onClose }) {
  const [params] = useSearchParams()
  const [cats, setCats] = useState(params.get('cats')?.split(',').filter(Boolean) || [])
  const [min, setMin] = useState(params.get('min') || '')
  const [max, setMax] = useState(params.get('max') || '')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const toggle = (id) => setCats(cats.includes(id) ? cats.filter((c) => c !== id) : [...cats, id])

  function apply(e) {
    e.preventDefault()
    if (min !== '' && max !== '' && Number(min) > Number(max)) {
      return setError('The minimum price is higher than the maximum price.')
    }
    const query = new URLSearchParams()
    if (cats.length) query.set('cats', cats.join(','))
    if (min !== '') query.set('min', min)
    if (max !== '') query.set('max', max)
    onClose()
    navigate(`/products?${query.toString()}`)
  }

  function clear() {
    setCats([])
    setMin('')
    setMax('')
    setError('')
  }

  return (
    <div className="border-t border-gray-200 bg-white shadow-lg">
      <form onSubmit={apply} className="mx-auto grid max-w-[1400px] gap-5 px-4 py-5 md:grid-cols-4 md:items-end md:px-7">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-700">Category</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <label
                key={c.id}
                className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                  cats.includes(c.id) ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-300'
                }`}
              >
                <input type="checkbox" checked={cats.includes(c.id)} onChange={() => toggle(c.id)} className="accent-brand-600" />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="text-sm font-semibold text-slate-700">
          Min price (৳)
          <input type="number" min="0" value={min} onChange={(e) => setMin(e.target.value)} className={`mt-2 ${input}`} />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Max price (৳)
          <input type="number" min="0" value={max} onChange={(e) => setMax(e.target.value)} className={`mt-2 ${input}`} />
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={clear} className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-sm">
            Clear
          </button>
          <button className="flex-[2] rounded-lg bg-brand-900 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
            Show results
          </button>
        </div>
        {error && <p className="text-sm text-red-600 md:col-span-4">{error}</p>}
      </form>
    </div>
  )
}
