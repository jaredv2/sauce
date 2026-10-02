---
name: Sauce
description: The one link for producers - warm dark laminate, terracotta stamp ink.
colors:
  accent: "#D97757"
  accent-hover: "#E08A6D"
  accent-pressed: "#BD6547"
  bg-base: "#1F1B17"
  bg-surface: "#262220"
  bg-surface-raised: "#2E2A26"
  bg-sunken: "#17140F"
  text-primary: "#F5F0EA"
  text-secondary: "#A8A099"
  text-on-accent: "#1F1B17"
  border-default: "#3A3530"
  border-strong: "#4A443D"
  danger: "#C4604A"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(2.375rem, 6vw, 3.5rem)"
    fontWeight: 600
    lineHeight: 1.0
    letterSpacing: "-0.032em"
  headline:
    fontFamily: "Inter, -apple-system, sans-serif"
    fontSize: "clamp(1.625rem, 4vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Inter, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.5
  mono:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "12px"
    fontWeight: 400
    letterSpacing: "0.02em"
rounded:
  sm: "6px"
  md: "10px"
  full: "999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.text-on-accent}"
    rounded: "{rounded.sm}"
    padding: "0 24px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.bg-surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    height: "36px"
  claim-input:
    backgroundColor: "{colors.bg-sunken}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    height: "44px"
  laminate-card:
    backgroundColor: "{colors.bg-surface}"
    rounded: "{rounded.md}"
---

# Design System: Sauce

## Overview

**Creative North Star: "The List"**

Sauce looks like the door of the venue, not the dashboard of a SaaS. Claiming a producer page feels like getting past the rope: your name highlighted on tonight's list, a laminate stamped LIVE, ticket stubs for the plans. Surfaces are flat, warm, and dark; depth comes from tonal layering (sunken inputs, raised buttons, surface cards), never from glow. Terracotta stamp ink is scarce by doctrine - it marks claims, checks, and the primary action, and its rarity is the point.

Motion is one authored moment per surface (a stamp snapping in, a demo flipping from gate to page), exponential ease-out from an already-visible default, dead under reduced motion. The confirmed anti-reference is the generic SaaS hero: centered headline, gradient blob, three same-size feature cards. This system refuses it with a ledger - rows, dividers, and stamps.

**Key Characteristics:**
- Warm dark clipboard ground, cream ink, terracotta stamp accents only where action lives.
- Ledger rows and door lists instead of card grids; dividers carry the structure.
- Fraunces italic for the one line that sings; Inter everywhere else; JetBrains Mono only for list data (handles, steps, stub codes).
- Stamped, not floating: firm 1px borders, small radii, offset soft shadows, no glass decoration.

## Colors

Warm dark neutrals with a single terracotta stamp ink; never pure black or white.

