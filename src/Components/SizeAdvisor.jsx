import { useState } from 'react'
import { chartFor, recommendSize } from '../services/sizeService'

// Height + weight -> suggested size, plus the product's size chart.
// onPick (optional) is called with the size when the customer taps "Use this size".
export default function SizeAdvisor({ product, onPick }) {
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const chart = chartFor(product)
  if (!chart) return <p className="text-sm text-slate-600">This product has no size chart yet.</p>

  // Not a <form>: the advisor sits inside the squad join form, and a form inside a form
  // would submit the join form (and clear it) when "Find my size" is pressed.
  function handleFind() {
    const h = Number(height)
    const w = Number(weight)
    if (!(h >= 100 && h <= 230)) return setError('Enter your height in cm, e.g. 170.')
    if (!(w >= 25 && w <= 200)) return setError('Enter your weight in kg, e.g. 65.')
    setError('')
    setResult(recommendSize(chart, h, w))
  }

  // Pressing Enter in height/weight finds the size (and never submits the page's form)
  function onEnter(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleFind()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="w-28 text-sm font-semibold text-slate-700">
          Height (cm)
          <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} onKeyDown={onEnter} className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-normal" />
        </label>
        <label className="w-28 text-sm font-semibold text-slate-700">
          Weight (kg)
          <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} onKeyDown={onEnter} className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-normal" />
        </label>
        <button type="button" onClick={handleFind} className="rounded-lg bg-brand-900 px-5 py-2.5 font-semibold text-white">
          Find my size
        </button>
      </div>

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

      {result && (
        <div role="status" className="flex flex-wrap items-center gap-4 rounded-xl bg-brand-50 p-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-xl font-extrabold text-white">{result.size}</span>
          <div className="flex-1">
            <p className="font-bold text-brand-900">We suggest size {result.size}</p>
            <p className="text-sm text-slate-600">{result.note}</p>
          </div>
          {onPick && (
            <button type="button" onClick={() => onPick(result.size)} className="rounded-lg border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700">
              Use this size
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-center text-sm">
          <caption className="mb-2 text-left text-sm font-semibold text-brand-900">Size chart</caption>
          <thead className="bg-slate-50 text-xs text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Size</th>
              <th className="px-3 py-2 font-semibold">Height (cm)</th>
              <th className="px-3 py-2 font-semibold">Weight (kg)</th>
            </tr>
          </thead>
          <tbody>
            {chart.map((row) => (
              <tr key={row.size} className={`border-t border-slate-100 ${result?.size === row.size ? 'bg-brand-50' : ''}`}>
                <td className="px-3 py-2 text-left font-bold text-brand-900">{row.size}</td>
                <td className="px-3 py-2">{row.minHeight}–{row.maxHeight}</td>
                <td className="px-3 py-2">{row.minWeight}–{row.maxWeight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
