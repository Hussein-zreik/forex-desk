# Design System: Linear / Modern — Forex Desk

> **Status:** Authoritative design DNA for this project, provided by the user. Follow verbatim.
> Saved as reference because exact values (hex, shadow stacks, easing curves) must not be paraphrased.
> This is the user's explicit, deliberate choice — it takes precedence over any tool's default recommendation.

---

## Design Integration Role & Approach (user-provided working brief)

Act as an expert frontend engineer, UI/UX designer, visual design specialist, and typography expert, integrating this design system into the codebase so it is visually consistent, maintainable, and idiomatic to the stack.

Before writing code, build a mental model of the system:
- Identify the tech stack (React, Vite, Tailwind, shadcn/ui, etc.).
- Understand existing design tokens (colors, spacing, typography, radii, shadows), global styles, utility patterns.
- Review component architecture (atoms/molecules/organisms, layout primitives) and naming conventions.
- Note constraints (legacy CSS, design library, performance/bundle size).

Clarify scope: redesign a specific component/page, refactor existing components to the new system, or build new features entirely in the new style.

When implementing, prioritize:
- Centralizing design tokens.
- Reusability and composability of components.
- Minimizing duplication and one-off styles.
- Long-term maintainability and clear naming.
- Match existing patterns (folder structure, naming, styling approach).
- Explain reasoning briefly.

Always: preserve/improve accessibility, maintain visual consistency, leave the codebase cleaner, ensure responsive layouts, and make deliberate creative choices (layout, motion, interaction, typography) that express the design system's personality instead of generic boilerplate.

---

# Design Style: Linear / Modern

## Design Philosophy

**Core Principles:** Precision, depth, and fluidity. Every surface exists in three-dimensional space, illuminated by soft ambient light sources that breathe and move. Communicates "premium developer tools"—fast, responsive, obsessively crafted like Linear, Vercel, or Raycast. Every shadow has three layers, every gradient transitions through multiple colors, every animation uses refined expo-out easing. Software that feels expensive without feeling ostentatious.

**Vibe:** Cinematic meets technical minimalism. A developer's code editor crossed with a Blade Runner interface—deep near-blacks (#050506, never pure black) punctuated by soft pools of indigo light. Sophisticated but never cold; warmth from accent glows (#5E6AD2 at varying opacities). Like looking through frosted glass into a high-end application running at night. Dark, but not oppressive. Technical, but not sterile. Precise, but not rigid.

**Differentiation — layered ambient lighting and interactive depth:**
1. **Multi-layer background system:** Four stacked gradients + noise texture + grid overlay.
2. **Animated gradient blobs:** Large (900-1400px), heavily blurred shapes float slowly, simulating cinematic lighting pools.
3. **Mouse-tracking spotlights:** Interactive surfaces respond to cursor with radial gradient glows (300px diameter, 15% opacity).
4. **Scroll-linked parallax:** Hero content fades, scales, translates based on scroll position.
5. **Multi-layer shadows:** Every elevated surface uses 3-4 shadow layers: border highlight + soft diffuse + ambient darkness + optional accent glow.
6. **Precision micro-interactions:** 200-300ms with expo-out easing. Movements tiny (4-8px max). Scale subtle (0.98-1.02). Nothing bounces or overshoots.

**The "Software Feel":** Feels like using a desktop app, not a website. Interactions instant and precise. Hover states immediate. Focus rings prominent. Everything responds to the cursor. Borrows from native macOS/Windows: subtle transparency, soft glows, refined typography, obsessive 1px detail.

---

## Design Token System (The DNA)

### Color Strategy: Deep Space with Ambient Light

Near-black bases with a single saturated indigo accent. Depth from layered translucency and soft light, not harsh shadows.

| Token | Value | Usage |
|:------|:------|:------|
| `background-deep` | `#020203` | Absolute darkest — footer, deepest layers |
| `background-base` | `#050506` | Primary page canvas |
| `background-elevated` | `#0a0a0c` | Elevated surfaces, mock interfaces |
| `surface` | `rgba(255,255,255,0.05)` | Card backgrounds, containers |
| `surface-hover` | `rgba(255,255,255,0.08)` | Hovered card state |
| `foreground` | `#EDEDEF` | Primary text — bright but not pure white |
| `foreground-muted` | `#8A8F98` | Body text, descriptions, metadata |
| `foreground-subtle` | `rgba(255,255,255,0.60)` | Tertiary text, placeholders |
| `accent` | `#5E6AD2` | Primary interactive color — buttons, links, glows |
| `accent-bright` | `#6872D9` | Hover state for accent |
| `accent-glow` | `rgba(94,106,210,0.3)` | Glow effects, ambient lighting |
| `border-default` | `rgba(255,255,255,0.06)` | Subtle hairline borders |
| `border-hover` | `rgba(255,255,255,0.10)` | Border on hover |
| `border-accent` | `rgba(94,106,210,0.30)` | Accent-tinted borders for emphasis |

