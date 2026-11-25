import { useEffect, useRef, useState } from 'react'
import { loadJerseyImage, loadPoseLandmarker, startCamera, stopCamera } from '../services/tryOnService'
import { cleanFit, drawJersey, jerseyPlacement, smoothPlacement, trimTransparent } from './tryOnFit'

// ---- Module 7: virtual try-on ----
// The camera picture is drawn on a <canvas> like a mirror, and the product's see-through jersey PNG
// is drawn on top. MediaPipe Pose tells us where the shoulders and hips are in every camera frame;
// tryOnFit.js works out where the jersey goes (the admin preview uses the same code).

// MediaPipe's numbers for the body points we use (it finds 33 points in total)
const LEFT_SHOULDER = 11
const RIGHT_SHOULDER = 12
const LEFT_HIP = 23
const RIGHT_HIP = 24

const MIN_VISIBILITY = 0.5 // how sure MediaPipe must be that it can see a point (0 to 1)
const NO_PERSON_AFTER_MS = 2000 // show "we can't see you" after this long without shoulders

// Step 4: turns MediaPipe's points into canvas pixels, with the SAME mirroring as the video we draw.
// MediaPipe gives x and y from 0 to 1 of the camera frame. The canvas is exactly the size of the
// camera frame (canvas.width = video.videoWidth), so x × width is the right pixel; and because the
// video and the jersey are drawn into the same canvas, the CSS object-fit scales (and crops) them
// together and they can never drift apart. The video is flipped left-to-right, so x is flipped too.
// Returns { left, right, hips } for jerseyPlacement(), or null if the shoulders can't be seen.
function findBody(points, width, height) {
  if (!points) return null
  const point = (i) => ({
    x: (1 - points[i].x) * width,
    y: points[i].y * height,
    seen: (points[i].visibility ?? 1) >= MIN_VISIBILITY,
  })
  const shoulderA = point(LEFT_SHOULDER)
  const shoulderB = point(RIGHT_SHOULDER)
  if (!shoulderA.seen || !shoulderB.seen) return null

  // The shoulder on the left of the screen and the one on the right (this also works if the person turns around)
  const [left, right] = shoulderA.x < shoulderB.x ? [shoulderA, shoulderB] : [shoulderB, shoulderA]
  if (Math.hypot(right.x - left.x, right.y - left.y) < 20) return null // too far away or side-on

  const hipA = point(LEFT_HIP)
  const hipB = point(RIGHT_HIP)
  const hips = hipA.seen && hipB.seen ? { x: (hipA.x + hipB.x) / 2, y: (hipA.y + hipB.y) / 2 } : null
  return { left, right, hips }
}

