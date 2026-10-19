---
name: Srujan Yamali
description: Restrained personal portfolio with centered character sculptures.
colors:
  bg: "#f4f3f0"
  fg: "#121211"
  fg2: "#63615c"
  fg3: "#9c9a94"
  wash: "#e9e8e4"
  gold: "#fdb515"
  dark-bg: "#0e0e0d"
  dark-fg: "#f2f1ed"
  dark-fg2: "#a3a19b"
  dark-fg3: "#6b6964"
  dark-wash: "#1c1c1a"
  divider: "color-mix(in srgb, var(--fg) 15%, var(--bg))"
typography:
  identity:
    fontFamily: '"JetBrains Mono Variable", ui-monospace, "SF Mono", "SFMono-Regular", Menlo, Monaco, "Cascadia Mono", Consolas, "Liberation Mono", monospace'
    fontSize: "20px"
    fontWeight: 550
    lineHeight: 1.5
    letterSpacing: "-0.04em"
  introduction:
    fontFamily: '"JetBrains Mono Variable", ui-monospace, "SF Mono", "SFMono-Regular", Menlo, Monaco, "Cascadia Mono", Consolas, "Liberation Mono", monospace'
    fontSize: "clamp(16px, 1.7vw, 20px)"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "-0.035em"
  section:
    fontFamily: '"JetBrains Mono Variable", ui-monospace, "SF Mono", "SFMono-Regular", Menlo, Monaco, "Cascadia Mono", Consolas, "Liberation Mono", monospace'
    fontSize: "15px"
    fontWeight: 550
    lineHeight: 1.6
    letterSpacing: "-0.025em"
  home-body:
    fontFamily: '"JetBrains Mono Variable", ui-monospace, "SF Mono", "SFMono-Regular", Menlo, Monaco, "Cascadia Mono", Consolas, "Liberation Mono", monospace'
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.8
  home-detail:
    fontFamily: '"JetBrains Mono Variable", ui-monospace, "SF Mono", "SFMono-Regular", Menlo, Monaco, "Cascadia Mono", Consolas, "Liberation Mono", monospace'
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.8
  article-body:
    fontFamily: '"JetBrains Mono Variable", ui-monospace, "SF Mono", "SFMono-Regular", Menlo, Monaco, "Cascadia Mono", Consolas, "Liberation Mono", monospace'
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "20px"
  coast-art:
    fontFamily: '"JetBrains Mono Variable", ui-monospace, "SF Mono", "SFMono-Regular", Menlo, Monaco, "Cascadia Mono", Consolas, "Liberation Mono", monospace'
    fontSize: "clamp(6px, 1.8vw, 8.5px)"
    fontWeight: 400
    lineHeight: 1
rounded:
  coast-stage: "4px"
spacing:
  space-1: "8px"
  space-2: "16px"
  space-3: "24px"
  space-4: "40px"
  space-5: "64px"
  article-line: "20px"
components:
  home-link:
    textColor: "{colors.fg}"
    typography: "{typography.home-detail}"
  coast-control:
    backgroundColor: "transparent"
    textColor: "{colors.fg2}"
    typography: "{typography.home-detail}"
    padding: "4px 3px"
  coast-control-selected:
    textColor: "{colors.fg}"
  coast-motion:
    backgroundColor: "transparent"
    textColor: "{colors.fg2}"
    typography: "{typography.home-detail}"
    padding: "4px"
  theme-button:
    backgroundColor: "transparent"
    textColor: "{colors.fg2}"
    typography: "{typography.home-detail}"
    padding: "0"
  research-disclosure:
    textColor: "{colors.fg}"
    typography: "{typography.home-detail}"
---

# Design System: Srujan Yamali

## Overview

**Creative North Star: "Restrained personal portfolio"**

The home keeps the paper-and-ink palette and JetBrains Mono while using a centered composition, distinct type sizes, and normal headings and links. Its personal element is a centered, draggable character sculpture of Sather Tower or the Delaware lighthouse, with the Cal particle intro retained.

Scope matters: `src/home.css` applies to the `.portfolio` home only. `src/site.css` still supplies the older research articles' smaller type, Markdown markers, and article figures. Those routes have not received the home redesign.

**Key Characteristics:**
- Monospaced type, restrained neutral colors, and gold text selection.
- Centered home with open spacing and an unframed sculpture.
- Text controls, underlined states, and visible keyboard focus.

## Colors

### Primary
- **Gold** (`gold`): selection background only; selected text uses the light ink color.

### Neutral
- **Paper and ink** (`bg`, `fg`): page background and main text, with corresponding `dark-*` values in dark mode.
- **Secondary ink** (`fg2`): dates, captions, descriptions, sculpture characters, and inactive home controls.
- **Decorative ink** (`fg3`): shared legacy Markdown marks; not a home body-text color.
- **Wash** (`wash`): legacy article blockquotes.
- **Divider** (`divider`): home section and footer rules. Its CSS mix follows the active theme.

