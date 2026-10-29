import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import vm from 'node:vm'
import assert from 'node:assert/strict'

// Chromium fixture for the empty state: a chat paints its greeting before its
// history arrives, so switching bots used to flash "welcome" for a few frames
// and then jump the composer from the middle of the pane to the bottom.
const source = readFileSync(new URL('./plugin.js', import.meta.url), 'utf8').replace(/^import .*$/gm, '').replace('export default {', 'globalThis.plugin = {') + '\nglobalThis.css = CSS;'
const sandbox = { sdk: { TITLEBAR_AREAS: {} } }
vm.createContext(sandbox)
vm.runInContext(source, sandbox)

const start = source.indexOf('function mountIntroHold(')
assert.ok(start >= 0, 'intro hold mount must exist')
const end = source.indexOf('function mountPanelChooser(', start)
assert.ok(end > start, 'intro hold must be self-contained')
const hold = source.slice(start, end)

// The hold keys off the empty-state attribute in CSS, so both halves have to
// agree on the name.
const attr = (source.match(/data-rounded-hold/g) ?? []).length
assert.ok(attr >= 3, 'the hold attribute must be styled, applied and cleared (' + attr + ')')

const dir = mkdtempSync(join(tmpdir(), 'rounded-intro-'))
const html = `<html data-hermes-theme="rounded"><head><style>
:root{--dt-primary:rgb(255,0,0);--dt-primary-foreground:#fff;--dt-foreground:#eee;--dt-muted-foreground:#999;--dt-font-sans:system-ui;--ui-text-primary:#eee;--ui-text-tertiary:#888;--claude-font-serif: Georgia, serif}
${sandbox.css}
#surface{position:relative;width:400px;height:600px}
</style></head><body>
<div data-chat-surface id="surface">
  <div data-slot="aui_thread-content" id="thread"><div><div id="inner"></div></div></div>
  <div data-slot="aui_intro" id="intro"><div><p>Ceritakan apa yang sedang kamu kerjakan.</p></div></div>
  <div data-slot="composer-dock" id="dock" style="position:absolute;bottom:1rem;left:0;right:0"></div>
</div>
<div id="result"></div>
<script>
const atom = initial => { const subs = []; let value = initial
  return { get: () => value, subscribe: fn => { subs.push(fn); return () => subs.splice(subs.indexOf(fn), 1) },
    set: next => { value = next; subs.forEach(fn => fn()) } } }
const focused = atom('default')
const host = {
  state: {
    profile: atom('default'),
    focusedSessionProfile: focused,
    focusedSessionOwner: { get: () => ({ connectionId: 'local', profile: focused.get() }), subscribe: fn => focused.subscribe(fn) }
  }
}
const disposers = []
const ctx = { setInterval: () => {}, onDispose: fn => disposers.push(fn) }
${hold}
const errors = []
const wait = ms => new Promise(r => setTimeout(r, ms))
const check = async () => {
  try {
    const intro = document.getElementById('intro')
    const dock = document.getElementById('dock')
    mountIntroHold(ctx)

    // First paint: the thread has mounted but nothing says whether it is empty or
    // loading, so the greeting must wait one beat instead of flashing.
    if (!intro.hasAttribute('data-rounded-hold')) errors.push('a fresh empty state must be held')
    if (getComputedStyle(intro).visibility !== 'hidden') errors.push('a held greeting must not paint: ' + getComputedStyle(intro).visibility)
    const surface = document.getElementById('surface').getBoundingClientRect()
    const restTop = dock.getBoundingClientRect().top - surface.top
    if (getComputedStyle(dock).bottom !== '16px') errors.push('a held greeting must leave the composer where it sits when a chat has messages: ' + getComputedStyle(dock).bottom)
    // The composer must stay on the floor of the pane while the greeting is held,
    // so a loading chat never sees it jump up to the middle and back.
    if (restTop < surface.height * 0.75) errors.push('a held greeting must not lift the composer: ' + Math.round(restTop) + ' of ' + Math.round(surface.height))

    // A chat that is genuinely empty shows the greeting once the beat passes.
    await wait(600)
    if (intro.hasAttribute('data-rounded-hold')) errors.push('the hold must release on its own')
    if (getComputedStyle(intro).visibility !== 'visible') errors.push('a released greeting must paint: ' + getComputedStyle(intro).visibility)
    const risenTop = dock.getBoundingClientRect().top - surface.top
    if (Math.abs(risenTop - surface.height / 2) > 2) errors.push('a released greeting must centre the composer: ' + Math.round(risenTop) + ' of ' + Math.round(surface.height))

    // Switching chats re-arms the hold, so the next greeting does not flash either.
    focused.set('kucing')
    if (!intro.hasAttribute('data-rounded-hold')) errors.push('a chat switch must hold the greeting again')
    await wait(600)
    if (intro.hasAttribute('data-rounded-hold')) errors.push('the hold must release after a switch too')

    // A fresh intro node (a remounted thread) arms it as well.
    const next = intro.cloneNode(true)
    next.removeAttribute('data-rounded-hold')
    intro.replaceWith(next)
    await wait(80)
    if (!next.hasAttribute('data-rounded-hold')) errors.push('a remounted empty state must be held')

    // And nothing survives an uninstall.
    disposers.forEach(fn => fn())
    if (document.querySelector('[data-rounded-hold]')) errors.push('uninstall left a held greeting behind')
  } catch (e) { errors.push('SCRIPT ERROR: ' + e.message) }
  document.getElementById('result').textContent = JSON.stringify(errors)
}
setTimeout(check, 60)
</script></body></html>`

writeFileSync(join(dir, 'fixture.html'), html)
const run = spawnSync(
  'chromium',
  [
    '--headless',
    '--no-sandbox',
    '--disable-gpu',
    '--no-proxy-server',
    '--virtual-time-budget=4000',
    `--user-data-dir=${join(dir, 'browser')}`,
    '--dump-dom',
    `file://${join(dir, 'fixture.html')}`
  ],
  { encoding: 'utf8', timeout: 60000, maxBuffer: 4000000 }
)
if (run.error) throw run.error
const m = run.stdout.match(/<div id="result">([^<]*)<\/div>/)
assert.ok(m, 'fixture did not report a result\n' + run.stdout.slice(-2000) + run.stderr.slice(-2000))
const errors = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'))
assert.deepEqual(errors, [], errors.join('\n'))
console.log("PASS: Chromium computed styles — the empty state is held for one beat so a chat that is still loading never flashes its greeting, the composer stays at the bottom until the greeting is real, a switch or a remount re-arms the hold, and uninstall clears it.")