export default function TryOnModal({ product, onClose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const closeRef = useRef(null)

  const [status, setStatus] = useState('starting') // 'starting', 'live' or 'error'
  const [step, setStep] = useState('Opening your camera...')
  const [error, setError] = useState('')
  const [noPerson, setNoPerson] = useState(false)
  const [attempt, setAttempt] = useState(0) // goes up on "Try again", which starts everything again

  const picture = product.imageUrls?.[0]

  // Start the camera, the model and the drawing loop; stop all of them when the window closes
  useEffect(() => {
    let cancelled = false // true once the window is closed (or restarted)
    const video = videoRef.current
    let stream = null
    let landmarker = null
    let frame = 0

    async function start() {
      try {
        // Load the model and the jersey while the browser asks for camera permission
        const modelPromise = loadPoseLandmarker()
        modelPromise.then(
          (lm) => {
            landmarker = lm
            if (cancelled) lm.close() // the window closed while it was loading
          },
          () => {}, // its error is shown below, when we wait for it
        )
        const jerseyPromise = loadJerseyImage(product.id)
        jerseyPromise.catch(() => {})

        stream = await startCamera()
        if (cancelled) return stopCamera(stream) // closed while the permission question was open
        // If the camera is unplugged or switched off by the system
        stream.getVideoTracks()[0]?.addEventListener('ended', () => {
          if (cancelled) return
          cancelled = true
          cancelAnimationFrame(frame)
          setError('The camera stopped. Press Try again to start it again.')
          setStatus('error')
        })

        video.srcObject = stream
        await video.play()

        setStep('Getting the try-on ready...')
        const [lm, saved] = await Promise.all([modelPromise, jerseyPromise])
        if (cancelled) return
        const jersey = trimTransparent(saved.image) // Step 1: without the empty see-through edges
        const fit = cleanFit(saved.fit) // the admin's size and up/down settings for this jersey
        setStatus('live')

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        let lastVideoTime = -1
        let lastSeen = performance.now()
        let place = null
        let showingNoPerson = false

        // Runs about 60 times a second, every time the screen is redrawn
        function draw() {
          if (cancelled) return
          const now = performance.now()
          const width = video.videoWidth
          const height = video.videoHeight
          if (width && height) {
            if (canvas.width !== width || canvas.height !== height) {
              canvas.width = width
              canvas.height = height
            }
            // 1. The camera picture, flipped left-to-right like a mirror
            ctx.save()
            ctx.translate(width, 0)
            ctx.scale(-1, 1)
            ctx.drawImage(video, 0, 0, width, height)
            ctx.restore()

            // 2. Find the body, but only when the camera has a new frame
            if (video.currentTime !== lastVideoTime) {
              lastVideoTime = video.currentTime
              let next = null
              try {
                const result = lm.detectForVideo(video, now)
                const body = findBody(result.landmarks[0], width, height)
                if (body) next = jerseyPlacement(body, jersey, fit)
              } catch {
                // a frame MediaPipe could not read: skip it
              }
              if (next) {
                place = smoothPlacement(place, next)
                lastSeen = now
              } else if (now - lastSeen > 300) {
                place = null // the person has left: hide the jersey
              }
            }

            // 3. The jersey on top
            if (place) drawJersey(ctx, jersey, place)

            // Only tell React when the "we can't see you" message must appear or go away
            const missing = now - lastSeen > NO_PERSON_AFTER_MS
            if (missing !== showingNoPerson) {
              showingNoPerson = missing
              setNoPerson(missing)
            }
          }
          frame = requestAnimationFrame(draw)
        }
        draw()
      } catch (err) {
        if (cancelled) return
        stopCamera(stream)
        setError(err.friendly ? err.message : 'The try-on could not be started. Please try again.')
        setStatus('error')
      }
    }
    start()

    // Runs when the window closes: stop the loop, turn the camera off and free the model
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      stopCamera(stream)
      video.srcObject = null
      landmarker?.close()
    }
  }, [product.id, attempt])

  // Close with the Escape key, and stop the page behind from scrolling
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = oldOverflow
    }
  }, [onClose])

  function tryAgain() {
    setError('')
    setNoPerson(false)
    setStep('Opening your camera...')
    setStatus('starting')
    setAttempt((a) => a + 1)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="try-on-title"
        className="flex h-full w-full flex-col bg-white sm:h-auto sm:max-h-[95vh] sm:max-w-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <h2 id="try-on-title" className="font-semibold text-brand-900">Try it on</h2>
            <p className="truncate text-sm text-slate-500">{product.name}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close try-on"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 text-xl hover:border-brand-600"
          >
            ×
          </button>
        </div>

        {/* The camera video is never shown itself (it is drawn on the canvas), but it must stay
            on the page and "playsInline" so phones (especially iPhones) keep playing it */}
        <video ref={videoRef} playsInline muted autoPlay className="pointer-events-none absolute h-px w-px opacity-0" aria-hidden="true" />

        {status === 'error' ? (
          // Camera blocked, not found, or loading failed: a friendly message and the plain product picture
          <div className="flex flex-1 flex-col items-center gap-4 overflow-y-auto p-5 text-center">
            {picture && <img src={picture} alt={product.name} className="max-h-[50vh] w-full max-w-sm rounded-lg bg-slate-100 object-contain" />}
            <p role="alert" className="max-w-md rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{error}</p>
            <div className="flex gap-3">
              <button type="button" onClick={tryAgain} className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white">
                Try again
              </button>
              <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-5 py-2.5">
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="relative min-h-0 flex-1 bg-slate-900 sm:aspect-[4/3] sm:flex-none">
            <canvas ref={canvasRef} className="h-full w-full object-contain" aria-label={`Camera view with the ${product.name} drawn on you`} />

            {status === 'starting' && (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <p role="status" className="rounded-lg bg-white/90 px-4 py-3 text-sm font-medium text-slate-800">{step}</p>
              </div>
            )}

            {/* Nobody found: a friendly hint and the plain product picture; it goes away by itself when a person is seen */}
            {status === 'live' && noPerson && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 p-4">
                <div role="status" className="flex max-w-sm flex-col items-center gap-3 rounded-xl bg-white p-4 text-center">
                  {picture && <img src={picture} alt={product.name} className="h-40 w-full rounded-lg bg-slate-100 object-contain" />}
                  <p className="text-sm text-slate-800">
                    We can't see you yet. Step back so your shoulders and hips are in the picture, and make sure the room is well lit.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {status !== 'error' && (
          <p className="px-4 py-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Tip:</span> Stand 1–2 m from the camera, face it, and keep your shoulders and hips in view.
            <span className="block">Everything happens on your device; the video is never saved or sent anywhere.</span>
          </p>
        )}
      </div>
    </div>
  )
}
