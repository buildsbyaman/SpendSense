# SpendSense Design System

A technical reference for the visual language, tokens, and component patterns used throughout the app.

## Overview

SpendSense uses a **CSS custom properties + NativeWind (Tailwind)** architecture. Every design token is defined in `global.css` as a CSS variable, mapped to Tailwind utilities in `tailwind.config.js`, and consumed as standard class names in components. The system supports light and dark modes with a single source of truth.

---

## Color System

All colors are defined as CSS custom properties in `global.css` under `:root` (light) and `.dark:root` (dark), then bridged to Tailwind via `tailwind.config.js`.

### Semantic Tokens

| Token | Light | Dark | Usage |
| --- | --- | --- | --- |
| `--background` | `#f8f9fa` | `#000000` | Page background |
| `--foreground` | `#000000` | `#f3f4f6` | Primary text |
| `--surface` | `#ffffff` | `#0a0a0a` | Card/container fill |
| `--card` | `#ffffff` | `#0a0a0a` | Card fill (alias of surface) |
| `--primary` | `#1c1c1e` | `#e4e4e7` | Primary buttons, active states |
| `--secondary` | `#e8e8e8` | `#2c2c2e` | Secondary buttons, chips |
| `--muted` | `#9ca3af` | `#8e8e93` | Secondary text, placeholders |
| `--accent` | `#f6c98a` | `#f6c98a` | Ring highlights, focus states |
| `--destructive` | `#ef4444` | `#c53030` | Delete, danger actions |
| `--border` | `#f3f4f6` | `#18181b` | Card outlines |
| `--divider` | `#efefef` | `#242428` | Thin separators within cards |
| `--input` | `#f6f6f6` | `#1a1a1e` | Input field backgrounds |
| `--ring` | `#f6c98a` | `#f6c98a` | Focus ring color |
| `--placeholder` | `#9ca3af` | `#8e8e93` | Placeholder text |

### Semantic Status Colors

| Token | Light | Dark | Tailwind |
| --- | --- | --- | --- |
| `--success` | `#22c55e` | `#22c55e` | `text-success` |
| `--danger` | `#ef4444` | `#ef4444` | `text-danger` |
| `--warning` | `#f59e0b` | `#f59e0b` | `text-warning` |
| `--income` | `#16a34a` | `#4ade80` | `text-income` |
| `--expense` | `#f87171` | `#f87171` | `text-expense` |

### Wallet Type Colors

| Token | Value | Tailwind |
| --- | --- | --- |
| `--wallet-bank` | `#3b82f6` | `text-wallet-bank` / `bg-wallet-bank` |
| `--wallet-card` | `#8b5cf6` | `text-wallet-card` / `bg-wallet-card` |
| `--wallet-digital` | `#10b981` | `text-wallet-digital` / `bg-wallet-digital` |
| `--wallet-fallback` | `#64748b` | `text-wallet-fallback` / `bg-wallet-fallback` |

### Gray Scale

A custom 10-step gray palette (`gray-50` through `gray-900`) is fully redefined for dark mode. Available as `bg-gray-100`, `text-gray-500`, etc.

---

## Typography

### Font

- **Family:** `Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`
- **Defined in:** `global.css` (`--font-family`) and `tailwind.config.js` (`fontFamily.sans`)

### Text Component Variants

All text is rendered through `components/ui/text.tsx` using `class-variance-authority` (CVA):

| Variant | Classes | Usage |
| --- | --- | --- |
| `h1` | `text-center text-4xl font-extrabold tracking-tight` | Hero numbers, onboarding |
| `h2` | `text-3xl font-semibold tracking-tight` | Section headers with divider |
| `h3` | `text-2xl font-semibold tracking-tight` | Card titles, dialog titles |
| `h4` | `text-xl font-semibold tracking-tight` | Sub-section titles |
| `p` | `text-base leading-7` | Body text |
| `lead` | `text-xl text-muted-foreground` | Subtitle descriptions |
| `large` | `text-lg font-semibold` | Emphasized labels |
| `small` | `text-sm font-medium` | Compact labels |
| `muted` | `text-sm text-muted-foreground` | Secondary/meta text |
| `code` | `bg-muted rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold` | Inline code |

### Hierarchy Pattern

Font **weight** is the primary hierarchy tool, not size:

- **Extrabold** -- Hero/balance amounts (`text-3xl font-bold`)
- **Semibold** -- Titles, section headers, button labels
- **Medium** -- Body text, list item names, chip labels
- **Regular** -- Muted/secondary text, dates, descriptions

