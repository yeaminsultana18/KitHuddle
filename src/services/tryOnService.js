import { deleteDoc, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { loadImage } from './offerService'

// ---- Module 7: virtual try-on pictures ----
// Each product can have one see-through PNG of its jersey, drawn over the shopper's body
// on the camera picture. It is saved as text (a data URL) in its own collection:
//   tryOnImages/{productId}  ->  { image: 'data:image/png;base64,...', fit: { size: 100, offsetY: 0 }, updatedAt }
// fit holds the admin's adjustments for this jersey (see tryOnFit.js).
// It is NOT kept on the product document, so the shop pages (which load every product)
// never download these pictures. The product only gets a small flag, hasTryOn: true,
// so the product page knows whether to show the "Try it on" button.

const MAX_WIDTH = 600
// A Firestore document can hold at most 1 MB, and base64 text is 4/3 the size of the picture,
// so the PNG must stay under about 650 KB
const MAX_BYTES = 650 * 1024

const pngBytes = (dataUrl) => Math.round(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4)

// Size of a try-on picture in KB, shown in the form
export const tryOnSizeKB = (dataUrl) => Math.round(pngBytes(dataUrl) / 1024)

// Does the picture have see-through parts? A jersey on a white box would cover the shopper,
// so at least 5% of the pixels must be transparent.
function hasTransparency(ctx, width, height) {
  const pixels = ctx.getImageData(0, 0, width, height).data // 4 numbers per pixel: red, green, blue, alpha
  let clear = 0
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] < 250) clear++
  }
  return clear / (width * height) >= 0.05
}

// Turns the chosen file into a small PNG data URL (PNG keeps the see-through parts; JPEG would not)
export async function shrinkTryOnImage(file) {
  if (file.type !== 'image/png' && file.type !== 'image/webp') {
    throw new Error('Please choose a PNG (or WebP) picture with a transparent background.')
  }
  const img = await loadImage(file)

  let width = Math.min(MAX_WIDTH, img.naturalWidth)
  // PNG has no quality setting, so if it is too big we make it narrower and try again
  for (let attempt = 0; attempt < 6; attempt++) {
    const height = Math.round((img.naturalHeight * width) / img.naturalWidth)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, width, height) // no background is painted, so transparent stays transparent

    if (attempt === 0 && !hasTransparency(ctx, width, height)) {
      throw new Error('This picture has no transparent background. Remove the background first (for example with remove.bg), then upload the PNG.')
    }

    const dataUrl = canvas.toDataURL('image/png')
    if (pngBytes(dataUrl) <= MAX_BYTES) return dataUrl
    width = Math.round(width * 0.8)
  }
  throw new Error('That picture could not be made small enough. Please try a simpler one.')
}

// The try-on picture and fit settings of one product, { image, fit }, or null if it has none
// (pictures saved before the fit settings existed have no fit; cleanFit() then uses the defaults)
export async function getTryOn(productId) {
  const snap = await getDoc(doc(db, 'tryOnImages', productId))
  return snap.exists() ? { image: snap.data().image, fit: snap.data().fit } : null
}

// Saves the picture with its fit settings and sets the product's flag together (both happen, or neither)
export async function saveTryOnImage(productId, image, fit) {
  const batch = writeBatch(db)
  batch.set(doc(db, 'tryOnImages', productId), { image, fit, updatedAt: serverTimestamp() })
  batch.update(doc(db, 'products', productId), { hasTryOn: true })
  await batch.commit()
}

// Removes the picture and clears the product's flag together
export async function removeTryOnImage(productId) {
  const batch = writeBatch(db)
  batch.delete(doc(db, 'tryOnImages', productId))
  batch.update(doc(db, 'products', productId), { hasTryOn: false })
  await batch.commit()
}

// Used when a product is deleted, so its try-on picture does not stay behind
export const deleteTryOnImage = (productId) => deleteDoc(doc(db, 'tryOnImages', productId))

// ---- Module 7: the try-on window (camera + pose detection, all in the browser) ----

// A friendly error: its message is safe to show to the shopper as it is
const friendlyError = (message) => Object.assign(new Error(message), { friendly: true })

// The jersey picture of one product, ready to draw on a canvas, with its fit settings: { image, fit }
export async function loadJerseyImage(productId) {
  let saved
  try {
    saved = await getTryOn(productId)
  } catch {
    throw friendlyError('We could not load the try-on picture. Check your internet connection and try again.')
  }
  if (!saved?.image) throw friendlyError('This product has no try-on picture yet.')
  const dataUrl = saved.image
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ image: img, fit: saved.fit })
    img.onerror = () => reject(friendlyError('The try-on picture could not be opened.'))
    img.src = dataUrl
  })
}

// MediaPipe Pose: a free model by Google that finds 33 body points (shoulders, hips, ...) in a picture.
// It runs on the shopper's own device; no picture from the camera is ever sent anywhere.
// The browser downloads two files once: the WebAssembly engine (from the jsDelivr CDN, the same
// version as our npm package, which is why package.json pins it to exactly 1.2.3) and the "lite"
// model (about 5 MB, from Google). Both are free and need no key.
const MEDIAPIPE_VERSION = '1.2.3'
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

export async function loadPoseLandmarker() {
  try {
    // import() here (not at the top of the file) so MediaPipe's code only downloads when the
    // try-on window opens, not on every page of the shop
    const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision')
    const fileset = await FilesetResolver.forVisionTasks(WASM_URL)
    const options = (delegate) => ({
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: 'VIDEO', // we give it one camera frame after another
      numPoses: 1, // only one person
    })
    try {
      return await PoseLandmarker.createFromOptions(fileset, options('GPU')) // fast, on the graphics chip
    } catch {
      return await PoseLandmarker.createFromOptions(fileset, options('CPU')) // some phones have no usable GPU
    }
  } catch {
    throw friendlyError('The try-on could not be loaded. Check your internet connection and try again.')
  }
}

// Asks for the front ("selfie") camera. The browser shows its permission question here.
export async function startCamera() {
  // Browsers only allow the camera on https pages (and on localhost while developing)
  if (!navigator.mediaDevices?.getUserMedia) {
    throw friendlyError('This browser cannot open the camera here. Use the latest Chrome or Safari on a secure (https) page.')
  }
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
    })
  } catch (err) {
    if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
      throw friendlyError('Camera access is blocked. Allow the camera for this site (the camera icon in the address bar or your browser settings), then press Try again.')
    }
    if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
      throw friendlyError('We could not find a camera on this device.')
    }
    if (err.name === 'NotReadableError' || err.name === 'AbortError') {
      throw friendlyError('Your camera is being used by another app. Close that app, then press Try again.')
    }
    throw friendlyError('The camera could not be started. Please try again.')
  }
}

// Turns the camera light off
export const stopCamera = (stream) => stream?.getTracks().forEach((track) => track.stop())
