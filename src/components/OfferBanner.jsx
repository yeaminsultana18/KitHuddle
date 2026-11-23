import { Link } from 'react-router-dom'
import { COLOR_LOOKS, DARK_SHADOW, formatDates } from './offerLooks'

// One banner made from an offer.
//   With a photo: the photo fills the banner, darkened a little so the words stay readable.
//   Without a photo: the chosen colour (blue if none was chosen, e.g. offers made before this feature).
// `wide`    = fills the whole row on wider screens (used on the Home page)
// `preview` = not a link (used in the admin form and at the top of the offer's own page)
// `showButton` = show the "Shop now" button (hidden on the offer's own page, where you already are)
// The banner opens /offers/<offer id>, the page that lists the offer's products.
export default function OfferBanner({ offer, wide = false, preview = false, showButton = true }) {
  const look = COLOR_LOOKS[offer.color] || COLOR_LOOKS.blue
  const photo = Boolean(offer.image)

  const background = photo
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(5,11,26,0.35), rgba(5,11,26,0.6)), url("${offer.image}")`,
        backgroundPosition: 'center',
      }
    : { backgroundColor: '#0b1f42', backgroundImage: look.background }
  const shadow = { textShadow: photo ? DARK_SHADOW : look.shadow }

  const className = `flex flex-col items-center justify-center gap-2 overflow-hidden rounded-lg bg-brand-900 bg-cover p-8 text-center ${
    photo ? 'text-white' : look.text
  } ${wide ? 'aspect-[16/15] md:col-span-2 md:aspect-[16/7]' : 'aspect-[16/15]'}`

  const content = (
    <>
      <span className={`text-xs font-semibold tracking-[0.4em] ${photo ? 'text-slate-200' : look.small}`}>KITHUDDLE</span>
      <span className="font-display text-5xl tracking-wider md:text-6xl lg:text-7xl" style={shadow}>
        {offer.title || 'Offer title'}
      </span>
      <span className={`font-display text-6xl leading-[0.9] lg:text-8xl ${photo ? 'text-gold' : ''}`} style={shadow}>
        {offer.subtitle || 'Subtitle'}
      </span>
      <span className={`font-display text-3xl tracking-wider lg:text-4xl ${photo ? 'text-slate-100' : look.dates}`} style={shadow}>
        {formatDates(offer.startDate, offer.endDate)}
      </span>
      {showButton && (
        <span className={`mt-4 rounded-lg border-2 px-6 py-1 font-display text-2xl tracking-wider lg:text-3xl ${photo ? 'border-white' : look.border}`}>
          Shop now
        </span>
      )}
    </>
  )

  if (preview) {
    return <div className={className} style={background}>{content}</div>
  }
  return (
    <Link to={`/offers/${offer.id}`} className={className} style={background}>
      {content}
    </Link>
  )
}
