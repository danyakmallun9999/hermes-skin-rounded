# Hermes Skin Rounded

Modern rounded skin and theme collection for [Hermes Desktop](https://github.com/NousResearch/hermes-agent).

Features a unified app-bar matching the sidebar background, smooth rounded inward curvature where panels meet, solid non-transparent styling for Linux/Omarchy/macOS, a centered reading column, rounded composer, and 12 built-in themes. One file, no rebuild needed.

> The images in `docs/` are inherited upstream palette previews, not verified screenshots of the rounded layout.

## Highlights

- **Seamless Unified App-bar**: The top app-bar and panel headers match the sidebar background, eliminating awkward color transitions across the top of the window.
- **Dock-independent Rounded Panels**: All four workspace corners use a shared 16px radius. Sidebar styling follows its content rather than fixed group IDs; native header and resize geometry stay intact when panes move.
- **Non-Transparent & Solid**: Optimized for Linux desktop environments (such as Omarchy, Hyprland, Sway) as well as macOS and Windows. CSS surfaces are opaque; compositor-level window opacity must be configured separately.
- **12 Curated Themes**:
  - `Rounded` (default warm light + charcoal dark)
  - `Rounded - MacOS`
  - `Rounded - Nord`
  - `Rounded - Gruvbox`
  - `Rounded - Monokai Pro`
  - `Rounded - One Monokai`
  - `Rounded - Dracula`
  - `Rounded - One Dark Pro`
  - `Rounded - One Candy Dark`
  - `Rounded - Cobalt2`
  - `Rounded - GitHub`
  - `Rounded - Ayu`
- **Chat With a Counterpart**: The agent side is no longer anonymous prose. Every reply carries the active profile's avatar (colour + initial) and a speaker label with the model once per run, and answers inside its own chat box — the left-hand mirror of your glass bubble on the right. The avatar hangs in the transcript's own side padding, so a reply spans the full width of the turn; it never eats a column out of the bubble. The avatar is the bot's own face: the roster row the sidebar draws for that profile — a pet sprite, a photo, or its blob shape — rebuilt at 18px so it never overflows, and seated at the start of the speaker line, inside the reply's own box. Replies are stamped before they paint and the empty state is held for a beat, so the chat switches without a flicker. When no roster is on screen the reply wears the shape the SDK draws for that bot, so a reply always has a face instead of a letter; the monogram is only the last resort. The speaker is read from the owner of the focused chat, not from the profile the gateway socket happens to be routed to, so switching bots or sessions relabels the transcript — and a dimmed side-by-side tile shows no persona rather than another chat's.
- **Quiet Reasoning**: Streamed thinking is a glance, not a transcript — the auto-expanding preview is capped at two lines behind a fade, while a block you open yourself keeps its full text.
- **Minimalist Ergonomics**: Centered chat column, clean segmented control tabs for Sessions/Bots, collapsible navigation, and uncluttered titlebar.
- **Safe & Non-Destructive**: Does not modify Hermes source code. Switching to a built-in theme turns off the layout CSS; disabling the plugin removes its injected controls. First-run theme and mode preferences are not automatically restored.

## Installation

You need a Hermes Desktop build with runtime desktop plugins support (**Capabilities ▸ Plugins**).

### Option 1: Inside Hermes Desktop (Recommended)

1. Open **Capabilities ▸ Plugins**.
2. Click **Install from Git**.
3. Paste `danyakmallun9999/hermes-skin-rounded` and click **Install**.

### Option 2: Via Git

Clone directly into your Hermes desktop plugins directory:

```bash
git clone https://github.com/danyakmallun9999/hermes-skin-rounded.git ~/.hermes/desktop-plugins/hermes-skin-rounded
```

### Option 3: Manual Installation

Download `plugin.js` and place it in:
`~/.hermes/desktop-plugins/hermes-skin-rounded/plugin.js`

Hermes Desktop watches that directory automatically, so the skin loads immediately without restarting. Press `Ctrl+R` (or `Cmd+R`) in Hermes to reload if needed.

## Usage

- **Change Theme**: Go to **Settings ▸ Appearance**, or press `Ctrl+K` (`Cmd+K`) and search for any Rounded theme (e.g., `Theme: Rounded - Nord`).
- **Dark / Light Mode**: Automatically follows your system theme, or can be set manually in Settings ▸ Appearance.
- **Turn Off**: Switch to any default Hermes theme in Settings, or disable the plugin in Capabilities ▸ Plugins.

## Customization

Everything is configured inside `plugin.js` and hot-reloads on save:

- `GREETING_NAME`: Name displayed in the empty chat state (default: greeting only).
- `PALETTES`: Add or modify color schemes and palette definitions.
- `CSS`: Layout, margins, reading column width (`--composer-width`), and font sizes.

## Credits & License

Based on the original Claude skin concept by [Otto Rothmund](https://github.com/ottoRothmund/hermes-claude-skin).
Maintained and updated with rounded layouts and unified solid headers by [Danya Kmallun](https://github.com/danyakmallun9999).

Licensed under the [MIT License](LICENSE).

## Compatibility notes

This is a **Hermes Desktop plugin**, not a CLI/TUI skin. Theme names use the `rounded` namespace and do not replace the original Claude Skin themes. The plugin selects its default theme and system color mode once per profile. Avoid enabling multiple layout-changing plugins at once: their injected navigation controls can overlap. Linux compositor opacity is outside this plugin’s control.

## Tests

Run `npm run check && npm test`. The layout regression test requires Chromium on PATH and checks computed styles in synthetic pane-shell fixtures (left/right/bottom/hidden sidebar and split panes); it is not a full Desktop drag-and-drop test.
