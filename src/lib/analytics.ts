import { supabase } from './supabase'

export type AnalyticsRange = '7d' | '30d' | '90d'

export interface ViewRow {
  id: number
  page_id: string | null
  viewed_at: string
}

export interface SeriesBucket {
  /** Bucket start, ISO date (YYYY-MM-DD). */
  start: string
  /** Short axis label, e.g. "Mon" or "3 Jun". */
  label: string
  count: number
}

export interface TopPage {
  pageId: string
  title: string
  count: number
}

export interface AnalyticsSummary {
  total: number
  today: number
  last7: number
  prev7: number
  last30: number
  /** % change of last 7 days vs the 7 days before it. null when there is no baseline. */
  weekDelta: number | null
  series: SeriesBucket[]
  topPages: TopPage[]
  /** Days since the most recent view, or null when there are none. */
  daysSinceLastView: number | null
}

const RANGE_DAYS: Record<AnalyticsRange, number> = { '7d': 7, '30d': 30, '90d': 90 }
const MAX_ROWS = 20000

function toDayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfDay(d: Date): Date {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

function buildSeries(rows: ViewRow[], range: AnalyticsRange, now: Date): SeriesBucket[] {
  const days = RANGE_DAYS[range]
  const today = startOfDay(now)
  const firstDay = addDays(today, -(days - 1))
  const counts = new Map<string, number>()

  for (const row of rows) {
    const key = toDayKey(new Date(row.viewed_at))
    if (key >= toDayKey(firstDay) && key <= toDayKey(today)) {
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  if (range === '90d') {
    // Collapse 90 daily points into 13 weekly buckets so the chart stays readable.
    const buckets: SeriesBucket[] = []
    for (let i = 0; i < 13; i++) {
      const start = addDays(firstDay, i * 7)
      let total = 0
      for (let d = 0; d < 7; d++) total += counts.get(toDayKey(addDays(start, d))) ?? 0
      buckets.push({
        start: toDayKey(start),
        label: start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        count: total,
      })
    }
    return buckets
  }

  return Array.from({ length: days }, (_, i) => {
    const day = addDays(firstDay, i)
    const key = toDayKey(day)
    return {
      start: key,
      label: day.toLocaleDateString(undefined, range === '7d' ? { weekday: 'short' } : { month: 'short', day: 'numeric' }),
      count: counts.get(key) ?? 0,
    }
  })
}

export async function fetchAnalytics(profileId: string, range: AnalyticsRange): Promise<AnalyticsSummary> {
  const now = new Date()
  const today = startOfDay(now)
  // Need 90 days of data regardless of range so week-over-week deltas and
  // "last 30" stay correct when the user is on the 7d view.
  const windowStart = addDays(today, -89)

  const [viewsRes, pagesRes] = await Promise.all([
    supabase
      .from('page_views')
      .select('id, page_id, viewed_at')
      .eq('profile_id', profileId)
      .gte('viewed_at', windowStart.toISOString())
      .order('viewed_at', { ascending: false })
      .limit(MAX_ROWS),
    supabase.from('pages').select('id, title').eq('profile_id', profileId),
  ])

  if (viewsRes.error) throw new Error(viewsRes.error.message)
  const rows = (viewsRes.data ?? []) as ViewRow[]
  const titles = new Map<string, string>(
    ((pagesRes.data ?? []) as Array<{ id: string; title: string }>).map((p) => [p.id, p.title]),
  )

  const last7Start = addDays(today, -6)
  const prev7Start = addDays(today, -13)
  const last30Start = addDays(today, -29)

  let total = 0
  let todayCount = 0
  let last7 = 0
  let prev7 = 0
  let last30 = 0
  const perPage = new Map<string, number>()
  let latest: number | null = null

  for (const row of rows) {
    const at = new Date(row.viewed_at)
    if (at >= last30Start) last30++
    if (at >= last7Start) {
      last7++
      const key = toDayKey(at)
      if (key === toDayKey(today)) todayCount++
    } else if (at >= prev7Start) {
      prev7++
    }
    if (latest === null || at.getTime() > latest) latest = at.getTime()
    if (row.page_id) perPage.set(row.page_id, (perPage.get(row.page_id) ?? 0) + 1)
  }

  // `total` is the count in the 90-day window we actually fetched; a cheap
  // exact-count query gives the lifetime number.
  const { count: lifetimeCount } = await supabase
    .from('page_views')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profileId)
  total = lifetimeCount ?? rows.length

  const topPages: TopPage[] = [...perPage.entries()]
    .map(([pageId, count]) => ({ pageId, title: titles.get(pageId) ?? 'Deleted page', count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const weekDelta = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : null

  return {
    total,
    today: todayCount,
    last7,
    prev7,
    last30,
    weekDelta,
    series: buildSeries(rows, range, now),
    topPages,
    daysSinceLastView: latest === null ? null : Math.floor((today.getTime() - startOfDay(new Date(latest)).getTime()) / 86400000),
  }
}

export function formatDelta(delta: number | null): { text: string; tone: 'up' | 'down' | 'flat' } {
  if (delta === null) return { text: 'no baseline', tone: 'flat' }
  if (delta === 0) return { text: 'same as last week', tone: 'flat' }
  return {
    text: `${delta > 0 ? '+' : ''}${delta}% vs last week`,
    tone: delta > 0 ? 'up' : 'down',
  }
}
