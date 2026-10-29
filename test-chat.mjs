import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import vm from 'node:vm'
import assert from 'node:assert/strict'

// Chromium fixture for the chat persona: the assistant turn must carry the
// profile's avatar + name and answer in a bubble of its own.
const source = readFileSync(new URL('./plugin.js', import.meta.url), 'utf8').replace(/^import .*$/gm, '').replace('export default {', 'globalThis.plugin = {') + '\nglobalThis.css = CSS;'
const sandbox = { sdk: { TITLEBAR_AREAS: {} } }
vm.createContext(sandbox)
vm.runInContext(source, sandbox)

const start = source.indexOf("const AGENT_TURN_SEL = '[data-slot=\"aui_assistant-message-root\"]'")
assert.ok(start >= 0, 'chat persona mount must exist')
const persona = source.slice(start, source.indexOf('// ── First-run:', start))

const dir = mkdtempSync(join(tmpdir(), 'rounded-chat-'))
const html = `<html data-hermes-theme="rounded"><head><style>
:root{--dt-primary:rgb(255,0,0);--dt-primary-foreground:#fff;--dt-foreground:#eee;--dt-muted-foreground:#999;--dt-font-sans:system-ui}
${sandbox.css}
[data-slot="aui_assistant-message-content"]{min-height:1rem}
</style></head><body>
<div data-slot="aui_thread-content">
  <div data-slot="aui_turn-pair">
    <div data-slot="aui_user-message-root"><span class="composer-human-message">hai</span></div>
    <div data-slot="aui_assistant-message-root" id="a1"><div data-slot="aui_assistant-message-content"><p>halo, ada yang bisa saya bantu?</p></div></div>
    <div data-slot="aui_assistant-message-root" id="a2"><div data-slot="aui_assistant-message-content"><p>lanjutan jawaban</p></div></div>
    <div data-slot="aui_thinking-disclosure" id="think1"><div class="mt-0.5 w-full min-w-0 max-w-full overflow-auto max-h-40" data-slot="aui_thinking-body"><div>rincian penalaran yang panjang sekali</div></div></div>
    <div data-slot="aui_thinking-disclosure" id="think2"><div class="mt-0.5 w-full min-w-0 max-w-full overflow-auto" data-slot="aui_thinking-body"><div>dibuka sendiri oleh pembaca</div></div></div>
  </div>
</div>
<pre id="result"></pre>
<script>
const round = 2;
const profileKey = name => (name ?? '').trim() || 'default'
const label = p => (p.display_name ?? '').trim() || p.name
const shortModel = m => (m || '').split('/').pop().replace(/^claude-/, '')
const sdk = { profileColor: name => (name === 'default' ? 'rgb(0, 128, 255)' : 'rgb(10, 200, 90)') }
const atom = initial => { const subs = []; let value = initial
  return { get: () => value, subscribe: fn => { subs.push(fn); return () => subs.splice(subs.indexOf(fn), 1) },
    set: next => { value = next; subs.forEach(fn => fn()) } } }
const boot = atom({ name: 'default', display_name: 'RivenSSH' })
const model = atom('openrouter/anthropic/claude-sonnet-4.5')
const host = { state: { profile: boot, model },
  profiles: { list: async () => ({ profiles: [
    { name: 'default', display_name: 'RivenSSH' },
    { name: 'work', display_name: 'Ada' }
  ] }) } }
// the mount takes the profile *name* atom; keep a sibling atom that carries the object
host.state.profile = { get: () => boot.get().name, subscribe: fn => boot.subscribe(fn) }
const disposers = []
const ctx = { setInterval: () => {}, onDispose: fn => disposers.push(fn) }
${persona}
const errors = []
const rootSel = '[data-slot="aui_assistant-message-root"]'
const cls = n => getComputedStyle(n, '::before')
const wait = ms => new Promise(r => setTimeout(r, ms))
const check = async () => {
  try {
    mountChatPersona(ctx)
    await wait(120)

    const a1 = document.getElementById('a1'), a2 = document.getElementById('a2')
    if (a1.getAttribute('data-rounded-agent-initial') !== 'R') errors.push('missing profile initial: ' + a1.getAttribute('data-rounded-agent-initial'))
    if (a1.getAttribute('data-rounded-agent-label') !== 'RivenSSH · sonnet-4.5') errors.push('speaker label: ' + a1.getAttribute('data-rounded-agent-label'))
    if (!a1.hasAttribute('data-rounded-agent-head')) errors.push('first reply must be labelled as the speaker')
    if (a2.hasAttribute('data-rounded-agent-head')) errors.push('a run of replies must be labelled once')

    const root = getComputedStyle(a1)
    if (root.paddingLeft !== '0px') errors.push('a reply must not indent away from the human turn: ' + root.paddingLeft)
    const avatar = cls(a1)
    if (avatar.width !== '18px' || avatar.height !== '18px') errors.push('avatar size: ' + avatar.width + 'x' + avatar.height)
    if (avatar.left !== '-21px') errors.push('the avatar must hang in the transcript padding, not in the column: ' + avatar.left)
    if (avatar.borderRadius !== '50%') errors.push('avatar must be a circle')
    if (avatar.backgroundColor !== 'rgb(0, 128, 255)') errors.push('avatar must use the profile colour: ' + avatar.backgroundColor)
    if (avatar.content !== '"R"') errors.push('avatar glyph: ' + avatar.content)
    if (getComputedStyle(a1, '::after').content !== '"RivenSSH · sonnet-4.5"') errors.push('name label not rendered')
    if (getComputedStyle(a1).paddingTop !== '22px') errors.push('a labelled reply must reserve room for its name: ' + getComputedStyle(a1).paddingTop)

    const bubble = getComputedStyle(a1.querySelector('[data-slot="aui_assistant-message-content"]'))
    if (bubble.padding !== '10px 16px') errors.push('bubble padding: ' + bubble.padding)
    if (bubble.borderRadius !== '18px 18px 18px 6px') errors.push('bubble corners: ' + bubble.borderRadius)
    if (bubble.backgroundColor === 'rgba(0, 0, 0, 0)') errors.push('reply must have a chat box')
    if (getComputedStyle(a2.querySelector('[data-slot="aui_assistant-message-content"]')).backgroundColor !== bubble.backgroundColor) errors.push('bubbles must share one surface')

    // The reply box spans the whole turn, exactly like the human turn's row: the
    // width complaint was an avatar gutter eating 40px out of every bubble.
    const bubbleNode = a1.querySelector('[data-slot="aui_assistant-message-content"]')
    if (Math.round(bubbleNode.getBoundingClientRect().width) !== Math.round(a1.getBoundingClientRect().width))
      errors.push('reply box must span the turn: ' + bubbleNode.getBoundingClientRect().width + ' of ' + a1.getBoundingClientRect().width)

    // Reasoning is minimised: the auto-preview is two lines behind a fade, while
    // a block the reader opened themselves is untouched.
    const preview = getComputedStyle(document.querySelector('#think1 [data-slot="aui_thinking-body"]'))
    if (preview.maxHeight !== '42px') errors.push('the reasoning preview must stay two lines: ' + preview.maxHeight)
    if (!preview.maskImage.includes('linear-gradient')) errors.push('the reasoning preview must fade out: ' + preview.maskImage)
    if (getComputedStyle(document.getElementById('think1')).fontSize !== '12px') errors.push('reasoning text must sit quieter: ' + getComputedStyle(document.getElementById('think1')).fontSize)
    const opened = getComputedStyle(document.querySelector('#think2 [data-slot="aui_thinking-body"]'))
    if (opened.maxHeight === '42px') errors.push('a reasoning block the reader opened must not be clipped')
    if (opened.maskImage !== 'none') errors.push('a reasoning block the reader opened must not fade: ' + opened.maskImage)

    // A reply appended later (streaming, paging) is picked up with no remount…
    const a3 = document.createElement('div')
    a3.id = 'a3'
    a3.setAttribute('data-slot', 'aui_assistant-message-root')
    const body3 = document.createElement('div')
    body3.setAttribute('data-slot', 'aui_assistant-message-content')
    a3.appendChild(body3)
    document.querySelector('[data-slot="aui_turn-pair"]').appendChild(a3)
    await wait(400)
    if (a3.getAttribute('data-rounded-agent-initial') !== 'R') errors.push('new reply never got a profile')
    // …and an empty one draws no box: nothing to wrap while the first token flies.
    if (getComputedStyle(body3).backgroundColor !== 'rgba(0, 0, 0, 0)') errors.push('empty reply must not show an empty bubble')

    // Switching profile re-stamps every reply, keeping the run labels intact.
    boot.set({ name: 'work', display_name: 'Ada' })
    await wait(250)
    if (a1.getAttribute('data-rounded-agent-initial') !== 'A') errors.push('profile switch left a stale avatar')
    if (a1.getAttribute('data-rounded-agent-label') !== 'Ada · sonnet-4.5') errors.push('profile switch left a stale label')
    if (cls(a1).backgroundColor !== 'rgb(10, 200, 90)') errors.push('profile switch left a stale colour: ' + cls(a1).backgroundColor)
    if (!a1.hasAttribute('data-rounded-agent-head') || a2.hasAttribute('data-rounded-agent-head')) errors.push('profile switch broke the speaker labels')

    disposers.forEach(fn => fn())
    if (document.querySelector(rootSel + '[data-rounded-agent-initial]')) errors.push('uninstall left stamps behind')
    if (document.querySelector(rootSel + '[data-rounded-agent-label]')) errors.push('uninstall left labels behind')
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
    '--virtual-time-budget=3000',
    `--user-data-dir=${join(dir, 'browser')}`,
    '--dump-dom',
    `file://${join(dir, 'fixture.html')}`
  ],
  { encoding: 'utf8', timeout: 40000, maxBuffer: 2000000 }
)
assert.equal(run.status, 0, run.stderr)
const result = run.stdout.match(/<pre id="result">(.*?)<\/pre>/s)
assert.ok(result, run.stdout)
assert.deepEqual(JSON.parse(result[1]), [])
console.log('PASS: Chromium computed styles — reply avatar from the profile, speaker label once per run, bubble surface, late and empty replies, profile switch, clean uninstall.')
