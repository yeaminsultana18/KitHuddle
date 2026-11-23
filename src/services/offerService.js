import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'

// ---- Offers: the banners on the Home page ----
// Each document in the `offers` collection looks like:
//   { title: 'Basketball Week', subtitle: 'Up to 25% off', discount: 25,
//     productIds: ['abc123', 'def456'],
//     startDate: '2026-11-20', endDate: '2026-11-30', active: true }
// The banner button opens /offers/<offer id>, which lists the offer's products.
// Dates are kept as 'YYYY-MM-DD' text (what <input type="date"> gives us).
// Text in this form sorts the same way as the dates, so '2026-11-20' < '2026-11-30'.

// Two optional fields for the banner's look:
//   image: a photo saved as a data URL ('data:image/jpeg;base64,...'), or '' for no photo
//   color: 'blue', 'green', 'red' or 'gold', used when there is no photo
export const OFFER_COLORS = ['blue', 'green', 'red', 'gold']

// ---- Banner photos ----
// We have no file storage, so the photo is saved as text inside the offer document.
// A Firestore document can hold at most 1 MB, so the photo is shrunk in the browser first:
// at most 1200px wide, JPEG, under about 300 KB.
const MAX_WIDTH = 1200
const MAX_BYTES = 300 * 1024

// Opens the file as a picture the browser can draw. Fails if the file is not a real image.
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('That file could not be opened as a picture. Please choose a JPG, PNG or WebP photo.'))
    }
    img.src = url
  })
}

// How many bytes the JPEG inside a data URL takes (base64 uses 4 letters for every 3 bytes)
const jpegBytes = (dataUrl) => Math.round(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4)

// Turns the chosen file into a small JPEG data URL
export async function shrinkImage(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a picture file (JPG, PNG or WebP).')
  }
  const img = await loadImage(file)

  let width = Math.min(MAX_WIDTH, img.naturalWidth)
  // Try good quality first; if the file is still too big, lower the quality, then the size
  for (let attempt = 0; attempt < 8; attempt++) {
    const height = Math.round((img.naturalHeight * width) / img.naturalWidth)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff' // JPEG has no see-through parts, so a transparent PNG gets a white background
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)

    for (const quality of [0.85, 0.7, 0.55]) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      if (jpegBytes(dataUrl) <= MAX_BYTES) return dataUrl
    }
    width = Math.round(width * 0.8)
  }
  throw new Error('That photo could not be made small enough. Please try a different one.')
}

// Size of a saved photo in KB, shown in the form
export const imageSizeKB = (dataUrl) => Math.round(jpegBytes(dataUrl) / 1024)

// Today's date as 'YYYY-MM-DD' in the shopper's own time zone
// (toISOString() would use UTC, which is 6 hours behind Bangladesh)
export function todayString() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

// Every offer, newest start date first (for the admin page)
export async function getOffers() {
  const snap = await getDocs(query(collection(db, 'offers'), orderBy('startDate', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Only the offers that are switched on and whose dates include today (for the Home page).
// We filter here in JavaScript so Firestore does not need an extra index.
export async function getCurrentOffers() {
  const today = todayString()
  const offers = await getOffers()
  return offers.filter((o) => o.active && o.startDate <= today && today <= o.endDate)
}

// One offer, or null if it does not exist (for the /offers/:offerId page)
export async function getOffer(id) {
  const snap = await getDoc(doc(db, 'offers', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// ---- The offer's sale on its products ----
// Each product in a switched-on offer gets:
//   salePercent: the offer's discount
//   saleEnds:    the offer's end date (salePrice() ignores the sale after this day)
// When the offer is turned off or deleted, or a product is unticked, the product gets
// salePercent 0 and its saleEnds field is removed.
//
// Everything is saved in ONE batch: the offer and all its products change together, or nothing
// changes (so a product can never be left on sale for an offer that was not saved).
// Every product id given must still exist, otherwise the whole batch fails.

const productRef = (id) => doc(db, 'products', id)

function putSale(batch, productIds, discount, endDate) {
  productIds.forEach((id) => batch.update(productRef(id), { salePercent: discount, saleEnds: endDate }))
}

function clearSale(batch, productIds) {
  productIds.forEach((id) => batch.update(productRef(id), { salePercent: 0, saleEnds: deleteField() }))
}

// Adds (id = null) or saves an offer, and updates its products.
//   oldProductIds = the products the offer had before this save (empty for a new offer)
// Returns the offer's id.
export async function saveOffer(id, data, oldProductIds = []) {
  const batch = writeBatch(db)
  const offerRef = id ? doc(db, 'offers', id) : doc(collection(db, 'offers')) // doc() with no id makes a new id
  // Offers made before this change had a `link`; the button now always opens the offer page
  if (id) batch.update(offerRef, { ...data, link: deleteField() })
  else batch.set(offerRef, data)

  // Products that were unticked lose the sale
  clearSale(batch, oldProductIds.filter((p) => !data.productIds.includes(p)))
  // The products still in the offer: on sale if the offer is on, no sale if it is off
  if (data.active) putSale(batch, data.productIds, data.discount, data.endDate)
  else clearSale(batch, data.productIds)

  await batch.commit()
  return offerRef.id
}

// Turns an offer on or off, and its products' sale with it
export async function setOfferActive(offer, active, productIds) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'offers', offer.id), { active })
  if (active) putSale(batch, productIds, offer.discount, offer.endDate)
  else clearSale(batch, productIds)
  await batch.commit()
}

// Deletes an offer and takes its sale off its products
export async function removeOffer(offer, productIds) {
  const batch = writeBatch(db)
  batch.delete(doc(db, 'offers', offer.id))
  clearSale(batch, productIds)
  await batch.commit()
}
