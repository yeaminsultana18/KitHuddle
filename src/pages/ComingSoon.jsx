import { Link } from 'react-router-dom'

export default function ComingSoon({ title, text, back = '/' }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl bg-white p-10 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Coming soon</p>
      <h1 className="mt-2 text-3xl font-bold text-brand-900">{title}</h1>
      <p className="mt-3 text-slate-600">{text}</p>
      <Link to={back} className="mt-6 inline-block rounded-xl bg-brand-900 px-6 py-3 font-semibold text-white">
        Go back
      </Link>
    </div>
  )
}
