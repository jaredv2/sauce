import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ProfileRenderer } from '../components/ProfileRenderer/ProfileRenderer'
import { DEFAULT_PAGE_CONFIG, PageConfigSchema, type PageConfig } from '../types/pageConfig'

type State = 'loading' | 'notfound' | 'ready' | 'error'

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

export function PublicProfile() {
  const { username } = useParams<{ username: string }>()
  const [state, setState] = useState<State>('loading')
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<PageConfig>(DEFAULT_PAGE_CONFIG)
  const [pageId, setPageId] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [mode, setMode] = useState<'landing' | 'main'>('landing')
  const [showJoin, setShowJoin] = useState(false)
  const [joinLeaving, setJoinLeaving] = useState(false)
  const [viewCount, setViewCount] = useState<number | null>(null)
  const [privacy, setPrivacy] = useState<{ analyticsEnabled: boolean; discoverable: boolean }>({
    analyticsEnabled: true,
    discoverable: true,
  })
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null)
  const [publicUid, setPublicUid] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const joinTimer = useRef<number | null>(null)
  const hasLoggedView = useRef(false)
  const loadedUsernameRef = useRef<string | null>(null)

  // Fetch public page
  useEffect(() => {
    if (!username) return
    let cancelled = false
    async function load() {
      // Re-visiting the tab must not replay the skeleton once this profile is
      // already resolved; only show it for a username we have not loaded yet.
      if (loadedUsernameRef.current !== username) {
        setState('loading')
        loadedUsernameRef.current = null
      }
      setError(null)
      // public_pages view is granted to anon+authenticated (see 001/003 grants)
      const { data, error: qErr } = await supabase.from('public_pages').select('*').eq('username', username).maybeSingle()
      if (cancelled) return
      loadedUsernameRef.current = username ?? null
      if (qErr) {
        setError(qErr.message)
        setState('error')
        return
      }
      if (!data || !data.live_config) {
        setState('notfound')
        return
      }
      // Owner-configured visibility is enforced here so the settings are real.
      const { data: owner } = await supabase
        .from('profiles')
        .select('page_visibility, analytics_enabled, discoverable, verified_at, public_uid')
        .eq('username', username)
        .maybeSingle()
      if (cancelled) return
      if (owner?.page_visibility === 'private') {
        setState('notfound')
        return
      }
      setPrivacy({
        analyticsEnabled: owner?.analytics_enabled !== false,
        discoverable: owner?.discoverable !== false,
      })
      setVerifiedAt((owner?.verified_at as string | null) ?? null)
      setPublicUid(typeof owner?.public_uid === 'number' ? owner.public_uid : null)
      setConfig(mergeConfig(data.live_config))
      setPageId(data.page_id as string)
      setProfileId((data.profile_id as string) ?? null)
      setState('ready')
    }
    load()
    return () => {
      cancelled = true
    }
  }, [username])

  // Fire-and-forget view log (don't block render)
  useEffect(() => {
    if (state !== 'ready' || !profileId || !pageId || hasLoggedView.current) return
    if (!privacy.analyticsEnabled) return
    hasLoggedView.current = true
    supabase
      .from('page_views')
      .insert({ profile_id: profileId, page_id: pageId })
      .then(({ error: insErr }) => {
        if (insErr) console.warn('[public] view log failed', insErr.message)
      })

    // Best-effort view count (owner-only RLS, so anon will get 0/error - hide gracefully)
    supabase
      .from('page_views')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profileId)
      .then(({ count, error: cntErr }) => {
        if (!cntErr && typeof count === 'number') setViewCount(count + 1) // +1 for just-logged view (eventual consistency)
      })
  }, [state, profileId, pageId, privacy.analyticsEnabled])

  // Landing → main: audio autoplay handling (muted autoplay then unmute on interaction)
  useEffect(() => {
    if (mode !== 'main' || !config.media.audioUrl) return
    const el = audioRef.current
    if (!el) return
    const level = Math.min(1, Math.max(0, config.media.audioVolume / 100))
    el.loop = true
    el.volume = level
    el.muted = true
    el.play().catch(() => {
      // autoplay blocked without interaction - wait for user gesture via controls or CHECK MY PAGE click (already an interaction)
    })
    const unmute = () => {
      el.muted = config.media.audioVolume <= 0
      el.volume = level
    }
    // unmute on first interaction inside main
    window.addEventListener('click', unmute, { once: true })
    window.addEventListener('keydown', unmute, { once: true })
    return () => {
      window.removeEventListener('click', unmute)
      window.removeEventListener('keydown', unmute)
    }
    // NB: volume deliberately excluded - syncing it here would re-mute on every slider move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, config.media.audioUrl])

  // Keep ambient audio volume in sync with the top volume chips without
  // restarting playback. 0 means muted.
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    el.loop = true
    el.volume = Math.min(1, Math.max(0, config.media.audioVolume / 100))
    if (el.muted && config.media.audioVolume > 0) el.muted = false
  }, [config.media.audioVolume])

  function handleVolume(v: number) {
    setConfig((prev) => ({ ...prev, media: { ...prev.media, audioVolume: v } }))
  }

  // Join saucewrld popup - once per session after few seconds on main.
  // Owners who opted out of discovery never get the prompt.
  useEffect(() => {
    if (mode !== 'main' || state !== 'ready') return
    if (typeof window === 'undefined') return
    if (!privacy.discoverable) return
    if (sessionStorage.getItem('saucewrld_join_seen')) return
    const id = window.setTimeout(() => {
      setShowJoin(true)
    }, 3200)
    return () => window.clearTimeout(id)
  }, [mode, state, privacy.discoverable])

  function dismissJoin() {
    if (joinLeaving) return
    try {
      sessionStorage.setItem('saucewrld_join_seen', '1')
    } catch {
      // ignore
    }
    // Fade-zoom out before unmounting
    setJoinLeaving(true)
    if (joinTimer.current) window.clearTimeout(joinTimer.current)
    joinTimer.current = window.setTimeout(() => {
      setShowJoin(false)
      setJoinLeaving(false)
      joinTimer.current = null
    }, 240)
  }

  useEffect(() => {
    return () => {
      if (joinTimer.current) window.clearTimeout(joinTimer.current)
    }
  }, [])

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex flex-col" aria-busy="true" aria-label="Loading profile">
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <div className="w-full max-w-[560px] h-[520px] skeleton rounded-[var(--radius-md)] border border-[var(--border-default)]" />
          <div className="flex items-center gap-2 text-[13px] text-[var(--text-tertiary)]">
            <span className="h-4 w-4 rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)] animate-spin" aria-hidden="true" />
            Loading @{username}…
          </div>
        </div>
      </div>
    )
  }

  if (state === 'notfound') {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col">
        <header className="h-14 flex items-center px-4 sm:px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <Link to="/" className="text-[14px] font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-[var(--radius-sm)] px-1">
            saucewrldwrld
          </Link>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center max-w-[520px] mx-auto page-enter">
          <div className="h-12 w-12 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] flex items-center justify-center text-[18px] text-[var(--text-tertiary)]" aria-hidden="true">
            -
          </div>
          <h1 className="text-[20px] font-semibold tracking-tight">This page doesn't exist yet</h1>
          <p className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
            @{username} hasn't published a page, or the link is incorrect.
          </p>
          <Link to="/" className="mt-2 inline-flex h-9 items-center rounded-full bg-[var(--accent)] px-5 text-[13px] font-semibold text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] hover:translate-y-[-1px] active:translate-y-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
            Join saucewrldwrld
          </Link>
        </main>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center gap-3 p-8 text-center">
        <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">Could not load page</h1>
        <p className="text-[13px] text-[var(--danger)]" role="alert">
          {error}
        </p>
        <Link to="/" className="text-[13px] text-[var(--accent)] hover:underline underline-offset-2">
          Back to home
        </Link>
      </div>
    )
  }

  // Hidden background audio element - respects autoplay policy (muted then unmute)
  // ProfileRenderer also renders a controls <audio> inside the card for user control; this hidden one is the ambient layer.
  const bgAudio = config.media.audioUrl ? (
    <audio
      ref={audioRef}
      src={config.media.audioUrl}
      preload="none"
      loop
      aria-hidden="true"
      className="sr-only"
    />
  ) : null

  const landingTransition = (config.landing as unknown as { transition?: string })?.transition ?? 'fade'
  const enterClass = mode === 'main' ? `landing-enter-${landingTransition}` : 'page-enter'

  return (
    <div className="h-[100dvh] overflow-hidden bg-[var(--bg-base)]">
      {/* Public profiles are full-bleed - no dashboard chrome */}
      <div key={mode} className={`h-full overflow-hidden ${enterClass}`}>
        <ProfileRenderer config={config} mode={mode} onEnter={() => setMode('main')} viewCount={mode === 'main' ? viewCount : null} onVolumeChange={handleVolume} verifiedAt={verifiedAt} publicUid={publicUid} />
      </div>
      {bgAudio}

      {/* Join saucewrld popup */}
      {showJoin && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Join saucewrld"
          className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[340px] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-xl flex flex-col gap-3 z-50 ${joinLeaving ? 'toast-out' : 'toast-in'}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-[14px] font-semibold leading-none text-[var(--text-primary)]">Join saucewrld</h2>
              <p className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">Create your own producer page - live in under one minute.</p>
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={dismissJoin}
              className="h-7 w-7 inline-flex items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shrink-0"
            >
              ×
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              onClick={dismissJoin}
              className="inline-flex h-8 items-center rounded-full bg-[var(--accent)] px-4 text-[13px] font-semibold text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              Explore saucewrld
            </Link>
            <button type="button" onClick={dismissJoin} className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2">
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
