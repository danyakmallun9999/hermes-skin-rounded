import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import vm from 'node:vm'
import assert from 'node:assert/strict'
const source = readFileSync(new URL('./plugin.js', import.meta.url), 'utf8').replace(/^import .*$/gm, '').replace('export default {', 'globalThis.plugin = {') + '\nglobalThis.css = CSS;'
const sandbox = { sdk: { TITLEBAR_AREAS: {} } }
vm.createContext(sandbox); vm.runInContext(source, sandbox)
const dir = mkdtempSync(join(tmpdir(), 'rounded-layout-'))
const group = (id, sidebar = false) => `<section data-tree-group="${id}"><header data-panel-header style="height:34px"><div data-zone-tabstrip="${id}"><div role="tablist"><button role="tab">Tab</button></div></div></header><div data-zone-body="${id}" style="display:contents"><div class="body">${sidebar ? '<div data-slot="sidebar-content">Sidebar</div>' : '<div class="inner">Content</div>'}</div></div></section>`
const fixtures = ['left','right','split','bottom','hidden'].map(mode => `<main data-case="${mode}" style="display:flex;${mode === 'bottom' ? 'flex-direction:column;' : ''}">${mode === 'left' ? group('custom-sidebar',true) : ''}${group('grp-main')}${mode === 'split' ? group('generated-42') : ''}${['right','bottom'].includes(mode) ? group('relocated',true) : ''}</main>`).join('')
const html = `<html data-hermes-theme="rounded"><head><style>:root{--dt-sidebar-bg:#111;--ui-editor-surface-background:#222;--ui-stroke-secondary:#333}section{display:flex;flex-direction:column;width:300px;height:200px}.body{flex:1;min-height:0}.inner{height:100%}${sandbox.css}</style></head><body>${fixtures}<script>
const failures=[];
for(const group of document.querySelectorAll('[data-tree-group]')){
 const sidebar=!!group.querySelector('[data-slot="sidebar-content"]');
 const body=group.querySelector('[data-zone-body] > div'); const s=getComputedStyle(body);
 const corners=['borderTopLeftRadius','borderTopRightRadius','borderBottomLeftRadius','borderBottomRightRadius'].map(k=>s[k]);
 if(!sidebar && corners.some(v=>v!=='16px')) failures.push(group.parentElement.dataset.case+': '+group.dataset.treeGroup+' corners '+corners);
 if(sidebar && corners.some(v=>v!=='0px')) failures.push('sidebar unexpectedly rounded');
 if(getComputedStyle(group.querySelector('[data-panel-header]')).height!=='34px') failures.push('header height overridden');
 if(getComputedStyle(group).backgroundColor!=='rgb(17, 17, 17)') failures.push('frame color mismatch');
}
document.body.innerHTML='<pre id="result">'+JSON.stringify(failures)+'</pre>';
</script></body></html>`
writeFileSync(join(dir,'fixture.html'),html)
const run = spawnSync('chromium',['--headless','--no-sandbox','--disable-gpu','--no-proxy-server',`--user-data-dir=${join(dir,'browser')}`,'--dump-dom',`file://${join(dir,'fixture.html')}`],{encoding:'utf8',timeout:30000,maxBuffer:2000000})
assert.equal(run.status,0,run.stderr)
const result=run.stdout.match(/<pre id="result">(.*?)<\/pre>/s)
assert.ok(result,run.stdout)
assert.deepEqual(JSON.parse(result[1]),[])
console.log('PASS: Chromium computed styles — sidebar left/right/bottom/hidden, generated split groups, symmetric corners and native header geometry.')