### Background System: Layered Ambient Lighting

**Layer 1 — Base Gradient:**
```
bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)]
```

**Layer 2 — Noise Texture:** Subtle SVG noise at `opacity: 0.015`, prevents banding.

**Layer 3 — Animated Gradient Blobs:**
- Primary: Top-center, `blur-[150px]`, 900×1400px, accent at 25% opacity
- Secondary: Left, `blur-[120px]`, 600×800px, purple/pink mix at 15% opacity
- Tertiary: Right, `blur-[100px]`, 500×700px, indigo/blue mix at 12% opacity
- Bottom accent: Lower area, pulsing, accent at 10% opacity

**Blob Animation:**
```css
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(1deg); }
}
/* Duration: 8-10s, ease-in-out, infinite */
```

**Layer 4 — Grid Overlay:** Subtle 64px grid at `opacity: 0.02`.

---

### Typography System

**Font Stack:** `"Inter", "Geist Sans", system-ui, sans-serif`

| Level | Size | Weight | Tracking | Usage |
|:------|:-----|:-------|:---------|:------|
| Display | `text-7xl`→`text-8xl` | `font-semibold` | `tracking-[-0.03em]` | Hero headlines |
| H1 | `text-5xl`→`text-6xl` | `font-semibold` | `tracking-tight` | Section headers |
| H2 | `text-3xl`→`text-4xl` | `font-semibold` | `tracking-tight` | Subsection headers |
| H3 | `text-xl`→`text-2xl` | `font-semibold` | `tracking-tight` | Card titles |
| Body Large | `text-lg`→`text-xl` | `font-normal` | default | Lead paragraphs |
| Body | `text-sm`→`text-base` | `font-normal` | default | Standard content |
| Label | `text-xs` | `font-mono` | `tracking-widest` | Section tags, metadata |

**Gradient Text Treatment:**
```
bg-gradient-to-b from-white via-white/95 to-white/70 bg-clip-text text-transparent
```
Accent emphasis (animated shimmer, background-size: 200%):
```
bg-gradient-to-r from-[#5E6AD2] via-indigo-400 to-[#5E6AD2] bg-clip-text text-transparent
```

**Line Heights:** Headlines `leading-tight`/`leading-none`; body `leading-relaxed`.

---

### Radius & Border System

| Element | Radius | Border |
|:--------|:-------|:-------|
| Large containers | `rounded-2xl` (16px) | `border border-white/[0.06]` |
| Cards | `rounded-2xl` (16px) | `border border-white/[0.06]` |
| Buttons | `rounded-lg` (8px) | Inset shadow instead of border |
| Inputs | `rounded-lg` (8px) | `border border-white/10` |
| Badges/Pills | `rounded-full` | `border border-accent/30` |
| Icon containers | `rounded-xl` (12px) | `border border-white/10` |

**Border Gradients on Hover:**
```css
background: linear-gradient(to bottom, rgba(94,106,210,0.3), transparent);
mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
mask-composite: exclude;
padding: 1px;
```

---

### Shadow & Glow System

**Multi-Layer Shadow Formula:**
```
/* Card default */
shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_2px_20px_rgba(0,0,0,0.4),0_0_40px_rgba(0,0,0,0.2)]

/* Card hover */
shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_40px_rgba(0,0,0,0.5),0_0_80px_rgba(94,106,210,0.1)]
```

**Accent Glow for CTAs:**
```
shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)]
```

**Inner Highlight:**
```
shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]
```

---

## Component Styling Principles

### Buttons
- **Primary:** `bg-[#5E6AD2]`, white text, multi-layer accent glow shadow; hover `bg-[#6872D9]` + more glow; active `scale-[0.98]`; shine pseudo-element sweep on hover.
- **Secondary:** `bg-white/[0.05]`, `text-[#EDEDEF]`, inset shadow border; hover `bg-white/[0.08]` + subtle outer glow.
- **Ghost:** transparent, muted text; hover `bg-white/[0.05]`, text brightens.

