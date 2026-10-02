---
version: 1
slug: "src-pages-marketing-tsx"
primary_target: "src/pages/Marketing.tsx"
related_targets: []
---

# Surface brief - / (Marketing)

Scope: `src/pages/Marketing.tsx` (+ related header/footer). Visitor mode: Persuade.
Audience: music producers sharing one link; recipients are artists/buyers/fans on mobile.
Job: claim username via Discord, see live proof, publish at /:username in minutes.
Action: primary CTA Get started - free (Discord); secondary See live demo (anchor to demo).
Proof/content: live interactive demo built with real `<ProfileRenderer />` + synthetic producer config (labeled demo); door-list stamps for Discord → username → design → publish; what's-inside laminate (beats/kits/services/socials); zero-drift editor-vs-public note; pricing free 1 / paid 10. No fabricated testimonials, customers, benchmarks.
Constraints: preserve name sauce, warm dark neutrals + terracotta sparingly, Inter UI + Fraunces display, Discord login, /:username promise, producer language (no PageConfig/RPC/renderer jargon). Dark-only v1. Reduced-motion respected.
Memorable moment: typing username highlights your row on the door list; clicking CHECK MY PAGE flips the demo from landing to main.
Unresolved: paid tier name/price; real example producers to replace synthetic demo; custom domains out of scope.

## Direction contract

THESIS: Your name is on the list. This surface refuses the SaaS-hero rut (centered headline + 3 same-size feature cards + gradient blob) and its neon-beat-marketplace opposite. One idea: claiming a producer page feels like getting past the door - stamped, listed, live.
OWN-WORLD: Warm dark clipboard ground (#1F1B17 base, #262220 laminate, #17140F sunken), terracotta stamp ink (#D97757) only for claims/checks/primary action, cream ink (#F5F0EA) + muted secondaries. Laminate cards with 10px radius, 1px borders, offset soft shadows. Monospaced door-list rows for names/steps + Inter UI + Fraunces for producer displayName inside demo only.
STORY: Visitor understands in seconds this is the producer page (not generic bio link), believes it because the demo moves (landing gate → full profile), acts by claiming sauce/username or scrolling proof. No dev jargon; controls name actions; errors name recovery.
FIRST VIEWPORT: Left column: H1 + one-line hook + username claim row (sauce/ input + availability echo tied to door list) + Get started + See live demo. Right column: live door-list panel (4 stamped steps, typed name highlighted) stapled to a working mini producer page (avatar, headline, CHECK MY PAGE → flips to sections + audio placeholder). Primary action sits under claim row and repeats at close. Mobile stacks claim → demo → list.
FORM: The List (door-list + backstage laminate), candidate 6 of 7 grounded, seed key b14b2b33, assigned direction. Raises carried: Lockup discipline (Saturday), Layer snap (Dumbar), Descent progression (Ocean), Variant ranking (Sewing).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
