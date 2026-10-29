/**
 * Hermes Skin Rounded — Modern rounded skin for Hermes Desktop.
 *
 * Features:
 *   1. Seamless app-bar: top bar colors match the sidebar for an elegant unified frame.
 *   2. Rounded junction: smooth inward curvature where the workspace meets sidebar and app-bar.
 *   3. Solid colors: non-transparent design optimized for Linux (Omarchy/Hyprland), macOS, and Windows.
 *   4. 12 editor palettes registered via the THEMES_AREA contribution.
 *   5. Centered reading column, rounded composer, and Claude-inspired ergonomics.
 *   6. Chat persona: every reply carries the profile avatar + speaker label and answers in its own bubble.
 *
 * Repo: https://github.com/danyakmallun9999/hermes-skin-rounded
 */

import * as sdk from '@hermes/plugin-sdk'
import { jsx } from 'react/jsx-runtime'
import { useEffect } from 'react'

const { THEMES_AREA, TITLEBAR_AREAS, PALETTE_AREA, host, requestTheme, useTheme, useValue } = sdk

/** Same rule as the desktop's own profile keys: blank means `default`. */
const profileKey = name => (name ?? '').trim() || 'default'

const PLUGIN_ID = 'hermes-skin-rounded'
const THEME_NAME = 'rounded'
const STYLE_ID = 'hermes-skin-rounded-style'

/** Optional name for the empty-state greeting: '' → "Good evening", 'Ada' → "Good evening, Ada". */
const GREETING_NAME = ''

// ── Palette ─────────────────────────────────────────────────────────────────
// Claude's warm neutrals + terracotta. Light = cream, dark = warm charcoal.

const SANS =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", "Segoe UI", system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"'
const MONO = '"SF Mono", Menlo, Monaco, "JetBrains Mono", "Fira Code", monospace'

const light = {
  background: '#FAF9F5',
  foreground: '#141413',
  card: '#FFFFFF',
  cardForeground: '#141413',
  muted: '#F0EEE6',
  mutedForeground: '#6E6C64',
  popover: '#FFFFFF',
  popoverForeground: '#141413',
  primary: '#C96442',
  primaryForeground: '#FFFFFF',
  secondary: '#F0EEE6',
  secondaryForeground: '#3D3929',
  accent: '#F0EEE6',
  accentForeground: '#141413',
  border: '#E5E3DA',
  input: '#E5E3DA',
  ring: '#C96442',
  midground: '#C96442',
  composerRing: '#D6D3C8',
  destructive: '#B3261E',
  destructiveForeground: '#FFFFFF',
  sidebarBackground: '#F1EFE8',
  sidebarBorder: '#E5E3DA',
  userBubble: '#F0EEE6',
  userBubbleBorder: 'transparent'
}

// Dark = the Claude desktop app's Code tab: neutral near-black, a one-step
// lighter sidebar divider, warm off-white text.
const dark = {
  background: '#151515',
  foreground: '#F0EFEC',
  card: '#1F1F1F',
  cardForeground: '#F0EFEC',
  muted: '#2A2A2A',
  mutedForeground: '#898782',
  popover: '#1F1F1F',
  popoverForeground: '#F0EFEC',
  primary: '#D97757',
  primaryForeground: '#FFFFFF',
  secondary: '#2A2A2A',
  secondaryForeground: '#E5E4DF',
  accent: '#2A2A2A',
  accentForeground: '#F0EFEC',
  border: '#292929',
  input: '#292929',
  ring: '#D97757',
  midground: '#D97757',
  composerRing: '#333333',
  destructive: '#E5484D',
  destructiveForeground: '#FFFFFF',
  sidebarBackground: '#111111',
  sidebarBorder: '#292929',
  userBubble: '#262626',
  userBubbleBorder: 'transparent'
}

const theme = {
  name: THEME_NAME,
  label: 'Rounded',
  description: 'Claude desktop — cream light, near-black dark, terracotta accent',
  colors: light,
  darkColors: dark,
  typography: { fontSans: SANS, fontMono: MONO },
  terminal: {
    foreground: '#3D3929',
    black: '#141413',
    red: '#B3261E',
    green: '#2F7D4F',
    yellow: '#9A6B1F',
    blue: '#3B6FA0',
    magenta: '#8C5A9E',
    cyan: '#2F7F8A',
    white: '#87867F',
    brightBlack: '#6E6C64',
    brightRed: '#C96442',
    brightGreen: '#3E9A63',
    brightYellow: '#B8862B',
    brightBlue: '#4E86BD',
    brightMagenta: '#A47AB8',
    brightCyan: '#3E98A6',
    brightWhite: '#3D3929'
  },
  darkTerminal: {
    foreground: '#E5E4DF',
    black: '#393937',
    red: '#E5484D',
    green: '#6CBF83',
    yellow: '#D9A94A',
    blue: '#7FA9D6',
    magenta: '#BC9AD1',
    cyan: '#6FC0CC',
    white: '#C2C0B6',
    brightBlack: '#6E6C64',
    brightRed: '#D97757',
    brightGreen: '#86D39C',
    brightYellow: '#E6BE63',
    brightBlue: '#9BBFE6',
    brightMagenta: '#CDB0E0',
    brightCyan: '#8AD3DD',
    brightWhite: '#F1F0EA'
  }
}


// ── More palettes, same Claude layout ───────────────────────────────────────
// Each entry is [slug, label, description, light, dark, typography?]. Palettes
// only name the handful of colors that matter; `expand` fills the rest.

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
}
const inkOn = hex => (luminance(hex) > 0.42 ? '#141414' : '#FFFFFF')

function expand(p) {
  return {
    background: p.bg,
    foreground: p.fg,
    card: p.card,
    cardForeground: p.fg,
    muted: p.bubble,
    mutedForeground: p.muted,
    popover: p.card,
    popoverForeground: p.fg,
    primary: p.primary,
    primaryForeground: inkOn(p.primary),
    secondary: p.bubble,
    secondaryForeground: p.fg,
    accent: p.bubble,
    accentForeground: p.fg,
    border: p.border,
    input: p.border,
    ring: p.primary,
    midground: p.primary,
    composerRing: p.border,
    destructive: p.danger || '#E5484D',
    destructiveForeground: '#FFFFFF',
    sidebarBackground: p.sidebar,
    sidebarBorder: p.border,
    userBubble: p.bubble,
    userBubbleBorder: 'transparent'
  }
}

// Dark-only editor themes use one palette in both modes.
const darkOnly = p => [p, p]

// One Dark Pro and One Candy Dark share Atom's One Dark chrome.
const ONE_DARK = { bg: '#282C34', sidebar: '#21252B', card: '#2C313A', bubble: '#3E4452', fg: '#ABB2BF', muted: '#7F848E', border: '#3E4452' }

