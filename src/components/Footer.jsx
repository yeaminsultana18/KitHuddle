import { Link } from 'react-router-dom'

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      ['Football', '/category/football'],
      ['Cricket', '/category/cricket'],
    ],
  },
  {
    title: 'Information',
    links: [
      ['Size guide', '/size-guide'],
      ['Squad orders', '/squad-orders'],
      ['New arrivals', '/products'],
    ],
  },
  {
    title: 'Account',
    links: [
      ['Sign in', '/login'],
      ['Create an account', '/register'],
      ['My profile', '/profile'],
    ],
  },
]

export default function Footer() {
  return (
    <footer className="mt-16 bg-brand-950 text-slate-300">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-11 text-sm md:grid-cols-4 md:px-7">
        <div>
          <p className="text-2xl font-extrabold">
            <span className="text-white">Kit</span>
            <span className="text-brand-500">Huddle</span>
          </p>
          <p className="mt-3 leading-relaxed">Sports kits for you and your whole team.</p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="mb-3 font-semibold text-white">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="hover:text-white">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-400">
        © 2026 KitHuddle · Group 02, Department of CSE, East West University · We accept cash on delivery
      </div>
    </footer>
  )
}
