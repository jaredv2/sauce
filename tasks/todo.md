# Sauce v1 - Todo

## Phase 1: Schema
- [x] Task 1: Project scaffold (Vite React-TS + Tailwind + React Router + Supabase + env)
- [x] Task 2: PageConfig types + Zod + DEFAULT_PAGE_CONFIG
- [x] Task 3: Supabase SQL migration (profiles/pages/page_views + functions + RLS + public_pages view + buckets + theme tokens)
- [x] Checkpoint: `npm run build` clean, RLS test plan documented

## Phase 2: Auth + Onboarding
- [x] Task 4: AuthContext + AuthGuard + RequireProfile (`src/contexts/AuthContext.tsx`, `src/components/guards/RequireAuth.tsx`)
- [x] Task 5: /login Discord OAuth (`src/pages/Login.tsx` - supabase.auth.signInWithOAuth discord, redirectTo onboarding, error + env hint)
- [x] Task 6: /onboarding username flow (`src/pages/Onboarding.tsx` - regex ^[a-z0-9_]{3,20}$, debounce 400ms uniqueness check, insert profiles with discord_id/avatar_url, refreshProfile -> /dashboard/pages)

## Phase 3: ProfileRenderer
- [x] Task 7: ProfileRenderer landing mode (`src/components/ProfileRenderer/ProfileRenderer.tsx` - avatar, displayName Fraunces, CHECK MY PAGE, media.landing)
- [x] Task 8: ProfileRenderer main mode + 6 background effects (shared impl, landing/main via config, frosted @supports fallback, video muted, `src/pages/RendererDemo.tsx` at /dev/preview)

## Phase 4: Editor
- [x] Task 9: Editor shell + data wiring (`src/pages/Editor.tsx` - fetch pages by id, client ownership check, merge draft_config via Zod, loading/notfound/error states)
- [x] Task 10: Form controls (section toggles for 6 sections, displayName/bio/bioSize XS-XL/openForCollabs, 7 social URLs, DAW, plugins tag Enter/×, services, price - all bound to local draft)
- [x] Task 11: Assets (avatar upload + Import from Discord `profiles.discord_avatar_url`, landing/main background image|video via `src/lib/storage.ts`, audio upload + volume 0-100 slider + inline preview)
- [x] Task 12: Style controls + effect picker (text/icon color `<input type=color>`, 6 effects grid with live miniature from actual upload per theme spec, role=radiogroup + ring accent)
- [x] Task 13: Save/Publish bar (top bar Saved time, Live link to /:username disabled if never published, Save → draft_config+draft_updated_at, Publish → rpc publish_page)

## Phase 5: Publish + Public
- [x] Task 14: /:username public route + view logging + popup (`src/pages/PublicProfile.tsx` - public_pages view query, notfound state, ProfileRenderer landing→main, fire-and-forget page_views insert, viewCount, audio muted-autoplay→unmute, Join sauce sessionStorage popup at `src/App.tsx:81`)

## Phase 6: Dashboard + Pages
- [x] Task 15: /dashboard stats (`src/pages/Dashboard.tsx` - count(*) page_views, quick links Manage/Settings/Live with disabled state)
- [x] Task 16: /dashboard/pages list/create/delete/publish (`src/pages/SavedPages.tsx` - list with Live badge + draft_updated_at, create with DEFAULT_PAGE_CONFIG + limit tooltip, Set as active via publish_page RPC, delete confirm + on-delete-set-null handling)

## Phase 7: Settings
- [x] Task 17: /settings (`src/pages/Settings.tsx` - username change with regex+debounce+update, plan display, Discord read-only, delete confirm with typed username + cascade delete profile → pages → page_views + signOut at `src/App.tsx:74`)

## Done
- (none yet)
