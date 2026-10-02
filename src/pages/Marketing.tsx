import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'

const USERNAME_RE = /^[a-z0-9_]{3,20}$/

function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`reveal${visible ? ' is-visible' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function Marketing() {
  const { session, profile } = useAuth()
  const [claim, setClaim] = useState('')

  const nextPath = session ? (profile ? '/dashboard' : '/onboarding') : '/login'
  const normalized = claim.trim().toLowerCase()
  const claimState: 'idle' | 'invalid' | 'valid' =
    normalized.length === 0 ? 'idle' : USERNAME_RE.test(normalized) ? 'valid' : 'invalid'

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col">
      <style>{`
        .sauce-select::selection { background: var(--accent); color: var(--text-on-accent); }
        .sauce-claim-input { caret-color: var(--accent); }
        .door-nums { font-variant-numeric: tabular-nums; }
        .reveal {
          opacity: 0;
          transform: translateY(24px);
          filter: blur(6px);
          transition:
            opacity 750ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 750ms cubic-bezier(0.16, 1, 0.3, 1),
            filter 750ms cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform, filter;
        }
        .reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }
        @keyframes heroIn {
          from { opacity: 0; transform: translateY(20px); filter: blur(8px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .hero-in {
          opacity: 0;
          animation: heroIn 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .reveal { opacity: 1; transform: none; filter: none; transition: none; }
          .hero-in { opacity: 1; animation: none; }
        }
      `}</style>

      <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold tracking-tight">saucewrld</span>
          <span className="hidden sm:inline text-[12px] px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent)]/20 text-[var(--accent)]">
            for producers
          </span>
        </div>
        <nav className="flex items-center gap-2" aria-label="Primary">
          {session ? (
            <>
              <span className="hidden sm:inline text-[13px] text-[var(--text-secondary)]">@{profile?.username ?? '…'}</span>
              <Link
                to="/dashboard"
                className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface-raised)] px-3 text-[13px] font-medium hover:bg-[var(--bg-surface)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              className="inline-flex h-8 items-center rounded-[var(--radius-sm)] bg-[var(--accent)] px-4 text-[13px] font-medium text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
            >
              Sign in
            </Link>
          )}
        </nav>
      </header>

      <main className="flex-1 sauce-select">
        {/* --- Hero: centered, single column --- */}
        <section className="mx-auto max-w-[820px] px-4 sm:px-6 pt-16 sm:pt-28 pb-16 sm:pb-24 flex flex-col items-center text-center gap-7">
          <h1
            className="hero-in text-[46px] sm:text-[76px] font-semibold tracking-[-0.035em] leading-[0.96] text-balance"
            style={{ animationDelay: '60ms' }}
          >
            Your name is <span className="font-[var(--font-display)] font-normal italic text-[var(--accent)]">on the list.</span>
          </h1>
          <p
            className="hero-in text-[16px] sm:text-[18px] leading-[1.65] text-[var(--text-secondary)] max-w-[52ch] text-balance"
            style={{ animationDelay: '160ms' }}
          >
            Saucewrld is the one link for producers - beats, kits, services, and socials on a page that opens with your
            world and reads like you. Claim it, design it, show it.
          </p>

          <div className="hero-in w-full max-w-[560px] flex flex-col gap-2 text-left" style={{ animationDelay: '260ms' }}>
            <label htmlFor="claim" className="text-[13px] font-medium text-[var(--text-primary)] text-center">
              Claim your link
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div
                className={[
                  'flex h-12 flex-1 items-center overflow-hidden rounded-[var(--radius-sm)] border bg-[var(--bg-sunken)]',
                  'transition-[border-color,box-shadow] focus-within:border-transparent focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--accent)]',
                  claimState === 'invalid' ? 'border-[var(--danger)]' : 'border-[var(--border-default)]',
                ].join(' ')}
              >
                <span
                  className="shrink-0 select-none pl-3 pr-1 text-[15px] text-[var(--text-secondary)]"
                  aria-hidden="true"
                >
                  saucewrld.lol/
                </span>
                <input
                  id="claim"
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                  placeholder="yourname"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-describedby="claim-hint"
                  className="sauce-claim-input h-full min-w-0 flex-1 border-0 bg-transparent pr-3 text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-0"
                />
              </div>
              <Link
                to={nextPath}
                aria-label={claimState === 'valid' ? `Get started and claim saucewrld.lol/${normalized}` : 'Get started'}
                className="block sm:inline-block min-w-0"
              >
                <Button size="lg" className="w-full sm:w-auto whitespace-nowrap h-12 px-6">
                  Get started <ArrowRight size={15} aria-hidden="true" />
                </Button>
              </Link>
            </div>
            <p id="claim-hint" aria-live="polite" className="text-[13px] leading-[1.5] text-[var(--text-secondary)] text-center min-h-[20px]">
              {claimState === 'valid' && (
                <>
                  <span className="text-[var(--text-primary)] font-medium door-nums">sauce/{normalized}</span> - yours to
                  claim. 3–20 characters, lowercase, numbers, underscore.
                </>
              )}
              {claimState === 'invalid' && (
                <span className="text-[var(--danger)]">Lowercase letters, numbers, underscore only - 3–20 characters.</span>
              )}
              {claimState === 'idle' &&
                (profile?.username ? (
                  <>
                    Yours is live: <span className="text-[var(--text-primary)] font-medium">saucewrld.lol/{profile.username}</span> -
                    send it everywhere.
                  </>
                ) : (
                  'Discord login · live under a minute.'
                ))}
            </p>
          </div>

          <p className="hero-in text-[13px] text-[var(--text-secondary)]" style={{ animationDelay: '340ms' }}>
            No followers needed. If you cook, you qualify.
          </p>
        </section>

        {/* --- Quiet strip --- */}
        <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <Reveal className="mx-auto max-w-[820px] px-4 sm:px-6 py-12 sm:py-16 text-center">
            <p className="text-[19px] sm:text-[24px] leading-[1.55] text-[var(--text-secondary)] max-w-[54ch] mx-auto text-balance">
              One link holds it all -{' '}
              <span className="text-[var(--text-primary)]">beats, kits, services, price, and every place to find you</span>{' '}
              - designed once, exactly as fans see it.
            </p>
            <p className="mt-5 font-mono text-[12px] tracking-[0.08em] text-[var(--text-secondary)] door-nums">
              LOGIN → USERNAME → DESIGN → PUBLISH
            </p>
          </Reveal>
        </section>

        {/* --- What's inside: ledger rows --- */}
        <section className="mx-auto max-w-[820px] px-4 sm:px-6 py-16 sm:py-28 flex flex-col gap-10">
          <Reveal>
            <h2 className="text-[30px] sm:text-[44px] font-semibold tracking-[-0.03em] leading-[1.02] max-w-[22ch] text-balance text-center mx-auto">
              Everything a rapper, singer, or A&amp;R needs.{' '}
              <span className="font-[var(--font-display)] font-normal italic text-[var(--accent)]">Nothing they don&rsquo;t.</span>
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <dl className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] divide-y divide-[var(--border-subtle)] overflow-hidden text-left">
              {[
                { term: 'Beats & kits', def: 'Your catalog and packs with links out - “Drum Kit Vol. 2”, “50 MIDI Loops”.' },
                { term: 'Services & price', def: 'Mixing · Production · Sample packs - €50–€200, negotiable, up front.' },
                { term: 'DAW & plugins', def: 'FL Studio · Serum · RC-20 - artists hear your chain before they book.' },
                { term: 'Links & contact', def: 'YouTube, Instagram, SoundCloud, BeatStars - plus an open-for-collabs flag.' },
              ].map((row) => (
                <div key={row.term} className="grid gap-1 sm:grid-cols-[200px_1fr] sm:gap-6 px-5 sm:px-7 py-6">
                  <dt className="text-[13px] font-semibold tracking-[0.08em] uppercase text-[var(--text-primary)]">{row.term}</dt>
                  <dd className="text-[14px] leading-[1.65] text-[var(--text-secondary)]">{row.def}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={80}>
            <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-sunken)] px-5 sm:px-7 py-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 text-left">
              <span
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--accent)]/50 bg-[var(--accent-subtle)] text-[var(--accent)]"
                aria-hidden="true"
              >
                <Check size={14} strokeWidth={3} />
              </span>
              <p className="text-[14px] leading-[1.65] text-[var(--text-secondary)]">
                <span className="text-[var(--text-primary)] font-medium">What you design is what they get.</span> The editor
                preview and your public page are the same render - publish, and it&rsquo;s live. No drift, no surprises.
              </p>
            </div>
          </Reveal>
        </section>

        {/* --- Close --- */}
        <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <Reveal className="mx-auto max-w-[820px] px-4 sm:px-6 py-20 sm:py-28 flex flex-col items-center text-center gap-6">
            <h2 className="text-[34px] sm:text-[52px] font-semibold tracking-[-0.032em] leading-[1.0] text-balance">
              The door&rsquo;s open.{' '}
              <span className="font-[var(--font-display)] font-normal italic text-[var(--accent)]">Get on the list.</span>
            </h2>
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
              <Link to={nextPath}>
                <Button size="lg">Get started</Button>
              </Link>
              <span className="text-[13px] text-[var(--text-secondary)]">Discord login · your page live in minutes</span>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 sm:px-6 py-4 text-[12px] text-[var(--text-secondary)] flex flex-wrap gap-2 items-center justify-between">
        <span>Sauce - the one link for producers. Made for the ones who cook.</span>
        <div className="flex gap-4">
          <Link to="/privacy" className="hover:text-[var(--text-primary)] transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-[var(--text-primary)] transition-colors">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
