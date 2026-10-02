import { z } from 'zod'

export const BioSizeSchema = z.enum(['xs', 'sm', 'md', 'lg', 'xl'])
export const AvatarSizeSchema = z.enum(['sm', 'md', 'lg', 'xl'])
export const BackgroundTypeSchema = z.enum(['image', 'video'])
export const BackgroundEffectSchema = z.enum(['none', 'blur', 'dark-overlay', 'gradient', 'frosted', 'vignette', 'black-and-white'])
export const CardEffectSchema = z.enum(['none', 'solid', 'frosted', 'glass', 'outline'])
export const AlignSchema = z.enum(['left', 'center', 'right'])
export const CurrencySchema = z.enum(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'])
export const FontSchema = z.enum(['inter', 'outfit', 'archivo', 'dm-sans', 'bricolage', 'archivo-black', 'fredoka', 'kanit', 'bungee', 'righteous', 'bebas-neue', 'fraunces', 'playfair', 'libre-baskerville', 'space-grotesk', 'syne', 'instrument-serif', 'jetbrains-mono'])
export const LandingTransitionSchema = z.enum(['fade', 'slide-up', 'slide-left', 'zoom', 'blur'])

export const PLUGIN_LIMIT = 8

export const PRESET_PLUGINS = [
  'Serum', 'Vital', 'Hive', 'Electra', 'Diva', 'Omnisphere',
  'Kontakt', 'FabFilter Pro-Q', 'Effectrix 2', 'Serum 2',
  'Valhalla VintageVerb', 'Analog Labs V', 'RC-20 Retro Color',
  'Output Arcade', 'Spitfire LABS', 'Native Instruments Komplete',
  'Sonicats Purity', 'Xfer OTT', 'Roland Zenology',
  'AIR Music Xpand!2', 'iZotope Ozone', 'FL Keys',
]

export const PRESET_SERVICES = [
  'Mixing', 'Mastering', 'Production', 'Sound Design', 'Ghost Production',
  'Sample Packs', 'Beat Mixing', 'Vocal Recording', 'Stem Mastering',
  'Arrangement', 'Recording', 'Consulting',
]

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$',
}

export const FONT_OPTIONS: Array<{ value: string; label: string; family: string }> = [
  { value: 'inter', label: 'Inter', family: "'Inter', sans-serif" },
  { value: 'outfit', label: 'Outfit', family: "'Outfit', sans-serif" },
  { value: 'archivo', label: 'Archivo', family: "'Archivo', sans-serif" },
  { value: 'dm-sans', label: 'DM Sans', family: "'DM Sans', sans-serif" },
  { value: 'bricolage', label: 'Bricolage Grotesque', family: "'Bricolage Grotesque', sans-serif" },
  { value: 'archivo-black', label: 'Archivo Black', family: "'Archivo Black', sans-serif" },
  { value: 'fredoka', label: 'Fredoka', family: "'Fredoka', sans-serif" },
  { value: 'kanit', label: 'Kanit', family: "'Kanit', sans-serif" },
  { value: 'bungee', label: 'Bungee', family: "'Bungee', sans-serif" },
  { value: 'righteous', label: 'Righteous', family: "'Righteous', sans-serif" },
  { value: 'bebas-neue', label: 'Bebas Neue', family: "'Bebas Neue', sans-serif" },
  { value: 'fraunces', label: 'Fraunces', family: "'Fraunces', serif" },
  { value: 'playfair', label: 'Playfair Display', family: "'Playfair Display', serif" },
  { value: 'libre-baskerville', label: 'Libre Baskerville', family: "'Libre Baskerville', serif" },
  { value: 'space-grotesk', label: 'Space Grotesk', family: "'Space Grotesk', sans-serif" },
  { value: 'syne', label: 'Syne', family: "'Syne', sans-serif" },
  { value: 'instrument-serif', label: 'Instrument Serif', family: "'Instrument Serif', serif" },
  { value: 'jetbrains-mono', label: 'JetBrains Mono', family: "'JetBrains Mono', monospace" },
]

