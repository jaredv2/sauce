import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, Copy, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { AppShell } from '../components/ui/AppShell'
import { Button } from '../components/ui/Button'
import { ProfileRenderer } from '../components/ProfileRenderer/ProfileRenderer'
import { PageConfigSchema, type PageConfig } from '../types/pageConfig'

type TemplateRow = {
  id: string
  owner_id: string
  name: string
  description: string | null
  config: unknown
  is_public: boolean
  created_at: string
  views: number
  uses: number
  profiles: { username: string } | null
}

function summarize(config: PageConfig): string[] {
  const bits: string[] = []
  if (config.style.accentColor && config.style.accentColor !== '#D97757') bits.push('custom accent')
  if (config.style.cardEffect && config.style.cardEffect !== 'none') bits.push(`${config.style.cardEffect} card`)
  if (config.style.backgroundEffect && config.style.backgroundEffect !== 'none') bits.push(`${config.style.backgroundEffect} background`)
  if (config.profileHeader.openForCollabs) bits.push('open for collabs')
  const socials = Object.entries(config.socials).filter(([k, v]) => k !== 'align' && typeof v === 'string' && v.trim())
  if (socials.length) bits.push(`${socials.length} link${socials.length === 1 ? '' : 's'}`)
  if (config.products.items.length) bits.push(`${config.products.items.length} product${config.products.items.length === 1 ? '' : 's'}`)
  if (config.plugins.tags.length) bits.push(`${config.plugins.tags.length} plugin${config.plugins.tags.length === 1 ? '' : 's'}`)
  return bits.length ? bits : ['blank page']
}