Headings always use `tracking-tight` for tighter kerning.

---

## Border Radius

Defined in `global.css` and mapped to Tailwind utilities:

| Token | Value | Tailwind Class | Usage |
| --- | --- | --- | --- |
| `--radius-xs` | 4px | `rounded-xs` | Small indicators |
| `--radius-sm` | 6px | `rounded-sm` | Delete buttons, small chips |
| `--radius-md` | 8px | `rounded-md` | Buttons, inputs |
| `--radius-lg` | 10px | `rounded-lg` | Medium containers |
| `--radius-xl` | 12px | `rounded-xl` | Cards, list containers |
| `--radius-2xl` | 16px | `rounded-2xl` | Dialogs, modals |
| `--radius-3xl` | 20px | `rounded-3xl` | Large cards |
| `--radius-pill` | 999px | `rounded-full` | Circles, avatars, pills |

### Pattern

- **Buttons/chips:** `rounded-md` (8px)
- **Cards:** `rounded-xl` (12px) or `rounded-2xl` (16px)
- **Dialogs:** `rounded-2xl` (16px)
- **Circles (avatars, icon containers):** `rounded-full`
- **Tab bar capsule:** `borderRadius: 32` (inline style)

---

## Shadows

All shadows are intentionally soft and diffused. No harsh drop shadows.

| Token | Value | Tailwind | Usage |
| --- | --- | --- | --- |
| `--shadow-xs` | `0 2px 6px rgba(0,0,0,0.03)` | `shadow-xs` | Cards, subtle lift |
| `--shadow-sm` | `0 4px 12px rgba(0,0,0,0.04)` | `shadow-sm` | Buttons, chips |
| `--shadow-md` | `0 8px 24px rgba(0,0,0,0.05)` | `shadow-md` | Elevated elements |
| `--shadow-lg` | `0 14px 34px rgba(0,0,0,0.07)` | `shadow-lg` | Tab bar, dialogs |

Dark mode shadows use higher opacity (`0.4` to `0.7`) for visibility against dark backgrounds.

### Component-Level Shadows

- **Tab bar capsule:** `shadowRadius: 20`, `shadowOpacity: 0.12` (inline style)
- **FAB button:** `shadowRadius: 8`, `shadowOpacity: 0.15`
- **Confirm dialog:** `shadow-2xl` (Tailwind)
- **Buttons:** `shadow-sm shadow-black/5` (5% black opacity)

---

## Spacing

Generous spacing is a core design principle:

| Context | Pattern | Value |
| --- | --- | --- |
| Page horizontal padding | `px-5` | 20px |
| Card internal padding | `px-6` | 24px |
| List row padding | `px-5 py-5` | 20px all sides |
| Section bottom margin | `mb-4` to `mb-5` | 16-20px |
| Gap between related items | `gap-3` to `gap-4` | 12-16px |
| Gap between chips | `gap-2.5` | 10px |

---

## Glassmorphism (Tab Bar)

The floating tab bar uses `expo-blur` for a glass capsule effect:

### Capsule Properties

| Property | Light | Dark |
| --- | --- | --- |
| Background | `rgba(255,255,255,0.9)` | `rgba(28,28,30,0.82)` |
| Border | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.12)` |
| Blur intensity (iOS) | 45 | 45 |
| Blur intensity (Android) | 35 | 35 |
| Tint | `light` | `dark` |

### Layout

- Position: `absolute`, floating above the home indicator
- Dimensions: `height: 64`, `borderRadius: 32`, `borderWidth: 1`
- Horizontal inset: `left: 20`, `right: 20` (does not touch screen edges)
- Shadow: `shadowRadius: 20`, `shadowOpacity: 0.12`

### FAB (Center Add Button)

- Perfect circle: `width: 46`, `height: 46`, `borderRadius: 23`
- Light: `bg #1c1c1e`, icon `#ffffff`
- Dark: `bg #ffffff`, icon `#000000`
- Shadow: `shadowRadius: 8`, `shadowOpacity: 0.15`

---

## Icon Treatment

Icons come from `lucide-react-native` (v1.21) and are wrapped through the `Icon` component which uses NativeWind `cssInterop` for class-based styling.

### Icon-in-Circle Pattern

Every list icon is wrapped in a circular container with a tinted background:

```
Container: h-12 w-12 items-center justify-center rounded-full
Background: ${categoryColor}15   (category color at ~8% opacity)
Icon: size={22}, color={categoryColor}
```

Sizes vary by context:

