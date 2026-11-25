import { useEffect, useRef, useState } from 'react'
import { drawJersey, jerseyPlacement, trimTransparent } from './tryOnFit'

// ---- Module 7: admin preview of the try-on fit ----
// Draws a grey dummy body and fits the jersey on it with the same code as the real try-on window,
// so the admin sees straight away what the size and up/down settings do.

const WIDTH = 240
const HEIGHT = 300
// The dummy's shoulder and hip points, in canvas pixels (like MediaPipe would find on a real person)
const BODY = {
  left: { x: 84, y: 100 },
  right: { x: 156, y: 100 },
  hips: { x: 120, y: 215 },
}

function drawDummy(ctx) {
  ctx.fillStyle = '#cbd5e1' // slate-300
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineCap = 'round'
  // head and neck
  ctx.beginPath()
  ctx.arc(120, 58, 22, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(112, 72, 16, 28)
  // body, from the shoulders down past the hips
  ctx.beginPath()
  ctx.moveTo(BODY.left.x - 6, BODY.left.y - 4)
  ctx.lineTo(BODY.right.x + 6, BODY.right.y - 4)
  ctx.lineTo(146, 225)
  ctx.lineTo(94, 225)
  ctx.closePath()
  ctx.fill()
  // arms and legs
  ctx.lineWidth = 16
  for (const [x1, y1, x2, y2] of [[80, 104, 62, 200], [160, 104, 178, 200], [104, 222, 100, 296], [136, 222, 140, 296]]) {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
}

export default function TryOnPreview({ image, fit }) {
  const canvasRef = useRef(null)
  const [jersey, setJersey] = useState(null) // the trimmed picture

  // Open and trim the picture once, when it changes
  useEffect(() => {
    let current = true
    const img = new Image()
    img.onload = () => current && setJersey(trimTransparent(img))
    img.src = image
    return () => {
      current = false
    }
  }, [image])

  // Redraw whenever the picture or a setting changes
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, WIDTH, HEIGHT)
    drawDummy(ctx)
    if (jersey) drawJersey(ctx, jersey, jerseyPlacement(BODY, jersey, fit))
  }, [jersey, fit])

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      aria-label="Preview of the jersey on a dummy body"
      className="h-auto w-40 rounded-lg border border-slate-200 bg-slate-50"
    />
  )
}
