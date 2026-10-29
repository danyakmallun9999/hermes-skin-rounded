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
<div id="roster">
  <div data-roster-key="local::pembuat-ppt"><img alt="" src="data:image/png;base64,UEVU" style="width:34px;height:34px"></div>
  <div data-roster-key="local::kucing"><span style="width:34px;height:34px"><svg data-bot-face="kucing" width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="17" r="16" fill="#0ac85a"/></svg></span></div>
  <div data-roster-key="local::jam"><svg data-hb-math="1" width="34" height="34" viewBox="0 0 40 40"></svg></div>
</div>
<div data-bot-face="luar"><svg data-bot-face="luar" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#3b82f6"/></svg></div>
<div data-slot="aui_thread-content">
  <div data-slot="aui_turn-pair">
    <div data-slot="aui_user-message-root"><span class="composer-human-message">hai</span></div>
    <div data-slot="aui_assistant-message-root" id="a1"><div data-slot="aui_assistant-message-content"><p>halo, ada yang bisa saya bantu?</p></div></div>
    <div data-slot="aui_assistant-message-root" id="a2"><div data-slot="aui_assistant-message-content"><p>lanjutan jawaban</p></div></div>
    <div data-slot="aui_thinking-disclosure" id="think1"><div class="mt-0.5 w-full min-w-0 max-w-full overflow-auto max-h-40" data-slot="aui_thinking-body"><div>rincian penalaran yang panjang sekali</div></div></div>
  <div data-session-anchor="session-tile:t1" data-chat-unfocused>
    <div data-slot="aui_assistant-message-root" id="tile-a"><div data-slot="aui_assistant-message-content"><p>balasan tile lain</p></div></div>
  </div>
  <div data-session-anchor="session-tile:t2">
    <div data-slot="aui_assistant-message-root" id="tile-b"><div data-slot="aui_assistant-message-content"><p>balasan tile fokus</p></div></div>
  </div>
    <div data-slot="aui_thinking-disclosure" id="think2"><div class="mt-0.5 w-full min-w-0 max-w-full overflow-auto" data-slot="aui_thinking-body"><div>dibuka sendiri oleh pembaca</div></div></div>
  </div>
</div>
<pre id="result"></pre>
<script>
const round = 2;
const profileKey = name => (name ?? '').trim() || 'default'
const label = p => (p.display_name ?? '').trim() || p.name
const shortModel = m => (m || '').split('/').pop().replace(/^claude-/, '')
const sdk = {
  profileColor: name => ({ default: 'rgb(0, 128, 255)', 'pembuat-ppt': 'rgb(10, 200, 90)' })[name] ?? 'rgb(120, 120, 120)',
  // Stand-in for blobatar: an SVG blob seeded by the bot's name. NO_BLOB turns
  // it off so the monogram fallback stays covered.
  blobatarSvg: (seed, opts) =>
    window.NO_BLOB ? null : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="' + opts.size + '" height="' + opts.size + '" data-blob="' + seed + '"><circle cx="9" cy="9" r="8" fill="#778899"/></svg>'
}
const atom = initial => { const subs = []; let value = initial
  return { get: () => value, subscribe: fn => { subs.push(fn); return () => subs.splice(subs.indexOf(fn), 1) },
    set: next => { value = next; subs.forEach(fn => fn()) } } }
