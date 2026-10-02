import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams, Link, useBlocker } from 'react-router-dom'
import { User, Link2, Layers, Briefcase, Palette, ShoppingBag, ChevronDown, Eye, X, ExternalLink, ArrowRight, ArrowLeft, Trash2, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ProfileRenderer } from '../components/ProfileRenderer/ProfileRenderer'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Switch } from '../components/ui/Switch'
import { InspectorSection } from '../components/Editor/InspectorSection'
import { uploadAvatar, uploadBackground, uploadAudio } from '../lib/storage'
import { DEFAULT_PAGE_CONFIG, PageConfigSchema, normalizeConfigUrls, PLUGIN_LIMIT, type PageConfig, type BackgroundEffect, type CardEffect, type AvatarSize, PRESET_PLUGINS, PRESET_SERVICES, CURRENCY_SYMBOLS, type Currency, formatPrice, FONT_OPTIONS, PRESET_DAWS, FONT_FAMILY_MAP, LANDING_TRANSITIONS } from '../types/pageConfig'

type FetchState = 'loading' | 'ready' | 'error' | 'notfound'

const effects: BackgroundEffect[] = ['none', 'blur', 'dark-overlay', 'gradient', 'vignette', 'black-and-white']
const bioSizes: PageConfig['profileHeader']['bioSize'][] = ['xs', 'sm', 'md', 'lg', 'xl']
const avatarSizes: Array<{ key: AvatarSize; label: string; px: number }> = [
  { key: 'sm', label: 'S', px: 48 },
  { key: 'md', label: 'M', px: 64 },
  { key: 'lg', label: 'L', px: 80 },
  { key: 'xl', label: 'XL', px: 96 },
]
const socialPlatforms: Array<{ key: keyof PageConfig['socials']; label: string; placeholder: string }> = [
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@...' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@...' },
  { key: 'discord', label: 'Discord', placeholder: 'https://discord.gg/...' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
  { key: 'spotify', label: 'Spotify', placeholder: 'https://open.spotify.com/...' },
  { key: 'soundcloud', label: 'SoundCloud', placeholder: 'https://soundcloud.com/...' },
  { key: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/...' },
  { key: 'beatstars', label: 'BeatStars', placeholder: 'https://beatstars.com/...' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
  { key: 'website', label: 'Website', placeholder: 'https://yourwebsite.com' },
]

const cardEffects: Array<{ value: CardEffect; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'solid', label: 'Solid' },
  { value: 'frosted', label: 'Frosted' },
  { value: 'glass', label: 'Glass' },
  { value: 'outline', label: 'Outline' },
]

function mergeConfig(raw: unknown): PageConfig {
  const parsed = PageConfigSchema.safeParse(raw)
  if (parsed.success) return parsed.data
  if (raw && typeof raw === 'object') {
    const rawObj = raw as Record<string, unknown>
    const rawServices = rawObj.services as Record<string, unknown> | undefined
    const rawPrice = rawObj.price as Record<string, unknown> | undefined
    return {
      ...DEFAULT_PAGE_CONFIG,
      ...rawObj,
      profileHeader: { ...DEFAULT_PAGE_CONFIG.profileHeader, ...((raw as PageConfig).profileHeader ?? {}) },
      socials: { ...DEFAULT_PAGE_CONFIG.socials, ...((raw as PageConfig).socials ?? {}) },
      daw: { ...DEFAULT_PAGE_CONFIG.daw, ...((raw as PageConfig).daw ?? {}) },
      plugins: { ...DEFAULT_PAGE_CONFIG.plugins, ...((raw as PageConfig).plugins ?? {}) },
      services: {
        ...DEFAULT_PAGE_CONFIG.services,
        ...(rawServices ?? {}),
        selected: Array.isArray(rawServices?.selected) ? rawServices!.selected as string[] : [],
      },
      price: {
        ...DEFAULT_PAGE_CONFIG.price,
        ...(rawPrice ?? {}),
        min: typeof rawPrice?.min === 'number' ? rawPrice.min : undefined,
        max: typeof rawPrice?.max === 'number' ? rawPrice.max : undefined,
      },
      products: { ...DEFAULT_PAGE_CONFIG.products, ...((raw as PageConfig).products ?? {}) },
      landing: { ...DEFAULT_PAGE_CONFIG.landing, ...((raw as PageConfig).landing ?? {}) },
      media: {
        ...DEFAULT_PAGE_CONFIG.media,
        ...((raw as PageConfig).media ?? {}),
        landing: { ...DEFAULT_PAGE_CONFIG.media.landing, ...((raw as PageConfig).media?.landing ?? {}) },
        main: { ...DEFAULT_PAGE_CONFIG.media.main, ...((raw as PageConfig).media?.main ?? {}) },
      },
      style: { ...DEFAULT_PAGE_CONFIG.style, ...((raw as PageConfig).style ?? {}) },
    }
  }
  return DEFAULT_PAGE_CONFIG
}

export function Editor() {
  const { pageId } = useParams<{ pageId: string }>()
  const { user, profile } = useAuth()
  const [fetchState, setFetchState] = useState<FetchState>('loading')
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [title, setTitle] = useState('Untitled Page')
  const [publishedAt, setPublishedAt] = useState<string | null>(null)
  const [draft, setDraft] = useState<PageConfig>(DEFAULT_PAGE_CONFIG)
  const [previewMode, setPreviewMode] = useState<'landing' | 'main'>('main')
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [templateModalClosing, setTemplateModalClosing] = useState(false)
  const templateCloseTimer = useRef<number | null>(null)
  const [tplName, setTplName] = useState('')
  const [tplDescription, setTplDescription] = useState('')
  const [tplPublic, setTplPublic] = useState(false)
  const [tplError, setTplError] = useState<string | null>(null)
  const [existingTemplate, setExistingTemplate] = useState<{ id: string; name: string } | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [pluginInput, setPluginInput] = useState('')
  const [pluginDropdownOpen, setPluginDropdownOpen] = useState(false)
  const pluginButtonRef = useRef<HTMLButtonElement | null>(null)
  const [pluginDropdownRect, setPluginDropdownRect] = useState<DOMRect | null>(null)
  const [dawInput, setDawInput] = useState('')
  const [dawDropdownOpen, setDawDropdownOpen] = useState(false)
  const dawButtonRef = useRef<HTMLButtonElement | null>(null)
  const [dawDropdownRect, setDawDropdownRect] = useState<DOMRect | null>(null)
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false)
  const [bodyFontOpen, setBodyFontOpen] = useState(false)
  const bodyFontButtonRef = useRef<HTMLButtonElement | null>(null)
  const [bodyFontRect, setBodyFontRect] = useState<DOMRect | null>(null)
  const fontButtonRef = useRef<HTMLButtonElement | null>(null)
  const [fontDropdownRect, setFontDropdownRect] = useState<DOMRect | null>(null)
  const [productTitle, setProductTitle] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [productsModalOpen, setProductsModalOpen] = useState(false)
  const initialDraftRef = useRef<PageConfig>(DEFAULT_PAGE_CONFIG)
  const initialTitleRef = useRef<string>('Untitled Page')
  const [hasRestored, setHasRestored] = useState(false)
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'pending' | 'saving' | 'saved'>('idle')
  const autoSaveTimer = useRef<number | null>(null)
  const saveRef = useRef<() => Promise<void>>(async () => {})
  const draftRef = useRef<PageConfig>(DEFAULT_PAGE_CONFIG)
  // Tab refocus re-fires Supabase auth events with a new `user` object identity -
  // without this guard the editor would refetch and replay the loading shimmer.
  const loadedKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!pluginDropdownOpen || !pluginButtonRef.current) return
    const update = () => {
      const r = pluginButtonRef.current?.getBoundingClientRect()
      if (r) setPluginDropdownRect(r)
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [pluginDropdownOpen])

  useEffect(() => {
    if (!dawDropdownOpen || !dawButtonRef.current) return
    const update = () => {
      const r = dawButtonRef.current?.getBoundingClientRect()
      if (r) setDawDropdownRect(r)
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [dawDropdownOpen])

  useEffect(() => {
    if (!fontDropdownOpen || !fontButtonRef.current) return
    const update = () => {
      const r = fontButtonRef.current?.getBoundingClientRect()
      if (r) setFontDropdownRect(r)
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [fontDropdownOpen])

  useEffect(() => {
    if (!bodyFontOpen || !bodyFontButtonRef.current) return
    const update = () => {
      const r = bodyFontButtonRef.current?.getBoundingClientRect()
      if (r) setBodyFontRect(r)
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [bodyFontOpen])

  useEffect(() => {
    if (!productsModalOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setProductsModalOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [productsModalOpen])

  const storageKey = useMemo(() => (pageId ? `sauce:draft:${pageId}` : null), [pageId])

  const isDirty = useMemo(() => {
    if (fetchState !== 'ready') return false
    try {
      return JSON.stringify(draft) !== JSON.stringify(initialDraftRef.current) || title !== initialTitleRef.current
    } catch {
      return true
    }
  }, [draft, title, fetchState])

  useEffect(() => {
    draftRef.current = draft
  }, [draft])

  const blocker = useBlocker(isDirty)

  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  useEffect(() => {
    if (fetchState !== 'ready' || !storageKey) return
    if (!isDirty) {
      try { sessionStorage.removeItem(storageKey) } catch { /* ignore */ }
      return
    }
    try {
      const payload = JSON.stringify({ draft, title, at: Date.now() })
      sessionStorage.setItem(storageKey, payload)
    } catch { /* ignore quota */ }
  }, [draft, title, isDirty, fetchState, storageKey])

  const username = profile?.username
  const userId = user?.id

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!pageId || !userId) return
      // Already loaded for this page+user - skip so tab refocus never replays shimmer.
      const loadKey = `${pageId}:${userId}`
      if (loadedKeyRef.current === loadKey) return
      setFetchState('loading')
      setFetchError(null)
      setHasRestored(false)
      const { data, error } = await supabase.from('pages').select('*').eq('id', pageId).maybeSingle()
      if (cancelled) return
      if (error) {
        setFetchError(error.message)
        setFetchState('error')
        return
      }
      if (!data) {
        loadedKeyRef.current = loadKey
        setFetchState('notfound')
        return
      }
      if (data.profile_id !== userId) {
        loadedKeyRef.current = loadKey
        setFetchError('You do not own this page.')
        setFetchState('error')
        return
      }
      const fetchedTitle = data.title ?? 'Untitled Page'
      const fetchedDraft = mergeConfig(data.draft_config)
      initialTitleRef.current = fetchedTitle
      initialDraftRef.current = fetchedDraft
      setPublishedAt(data.published_at ?? null)

      // Restore unsaved changes from sessionStorage if present
      const key = `sauce:draft:${pageId}`
      try {
        const raw = sessionStorage.getItem(key)
        if (raw) {
          const parsed = JSON.parse(raw) as { draft?: unknown; title?: string }
          if (parsed && typeof parsed === 'object') {
            if (parsed.draft && typeof parsed.draft === 'object') {
              const restored = mergeConfig(parsed.draft)
              setDraft(restored)
              setTitle(typeof parsed.title === 'string' ? parsed.title : fetchedTitle)
              setHasRestored(true)
              loadedKeyRef.current = loadKey
              setFetchState('ready')
              return
            }
          }
        }
      } catch { /* ignore */ }

      setTitle(fetchedTitle)
      setDraft(fetchedDraft)
      loadedKeyRef.current = loadKey
      setFetchState('ready')
    }
    load()
    return () => {
      cancelled = true
    }
  }, [pageId, userId])

  // Auto-save: after a short idle period, persist the draft to the server so a
  // crash or closed tab loses at most a few seconds of work. Never runs while a
  // manual save/publish or an upload is already in flight.
  useEffect(() => {
    if (fetchState !== 'ready' || !pageId || !isDirty) return
    if (saving || publishing || uploading) return
    if (autoSaveTimer.current) window.clearTimeout(autoSaveTimer.current)
    setAutoSaveState('pending')
    autoSaveTimer.current = window.setTimeout(() => {
      setAutoSaveState('saving')
      void saveRef.current().then(() => setAutoSaveState('saved'))
    }, 2000)
    return () => {
      if (autoSaveTimer.current) window.clearTimeout(autoSaveTimer.current)
    }
  }, [draft, title, isDirty, fetchState, pageId, saving, publishing, uploading])

  const liveHref = useMemo(() => (username ? `/${username}` : null), [username])
  const canLive = !!publishedAt

  async function handleSave() {
    if (!pageId) return
    setSaving(true)
    setSaveError(null)
    const snapshot = draft
    const titleSnapshot = title
    try {
      const parsed = PageConfigSchema.safeParse(normalizeConfigUrls(snapshot))
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid config')
      const { error } = await supabase.from('pages').update({ draft_config: parsed.data, draft_updated_at: new Date().toISOString(), title: titleSnapshot }).eq('id', pageId)
      if (error) throw error
      // Never write the parsed snapshot back into `draft` while the user might
      // still be typing. Only adopt the normalised copy (https:// prefixes) when
      // the draft has not changed since we snapshotted it, so a finished save
      // always reads as clean without swallowing newer keystrokes.
      const live = draftRef.current
      initialDraftRef.current = parsed.data
      if (JSON.stringify(live) === JSON.stringify(snapshot)) setDraft(parsed.data)
      initialTitleRef.current = titleSnapshot
      setHasRestored(false)
      try { sessionStorage.removeItem(`sauce:draft:${pageId}`) } catch { /* ignore */ }
      setSavedAt(new Date().toLocaleTimeString())
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  // Keep the auto-save effect pointed at the latest save implementation without
  // re-running it whenever `draft` changes.
  useEffect(() => {
    saveRef.current = handleSave
  })

  async function handlePublish() {
    if (!pageId) return
    setPublishing(true)
    setSaveError(null)
    const snapshot = draft
    const titleSnapshot = title
    try {
      const parsed = PageConfigSchema.safeParse(normalizeConfigUrls(snapshot))
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid config')
      const { error: saveErr } = await supabase.from('pages').update({ draft_config: parsed.data, draft_updated_at: new Date().toISOString(), title: titleSnapshot }).eq('id', pageId)
      if (saveErr) throw saveErr
      const { error } = await supabase.rpc('publish_page', { p_page_id: pageId })
      if (error) throw error
      const live = draftRef.current
      initialDraftRef.current = parsed.data
      if (JSON.stringify(live) === JSON.stringify(snapshot)) setDraft(parsed.data)
      initialTitleRef.current = titleSnapshot
      setHasRestored(false)
      try { sessionStorage.removeItem(`sauce:draft:${pageId}`) } catch { /* ignore */ }
      setPublishedAt(new Date().toISOString())
      setSavedAt(new Date().toLocaleTimeString())
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Publish failed')
    } finally {
      setPublishing(false)
    }
  }

  // A page can back at most one template; once saved, the header offers a jump
  // to that template instead of creating duplicates.
  useEffect(() => {
    if (fetchState !== 'ready' || !pageId || !user) return
    let cancelled = false
    supabase
      .from('templates')
      .select('id, name')
      .eq('owner_id', user.id)
      .eq('source_page_id', pageId)
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled || error) return
        setExistingTemplate((data as { id: string; name: string } | null) ?? null)
      })
    return () => {
      cancelled = true
    }
  }, [fetchState, pageId, user])

  function closeTemplateModal() {
    setTemplateModalClosing(true)
    if (templateCloseTimer.current) window.clearTimeout(templateCloseTimer.current)
    templateCloseTimer.current = window.setTimeout(() => {
      setTemplateModalOpen(false)
      setTemplateModalClosing(false)
      templateCloseTimer.current = null
    }, 220)
  }

  function openTemplateModal() {
    setTplName(title.trim() || 'Untitled Template')
    setTplDescription('')
    setTplPublic(false)
    setTplError(null)
    setTemplateModalOpen(true)
  }

  async function handleSaveTemplate() {
    if (!user) return
    const name = tplName.trim()
    if (!name) {
      setTplError('Give the template a name.')
      return
    }
    setSavingTemplate(true)
    setTplError(null)
    try {
      const parsed = PageConfigSchema.safeParse(draft)
      const config = parsed.success ? parsed.data : draft
      const { data, error } = await supabase
        .from('templates')
        .insert({
          owner_id: user.id,
          name: name.slice(0, 60),
          description: tplDescription.trim() || null,
          config,
          is_public: tplPublic,
          source_page_id: pageId,
        })
        .select('id, name')
        .single()
      if (error) throw error
      setExistingTemplate(data as { id: string; name: string })
      setTemplateModalOpen(false)
    } catch (e) {
      setTplError(e instanceof Error ? e.message : 'Could not save template')
    } finally {
      setSavingTemplate(false)
    }
  }

  function update(path: string, value: unknown) {
    setDraft((prev) => {
      const next = structuredClone(prev) as PageConfig
      const keys = path.split('.')
      let cur: Record<string, unknown> = next as unknown as Record<string, unknown>
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]] as Record<string, unknown>
      cur[keys[keys.length - 1]] = value
      return next
    })
  }

  if (fetchState === 'loading') {
    return (
      <div className="h-[100dvh] overflow-hidden bg-[var(--bg-base)] flex flex-col" aria-busy="true" aria-label="Loading editor">
        <div className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center px-4 gap-3">
          <div className="h-4 w-20 skeleton" />
          <div className="h-6 w-32 skeleton ml-4" />
          <div className="ml-auto flex gap-2">
            <div className="h-8 w-14 skeleton" />
            <div className="h-8 w-16 skeleton" />
          </div>
        </div>
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-0 overflow-hidden">
          <div className="border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex flex-col gap-3 overflow-hidden">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 skeleton rounded-[var(--radius-md)]" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
          <div className="bg-[var(--bg-sunken)] p-6 flex items-center justify-center overflow-hidden">
            <div className="w-full max-w-[560px] h-[520px] skeleton rounded-[var(--radius-md)]" />
          </div>
        </div>
      </div>
    )
  }

  if (fetchState === 'notfound') {
    return (
      <div className="h-[100dvh] overflow-hidden bg-[var(--bg-base)] flex flex-col items-center justify-center gap-3 p-8 text-center">
        <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">Page not found</h1>
        <p className="text-[13px] text-[var(--text-secondary)]">This page does not exist or you do not have access.</p>
        <Link to="/dashboard/pages" className="text-[13px] text-[var(--accent)] hover:underline underline-offset-2">Back to pages</Link>
      </div>
    )
  }

  if (fetchState === 'error') {
    return (
      <div className="h-[100dvh] overflow-hidden bg-[var(--bg-base)] flex flex-col items-center justify-center gap-3 p-8 text-center">
        <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">Could not load editor</h1>
        <p className="text-[13px] text-[var(--danger)]" role="alert">{fetchError}</p>
        <Link to="/dashboard/pages" className="text-[13px] text-[var(--accent)] hover:underline underline-offset-2">Back to pages</Link>
      </div>
    )
  }

  const socialCount = Object.values(draft.socials).filter((v) => typeof v === 'string' && v.trim()).length
  const pluginFull = draft.plugins.tags.length >= PLUGIN_LIMIT
  const stackVisible = draft.daw.visible || draft.plugins.visible
  const offerVisible = draft.services.visible || draft.price.visible

  return (
    <div className="h-[100dvh] overflow-hidden bg-[var(--bg-base)] flex flex-col overscroll-none">
      <header className="h-14 shrink-0 flex items-center justify-between gap-2 px-3 sm:px-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] z-20">
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/dashboard/pages" className="flex items-center gap-1 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-[var(--radius-sm)] px-1"><ArrowLeft size={13} aria-hidden="true" /> Pages</Link>
          <input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Page title" className="hidden sm:block h-7 rounded-[var(--radius-sm)] border border-transparent bg-transparent px-2 text-[14px] font-medium text-[var(--text-primary)] focus:border-[var(--border-default)] focus:bg-[var(--bg-sunken)] focus:outline-none w-[180px]" />
          <span className="hidden sm:inline text-[12px] text-[var(--text-tertiary)]" role="status" aria-live="polite">
            {autoSaveState === 'pending' && 'Unsaved changes'}
            {autoSaveState === 'saving' && 'Saving…'}
            {autoSaveState === 'saved' && (savedAt ? `Saved ${savedAt}` : 'Saved')}
            {autoSaveState === 'idle' && savedAt && `Saved ${savedAt}`}
            {autoSaveState === 'idle' && !savedAt && 'Autosave on'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="inline-flex rounded-full border border-[var(--border-default)] bg-[var(--bg-sunken)] p-0.5" role="tablist" aria-label="Preview mode">
            {(['landing', 'main'] as const).map((m) => (
              <button key={m} role="tab" aria-selected={previewMode === m} onClick={() => setPreviewMode(m)} className={['rounded-full px-2.5 py-1 text-[12px] font-medium capitalize transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]', previewMode === m ? 'bg-[var(--accent)] text-[var(--text-on-accent)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'].join(' ')}>{m}</button>
            ))}
          </div>
          {saveError && <span role="alert" className="hidden sm:inline text-[12px] text-[var(--danger)] max-w-[220px] truncate">{saveError}</span>}
          {canLive && liveHref ? (
            <a href={liveHref} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface-raised)] px-3 text-[13px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">Live <ExternalLink size={13} aria-hidden="true" /></a>
          ) : (
            <span className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-dashed border-[var(--border-default)] px-3 text-[12px] text-[var(--text-tertiary)]" title="Publish to enable live link">Live</span>
          )}
          {existingTemplate ? (
            <Link
              to={`/dashboard/templates?template=${existingTemplate.id}`}
              className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface-raised)] px-3 text-[13px] font-medium text-[var(--text-primary)] transition-all duration-150 ease-out hover:bg-[var(--bg-surface)] hover:translate-y-[-1px] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              View template
            </Link>
          ) : (
            <Button variant="secondary" size="sm" loading={savingTemplate} onClick={openTemplateModal}>Save as template</Button>
          )}
          <Button variant="secondary" size="sm" onClick={handleSave} loading={saving}>Save</Button>
          <Button size="sm" onClick={handlePublish} loading={publishing} aria-label="Publish page">Publish</Button>
        </div>
      </header>

      {hasRestored && isDirty && (
        <div className="bg-[var(--warning)]/10 border-b border-[var(--warning)]/20 px-3 sm:px-4 py-2 flex items-center justify-between gap-3">
          <span className="text-[12px] text-[var(--text-primary)]">Restored unsaved changes</span>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => { if (storageKey) try { sessionStorage.removeItem(storageKey) } catch { /* ignore */ }; setDraft(initialDraftRef.current); setTitle(initialTitleRef.current); setHasRestored(false) }}>Discard</Button>
            <Button size="sm" onClick={handleSave} loading={saving}>Save</Button>
          </div>
        </div>
      )}

      {saveError && <div className="sm:hidden bg-[var(--danger)]/10 border-b border-[var(--danger)]/20 px-3 py-2 text-[12px] text-[var(--danger)]" role="alert">{saveError}</div>}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[380px_1fr] min-h-0 h-full overflow-hidden">
        <div className="border-b lg:border-b-0 lg:border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] h-full min-h-0 overflow-y-auto overscroll-contain inspector-scroll">
          <div className="p-3 sm:p-4 flex flex-col gap-3">
            <div className="sm:hidden">
              <Input label="Page title" value={title} onChange={(e) => setTitle(e.target.value)} />
              {savedAt && <p className="text-[11px] text-[var(--text-tertiary)] mt-1">Saved {savedAt}</p>}
            </div>

            {/* 1 - Profile */}
            <InspectorSection
              title="Profile"
              icon={<User size={13} />}
              checked={draft.profileHeader.visible}
              onToggle={(v) => update('profileHeader.visible', v)}
              align={draft.profileHeader.align}
              onAlignChange={(a) => update('profileHeader.align', a)}
              defaultOpen={true}
              badge={draft.profileHeader.displayName ? '1' : undefined}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full overflow-hidden border border-[var(--border-default)] bg-[var(--bg-surface)] shrink-0">
                    {draft.media.avatarUrl ? <img src={draft.media.avatarUrl} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center bg-[var(--bg-sunken)]"><User size={16} className="text-[var(--text-tertiary)]" /></div>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface-raised)] px-3 text-[13px] font-medium cursor-pointer hover:bg-[var(--bg-surface)] focus-within:ring-2 focus-within:ring-[var(--accent)]">
                      Upload
                      <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
                        const f = e.target.files?.[0]
                        if (!f || !user || !pageId) return
                        setUploading('avatar')
                        try { const url = await uploadAvatar(user.id, f); update('media.avatarUrl', url) } catch (err) { setSaveError(err instanceof Error ? err.message : 'Avatar upload failed') } finally { setUploading(null); e.target.value = '' }
                      }} />
                    </label>
                    <Button type="button" variant="secondary" size="sm" disabled={!profile?.discord_avatar_url} onClick={() => { if (profile?.discord_avatar_url) update('media.avatarUrl', profile.discord_avatar_url) }}>Import</Button>
                    {draft.media.avatarUrl && <Button type="button" variant="ghost" size="sm" onClick={() => update('media.avatarUrl', null)}>Clear</Button>}
                  </div>
                </div>
                {uploading === 'avatar' && <p className="text-[12px] text-[var(--text-tertiary)]">Uploading…</p>}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-[var(--text-primary)]">Avatar size</span>
                  <div className="inline-flex flex-wrap gap-1.5" role="group" aria-label="Avatar size">
                    {avatarSizes.map((s) => (
                      <button key={s.key} type="button" aria-pressed={draft.profileHeader.avatarSize === s.key} onClick={() => update('profileHeader.avatarSize', s.key)} className={['rounded-full px-2.5 py-1 text-[12px] font-medium border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors', draft.profileHeader.avatarSize === s.key ? 'bg-[var(--accent)] text-[var(--text-on-accent)] border-[var(--accent)]' : 'bg-[var(--bg-sunken)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-strong)]'].join(' ')}>{s.label}</button>
                    ))}
                  </div>
                </div>
                <Input label="Display name" value={draft.profileHeader.displayName} onChange={(e) => update('profileHeader.displayName', e.target.value)} placeholder="Atlas Bloom" />
                <Textarea label="Bio" value={draft.profileHeader.bio} onChange={(e) => update('profileHeader.bio', e.target.value)} placeholder="Lo-fi producer - tape textures, warm drums…" rows={3} />
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-[var(--text-primary)]">Bio size</span>
                  <div className="inline-flex flex-wrap gap-1.5" role="group" aria-label="Bio size">
                    {bioSizes.map((s) => (
                      <button key={s} type="button" aria-pressed={draft.profileHeader.bioSize === s} onClick={() => update('profileHeader.bioSize', s)} className={['rounded-full px-2.5 py-1 text-[12px] font-medium border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] capitalize transition-colors', draft.profileHeader.bioSize === s ? 'bg-[var(--accent)] text-[var(--text-on-accent)] border-[var(--accent)]' : 'bg-[var(--bg-sunken)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-strong)]'].join(' ')}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-[var(--text-primary)]">Heading font</span>
                  <div className="relative">
                    <button ref={fontButtonRef} type="button" aria-haspopup="listbox" aria-expanded={fontDropdownOpen} onClick={() => setFontDropdownOpen((v) => !v)} className="w-full h-9 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-sunken)] px-3 text-[13px] text-left text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] flex items-center justify-between">
                      <span style={{ fontFamily: FONT_FAMILY_MAP[draft.style.headingFont] ?? undefined }} className="truncate">{FONT_OPTIONS.find((f) => f.value === draft.style.headingFont)?.label ?? draft.style.headingFont}</span>
                      <ChevronDown size={14} className={`shrink-0 text-[var(--text-tertiary)] transition-transform ${fontDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {fontDropdownOpen && fontDropdownRect && createPortal(
                      <>
                        <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setFontDropdownOpen(false)} />
                        <div role="listbox" className="fixed z-50 max-h-[220px] overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xl" style={{ top: typeof window !== 'undefined' && window.innerHeight - fontDropdownRect.bottom < 240 && fontDropdownRect.top > 240 ? fontDropdownRect.top - 226 : fontDropdownRect.bottom + 6, left: fontDropdownRect.left, width: fontDropdownRect.width }}>
                          {FONT_OPTIONS.map((f) => (
                            <button key={f.value} type="button" role="option" aria-selected={draft.style.headingFont === f.value} onMouseDown={(e) => e.preventDefault()} onClick={() => { update('style.headingFont', f.value); setFontDropdownOpen(false) }} className={['w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left hover:bg-[var(--bg-surface-raised)] transition-colors', draft.style.headingFont === f.value ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'text-[var(--text-primary)]'].join(' ')}>
                              <span style={{ fontFamily: f.family }}>{f.label}</span>
                            </button>
                          ))}
                        </div>
                      </>,
                      document.body
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-[var(--text-primary)]">Body font</span>
                  <div className="relative">
                    <button ref={bodyFontButtonRef} type="button" aria-haspopup="listbox" aria-expanded={bodyFontOpen} onClick={() => setBodyFontOpen((v) => !v)} className="w-full h-9 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-sunken)] px-3 text-[13px] text-left text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] flex items-center justify-between">
                      <span style={{ fontFamily: FONT_FAMILY_MAP[draft.style.bodyFont ?? 'inter'] ?? undefined }} className="truncate">{FONT_OPTIONS.find((f) => f.value === draft.style.bodyFont)?.label ?? draft.style.bodyFont}</span>
                      <ChevronDown size={14} className={`shrink-0 text-[var(--text-tertiary)] transition-transform ${bodyFontOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {bodyFontOpen && bodyFontRect && createPortal(
                      <>
                        <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setBodyFontOpen(false)} />
                        <div role="listbox" className="fixed z-50 max-h-[220px] overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xl" style={{ top: typeof window !== 'undefined' && window.innerHeight - bodyFontRect.bottom < 240 && bodyFontRect.top > 240 ? bodyFontRect.top - 226 : bodyFontRect.bottom + 6, left: bodyFontRect.left, width: bodyFontRect.width }}>
                          {FONT_OPTIONS.map((f) => (
                            <button key={f.value} type="button" role="option" aria-selected={(draft.style.bodyFont ?? 'inter') === f.value} onMouseDown={(e) => e.preventDefault()} onClick={() => { update('style.bodyFont', f.value); setBodyFontOpen(false) }} className={['w-full px-3 py-2 text-[13px] text-left hover:bg-[var(--bg-surface-raised)] transition-colors', (draft.style.bodyFont ?? 'inter') === f.value ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'text-[var(--text-primary)]'].join(' ')}>
                              <span style={{ fontFamily: f.family }}>{f.label}</span>
                            </button>
                          ))}
                        </div>
                      </>,
                      document.body
                    )}
                  </div>
                </div>
                <label className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-sunken)] px-3 py-2.5">
                  <span className="text-[13px] font-medium text-[var(--text-primary)] flex items-center gap-2"><User size={14} /> Open for collabs</span>
                  <Switch checked={draft.profileHeader.openForCollabs} onChange={(v) => update('profileHeader.openForCollabs', v)} label="Open for collabs" />
                </label>
              </div>
            </InspectorSection>

            {/* 2 - Links */}
            <InspectorSection title="Links" icon={<Link2 size={13} />} checked={draft.socials.visible} onToggle={(v) => update('socials.visible', v)} align={draft.socials.align} onAlignChange={(a) => update('socials.align', a)} badge={socialCount ? String(socialCount) : undefined}>
              <div className="flex flex-col gap-3">
                {socialPlatforms.map(({ key, label, placeholder }) => (
                  <Input
                    key={key}
                    label={label}
                    value={(draft.socials[key] as string) ?? ''}
                    onChange={(e) => update(`socials.${key}`, e.target.value || undefined)}
                    placeholder={placeholder}
                  />
                ))}
                <p className="text-[12px] text-[var(--text-tertiary)]">Empty links are hidden.</p>
              </div>
            </InspectorSection>

            {/* 3 - Stack (DAW + Plugins) */}
            <InspectorSection
              title="Stack"
              icon={<Layers size={13} />}
              checked={stackVisible}
              onToggle={(v) => { update('daw.visible', v); update('plugins.visible', v) }}
              align={draft.daw.align}
              onAlignChange={(a) => { update('daw.align', a); update('plugins.align', a) }}
              badge={draft.plugins.tags.length ? String(draft.plugins.tags.length) : undefined}
              defaultOpen={true}
            >
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-[var(--text-primary)]">DAW</span>
                <div className="relative">
                  <button ref={dawButtonRef} type="button" aria-haspopup="listbox" aria-expanded={dawDropdownOpen} onClick={() => setDawDropdownOpen((v) => !v)} className="w-full h-9 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-sunken)] px-3 text-[13px] text-left text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] flex items-center justify-between">
                    <span className="truncate">{draft.daw.value || 'Select DAW…'}</span>
                    <ChevronDown size={14} className={`shrink-0 text-[var(--text-tertiary)] transition-transform ${dawDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {dawDropdownOpen && dawDropdownRect && createPortal(
                    <>
                      <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setDawDropdownOpen(false)} />
                      <div role="listbox" className="fixed z-50 max-h-[220px] overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xl" style={{ top: typeof window !== 'undefined' && window.innerHeight - dawDropdownRect.bottom < 240 && dawDropdownRect.top > 240 ? dawDropdownRect.top - 226 : dawDropdownRect.bottom + 6, left: dawDropdownRect.left, width: dawDropdownRect.width }}>
                        {PRESET_DAWS.map((d) => (
                          <button key={d} type="button" role="option" aria-selected={draft.daw.value === d} onMouseDown={(e) => e.preventDefault()} onClick={() => { update('daw.value', d); setDawDropdownOpen(false) }} className={['w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left hover:bg-[var(--bg-surface-raised)] transition-colors', draft.daw.value === d ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'text-[var(--text-primary)]'].join(' ')}>{d}</button>
                        ))}
                        <div className="border-t border-[var(--border-default)] px-3 py-2 bg-[var(--bg-surface)]">
                          <div className="flex gap-2">
                            <input value={dawInput} onChange={(e) => setDawInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && dawInput.trim()) { e.preventDefault(); update('daw.value', dawInput.trim()); setDawInput(''); setDawDropdownOpen(false) } }} placeholder="Custom DAW…" aria-label="Custom DAW" className="flex-1 h-8 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-sunken)] px-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                            <Button type="button" variant="secondary" size="sm" onMouseDown={(e) => e.preventDefault()} onClick={() => { if (!dawInput.trim()) return; update('daw.value', dawInput.trim()); setDawInput(''); setDawDropdownOpen(false) }}>Add</Button>
                          </div>
                        </div>
                      </div>
                    </>,
                    document.body
                  )}
                </div>
                {draft.daw.value && <p className="text-[12px] text-[var(--text-tertiary)]">{draft.daw.value} <button type="button" onClick={() => update('daw.value', '')} className="ml-1 text-[var(--danger)] hover:underline">Clear</button></p>}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-medium text-[var(--text-primary)] flex items-center gap-2"><Layers size={14} /> Plugins</span>
                <div className="relative">
                  <button ref={pluginButtonRef} type="button" aria-haspopup="listbox" aria-expanded={pluginDropdownOpen} onClick={() => setPluginDropdownOpen((v) => !v)} className="w-full h-9 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-sunken)] px-3 text-[13px] text-left text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] flex items-center justify-between">
                    <span className="truncate">{draft.plugins.tags.length ? `${draft.plugins.tags.length}/${PLUGIN_LIMIT} selected` : 'Pick VSTs…'}</span>
                    <ChevronDown size={14} className={`shrink-0 text-[var(--text-tertiary)] transition-transform ${pluginDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {pluginDropdownOpen && pluginDropdownRect && createPortal(
                    <>
                      <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setPluginDropdownOpen(false)} />
                      <div role="listbox" className="fixed z-50 max-h-[220px] overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xl" style={{ top: typeof window !== 'undefined' && window.innerHeight - pluginDropdownRect.bottom < 240 && pluginDropdownRect.top > 240 ? pluginDropdownRect.top - 226 : pluginDropdownRect.bottom + 6, left: pluginDropdownRect.left, width: pluginDropdownRect.width }}>
                        {PRESET_PLUGINS.map((p) => (
                          <button key={p} type="button" role="option" aria-selected={draft.plugins.tags.includes(p)} aria-disabled={!draft.plugins.tags.includes(p) && pluginFull} disabled={!draft.plugins.tags.includes(p) && pluginFull} onMouseDown={(e) => e.preventDefault()} onClick={() => { const tags = draft.plugins.tags.includes(p) ? draft.plugins.tags.filter((x) => x !== p) : [...draft.plugins.tags, p]; update('plugins.tags', tags) }} className={['w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left transition-colors', pluginFull && !draft.plugins.tags.includes(p) ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[var(--bg-surface-raised)]'].join(' ')}>
                            <span className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${draft.plugins.tags.includes(p) ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border-default)] bg-[var(--bg-sunken)]'}`}>
                              {draft.plugins.tags.includes(p) && <Check size={11} strokeWidth={3} className="text-[var(--text-on-accent)]" aria-hidden="true" />}
                            </span>
                            <span className="text-[var(--text-primary)]">{p}</span>
                          </button>
                        ))}
                        <div className="border-t border-[var(--border-default)] px-3 py-2 bg-[var(--bg-surface)]">
                          <div className="flex gap-2">
                            <input value={pluginInput} onChange={(e) => setPluginInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && pluginInput.trim()) { e.preventDefault(); const tag = pluginInput.trim(); if (!draft.plugins.tags.includes(tag) && draft.plugins.tags.length < PLUGIN_LIMIT) update('plugins.tags', [...draft.plugins.tags, tag]); setPluginInput('') } }} placeholder="Custom VST…" aria-label="Add custom plugin" className="flex-1 h-8 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-sunken)] px-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50" disabled={pluginFull} />
                            <Button type="button" variant="secondary" size="sm" onMouseDown={(e) => e.preventDefault()} disabled={pluginFull} onClick={() => { const tag = pluginInput.trim(); if (!tag) return; if (!draft.plugins.tags.includes(tag) && draft.plugins.tags.length < PLUGIN_LIMIT) update('plugins.tags', [...draft.plugins.tags, tag]); setPluginInput('') }}>Add</Button>
                          </div>
                        </div>
                      </div>
                    </>,
                    document.body
                  )}
                </div>
                {draft.plugins.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5" role="list" aria-label="Plugin tags">
                    {draft.plugins.tags.map((t) => (
                      <span key={t} role="listitem" className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface-raised)] px-2.5 py-1 text-[12px] font-medium hover:border-[var(--border-strong)] transition-colors">{t}<button type="button" aria-label={`Remove ${t}`} onClick={() => update('plugins.tags', draft.plugins.tags.filter((x) => x !== t))} className="rounded-full hover:text-[var(--danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"><X size={11} aria-hidden="true" /></button></span>
                    ))}
                  </div>
                )}
                <p className={`text-[11px] leading-[1.4] ${pluginFull ? 'text-[var(--warning)]' : 'text-[var(--text-tertiary)]'}`}>
                  {pluginFull
                    ? `Limit reached (${PLUGIN_LIMIT}). Remove one to add another.`
                    : `Up to ${PLUGIN_LIMIT} plugins.`}
                </p>
              </div>
            </InspectorSection>

            {/* 4 - Offer (Services + Price) */}
            <InspectorSection
              title="Offer"
              icon={<Briefcase size={13} />}
              checked={offerVisible}
              onToggle={(v) => { update('services.visible', v); update('price.visible', v) }}
              align={draft.services.align}
              onAlignChange={(a) => { update('services.align', a); update('price.align', a) }}
              defaultOpen={true}
            >
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-medium text-[var(--text-primary)]">Services</span>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Services">
                  {PRESET_SERVICES.map((s) => {
                    const active = draft.services.selected.includes(s)
                    return (
                      <button key={s} type="button" aria-pressed={active} onClick={() => { const sel = active ? draft.services.selected.filter((x) => x !== s) : [...draft.services.selected, s]; update('services.selected', sel) }} className={['rounded-full px-2.5 py-1 text-[12px] font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]', active ? 'bg-[var(--accent)] text-[var(--text-on-accent)] border-[var(--accent)]' : 'bg-[var(--bg-sunken)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-strong)]'].join(' ')}>{s}</button>
                    )
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-medium text-[var(--text-primary)]">Price</span>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <div className="w-20 flex flex-col gap-1">
                      <span className="text-[11px] text-[var(--text-tertiary)]">Min</span>
                      <input type="number" min={0} value={draft.price.min ?? ''} onChange={(e) => update('price.min', e.target.value ? Number(e.target.value) : undefined)} placeholder="0" aria-label="Minimum price" className="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-sunken)] px-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                    </div>
                    <div className="w-20 flex flex-col gap-1">
                      <span className="text-[11px] text-[var(--text-tertiary)]">Max</span>
                      <input type="number" min={0} value={draft.price.max ?? ''} onChange={(e) => update('price.max', e.target.value ? Number(e.target.value) : undefined)} placeholder="0" aria-label="Maximum price" className="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-sunken)] px-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] text-[var(--text-tertiary)]">Currency</span>
                      <select value={draft.price.currency} onChange={(e) => update('price.currency', e.target.value as Currency)} aria-label="Currency" className="h-9 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-sunken)] px-2 text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                        {Object.entries(CURRENCY_SYMBOLS).map(([code, sym]) => (
                          <option key={code} value={code}>{sym} {code}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button type="button" aria-pressed={draft.price.free} onClick={() => update('price.free', !draft.price.free)} className={['rounded-full px-2.5 py-1 text-[12px] font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]', draft.price.free ? 'bg-[var(--accent)] text-[var(--text-on-accent)] border-[var(--accent)]' : 'bg-[var(--bg-sunken)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-strong)]'].join(' ')}>Free</button>
                    <button type="button" aria-pressed={draft.price.negotiable} onClick={() => update('price.negotiable', !draft.price.negotiable)} className={['rounded-full px-2.5 py-1 text-[12px] font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]', draft.price.negotiable ? 'bg-[var(--accent)] text-[var(--text-on-accent)] border-[var(--accent)]' : 'bg-[var(--bg-sunken)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-strong)]'].join(' ')}>Negotiable</button>
                  </div>
                  {formatPrice(draft.price) && <p className="text-[12px] text-[var(--text-tertiary)]">{formatPrice(draft.price)}</p>}
                </div>
              </div>
            </InspectorSection>

            {/* 5 - Products */}
            <InspectorSection
              title="Products"
              icon={<ShoppingBag size={13} />}
              checked={draft.products.visible}
              onToggle={(v) => update('products.visible', v)}
              align={draft.products.align}
              onAlignChange={(a) => update('products.align', a)}
              badge={draft.products.items.length ? String(draft.products.items.length) : undefined}
              hideHiddenText
              defaultOpen={false}
            >
              <div className="flex flex-col gap-3">
                <Input label="Link title" value={draft.products.linkTitle} onChange={(e) => update('products.linkTitle', e.target.value)} placeholder="Products" />
                <button type="button" onClick={() => setProductsModalOpen(true)} className="flex items-center justify-between w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface-raised)] px-3 py-2.5 text-left hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
                  <span className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-primary)]"><ShoppingBag size={14} /> {draft.products.linkTitle || 'Products'}</span>
                  <span className="flex items-center gap-1 text-[12px] text-[var(--text-tertiary)]">{draft.products.items.length} items <ArrowRight size={12} aria-hidden="true" /></span>
                </button>
                <p className="text-[11px] leading-[1.4] text-[var(--text-tertiary)]">Click to add and manage product links. Each item opens its URL.</p>
              </div>
            </InspectorSection>

            {/* 6 - Landing */}
            <InspectorSection
              title="Landing"
              icon={<Eye size={13} />}
              align={draft.landing.align}
              onAlignChange={(a) => update('landing.align', a)}
              badge={draft.landing.headline ? '1' : undefined}
              defaultOpen={false}
            >
              <Input label="Headline" value={draft.landing.headline} onChange={(e) => update('landing.headline', e.target.value)} placeholder="Atlas Bloom" />
              <Input label="Subheadline" value={draft.landing.subheadline} onChange={(e) => update('landing.subheadline', e.target.value)} placeholder="Lo-fi producer - tape textures" />
              <Input label="Button text" value={draft.landing.ctaLabel} onChange={(e) => update('landing.ctaLabel', e.target.value)} placeholder="CHECK MY PAGE" />
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-[var(--text-primary)]">Transition to main</span>
                <div className="inline-flex flex-wrap gap-1.5" role="group" aria-label="Landing transition">
                  {LANDING_TRANSITIONS.map((t) => (
                    <button key={t.value} type="button" aria-pressed={draft.landing.transition === t.value} onClick={() => update('landing.transition', t.value)} className={['rounded-full px-2.5 py-1 text-[12px] font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] capitalize', draft.landing.transition === t.value ? 'bg-[var(--accent)] text-[var(--text-on-accent)] border-[var(--accent)]' : 'bg-[var(--bg-sunken)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-strong)]'].join(' ')}>{t.label}</button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-[var(--text-primary)]">Show on landing</span>
                {([
                  ['showAvatar', 'Avatar'],
                  ['showHeadline', 'Headline'],
                  ['showSubheadline', 'Subheadline'],
                  ['showCollabChip', 'Collab chip'],
                  ['showCta', 'Main button'],
                ] as Array<[keyof PageConfig['landing'], string]>).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-sunken)] px-3 py-2">
                    <span className="text-[13px] text-[var(--text-primary)]">{label}</span>
                    <Switch checked={draft.landing[key] !== false} onChange={(v) => update(`landing.${key}`, v)} label={`Show ${label.toLowerCase()} on landing`} />
                  </label>
                ))}
                <p className="text-[11px] leading-[1.4] text-[var(--text-tertiary)]">With the main button hidden, a quiet “Open page” link still appears so visitors are never stuck.</p>
              </div>
            </InspectorSection>

            {/* 7 - Atmosphere (Media + Style) */}
            <InspectorSection title="Atmosphere" icon={<Palette size={13} />} defaultOpen={true}>
              <AssetBackgroundRow label="Landing background" url={draft.media.landing.backgroundUrl} type={draft.media.landing.backgroundType} uploading={uploading === 'landing'} onUpload={async (f) => { if (!user || !pageId) return; setUploading('landing'); try { const { url, type } = await uploadBackground(user.id, pageId, 'landing', f, draft.media.landing.backgroundUrl); update('media.landing.backgroundUrl', url); update('media.landing.backgroundType', type) } catch (err) { setSaveError(err instanceof Error ? err.message : 'Upload failed') } finally { setUploading(null) } }} onClear={() => { update('media.landing.backgroundUrl', null); update('media.landing.backgroundType', null) }} />
              {!draft.media.landing.backgroundUrl && draft.media.main.backgroundUrl && (
                <Button type="button" variant="secondary" size="sm" onClick={() => { update('media.landing.backgroundUrl', draft.media.main.backgroundUrl); update('media.landing.backgroundType', draft.media.main.backgroundType) }}>
                  Use main background
                </Button>
              )}
              <AssetBackgroundRow label="Main background" url={draft.media.main.backgroundUrl} type={draft.media.main.backgroundType} uploading={uploading === 'main'} onUpload={async (f) => { if (!user || !pageId) return; setUploading('main'); try { const { url, type } = await uploadBackground(user.id, pageId, 'main', f, draft.media.main.backgroundUrl); update('media.main.backgroundUrl', url); update('media.main.backgroundType', type) } catch (err) { setSaveError(err instanceof Error ? err.message : 'Upload failed') } finally { setUploading(null) } }} onClear={() => { update('media.main.backgroundUrl', null); update('media.main.backgroundType', null) }} />
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-medium text-[var(--text-primary)] flex items-center gap-2"><Palette size={14} /> Background audio</span>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface-raised)] px-3 text-[13px] font-medium cursor-pointer hover:bg-[var(--bg-surface)] focus-within:ring-2 focus-within:ring-[var(--accent)]">Upload audio<input type="file" accept="audio/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (!f || !user || !pageId) return; setUploading('audio'); try { const url = await uploadAudio(user.id, pageId, f); update('media.audioUrl', url) } catch (err) { setSaveError(err instanceof Error ? err.message : 'Audio upload failed') } finally { setUploading(null); e.target.value = '' } }} /></label>
                  {draft.media.audioUrl && <Button type="button" variant="ghost" size="sm" onClick={() => update('media.audioUrl', null)}>Clear</Button>}
                  {uploading === 'audio' && <span className="text-[12px] text-[var(--text-tertiary)]">Uploading…</span>}
                </div>
                {draft.media.audioUrl && (<><audio controls loop src={draft.media.audioUrl} preload="metadata" className="w-full h-8" /><label className="flex items-center gap-3"><span className="text-[12px] text-[var(--text-secondary)] shrink-0">Volume {draft.media.audioVolume}%</span><input type="range" min={0} max={100} value={draft.media.audioVolume} onChange={(e) => update('media.audioVolume', Number(e.target.value))} className="flex-1 accent-[var(--accent)]" aria-label="Audio volume" /></label><p className="text-[11px] leading-[1.4] text-[var(--text-tertiary)]">Visitors hear this on the main page only - no player, it loops automatically. Use the volume button in the preview to check the 100/75/50/25/mute steps.</p></>)}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5"><span className="text-[13px] font-medium text-[var(--text-primary)]">Text color</span><span className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1.5"><input type="color" value={draft.style.textColor} onChange={(e) => update('style.textColor', e.target.value)} className="h-6 w-6 rounded border-0 bg-transparent p-0" aria-label="Text color" /><span className="text-[12px] text-[var(--text-secondary)] font-mono">{draft.style.textColor}</span></span></label>
                <label className="flex flex-col gap-1.5"><span className="text-[13px] font-medium text-[var(--text-primary)]">Icon color</span><span className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1.5"><input type="color" value={draft.style.iconColor} onChange={(e) => update('style.iconColor', e.target.value)} className="h-6 w-6 rounded border-0 bg-transparent p-0" aria-label="Icon color" /><span className="text-[12px] text-[var(--text-secondary)] font-mono">{draft.style.iconColor}</span></span></label>
                <label className="flex flex-col gap-1.5"><span className="text-[13px] font-medium text-[var(--text-primary)]">Accent color</span><span className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1.5"><input type="color" value={draft.style.accentColor ?? '#D97757'} onChange={(e) => update('style.accentColor', e.target.value)} className="h-6 w-6 rounded border-0 bg-transparent p-0" aria-label="Accent color" /><span className="text-[12px] text-[var(--text-secondary)] font-mono">{draft.style.accentColor ?? '#D97757'}</span></span></label>
                <button type="button" onClick={() => update('style.accentColor', '#D97757')} className="self-start text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] underline underline-offset-4">Reset to terracotta</button>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-[var(--text-primary)]">Card effect</span>
                <div className="inline-flex flex-wrap gap-1.5" role="radiogroup" aria-label="Card effect">
                  {cardEffects.map((c) => (
                    <button key={c.value} type="button" role="radio" aria-checked={draft.style.cardEffect === c.value} onClick={() => update('style.cardEffect', c.value)} className={['rounded-full px-2.5 py-1 text-[12px] font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]', draft.style.cardEffect === c.value ? 'bg-[var(--accent)] text-[var(--text-on-accent)] border-[var(--accent)]' : 'bg-[var(--bg-sunken)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-strong)]'].join(' ')}>{c.label}</button>
                  ))}
                </div>
                {(draft.style.cardEffect === 'frosted' || draft.style.cardEffect === 'glass') && (
                  <div className="flex flex-col gap-1 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-[var(--text-secondary)]">Card blur</span>
                      <span className="text-[12px] text-[var(--text-tertiary)] tabular-nums">{draft.style.cardBlur ?? 40}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={draft.style.cardBlur ?? 40} onChange={(e) => update('style.cardBlur', Number(e.target.value))} className="w-full accent-[var(--accent)]" aria-label="Card blur" />
                  </div>
                )}
                {draft.style.cardEffect === 'outline' && (
                  <div className="flex flex-col gap-1 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-[var(--text-secondary)]">Outline size</span>
                      <span className="text-[12px] text-[var(--text-tertiary)] tabular-nums">{draft.style.cardOutlineSize ?? 1}px</span>
                    </div>
                    <input type="range" min={0} max={8} value={draft.style.cardOutlineSize ?? 1} onChange={(e) => update('style.cardOutlineSize', Number(e.target.value))} className="w-full accent-[var(--accent)]" aria-label="Outline size" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-medium text-[var(--text-primary)]">Main background effect</span>
                <p className="text-[11px] leading-[1.4] text-[var(--text-tertiary)]">Landing is always blurred - this only styles the main page.</p>
                <div role="radiogroup" aria-label="Main background effect" className="grid grid-cols-3 gap-2">
                  {effects.map((e) => (
                    <button key={e} role="radio" aria-checked={draft.style.backgroundEffect === e} onClick={() => { update('style.backgroundEffect', e); if (draft.style.effectIntensity === 0) update('style.effectIntensity', 50) }} onKeyDown={(ev) => { const idx = effects.indexOf(e); if (ev.key === 'ArrowRight') { ev.preventDefault(); update('style.backgroundEffect', effects[(idx + 1) % effects.length]) } if (ev.key === 'ArrowLeft') { ev.preventDefault(); update('style.backgroundEffect', effects[(idx - 1 + effects.length) % effects.length]) } }} className={['relative flex flex-col gap-1 rounded-[var(--radius-md)] border p-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]', draft.style.backgroundEffect === e ? 'border-[var(--accent)] ring-[1px] ring-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]'].join(' ')}>
                      <span className="h-12 w-full rounded-[var(--radius-sm)] overflow-hidden border border-white/10 bg-[var(--bg-surface-raised)] relative" aria-hidden="true">
                        {(() => { const url = draft.media.main.backgroundUrl; const bg = url ? `url(${url}) center/cover` : undefined; return (<span className="absolute inset-0"><span className={['block h-full w-full', e === 'blur' ? 'blur-[4px] scale-[1.05]' : '', e === 'black-and-white' ? 'grayscale contrast-[1.05]' : ''].join(' ')} style={bg ? { background: bg } : { background: 'var(--bg-surface-raised)' }} />{e === 'dark-overlay' && <span className="absolute inset-0 bg-black/55" />}{e === 'gradient' && <span className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(31,27,23,0) 0%, rgba(31,27,23,0.85) 100%)' }} />}{e === 'black-and-white' && <span className="absolute inset-0 mix-blend-multiply" style={{ background: 'rgba(31,27,23,0.15)' }} />}{e === 'frosted' && <span className="absolute inset-1.5 rounded-[6px] bg-[rgba(38,34,32,0.55)] backdrop-blur-[6px] border border-white/15" />}</span>) })()}
                      </span>
                      <span className="text-[11px] font-medium leading-none capitalize truncate">{e}</span>
                    </button>
                  ))}
                </div>
              </div>
              {draft.style.backgroundEffect !== 'none' && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-[var(--text-primary)]">Intensity</span>
                    <span className="text-[12px] text-[var(--text-tertiary)]">{draft.style.effectIntensity}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={draft.style.effectIntensity} onChange={(e) => update('style.effectIntensity', Number(e.target.value))} className="w-full accent-[var(--accent)]" aria-label="Effect intensity" />
                </div>
              )}
              {draft.style.backgroundEffect === 'gradient' && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5"><span className="text-[13px] font-medium text-[var(--text-primary)]">Gradient from</span><span className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1.5"><input type="color" value={draft.style.gradientFrom} onChange={(e) => update('style.gradientFrom', e.target.value)} className="h-6 w-6 rounded border-0 bg-transparent p-0" aria-label="Gradient from" /><span className="text-[12px] text-[var(--text-secondary)] font-mono">{draft.style.gradientFrom}</span></span></label>
                  <label className="flex flex-col gap-1.5"><span className="text-[13px] font-medium text-[var(--text-primary)]">Gradient to</span><span className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1.5"><input type="color" value={draft.style.gradientTo} onChange={(e) => update('style.gradientTo', e.target.value)} className="h-6 w-6 rounded border-0 bg-transparent p-0" aria-label="Gradient to" /><span className="text-[12px] text-[var(--text-secondary)] font-mono">{draft.style.gradientTo}</span></span></label>
                </div>
              )}
              <label className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-sunken)] px-3 py-2.5">
                <span className="text-[13px] font-medium text-[var(--text-primary)] flex items-center gap-2"><Palette size={14} /> Background card</span>
                <Switch checked={draft.style.showBackgroundCard} onChange={(v) => update('style.showBackgroundCard', v)} label="Show background card" />
              </label>
            </InspectorSection>

            <p className="text-[11px] leading-[1.4] text-[var(--text-tertiary)]">Tip: use Tab to reach effect swatches, arrow keys to navigate, Save to keep draft, Publish to go live at <span className="text-[var(--text-secondary)]">/{username ?? 'username'}</span>.</p>
          </div>
        </div>

        <div className="bg-[var(--bg-base)] flex flex-col h-full min-h-0 overflow-hidden">
          <div key={previewMode} className={`flex-1 min-h-0 overflow-hidden flex flex-col ${previewMode === 'main' ? `landing-enter-${draft.landing.transition ?? 'fade'}` : 'page-enter'}`}>
            <div className="flex-1 min-h-0 overflow-hidden [&>div]:h-full [&>div]:min-h-0">
              <ProfileRenderer config={draft} mode={previewMode} onEnter={() => setPreviewMode('main')} editorPreview onVolumeChange={(v) => update('media.audioVolume', v)} />
            </div>
          </div>
        </div>
      </div>
      {productsModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Manage products">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm modal-backdrop" onClick={() => setProductsModalOpen(false)} />
          <div className="relative w-full max-w-[480px] max-h-[80vh] overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xl flex flex-col modal-panel">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] shrink-0">
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">Manage products - {draft.products.linkTitle || 'Products'}</h3>
              <button type="button" aria-label="Close" onClick={() => setProductsModalOpen(false)} className="h-7 w-7 inline-flex items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"><X size={14} aria-hidden="true" /></button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input value={productTitle} onChange={(e) => setProductTitle(e.target.value)} placeholder="Title" aria-label="Product title" className="flex-1 h-9 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-sunken)] px-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                  <input value={productUrl} onChange={(e) => setProductUrl(e.target.value)} placeholder="https://..." aria-label="Product URL" className="flex-1 h-9 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-sunken)] px-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                  <Button type="button" size="sm" onClick={() => { if (!productTitle.trim() || !productUrl.trim()) return; update('products.items', [...draft.products.items, { title: productTitle.trim(), url: productUrl.trim() }]); setProductTitle(''); setProductUrl('') }}>Add</Button>
                </div>
                {draft.products.items.length === 0 ? (
                  <p className="text-[13px] text-[var(--text-tertiary)] text-center py-6">No products yet. Add your first link above.</p>
                ) : (
                  <div className="flex flex-col gap-2" role="list" aria-label="Products">
                    {draft.products.items.map((item, i) => (
                      <div key={i} role="listitem" className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface-raised)] px-3 py-2.5">
                        <div className="flex-1 min-w-0 flex flex-col">
                          <span className="text-[13px] font-medium text-[var(--text-primary)] truncate">{item.title}</span>
                          <span className="text-[11px] text-[var(--text-tertiary)] truncate">{item.url}</span>
                        </div>
                        <button type="button" aria-label={`Remove ${item.title}`} onClick={() => update('products.items', draft.products.items.filter((_, j) => j !== i))} className="h-7 w-7 inline-flex items-center justify-center rounded-full hover:bg-[var(--bg-surface)] hover:text-[var(--danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shrink-0"><Trash2 size={13} aria-hidden="true" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
              <Button variant="secondary" size="sm" onClick={() => setProductsModalOpen(false)}>Done</Button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {templateModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Create template">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm modal-backdrop" onClick={closeTemplateModal} />
          <div className={`relative w-full max-w-[520px] max-h-[88vh] overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xl flex flex-col ${templateModalClosing ? 'modal-panel-out' : 'modal-panel'}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] shrink-0">
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">Save as template</h3>
              <button type="button" aria-label="Close" onClick={closeTemplateModal} className="h-7 w-7 inline-flex items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"><X size={14} /></button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4">
              <Input label="Template name" value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="Late night trap" maxLength={60} />
                <Textarea label="Description" value={tplDescription} onChange={(e) => setTplDescription(e.target.value)} placeholder="Dark, blurred landing with a glass card and terracotta tags." rows={2} maxLength={240} />
                <label className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-sunken)] px-3 py-2.5 cursor-pointer">
                  <input type="checkbox" checked={tplPublic} onChange={(e) => { setTplError(null); setTplPublic(e.target.checked) }} className="mt-0.5 accent-[var(--accent)]" />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-medium text-[var(--text-primary)]">Publish to marketplace</span>
                    <span className="text-[12px] leading-[1.4] text-[var(--text-tertiary)]">Anyone can browse and use it. Leave off to keep it private to you.</span>
                  </span>
                </label>

                <div className="flex flex-col gap-2 border-t border-[var(--border-subtle)] pt-4">
                  <span className="text-[13px] font-medium text-[var(--text-primary)]">Quick settings</span>
                  <p className="text-[11px] leading-[1.4] text-[var(--text-tertiary)]">These change the current page too, so you can fine-tune before saving.</p>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[12px] text-[var(--text-secondary)]">Accent color</span>
                    <span className="inline-flex items-center gap-2 self-start rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1.5">
                      <input type="color" value={draft.style.accentColor ?? '#D97757'} onChange={(e) => update('style.accentColor', e.target.value)} className="h-6 w-6 rounded border-0 bg-transparent p-0" aria-label="Template accent color" />
                      <span className="text-[12px] text-[var(--text-secondary)] font-mono">{draft.style.accentColor ?? '#D97757'}</span>
                    </span>
                  </label>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[12px] text-[var(--text-secondary)]">Card effect</span>
                    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Template card effect">
                      {cardEffects.map((c) => (
                        <button key={c.value} type="button" role="radio" aria-checked={draft.style.cardEffect === c.value} onClick={() => update('style.cardEffect', c.value)} className={['rounded-full px-2.5 py-1 text-[12px] font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]', draft.style.cardEffect === c.value ? 'bg-[var(--accent)] text-[var(--text-on-accent)] border-[var(--accent)]' : 'bg-[var(--bg-sunken)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-strong)]'].join(' ')}>{c.label}</button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[12px] text-[var(--text-secondary)]">Landing headline</span>
                    <input value={draft.landing.headline} onChange={(e) => update('landing.headline', e.target.value)} placeholder="MARA" className="h-9 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-sunken)] px-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                  </div>
                </div>

                {tplError && (
                  <div role="alert" className="rounded-[var(--radius-sm)] border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2.5 text-[13px] text-[var(--text-primary)]">
                    {tplError}
                  </div>
                )}
            </div>

            <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
              <Button variant="secondary" size="sm" onClick={closeTemplateModal}>Cancel</Button>
              <Button size="sm" onClick={handleSaveTemplate} loading={savingTemplate}>Save template</Button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {blocker.state === 'blocked' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Unsaved changes">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm modal-backdrop" onClick={() => blocker.reset?.()} />
          <div className="relative w-full max-w-[420px] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-xl flex flex-col gap-4 modal-panel">
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">Unsaved changes</h3>
            <p className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">You have unsaved edits. Leave without saving? Your changes are saved locally for this session and will restore when you return.</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => blocker.reset?.()}>Stay</Button>
              <Button variant="ghost" size="sm" onClick={() => { if (storageKey) try { sessionStorage.removeItem(storageKey) } catch { /* ignore */ } setHasRestored(false); blocker.proceed?.() }}>Discard and leave</Button>
              <Button size="sm" onClick={() => blocker.proceed?.()}>Leave</Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

function AssetBackgroundRow({ label, url, type, uploading, onUpload, onClear }: { label: string; url: string | null; type: 'image' | 'video' | null; uploading: boolean; onUpload: (f: File) => Promise<void>; onClear: () => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-[var(--text-primary)]">{label}</span>
      <div className="flex items-center gap-2">
        <div className="h-12 w-16 rounded-[var(--radius-sm)] overflow-hidden border border-[var(--border-default)] bg-[var(--bg-surface)] shrink-0">
          {url ? (type === 'video' ? <video src={url} className="h-full w-full object-cover" muted /> : <img src={url} alt="" className="h-full w-full object-cover" />) : <span className="flex h-full w-full items-center justify-center text-[11px] text-[var(--text-tertiary)]">-</span>}
        </div>
        <label className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface-raised)] px-3 text-[13px] font-medium cursor-pointer hover:bg-[var(--bg-surface)] focus-within:ring-2 focus-within:ring-[var(--accent)]">Upload<input type="file" accept="image/*,video/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; await onUpload(f); e.target.value = '' }} /></label>
        {url && <Button type="button" variant="ghost" size="sm" onClick={onClear}>Clear</Button>}
        {uploading && <span className="text-[12px] text-[var(--text-tertiary)]">Uploading…</span>}
      </div>
    </div>
  )
}