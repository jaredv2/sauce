import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AppShell } from '../components/ui/AppShell'
import { Button } from '../components/ui/Button'
import { ViewsChart, RankBar } from '../components/ui/Chart'
import { fetchAnalytics, formatDelta, type AnalyticsRange, type AnalyticsSummary } from '../lib/analytics'

const RANGES: Array<{ value: AnalyticsRange; label: string }> = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
]

function StatTile({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'up' | 'down' | 'flat' }) {
  const hintTone = tone === 'up' ? 'text-[var(--success)]' : tone === 'down' ? 'text-[var(--danger)]' : 'text-[var(--text-tertiary)]'
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold tracking-[0.1em] text-[var(--text-tertiary)]">{label}</span>
      <span className="text-[26px] font-semibold tracking-[-0.02em] leading-none tabular-nums text-[var(--text-primary)]">{value}</span>
      {hint && <span className={`text-[12px] tabular-nums ${hintTone}`}>{hint}</span>}
    </div>
  )
}

export function Analytics() {
  const { profile } = useAuth()
  const [range, setRange] = useState<AnalyticsRange>('30d')
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadedRef = useRef(false)

  const load = useCallback(async () => {
    if (!profile?.id) return
    // Only show the skeleton on first load; a background refetch must not
    // blank out data the producer is already reading.
    if (!loadedRef.current) setLoading(true)
    setError(null)
    try {
      setData(await fetchAnalytics(profile.id, range))
      loadedRef.current = true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load analytics')
    } finally {
      setLoading(false)
    }
  }, [profile, range])

  useEffect(() => {
    load()
  }, [load])

  const delta = formatDelta(data?.weekDelta ?? null)
  const maxPageViews = Math.max(1, ...(data?.topPages.map((p) => p.count) ?? [1]))

  function exportCsv() {
    if (!data) return
    const rows = [['period_start', 'views'], ...data.series.map((s) => [s.start, String(s.count)])]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sauce-views-${range}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppShell
      active="Analytics"
      title="Analytics"
      subtitle="How many people are opening your pages, and which ones they land on."
      actions={
        <Button variant="secondary" size="sm" onClick={exportCsv} disabled={!data || loading}>
          Export CSV
        </Button>
      }
    >
      <div className="flex items-center gap-1" role="group" aria-label="Date range">
        {RANGES.map((r) => (
          <button
            key={r.value}
            type="button"
            aria-pressed={range === r.value}
            onClick={() => setRange(r.value)}
            className={[
              'h-8 px-3 rounded-[var(--radius-sm)] text-[13px] font-medium border transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
              range === r.value
                ? 'bg-[var(--accent)] text-[var(--text-on-accent)] border-[var(--accent)]'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]',
            ].join(' ')}
          >
            {r.label}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-[13px] text-[var(--text-primary)]">{error}</span>
          <Button variant="secondary" size="sm" onClick={load}>Retry</Button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading analytics">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[104px] skeleton rounded-[var(--radius-md)]" />
            ))}
          </div>
          <div className="h-[280px] skeleton rounded-[var(--radius-md)]" />
        </div>
      ) : data && data.total === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] py-16 px-6 flex flex-col items-center gap-3 text-center">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">No views yet</h2>
          <p className="text-[13px] leading-[1.6] text-[var(--text-secondary)] max-w-[42ch]">
            Share your link and this fills in. Views are counted when someone opens your public page.
          </p>
          <Link to="/dashboard/pages" className="mt-1 text-[13px] text-[var(--accent)] hover:underline underline-offset-4">
            Publish a page
          </Link>
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile label="ALL TIME" value={data.total.toLocaleString()} />
            <StatTile label="TODAY" value={data.today.toLocaleString()} />
            <StatTile label="LAST 7 DAYS" value={data.last7.toLocaleString()} hint={delta.text} tone={delta.tone} />
            <StatTile label="LAST 30 DAYS" value={data.last30.toLocaleString()} />
          </div>

          <section className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-5" aria-label="Views over time">
            <ViewsChart
              series={data.series}
              label={`Views over time, last ${range === '7d' ? '7 days' : range === '30d' ? '30 days' : '13 weeks'}`}
            />
          </section>

          <div className="grid lg:grid-cols-2 gap-3">
            <section className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-5" aria-label="Top pages">
              <h2 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3">Top pages</h2>
              {data.topPages.length === 0 ? (
                <p className="text-[13px] text-[var(--text-tertiary)]">No page-level views in this range.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {data.topPages.map((p) => (
                    <li key={p.pageId} className="flex flex-col gap-1.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[13px] text-[var(--text-primary)] truncate">{p.title}</span>
                        <span className="text-[13px] tabular-nums text-[var(--text-secondary)] shrink-0">{p.count.toLocaleString()}</span>
                      </div>
                      <RankBar value={p.count} max={maxPageViews} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-5" aria-label="Momentum">
              <h2 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3">Momentum</h2>
              <dl className="flex flex-col divide-y divide-[var(--border-subtle)]">
                <div className="flex items-baseline justify-between py-2.5">
                  <dt className="text-[13px] text-[var(--text-secondary)]">Best day</dt>
                  <dd className="text-[13px] font-medium text-[var(--text-primary)] tabular-nums">
                    {data.series.reduce((best, s) => (s.count > best.count ? s : best), data.series[0] ?? { count: 0, label: '-', start: '' }).label}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between py-2.5">
                  <dt className="text-[13px] text-[var(--text-secondary)]">Previous 7 days</dt>
                  <dd className="text-[13px] font-medium text-[var(--text-primary)] tabular-nums">{data.prev7.toLocaleString()}</dd>
                </div>
                <div className="flex items-baseline justify-between py-2.5">
                  <dt className="text-[13px] text-[var(--text-secondary)]">Last view</dt>
                  <dd className="text-[13px] font-medium text-[var(--text-primary)]">
                    {data.daysSinceLastView === null
                      ? '-'
                      : data.daysSinceLastView === 0
                        ? 'Today'
                        : `${data.daysSinceLastView}d ago`}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-[12px] leading-[1.5] text-[var(--text-tertiary)]">
                Views only count public page opens. There is no referrer or device tracking.
              </p>
            </section>
          </div>
        </>
      ) : null}
    </AppShell>
  )
}
