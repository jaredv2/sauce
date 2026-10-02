import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { User, BadgeCheck, Eye, Volume2, VolumeX } from 'lucide-react'
import type { PageConfig, BackgroundEffect, Align, AvatarSize, CardEffect } from '../../types/pageConfig'
import { formatPrice, FONT_FAMILY_MAP } from '../../types/pageConfig'
import { Tooltip } from '../ui/Tooltip'
import youtubeIcon from '../../assets/icons8-youtube-100.png'
import tiktokIcon from '../../assets/icons8-tiktok-100.png'
import discordIcon from '../../assets/icons8-discord-100.png'
import instagramIcon from '../../assets/icons8-instagram-100.png'
import spotifyIcon from '../../assets/icons8-spotify-100.png'
import soundcloudIcon from '../../assets/icons8-soundcloud-100.png'
import twitterIcon from '../../assets/icons8-twitter-100.png'
import facebookIcon from '../../assets/icons8-facebook-100.png'
import websiteIcon from '../../assets/icons8-website-100.png'
import beatstarsIcon from '../../assets/beatstars-ledm1nabgz4j8hvvkvrsx-removebg-preview.png'

type Mode = 'landing' | 'main'

interface Props {
  config: PageConfig
  mode: Mode
  onEnter?: () => void
  viewCount?: number | null
  editorPreview?: boolean
  onVolumeChange?: (volume: number) => void
  verifiedAt?: string | null
  publicUid?: number | null
}

const bioSizeClass: Record<PageConfig['profileHeader']['bioSize'], string> = {
  xs: 'text-[12px] leading-[1.5]',
  sm: 'text-[13px] leading-[1.5]',
  md: 'text-[14px] leading-[1.6]',
  lg: 'text-[15px] leading-[1.6]',
  xl: 'text-[16px] leading-[1.6]',
}

const avatarSizeClass: Record<AvatarSize, { landing: string; main: string }> = {
  sm: { landing: 'h-14 w-14', main: 'h-10 w-10' },
  md: { landing: 'h-20 w-20', main: 'h-12 w-12' },
  lg: { landing: 'h-24 w-24', main: 'h-14 w-14' },
  xl: { landing: 'h-28 w-28', main: 'h-16 w-16' },
}

function alignToText(align?: Align): React.CSSProperties['textAlign'] {
  return (align as React.CSSProperties['textAlign']) ?? 'left'
}
function alignToJustify(align?: Align): string {
  if (align === 'center') return 'justify-center'
  if (align === 'right') return 'justify-end'
  return 'justify-start'
}
function alignToItems(align?: Align): string {
  if (align === 'center') return 'items-center text-center'
  if (align === 'right') return 'items-end text-right'
  return 'items-start text-left'
}

const SOCIAL_ICONS: Record<string, { src: string; label: string }> = {
  youtube: { src: youtubeIcon, label: 'YouTube' },
  tiktok: { src: tiktokIcon, label: 'TikTok' },
  discord: { src: discordIcon, label: 'Discord' },
  instagram: { src: instagramIcon, label: 'Instagram' },
  spotify: { src: spotifyIcon, label: 'Spotify' },
  soundcloud: { src: soundcloudIcon, label: 'SoundCloud' },
  twitter: { src: twitterIcon, label: 'X / Twitter' },
  facebook: { src: facebookIcon, label: 'Facebook' },
  website: { src: websiteIcon, label: 'Website' },
  beatstars: { src: beatstarsIcon, label: 'BeatStars' },
}

/**
 * Brand glyphs are recoloured with a CSS mask so they always follow the
 * page's icon colour while keeping the alpha-cut detail (play triangle,
 * lens, waveform) intact.
 */
