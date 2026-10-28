import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

// Contract smoke test with an SDK/DOM double; not a live Desktop visual test.
const registrations = [], disposers = [], elements = []
const node = () => ({ style: {}, appendChild() {}, remove() {}, addEventListener() {},
  removeEventListener() {}, querySelector: () => null, setAttribute() {},
  hasAttribute: () => false, toggleAttribute() {}, removeAttribute() {}, contains: () => false })
const document = { createElement: () => { const el = node(); elements.push(el); return el },
  head: node(), documentElement: { ...node(), style: { setProperty() {}, removeProperty() {} } },
  querySelector: () => null, querySelectorAll: () => [], getElementById: () => null,
  addEventListener() {}, removeEventListener() {} }
const atom = value => ({ get: () => value, subscribe: () => () => {} })
const sdk = { THEMES_AREA: 'themes', PALETTE_AREA: 'palette', TITLEBAR_AREAS: { right: 'right' },
  host: { state: { profile: atom('default'), model: atom('') }, profiles: { list: async () => ({ profiles: [] }) } } }
let source = readFileSync(new URL('./plugin.js', import.meta.url), 'utf8')
source = source.replace(/^import .*$/gm, '').replace('export default {', 'globalThis.plugin = {')
const sandbox = { sdk, document, Date, setTimeout, jsx() {}, useEffect() {} }
vm.createContext(sandbox)
vm.runInContext(source, sandbox)
assert.equal(sandbox.plugin.id, 'hermes-skin-rounded')
sandbox.plugin.register({ storage: { get: (_, fallback) => fallback },
  setInterval() {}, onDispose: fn => disposers.push(fn), registerMany: xs => registrations.push(...xs) })
await Promise.resolve()
const themes = registrations.filter(r => r.area === 'themes')
assert.equal(themes.length, 12)
assert.equal(new Set(themes.map(t => t.data.name)).size, 12)
assert.ok(themes.every(t => t.data.name === 'rounded' || t.data.name.startsWith('rounded-')))
assert.ok(elements.some(el => el.textContent?.includes('border-radius: var(--rounded-panel-radius)')))
assert.ok(elements.some(el => el.textContent?.includes('data-hermes-theme^="rounded"')))
for (const dispose of disposers.reverse()) dispose()
console.log('PASS: plugin registers 12 unique Rounded themes, injects scoped CSS, and disposes without errors.')