export const FONT_FAMILY_MAP: Record<string, string> = Object.fromEntries(FONT_OPTIONS.map((o) => [o.value, o.family]))

export const PRESET_DAWS = [
  'Ableton Live',
  'FL Studio',
  'FL Studio Mobile',
  'Logic Pro',
  'Pro Tools',
  'Cubase',
  'Studio One',
  'Bitwig Studio',
  'REAPER',
  'GarageBand',
  'Reason',
  'MPC Beats',
  'Ableton Live + SP-404',
  'Bandlab',
  'LMMS',
]

export const LANDING_TRANSITIONS: Array<{ value: string; label: string }> = [
  { value: 'fade', label: 'Fade' },
  { value: 'slide-up', label: 'Slide up' },
  { value: 'slide-left', label: 'Slide left' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'blur', label: 'Blur' },
]

export const PageConfigSchema = z.object({
  profileHeader: z.object({
    visible: z.boolean(),
    displayName: z.string(),
    bio: z.string(),
    bioSize: BioSizeSchema,
    avatarSize: AvatarSizeSchema.default('md'),
    openForCollabs: z.boolean(),
    align: AlignSchema.default('center'),
  }),
  socials: z.object({
    visible: z.boolean(),
    youtube: z.string().optional(),
    tiktok: z.string().optional(),
    discord: z.string().optional(),
    instagram: z.string().optional(),
    spotify: z.string().optional(),
    soundcloud: z.string().optional(),
    twitter: z.string().optional(),
    beatstars: z.string().optional(),
    website: z.string().optional(),
    facebook: z.string().optional(),
    align: AlignSchema.default('center'),
  }),
  daw: z.object({
    visible: z.boolean(),
    value: z.string(),
    align: AlignSchema.default('left'),
  }),
  plugins: z.object({
    visible: z.boolean(),
    tags: z.array(z.string()),
    align: AlignSchema.default('left'),
  }),
  services: z.object({
    visible: z.boolean(),
    selected: z.array(z.string()),
    align: AlignSchema.default('left'),
  }),
  price: z.object({
    visible: z.boolean(),
    min: z.number().optional(),
    max: z.number().optional(),
    currency: CurrencySchema.default('EUR'),
    negotiable: z.boolean().default(false),
    free: z.boolean().default(false),
    align: AlignSchema.default('left'),
  }),
  products: z.object({
    visible: z.boolean(),
    linkTitle: z.string().default('My Products'),
    items: z.array(z.object({ title: z.string(), url: z.string() })),
    align: AlignSchema.default('left'),
  }),
  landing: z.object({
    headline: z.string().default(''),
    subheadline: z.string().default(''),
    ctaLabel: z.string().default('Click to enter.'),
    transition: LandingTransitionSchema.default('fade'),
    align: AlignSchema.default('center'),
    showAvatar: z.boolean().default(true),
    showHeadline: z.boolean().default(true),
    showSubheadline: z.boolean().default(true),
    showCollabChip: z.boolean().default(true),
    showCta: z.boolean().default(true),
  }),
  media: z.object({
    avatarUrl: z.string().nullable(),
    landing: z.object({
      backgroundUrl: z.string().nullable(),
      backgroundType: z.union([BackgroundTypeSchema, z.null()]),
    }),
    main: z.object({
      backgroundUrl: z.string().nullable(),
      backgroundType: z.union([BackgroundTypeSchema, z.null()]),
    }),
    audioUrl: z.string().nullable(),
    audioVolume: z.number().min(0).max(100),
  }),
  style: z.object({
    textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'must be hex color'),
    iconColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'must be hex color'),
    backgroundEffect: BackgroundEffectSchema,
    effectIntensity: z.number().min(0).max(100).default(50),
    gradientFrom: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#1F1B17'),
    gradientTo: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#000000'),
    showBackgroundCard: z.boolean().default(true),
    headingFont: FontSchema.default('fraunces'),
    bodyFont: FontSchema.default('inter'),
    align: AlignSchema.default('center'),
    accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#D97757'),
    cardEffect: CardEffectSchema.default('frosted'),
    cardBlur: z.number().min(0).max(100).default(40),
    cardOutlineSize: z.number().int().min(0).max(8).default(1),
  }),
})