const model = atom('openrouter/anthropic/claude-sonnet-4.5')
// The socket is homed on "pembuat-ppt" while the reader sits in the default bot:
// reading state.profile labelled every session with that bot's name.
const gateway = atom('pembuat-ppt')
const focused = atom('default')
const host = {
  state: {
    profile: gateway,
    focusedSessionProfile: focused,
    focusedSessionOwner: { get: () => ({ connectionId: 'local', profile: focused.get() }), subscribe: fn => focused.subscribe(fn) },
    model
  },
  profiles: { list: async () => ({ profiles: [
    { name: 'default', display_name: 'RivenSSH' },
    { name: 'pembuat-ppt', display_name: 'Pembuat PPT' },
    { name: 'kucing' },
    { name: 'jam' },
    { name: 'luar' },
    { name: 'tanpa-wajah' }
  ] }) }
}
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
    // The avatar must sit INSIDE the turn box: a negative offset is invisible as
    // soon as an ancestor scroll container clips it.
    if (avatar.left !== '0px' || avatar.top !== '0px') errors.push('the avatar must sit in the turn header, not outside it: ' + avatar.top + '/' + avatar.left)
    const headLabel = getComputedStyle(a1, '::after')
    if (headLabel.paddingLeft !== '24px') errors.push('the speaker label must clear the avatar: ' + headLabel.paddingLeft)
    if (avatar.borderRadius !== '50%') errors.push('avatar must be a circle')
    if (avatar.backgroundColor !== 'rgb(0, 128, 255)') errors.push('avatar must use the profile colour: ' + avatar.backgroundColor)
    // The opened bot wears a face from the start: its own if the roster draws
    // one, otherwise the shape the SDK gives a bot with no custom look.
    const startFace = a1.querySelector(':scope > [data-rounded-agent-pet]')
    if (startFace?.firstElementChild?.getAttribute('data-blob') !== 'default') errors.push('the opened bot must wear a drawn face: ' + startFace?.firstElementChild?.outerHTML?.slice(0, 60))
    if (avatar.content !== 'none') errors.push('a drawn face must keep the monogram off: ' + avatar.content)
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

    // The gateway route is NOT the speaker: moving the socket must not relabel.
    gateway.set('pembuat-ppt')
    await wait(250)
    if (a1.getAttribute('data-rounded-agent-label') !== 'RivenSSH · sonnet-4.5')
      errors.push('the gateway route must not relabel the transcript: ' + a1.getAttribute('data-rounded-agent-label'))

    // Switching the bot of the focused chat re-stamps every reply.
    focused.set('pembuat-ppt')
    await wait(250)
    if (a1.getAttribute('data-rounded-agent-initial') !== 'P') errors.push('bot switch left a stale avatar: ' + a1.getAttribute('data-rounded-agent-initial'))
    if (a1.getAttribute('data-rounded-agent-label') !== 'Pembuat PPT · sonnet-4.5') errors.push('bot switch left a stale label: ' + a1.getAttribute('data-rounded-agent-label'))
    if (cls(a1).backgroundColor !== 'rgb(10, 200, 90)') errors.push('bot switch left a stale colour: ' + cls(a1).backgroundColor)
    if (!a1.hasAttribute('data-rounded-agent-head') || a2.hasAttribute('data-rounded-agent-head')) errors.push('bot switch broke the speaker labels')

    // The bot's own face: the roster draws a pet for this bot, so the reply
    // wears that pet instead of a monogram — in the same 18px hang, so the
    // reply box keeps the width of the human turn.
    const petSlot = a1.querySelector(':scope > [data-rounded-agent-pet]')
    if (!petSlot) errors.push("the reply must wear the bot's own face")
    else {
      if (petSlot.firstElementChild?.tagName !== 'IMG') errors.push('the face must be the roster pet image: ' + petSlot.firstElementChild?.tagName)
      if (!(petSlot.firstElementChild?.getAttribute('src') || '').includes('UEVU')) errors.push('the pet image was not carried over')
      const box = getComputedStyle(petSlot)
      if (box.width !== '18px' || box.height !== '18px') errors.push('the face must fill the 18px hang: ' + box.width + 'x' + box.height)
      if (box.left !== '0px' || box.top !== '0px') errors.push('the face must sit in the turn header, not outside it: ' + box.top + '/' + box.left)
      const inside = petSlot.getBoundingClientRect()
      const turn = a1.getBoundingClientRect()
      if (inside.left < turn.left - 0.5) errors.push('the face must not be drawn outside the reply box: ' + inside.left + ' < ' + turn.left)
      // The roster draws its own copy at 34px inline; the avatar is the hang.
      const drawn = petSlot.firstElementChild.getBoundingClientRect()
      if (Math.round(drawn.width) !== 18 || Math.round(drawn.height) !== 18) errors.push('the face must be drawn at the hang size, not the roster size: ' + drawn.width + 'x' + drawn.height)
    }
    if (cls(a1).content !== 'none') errors.push('a face must replace the monogram, not stack on it: ' + cls(a1).content)
    if (a2.querySelector('[data-rounded-agent-pet]')) errors.push('only the reply that introduces the speaker wears a face')
    if (Math.round(bubbleNode.getBoundingClientRect().width) !== Math.round(a1.getBoundingClientRect().width))
      errors.push('the face must not narrow the reply box: ' + bubbleNode.getBoundingClientRect().width + ' of ' + a1.getBoundingClientRect().width)

    // A background tile is not the focused chat, so it wears no persona at all.
    const tileA = document.getElementById('tile-a')
    const tileAvatar = getComputedStyle(tileA, '::before')
    if (tileAvatar.content !== 'none') errors.push('a background tile must not wear the focused bot: ' + tileAvatar.content)
    if (getComputedStyle(tileA).paddingTop !== '0px') errors.push('a background tile must keep its line: ' + getComputedStyle(tileA).paddingTop)
    const tileASlot = tileA.querySelector('[data-rounded-agent-pet]')
    if (tileASlot && getComputedStyle(tileASlot).display !== 'none') errors.push("a background tile must not show the focused bot's face")
    const tileBSlot = document.getElementById('tile-b').querySelector('[data-rounded-agent-pet]')
    if (tileBSlot?.firstElementChild?.tagName !== 'IMG') errors.push("the focused tile must show its speaker's face")

    // A bot whose roster avatar is a blob shape wears that shape, not a letter.
    focused.set('kucing')
    await wait(250)
    const shapeSlot = a1.querySelector(':scope > [data-rounded-agent-pet]')
    if (shapeSlot?.firstElementChild?.tagName.toLowerCase() !== 'svg') errors.push('a shape bot must wear its blob: ' + shapeSlot?.firstElementChild?.tagName)
    if (a1.getAttribute('data-rounded-agent-label') !== 'kucing · sonnet-4.5') errors.push('shape bot label: ' + a1.getAttribute('data-rounded-agent-label'))

    // A shape face is painted by the bots plugin's animation frame. Cloned while
    // it is still blank it would be an invisible avatar, so a blank face must
    // never win: the SDK blob holds the hang until the shape draws, and then the
    // roster's face takes over without a reload.
    focused.set('jam')
    await wait(250)
    const blank = a1.querySelector(':scope > [data-rounded-agent-pet]')
    if (blank?.firstElementChild?.tagName.toLowerCase() !== 'svg') errors.push('a blank shape must not leave an empty avatar slot: ' + blank?.firstElementChild?.tagName)
    if (blank?.firstElementChild?.getAttribute('data-blob') !== 'jam') errors.push('a blank shape must fall back to a drawn face, not a letter: ' + blank?.firstElementChild?.outerHTML?.slice(0, 60))
    document.querySelector('svg[data-hb-math]').innerHTML = '<circle cx="20" cy="20" r="18" fill="#0ac85a"/>'
    await wait(400)
    const painted = a1.querySelector(':scope > [data-rounded-agent-pet]')
    if (painted?.firstElementChild?.tagName.toLowerCase() !== 'svg' || painted.firstElementChild.hasAttribute('data-blob'))
      errors.push('a painted shape must take over the drawn fallback: ' + painted?.firstElementChild?.outerHTML?.slice(0, 60))
    if (Math.round(painted.firstElementChild.getBoundingClientRect().width) !== 18) errors.push('the painted shape must be drawn at the hang size')

    // No roster in sight still finds the bot's face elsewhere in the app.
    focused.set('luar')
    await wait(250)
    const elsewhere = a1.querySelector(':scope > [data-rounded-agent-pet]')
    if (elsewhere?.firstElementChild?.tagName.toLowerCase() !== 'svg') errors.push('a face drawn outside the roster must still be found: ' + elsewhere?.firstElementChild?.tagName)

    // A bot the roster does not draw still wears the shape Hermes gives a bot
    // with no custom look — never the previous bot's pet.
    focused.set('tanpa-wajah')
    await wait(250)
    const noRow = a1.querySelector(':scope > [data-rounded-agent-pet]')
    if (!noRow) errors.push('a bot with no roster row must still wear a face')
    else if (noRow.firstElementChild?.getAttribute('data-blob') !== 'tanpa-wajah') errors.push('a bot with no roster row must wear its own drawn face: ' + noRow.firstElementChild?.outerHTML?.slice(0, 60))
    if (cls(a1).content !== 'none') errors.push('a drawn face must keep the monogram off: ' + cls(a1).content)

    // Nothing can draw a face (an SDK without blobatar): the monogram returns
    // rather than leaving the avatar blank.
    window.NO_BLOB = true
    focused.set('default')
    await wait(250)
    focused.set('tanpa-wajah')
    await wait(250)
    if (a1.querySelector('[data-rounded-agent-pet]')) errors.push('no drawn face must not leave an empty slot')
    if (a1.hasAttribute('data-rounded-agent-face')) errors.push('stale face flag left behind')
    if (cls(a1).content !== '"t"') errors.push('with nothing to draw the monogram must return: ' + cls(a1).content)

    // A reply that has just mounted must be dressed by the end of that same task:
    // its header line reserves 22px and its avatar sits in it, so a stamp applied
    // a debounce later makes the bubble paint short and then jump — the "glitch"
    // of a transition that is not smooth.
    const late = document.createElement('div')
    late.setAttribute('data-slot', 'aui_assistant-message-root')
    late.innerHTML = '<div data-slot="aui_assistant-message-content"><p>balasan baru</p></div>'
    document.querySelector('[data-slot="aui_thread-content"] > div').appendChild(late)
    await null
    if (!late.hasAttribute('data-rounded-agent-initial')) errors.push('a freshly mounted reply must be stamped before its first paint')
    else if (getComputedStyle(late).paddingTop === '0px' && late.hasAttribute('data-rounded-agent-head')) errors.push('a stamped reply must reserve room for its name before paint')

    disposers.forEach(fn => fn())
    if (document.querySelector(rootSel + '[data-rounded-agent-initial]')) errors.push('uninstall left stamps behind')
    if (document.querySelector(rootSel + '[data-rounded-agent-label]')) errors.push('uninstall left labels behind')
    if (document.querySelector('[data-rounded-agent-pet]')) errors.push('uninstall left a face behind')
    if (document.querySelector(rootSel + '[data-rounded-agent-face]')) errors.push('uninstall left a face flag behind')
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
console.log('PASS: Chromium computed styles — reply avatar from the focused chat\'s profile (never the gateway route), the bot\'s own pet or blob face in the same 18px hang, monogram fallback, speaker label once per run, no persona on a background tile, bubble width and surface, late and empty replies, clean uninstall.')