// Order here is the order in Settings ▸ Appearance.
const PALETTES = [
  ['mac', 'MacOS', 'System greys, system blue',
    { bg: '#FFFFFF', sidebar: '#F5F5F7', card: '#FFFFFF', bubble: '#F0F0F3', fg: '#1D1D1F', muted: '#6E6E73', border: '#E3E3E8', primary: '#007AFF' },
    { bg: '#1E1E1E', sidebar: '#262626', card: '#2C2C2E', bubble: '#2F2F31', fg: '#F5F5F7', muted: '#98989D', border: '#3A3A3C', primary: '#0A84FF' }],
  ['nord', 'Nord', 'Arctic blues — Snow Storm / Polar Night',
    { bg: '#ECEFF4', sidebar: '#E5E9F0', card: '#FFFFFF', bubble: '#E5E9F0', fg: '#2E3440', muted: '#4C566A', border: '#D8DEE9', primary: '#5E81AC', danger: '#BF616A' },
    { bg: '#2E3440', sidebar: '#272C36', card: '#3B4252', bubble: '#3B4252', fg: '#ECEFF4', muted: '#9AA3B5', border: '#434C5E', primary: '#88C0D0', danger: '#BF616A' }],
  ['gruvbox', 'Gruvbox', 'Retro groove — warm browns, orange accent',
    { bg: '#FBF1C7', sidebar: '#F2E5BC', card: '#F9F5D7', bubble: '#EBDBB2', fg: '#3C3836', muted: '#7C6F64', border: '#D5C4A1', primary: '#AF3A03', danger: '#9D0006' },
    { bg: '#282828', sidebar: '#1D2021', card: '#32302F', bubble: '#3C3836', fg: '#EBDBB2', muted: '#A89984', border: '#3C3836', primary: '#FE8019', danger: '#FB4934' }],
  ['monokai-pro', 'Monokai Pro', 'Monokai Pro filter — dusk grey, sunset accents',
    ...darkOnly({ bg: '#2D2A2E', sidebar: '#221F22', card: '#363437', bubble: '#403E41', fg: '#FCFCFA', muted: '#939293', border: '#403E41', primary: '#FFD866', danger: '#FF6188' })],
  ['one-monokai', 'One Monokai', 'Monokai colors on the One Dark base',
    ...darkOnly({ bg: '#282C34', sidebar: '#21252B', card: '#2F333D', bubble: '#383E4A', fg: '#ABB2BF', muted: '#676F7D', border: '#3E4451', primary: '#98C379', danger: '#E06C75' })],
  ['dracula', 'Dracula', 'Alucard / Dracula — purple and pink',
    { bg: '#FFFBEB', sidebar: '#F4EFD8', card: '#FFFFFF', bubble: '#EFEBD6', fg: '#1F1F1F', muted: '#6C664B', border: '#DEDAC5', primary: '#644AC9', danger: '#CB3A2A' },
    { bg: '#282A36', sidebar: '#21222C', card: '#343746', bubble: '#44475A', fg: '#F8F8F2', muted: '#9AA0C0', border: '#44475A', primary: '#BD93F9', danger: '#FF5555' }],
  ['one-dark-pro', 'One Dark Pro', "Atom's One Dark, Pro edition",
    ...darkOnly({ ...ONE_DARK, primary: '#61AFEF', danger: '#E06C75' })],
  ['one-candy-dark', 'One Candy Dark', 'One Dark chrome, candy-pastel accent',
    ...darkOnly({ ...ONE_DARK, primary: '#FCADE7', danger: '#E06C75' })],
  ['cobalt2', 'Cobalt2', "Wes Bos's deep cobalt, yellow accent",
    ...darkOnly({ bg: '#193549', sidebar: '#15232D', card: '#1F4662', bubble: '#1F4662', fg: '#FFFFFF', muted: '#AAAAAA', border: '#1F4662', primary: '#FFC600', danger: '#F44542' })],
  ['github', 'GitHub', 'GitHub Light / Dark Default',
    { bg: '#FFFFFF', sidebar: '#F6F8FA', card: '#FFFFFF', bubble: '#F6F8FA', fg: '#1F2328', muted: '#656D76', border: '#D0D7DE', primary: '#0969DA', danger: '#CF222E' },
    { bg: '#0D1117', sidebar: '#010409', card: '#161B22', bubble: '#21262D', fg: '#E6EDF3', muted: '#8B949E', border: '#30363D', primary: '#2F81F7', danger: '#F85149' }],
  ['ayu', 'Ayu', 'Ayu Light / Dark — warm accent on cool greys',
    { bg: '#FCFCFC', sidebar: '#F8F9FA', card: '#FFFFFF', bubble: '#F3F4F5', fg: '#5C6166', muted: '#828E9F', border: '#E9EBED', primary: '#F29718', danger: '#E65050' },
    { bg: '#10141C', sidebar: '#0D1017', card: '#141821', bubble: '#1B1F29', fg: '#BFBDB6', muted: '#707A8C', border: '#1B1F29', primary: '#E6B450', danger: '#D95757' }]
]

const EXTRA_THEMES = PALETTES.map(([slug, label, description, lightP, darkP, typography]) => ({
  name: `${THEME_NAME}-${slug}`,
  label: `Rounded - ${label}`,
  description: `${description} (Claude layout)`,
  colors: expand(lightP),
  darkColors: expand(darkP),
  typography: typography || { fontSans: SANS, fontMono: MONO }
}))

// ── Layout stylesheet ───────────────────────────────────────────────────────
// Everything is scoped to the active theme so it switches off with it.

const S = 'html[data-hermes-theme^="rounded"]'