### Cards & Containers
- **Base Card:** `bg-gradient-to-b from-white/[0.08] to-white/[0.02]`, 1px @ 6% white border, `rounded-2xl`, 1px top-edge inner glow line, optional mouse-tracking spotlight.
- **Spotlight:** radial gradient 300px diameter, accent @ 15% opacity, follows cursor, opacity transitions on hover.
- **Variants:** `default` (glass), `glass` (more translucent + backdrop blur), `gradient` (accent overlay).

### Form Inputs
- Background `bg-[#0F0F12]`, border `border-white/10`, focus `border-[#5E6AD2]` + accent glow ring, text `text-gray-100`, placeholder `text-gray-500`.

### Interactive States
- **Hover:** movement minimal (`y: -4px`→`-8px` max), `200-300ms`, easing `[0.16, 1, 0.3, 1]` (expo out); border brightens, glow increases, subtle scale.
- **Focus:** `ring-2 ring-[#5E6AD2]/50 ring-offset-2 ring-offset-[#050506]`.
- **Active:** `scale-[0.98]`, reduced shadow depth.
- **Mobile Menu:** toggle < 768px; animated dropdown (`opacity` + `y`, 0.2s); backdrop `bg-[#050506]/95` + `backdrop-blur-xl`; vertical links; full-width CTA; `Menu`↔`X` icon transition.

---

## Layout Principles

### Spacing Scale (base 4px, Tailwind default)
| Context | Spacing |
|:--------|:--------|
| Section padding | `py-24`→`py-32` |
| Container max-width | `container` + responsive padding |
| Card padding | `p-6`→`p-8` |
| Element gaps | `gap-4`→`gap-8` |
| Between sections | `py-32` (128px) |

### Grid Philosophy — Asymmetric Bento
- 6-column base grid on desktop; mix of `col-span-2/3/4`; variable row heights `auto-rows-[180px]` baseline; one "hero" card spanning 4 cols × 2 rows. NOT uniform.

### Responsive Breakpoints
- Mobile `<768px`: single column, stacked, reduced padding.
- Tablet `md:768px`: 2-3 columns.
- Desktop `lg:1024px+`: full asymmetric grids.
- Section padding `py-16`→`py-24`→`py-32`; hero type `text-4xl`→`text-5xl`→`text-7xl/8xl`; body `text-base`→`text-lg`→`text-xl`.

### Section Flow
- Separators `border-t border-white/[0.06]`; gradient line accents `bg-gradient-to-r from-transparent via-white/10 to-transparent`; occasional overlapping sections via negative margins.

---

## The "Bold Factor" (Signature Elements — MUST be present)
1. Animated ambient blobs (cinematic lighting pools).
2. Mouse-tracking spotlights (the "magical" feel).
3. Gradient typography (vertical white→transparent + animated accent gradients).
4. Multi-layer shadows (border highlight + diffuse + optional accent glow).
5. Parallax/scroll effects (hero fade+scale, staggered reveals).
6. Precision micro-interactions (200-300ms, expo-out, 4-8px movements).

## Anti-Patterns (Avoid)
1. Flat backgrounds — always layer gradients, noise, ambient light.
2. Pure black `#000000` — use `#050506`/`#020203`.
3. Pure white text — use `#EDEDEF`.
4. Large hover movements — keep transforms < 8px.
5. Uniform grids — bento needs size variety.
6. Harsh borders — keep 6-10% white opacity.
7. Accent overuse — accent for highlights/interaction only; UI mostly monochromatic.
8. Bouncy animations — expo-out, not spring; swift and decisive.
9. Missing glow on accent buttons — soft light emission is part of the language.

## Animation & Motion
- **Timing:** quick `200ms`, standard `300ms`, entrance `600ms`, blob float `8000-10000ms`.
- **Easing:** primary `[0.16, 1, 0.3, 1]` (expo-out); hover `ease-out`.
- **Entrance:** fade up (`opacity 0→1`, `y 24px→0`); scale in (`opacity 0→1`, `scale 0.95→1`); stagger children `0.08s`.
- **Scroll-triggered:** viewport threshold `15-20%`, once: true.
- **Parallax (hero):** opacity `1→0` over first 50% scroll; scale `1→0.95`; y `0→100px`.

## Accessibility
- **Contrast:** primary `#EDEDEF` on `#050506` ~15:1 ✓; muted `#8A8F98` ~6:1 ✓; accent interactive ≥4.5:1.
- **Focus:** always-visible rings in accent; `ring-offset` matches background.
- **Motion:** respect `prefers-reduced-motion`; fallbacks for parallax/floating; essential interactions work without animation.
- **Color independence:** don't rely on accent alone for meaning — reinforce with icons, labels, position.
