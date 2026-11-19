// Size charts and the size advisor (Module 6).
// A chart is a list of rows: { size, minHeight, maxHeight, minWeight, maxWeight } (cm and kg).

// Used for any product with S / M / L / XL sizes that has no chart of its own
export const DEFAULT_APPAREL_CHART = [
  { size: 'S', minHeight: 150, maxHeight: 165, minWeight: 40, maxWeight: 58 },
  { size: 'M', minHeight: 165, maxHeight: 175, minWeight: 58, maxWeight: 70 },
  { size: 'L', minHeight: 175, maxHeight: 183, minWeight: 70, maxWeight: 82 },
  { size: 'XL', minHeight: 183, maxHeight: 195, minWeight: 82, maxWeight: 100 },
]

// The product's own chart, or the default one when it uses S/M/L/XL, or null
export function chartFor(product) {
  if (product?.sizeChart?.length) return product.sizeChart
  const sizes = product?.sizes || []
  const apparel = DEFAULT_APPAREL_CHART.filter((row) => sizes.includes(row.size))
  return apparel.length > 0 ? apparel : null
}

// Picks the first size whose height AND weight limits are not too small for you
export function recommendSize(chart, height, weight) {
  const match = chart.find((row) => height <= row.maxHeight && weight <= row.maxWeight)
  if (!match) return { size: chart[chart.length - 1].size, note: 'You are above our biggest size; this is the closest one.' }
  const inside = height >= match.minHeight && weight >= match.minWeight
  return {
    size: match.size,
    note: inside ? 'This size matches both your height and weight.' : 'Between sizes? Pick one size up for a looser fit.',
  }
}

// ---- For the admin form: chart <-> text ----
// One line per size: "M, 165, 175, 58, 70"  (size, min height, max height, min weight, max weight)

export const chartToText = (chart) =>
  (chart || []).map((r) => `${r.size}, ${r.minHeight}, ${r.maxHeight}, ${r.minWeight}, ${r.maxWeight}`).join('\n')

// Returns { chart } or { error }
export function textToChart(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const chart = []
  for (const line of lines) {
    const parts = line.split(',').map((p) => p.trim())
    const numbers = parts.slice(1).map(Number)
    if (parts.length !== 5 || !parts[0] || numbers.some((n) => !(n > 0))) {
      return { error: `Size chart line "${line}" should look like: M, 165, 175, 58, 70` }
    }
    chart.push({ size: parts[0], minHeight: numbers[0], maxHeight: numbers[1], minWeight: numbers[2], maxWeight: numbers[3] })
  }
  return { chart }
}