const CSS = `
/* ── tokens ─────────────────────────────────────────────────────────────── */
${S} {
  /* Paint the seeds as-is (Hermes normally blends them toward a neutral). */
  --theme-mix-chrome: 100% !important;
  --theme-mix-sidebar: 100% !important;
  --theme-mix-card: 100% !important;
  --theme-mix-elevated: 100% !important;
  --theme-mix-bubble: 100% !important;
  /* Neutral (untinted) hovers, fills and hairlines — Claude keeps the
     terracotta for actions only. */
  --theme-fill-primary-accent-mix: 0%;
  --theme-fill-secondary-accent-mix: 0%;
  --theme-fill-tertiary-accent-mix: 0%;
  --theme-fill-quaternary-accent-mix: 0%;
  --theme-fill-quinary-accent-mix: 0%;
  --theme-stroke-primary-accent-mix: 0%;
  --theme-stroke-secondary-accent-mix: 0%;
  --theme-stroke-tertiary-accent-mix: 0%;
  --theme-stroke-quaternary-accent-mix: 0%;
  --theme-row-hover-accent-mix: 0%;
  --theme-row-active-accent-mix: 0%;
  --theme-control-hover-accent-mix: 0%;
  --theme-control-active-accent-mix: 0%;
  /* Opaque, flat surfaces. */
  --translucency-glass-keep: 100% !important;
  --noise-opacity-mul: 0 !important;
  /* Claude is round. */
  --radius-scalar: 1;
  --dt-input-border: 14%;
  --dt-input-inset: none;
  /* Reading column + type. */
  --composer-width: 48rem;
  --conversation-text-font-size: 0.9375rem;
  --conversation-line-height: 1.55rem;
  --dt-line-height: 1.65;
  --conversation-caption-font-size: 0.8125rem;
  --conversation-tool-font-size: 0.75rem;
  --conversation-caption-line-height: 1.125rem;
  --paragraph-gap: 0.95rem;
  --conversation-turn-gap: 1.5rem;
  --turn-block-gap: 1rem;
  --message-text-indent: 0;
  --sticky-human-top: 0.5rem;
  /* Composer proportions. */
  --composer-surface-pad-x: 0.875rem;
  --composer-surface-pad-y: 0.75rem;
  --composer-input-min-height: 2.25rem;
  --composer-input-max-height: 16rem;
  --composer-control-size: 1.75rem;
  --composer-control-primary-size: 2rem;
  --composer-control-gap: 0.375rem;
  --composer-row-gap: 0.5rem;
  --composer-shell-pad-block-end: 1.25rem;
  --claude-font-serif: "Charter", "Iowan Old Style", "Source Serif 4", "Georgia", "Times New Roman", serif;
}
${S} .dark, ${S}.dark {
  --ui-inline-code-background: color-mix(in srgb, #ffffff 8%, transparent);
  --ui-inline-code-foreground: color-mix(in srgb, #ffffff 90%, transparent);
}

/* ── chrome: no status bar, no texture, quiet titlebar ───────────────────── */
${S} footer[data-slot="statusbar"] { border-top: 1px solid var(--ui-stroke-tertiary); }
${S} [data-chat-surface] > div[aria-hidden="true"]:has(> img) { display: none !important; }
${S} [data-titlebar-cluster] button { opacity: 0.55; }
${S} [data-titlebar-cluster] button:hover { opacity: 1; }

/* Keep the titlebar compact; actions remain available via native commands. */
${S} [data-titlebar-cluster] button:has(.codicon-layout),
${S} [data-titlebar-cluster] button:has(.codicon-comment-discussion),
${S} [data-titlebar-cluster] button:has(.codicon-arrow-swap) {
  display: none !important;
}

/* Main pane tab strip → a plain conversation title, Claude style. */
${S} [data-tree-group]:not(:has([data-slot="sidebar-content"])) [data-zone-tabstrip] { background: transparent !important; }
${S} [data-tree-group]:not(:has([data-slot="sidebar-content"])) [data-zone-tabstrip] [role="tab"] {
  background: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}
${S} [data-tree-group]:not(:has([data-slot="sidebar-content"])) [data-zone-tabstrip] [role="tab"] .uppercase {
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--ui-text-secondary);
}
${S} [data-tree-group]:not(:has([data-slot="sidebar-content"])) [data-zone-tabstrip] [role="tab"][aria-selected="true"] .uppercase { color: var(--ui-text-primary); }
/* Rounded workspace tabs: paint inside existing bounds; no height/width changes. */
${S} [data-tree-group]:not(:has([data-slot="sidebar-content"])) [data-zone-tabstrip] [role="tab"] {
  position: relative;
  border-radius: 8px !important;
  isolation: isolate;
}
${S} [data-tree-group]:not(:has([data-slot="sidebar-content"])) [data-zone-tabstrip] [role="tab"]::before {
  content: ""; position: absolute; inset: 3px 2px;
  border-radius: 6px; pointer-events: none; z-index: -1;
  background: transparent;
}
${S} [data-tree-group]:not(:has([data-slot="sidebar-content"])) [data-zone-tabstrip] [role="tab"][aria-selected="true"]::before {
  background: var(--dt-card);
}
${S} [data-tree-group]:not(:has([data-slot="sidebar-content"])) [data-zone-tabstrip] [role="tab"]:hover::before {
  background: var(--ui-control-hover-background);
}
${S} [data-tree-group]:not(:has([data-slot="sidebar-content"])) [data-zone-tabstrip] [role="tab"]::after { display: none !important; }
${S} [data-tree-group]:not(:has([data-slot="sidebar-content"])) [data-zone-tabstrip] .pane-tab-content,
${S} [data-tree-group]:not(:has([data-slot="sidebar-content"])) [data-zone-tabstrip] .pane-tab-content > span {
  min-width: 0; max-width: 100%; overflow: hidden;
}
${S} [data-tree-group]:not(:has([data-slot="sidebar-content"])) [data-zone-tabstrip] [role="tab"] .uppercase {
  display: block; min-width: 0; overflow: hidden;
  white-space: nowrap; text-overflow: ellipsis !important;
}

/* Stable close affordance: reserve text space before hover, keep tab bounds. */
${S} [data-tree-group]:not(:has([data-slot="sidebar-content"])) [data-zone-tabstrip] [role="tab"][data-closeable] .pane-tab-content {
  box-sizing: border-box; padding-right: 28px;
}
${S} [data-tree-group]:not(:has([data-slot="sidebar-content"])) [data-zone-tabstrip] [role="tab"][data-closeable] > span:has(> button) {
  position: absolute; inset: 0 4px 0 auto;
  display: flex; align-items: center; width: 24px;
  opacity: 0; pointer-events: none;
  transition: opacity 120ms ease;
}
${S} [data-tree-group]:not(:has([data-slot="sidebar-content"])) [data-zone-tabstrip] [role="tab"][data-closeable]:hover > span:has(> button),
${S} [data-tree-group]:not(:has([data-slot="sidebar-content"])) [data-zone-tabstrip] [role="tab"][data-closeable]:focus-within > span:has(> button),
${S} [data-tree-group]:not(:has([data-slot="sidebar-content"])) [data-zone-tabstrip] [role="tab"][data-closeable][aria-selected="true"] > span:has(> button) {
  opacity: 1; pointer-events: auto;
}
${S} [data-tree-group]:not(:has([data-slot="sidebar-content"])) [data-zone-tabstrip] [role="tab"][data-closeable] > span > button {
  display: grid; place-items: center;
  box-sizing: border-box; width: 24px !important; height: 24px;
  padding: 0; border: 0; border-radius: 6px;
  background: transparent; color: var(--ui-text-tertiary);
  cursor: pointer; transition: background-color 120ms, color 120ms;
}
${S} [data-tree-group]:not(:has([data-slot="sidebar-content"])) [data-zone-tabstrip] [role="tab"][data-closeable] > span > button:hover {
  background: var(--ui-control-hover-background); color: var(--ui-text-primary);
}
${S} [data-tree-group]:not(:has([data-slot="sidebar-content"])) [data-zone-tabstrip] [role="tab"][data-closeable] > span > button:focus-visible {
  outline: 2px solid var(--ui-accent); outline-offset: -2px;
}
@media (prefers-reduced-motion: reduce) {
  ${S} [data-tree-group]:not(:has([data-slot="sidebar-content"])) [data-zone-tabstrip] [role="tab"][data-closeable] > span:has(> button), ${S} [data-tree-group]:not(:has([data-slot="sidebar-content"])) [data-zone-tabstrip] [role="tab"][data-closeable] > span > button { transition: none; }
}

/* Position-independent frame: every dock group uses the same chrome. */
${S} { --rounded-panel-radius: 16px; }
${S} [data-tree-group],
${S} [data-tree-group] > [data-panel-header] {
  background: var(--dt-sidebar-bg) !important;
}
/* Round the real PaneBody, never its display:contents menu wrapper or
   inner cached panes. All corners are symmetric when docking changes. */
${S} [data-tree-group]:not(:has([data-slot="sidebar-content"])) > [data-zone-body] > div {
  border-radius: var(--rounded-panel-radius) var(--rounded-panel-radius) 0 0 !important;
  overflow: hidden !important;
  background: var(--ui-editor-surface-background) !important;
  /* Native resize seam is the sole boundary; do not add a second outline. */
  box-shadow: none !important;
}
/* Browser keeps rounded top corners and square bottom corners at every layer. */
${S} [data-tree-group] > [data-zone-body] > div:has([data-preview-browser]) {
  border-bottom-left-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}
${S} [data-preview-browser] {
  border-radius: var(--rounded-panel-radius) var(--rounded-panel-radius) 0 0 !important;
  overflow: hidden !important;
  isolation: isolate;
}
${S} [data-preview-browser] webview {
  border-bottom-left-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
  overflow: hidden !important;
}

/* Headers and resize sashes retain Hermes' native bounds and hit targets. */

/* Sidebar pane header: drag band on top, then the Sessions/Bots/Terminal tabs
   as Claude's "Home | Code" segmented control — a pill track one step
   lighter than the sidebar, a flat lighter thumb, no hairline or shadow. */
${S} [data-tree-group]:has([data-slot="sidebar-content"]) { background: var(--dt-sidebar-bg) !important; }
${S} [data-tree-group]:has([data-slot="sidebar-content"]) > [data-panel-header] {
  background: var(--dt-sidebar-bg) !important;
  min-height: 44px;
}
/* When Hermes puts tabs below native titlebar controls, reserve both rows. */
${S} [data-tree-group]:has([data-slot="sidebar-content"]) > [data-panel-header]:has([data-zone-tabstrip].absolute) {
  min-height: 78px;
}
${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip] {
  min-width: 0; align-self: stretch;
  min-height: 44px;
  display: flex; align-items: stretch;
  background: transparent !important;
  border-radius: 0; padding: 0;
  cursor: default !important;
}
/* Paint only the tab list, not the titlebar's drag and trailing controls. */
${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip] > [role="tablist"] {
  display: flex; flex: 1 1 0; min-width: 0;
  box-sizing: border-box;
  align-items: stretch; gap: 2px;
  margin: 2px 6px; padding: 2px;
  border-radius: 10px;
  background: var(--claude-seg-track) !important;
  overflow-x: auto; overflow-y: hidden;
}
${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip] [role="tab"] {
  display: flex; flex: 1 1 0; min-width: 0; min-height: 0;
  box-sizing: border-box;
  height: auto !important; align-self: stretch; align-items: center;
  padding: 0 8px !important;
  justify-content: center;
  border-radius: 8px !important;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  color: var(--dt-muted-foreground);
  cursor: pointer !important;
  transition: background-color 120ms, color 120ms;
}
${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip] [role="tab"]:hover { color: var(--dt-foreground); }
${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip] [role="tab"][aria-selected="true"] {
  background: var(--claude-seg-thumb) !important;
  color: var(--dt-foreground);
}
/* Kill the strip's own chrome: active underline, status dot, key hints. */
${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip] [role="tab"]::before,
${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip] [role="tab"]::after { display: none !important; }
${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip] .tab-key-hint-icon { display: none !important; }
${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip] .pane-tab-content { justify-content: center; }
${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip] .pane-tab-content > span:last-child { justify-content: center; padding: 0 0.25rem; }
/* Icon and label are rebuilt as pseudo-elements so the gap between them is ours. */
${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip] .uppercase {
  display: inline-flex; align-items: center; gap: 0.5rem;
  text-transform: none; letter-spacing: 0; font-size: 0 !important;
  overflow: hidden;
}
${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip] .uppercase::before { font-family: codicon; font-size: 0.875rem; line-height: 1; }
${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip] .uppercase::after {
  font-family: var(--dt-font-sans); font-size: 0.875rem; line-height: 1; font-weight: 500;
  white-space: nowrap;
}
${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip] [data-tree-tab="sessions"] .uppercase::before { content: "\\eb06"; }
${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip] [data-tree-tab="sessions"] .uppercase::after { content: "Home"; }
${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip] [data-tree-tab="hermes-bots:pane"] .uppercase::before { content: "\\ec20"; }
${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip] [data-tree-tab="hermes-bots:pane"] .uppercase::after { content: "Bots"; }
${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip] [data-tree-tab="terminal"] .uppercase::before { content: "\\ea85"; }
${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip] [data-tree-tab="terminal"] .uppercase::after { content: "Terminal"; }
/* Three tabs: a tighter icon gap, and in a narrow sidebar smaller type too,
   so "Terminal" fits whole (the strip is a size container for the query). */
${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip] { container-type: inline-size; }
${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip]:has([role="tab"]:nth-child(3)) .uppercase { gap: 0.375rem; }
${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip]:has([role="tab"]:nth-child(3)) .pane-tab-content > span:last-child { padding: 0; }
@container (max-width: 250px) {
  ${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip]:has([role="tab"]:nth-child(3)) .uppercase { gap: 0.25rem; }
  ${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip]:has([role="tab"]:nth-child(3)) .uppercase::before,
  ${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip]:has([role="tab"]:nth-child(3)) .uppercase::after { font-size: 0.75rem; }
}
${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip] [aria-label="Minimize"] { display: none; }
${S} [data-tree-group]:has([data-slot="sidebar-content"]) [data-zone-tabstrip] [aria-label="Close"] { display: none; }
${S} {
  --claude-seg-track: color-mix(in srgb, #000 5%, var(--dt-sidebar-bg));
  --claude-seg-thumb: var(--dt-card);
  --claude-row-hover: color-mix(in srgb, #000 6%, var(--dt-sidebar-bg));
  --claude-nav-fg: color-mix(in srgb, var(--dt-foreground) 80%, var(--dt-sidebar-bg));
}
${S}.dark {
  --claude-seg-track: color-mix(in srgb, #fff 6%, var(--dt-sidebar-bg));
  --claude-seg-thumb: color-mix(in srgb, #fff 15%, var(--dt-sidebar-bg));
  --claude-row-hover: color-mix(in srgb, #fff 14%, var(--dt-sidebar-bg));
}

/* Claude's short nav labels. Capabilities is Claude's "Customize" (skills,
   plugins, connectors); the tooltip keeps Hermes's own name. */
${S} [data-tour="sidebar-nav-new-session"],
${S} [data-tour="sidebar-nav-capabilities"],
${S} [data-tour="sidebar-nav-cron"] { font-size: 0 !important; }
${S} [data-tour="sidebar-nav-new-session"]::after { content: "New"; font-size: 0.875rem; }
${S} [data-tour="sidebar-nav-capabilities"]::after { content: "Customize"; font-size: 0.875rem; }
${S} [data-tour="sidebar-nav-cron"]::after { content: "Scheduled"; font-size: 0.875rem; }

/* Search lives behind the titlebar magnifier; the field only opens while in use. */
${S} [data-slot="sidebar-content"] > div:has(input[aria-label="Search sessions"]):not(:has(input:focus)):not(:has(input:not(:placeholder-shown))) {
  height: 0; padding-top: 0; padding-bottom: 0; overflow: hidden;
}
${S} #rounded-skin-search {
  display: inline-grid; place-items: center;
  width: 24px; height: 24px; margin-left: 2px;
  border-radius: 4px; background: transparent; border: 0;
  color: inherit; opacity: 0.55; cursor: pointer;
}
${S} #rounded-skin-search:hover { opacity: 1; background: var(--chrome-action-hover); }
html:not([data-hermes-theme^="rounded"]) #rounded-skin-search { display: none; }

/* ── sidebar ─────────────────────────────────────────────────────────────── */
${S} [data-slot="sidebar"] { border-right-color: var(--dt-sidebar-border) !important; }
${S} [data-slot="sidebar-content"] { padding-left: 0.625rem; padding-right: 0.625rem; }
${S} [data-sidebar="menu"] { gap: 1px; }
${S} [data-sidebar="menu-button"] {
  height: 1.75rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  gap: 0.5rem;
  border-radius: 0.5rem;
  border-color: transparent !important;
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--claude-nav-fg);
}
/* Icons carry the label's colour at full strength, like Claude's. */
${S} [data-sidebar="menu-button"] > i { color: inherit !important; opacity: 1; font-size: 0.875rem; width: 1rem; text-align: center; }
${S} [data-sidebar="menu-button"] [data-slot="kbd-group"] { display: none; }
${S} [data-sidebar="menu-button"]:hover,
${S} [data-sidebar="menu-button"].bg-\\(--ui-control-active-background\\) {
  background: var(--claude-row-hover);
  color: var(--dt-foreground);
}
/* "New session" → "New" with a plain plus; Capabilities gets Claude's briefcase. */
${S} [data-sidebar="menu-item"]:first-child [data-sidebar="menu-button"] > i::before { content: "\\ea60"; } /* codicon-add */
${S} [data-sidebar="menu-button"]:has([data-tour="sidebar-nav-capabilities"]) > i::before { content: "\\eaac"; } /* codicon-briefcase */

/* "More": New, Artifacts and Customize stay out; every other nav row folds
   under a chevron row like Claude's. The row is injected by register() and
   the open state lives on <html> (remembered in plugin storage). */
${S} ul[data-sidebar="menu"]:has(> [data-rounded-more]) > li { order: 4; }
${S} ul[data-sidebar="menu"]:has(> [data-rounded-more]) > li:has([data-tour="sidebar-nav-new-session"]) { order: 0; }
${S} ul[data-sidebar="menu"]:has(> [data-rounded-more]) > li:has([data-tour="sidebar-nav-artifacts"]) { order: 1; }
${S} ul[data-sidebar="menu"]:has(> [data-rounded-more]) > li:has([data-tour="sidebar-nav-capabilities"]) { order: 2; }
${S} ul[data-sidebar="menu"]:has(> [data-rounded-more]) > li[data-rounded-more] { order: 3; }
${S}:not([data-rounded-nav-more]) ul[data-sidebar="menu"]:has(> [data-rounded-more]) > li:not([data-rounded-more]):not(:has([data-tour="sidebar-nav-new-session"], [data-tour="sidebar-nav-artifacts"], [data-tour="sidebar-nav-capabilities"])) { display: none; }
/* Nothing to fold → no row. */
${S} ul[data-sidebar="menu"]:not(:has(> li:not([data-rounded-more]):not(:has([data-tour="sidebar-nav-new-session"], [data-tour="sidebar-nav-artifacts"], [data-tour="sidebar-nav-capabilities"])))) > [data-rounded-more] { display: none; }
html:not([data-hermes-theme^="rounded"]) [data-rounded-more] { display: none; }
${S} [data-rounded-more] > button {
  display: flex; align-items: center; width: 100%;
  background: transparent; border: 0; cursor: pointer; font: inherit;
  color: var(--dt-muted-foreground);
}
${S} [data-rounded-more] > button > i { opacity: 0.7; transition: transform 120ms; }
${S}[data-rounded-nav-more] [data-rounded-more] > button > i { transform: rotate(180deg); }
${S} [data-rounded-more] > button > span::after { content: "More"; }
${S}[data-rounded-nav-more] [data-rounded-more] > button > span::after { content: "Less"; }

/* Section labels ("Pinned", "Sessions") → quiet, sentence case, muted.
   Icon chips inside the label are their own box: skip them, or the platform
   logo inherits the label inset and hangs out of the header row. */
${S} .group\\/section-label > span:has(> svg),
${S} .group\\/section-label > span > svg { flex: none; padding-left: 0 !important; }
${S} .group\\/section-label > span:not(:has(> svg)) {
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--dt-muted-foreground);
  padding-left: 0.5rem;
}
${S} .group\\/section-label .dither { display: none; }
${S} .group\\/section { padding-top: 1.125rem; padding-bottom: 0.25rem; }

/* Date group headers ("Earlier today"). */
${S} .group\\/workspace .uppercase { text-transform: none; letter-spacing: 0; font-size: 0.6875rem; font-weight: 500; }
${S} .group\\/workspace .h-px { display: none; }

/* Session rows: taller, flush text, no timestamps or drag dots. */
${S} [data-slot="row-button"] { padding-left: 0.5rem; }
${S} [data-slot="row-button"] [data-reorder-handle] { display: none; }
${S} [data-slot="row-button"] .hover-marquee { font-size: 0.875rem; color: var(--claude-nav-fg); }
${S} .row-hover { min-height: 1.75rem; border-radius: 0.5rem; }
${S} .row-hover:hover { background: var(--claude-row-hover); }
${S} .row-hover:hover .hover-marquee { color: var(--dt-foreground); }
${S} .session-row-tail { display: none; }
${S} [data-row-actions] > span > span.pointer-events-none { display: none; }

/* Sidebar search sits like Claude's: quiet until used. */
${S} input[aria-label="Search sessions"] { font-size: 0.8125rem; }

/* ── transcript ──────────────────────────────────────────────────────────── */
${S} [data-slot="aui_thread-content"] { padding-left: 1.5rem; padding-right: 1.5rem; }

/* User turn: a soft bubble that hugs its text, on the right. */
${S} [data-slot="aui_user-message-root"] { align-items: flex-end; }
${S} [data-slot="aui_user-bubble-actions"] { width: auto; max-width: 80%; }
${S} .composer-human-message {
  border-radius: 1.125rem !important;
  border-color: transparent !important;
  padding: 0.625rem 1rem !important;
  box-shadow: none !important;
  font-size: var(--conversation-text-font-size);
  line-height: var(--conversation-line-height);
}

/* Assistant turn: a counterpart with a profile, answering in its own bubble.
   The human turn is already a glass card on the right; the reply mirrors it on
   the left, avatar gutter first, so the transcript reads as a conversation
   instead of prose under a prompt. */
${S} [data-slot="aui_assistant-message-root"] {
  --rounded-agent-avatar: 1.875rem;
  --rounded-agent-gutter: 0.625rem;
  position: relative;
  padding-left: calc(var(--rounded-agent-avatar) + var(--rounded-agent-gutter));
}
${S} [data-slot="aui_assistant-message-root"]::before {
  content: attr(data-rounded-agent-initial);
  position: absolute;
  top: 0.125rem;
  left: 0;
  display: grid;
  place-items: center;
  width: var(--rounded-agent-avatar);
  height: var(--rounded-agent-avatar);
  border-radius: 50%;
  background: var(--rounded-agent-color, var(--dt-primary));
  color: var(--dt-primary-foreground);
  font-family: var(--dt-font-sans);
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1;
  text-transform: uppercase;
  pointer-events: none;
  user-select: none;
}
/* Speaker label once per run of replies, then the avatar sits level with them. */
${S} [data-slot="aui_assistant-message-root"][data-rounded-agent-head] { padding-top: 1.3125rem; }
${S} [data-slot="aui_assistant-message-root"][data-rounded-agent-head]::before { top: 1.4375rem; }
${S} [data-slot="aui_assistant-message-root"][data-rounded-agent-head]::after {
  content: attr(data-rounded-agent-label);
  position: absolute;
  top: 0.125rem;
  left: calc(var(--rounded-agent-avatar) + var(--rounded-agent-gutter));
  max-width: calc(100% - var(--rounded-agent-avatar) - var(--rounded-agent-gutter));
  overflow: hidden;
  color: var(--dt-muted-foreground);
  font-size: 0.75rem;
  line-height: 1rem;
  white-space: nowrap;
  text-overflow: ellipsis;
  pointer-events: none;
}
${S} [data-slot="aui_assistant-message-root"] > [data-slot="aui_assistant-message-content"] {
  min-width: 0;
  padding: 0.625rem 1rem;
  border-radius: 1.125rem 1.125rem 1.125rem 0.375rem;
  background: color-mix(in srgb, var(--dt-foreground) 5%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--dt-foreground) 7%, transparent);
}
/* Nothing to wrap while the first token is still in flight. */
${S} [data-slot="aui_assistant-message-root"]:not(:has([data-slot="aui_assistant-message-content"] > *)) > [data-slot="aui_assistant-message-content"] {
  background: transparent;
  box-shadow: none;
}
${S} [data-slot="aui_assistant-message-content"] { font-family: var(--dt-font-sans); }
${S} .aui-md.prose { padding-left: 0; }
${S} .aui-md.prose h1, ${S} .aui-md.prose h2, ${S} .aui-md.prose h3 {
  font-family: var(--dt-font-sans);
  font-weight: 600;
  letter-spacing: -0.01em;
}
${S} .aui-md.prose pre, ${S} .aui-md.prose [data-slot="code-card"] { border-radius: 0.75rem; }
${S} .aui-md.prose code { border-radius: 0.375rem; font-size: 0.85em; }
${S} .aui-md.prose table { border-radius: 0.5rem; }
${S} [data-slot="aui_thinking-disclosure"] { margin-bottom: 0.25rem; }

/* Timeline rail: keep, but fade until hovered. */
${S} [data-slot="thread-timeline"] { opacity: 0.35; transition: opacity 120ms; }
${S} [data-slot="thread-timeline"]:hover { opacity: 1; }

/* ── composer ────────────────────────────────────────────────────────────── */
${S} form[data-slot="composer-root"] { border-radius: 1.25rem; }
${S} [data-slot="composer-surface"] {
  border-radius: 1.25rem !important;
  border-color: var(--dt-composer-ring) !important;
  box-shadow: none !important;
  --composer-fill: var(--dt-card);
}
${S}.dark [data-slot="composer-surface"] { box-shadow: none !important; }
/* Two rows: the text on top, controls underneath (+ left, model/send right). */
${S} [data-slot="composer-fade"] > .grid {
  grid-template-columns: auto minmax(0, 1fr) auto !important;
  grid-template-areas: "input input input" "menu spacer controls" !important;
  row-gap: 0.375rem;
}
${S} [data-slot="composer-fade"] > .grid > [class*="grid-area:menu"] { transform: none !important; align-self: center; }
${S} [data-slot="composer-rich-input"] {
  font-size: 0.9375rem;
  line-height: 1.5rem;
  padding: 0.125rem 0.125rem;
}
${S} [data-slot="composer-rich-input"][data-empty]::before { color: var(--ui-text-tertiary); }
/* Send = terracotta. */
${S} form[data-slot="composer-root"] button[type="submit"],
${S} form[data-slot="composer-root"] button[data-variant="default"][data-size="icon"] {
  border-radius: 0.625rem !important;
  background: var(--dt-primary) !important;
  color: var(--dt-primary-foreground) !important;
  width: 2rem; height: 2rem;
  box-shadow: none !important;
}
${S} form[data-slot="composer-root"] button[type="submit"]:disabled { opacity: 0.35; }
${S} form[data-slot="composer-root"] button[data-variant="ghost"][data-size="default"] {
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  color: var(--ui-text-secondary);
}
${S} form[data-slot="composer-root"] button[data-variant="ghost"][data-size="icon"] { border-radius: 0.5rem; }

/* ── empty state: serif greeting + centered composer ─────────────────────── */
${S} [data-slot="aui_intro"] .wordmark { display: none; }
${S} [data-slot="aui_intro"] { padding-bottom: 1rem !important; }
${S} [data-slot="aui_intro"] > div {
  display: flex; flex-wrap: wrap; justify-content: center; align-items: baseline;
  column-gap: 0.75rem;
}
/* Terracotta asterisk + serif greeting on one line, personality copy under it. */
${S} [data-slot="aui_intro"] > div::before {
  content: "\\2731";
  order: 1;
  font-size: 1.75rem;
  line-height: 1;
  color: var(--dt-primary);
}
${S} [data-slot="aui_intro"] > div::after {
  content: var(--rounded-greeting, "${GREETING_NAME ? `Hello, ${GREETING_NAME}` : 'Hello'}");
  order: 2;
  font-family: var(--claude-font-serif);
  font-size: 2.25rem;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--ui-text-primary);
}
${S} [data-slot="aui_intro"] p {
  order: 3; flex-basis: 100%;
  margin-top: 0.75rem;
  font-size: 0.9375rem;
  color: var(--ui-text-tertiary);
}
/* Claude's placeholders. */
${S} [data-slot="composer-rich-input"]:is(:empty, [data-empty])::before { content: "Reply to Hermes…"; }
${S} [data-chat-surface]:has([data-slot="aui_intro"]) [data-slot="composer-rich-input"]:is(:empty, [data-empty])::before { content: "How can I help you today?"; }
${S} [data-chat-surface]:has([data-slot="aui_intro"]) [data-slot="composer-dock"] {
  bottom: auto;
  top: 50%;
  margin-top: 0;
}
/* The greeting sits in the top half, ending just above the centered composer. */
${S} [data-chat-surface]:has([data-slot="aui_intro"]) [data-slot="aui_thread-content"] { height: 100%; }
${S} [data-chat-surface]:has([data-slot="aui_intro"]) [data-slot="aui_thread-content"] > div > div {
  padding-top: 0 !important;
  align-self: start;
  height: 50%;
  min-height: 0;
  justify-content: flex-end;
  padding-bottom: 1.5rem;
}
${S} [data-chat-surface]:has([data-slot="aui_intro"]) button[aria-label="Scroll to bottom"] { display: none; }

/* Claude's account row: the square profile rail gives way to one
   "avatar · name · model ⌄" row whose menu opens upward. Other themes keep the rail. */
#rounded-skin-profile { display: none; }
${S} [data-slot="sidebar-content"] div:has(> [data-slot="profile-rail"]) { display: none; }
${S} #rounded-skin-profile {
  display: block; position: relative; flex-shrink: 0;
  margin: 0.25rem -0.125rem 0.375rem; font-family: var(--dt-font-sans);
}
${S} #rounded-skin-profile .cs-row {
  display: flex; align-items: center; gap: 0.5rem; width: 100%;
  padding: 0.375rem 0.5rem; border-radius: 0.5rem; text-align: left;
  color: var(--dt-foreground); font-size: 0.875rem;
}
${S} #rounded-skin-profile .cs-row:hover,
${S} #rounded-skin-profile[data-open] > .cs-row { background: var(--claude-row-hover); }
${S} #rounded-skin-profile .cs-avatar {
  display: grid; place-items: center; flex-shrink: 0;
  width: 1.375rem; height: 1.375rem; border-radius: 999px;
  font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; color: #fff;
}
${S} #rounded-skin-profile .cs-name { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
${S} #rounded-skin-profile .cs-sub { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--dt-muted-foreground); font-size: 0.75rem; }
${S} #rounded-skin-profile .cs-row > .codicon { margin-left: 0.125rem; color: var(--dt-muted-foreground); font-size: 0.75rem; transition: transform 120ms; }
${S} #rounded-skin-profile[data-open] > .cs-row > .codicon { transform: rotate(180deg); }
${S} #rounded-skin-profile .cs-menu {
  position: absolute; left: 0; right: 0; bottom: calc(100% + 0.375rem); z-index: 50;
  display: none; padding: 0.375rem;
  max-height: 60vh; overflow-y: auto;
  background: var(--dt-card); color: var(--dt-foreground);
  border: 1px solid var(--dt-sidebar-border); border-radius: 0.75rem;
  box-shadow: 0 8px 24px -8px rgb(0 0 0 / 0.25);
}
${S} #rounded-skin-profile[data-open] .cs-menu { display: block; }
${S} #rounded-skin-profile .cs-head { padding: 0.25rem 0.5rem 0.375rem; color: var(--dt-muted-foreground); font-size: 0.8125rem; }
${S} #rounded-skin-profile .cs-item {
  display: flex; align-items: center; gap: 0.625rem; width: 100%;
  padding: 0.375rem 0.5rem; border-radius: 0.375rem; text-align: left; font-size: 0.875rem;
}
${S} #rounded-skin-profile .cs-item:hover,
${S} #rounded-skin-profile .cs-item:focus-visible { background: var(--claude-row-hover); outline: none; }
${S} #rounded-skin-profile .cs-item .cs-avatar { width: 1.125rem; height: 1.125rem; font-size: 0.5625rem; }
${S} #rounded-skin-profile .cs-item > .codicon { width: 1.125rem; text-align: center; font-size: 0.9375rem; }
${S} #rounded-skin-profile .cs-item .cs-text { display: flex; min-width: 0; flex-direction: column; }
${S} #rounded-skin-profile .cs-kbd { margin-left: auto; color: var(--dt-muted-foreground); font-size: 0.75rem; }
${S} #rounded-skin-profile .cs-sep { height: 1px; margin: 0.375rem 0.25rem; background: var(--dt-sidebar-border); }
${S} #rounded-skin-profile .cs-empty { padding: 0.375rem 0.5rem; color: var(--dt-muted-foreground); font-size: 0.8125rem; }
`

