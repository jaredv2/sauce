import { useState } from 'react'
import type { SeriesBucket } from '../../lib/analytics'

interface Props {
  series: SeriesBucket[]
  height?: number
  /** Accessible description, e.g. "Views per day for the last 7 days". */
  label: string
}

const PAD_X = 2
const VIEW_W = 640
const VIEW_H = 200

/**
 * Bar chart over time. Rendered as SVG with a visually-hidden data table so the
 * trend is available to screen readers and to anyone the SVG fails for.
 */
export function ViewsChart({ series, height = 200, label }: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...series.map((s) => s.count))
  const total = series.reduce((sum, s) => sum + s.count, 0)
  const innerW = VIEW_W - PAD_X * 2
  const innerH = VIEW_H - 28
  const step = series.length > 1 ? innerW / series.length : innerW
  const barW = Math.max(2, Math.min(26, step * 0.62))
  const ticks = [0, 0.5, 1]
  const active = hover === null ? null : series[hover]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] text-[var(--text-secondary)]">
          {active ? (
            <>
              <span className="text-[var(--text-primary)] font-medium tabular-nums">{active.count}</span> on {active.label}
            </>
          ) : (
            <span className="tabular-nums">{total.toLocaleString()} total in range</span>
          )}
        </span>
        {active && (
          <span className="text-[12px] text-[var(--text-tertiary)] tabular-nums">{active.start}</span>
        )}
      </div>

      <div className="relative" style={{ height }}>
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
          className="h-full w-full overflow-visible"
          role="img"
          aria-label={`${label}. Total ${total}, peak ${max} in a single ${series.length > 14 ? 'week' : 'day'}.`}
          onMouseLeave={() => setHover(null)}
        >
          {ticks.map((t) => {
            const y = 24 + innerH * (1 - t)
            return (
              <line
                key={t}
                x1={PAD_X}
                x2={VIEW_W - PAD_X}
                y1={y}
                y2={y}
                stroke="var(--border-subtle)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            )
          })}

          {series.map((s, i) => {
            const h = max === 0 ? 0 : Math.max(s.count > 0 ? 2 : 0, (s.count / max) * innerH)
            const x = PAD_X + i * step + (step - barW) / 2
            const y = 24 + innerH - h
            const isLast = i === series.length - 1
            return (
              <g key={s.start}>
                <rect
                  x={x}
                  y={24}
                  width={barW}
                  height={innerH}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${s.label}: ${s.count} views`}
                />
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx={Math.min(3, barW / 2)}
                  fill={hover === i || isLast ? 'var(--accent)' : 'var(--border-strong)'}
                  className="pointer-events-none transition-colors duration-150"
                />
              </g>
            )
          })}
        </svg>
      </div>

      <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] tabular-nums">
        <span>{series[0]?.label}</span>
        <span>{series[Math.floor(series.length / 2)]?.label}</span>
        <span>{series[series.length - 1]?.label}</span>
      </div>

      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Views</th>
          </tr>
        </thead>
        <tbody>
          {series.map((s) => (
            <tr key={s.start}>
              <th scope="row">{s.start}</th>
              <td>{s.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Horizontal proportion bar used for per-page breakdowns. */
export function RankBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0
  return (
    <div className="h-1.5 w-full rounded-full bg-[var(--bg-sunken)] overflow-hidden" aria-hidden="true">
      <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
    </div>
  )
}