| Context | Container Size | Icon Size |
| --- | --- | --- |
| Transaction list | `h-12 w-12` | 22 |
| Home screen recent | `h-10 w-10` | 18 |
| Header action buttons | `h-11 w-11` | 18 |
| Quick action icons | `h-8 w-8` | 14 |

### Header Action Buttons

Circular buttons with border and shadow:
```
h-11 w-11 items-center justify-center rounded-full border border-border bg-surface shadow-xs
```

---

## Component Patterns

### Cards

- Background: `bg-surface` (white in light, near-black in dark)
- Border: `border border-border`
- Radius: `rounded-xl` (12px)
- Shadow: `shadow-xs`
- Internal dividers: `h-[1px] bg-divider` (not CSS borders)

### Buttons (CVA Variants)

| Variant | Background | Shadow | Text |
| --- | --- | --- | --- |
| `default` | `bg-primary` | `shadow-sm shadow-black/5` | `text-foreground text-sm font-medium` |
| `destructive` | `bg-destructive` | `shadow-sm shadow-black/5` | `text-white` |
| `outline` | `bg-background` | `border border-border shadow-sm shadow-black/5` | `text-foreground` |
| `secondary` | `bg-secondary` | `shadow-sm shadow-black/5` | `text-foreground` |
| `ghost` | transparent | none | `text-foreground` |

All non-ghost buttons use `active:` pseudo-class for touch feedback (opacity or background shift).

### Chips / Selectors

- Container: `flex-row flex-wrap gap-2.5`
- Chip: `flex-row items-center gap-2 rounded-xl border px-4 py-2.5`
- Active: `border-primary bg-primary/10`
- Inactive: `border-border bg-surface`
- Text: `text-sm font-semibold`

### Dialogs / Modals

- Backdrop: `rgba(0,0,0,0.5)` with scale animation
- Card: `rounded-2xl border border-border bg-surface p-6 shadow-2xl`
- Icon container: `w-16 h-16 rounded-full` with status-colored background
- Buttons: `flex-row gap-3`, each `flex-1 items-center justify-center rounded-[6px] py-3.5`

### Empty States

- Double-circle icon: outer `h-24 w-24 rounded-full border bg-secondary/30`, inner `h-16 w-16 rounded-full border bg-surface shadow-xs`
- Icon: `size={28}`, `opacity-70`
- CTA: `rounded-[6px] bg-primary px-6 py-3.5`

---

## Dark Mode

### Implementation

- `tailwind.config.js`: `darkMode: 'class'`
- Runtime toggle via NativeWind's `useColorScheme()`
- Persisted to AsyncStorage under key `spendsense:colorScheme`
- Default: follows system setting for new installations

### Token Differences

All CSS custom properties are fully redefined in `.dark:root`. Key shifts:

| Aspect | Light | Dark |
| --- | --- | --- |
| Background | `#f8f9fa` (off-white) | `#000000` (true black) |
| Surface | `#ffffff` | `#0a0a0a` |
| Primary | `#1c1c1e` | `#e4e4e7` |
| Income | `#16a34a` | `#4ade80` (brighter) |
| Gray-100 | `#f6f6f6` | `#1c1c1f` |

### Inline Overrides

Some components use inline styles for dark mode where Tailwind classes are insufficient:

- Tab bar glass colors (rgba values)
- Avatar background palettes (pastel in light, jewel tones in dark)
- Gradient card colors

---

## Animations

All animations use `react-native-reanimated`:

| Pattern | Implementation |
| --- | ---|
| Tab transitions | `AnimatedTabSlot` with slide/fade |
| Modal presentation | `SlideInDown` / `SlideOutDown` |
| Expand/collapse | `useExpandAnimation` hook (height + opacity) |
| Dialog backdrop | `useModalAnimation` (scale type) |
| Chip selection | NativeWind `tailwindcss-animate` plugin |

---

## File References

| File | Purpose |
| --- | --- |
| `global.css` | All CSS custom properties (colors, radius, shadows, typography) |
| `tailwind.config.js` | Maps CSS variables to Tailwind utility classes |
| `components.json` | shadcn/ui config (new-york style, CSS variables enabled) |
| `lib/theme.ts` | Runtime theme objects for expo-router navigation |
| `lib/theme-persistence.ts` | AsyncStorage-backed theme preference |
| `lib/chart-theme.ts` | Chart color scheme derived from tokens |
| `components/ui/text.tsx` | CVA text variants |
| `components/ui/button.tsx` | CVA button variants |
| `components/layout/tab-bar.tsx` | Glassmorphic tab bar with BlurView |
