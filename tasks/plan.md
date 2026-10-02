# Implementation Plan: Sauce v1

## Overview
Producer-focused link-in-bio platform. Stack: React + Vite + Tailwind CSS + React Router + Supabase (Postgres/Auth/Storage). Core invariant: single `<ProfileRenderer config={config} />` driven by `PageConfig` used by both dashboard preview and `/:username` public route (§2 v1 spec). App theme: warm dark neutrals + terracotta accent (Claude-inspired), Inter for UI chrome, Fraunces for public displayName only. Background effects: 6 user-selectable options layered on profile media.

Build in spec phase order §8, each independently testable. Google Fonts for type, no sample image for picker miniatures (use actual uploaded background or placeholder).

## Architecture Decisions
- **Supabase BaaS**: Postgres + Auth (Discord OAuth) + Storage + RPC. RLS + `security definer` `publish_page` keeps draft/live atomic.
- **Single renderer**: `src/components/ProfileRenderer/` is sole profile UI. Prevents editor/live drift.
- **JSONB + Zod**: `draft_config`/`live_config` validated client-side. Postgres stores opaque JSONB.
- **Public read via `public_pages` view**: Only view granted to `anon`; never expose `pages` directly (protects `draft_config`).
- **Tokens as CSS vars on :root**: Tailwind extends to `var(--*)` so sync is automatic. Dark-only for v1.
- **Accent scarcity**: `--accent` only for primary actions/active states/selected swatch. No large fills.
- **State**: Supabase session in AuthContext; local state for editor draft.
- **Guards**: Single `<AuthGuard>` + `<RequireProfile>` wrapper, not per-page duplication.
- **Storage paths**: `avatars/{profile_id}/`, `backgrounds/{profile_id}/{page_id}/`, `audio/...` with prefix check.

## Task List

### Phase 1: Schema (current)
- [ ] Task 1: Project scaffold (Vite React-TS + Tailwind + React Router + Supabase client + env)
- [ ] Task 2: Type definitions - PageConfig + Zod + DEFAULT_PAGE_CONFIG
- [ ] Task 3: Supabase schema migration - tables/indexes/functions/triggers/RLS/view/buckets + theme tokens file
- [ ] Checkpoint: Foundation - `npm run build` clean, RLS manual test plan documented

### Phase 2: Auth + Onboarding
- [ ] Task 4: Auth context + route guards (AuthGuard, RequireProfile)
- [ ] Task 5: /login Discord OAuth
- [ ] Task 6: /onboarding username flow (regex + debounce uniqueness + insert)
- [ ] Checkpoint: Auth - login -> onboarding -> dashboard

### Phase 3: ProfileRenderer (hardcoded config, no DB)
- [ ] Task 7: ProfileRenderer landing mode (avatar, displayName Fraunces, CHECK MY PAGE, media.landing)
- [ ] Task 8: ProfileRenderer main mode (all sections, media.main, audio, style effects 6 variants, @supports fallback)
- [ ] Checkpoint: Renderer - both modes verified before wiring

### Phase 4: Editor
- [ ] Task 9: Editor shell (/dashboard/pages/:pageId/edit fetch + split pane + tab switch)
- [ ] Task 10: Editor form controls (toggles, inputs, tags bound to local draft)
- [ ] Task 11: Editor assets (avatar/discord import, backgrounds, audio + volume)
- [ ] Task 12: Editor style + signature effect picker (live 64x64 miniatures, actual bg or placeholder, radiogroup a11y, accent ring)
- [ ] Task 13: Editor save/publish bar (Save -> draft_config, Publish -> RPC, Saved label, Live link)
- [ ] Checkpoint: Editor - draft->preview->save->publish round-trip

### Phase 5: Publish + Public Route
- [ ] Task 14: Public /:username (public_pages query, not-found, landing->main transition, view logging, Join popup, autoplay)
- [ ] Checkpoint: Public - published page viewable anonymously

### Phase 6: Saved Pages + Dashboard
- [ ] Task 15: /dashboard (total views count, quick links)
- [ ] Task 16: /dashboard/pages (list, create w/ limit, delete, set active via publish_page)
- [ ] Checkpoint: Pages

### Phase 7: Settings
- [ ] Task 17: /settings (change username, plan/discord display, delete account)
- [ ] Checkpoint: Complete - all §5 routes + §6 behaviors verified

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| security definer bypass | High | Ownership check inside publish_page + RLS; test 2 users |
| draft_config leak | High | Only public_pages view to anon |
| Discord OAuth not configured | High | Fail fast Task 5, needs Supabase dashboard setup |
| Autoplay blocked | Med | Muted autoplay + unmute on interaction |
| backdrop-filter unsupported | Med | @supports fallback to dark-overlay |
| No design assets | Med | Minimal Tailwind defaults, warm tokens already spec'd |

## Open Questions (resolved)
- Fonts: Google Fonts (Inter + Fraunces) - resolved
- Picker sample image: none - use actual bg or placeholder - resolved
- Supabase project: assumed to be provisioned by user; env keys needed for Tasks 4+

## Parallelization
- Safe parallel: Types + SQL after scaffold; Settings after public route
- Sequential: Schema before auth; Renderer before editor/public; Save before publish
- Coordination: PageConfig contract (Task 2) before renderer/editor/public

## References
- v1 spec: `C:\Users\assko\Downloads\sauce-v1-spec.md`
- theme spec: `C:\Users\assko\Downloads\sauce-theme-spec.md`
