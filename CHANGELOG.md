# Changelog

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