// ── Greeting clock ──────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours()
  const word = h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return GREETING_NAME ? `${word}, ${GREETING_NAME}` : word
}

function paintGreeting() {
  document.documentElement.style.setProperty('--rounded-greeting', JSON.stringify(greeting()))
}

// ── Account row: Claude's bottom-left "avatar · name · plan ⌄" ─────────────
// Replaces the square profile rail (hidden by CSS under the claude themes).
// Plain DOM like the other injected bits: the SDK has no sidebar-footer area.

const esc = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)
const label = p => (p.display_name ?? '').trim() || p.name
const avatar = p => {
  const color = sdk.profileColor?.(p.name) ?? 'var(--dt-primary)'
  return `<span class="cs-avatar" style="background:${color}">${esc(label(p).slice(0, 1))}</span>`
}
const shortModel = m => (m || '').split('/').pop().replace(/^claude-/, '')

function mountProfileRow(ctx) {
  const root = document.createElement('div')
  root.id = 'rounded-skin-profile'
  root.style.order = '99' // after the session list whatever React appends later
  let profiles = []

  const current = () => {
    const key = profileKey(host.state.profile.get())
    return profiles.find(p => profileKey(p.name) === key) ?? { name: key }
  }

  const render = () => {
    const me = current()
    const model = shortModel(host.state.model.get())
    const others = profiles.filter(p => profileKey(p.name) !== profileKey(me.name))
    const open = root.hasAttribute('data-open')
    // innerHTML is safe here: every profile/model string goes through esc(),
    // and the avatar colour comes from the SDK's hsl() generator.
    root.innerHTML = `
      <div class="cs-menu" role="menu" aria-label="Profiles">
        <div class="cs-head">${esc(label(me))}</div>
        ${others.length
          ? others.map(p => `<button type="button" role="menuitem" class="cs-item" data-profile="${esc(p.name)}">${avatar(p)}<span class="cs-text"><span class="cs-name">${esc(label(p))}</span>${p.model ? `<span class="cs-sub">${esc(shortModel(p.model))}</span>` : ''}</span></button>`).join('')
          : '<div class="cs-empty">No other profiles</div>'}
        <div class="cs-sep"></div>
        <button type="button" role="menuitem" class="cs-item" data-nav="/profiles"><i class="codicon codicon-organization" aria-hidden="true"></i>Manage profiles</button>
        <button type="button" role="menuitem" class="cs-item" data-nav="/settings"><i class="codicon codicon-settings-gear" aria-hidden="true"></i>Settings<span class="cs-kbd">⌘ ,</span></button>
      </div>
      <button type="button" class="cs-row" aria-haspopup="menu" aria-expanded="${open}">
        ${avatar(me)}<span class="cs-name">${esc(label(me))}</span>${model ? `<span class="cs-sub">· ${esc(model)}</span>` : ''}
        <i class="codicon codicon-chevron-up" aria-hidden="true"></i>
      </button>`
  }

  const setOpen = open => {
    root.toggleAttribute('data-open', open)
    root.querySelector('.cs-row')?.setAttribute('aria-expanded', String(open))
    if (open) {
      // Fresh list on every open: profiles get created/renamed elsewhere.
      host.profiles.list().then(r => { profiles = r.profiles ?? []; render() }).catch(() => {})
    }
  }

  root.addEventListener('click', e => {
    const t = e.target.closest('button')
    if (!t) return
    if (t.classList.contains('cs-row')) return setOpen(!root.hasAttribute('data-open'))
    setOpen(false)
    if (t.dataset.profile) host.newChat(t.dataset.profile) // same door as the rail: pins, dials, fresh draft
    else if (t.dataset.nav) host.navigate(t.dataset.nav)
  })
  const onDoc = e => { if (!root.contains(e.target)) setOpen(false) }
  const onKey = e => { if (e.key === 'Escape' && root.hasAttribute('data-open')) { setOpen(false); root.querySelector('.cs-row')?.focus() } }
  document.addEventListener('pointerdown', onDoc, true)
  document.addEventListener('keydown', onKey)

  const unsubs = [host.state.profile.subscribe(render), host.state.model.subscribe(render)]
  host.profiles.list().then(r => { profiles = r.profiles ?? []; render() }).catch(() => {})

  const ensure = () => {
    const content = document.querySelector('[data-slot="sidebar-content"]')
    if (content && root.parentElement !== content) content.appendChild(root)
  }
  ensure()
  ctx.setInterval(ensure, 1000)
  ctx.onDispose(() => {
    unsubs.forEach(u => u())
    document.removeEventListener('pointerdown', onDoc, true)
    document.removeEventListener('keydown', onKey)
    root.remove()
  })
}

