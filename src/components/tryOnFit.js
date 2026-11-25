// ---- Module 7: how the jersey picture is fitted onto a body ----
// Used by the try-on window (on the camera picture) and by the admin preview (on a dummy body),
// so both fit the jersey in exactly the same way.

// Anchor points inside the TRIMMED jersey picture, as parts of its width and height (0 to 1).
// A front-view jersey's shoulder seams are at about 22% and 78% across and 12% down; the hem is the bottom edge.
const SEAM_LEFT_X = 0.22
const SEAM_RIGHT_X = 0.78
const SEAM_Y = 0.12
const HEM_Y = 1

// The jersey's seams sit a bit outside the body's shoulder points (MediaPipe marks the shoulder joints)
const SEAMS_PER_SHOULDER = 1.35
// The hem ends a little below the hips
const HEM_PER_TORSO = 1.1
// How much the length may be stretched or squashed compared with the picture's own shape
const MIN_STRETCH = 0.8
const MAX_STRETCH = 1.25
// Each frame, move this part of the way to the new place (lower = steadier, higher = quicker)
const SMOOTHING = 0.3

// The admin's fit settings for one jersey: size in % (80–130) and move up/down in % of the jersey's height (−20 to 20, + is down)
export const DEFAULT_FIT = { size: 100, offsetY: 0 }
const clamp = (n, min, max) => Math.min(Math.max(n, min), max)
export const cleanFit = (fit) => ({
  size: clamp(Math.round(Number(fit?.size) || 100), 80, 130),
  offsetY: clamp(Math.round(Number(fit?.offsetY) || 0), -20, 20),
})

// Step 1: cuts off the see-through edges around the jersey, so the anchor points above
// are measured on the jersey itself and not on empty space. Returns a canvas (it can be drawn like a picture).
export function trimTransparent(img) {
  const width = img.naturalWidth || img.width
  const height = img.naturalHeight || img.height
  const full = document.createElement('canvas')
  full.width = width
  full.height = height
  const ctx = full.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const alpha = ctx.getImageData(0, 0, width, height).data

  // The smallest box holding every pixel that is not (almost) fully transparent
  let left = width, right = -1, top = height, bottom = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (alpha[(y * width + x) * 4 + 3] > 10) {
        if (x < left) left = x
        if (x > right) right = x
        if (y < top) top = y
        if (y > bottom) bottom = y
      }
    }
  }
  if (right < 0) return full // nothing visible: keep it as it is

  const trimmed = document.createElement('canvas')
  trimmed.width = right - left + 1
  trimmed.height = bottom - top + 1
  trimmed.getContext('2d').drawImage(full, left, top, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height)
  return trimmed
}

// Steps 2 and 3: where and how big to draw the jersey.
//   body.left / body.right: the shoulder on the left / right of the SCREEN, in canvas pixels
//   body.hips: the middle of the hips in canvas pixels, or null if the hips can't be seen
// Returns { x, y, angle, width, height, shift }: x, y is the middle of the shoulders, where the
// middle of the jersey's seams goes; shift is the admin's up/down move in pixels.
export function jerseyPlacement(body, jersey, fit) {
  const { left, right, hips } = body
  const shoulderWidth = Math.hypot(right.x - left.x, right.y - left.y)
  const neck = { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 }
  const angle = Math.atan2(right.y - left.y, right.x - left.x) // 0 when the shoulders are level
  const size = fit.size / 100

  // Width: the gap between the jersey's seams = shoulder width × 1.35 (× the admin's size)
  const width = (shoulderWidth * SEAMS_PER_SHOULDER * size) / (SEAM_RIGHT_X - SEAM_LEFT_X)
  const naturalHeight = (width * jersey.height) / jersey.width
  let height = naturalHeight
  // Height: from the seams down to the hem = shoulder-to-hip distance × 1.1, so the hem is just below the hips
  if (hips) {
    const torso = Math.hypot(hips.x - neck.x, hips.y - neck.y)
    height = clamp((torso * HEM_PER_TORSO * size) / (HEM_Y - SEAM_Y), naturalHeight * MIN_STRETCH, naturalHeight * MAX_STRETCH)
  }
  return { x: neck.x, y: neck.y, angle, width, height, shift: (fit.offsetY / 100) * height }
}

// Step 5: moves 30% of the way from the old placement to the new one, so the jersey does not shake
export function smoothPlacement(old, next) {
  if (!old) return next
  const mix = (key) => old[key] + (next[key] - old[key]) * SMOOTHING
  return { x: mix('x'), y: mix('y'), angle: mix('angle'), width: mix('width'), height: mix('height'), shift: mix('shift') }
}

// Draws the jersey so its seam anchors land on the shoulders, turned with the shoulder line
export function drawJersey(ctx, jersey, place) {
  ctx.save()
  ctx.translate(place.x, place.y)
  ctx.rotate(place.angle)
  const seamMiddleX = ((SEAM_LEFT_X + SEAM_RIGHT_X) / 2) * place.width
  ctx.drawImage(jersey, -seamMiddleX, -SEAM_Y * place.height + place.shift, place.width, place.height)
  ctx.restore()
}
