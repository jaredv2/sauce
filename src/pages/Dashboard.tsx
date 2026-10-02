import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { AppShell } from '../components/ui/AppShell'
import { Button } from '../components/ui/Button'
import { ViewsChart, RankBar } from '../components/ui/Chart'
import { fetchAnalytics, formatDelta, type AnalyticsSummary } from '../lib/analytics'

type PageRow = {
  id: string
  title: string
  draft_updated_at: string
  published_at: string | null
}

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

export function Dashboard() {
  const { profile, user } = useAuth()
  const [stats, setStats] = useState<AnalyticsSummary | null>(null)
  const [pages, setPages] = useState<PageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const loadedRef = useRef(false)

  const liveHref = profile?.username ? `/${profile.username}` : null
  const liveUrl = liveHref && typeof window !== 'undefined' ? `${window.location.origin}${liveHref}` : null
  const activeId = profile?.active_page_id ?? null
  const livePage = pages.find((p) => p.id === activeId) ?? null
  const hasLive = !!livePage

  const load = useCallback(async () => {
    if (!profile?.id || !user) return
    if (!loadedRef.current) setLoading(true)
    setError(null)
    try {
      const [summary, pagesRes] = await Promise.all([
        fetchAnalytics(profile.id, '30d'),
        supabase
          .from('pages')
          .select('id, title, draft_updated_at, published_at')
          .eq('profile_id', user.id)
          .order('draft_updated_at', { ascending: false }),
      ])
      setStats(summary)
      if (pagesRes.error) throw new Error(pagesRes.error.message)
      setPages((pagesRes.data ?? []) as PageRow[])
      loadedRef.current = true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load dashboard')
    } finally {
      setLoading(false)
    }
  }, [profile, user])

  useEffect(() => {
    load()
  }, [load])

  async function copyLink() {
    if (!liveUrl) return
    try {
      await navigator.clipboard.writeText(liveUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const delta = formatDelta(stats?.weekDelta ?? null)
  const maxPageViews = Math.max(1, ...(stats?.topPages.map((p) => p.count) ?? [1]))

  return (
    <AppShell
      active="Overview"
      title={`Hey, @${profile?.username ?? ''}`}
      subtitle="Your pages, reach, and the next thing worth doing."
      actions={
        <>
          {liveUrl && (
            <Button variant="secondary" size="sm" onClick={copyLink}>
              {copied ? 'Copied' : 'Copy link'}
            </Button>
          )}
          <Link to="/dashboard/pages">
            <Button size="sm">New page</Button>
          </Link>
        </>
      }
    >
      {error && (
        <div role="alert" className="rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-[13px] text-[var(--text-primary)]">{error}</span>
          <Button variant="secondary" size="sm" onClick={load}>Retry</Button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading dashboard">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[104px] skeleton rounded-[var(--radius-md)]" />
            ))}
          </div>
          <div className="h-[240px] skeleton rounded-[var(--radius-md)]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile label="TOTAL VIEWS" value={(stats?.total ?? 0).toLocaleString()} hint="All time" />
            <StatTile label="LAST 7 DAYS" value={(stats?.last7 ?? 0).toLocaleString()} hint={delta.text} tone={delta.tone} />
            <StatTile label="PAGES" value={String(pages.length)} hint={hasLive ? '1 live' : 'None live'} />
            <StatTile
              label="LAST VIEW"
              value={
                stats?.daysSinceLastView === null || stats === null
                  ? '-'
                  : stats.daysSinceLastView === 0
                    ? 'Today'
                    : `${stats.daysSinceLastView}d`
              }
              hint={stats?.daysSinceLastView === null ? 'No views yet' : 'Ago'}
            />
          </div>

          {!hasLive && (
            <div className="rounded-[var(--radius-md)] border border-[var(--accent)]/40 bg-[var(--accent-subtle)] px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[14px] font-semibold text-[var(--text-primary)]">
                  {pages.length === 0 ? 'Create your first page' : 'Publish a page to go live'}
                </span>
                <span className="text-[13px] text-[var(--text-secondary)]">
                  Your public link stays off until a page is published.
                </span>
              </div>
              <Link to={pages.length === 0 ? '/dashboard/pages' : `/dashboard/pages/${pages[0].id}/edit`} className="shrink-0">
                <Button size="sm">{pages.length === 0 ? 'Create page' : 'Open editor'}</Button>
              </Link>
            </div>
          )}

          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-3">
            <section className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-5" aria-label="Views over time">
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">Reach, last 30 days</h2>
                <Link to="/dashboard/analytics" className="text-[12px] text-[var(--accent)] hover:underline underline-offset-4">
                  Analytics
                </Link>
              </div>
              {stats && stats.last30 > 0 ? (
                <ViewsChart series={stats.series} height={168} label="Views over time, last 30 days" />
              ) : (
                <p className="text-[13px] text-[var(--text-tertiary)] py-10 text-center">
                  No views in the last 30 days. Share your link to get the first one.
                </p>
              )}
            </section>

            <section className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-5" aria-label="Quick actions">
              <h2 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3">Quick actions</h2>
              <div className="flex flex-col divide-y divide-[var(--border-subtle)]">
                {hasLive && (
                  <Link
                    to={`/dashboard/pages/${activeId}/edit`}
                    className="flex items-center justify-between py-2.5 text-[13px] text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-sm"
                  >
                    Edit live page <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                )}
                <Link
                  to="/dashboard/pages"
                  className="flex items-center justify-between py-2.5 text-[13px] text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-sm"
                >
                  {pages.length === 0 ? 'Create a page' : 'Manage all pages'} <ArrowRight size={13} aria-hidden="true" />
                </Link>
                <Link
                  to="/dashboard/analytics"
                  className="flex items-center justify-between py-2.5 text-[13px] text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-sm"
                >
                  Full analytics <ArrowRight size={13} aria-hidden="true" />
                </Link>
                {liveUrl && (
                  <>
                    <button
                      type="button"
                      onClick={copyLink}
                      className="flex items-center justify-between py-2.5 text-left text-[13px] text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-sm"
                    >
                      {copied ? 'Link copied' : 'Copy public link'} <ArrowRight size={13} aria-hidden="true" />
                    </button>
                    <a
                      href={liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between py-2.5 text-[13px] text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-sm"
                    >
                      Open public page <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  </>
                )}
              </div>
            </section>
          </div>

          <div className="grid lg:grid-cols-2 gap-3">
            <section className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-5" aria-label="Top pages">
              <h2 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3">Top pages</h2>
              {!stats || stats.topPages.length === 0 ? (
                <p className="text-[13px] text-[var(--text-tertiary)]">No page-level views yet.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {stats.topPages.map((p) => (
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

            <section className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-5" aria-label="Recent pages">
              <h2 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3">Recent pages</h2>
              {pages.length === 0 ? (
                <p className="text-[13px] text-[var(--text-tertiary)]">Nothing here yet.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-[var(--border-subtle)]">
                  {pages.slice(0, 4).map((p) => (
                    <li key={p.id}>
                      <Link
                        to={`/dashboard/pages/${p.id}/edit`}
                        className="flex items-center justify-between gap-3 py-2.5 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-sm"
                      >
                        <span className="text-[13px] text-[var(--text-primary)] truncate">{p.title}</span>
                        <span className="text-[12px] text-[var(--text-tertiary)] shrink-0 tabular-nums">
                          {p.id === activeId ? 'Live' : new Date(p.draft_updated_at).toLocaleDateString()}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </AppShell>
  )
}
