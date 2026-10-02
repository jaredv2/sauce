import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import discordIcon from '../assets/icons8-discord-100.png'

function DiscordLogo({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 ${className}`}
      style={{
        width: 20,
        height: 20,
        backgroundColor: '#ffffff',
        WebkitMaskImage: `url(${discordIcon})`,
        maskImage: `url(${discordIcon})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  )
}

export function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Supabase redirects provider errors back to the app as ?error=&error_description=
  // - surface them instead of failing silently.
  const [urlError] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      return params.get('error_description') ?? params.get('error')
    } catch {
      return null
    }
  })

  async function handleDiscordLogin() {
    setLoading(true)
    setError(null)
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
        },
      })
      if (oauthError) throw oauthError
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Login failed'
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col">
      <style>{`
        .sauce-select::selection { background: var(--accent); color: var(--text-on-accent); }
        @keyframes heroIn {
          from { opacity: 0; transform: translateY(20px); filter: blur(8px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .hero-in { opacity: 0; animation: heroIn 800ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes stampIn {
          0% { opacity: 0; transform: scale(1.5) rotate(-10deg); filter: blur(3px); }
          60% { opacity: 1; transform: scale(0.96) rotate(-4deg); filter: blur(0); }
          100% { opacity: 1; transform: scale(1) rotate(-4deg); filter: blur(0); }
        }
        .stamp-in { opacity: 0; animation: stampIn 480ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        .door-nums { font-variant-numeric: tabular-nums; }
        @media (prefers-reduced-motion: reduce) {
          .hero-in, .stamp-in { opacity: 1; animation: none; transform: none; filter: none; }
        }
      `}</style>

      <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] sticky top-0 z-10">
        <Link
          to="/"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-[var(--radius-sm)] px-1"
        >
          <span className="text-[15px] font-semibold tracking-tight">sauce</span>
          <span className="hidden sm:inline text-[12px] px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent)]/20 text-[var(--accent)]">
            for producers
          </span>
        </Link>
        <Link
          to="/"
          className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface-raised)] px-3 text-[13px] font-medium hover:bg-[var(--bg-surface)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          Back to home
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-14 sm:py-20 sauce-select">
        <div className="w-full max-w-[480px] flex flex-col gap-5">
          <div
            className="hero-in rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden"
            style={{ animationDelay: '80ms' }}
          >
            <div className="flex items-center px-6 sm:px-8 pt-5">
              <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-[var(--text-secondary)] door-nums">
                LOGIN
              </span>
            </div>

            <div className="px-6 sm:px-8 py-7 sm:py-8 flex flex-col items-center text-center gap-5">
              <div className="flex flex-col gap-3">
                <h1 className="text-[32px] sm:text-[40px] font-semibold tracking-[-0.03em] leading-[1.0] text-balance">
                  Log in
                </h1>
                <p className="text-[14px] sm:text-[15px] leading-[1.65] text-[var(--text-secondary)] max-w-[38ch] mx-auto text-balance">
                  Connect your Discord account to get your link.
                </p>
              </div>

              {(error || urlError) && (
                <div
                  role="alert"
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-3 text-left text-[13px] leading-[1.5] text-[var(--text-primary)]"
                >
                  Login failed - {error ?? urlError}
                  {!import.meta.env.VITE_SUPABASE_URL && (
                    <span className="block mt-1 text-[12px] text-[var(--text-secondary)]">
                      Tip: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env, then restart the dev server.
                    </span>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleDiscordLogin}
                disabled={loading}
                aria-busy={loading || undefined}
                className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-[var(--radius-sm)] bg-[#5865F2] px-6 text-[15px] font-semibold text-white transition-all duration-150 ease-out hover:bg-[#4752C4] hover:translate-y-[-1px] active:translate-y-0 active:bg-[#3C45A5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5865F2] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] disabled:cursor-not-allowed disabled:opacity-60 disabled:translate-y-0"
              >
                {loading ? (
                  <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin shrink-0" aria-hidden="true" />
                ) : (
                  <DiscordLogo />
                )}
                {loading ? 'Connecting…' : 'Continue with Discord'}
              </button>

              <p className="text-[12px] leading-[1.6] text-[var(--text-secondary)] max-w-[36ch]">
                By continuing you agree to the{' '}
                <Link to="/terms" className="underline underline-offset-4 hover:text-[var(--text-primary)] transition-colors">
                  Terms
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="underline underline-offset-4 hover:text-[var(--text-primary)] transition-colors">
                  Privacy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
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