// ── Chat persona: the reply reads as a counterpart, not as prose ────────────
// CSS draws the avatar and the bubble; the identity (colour, initial, name +
// model) can only come from the SDK, so stamp it on each reply root. Same
// source as the sidebar account row, so both always agree.

const AGENT_TURN_SEL = '[data-slot="aui_assistant-message-root"]'

function mountChatPersona(ctx) {
  let me = { name: profileKey(host.state.profile.get()) }
  let timer = 0

  const identity = () => {
    const name = label(me)
    const model = shortModel(host.state.model.get())
    return {
      color: sdk.profileColor?.(me.name) ?? '',
      initial: (name || 'A').slice(0, 1),
      label: model ? `${name} · ${model}` : name
    }
  }

  const decorate = node => {
    const who = identity()
    if (who.color) node.style.setProperty('--rounded-agent-color', who.color)
    node.setAttribute('data-rounded-agent-initial', who.initial)
    node.setAttribute('data-rounded-agent-label', who.label)
    // Label the speaker once per run of replies, the way a chat app does.
    const prev = node.previousElementSibling
    node.toggleAttribute('data-rounded-agent-head', !(prev && prev.matches(AGENT_TURN_SEL)))
  }

  // `fresh` only picks up replies that were never stamped, so a streaming turn
  // does not re-walk the whole transcript. An identity change takes the slow
  // path and re-stamps everything.
  const hydrate = fresh => {
    const nodes = fresh
      ? document.querySelectorAll(`${AGENT_TURN_SEL}:not([data-rounded-agent-initial])`)
      : document.querySelectorAll(AGENT_TURN_SEL)
    for (const node of nodes) decorate(node)
  }
  const later = () => {
    if (timer) return
    timer = setTimeout(() => { timer = 0; hydrate(true) }, 150)
  }

  const load = () => host.profiles.list().then(r => {
    const key = profileKey(host.state.profile.get())
    me = (r.profiles ?? []).find(p => profileKey(p.name) === key) ?? { name: key }
    hydrate(false)
  }).catch(() => {})

  // The transcript mounts, unmounts and streams under `body`, so watch from
  // there and let the debounce keep streaming tokens cheap.
  const observer = new MutationObserver(later)
  observer.observe(document.body, { childList: true, subtree: true })
  const unsubs = [
    host.state.profile.subscribe(() => { me = { name: profileKey(host.state.profile.get()) }; load() }),
    host.state.model.subscribe(() => hydrate(false))
  ]

  hydrate(false)
  load()
  ctx.setInterval(later, 2000) // the first paint can land before this mount

  ctx.onDispose(() => {
    observer.disconnect()
    clearTimeout(timer)
    unsubs.forEach(u => u())
    for (const node of document.querySelectorAll(AGENT_TURN_SEL)) {
      node.removeAttribute('data-rounded-agent-initial')
      node.removeAttribute('data-rounded-agent-label')
      node.removeAttribute('data-rounded-agent-head')
      node.style.removeProperty('--rounded-agent-color')
    }
  })
}

