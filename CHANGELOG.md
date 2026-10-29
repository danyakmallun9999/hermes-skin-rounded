# Changelog

## 1.4.0

- The transcript now reads as a conversation with someone: every assistant turn gets a circular avatar in a left gutter — the active profile's colour and initial, the same identity the sidebar account row shows — and the profile name plus model as a speaker label once per run of replies.
- Replies get their own chat box: the same 18px radius and 10/16px padding as the human bubble, one shade quieter over `--dt-foreground`, with the bottom-left corner squared toward the avatar. Empty placeholder turns draw no empty box.
- Identity is stamped from `host.state.profile` / `host.state.model` / `host.profiles`, so switching profile or model re-labels the replies already on screen; a new reply appended by streaming is picked up without remounting the thread.
- `test-chat.mjs` (Chromium): avatar colour/size/glyph, speaker label once per run, bubble geometry and surface, late and empty replies, profile switch, and a clean uninstall. `test.mjs` asserts `register()` mounts the persona watcher.

## 1.3.2

- The chooser's Terminal tile opens through `host.revealPane('terminal')` again. `view.showTerminal` is not on `PLUGIN_APP_ACTIONS`, so gating the tile on `listActions()` disabled it — and it is a toggle anyway, which closed a terminal that was already on screen.
- A visible terminal is focused (three frame attempts, like the native reveal) instead of being flipped off.
- `revealPane` clears the persisted Close, re-adopts a pane missing from the saved tree, un-collapses its column and fronts the tab, so the terminal lands in the main zone beside the chat regardless of the mode it is opened from.
- Fixture now mirrors the real allowlist (no `view.showTerminal` in `listActions()`) and asserts the tile stays enabled and calls `reveal:terminal`.

## 1.3.0

- Sidebar segmented tabs and workspace tabs get rounded pills without changing tab or bar size; long titles ellipsize.
- Workspace tab close button becomes a 24px target that reserves its own text space and only fades in on hover, focus, or selection.
- Taller sidebar header (44px) so the Home/Bots tabs are no longer cramped.
- Remove the extra inset outline on the right-docked sidebar; the native resize seam is the only boundary.
- Remove the chat composer shadow in light and dark modes.
- Titlebar keeps only the core controls; Layout editor, HUD mode, and Swap sidebar sides are hidden.
- Browser panel is rounded on top and square at the bottom, clipped at the webview layer too.
- Main workspace keeps rounded top corners and square bottom corners.
- Right-pane toggle opens a 2x2 grid chooser (Files, Terminal, Browser, Review, Scheduled jobs) instead of a plain toggle.
- Section header icon chips no longer inherit the label inset, so platform logos such as Telegram stay inside their box.

## 1.2.1

- Move segmented-control background and 2px padding onto the tab list only.
- Use a 10px track radius and 8px thumb radius, with stretch-sized tabs instead of fixed 27px height.
- Keep trailing controls outside the pill; add computed-style padding and overflow regression checks.

## 1.2.0

- Symmetric 16px workspace corners independent of sidebar docking direction.
- Identify sidebar groups by their content, not persistent layout IDs.
- Remove fixed 87px sidebar header, 50px tab offset, and 34px sash override.
- Preserve native docking, header clearance, and resize hit targets.
- Add real Chromium computed-style regression fixtures.

## 1.1.0 — 2026-10-28

- Added unified solid app-bar matching sidebar background (`--dt-sidebar-bg`).
- Added rounded top-left junction (`border-top-left-radius: 16px`) where main workspace meets sidebar and app-bar.
- Removed unwanted transparency leakage behind tab headers; solid and clean on Omarchy / Linux / Hyprland.
- Offset top hairline sash divider so it flows seamlessly across the top titlebar.

## 1.0.0 — 2026-09-24

First public release.

- Twelve themes on the Claude layout: Claude, MacOS, Nord, Gruvbox, Monokai Pro,
  One Monokai, Dracula, One Dark Pro, One Candy Dark, Cobalt2, GitHub, Ayu.
- Claude-style shell: simple left nav with a **More** fold, centered reading
  column, right-aligned user bubbles, two-row rounded composer, serif greeting.
- One-time setup per Hermes profile (theme, system light/dark, file rail closed).
- Greeting name is optional and empty by default.
