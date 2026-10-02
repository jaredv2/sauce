import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resvg } from 'https://esm.sh/@resvg/resvg-js@2.6.2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const SITE_URL = Deno.env.get('SITE_URL') ?? ''
const PORT = Number(Deno.env.get('PORT') ?? 8000)

const FONT_CSS =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@600;700&display=swap'
const LEGACY_UA = 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)'

let fontFiles: Uint8Array[] | null = null

async function loadFonts(): Promise<Uint8Array[]> {
  if (fontFiles) return fontFiles
  try {
    const cssRes = await fetch(FONT_CSS, { headers: { 'User-Agent': LEGACY_UA } })
    const css = await cssRes.text()
    const urls = [...css.matchAll(/url\((https:\/\/[^)]+)\)/g)].map((m) => m[1])
    const unique = [...new Set(urls)].slice(0, 8)
    const files = await Promise.all(
      unique.map(async (u) => {
        const res = await fetch(u)
        if (!res.ok) return null
        return new Uint8Array(await res.arrayBuffer())
      }),
    )
    fontFiles = files.filter((f): f is Uint8Array => f !== null)
  } catch (err) {
    console.error('[og-card] font load failed', err)
    fontFiles = []
  }
  return fontFiles
}

function escapeXml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function firstString(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if (!current) {
      current = word
    } else if (`${current} ${word}`.length <= maxChars) {
      current = `${current} ${word}`
    } else {
      lines.push(current)
      current = word
    }
    if (lines.length === 2) break
  }
  if (lines.length < 2 && current) lines.push(current)
  return lines.slice(0, 2)
}

async function fetchAvatarAsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.startsWith('image/')) return null
    const bytes = new Uint8Array(await res.arrayBuffer())
    if (bytes.byteLength > 2_000_000) return null
    let binary = ''
    const chunk = 0x8000
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
    }
    return `data:${contentType};base64,${btoa(binary)}`
  } catch (err) {
    console.error('[og-card] avatar fetch failed', err)
    return null
  }
}

function buildSvg(data: {
  name: string
  username: string
  tagline: string[]
  linkCount: number
  productCount: number
  isLive: boolean
  avatarDataUri: string | null
}): string {
  const { name, username, tagline, linkCount, productCount, isLive, avatarDataUri } = data
  const initial = escapeXml(name.charAt(0).toUpperCase() || username.charAt(0).toUpperCase())
  const stats: Array<[string, string]> = [
    [String(linkCount), 'LINKS'],
    [String(productCount), 'PRODUCTS'],
    [isLive ? 'LIVE' : 'DRAFT', 'STATUS'],
  ]

  const statBlocks = stats
    .map(([value, label], i) => {
      const x = 96 + i * 300
      return `
    <text x="${x}" y="536" font-family="Inter" font-size="34" font-weight="600" fill="#F5F0EA">${escapeXml(value)}</text>
    <text x="${x}" y="562" font-family="Inter" font-size="15" font-weight="500" fill="#A8A099" letter-spacing="1.2">${escapeXml(label)}</text>`
    })
    .join('')

  const taglineLines = tagline
    .map(
      (line, i) =>
        `<text x="96" y="${330 + i * 34}" font-family="Inter" font-size="26" font-weight="400" fill="#A8A099">${escapeXml(line)}</text>`,
    )
    .join('')

  const avatar = avatarDataUri
    ? `<clipPath id="avatarClip"><circle cx="140" cy="180" r="64" /></clipPath>
  <image href="${avatarDataUri}" x="76" y="116" width="128" height="128" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip)" />`
    : `<circle cx="140" cy="180" r="64" fill="#2E2A26" stroke="#D97757" stroke-width="3" />
  <text x="140" y="198" font-family="Syne" font-size="56" font-weight="700" fill="#D97757" text-anchor="middle">${initial}</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="640" viewBox="0 0 1280 640">
  <defs>${avatarDataUri ? '<clipPath id="avatarClip"><circle cx="140" cy="180" r="64" /></clipPath>' : ''}</defs>
  <rect width="1280" height="640" fill="#1F1B17" />
  <rect x="32" y="32" width="1216" height="576" rx="20" fill="#262220" stroke="#3A3530" stroke-width="2" />
  <rect x="32" y="596" width="1216" height="12" rx="6" fill="#D97757" />
  ${avatar}
  <text x="232" y="168" font-family="Syne" font-size="52" font-weight="700" fill="#F5F0EA">${escapeXml(name)}</text>
  <text x="232" y="206" font-family="Inter" font-size="24" font-weight="500" fill="#A8A099">@${escapeXml(username)}</text>
  ${taglineLines}
  <line x1="96" y1="470" x2="1184" y2="470" stroke="#2E2A26" stroke-width="2" />
  ${statBlocks}
  <text x="1184" y="92" font-family="Inter" font-size="22" font-weight="600" fill="#D97757" text-anchor="end">saucewrld</text>
</svg>`
}