// ── First-run: pick the theme, follow the system, clear the right rail ─────
// The desktop stores theme + mode per profile, so each profile gets its own
// one-time setup (`setup:<profile>`). The legacy global `setup` flag counts
// as done for the default profile, where it was first recorded.

function setupKey(profile) {
  return `setup:${profile}`
}

function isSetUp(storage, profile) {
  if (storage.get(setupKey(profile), false)) return true
  return profile === 'default' && storage.get('setup', false)
}

function FirstRun({ storage }) {
  const { setMode } = useTheme()
  const profile = profileKey(useValue(host.state.profile))

  useEffect(() => {
    if (isSetUp(storage, profile)) return
    // Unconditional: right after a profile swap `themeName` can still be the
    // previous profile's for a render. Both writes land on the live profile.
    requestTheme(THEME_NAME)
    setMode('system')
    // Claude has no file rail. Close it once; the titlebar toggle brings it back.
    const rail = document.querySelector('button[aria-label="Hide right sidebar"]')
    if (rail) rail.click()
    storage.set(setupKey(profile), true)
  }, [profile, setMode, storage])

  return null
}

// Compact panel chooser anchored to the native right-sidebar toggle.
function mountPanelChooser(ctx) {
  const panel = document.createElement('div')
  panel.id = 'rounded-panel-chooser'
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-label', 'Open panel')
  panel.hidden = true
  panel.style.cssText = 'position:fixed;z-index:10000;width:260px;padding:10px;box-sizing:border-box;border:1px solid var(--ui-stroke-secondary);border-radius:14px;background:var(--dt-card);color:var(--ui-text-primary);'
  const grid = document.createElement('div')
  grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;'
  panel.appendChild(grid)
  document.body.appendChild(panel)
  let anchor = null
  const close = () => {
    panel.hidden = true
    anchor?.setAttribute('aria-expanded', 'false')
  }
  const actions = [
    ['Files', 'files', 'view.showFiles'],
    ['Terminal', 'terminal', 'view.showTerminal'],
    ['Browser', 'globe', 'view.showBrowser'],
    ['Review', 'diff', 'view.toggleReview'],
    ['Scheduled jobs', 'calendar', 'nav.cron']
  ]
  const available = id => ctx.listActions?.().some(action => action.id === id)
  // The terminal is deliberately NOT on the plugin allowlist — `PLUGIN_APP_ACTIONS`
  // has no `view.showTerminal`, so `runAction` refuses it — and that id is a
  // TOGGLE anyway: running it while the pane is on screen would close the very
  // pane the user asked for. `revealPane` is the sanctioned opener: it clears a
  // persisted Close, re-adopts a pane missing from the saved tree, un-collapses
  // its column, un-minimizes the zone and fronts the tab — for any pane id.
  const canRevealTerminal = () => typeof host.revealPane === 'function'
  const terminalOnScreen = () => {
    try {
      return host.paneVisibility?.('terminal')?.get?.() === true
    } catch {
      return false
    }
  }
  // A reveal lands over a couple of frames (slot rect chase, theme repaint) and
  // the composer can take the keyboard on the macrotask between them, so claim
  // it the way the native reveal does: a few attempts, then stop.
  const focusTerminal = attempts => {
    window.requestAnimationFrame(() => {
      if (!terminalOnScreen()) return
      document.querySelector('[data-terminal]:not(.invisible) .xterm-helper-textarea')?.focus?.()
      if (attempts > 1) focusTerminal(attempts - 1)
    })
  }
  const show = button => {
    anchor = button
    grid.replaceChildren()
    for (const [label, icon, action] of actions) {
      const item = document.createElement('button')
      item.type = 'button'
      item.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:72px;padding:10px;border:1px solid var(--ui-stroke-secondary);border-radius:10px;background:transparent;color:inherit;cursor:pointer;font:inherit;'
      const glyph = document.createElement('i')
      glyph.className = `codicon codicon-${icon}`
      glyph.setAttribute('aria-hidden', 'true')
      const text = document.createElement('span')
      text.textContent = label
      item.append(glyph, text)
      const enabled = action === 'view.showTerminal' ? canRevealTerminal() : available(action)
      item.disabled = !enabled
      if (!enabled) {
        item.style.opacity = '0.4'
        item.style.cursor = 'not-allowed'
        item.title = 'Unavailable in this Hermes version'
      }
      item.addEventListener('pointerenter', () => { if (!item.disabled) item.style.background = 'var(--ui-control-hover-background)' })
      item.addEventListener('pointerleave', () => { item.style.background = 'transparent' })
      item.addEventListener('click', () => {
        close()
        if (action === 'view.showTerminal') {
          if (terminalOnScreen()) {
            focusTerminal(1)
            return
          }
          if (!canRevealTerminal()) {
            host.notify?.({ kind: 'error', message: 'This Hermes version cannot open the terminal from a plugin.' })
            return
          }
          host.revealPane('terminal')
          focusTerminal(3)
          // Adoption alone is silent (it will not front over the zone's active
          // tab), so a reveal that still shows nothing means the pane is not in
          // this mode's saved tree at all. Say so instead of failing quietly.
          window.setTimeout(() => {
            if (!terminalOnScreen()) {
              host.notify?.({
                kind: 'info',
                message: 'Terminal did not appear: its pane is missing from this mode\'s saved layout.'
              })
            }
          }, 1200)
          return
        }
        if (!available(action)) return
        const result = ctx.runAction?.(action)
        if (!result?.ok) host.notify?.({ kind: 'error', message: result?.error || `Cannot open ${label}` })
      })
      grid.appendChild(item)
    }
    panel.hidden = false
    button.setAttribute('aria-expanded', 'true')
    const rect = button.getBoundingClientRect()
    const width = panel.getBoundingClientRect().width
    panel.style.left = `${Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8))}px`
    panel.style.top = `${Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - panel.getBoundingClientRect().height - 8))}px`
    grid.querySelector('button:not(:disabled)')?.focus()
  }
  const trigger = e => {
    const button = e.target.closest?.('[data-tour="right-pane-toggle"]')
    if (!button || !document.documentElement.getAttribute('data-hermes-theme')?.startsWith(THEME_NAME)) return
    e.preventDefault()
    e.stopImmediatePropagation()
    if (!panel.hidden) close()
    else show(button)
  }
  const outside = e => { if (!panel.contains(e.target) && !e.target.closest?.('[data-tour="right-pane-toggle"]')) close() }
  const key = e => { if (e.key === 'Escape' && !panel.hidden) { close(); anchor?.focus() } }
  document.addEventListener('click', trigger, true)
  document.addEventListener('pointerdown', outside, true)
  document.addEventListener('keydown', key)
  window.addEventListener('resize', close)
  ctx.onDispose(() => {
    close()
    document.removeEventListener('click', trigger, true)
    document.removeEventListener('pointerdown', outside, true)
    document.removeEventListener('keydown', key)
    window.removeEventListener('resize', close)
    panel.remove()
  })
}

