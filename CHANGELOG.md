# Changelog

## 1.5.2

- Fix: the avatar never showed up in the real window even though the face was painted. It was anchored with a negative offset (`left: -21px`, `top: 23px`) so that it hung in the transcript's side padding — but a negative offset leaves the element's own box, and any scrolling or clipping ancestor cuts it off. The avatar now sits at `0/0`, in the header line the reply already reserves for the speaker, and the speaker label starts after it (`padding-left: 18px + 6px`). Same 18px face, same bubble width, nothing outside the turn box to be clipped.
- The label's line height now matches the avatar's, so the name and the face share one baseline instead of drifting.
- `test-chat.mjs` asserts the avatar and the face are anchored at `0/0` inside the reply, that the label clears them, and that the face's rect never starts left of the reply's own rect. Reverting to the negative offset fails the suite (`the avatar must sit in the turn header, not outside it`).

## 1.5.1

- Fix: the avatar could end up as a bare letter — or as nothing at all — because the face was taken as a node instead of as data. Three causes, all closed:
  - A clone kept the roster's own inline `34px` size, so the face was drawn bigger than the 18px hang. Faces are now rebuilt at the hang's size (`img` re-created from its `src`, `svg` re-cloned without the inline style).
  - A shape face is painted by the bots plugin's animation clock. Cloned before its first paint it is an empty `<svg>` — an avatar that draws nothing while the monogram was already switched off. An undrawable face now loses the slot instead of claiming it, and the reply takes the real face as soon as it paints.
  - When no roster row was mounted (another tab, a collapsed rail) the reply fell back to a letter. It now wears the shape the SDK draws for that bot (`sdk.blobatarSvg`, the same deterministic blob the roster shows a bot with no custom appearance), so a reply always has a face. The roster still wins whenever it is on screen, and a face drawn elsewhere in the app (`svg[data-bot-face]` in an empty chat or a picker) is used too.
- Roster keys now match case-insensitively, so `Local::Default` and `default` are the same bot.
- `test-chat.mjs` covers each path: a not-yet-painted shape must not leave an empty slot and must yield to the painted face, a bot with no roster row must still wear its own drawn face, the face must be drawn at 18px rather than the roster's 34px, and with no drawing available at all the monogram must come back. Every one of those checks fails if its rule is reverted.

## 1.5.0

- The reply avatar is now the bot's own face instead of a letter: the skin borrows the avatar node the roster row (`[data-roster-key]`) draws for that profile — a petdex sprite, a profile photo, or the bot's blob shape — and clones it into the persona slot. Reading the rendered node keeps the skin out of another plugin's storage and shows the chat exactly the companion the sidebar shows, including a pet the reader hatched or picked.
- Layout is unchanged on purpose: the face occupies the same 18px hang in the transcript's side padding as the monogram, so the reply box still spans the full width of the human turn. The fixture re-asserts width parity with a face painted.
- A bot the roster does not draw falls back to its monogram, and a bot that loses its face mid-session drops the borrowed pet rather than keeping a stale one. The roster's own face nodes animate, so the clone is taken once per source node instead of on every pass.
- `test-chat.mjs` gains a roster fixture: an image pet, a blob-shape bot, a monogram fallback, "only the reply that introduces the speaker wears a face", and no face on a background tile. Each of the three checks fails if its rule is reverted.

## 1.4.2

- Fix: the speaker label was pinned to `host.state.profile`, the profile the gateway socket is homed on. Tab and tile focus move without swapping that socket, so every session wore whichever bot last owned the route — opening a `default` session while routed to `pembuat-ppt` still read `pembuat-ppt · OpenCode`.
- The persona now reads `host.state.focusedSessionProfile` (owner of the focused chat, falling back to the gateway profile for drafts and uncached ids), with `focusedSessionOwner.profile` as the next rung, and subscribes to both, so a bot switch or a session switch re-stamps the replies already on screen.
- A dimmed `session-tile:` surface draws no avatar and no speaker line: its owner is not the focused chat, so it must not borrow that chat's identity. Focus follows the click and the re-stamp follows focus.
- `test-chat.mjs` runs with the socket routed to a different bot than the focused chat: moving the route must not relabel, switching the focused bot must, and a background tile must carry no persona while a focused one does. Reverting either fix fails the fixture.

## 1.4.1

- Width fix: the avatar no longer reserves a 40px gutter inside the reply, which had made every answer narrower than the human turn. It hangs in the transcript's own 24px side padding (`left: -1.3125rem`, 18px circle) and is drawn only on the reply that introduces the speaker, so a reply box spans exactly the width of the turn — the same width the composer is measured against, instead of 40px short.
- Reasoning is minimised: the auto-expanding streamed preview is capped at two lines (`max-height: 2.625rem`) behind a bottom fade, in the quieter 12px caption size. A block the reader opens themselves carries no `.max-h-40` preview cap and is left untouched, so expanding still shows the whole thought.
- `test-chat.mjs` gains width parity (reply box vs turn), the hang offset and the two reasoning states (auto preview clipped and faded, opened block neither), and fails if either regresses.

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