### Primary
- **Stamp Terracotta** (#D97757): primary actions, claim highlights, checks, stamps, and the italic accent inside headlines. Hover deepens to #E08A6D; pressed to #BD6547; faint wash rgba(217,119,87,0.12) for highlighted rows.

### Neutral
- **Espresso Ground** (#1F1B17): page base and text-on-accent ink.
- **Laminate** (#262220): cards, door lists, header/footer bands.
- **Raised Laminate** (#2E2A26): secondary buttons, hover states.
- **Sunken Well** (#17140F): inputs and quiet panels.
- **Cream Ink** (#F5F0EA): primary text.
- **Ash Ink** (#A8A099): secondary text; the floor for small copy (never the dimmer tertiary below 18px).
- **Borderline** (#3A3530): default 1px borders; **Strong Borderline** (#4A443D) for hover emphasis.
- **Signal Red** (#C4604A): errors and invalid input borders only.

### Named Rules (optional, powerful)
**The Stamp Scarcity Rule.** Terracotta appears on ≤10% of any screen: the primary action, the claim, the check. A large terracotta fill is a veto.
**The Small-Copy Contrast Rule.** Body and microcopy sit on Cream or Ash ink only (≥4.5:1 on the Ground). The dimmer tertiary tone never carries text under 18px.

## Typography

**Display Font:** Fraunces (with Georgia fallback) - italic accent words inside headlines and the producer displayName only.
**Body Font:** Inter (with -apple-system fallback) - everything structural.
**Label/Mono Font:** JetBrains Mono - door-list handles, step meta, stub codes. Data and measurement only, never decoration.

**Character:** Inter states the facts; Fraunces italic sings exactly one line per viewport; the mono stamps the paperwork.

### Hierarchy
- **Display** (semibold 600, clamp(2.375rem, 6vw, 3.5rem), 1.0, -0.032em): the thesis headline, one per surface, balanced wrapping.
- **Headline** (semibold 600, clamp(1.625rem, 4vw, 2.25rem), 1.05, -0.025em): section turns -ledger, stubs, close.
- **Body** (regular 400, 15px, 1.6, max ~46ch): explanation and proof copy.
- **Label** (medium 500, 13px): field labels, demo captions, stub descriptors.
- **Stamp micro-label** (semibold, 11px, +0.14em tracking, uppercase): panel eyebrows inside components (e.g. "4 STEPS · MINUTES"), never above page headlines.

### Named Rules (optional)
**The One Song Rule.** One Fraunces italic phrase per viewport. A second display voice in the same view is a veto.
**The No-Eyebrow Rule.** Page headlines carry their own weight; no kicker label sits above them. Micro-labels live inside components only.

## Layout

Two-column thesis grid on desktop (claim left, list-plus-demo right, max 1080px container); single column on mobile stacking claim → live demo → door list. Sections pace dense → quiet → dense: hero ledger, a quiet full-bleed statement band, the what's-inside ledger, ticket-stub plans, and an anchored close that repeats the primary action. One spacing rhythm (4/8/12/16/24/32), generous separation between sections, tight groups within; more space above a heading than below it. Responsive: columns collapse at 1024px; claim row stacks input over button under 640px.

## Elevation & Depth

Flat by default with tonal layering; shadows respond to state, never decorate.

### Shadow Vocabulary (if applicable)
- **Card rest** (`none`): depth reads from tonal steps (Well → Ground → Laminate → Raised), not shadow.
- **Lift on hover** (`0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.12)` with -1px translate): cards and secondary buttons only.
- **Primary-button warmth** (`0 2px 12px rgba(217,119,87,0.18)` with -1px translate on hover): the single warm shadow in the system.

### Named Rules (optional)
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadow appears only as a response to hover or press, and zero-offset colored halos never count as shadow.

## Shapes

Small, firm, paper-like: 6px radius for buttons and inputs, 10px for laminate cards and lists, full-round only for pills, stamps, and avatars. Every laminate edge carries a 1px Borderline stroke; ticket stubs add a dashed terracotta perforation on one edge. Stamps are bordered rectangles rotated −4°, mono, tracked wide - they look printed, not rendered.

## Components

### Buttons
- **Shape:** firm small radius (6px), semibold, press-down active state (scale 0.98).
- **Primary:** Stamp Terracotta ground, Espresso ink, 44px height, 24px horizontal padding; hover lifts with the single warm shadow.
- **Hover / Focus:** -1px translate on hover; 2px terracotta focus ring with base-colored offset on all variants.
- **Secondary:** Raised Laminate ground, Cream ink, 1px Borderline stroke; hover strengthens the border. Ghost and danger follow the same ring discipline.

### Door-list rows
- **Style:** Laminate rows separated by subtle dividers; numbered medallions, mono handle echo right-aligned and truncated.
- **State:** the active row washes terracotta-subtle with terracotta medallion; a stamped row carries a rotated IN stamp. Only true states stamp - never decorative checks.

### Cards / Containers
- **Corner Style:** 10px laminate radius, 1px Borderline.
- **Background:** Laminate; quiet panels sink to the Well.
- **Shadow Strategy:** flat at rest per the Flat-By-Default Rule.
- **Internal Padding:** 16–24px cards, 12–16px rows.

### Inputs / Fields
- **Style:** Sunken Well ground, Borderline stroke, 6px radius, 44px height; terracotta caret; secondary-ink placeholder.
- **Focus:** 2px terracotta ring, border transparent.
- **Error / Disabled:** Signal Red border plus plain-language recovery hint; disabled buttons fade to 50% and drop pointer events.

### Navigation
- Sticky 56px Laminate bar with subtle bottom border; wordmark plus a terracotta-wash "for producers" pill; primary link is the sign-in stamp button. Footer is a quiet Laminate band, Ash microcopy, plain text links.

### Stamp
- Rotated (−4°) bordered mono tag in Stamp Terracotta on translucent Ground; snaps in once with an expo-out stamp motion. Reserved for IN, LIVE, ADMIT ONE, and plan codes.

## Do's and Don'ts

Concrete visual guardrails grounded in the shipped / route.

### Do:
- **Do** keep terracotta scarce - action, claim, and stamp only.
- **Do** use ledger rows and dividers for sequential or comparative content; reach for a card grid never.
- **Do** label every demonstration as sample content and every synthetic producer as such.
- **Do** theme browser surfaces from the palette: terracotta selection and caret, thin Borderline scrollbars, 2px focus rings.
- **Do** honor reduced motion: all entrances resolve to visible, instantly.

### Don't:
- **Don't** put a kicker or eyebrow above a page headline, ever.
- **Don't** use gradient text, glassmorphism, or decorative blur.
- **Don't** use Mono as a costume for "technical" - handles, steps, and codes only.
- **Don't** invent prices, testimonials, customers, or availability claims the product cannot prove.
- **Don't** ship dev vocabulary (renderer, RPC, config, drift) to visitors - producer language only.