// ── Plugin ──────────────────────────────────────────────────────────────────

export default {
  id: PLUGIN_ID,
  name: 'Hermes Skin Rounded',
  description: 'Claude desktop look: cream/charcoal palette, centered column, rounded composer.',
  defaultEnabled: true,
  register(ctx) {
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = CSS
    document.head.appendChild(style)
    ctx.onDispose(() => style.remove())

    mountPanelChooser(ctx)
    paintGreeting()
    ctx.setInterval(paintGreeting, 5 * 60 * 1000)

    // Titlebar magnifier beside the sidebar toggle (Claude's top-left pair).
    const focusSearch = () => {
      const find = () => document.querySelector('input[aria-label="Search sessions"]')
      let input = find()
      if (!input) {
        const show = document.querySelector('button[aria-label="Show sidebar"]')
        if (show) show.click()
        setTimeout(() => { const i = find(); if (i) { i.focus(); i.select() } }, 120)
        return
      }
      input.focus()
      input.select()
    }
    const ensureSearchButton = () => {
      const cluster = document.querySelector('[data-titlebar-cluster="left"]')
      if (!cluster || cluster.querySelector('#rounded-skin-search')) return
      const btn = document.createElement('button')
      btn.id = 'rounded-skin-search'
      btn.type = 'button'
      btn.setAttribute('aria-label', 'Search sessions')
      btn.innerHTML = '<i class="codicon codicon-search" aria-hidden="true" style="font-size:13.9px"></i>'
      btn.addEventListener('click', focusSearch)
      cluster.appendChild(btn)
    }
    // "More" row at the end of the nav list; CSS orders it after New /
    // Artifacts / Customize and folds everything else behind it.
    const MORE_ATTR = 'data-rounded-nav-more'
    const setMoreOpen = open => {
      document.documentElement.toggleAttribute(MORE_ATTR, open)
      ctx.storage.set('navMore', open)
    }
    const ensureMoreRow = () => {
      const menu = document.querySelector('ul[data-sidebar="menu"]:has([data-tour="sidebar-nav-new-session"])')
      if (!menu || menu.querySelector('[data-rounded-more]')) return
      const row = document.createElement('li')
      row.id = 'rounded-skin-more'
      row.setAttribute('data-rounded-more', '')
      row.setAttribute('data-sidebar', 'menu-item')
      row.innerHTML =
        '<button type="button" data-sidebar="menu-button" aria-label="More"><i class="codicon codicon-chevron-down" aria-hidden="true"></i><span></span></button>'
      row.querySelector('button').addEventListener('click', () => setMoreOpen(!document.documentElement.hasAttribute(MORE_ATTR)))
      menu.appendChild(row)
    }
    document.documentElement.toggleAttribute(MORE_ATTR, Boolean(ctx.storage.get('navMore', false)))

    ensureSearchButton()
    ensureMoreRow()
    mountProfileRow(ctx)
    mountChatPersona(ctx)
    ctx.setInterval(() => {
      ensureSearchButton()
      ensureMoreRow()
    }, 1000)
    ctx.onDispose(() => document.getElementById('rounded-skin-search')?.remove())
    ctx.onDispose(() => {
      document.getElementById('rounded-skin-more')?.remove()
      document.documentElement.removeAttribute(MORE_ATTR)
    })
    ctx.onDispose(() => document.documentElement.style.removeProperty('--rounded-greeting'))

    ctx.registerMany([
      { id: 'theme', area: THEMES_AREA, data: theme },
      ...EXTRA_THEMES.map(t => ({ id: `theme-${t.name}`, area: THEMES_AREA, data: t })),
      ...[theme, ...EXTRA_THEMES].map(t => ({
        id: `use-${t.name}`,
        area: PALETTE_AREA,
        data: {
          id: `rounded-skin.use.${t.name}`,
          label: `Theme: ${t.label}`,
          keywords: ['theme', 'palette', 'skin', 'claude', t.label.toLowerCase()],
          run: () => requestTheme(t.name)
        }
      })),
      { id: 'first-run', area: TITLEBAR_AREAS.right, order: 999, render: () => jsx(FirstRun, { storage: ctx.storage }) },
      {
        id: 'apply',
        area: PALETTE_AREA,
        data: {
          id: 'rounded-skin.apply',
          label: 'Rounded skin: Apply theme',
          keywords: ['claude', 'theme', 'skin', 'appearance'],
          run: () => requestTheme(THEME_NAME)
        }
      }
    ])
  }
}
