import { useEffect, useState } from 'react'
import { addCategory, deleteCategory, getCategories, getProducts, renameCategory } from '../../services/productService'
import { authErrorMessage } from '../../services/authService'

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [counts, setCounts] = useState({}) // how many products each category has
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  function load() {
    return Promise.all([getCategories(), getProducts()])
      .then(([cats, products]) => {
        const c = {}
        products.forEach((p) => (c[p.categoryId] = (c[p.categoryId] || 0) + 1))
        setCategories(cats)
        setCounts(c)
      })
      .catch(() => setMessage({ type: 'error', text: 'Could not load the categories.' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  // Our own messages have no code; Firebase errors do
  const errorText = (err) => (err.code ? authErrorMessage(err) : err.message)

  async function handleAdd(e) {
    e.preventDefault()
    setMessage(null)
    setBusy(true)
    try {
      await addCategory(name)
      setMessage({ type: 'success', text: `${name.trim()} added.` })
      setName('')
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: errorText(err) })
    } finally {
      setBusy(false)
    }
  }

  async function handleRename(category) {
    const newName = window.prompt('New name for this category:', category.name)
    if (!newName || !newName.trim() || newName.trim() === category.name) return
    setMessage(null)
    try {
      await renameCategory(category.id, newName)
      setMessage({ type: 'success', text: `Renamed to ${newName.trim()}.` })
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: errorText(err) })
    }
  }

  async function handleDelete(category) {
    if (counts[category.id] > 0) {
      setMessage({ type: 'error', text: `${category.name} still has products. Move or delete them first.` })
      return
    }
    if (!window.confirm(`Delete the ${category.name} category?`)) return
    setMessage(null)
    try {
      await deleteCategory(category.id)
      setMessage({ type: 'success', text: `${category.name} deleted.` })
      await load()
    } catch (err) {
      setMessage({ type: 'error', text: errorText(err) })
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Categories</h1>
        <p className="text-sm text-slate-600">A category with products in it cannot be deleted. Move or delete its products first.</p>
      </div>

      {message && (
        <p role="alert" className={`rounded-lg p-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>
          {message.text}
        </p>
      )}

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5">
        <label className="min-w-64 flex-1 text-sm font-semibold text-slate-700">
          New category name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Basketball"
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 font-normal"
          />
        </label>
        <button disabled={busy || !name.trim()} className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white disabled:opacity-60">
          {busy ? 'Adding...' : 'Add category'}
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Link</th>
              <th className="px-5 py-3 font-semibold">Products</th>
              <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="4" className="px-5 py-4 text-slate-500">Loading...</td></tr>
            )}
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 last:border-0">
                <td className="px-5 py-3 font-semibold">{c.name}</td>
                <td className="px-5 py-3 text-slate-600">/category/{c.id}</td>
                <td className="px-5 py-3">{counts[c.id] || 0}</td>
                <td className="whitespace-nowrap px-5 py-3 text-right">
                  <button onClick={() => handleRename(c)} className="rounded-lg border border-slate-300 px-3 py-1.5 hover:border-brand-600">
                    Rename
                  </button>
                  <button onClick={() => handleDelete(c)} className="ml-2 rounded-lg border border-red-200 px-3 py-1.5 text-red-700 hover:bg-red-50">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
