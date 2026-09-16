---
name: Modern Dynamic FinTech
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#5b403e'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#8f706d'
  outline-variant: '#e3bebb'
  surface-tint: '#b81d27'
  primary: '#b51925'
  on-primary: '#ffffff'
  primary-container: '#d8363a'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb3ae'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#006947'
  on-tertiary: '#ffffff'
  tertiary-container: '#00855b'
  on-tertiary-container: '#f5fff6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad7'
  primary-fixed-dim: '#ffb3ae'
  on-primary-fixed: '#410004'
  on-primary-fixed-variant: '#930015'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-currency:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
  display-currency-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '800'
    lineHeight: 38px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
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
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
  currency-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '700'
    lineHeight: 20px
  currency-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes an approachable, energetic, and highly trustworthy financial interface tailored specifically for Vietnamese Gen Z students and emerging professionals. Navigating daily expenses, savings goals, and shared bills should feel encouraging rather than intimidating. 

The aesthetic is Modern Refined FinTech with tactile clarity: crisp white card modules float effortlessly over an ultra-clean, slate-tinted canvas. Micro-interactions and decisive visual accents in dynamic coral stimulate daily engagement, while dedicated semantic accents provide instant readability for cash inflows, outlays, and net assets. The visual tone balances youthful vitality with the structural rigour demanded by personal monetary management.

## Colors

The palette leverages high-energy chromatic clarity against a calm, clinical canvas to eliminate cognitive fatigue when parsing dense numerical transactions.

- **Primary (`#FF5252`):** Vibrant Modern Coral. Drives top-level actions, CTA highlights, active tab states, and the hero floating creation trigger. It also anchors core debit and expense indicators (`#E53935` / `#EF4444`).
- **Secondary (`#2563EB`):** Vibrant Trust Blue. Exclusively signals income, positive cashflow, incoming bank transfers, and primary AI assistant recommendations.
- **Tertiary (`#10B981`):** Emerald Green. Represents net positive balance, target savings completion, streak rewards, and safe budget thresholds.
- **Neutral Canvas (`#F8FAFC` to `#F1F5F9`):** An airy, low-saturation backdrop that grants distinct separation to elevated white modules without visual clutter.
- **Surface (`#FFFFFF`):** High-clarity white card backgrounds framed by whisper borders (`#E2E8F0`).
- **Typography Neutrals:** Primary text uses Deep Charcoal (`#0F172A`) for maximum contrast, Secondary text uses Slate Gray (`#64748B`) for context and timestamps, and Tertiary text uses Muted Slate (`#94A3B8`) for placeholders and auxiliary metadata.

## Typography

Plus Jakarta Sans is utilized uniformly across headlines, copy, and figures for its contemporary geometric geometry, open counters, and flawless native rendering of Vietnamese diacritics (dấu sắc, huyền, hỏi, ngã, nặng, and stacked vowel marks). 

Numeric readouts and currency displays must enforce tabular figures (`font-variant-numeric: tabular-nums`) to prevent shifting layouts across dynamic transaction balance animations. Currency symbols (₫) align directly with their values at an intentional optical baseline, scaled to 85% of adjacent numeral cap-heights to ensure balance figures remain legible and commanding.

## Layout & Spacing

The mobile layout system operates strictly on an 8pt base grid cadence (with 4pt sub-steps for micro-alignments like badges and icons). 

- **Canvas Safe Margins:** Base mobile edge margins remain 16px (`1rem`), accommodating standard compact hand-held reach. At tablet views (≥640px), safe gutters expand to 24px (`1.5rem`), transitioning into a centered 480px maximum content column to preserve ergonomic single-column thumb reach on handheld viewports.
- **Vertical Flow:** Stack gaps between autonomous cards adhere to `space-md` (16px), while grouped section headings maintain an 8px (`space-sm`) proximity to their corresponding content panels to preserve clear visual grouping.
- **Bottom Clearance:** Screens must incorporate an explicit dynamic bottom clearance padding of 96px to guarantee transaction feeds and summary metrics are never clipped behind the fixed dock and floating action trigger.

## Elevation & Depth

This system balances crisp flat minimalism with ambient depth through low-contrast outlines and warm, tinted shadows.

