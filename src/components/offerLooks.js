// The looks used by OfferBanner.jsx, kept in their own file so the admin Offers page can use them too
// (a component file should export only components).

// Thin stripes laid over the colour backgrounds (the same as the old "mega sale" banner)
const STRIPES = 'repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 14px, rgba(0,0,0,0.12) 14px 28px)'
export const DARK_SHADOW = '0 2px 14px rgba(0,0,0,0.5)'

// How each colour choice looks when the offer has no photo
export const COLOR_LOOKS = {
  blue: {
    label: 'Blue',
    background: `${STRIPES}, radial-gradient(circle at 50% 45%, #1f66c9 0%, #0f2a56 55%, #050b1a 100%)`,
    shadow: '0 0 18px rgba(140,184,255,0.85), 0 0 42px rgba(47,127,224,0.6)', // the blue glow
    text: 'text-white',
    small: 'text-slate-200',
    dates: 'text-brand-100',
    border: 'border-white',
  },
  green: {
    label: 'Green',
    background: `${STRIPES}, radial-gradient(circle at 50% 45%, #1f9d5c 0%, #0d4d2f 55%, #04170e 100%)`,
    shadow: DARK_SHADOW,
    text: 'text-white',
    small: 'text-emerald-100',
    dates: 'text-emerald-100',
    border: 'border-white',
  },
  red: {
    label: 'Red',
    background: `${STRIPES}, radial-gradient(circle at 50% 45%, #d63a3a 0%, #6e1414 55%, #1f0505 100%)`,
    shadow: DARK_SHADOW,
    text: 'text-white',
    small: 'text-red-100',
    dates: 'text-red-100',
    border: 'border-white',
  },
  gold: {
    // White text is hard to read on gold, so this one uses dark navy text
    label: 'Gold',
    background: `${STRIPES}, radial-gradient(circle at 50% 45%, #ffe08a 0%, #f5c451 50%, #b9861c 100%)`,
    shadow: 'none',
    text: 'text-brand-950',
    small: 'text-amber-900',
    dates: 'text-brand-900',
    border: 'border-brand-950',
  },
}

// '2026-11-20', '2026-11-30' -> '20 – 30 November'
// '2026-11-28', '2026-12-03' -> '28 November – 3 December'
export function formatDates(start, end) {
  if (!start || !end) return ''
  const toDate = (s) => {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const s = toDate(start)
  const e = toDate(end)
  const dayMonth = (date) => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()} – ${dayMonth(e)}`
  }
  return `${dayMonth(s)} – ${dayMonth(e)}`
}
