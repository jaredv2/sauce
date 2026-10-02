import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { DEFAULT_PAGE_CONFIG } from '../types/pageConfig'

type PageRow = {
  id: string
  profile_id: string
  title: string
  draft_updated_at: string
  published_at: string | null
  created_at: string
}

export function SavedPages() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const [pages, setPages] = useState<PageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PageRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)

  const activeId = profile?.active_page_id ?? null

  const fetchPages = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    const { data, error: qErr } = await supabase
      .from('pages')
      .select('id, profile_id, title, draft_updated_at, published_at, created_at')
      .eq('profile_id', user.id)
      .order('draft_updated_at', { ascending: false })
    if (qErr) {
      setError(qErr.message)
      setLoading(false)
      return
    }
    setPages((data as PageRow[]) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchPages()
  }, [fetchPages])

  // Refresh when profile active_page_id changes externally (e.g., publish via editor)
  useEffect(() => {
    // no-op, profile is in deps for render only
  }, [activeId])

  async function handleCreate() {
    if (!user) return
    setCreating(true)
    setActionError(null)
    try {
      const { data, error: insErr } = await supabase
        .from('pages')
        .insert({
          profile_id: user.id,
          title: 'Untitled Page',
          draft_config: DEFAULT_PAGE_CONFIG,
        })
        .select('id')
        .single()
      if (insErr) throw insErr
      // refetch to include new row
      await fetchPages()
      navigate(`/dashboard/pages/${data.id}/edit`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create page'
      if (msg.includes('page_limit_reached')) {
        setActionError('This project still enforces a page limit in the database. Run migration 007 to remove it.')
      } else {
        setActionError(msg)
      }
    } finally {
      setCreating(false)
    }
  }

  async function handlePublish(pageId: string) {
    setPublishingId(pageId)
    setActionError(null)
    try {
      const { error } = await supabase.rpc('publish_page', { p_page_id: pageId })
      if (error) throw error
      // publish_page flips active_page_id server-side - refresh profile then list
      // give trigger a moment then reload
      await new Promise((r) => setTimeout(r, 300))
      window.location.reload()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Publish failed')
      setPublishingId(null)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setActionError(null)
    try {
      const { error } = await supabase.from('pages').delete().eq('id', deleteTarget.id)
      if (error) throw error
      setDeleteTarget(null)
      await fetchPages()
      // if we deleted active, profile.active_page_id becomes null via on delete set null - reload to reflect
      if (deleteTarget.id === activeId) window.location.reload()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-[var(--radius-sm)] px-1">
            ← Dashboard
          </Link>
          <span className="hidden sm:inline text-[12px] px-2 py-0.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-sunken)] text-[var(--text-tertiary)]">
            {pages.length} pages
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[13px] text-[var(--text-secondary)]">@{profile?.username}</span>
          <Link to="/" className="text-[11px] px-2.5 py-1 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface-raised)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]">
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[880px] px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-[20px] font-semibold tracking-tight text-[var(--text-primary)]">Your pages</h1>
            <p className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
              {pages.length === 0 ? 'Create your first page to start editing.' : `${pages.length} page${pages.length === 1 ? '' : 's'} · unlimited`}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <Button onClick={handleCreate} loading={creating} size="sm">
              Create new page
            </Button>
          </div>
        </div>

        {actionError && (
          <div role="alert" className="rounded-[var(--radius-sm)] border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2.5 text-[13px] leading-[1.4] text-[var(--text-primary)]">
            {actionError}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading pages">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 skeleton rounded-[var(--radius-md)] border border-[var(--border-default)]" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--bg-surface)] p-6 text-center">
            <p className="text-[13px] text-[var(--danger)]" role="alert">
              {error}
            </p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={fetchPages}>
              Retry
            </Button>
          </div>
        ) : pages.length === 0 ? (
          <div role="status" className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] py-12 px-6 flex flex-col items-center gap-3 text-center">
            <div className="h-10 w-10 rounded-full border border-[var(--border-default)] bg-[var(--bg-sunken)] flex items-center justify-center text-[var(--text-tertiary)]" aria-hidden="true">
              <Plus size={16} />
            </div>
            <h3 className="text-[14px] font-medium text-[var(--text-primary)]">No pages yet</h3>
            <p className="text-[13px] leading-[1.5] text-[var(--text-secondary)] max-w-[360px]">Create a page to open the editor. Your first publish will become your live page at <span className="text-[var(--text-primary)]">/{profile?.username}</span>.</p>
            <Button onClick={handleCreate} loading={creating} size="sm" className="mt-1">
              Create page
            </Button>
          </div>
        ) : (
          <ul role="list" className="flex flex-col gap-3">
            {pages.map((p, i) => {
              const isLive = p.id === activeId
              return (
                <li
                  key={p.id}
                  className={[
                    'group card-enter card-hover rounded-[var(--radius-md)] border p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4',
                    isLive ? 'border-[var(--accent)]/40 bg-[var(--accent-subtle)]' : 'border-[var(--border-default)] bg-[var(--bg-surface)]',
                  ].join(' ')}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[14px] font-medium text-[var(--text-primary)] truncate">{p.title}</span>
                      {isLive && (
                        <span className="inline-flex items-center rounded-full bg-[var(--accent)] px-2 py-0.5 text-[11px] font-semibold tracking-wide text-[var(--text-on-accent)] shrink-0">Live</span>
                      )}
                      {!isLive && p.published_at && <span className="text-[11px] text-[var(--text-tertiary)] shrink-0">Published {new Date(p.published_at).toLocaleDateString()}</span>}
                    </div>
                    <span className="text-[12px] text-[var(--text-tertiary)]">
                      Updated {new Date(p.draft_updated_at).toLocaleString()} · <span className="font-mono text-[11px]">{p.id.slice(0, 8)}…</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                    <Link
                      to={`/dashboard/pages/${p.id}/edit`}
                      className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface-raised)] px-3 text-[13px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface)] hover:border-[var(--border-strong)] hover:translate-y-[-1px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    >
                      Edit
                    </Link>

                    {!isLive ? (
                      <Button size="sm" variant="secondary" loading={publishingId === p.id} onClick={() => handlePublish(p.id)} aria-label={`Set ${p.title} as active`}>
                        Set as active
                      </Button>
                    ) : (
                      <span className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-[var(--accent)]/30 bg-[var(--bg-surface)] px-3 text-[12px] font-medium text-[var(--accent)]">Active</span>
                    )}

                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(p)} aria-label={`Delete ${p.title}`}>
                      Delete
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>

      {/* Delete confirm dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" aria-label="Close" onClick={() => setDeleteTarget(null)} className="absolute inset-0 bg-black/50 backdrop-blur-sm modal-backdrop" />
          <div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="relative w-full max-w-[420px] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 flex flex-col gap-4 shadow-xl modal-panel">
            <div className="flex flex-col gap-1">
              <h2 id="delete-title" className="text-[16px] font-semibold tracking-tight text-[var(--text-primary)]">
                Delete "{deleteTarget.title}"?
              </h2>
              <p className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
                This cannot be undone. {deleteTarget.id === activeId ? 'This is your live page - your public link will show “this page doesn’t exist yet” until you publish another.' : 'Views for this page remain in analytics if it was ever live.'}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting} aria-label="Confirm delete">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