- **Level 0 (Base Canvas):** Background color `#F8FAFC`, flat without shadow.
- **Level 1 (Card & Module Layer):** Pure white `#FFFFFF` surface accompanied by a subtle physical border (`1px solid #E2E8F0`) and an ambient shadow: `0 2px 8px -2px rgba(15, 23, 42, 0.05), 0 1px 4px -1px rgba(15, 23, 42, 0.03)`. This grounds transaction list items, budget trackers, and charts.
- **Level 2 (Active Sheets & Navigation Bar):** Fixed floating surfaces such as the dock navigation utilize `0 8px 24px -4px rgba(15, 23, 42, 0.08)` coupled with an ultra-fine perimeter line (`#E2E8F0`).
- **Level 3 (Floating Action & AI Highlights):** The central creation button and interactive AI advisory cards carry tinted ambient glow shadows: `0 10px 20px -5px rgba(255, 82, 82, 0.35)` to command focus and communicate interaction priority.

## Shapes

The design embraces roundedness scale `2` (0.5rem base radius), pairing standard structural corners with organic pill modules for dynamic status indicators:

- **Cards & Containers:** `rounded-lg` (16px) creates a friendly, tactile enclosure that softens visual density across heavy financial tables.
- **Buttons & Interactive Fields:** Form fields and major CTA buttons employ 12px radii (`rounded-md` within scale 2), pairing well with typical finger tap targets.
- **Category Icons & Pill Badges:** Micro category badges, chips, filter tabs, and progress track fills employ full pill contours (`rounded-full` / 9999px) to communicate tap readiness and contextual status.
- **The Floating Action Trigger:** Absolute circular contour (`width: 56px`, `height: 56px`, `rounded-full`).

## Components

### Bottom Navigation Dock
A fixed 64px structural white container positioned above the device safe area. Features 4 primary text-and-icon tabs (`Giao dịch`, `Thống kê`, `Tài khoản`, `Hơn`) spaced evenly around an asymmetric center arch. The active item receives Primary Coral (`#FF5252`) fill and bold typography. In the center, a prominent 56px circular floating action button sits elevated at -20px offset, bathed in Primary Coral with a crisp white plus (`+`) icon and an ambient coral glow.

### Cards & Feed Tiles
- **Transaction Item:** Clean horizontal flex rows featuring a 44px rounded-2xl category icon background (tinted pastel variant of the category color), followed by title, timestamp, and payment method in column structure. Right-aligned amounts are rendered in tabular weights: blue with `+` for deposits, and coral with `-` for debits.
- **Account Summary Card:** A hero card at the top of the viewport featuring net balance, percentage fluctuation versus last month, and dual quick-action pill buttons (`Nạp tiền`, `Chuyển khoản`).
- **AI Financial Companion Card:** A surface highlighted with a faint gradient border (`#2563EB` to `#FF5252` at 15% opacity), displaying contextual insights (e.g., "Bạn đã tiêu 70% ngân sách ăn uống tuần này"), accompanied by quick action chips.

### Interactive Controls
- **Segmented Control:** A pill-shaped enclosed container in `#F1F5F9` with a sliding white pill segment underneath the selected tab (`Ngày`, `Tuần`, `Tháng`, `Năm`).
- **Category Chips:** Horizontal scrolling pills featuring a 6px status dot or 16px mini emoji/icon with 8px label text. Toggled states transition to solid `#0F172A` text on `#FFFFFF` with a primary coral border.
- **Input Fields:** 48px height with `#F8FAFC` background, 1px border in `#E2E8F0`, and crisp 14px typography. Upon focus, the outline shifts cleanly to `#FF5252` with zero layout shift. Currency entry fields emphasize giant center-aligned values with persistent trailing `₫`.
- **Progress Bars:** Low-profile 8px tracks filled with rounded caps. Green (`#10B981`) for normal spends, transitioning dynamically to Coral (`#EF4444`) when spending breaches 85% of total defined category allowance.
- **Checkboxes & Radios:** 20px boxes and discs with `#E2E8F0` resting borders, transitioning when selected to `#FF5252` with bold interior white checkmarks or inner concentric dots.