---
name: Fintech Prestige
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#5c403c'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#916f6b'
  outline-variant: '#e6bdb8'
  surface-tint: '#bf0715'
  primary: '#b70011'
  on-primary: '#ffffff'
  primary-container: '#dc2626'
  on-primary-container: '#fff6f5'
  inverse-primary: '#ffb4ab'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#004ed0'
  on-tertiary: '#ffffff'
  tertiary-container: '#2d68f0'
  on-tertiary-container: '#f8f7ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ab'
  on-primary-fixed: '#410002'
  on-primary-fixed-variant: '#93000b'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#00174b'
  on-tertiary-fixed-variant: '#003ea8'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
  currency-display:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.02em
  currency-row:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-desktop: 1.75rem
  margin: 1.5rem
  margin-desktop: 2.5rem
  space-2xs: 0.25rem
  space-xs: 0.375rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style
The design system manifests a prestigious, institutional, yet accessible personal finance intelligence platform for high-performance desktop workspaces. Bridging the gap between private banking prestige and modern consumer fintech agility, it balances crisp structural geometry with warm tactile touches.

The emotional signature is **authoritative control, lucid clarity, and financial serenity**. The system uses a pristine canvas (#F8FAFC) flanked by warm dimensional card surfaces, punctuated by vivid semantic cues: crimson ruby (#DC2626) for outflows and attention-critical alerts, rich emerald (#059669) for portfolio growth and surpluses, dynamic trust blue (#2563EB) for asset connections and cashflow liquidity, and antique gold insignia accents reflecting the signature coin crest emblem. 

The aesthetic is **Modern Institutional Glass & Card**: clean flat-plane architecture accented by faint boundary borders, micro drop-shadows with slight color temperature, and pillared dashboard grids designed for high-density multi-currency data consumption.

## Colors
The palette organizes financial health through strict semantic discipline:

- **Primary Brand / Action & Outflows (`#DC2626` / Ruby Red):** Represents core user actions, expense debits, critical balance warnings, and interactive active-pill states. Complemented by `#BE123C` for dark contrast states and `#FEF2F2` for soft tinted badge backgrounds.
- **Secondary / Wealth & Growth (`#059669` / Emerald Green):** Denotes positive cash inflows, funded balance trajectories, target savings completions, and positive deltas. Accompanied by `#ECFDF5` for optimistic tag backdrops.
- **Tertiary / Liquidity & Connections (`#2563EB` / Royal Trust Blue):** Applied to institutional bank feeds (Napas/Vietcombank links), savings goal meters, and AI assistant query surfaces. Supported by `#EFF6FF`.
- **Prestige Accent / Gold Crest (`#D97706` / Amber Gold):** Reserved for institutional seals, VIP tier markers, and intermediate budget warning thresholds (80–100%).
- **Neutral Stack:** Grounded on a slate baseline with `#0F172A` (900) for primary headers and tabular numeric ledgers, `#475569` (600) for secondary metadata and timestamps, `#94A3B8` (400) for placeholder states, `#E2E8F0` (200) for structural dividers, and `#F8FAFC` as the ambient canvas backdrop.

## Typography
The system utilizes **Plus Jakarta Sans** for editorial and architectural hierarchy, delivering modern structural warmth across UI titles, dashboard section modules, and analytical cards. 

For all numeric figures, financial balances, currency values (`₫`), and transaction ledger rows, the system mandates **Inter** with tabular lining figures enabled (`font-feature-settings: 'tnum' on, 'cv05' on`). This ensures absolute optical column alignment across credit/debit listings and data grids. 

Currency symbols (`₫`, `VND`) are set in matched baseline weights with a subtle trailing offset. Header tracking is tightened progressively as scale expands to retain visual tension on large desktop monitors.

## Layout & Spacing
The layout architecture is optimized for desktop productivity using a pinned dual-rail structure:
- **Navigation Sidebar:** Fixed at 260px on desktop (collapsible to 72px icon-only state on viewports `<1280px`). Contains the gold crest identity, quick balance status, and core navigation routes.
- **Main Analytical Stage:** Fluid multi-column area anchored within a maximum width of `1600px`. Uses a 12-column grid system with `1.75rem` (28px) desktop gutters.
- **Contextual Financial Rail (Net Worth / AI Assistant):** A secondary 380px auxiliary workspace docked to the right viewport edge for persistent net worth breakdown or real-time Gemini AI financial query interactions.

Spacing relies strictly on an 8pt base grid. Internal card paddings follow a generous `1.5rem` (24px) density to maintain airy separation between dense tabular rows and sparkline chart vectors.

## Elevation & Depth
Elevation is constructed through subtle ambient shadows tinted with navy undertones, avoiding muddy grays:

- **Level 0 (Canvas):** `#F8FAFC` base surface without shadows.
- **Level 1 (Card & Module Tiles):** Pure `#FFFFFF` background with a crisp border (`1px solid #E2E8F0`) and ambient drop shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)`.
- **Level 2 (Hovered Ledger Rows & Cards):** `0 10px 15px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.03)` with border shifting to `#CBD5E1`.
- **Level 3 (Popovers, AI Prompts & Menus):** `0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`.
- **Special Surface (Total Net Worth VIP Hero):** Dark gunmetal linear gradient (`linear-gradient(135deg, #1E293B 0%, #0F172A 100%)`) with white tabular typography, creating high contrast against surrounding light dashboard tiles.

