# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: music producers sharing a single link (sauce/@username) with artists, buyers, and fans. Situation: dropping link in DMs, Discord, Instagram bio - recipient opens on mobile, decides in seconds whether to listen / book / follow.

## Product Purpose

Sauce is the link-in-bio built for producers. One producer page holds beats, kits, services, socials, and contact - with a landing gate into a full-bleed immersive profile. Success = producer goes Discord login → username → design → publish, live at /:username in minutes, and shares it as their canonical link.

## Positioning

All-in-one producer page - not a generic link list (Linktree/Carrd) and not a beat marketplace (BeatStars). Meaningfully different mechanism: single `PageConfig` drives both editor preview and public profile via one `<ProfileRenderer />` - no drift; atomic `publish_page()` RPC copies draft → live; Discord-native auth.

## Operating Context

Workflows: Discord login → choose username (3–20 chars, lowercase) → design page in dashboard editor (split pane + live preview) → Save draft → Publish instantly → share /:username. Public flow: landing mode (avatar, displayName, CHECK MY PAGE) → main mode (sections, audio, effects). Environments: dashboard editor + full-bleed public profile (mobile-first recipients). Tools: React + Vite + Tailwind + React Router + Supabase (Postgres/Auth/Storage/RPC).

## Capabilities and Constraints

Confirmed: Discord OAuth; username claim; editor (toggles, tags, avatar/background/audio upload, 6 background effects, style picker); save to `draft_config` / publish via RPC to `live_config`; public read via `public_pages` view only; view logging; Join-sauce popup; free plan 1 page, paid 10 pages; dark-only v1; tokens as CSS vars on :root, never pure black/white; accent only for primary actions/active states; Inter UI + Fraunces for public displayName only. Undecided: paid tier name/price, custom domains, analytics depth beyond view counts.

## Brand Commitments

Name: sauce (lowercase). Keep current system: warm dark neutrals (#1F1B17 base etc.) + terracotta accent (#D97757 sparingly); Inter + Fraunces pairing; v1 badge language. Voice: direct, producer-native, no hype. Must preserve: Discord login, free 1 / paid 10 framing, /:username URL promise.

## Evidence on Hand

No real producer pages, testimonials, press, or metrics to cite - future work must not fabricate them. Real code paths: `src/components/ProfileRenderer/ProfileRenderer.tsx` (sole profile UI), `src/pages/Marketing.tsx` (current /), `src/pages/PublicProfile.tsx`, `src/types/pageConfig.ts`, `tasks/plan.md`. No approved marketing copy or imagery.

## Product Principles

1. One page, one link - everything a producer needs lives at /username.
2. What you preview is what fans get - single renderer, zero drift.
3. Publish in seconds, not sprints - Discord in, link out.
4. Producer-native, not generic - beats, kits, DAW/plugins, services first.
5. Warm and confident - dark craft, terracotta only where action lives.

## Accessibility & Inclusion

Respect `prefers-reduced-motion`; visible keyboard focus rings; semantic landmarks on public pages; maintain contrast on warm dark neutrals.
