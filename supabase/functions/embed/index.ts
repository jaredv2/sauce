import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BOT_AGENTS = [
  'discordbot',
  'twitterbot',
  'slackbot',
  'slack-imgproxy',
  'telegrambot',
  'whatsapp',
  'facebookexternalhit',
  'linkedinbot',
  'pinterest',
  'redditbot',
  'googlebot',
  'bingbot',
  'embedly',
  'skypeuripreview',
  'vkshare',
  'discord',
]

const SITE_URL = Deno.env.get('SITE_URL') ?? ''
const SUPAABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const PORT = Number(Deno.env.get('PORT') ?? 8000)

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function isBot(request: Request): boolean {
  const url = new URL(request.url)
  if (url.searchParams.get('bot') === '1') return true
  if (url.searchParams.get('bot') === '0') return false
  const ua = (request.headers.get('user-agent') ?? '').toLowerCase()
  if (!ua) return true
  return BOT_AGENTS.some((agent) => ua.includes(agent))
}

function firstString(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

Deno.serve({ port: PORT }, async (request) => {
  const url = new URL(request.url)
  const username = decodeURIComponent(url.pathname.replace(/^\/+|\/+$/g, '')).split('/')[0] ?? ''

  if (!username || !SITE_URL || !SUPABASE_URL || !ANON_KEY) {
    return new Response('Not configured', { status: 500 })
  }

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return Response.redirect(`${SITE_URL}/p/${encodeURIComponent(username)}`, 302)
  }

  const canonical = `${SITE_URL}/p/${username}`
  const imageUrl = `${SUPAABASE_URL}/functions/v1/og-card?u=${encodeURIComponent(username)}`

  let profile: Record<string, unknown> | null = null
  let page: Record<string, unknown> | null = null

  try {
    const supabase = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } },
    })
    const [ownerRes, pageRes] = await Promise.all([
      supabase.from('profiles').select('display_name, bio, page_visibility').eq('username', username).maybeSingle(),
      supabase.from('public_pages').select('live_config').eq('username', username).maybeSingle(),
    ])
    profile = (ownerRes.data as Record<string, unknown> | null) ?? null
    page = (pageRes.data as Record<string, unknown> | null) ?? null
  } catch (err) {
    console.error('[embed] lookup failed', err)
  }

  const hidden = profile?.page_visibility === 'private'

  if (!isBot(request) || hidden) {
    return Response.redirect(canonical, 302)
  }

  const live = (page?.live_config ?? null) as Record<string, any> | null
  const header = (live?.profileHeader ?? {}) as Record<string, unknown>
  const name = firstString(header.displayName, profile?.display_name) || username
  const tagline = firstString(header.bio, profile?.bio) || 'Producer link-in-bio on saucewrld.'
  const title = `${name} (@${username}) - saucewrld`
  const description = tagline.length > 200 ? `${tagline.slice(0, 197)}…` : tagline

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="canonical" href="${escapeHtml(canonical)}" />
<meta property="og:type" content="profile" />
<meta property="og:site_name" content="saucewrld" />
<meta property="og:url" content="${escapeHtml(canonical)}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(imageUrl)}" />
<meta property="og:image:width" content="1280" />
<meta property="og:image:height" content="640" />
<meta property="og:image:alt" content="${escapeHtml(`${name} on saucewrld`)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
<meta http-equiv="refresh" content="0; url=${escapeHtml(canonical)}" />
</head>
<body style="background:#1F1B17;color:#F5F0EA;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<p>Opening <a style="color:#D97757" href="${escapeHtml(canonical)}">@${escapeHtml(username)}</a>…</p>
</body>
</html>`

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=300',
    },
  })
})