Theme is set before first paint: a saved Light/Dark choice wins; Auto follows the visitor's clock, light from 07:00 to 19:00. CSS falls back to the OS preference without a theme attribute.

## Typography

JetBrains Mono Variable is used throughout; the full fallback stack is recorded under `identity` above and shared by the source's `--font` variable.

Home hierarchy: identity 20px/1.5 at 550; introduction fluid 16–20px/1.65; section titles 15px/1.6 at 550; body 13px/1.8. Most supporting content and controls use 12px/1.8; research introductory copy uses 1.9. Experience names use weight 500, with secondary text at 400. Sculpture characters use a fluid 6–8.5px size and line-height 1.

Articles retain 12px/20px body and same-size bold headings, with generated Markdown prefixes. The shared header uses an 18px line-height. These legacy roles are not home heading defaults.

## Layout

Home: `main.home.portfolio-home` is a block centered at max-width 960px. Desktop body padding is 44px 32px 28px. The introduction starts after 64px, measures at most 780px, and its history at most 710px. The sculpture is centered at width `min(100%, 620px)` with a 396px stage and 24px top / 64px bottom margins.

The work grid uses `1.15fr 1fr`, an 80px column gap, 64px row gap, and 40px top padding above a divider. Experience rows pair an 8ch date column with content and an 18px gap. The footer starts after 88px.

At max-width 760px, home padding becomes 28px 24px, introduction spacing becomes 48px, the work grid becomes equal columns with a 36px gap, and experience entries stack. At max-width 560px, padding becomes 28px 20px 20px, the masthead stacks, introduction spacing becomes 32px, the sculpture stage is 310px, work sections stack with 40px gaps, experience returns to two columns, and the footer starts after 48px. Mobile coast controls reach 44px height; motion becomes icon-only with its accessible label retained.

Articles retain the shared 40px body padding (32px 20px below 520px), default 480px main measure, and `main.wide` at 48em. Their rhythm uses multiples of the 20px line.

## Elevation & Depth

No box shadows are present in the inspected styles. Home sections are separated by spacing and fine rules. The sculpture's depth comes from rotating character-rendered geometry, not a raised container. Article blockquotes use wash; article images retain a one-pixel ink border and white background, dimmed to brightness 0.9 in dark mode.

## Shapes

Home controls are borderless text. The coast stage has a 4px radius for its focus boundary; it is otherwise unframed. Dividers are 1px. Direction and playback marks are inline stroked SVGs. The research disclosure uses a 14px stroked SVG chevron that rotates 180 degrees when opened.

## Components

- **Links and contact navigation:** inherited ink, 1px underline offset 4px, with a 35% ink decoration that becomes full ink on hover over 150ms. Contact links omit their underline until hover and have 36px minimum height. Shared link focus is a 2px ink outline offset 2px.
- **Coast controls:** Berkeley / Delaware are 12px text with 40px minimum height and 4px 3px padding. Selected text uses main ink and an underline offset 7px; inactive text uses secondary ink. Focus uses a 1px ink outline offset 2px. Playback uses the same language with 4px padding and an inline SVG.
- **Character sculpture:** 76 columns by 44 rows, using the source character ramp ` .,:;ilrjunsyaYAMS@`. Drag rotates; left/right arrows rotate and pause. Autoplay renders ten frames per second, suspends when hidden or during the intro, and starts paused for reduced motion. The stage has a 1px secondary-ink focus outline offset 4px.
- **Research disclosure:** native `details` / `summary`, 1px dividers above and below, 44px minimum summary height. Open state reveals the fly arena centered at 252px maximum available width. Focus uses a 1px ink outline offset 2px.
- **Theme controls:** Auto / Light / Dark are plain footer text with 32px minimum height and a 16px gap. Active text is main ink and underlined; inactive text is secondary ink. Home removes the shared legacy brackets and uppercase treatment.
- **Cal intro:** assembly 2.2s, hold at least 0.9s, then a 2.6s settle onto visible page text. Skip fades over 450ms. Fresh visits/reloads play it; reduced motion normally bypasses it. Query parameters can force or suppress it. It has a page-visibility failsafe.

## Do's and Don'ts

### Do:
- **Do** use the existing paper/ink variables in both themes.
- **Do** apply the home type hierarchy and spacing only within the home scope.
- **Do** retain the sculpture's drag, keyboard, pause, and reduced-motion behavior.

### Don't:
- **Don't** reintroduce Markdown heading or link wrappers on the refined home.
- **Don't** describe the older research articles as redesigned.
- **Don't** replace the existing inline SVG marks with text glyph icons.