function ScaledPreview({ children, width, height }: { children: React.ReactNode; width: number; height: number }) {
  const outerRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (!w || !h) return
      setScale(Math.min(1, w / width, h / height))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [width, height])

  return (
    <div ref={outerRef} className="relative h-full w-full overflow-hidden">
      <div
        className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-default)]"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width,
          height,
          transformOrigin: 'center center',
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function Templates() {
  const { user, profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const deepLinkId = searchParams.get('template')
  const handledDeepLink = useRef<string | null>(null)
  const [tab, setTab] = useState<'marketplace' | 'mine'>('marketplace')
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<TemplateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<TemplateRow | null>(null)
  const [preview, setPreview] = useState<{ tpl: TemplateRow; config: PageConfig } | null>(null)
  const [previewMode, setPreviewMode] = useState<'landing' | 'main'>('main')
  const [previewClosing, setPreviewClosing] = useState(false)
  const previewTimer = useRef<number | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    let query = supabase
      .from('templates')
      .select('id, owner_id, name, description, config, is_public, created_at, views, uses, profiles(username)')
      .order('updated_at', { ascending: false })
      .limit(120)
    if (tab === 'mine') query = query.eq('owner_id', user.id)
    else query = query.eq('is_public', true)
    const { data, error: qErr } = await query
    if (qErr) {
      setError(qErr.message)
      setLoading(false)
      return
    }
    setRows((data ?? []) as unknown as TemplateRow[])
    setLoading(false)
  }, [user, tab])

  useEffect(() => {
    load()
  }, [load])

  const query = search.trim().toLowerCase()
  const visibleRows = query
    ? rows.filter((t) =>
        t.name.toLowerCase().includes(query) ||
        (t.description ?? '').toLowerCase().includes(query) ||
        (t.profiles?.username ?? '').toLowerCase().includes(query),
      )
    : rows

  function openPreview(t: TemplateRow) {
    const parsed = PageConfigSchema.safeParse(t.config)
    if (!parsed.success) {
      setActionError('That template is stored in an outdated format and cannot be previewed.')
      return
    }
    if (previewTimer.current) window.clearTimeout(previewTimer.current)
    setPreviewClosing(false)
    setPreviewMode('main')
    setPreview({ tpl: t, config: parsed.data })
    if (t.owner_id !== user?.id) {
      void supabase.rpc('increment_template_stat', { p_template_id: t.id, p_field: 'views' })
    }
  }

  function closePreview() {
    if (previewTimer.current) window.clearTimeout(previewTimer.current)
    setPreviewClosing(true)
    previewTimer.current = window.setTimeout(() => {
      setPreview(null)
      setPreviewClosing(false)
      previewTimer.current = null
    }, 220)
  }

  useEffect(() => () => { if (previewTimer.current) window.clearTimeout(previewTimer.current) }, [])

  // Deep link from the editor: /dashboard/templates?template=<id> opens that
  // template's preview straight away, then drops the param so a refresh or the
  // back button does not re-open it.
  useEffect(() => {
    if (!deepLinkId || loading || handledDeepLink.current === deepLinkId) return
    const match = rows.find((t) => t.id === deepLinkId)
    if (!match) return
    handledDeepLink.current = deepLinkId
    openPreview(match)
    setSearchParams({}, { replace: true })
  }, [deepLinkId, loading, rows, setSearchParams])

  async function applyTemplate(t: TemplateRow) {
    if (!user) return
    setBusyId(t.id)
    setActionError(null)
    try {
      const parsed = PageConfigSchema.safeParse(t.config)
      const config = parsed.success ? parsed.data : null
      if (!config) throw new Error('That template is stored in an outdated format.')
      const { data, error: insErr } = await supabase
        .from('pages')
        .insert({ profile_id: user.id, title: t.name, draft_config: config })
        .select('id')
        .single()
      if (insErr) throw insErr
      void supabase.rpc('increment_template_stat', { p_template_id: t.id, p_field: 'uses' })
      window.location.href = `/dashboard/pages/${data.id}/edit`
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not create a page from that template')
      setBusyId(null)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    setBusyId(deleting.id)
    setActionError(null)
    try {
      const { error: delErr } = await supabase.from('templates').delete().eq('id', deleting.id)
      if (delErr) throw delErr
      setDeleting(null)
      await load()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setBusyId(null)
    }
  }

  async function toggleVisibility(t: TemplateRow) {
    setBusyId(t.id)
    setActionError(null)
    try {
      const { error: upErr } = await supabase.from('templates').update({ is_public: !t.is_public }).eq('id', t.id)
      if (upErr) throw upErr
      setPreview((prev) => (prev && prev.tpl.id === t.id ? { ...prev, tpl: { ...prev.tpl, is_public: !t.is_public } } : prev))
      await load()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AppShell
      active="Templates"
      title="Templates"
      subtitle="Save a page you like as a template, then start fresh pages from it in one click."
      actions={
        <Link to="/dashboard/pages">
          <Button variant="secondary" size="sm">Your pages</Button>
        </Link>
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates or creators"
            aria-label="Search templates"
            className="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-sunken)] pl-9 pr-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Template list">
          {([['marketplace', 'Marketplace'], ['mine', 'My templates']] as const).map(([v, l]) => (
            <button
              key={v}
              type="button"
              aria-pressed={tab === v}
              onClick={() => setTab(v)}
              className={[
                'h-9 px-3 rounded-[var(--radius-sm)] text-[13px] font-medium border whitespace-nowrap transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
                tab === v
                  ? 'bg-[var(--accent)] text-[var(--text-on-accent)] border-[var(--accent)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {actionError && (
        <div role="alert" className="rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-[13px] text-[var(--text-primary)]">
          {actionError}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-[13px] text-[var(--text-primary)]">{error}</span>
          <Button variant="secondary" size="sm" onClick={load}>Retry</Button>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3" aria-busy="true" aria-label="Loading templates">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[132px] skeleton rounded-[var(--radius-md)]" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] py-14 px-6 flex flex-col items-center gap-3 text-center">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
            {tab === 'mine' ? 'No templates yet' : 'The marketplace is empty'}
          </h2>
          <p className="text-[13px] leading-[1.6] text-[var(--text-secondary)] max-w-[44ch]">
            {tab === 'mine'
              ? 'Open a page you like and use “Save as template” to save its design here.'
              : 'Nobody has published a template yet. Yours could be the first.'}
          </p>
          <Link to="/dashboard/pages" className="text-[13px] text-[var(--accent)] hover:underline underline-offset-4">
            Go to your pages
          </Link>
        </div>
      ) : query && visibleRows.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] py-14 px-6 flex flex-col items-center gap-3 text-center">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">No matches</h2>
          <p className="text-[13px] leading-[1.6] text-[var(--text-secondary)] max-w-[44ch]">
            Nothing here matches “{search.trim()}”. Try a different name or creator.
          </p>
          <button type="button" onClick={() => setSearch('')} className="text-[13px] text-[var(--accent)] hover:underline underline-offset-4">
            Clear search
          </button>
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {visibleRows.map((t) => {
            const parsed = PageConfigSchema.safeParse(t.config)
            const bits = parsed.success ? summarize(parsed.data) : ['unavailable']
            return (
              <li key={t.id} className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 flex flex-col gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-medium text-[var(--text-primary)] truncate">{t.name}</span>
                  {t.description && <span className="text-[11px] leading-[1.35] text-[var(--text-secondary)] line-clamp-2">{t.description}</span>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {bits.slice(0, 4).map((b) => (
                    <span key={b} className="rounded-full border border-[var(--border-default)] bg-[var(--bg-sunken)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]">
                      {b}
                    </span>
                  ))}
                  {bits.length > 4 && <span className="text-[10px] text-[var(--text-tertiary)] self-center">+{bits.length - 4}</span>}
                </div>
                <div className="flex items-center gap-2.5 text-[10px] text-[var(--text-tertiary)] tabular-nums">
                  <span className="inline-flex items-center gap-1" title="Template previews">
                    <Eye size={11} aria-hidden="true" /> {t.views ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1" title="Pages created from this template">
                    <Copy size={11} aria-hidden="true" /> {t.uses ?? 0}
                  </span>
                  <span className="truncate">by @{t.profiles?.username ?? 'unknown'}</span>
                </div>
                <Button size="sm" className="mt-auto w-full" onClick={() => openPreview(t)}>
                  View template
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      {!loading && rows.length > 0 && tab === 'mine' && (
        <p className="text-[12px] text-[var(--text-tertiary)]">
          Signed in as @{profile?.username}. Public templates appear in the marketplace for everyone.
        </p>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm modal-backdrop" onClick={closePreview} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Preview ${preview.tpl.name}`}
            className={`relative w-full max-w-[920px] h-[min(92vh,840px)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xl flex flex-col ${previewClosing ? 'modal-panel-out' : 'modal-panel'}`}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border-subtle)] shrink-0">
              <div className="flex flex-col gap-0.5 min-w-0">
                <h2 className="text-[14px] font-semibold text-[var(--text-primary)] truncate">{preview.tpl.name}</h2>
                <span className="text-[12px] text-[var(--text-tertiary)] truncate">
                  by @{preview.tpl.profiles?.username ?? 'unknown'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="inline-flex rounded-full border border-[var(--border-default)] bg-[var(--bg-sunken)] p-0.5" role="group" aria-label="Preview mode">
                  {(['landing', 'main'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={previewMode === m}
                      onClick={() => setPreviewMode(m)}
                      className={[
                        'rounded-full px-2.5 py-1 text-[12px] font-medium capitalize transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
                        previewMode === m ? 'bg-[var(--accent)] text-[var(--text-on-accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                      ].join(' ')}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <button type="button" aria-label="Close preview" onClick={closePreview} className="h-7 w-7 inline-flex items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">×</button>
              </div>
            </div>

            <div className="flex-1 min-h-[240px] overflow-hidden bg-[var(--bg-sunken)] p-2">
              <ScaledPreview width={1440} height={810}>
                <ProfileRenderer
                  config={preview.config}
                  mode={previewMode}
                  onEnter={() => setPreviewMode('main')}
                  editorPreview
                />
              </ScaledPreview>
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[var(--border-subtle)] shrink-0">
              <p className="text-[12px] text-[var(--text-tertiary)] min-w-0 truncate">
                {preview.tpl.description ?? 'Using it creates a new page you can edit freely.'}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                {preview.tpl.owner_id === user?.id && (
                  <>
                    <Button variant="secondary" size="sm" loading={busyId === preview.tpl.id} onClick={() => toggleVisibility(preview.tpl)}>
                      {preview.tpl.is_public ? 'Make private' : 'Publish'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        closePreview()
                        setDeleting(preview.tpl)
                      }}
                    >
                      Delete
                    </Button>
                  </>
                )}
                <Button variant="secondary" size="sm" onClick={closePreview}>Close</Button>
                <Button size="sm" loading={busyId === preview.tpl.id} onClick={() => applyTemplate(preview.tpl)}>
                  Use template
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" aria-label="Close" onClick={() => setDeleting(null)} className="absolute inset-0 bg-black/50 backdrop-blur-sm modal-backdrop" />
          <div role="dialog" aria-modal="true" aria-labelledby="delete-template-title" className="relative w-full max-w-[420px] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 flex flex-col gap-4 shadow-xl modal-panel">
            <div className="flex flex-col gap-1">
              <h2 id="delete-template-title" className="text-[16px] font-semibold tracking-tight text-[var(--text-primary)]">
                Delete “{deleting.name}”?
              </h2>
              <p className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
                Pages already created from it keep their copied settings. This cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setDeleting(null)} disabled={busyId !== null}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete} loading={busyId === deleting.id}>
                Delete template
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