## Shapes
The design adopts a refined, rounded geometric cadence. Standard cards, analytical panels, and financial ledger containers use an 8px (`rounded-md`) to 16px (`rounded-2xl`) corner radius, projecting approachable precision without looking playful. 

Interactive chips, pill tags, icon badge circles, and the primary transaction quick-action buttons utilize fully circular or pill contours (`rounded-full`). Metric status progress bars use rounded capsule pill ends to maintain fluid optical balance across high-density desktop interfaces.

## Components

### Buttons & Interactive Controls
- **Primary Outflow/Action Button:** Rich Crimson Red (`#DC2626`) background, pure white label, `rounded-xl` (12px), subtle ruby outer glow on focus (`0 0 0 3px rgba(220, 38, 38, 0.2)`).
- **Secondary Button:** Surface white `#FFFFFF` with `#E2E8F0` perimeter border, `#0F172A` text, hover transition to `#F8FAFC`.
- **Quick-Add Floating Center Trigger:** Circular 48px or 56px red button (`#DC2626`) with a centered white plus icon, paired with a subtle elevation pulse.

### Metric KPI Cards
- Contained within `#FFFFFF` cards with 16px rounded borders.
- Top section contains category title in muted slate (`#64748B`), paired with an eye toggle for balance privacy.
- Primary balance displayed with large tabular numbers (`Inter` Bold).
- Bottom section splits into split pill-stat compartments: Blue tinted pill for income (`#EFF6FF` with `#2563EB` down-arrow icon) and Red tinted pill for expense (`#FEF2F2` with `#DC2626` up-arrow icon).

### AI Prompt Smart Input Bar (Gemini AI Financial Parse)
- Desktop dock or modal input bar with a soft iridescent or gradient border highlight.
- Contains dynamic natural language hints ("Analyze my September expenses and suggest savings").
- Features a microphone icon for voice inputs and an end-aligned indigo/crimson gradient circular trigger (`linear-gradient(135deg, #2563EB, #DC2626)`) for prompt execution.
- AI responses render in card modules equipped with helpfulness feedback buttons (thumbs up/down) and smart inline goal chips.

### Categorized Transaction Ledger
- Rows feature a 44px rounded container icon on the left with category-tinted soft backgrounds (e.g., `#FEE2E2` for shopping/clothing, `#EFF6FF` for banking, `#FEF3C7` for food & drink).
- Right section aligns amount text strictly to the right edge: tabular font, green with a leading `+` for inflows, dark red with a leading `-` for debits, accompanied by status subtitles ("Hoàn tất", "Chi tiêu").

### Budget Threshold Progress Bars
- Linear bars with 8px height and pill ends (`rounded-full`).
- Dynamic three-tier color coding:
  - `< 80%`: Safe Emerald Green (`#059669`).
  - `80% – 100%`: Cautionary Amber (`#D97706`).
  - `> 100%`: Alert Crimson Red (`#DC2626`) with accompanying micro-badge alert.

### Net Worth & Account Breakdown Cards
- Dedicated bank and asset items showing the institution logo or branded icon, masked account number (`•••• 4821`), verification pill ("Đã liên kết Napas 247"), and a live statement action link.