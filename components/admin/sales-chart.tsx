import type { SalesPoint } from "@/lib/mock/admin-dashboard"

const WIDTH = 600
const HEIGHT = 220
const PADDING_X = 8
const PADDING_TOP = 12
const PADDING_BOTTOM = 28

/** Lightweight inline SVG area chart — no charting library, styled entirely with existing tokens. */
function SalesChart({ data }: { data: SalesPoint[] }) {
  const values = data.map((d) => d.value)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const usableWidth = WIDTH - PADDING_X * 2
  const usableHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM
  const chartBottom = HEIGHT - PADDING_BOTTOM

  const points = data.map((d, i) => {
    const x = PADDING_X + (data.length === 1 ? usableWidth / 2 : (i / (data.length - 1)) * usableWidth)
    const y = PADDING_TOP + usableHeight - ((d.value - min) / range) * usableHeight
    return { x, y, label: d.label }
  })

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${chartBottom} L ${points[0].x.toFixed(1)} ${chartBottom} Z`

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Revenue over time">
        <defs>
          <linearGradient id="admin-sales-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--color-primary)", stopOpacity: 0.25 }} />
            <stop offset="100%" style={{ stopColor: "var(--color-primary)", stopOpacity: 0 }} />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1={PADDING_X}
            x2={WIDTH - PADDING_X}
            y1={PADDING_TOP + usableHeight * fraction}
            y2={PADDING_TOP + usableHeight * fraction}
            className="stroke-border"
            strokeWidth="1"
          />
        ))}

        <path d={areaPath} fill="url(#admin-sales-gradient)" />
        <path
          d={linePath}
          fill="none"
          className="stroke-primary"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r="3.5" className="fill-primary" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-caption text-muted-foreground">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  )
}

export { SalesChart }