Deno.serve({ port: PORT }, async (request) => {
  const url = new URL(request.url)
  const username = (url.searchParams.get('u') ?? '').trim()

  if (!username || !/^[a-z0-9_]{3,20}$/.test(username)) {
    return new Response('Missing or invalid u', { status: 400 })
  }

  let name = username
  let tagline = 'Producer link-in-bio on saucewrld.'
  let linkCount = 0
  let productCount = 0
  let isLive = false
  let avatarDataUri: string | null = null

  try {
    const supabase = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } },
    })
    const [ownerRes, pageRes] = await Promise.all([
      supabase.from('profiles').select('display_name, bio, page_visibility').eq('username', username).maybeSingle(),
      supabase.from('public_pages').select('live_config').eq('username', username).maybeSingle(),
    ])

    if (ownerRes.data?.page_visibility === 'private') {
      return new Response('Not found', { status: 404 })
    }

    const live = (pageRes.data?.live_config ?? null) as Record<string, any> | null
    const header = (live?.profileHeader ?? {}) as Record<string, unknown>
    name = firstString(header.displayName, ownerRes.data?.display_name) || username
    tagline = firstString(header.bio, ownerRes.data?.bio) || 'Producer link-in-bio on saucewrldwrld.'
    isLive = !!live

    // Only anon-readable data may appear on a public card. View counts are
    // owner-only under RLS, so the card reports link/product counts instead.
    const socials = (live?.socials ?? {}) as Record<string, unknown>
    linkCount = Object.values(socials).filter(
      (v) => typeof v === 'string' && v.trim() && v !== 'align',
    ).length
    productCount = ((live?.products as Record<string, unknown> | undefined)?.items as unknown[] | undefined)?.length ?? 0

    const avatarUrl = (live?.media as Record<string, unknown> | undefined)?.avatarUrl
    if (typeof avatarUrl === 'string' && avatarUrl.startsWith('http')) {
      avatarDataUri = await fetchAvatarAsDataUri(avatarUrl)
    }
  } catch (err) {
    console.error('[og-card] lookup failed', err)
  }

  const svg = buildSvg({
    name,
    username,
    tagline: wrap(tagline, 64),
    linkCount,
    productCount,
    isLive,
    avatarDataUri,
  })

  const fonts = await loadFonts()

  try {
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: 1280 },
      background: '#1F1B17',
      font: {
        fontFiles: fonts,
        loadSystemFonts: false,
        defaultFontFamily: 'Inter',
        sansSerifFamily: 'Inter',
        serifFamily: 'Inter',
      },
    })
    const png = resvg.render().asPng()
    return new Response(png as unknown as BodyInit, {
      status: 200,
      headers: {
        'content-type': 'image/png',
        'cache-control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
        ...(SITE_URL ? { 'access-control-allow-origin': '*' } : {}),
      },
    })
  } catch (err) {
    console.error('[og-card] rasterize failed', err)
    return new Response(svg, {
      status: 200,
      headers: { 'content-type': 'image/svg+xml; charset=utf-8' },
    })
  }
})