export type PageConfig = z.infer<typeof PageConfigSchema>
export type BioSize = z.infer<typeof BioSizeSchema>
export type AvatarSize = z.infer<typeof AvatarSizeSchema>
export type BackgroundEffect = z.infer<typeof BackgroundEffectSchema>
export type CardEffect = z.infer<typeof CardEffectSchema>
export type BackgroundType = z.infer<typeof BackgroundTypeSchema>
export type Align = z.infer<typeof AlignSchema>
export type Currency = z.infer<typeof CurrencySchema>
export type FontOption = z.infer<typeof FontSchema>
export type LandingTransition = z.infer<typeof LandingTransitionSchema>

export const DEFAULT_PAGE_CONFIG: PageConfig = {
  profileHeader: { visible: true, displayName: '', bio: '', bioSize: 'md', avatarSize: 'md', openForCollabs: false, align: 'center' },
  socials: { visible: true, align: 'center' },
  daw: { visible: true, value: '', align: 'left' },
  plugins: { visible: true, tags: [], align: 'left' },
  services: { visible: true, selected: [], align: 'left' },
  price: { visible: true, min: undefined, max: undefined, currency: 'EUR', negotiable: false, free: false, align: 'left' },
  products: { visible: false, linkTitle: 'My Products', items: [], align: 'left' },
  landing: { headline: '', subheadline: '', ctaLabel: 'Click to enter.', transition: 'fade' as const, align: 'center' as const, showAvatar: true, showHeadline: true, showSubheadline: true, showCollabChip: true, showCta: true },
  media: {
    avatarUrl: null,
    landing: { backgroundUrl: null, backgroundType: null },
    main: { backgroundUrl: null, backgroundType: null },
    audioUrl: null,
    audioVolume: 50,
  },
  style: { textColor: '#ffffff', iconColor: '#ffffff', backgroundEffect: 'none', effectIntensity: 50, gradientFrom: '#1F1B17', gradientTo: '#000000', showBackgroundCard: true, headingFont: 'fraunces' as const, bodyFont: 'inter' as const, align: 'center', accentColor: '#D97757', cardEffect: 'frosted' as const, cardBlur: 40, cardOutlineSize: 1 },
}

const URL_FIELDS = ['youtube', 'tiktok', 'discord', 'instagram', 'spotify', 'soundcloud', 'twitter', 'facebook', 'website', 'beatstars'] as const

/**
 * Producers routinely paste bare domains. Normalising on save keeps the public
 * page from rendering dead links without forcing a protocol into every input.
 */
export function withProtocol(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed
  if (/^(mailto:|tel:)/i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function normalizeConfigUrls(config: PageConfig): PageConfig {
  const socials = { ...config.socials }
  for (const key of URL_FIELDS) {
    const current = socials[key]
    if (typeof current === 'string' && current.trim()) {
      socials[key] = withProtocol(current)
    }
  }
  return {
    ...config,
    socials,
    products: {
      ...config.products,
      items: config.products.items.map((item) => ({
        ...item,
        url: item.url.trim() ? withProtocol(item.url) : item.url,
      })),
    },
  }
}

export function formatPrice(price: PageConfig['price']): string {
  if (price.free) return 'Free'
  const sym = CURRENCY_SYMBOLS[price.currency] ?? price.currency
  const min = price.min != null ? `${sym}${price.min}` : null
  const max = price.max != null ? `${sym}${price.max}` : null
  let text = ''
  if (min && max) text = `${min} – ${max}`
  else if (min) text = `From ${min}`
  else if (max) text = `Up to ${max}`
  else return ''
  if (price.negotiable) text += ' (negotiable)'
  return text
}

export function validatePageConfig(config: unknown): PageConfig {
  return PageConfigSchema.parse(config)
}

export function isValidPageConfig(config: unknown): boolean {
  return PageConfigSchema.safeParse(config).success
}