function SocialIcon({ platform, color, size = 18 }: { platform: string; color: string; size?: number }) {
  const icon = SOCIAL_ICONS[platform]
  if (!icon) return null
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        WebkitMaskImage: `url(${icon.src})`,
        maskImage: `url(${icon.src})`,
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

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function BackgroundLayer({
  url,
  type,
  effect,
  intensity,
  gradientFrom,
  gradientTo,
}: {
  url: string | null
  type: 'image' | 'video' | null
  effect: BackgroundEffect
  intensity: number
  gradientFrom: string
  gradientTo: string
}) {
  const t = Math.max(0, Math.min(100, intensity)) / 100
  const isBlackWhite = effect === 'black-and-white'
  const isBlur = effect === 'blur'
  const blurPx = isBlur ? `${(t * 12).toFixed(1)}px` : undefined

  return (
    <div className="absolute inset-0 overflow-hidden bg-[var(--bg-sunken)]">
      {url ? (
        type === 'video' ? (
          <video
            src={url}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
            className={['h-full w-full object-cover', isBlackWhite ? 'contrast-[1.05]' : ''].join(' ')}
            style={{
              filter: isBlackWhite ? `grayscale(1) contrast(${(1 + t * 0.1).toFixed(2)})` : isBlur ? `blur(${blurPx})` : undefined,
              transform: isBlur ? `scale(${1 + t * 0.1})` : undefined,
            } as React.CSSProperties}
          />
        ) : (
          <img
            src={url}
            alt=""
            aria-hidden="true"
            className={['h-full w-full object-cover', isBlackWhite ? 'contrast-[1.05]' : ''].join(' ')}
            style={{
              filter: isBlackWhite ? `grayscale(1) contrast(${(1 + t * 0.1).toFixed(2)})` : isBlur ? `blur(${blurPx})` : undefined,
              transform: isBlur ? `scale(${1 + t * 0.1})` : undefined,
            } as React.CSSProperties}
          />
        )
      ) : (
        <div className="h-full w-full bg-[var(--bg-surface)]" aria-hidden="true" />
      )}

      {effect === 'dark-overlay' && <div className="absolute inset-0" aria-hidden="true" style={{ background: `rgba(0,0,0,${(t * 0.65).toFixed(2)})` }} />}
      {effect === 'gradient' && (
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{ background: `linear-gradient(180deg, ${hexToRgba(gradientFrom, t * 0.6)} 0%, ${hexToRgba(gradientTo, t * 0.95)} 100%)` }}
        />
      )}
      {effect === 'vignette' && (
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{ background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, rgba(0,0,0,${(t * 0.85).toFixed(2)}) 100%)` }}
        />
      )}
      {isBlackWhite && (
        <div className="absolute inset-0 mix-blend-multiply pointer-events-none" aria-hidden="true" style={{ background: `rgba(31,27,23,${(t * 0.2).toFixed(2)})` }} />
      )}
    </div>
  )
}

export function ProfileRenderer({ config, mode, onEnter, viewCount, editorPreview, onVolumeChange, verifiedAt, publicUid }: Props) {
  const { profileHeader, socials, daw, plugins, services, price, products, landing, media, style } = config
  const textColor = style.textColor || '#ffffff'
  const iconColor = style.iconColor || '#ffffff'
  // Landing is always blurred at a fixed strength - not adjustable, not removable.
  const effect = mode === 'landing' ? 'blur' : style.backgroundEffect
  const intensity = mode === 'landing' ? 65 : ((style as unknown as { effectIntensity?: number }).effectIntensity ?? 50)
  const gradientFrom = (style as unknown as { gradientFrom?: string }).gradientFrom ?? '#1F1B17'
  const gradientTo = (style as unknown as { gradientTo?: string }).gradientTo ?? '#000000'
  const showCard = style.showBackgroundCard !== false
  const [productsOpen, setProductsOpen] = useState(false)
  const [productsClosing, setProductsClosing] = useState(false)
  const closeTimer = useRef<number | null>(null)

  const closeProducts = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    setProductsClosing(true)
    closeTimer.current = window.setTimeout(() => {
      setProductsOpen(false)
      setProductsClosing(false)
      closeTimer.current = null
    }, 220)
  }, [])

  useEffect(() => () => { if (closeTimer.current) window.clearTimeout(closeTimer.current) }, [])

  const bgUrl = mode === 'landing' ? media.landing.backgroundUrl : media.main.backgroundUrl
  const bgType = mode === 'landing' ? media.landing.backgroundType : media.main.backgroundType

  const safeLanding = landing ?? { headline: '', subheadline: '', ctaLabel: 'CHECK MY PAGE', align: 'center' as Align }
  const showAvatar = safeLanding.showAvatar !== false
  const showHeadline = safeLanding.showHeadline !== false
  const showSubheadline = safeLanding.showSubheadline !== false
  const showCollabChip = safeLanding.showCollabChip !== false
  const showCta = safeLanding.showCta !== false
  const avatarSize = profileHeader.avatarSize ?? 'md'
  const landingAvatarClass = avatarSizeClass[avatarSize].landing
  const mainAvatarClass = avatarSizeClass[avatarSize].main
  const headingFontFamily = FONT_FAMILY_MAP[style.headingFont ?? 'fraunces'] ?? FONT_FAMILY_MAP.fraunces
  const bodyFontFamily = FONT_FAMILY_MAP[style.bodyFont ?? 'inter'] ?? FONT_FAMILY_MAP.inter

  useEffect(() => {
    if (!productsOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeProducts() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [productsOpen, closeProducts])

  const headerAlign = (profileHeader as unknown as { align?: Align }).align ?? 'center'
  const landingAlign = (safeLanding as unknown as { align?: Align }).align ?? 'center'
  const socialsAlign = (socials as unknown as { align?: Align }).align ?? 'center'
  const dawAlign = (daw as unknown as { align?: Align }).align ?? 'left'
  const pluginsAlign = (plugins as unknown as { align?: Align }).align ?? 'left'
  const servicesAlign = (services as unknown as { align?: Align }).align ?? 'left'
  const priceAlign = (price as unknown as { align?: Align }).align ?? 'left'
  const productsAlign = ((products as unknown as { align?: Align })?.align) ?? 'left'
  const accentColor = style.accentColor || '#D97757'
  const cardEffect = (style.cardEffect ?? 'frosted') as CardEffect
  const cardBlur = style.cardBlur ?? 40
  const cardOutlineSize = style.cardOutlineSize ?? 1
  // Glass cards sit over bright media, so their inner chips need lighter edges
  // to stay legible instead of dissolving into the backdrop.
  const chipStyle: CSSProperties = {
    background: 'color-mix(in oklab, var(--accent), #0d0b09 78%)',
    borderColor: 'color-mix(in oklab, var(--accent), transparent 40%)',
  }
  const collabStyle: CSSProperties = {
    background: 'color-mix(in oklab, var(--accent), #0d0b09 72%)',
    borderColor: 'color-mix(in oklab, var(--accent), transparent 32%)',
    color: 'color-mix(in oklab, var(--accent), #ffffff 55%)',
  }

  const pageVars = {
    '--accent': accentColor,
    '--accent-hover': 'color-mix(in oklab, var(--accent), #ffffff 14%)',
    '--accent-pressed': 'color-mix(in oklab, var(--accent), #000000 14%)',
    '--accent-subtle': 'color-mix(in oklab, var(--accent), transparent 88%)',
  } as CSSProperties

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${editorPreview ? '' : 'rounded-[var(--radius-md)] border border-[var(--border-default)]'}`}
      style={{ ...pageVars, color: textColor }}
    >
      <BackgroundLayer url={bgUrl} type={bgType} effect={effect} intensity={intensity} gradientFrom={gradientFrom} gradientTo={gradientTo} />

      <div className="relative z-10 flex h-full flex-col items-center justify-center p-4 sm:p-6 [&_a]:cursor-pointer [&_button]:cursor-pointer">
        {mode === 'landing' ? (
          <div className={`flex w-full max-w-[420px] flex-col gap-5 py-8 ${alignToItems(landingAlign as Align)}`}>
            {showAvatar && (media.avatarUrl ? (
              <img
                src={media.avatarUrl}
                alt={safeLanding.headline || profileHeader.displayName ? `${safeLanding.headline || profileHeader.displayName} avatar` : 'Avatar'}
                className={`${landingAvatarClass} rounded-full object-cover border border-white/15 shadow-sm shrink-0`}
              />
            ) : (
              <div className={`${landingAvatarClass} rounded-full border border-white/15 bg-white/10 flex items-center justify-center shrink-0`} aria-hidden="true">
                <User size={28} className="text-white/80" />
              </div>
            ))}

            {showHeadline && (safeLanding.headline || profileHeader.displayName) && (
              <div className={`flex flex-wrap items-center gap-2 ${landingAlign === 'center' ? 'justify-center' : landingAlign === 'right' ? 'justify-end' : 'justify-start'}`}>
                {publicUid ? (
                  <Tooltip label={`UID #${publicUid}`}>
                    <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight leading-none max-w-full break-words" style={{ fontFamily: headingFontFamily, textAlign: alignToText(landingAlign as Align), cursor: 'help' }}>
                      {safeLanding.headline || profileHeader.displayName}
                    </h1>
                  </Tooltip>
                ) : (
                  <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight leading-none max-w-full break-words" style={{ fontFamily: headingFontFamily, textAlign: alignToText(landingAlign as Align) }}>
                    {safeLanding.headline || profileHeader.displayName}
                  </h1>
                )}
                {verifiedAt && (
                  <Tooltip label={`Verified ${new Date(verifiedAt).toLocaleDateString()}`}>
                    <span className="inline-flex items-center text-white" aria-label="Verified profile">
                      <BadgeCheck size={22} strokeWidth={2.2} />
                    </span>
                  </Tooltip>
                )}
              </div>
            )}
            {showSubheadline && (safeLanding.subheadline || profileHeader.bio) && (
              <p className={`${bioSizeClass[profileHeader.bioSize]} opacity-90 max-w-full break-words`} style={{ textAlign: alignToText(landingAlign as Align) }}>
                {safeLanding.subheadline || profileHeader.bio}
              </p>
            )}
            {showCollabChip && profileHeader.openForCollabs && (
              <span className="inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] shadow-[0_2px_10px_rgba(0,0,0,0.5)]" style={collabStyle}>
                OPEN FOR COLLABS
              </span>
            )}

            {showCta && (
              <button
                type="button"
                onClick={onEnter}
                className="inline-flex h-9 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-[13px] font-semibold tracking-wide text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] hover:translate-y-[-1px] hover:shadow-[0_4px_16px_rgba(217,119,87,0.35)] active:bg-[var(--accent-pressed)] active:translate-y-0 active:shadow-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
              >
                {safeLanding.ctaLabel || 'CHECK MY PAGE'}
              </button>
            )}

            {!bgUrl && <p className="text-[12px] text-white/60" style={{ textAlign: alignToText(landingAlign as Align) }}>No background - upload one in the editor</p>}

            {!showCta && (
              <button
                type="button"
                onClick={onEnter}
                className="text-[12px] text-white/70 underline underline-offset-4 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm"
              >
                Open page →
              </button>
            )}
          </div>
        ) : (
          (() => {
            const cardContent = (
              <>
                {profileHeader.visible && (
                  <div className={`flex flex-col gap-3 ${alignToItems(headerAlign as Align)}`} style={{ textAlign: alignToText(headerAlign as Align) }}>
                    <div className={`flex gap-3 w-full ${headerAlign === 'center' ? 'justify-center flex-col items-center text-center' : headerAlign === 'right' ? 'justify-end flex-row-reverse text-right' : 'justify-start text-left'}`}>
                      {media.avatarUrl ? (
                        <img src={media.avatarUrl} alt={profileHeader.displayName ? `${profileHeader.displayName} avatar` : 'Avatar'} className={`${mainAvatarClass} rounded-full object-cover border border-white/10 shrink-0`} />
                      ) : (
                        <div className={`${mainAvatarClass} rounded-full border border-[var(--border-default)] bg-[var(--bg-sunken)] flex items-center justify-center shrink-0`} aria-hidden="true">
                          <User size={16} className="text-[var(--text-tertiary)]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {profileHeader.displayName && (
                          <div className={`flex flex-wrap items-center gap-1.5 ${headerAlign === 'center' ? 'justify-center' : headerAlign === 'right' ? 'justify-end' : 'justify-start'}`}>
                            <Tooltip label={publicUid ? `UID #${publicUid}` : undefined}>
                              <h2 className="text-[20px] font-semibold leading-none tracking-tight break-words" style={{ fontFamily: headingFontFamily, cursor: publicUid ? 'help' : undefined }}>
                                {profileHeader.displayName}
                              </h2>
                            </Tooltip>
                            {verifiedAt && (
                              <Tooltip label={`Verified ${new Date(verifiedAt).toLocaleDateString()}`}>
                                <span className="inline-flex items-center text-white" aria-label="Verified profile">
                                  <BadgeCheck size={20} strokeWidth={2.2} />
                                </span>
                              </Tooltip>
                            )}
                          </div>
                        )}
                        {profileHeader.bio && (
                          <p className={['mt-1.5 break-words whitespace-pre-wrap', bioSizeClass[profileHeader.bioSize], 'opacity-90'].join(' ')}>
                            {profileHeader.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    {profileHeader.openForCollabs && (
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] ${headerAlign === 'center' ? 'self-center' : headerAlign === 'right' ? 'self-end' : 'self-start'}`} style={collabStyle}>
                        OPEN FOR COLLABS
                      </span>
                    )}
                  </div>
                )}

                {socials.visible && (
                  <SocialsBlock socials={socials} iconColor={iconColor} align={socialsAlign as Align} />
                )}

                <div className="flex flex-col gap-4">
                  {daw.visible && daw.value && (
                    <div className="py-3" style={{ textAlign: alignToText(dawAlign as Align) }}>
                      <Section label="DAW" value={daw.value} textColor={textColor} align={dawAlign as Align} />
                    </div>
                  )}
                  {plugins.visible && plugins.tags.length > 0 && (
                    <div className="py-3 flex flex-col gap-2" style={{ textAlign: alignToText(pluginsAlign as Align) }}>
                      <span className="text-[11px] font-semibold tracking-widest opacity-60">PLUGINS</span>
                      <div className={`flex flex-wrap gap-1.5 ${alignToJustify(pluginsAlign as Align)}`}>
                        {plugins.tags.map((t) => (
                          <span key={t} className="rounded-full border px-2.5 py-1 text-[12px] font-medium leading-none transition-colors hover:brightness-125" style={chipStyle}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {services.visible && services.selected.length > 0 && (
                    <div className="py-3 flex flex-col gap-2" style={{ textAlign: alignToText(servicesAlign as Align) }}>
                      <span className="text-[11px] font-semibold tracking-widest opacity-60">SERVICES</span>
                      <div className={`flex flex-wrap gap-1.5 ${alignToJustify(servicesAlign as Align)}`}>
                        {services.selected.map((s) => (
                          <span key={s} className="rounded-full border px-2.5 py-1 text-[12px] font-medium leading-none" style={chipStyle}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {price.visible && formatPrice(price) && (
                    <div className="py-3" style={{ textAlign: alignToText(priceAlign as Align) }}>
                      <Section label="PRICE" value={formatPrice(price)} textColor={textColor} align={priceAlign as Align} />
                    </div>
                  )}
                  {products?.visible && products.items.length > 0 && (
                    <div className="flex flex-col gap-2" style={{ textAlign: alignToText(productsAlign as Align) }}>
                      <span className="text-[11px] font-semibold tracking-widest opacity-60">{(products.linkTitle || 'Products').toUpperCase()}</span>
                      <button type="button" onClick={() => setProductsOpen(true)} className={`text-[13px] font-medium underline underline-offset-4 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded ${productsAlign === 'center' ? 'self-center' : productsAlign === 'right' ? 'self-end' : 'self-start'}`} style={{ textAlign: alignToText(productsAlign as Align), color: textColor }}>
                        {products.linkTitle || 'Products'} - {products.items.length} item{products.items.length !== 1 ? 's' : ''}
                      </button>
                    </div>
                  )}
                </div>

                {media.audioUrl && onVolumeChange && mode === 'main' && null}

                {!profileHeader.visible && !socials.visible && !daw.visible && !plugins.visible && !services.visible && !price.visible && !(products?.visible && products.items.length > 0) && (
                  <p className="text-center text-[13px] opacity-60 py-4">All sections hidden - toggle them in the editor</p>
                )}
              </>
            )

            if (!showCard) {
              return (
                <div className="flex w-full max-w-[560px] flex-col gap-4 py-4" style={{ color: textColor }}>
                  {cardContent}
                </div>
              )
            }

            const blur = 2 + (cardBlur / 100) * 22
            const cardBase = cardEffect === 'frosted'
              ? `rgba(38,34,32,${(0.35 + (cardBlur / 100) * 0.4).toFixed(2)})`
              : cardEffect === 'glass'
                ? 'rgba(255,255,255,0.08)'
                : cardEffect === 'outline'
                  ? 'rgba(23,20,15,0.25)'
                  : 'var(--bg-surface)'
            const needsBlur = cardEffect === 'frosted' || cardEffect === 'glass'

            return (
              <div className="flex w-full max-w-[560px] flex-col items-stretch gap-3">
                <div
                  className={[
                    'flex w-full flex-col gap-4 rounded-[var(--radius-md)] p-5 sm:p-6',
                    cardEffect === 'solid' || cardEffect === 'frosted' ? 'border border-[var(--border-default)]' : '',
                  ].join(' ')}
                style={{
                  color: textColor,
                  fontFamily: bodyFontFamily,
                  background: cardBase,
                  ...(needsBlur
                    ? {
                        backdropFilter: `blur(${blur.toFixed(1)}px) saturate(1.4)`,
                        WebkitBackdropFilter: `blur(${blur.toFixed(1)}px) saturate(1.4)`,
                      }
                    : {}),
                  ...(cardEffect === 'outline'
                    ? { border: `${cardOutlineSize}px solid rgba(255,255,255,0.4)`, background: 'transparent' }
                    : {}),
                  ...(cardEffect === 'glass'
                    ? { border: '1px solid rgba(255,255,255,0.16)' }
                    : {}),
                }}
                >
                  {cardContent}
                </div>
              </div>
            )
          })()
        )}
      </div>
      {mode === 'main' && media.audioUrl && onVolumeChange && (
        <AudioControls volume={media.audioVolume} onVolumeChange={onVolumeChange} />
      )}
      {mode === 'main' && typeof viewCount === 'number' && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded-full border border-white/12 bg-black/35 px-2.5 py-1 text-[12px] text-white/80 tabular-nums backdrop-blur-sm">
          <Eye size={13} aria-hidden="true" />
          {viewCount.toLocaleString()}
          <span className="sr-only">views</span>
        </div>
      )}
      {products?.visible && productsOpen && (
        <div className={`absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm ${productsClosing ? 'modal-backdrop-out' : 'modal-backdrop'}`} role="dialog" aria-modal="true" aria-label="Products" onClick={closeProducts}>
          <div className={`w-full max-w-[420px] max-h-[80vh] overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] flex flex-col shadow-xl ${productsClosing ? 'modal-panel-out' : 'modal-panel'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] shrink-0">
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">{products.linkTitle || 'Products'}</h3>
              <button type="button" aria-label="Close products" onClick={closeProducts} className="h-7 w-7 inline-flex items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">×</button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2">
              {products.items.map((item, i) => (
                <a key={i} href={item.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface-raised)] px-3 py-2.5 hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
                  <span className="text-[13px] font-medium text-[var(--text-primary)] truncate">{item.title}</span>
                  <span className="text-[12px] text-[var(--text-tertiary)] shrink-0">↗</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AudioControls({ volume, onVolumeChange }: { volume: number; onVolumeChange: (v: number) => void }) {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const closeTimer = useRef<number | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const muted = volume <= 0
  const options = [100, 75, 50, 25, 0]

  const closeMenu = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    setClosing(true)
    closeTimer.current = window.setTimeout(() => {
      setOpen(false)
      setClosing(false)
      closeTimer.current = null
    }, 150)
  }, [])

  const toggleMenu = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    if (open) {
      setClosing(true)
      closeTimer.current = window.setTimeout(() => {
        setOpen(false)
        setClosing(false)
        closeTimer.current = null
      }, 150)
    } else {
      setClosing(false)
      setOpen(true)
    }
  }, [open])

  useEffect(() => () => { if (closeTimer.current) window.clearTimeout(closeTimer.current) }, [])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) closeMenu()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, closeMenu])

  return (
    <div ref={wrapRef} className="absolute top-3 left-3 z-20">
      <button
        type="button"
        aria-label={muted ? 'Unmute audio' : 'Audio volume'}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggleMenu}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        {muted ? <VolumeX size={17} aria-hidden="true" /> : <Volume2 size={17} aria-hidden="true" />}
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Volume"
          className={[
            'absolute top-[calc(100%+6px)] left-0 flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-base)] p-1 shadow-xl',
            closing ? 'context-menu-out' : 'context-menu',
          ].join(' ')}
        >
          {options.map((v) => (
            <button
              key={v}
              type="button"
              role="menuitemradio"
              aria-checked={volume === v}
              onClick={() => { onVolumeChange(v); closeMenu() }}
              className={[
                'h-7 min-w-[46px] rounded-[var(--radius-sm)] px-2 text-[12px] font-medium tabular-nums transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
                volume === v
                  ? 'bg-[var(--accent)] text-[var(--text-on-accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-raised)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              {v === 0 ? 'Mute' : `${v}%`}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SocialsBlock({
  socials,
  iconColor,
  align,
}: {
  socials: PageConfig['socials']
  iconColor: string
  align: Align
}) {
  const entries: Array<[keyof PageConfig['socials'], string | undefined]> = [
    ['youtube', socials.youtube],
    ['tiktok', socials.tiktok],
    ['discord', socials.discord],
    ['instagram', socials.instagram],
    ['spotify', socials.spotify],
    ['soundcloud', socials.soundcloud],
    ['twitter', socials.twitter],
    ['facebook', socials.facebook],
    ['website', socials.website],
    ['beatstars', socials.beatstars],
  ]
  const visible = entries.filter(([, url]) => url && url.trim().length > 0)
  if (visible.length === 0) return null

  return (
    <div className="flex flex-col gap-2 py-1" style={{ textAlign: alignToText(align) }}>
      <span className="text-[11px] font-semibold tracking-widest opacity-60">LINKS</span>
      <div className={`flex flex-wrap gap-2 ${alignToJustify(align)}`} role="list" aria-label="Social links">
        {visible.map(([platform, url]) => {
          const key = platform as string
          const icon = SOCIAL_ICONS[key]
          return (
            <Tooltip key={key} label={icon?.label ?? key}>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                role="listitem"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-150 hover:scale-110 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <SocialIcon platform={key} color={iconColor} size={24} />
                <span className="sr-only">{icon?.label ?? key}</span>
              </a>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}

function Section({ label, value, textColor, align }: { label: string; value: string; textColor: string; align?: Align }) {
  return (
    <div className="flex flex-col gap-1" style={{ textAlign: align ? alignToText(align) : undefined }}>
      <span className="text-[11px] font-semibold tracking-widest opacity-60">{label}</span>
      <p className="text-[13px] leading-[1.5] break-words whitespace-pre-wrap" style={{ color: textColor, textAlign: align ? alignToText(align) : undefined }}>
        {value}
      </p>
    </div>
  )
}
