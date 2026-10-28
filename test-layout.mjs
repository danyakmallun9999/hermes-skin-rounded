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
const group = (id, sidebar = false) => `<section data-tree-group="${id}"><header data-panel-header style="height:34px"><div data-zone-tabstrip="${id}"><div role="tablist"><div role="tab" data-closeable="true"><span class="pane-tab-content"><span><span class="uppercase">A very long workspace title that must not overflow its tab</span></span></span><span class="close-wrap"><button aria-label="Close">x</button></span></div></div></div></header><div data-zone-body="${id}" style="display:contents"><div class="body">${sidebar ? '<div data-slot="sidebar-content">Sidebar</div>' : '<aside data-preview-browser="test"><div><div class="viewport"><div><webview></webview></div></div></div></aside>'}</div></div></section>`
const fixtures = ['left','right','split','bottom','hidden'].map(mode => `<main data-case="${mode}" style="display:flex;${mode === 'bottom' ? 'flex-direction:column;' : ''}">${mode === 'left' ? group('custom-sidebar',true) : ''}${group('grp-main')}${mode === 'split' ? group('generated-42') : ''}${['right','bottom'].includes(mode) ? group('relocated',true) : ''}</main>`).join('')
const html = `<html data-hermes-theme="rounded"><head><style>:root{--dt-sidebar-bg:#111;--ui-editor-surface-background:#222;--ui-stroke-secondary:#333}section{display:flex;flex-direction:column;width:300px;height:200px}[data-panel-header]{display:flex;flex-shrink:0}[data-zone-tabstrip]{height:100%;flex:1;box-sizing:border-box}.body{flex:1;min-height:0}.inner{height:100%}${sandbox.css}</style></head><body>${fixtures}<script>
const failures=[];
for(const group of document.querySelectorAll('[data-tree-group]')){
 const sidebar=!!group.querySelector('[data-slot="sidebar-content"]');
 const body=group.querySelector('[data-zone-body] > div'); const s=getComputedStyle(body);
 const corners=['borderTopLeftRadius','borderTopRightRadius','borderBottomLeftRadius','borderBottomRightRadius'].map(k=>s[k]);
 if(!sidebar && corners.join(',')!=='16px,16px,0px,0px') failures.push(group.parentElement.dataset.case+': '+group.dataset.treeGroup+' corners '+corners);
 if(sidebar && corners.some(v=>v!=='0px')) failures.push('sidebar unexpectedly rounded');
 if(!sidebar && s.boxShadow!=='none') failures.push('extra workspace outline stacks with native seam');
 if(!sidebar) {
  const browser=getComputedStyle(group.querySelector('[data-preview-browser]'));
  if(browser.borderTopLeftRadius!=='16px'||browser.borderBottomRightRadius!=='0px'||browser.overflow!=='hidden') failures.push('browser must clip rounded corners');
  const guest=getComputedStyle(group.querySelector('webview'));
  if(guest.borderBottomRightRadius!=='0px') failures.push('guest bottom must remain square');
  const tab=group.querySelector('[role="tab"]');
  if(getComputedStyle(tab).borderRadius!=='8px') failures.push('workspace tab lacks rounded styling');
  const close=tab.querySelector('button');
  if(getComputedStyle(close).width!=='24px'||getComputedStyle(close).height!=='24px') failures.push('close target must be 24px square');
  if(getComputedStyle(tab.querySelector('.pane-tab-content')).paddingRight!=='28px') failures.push('title must reserve close space');
  if(getComputedStyle(tab.querySelector('.uppercase')).textOverflow!=='ellipsis') failures.push('long title lacks ellipsis');
 }
 if(sidebar) {
  const strip=group.querySelector('[data-zone-tabstrip]'); const list=strip.querySelector('[role="tablist"]'); const tab=list.querySelector('[role="tab"]');
  const ls=getComputedStyle(list); const ts=getComputedStyle(tab);
  if(ls.paddingTop!=='2px'||ls.paddingBottom!=='2px'||ls.borderRadius!=='10px') failures.push('segmented track padding/radius inconsistent');
  if(ts.borderRadius!=='8px') failures.push('segmented thumb radius inconsistent');
  if(tab.getBoundingClientRect().height > list.getBoundingClientRect().height-3.9) failures.push('tab overflows padded track: '+JSON.stringify({tab:tab.getBoundingClientRect().height,list:list.getBoundingClientRect().height,align:ls.alignItems,height:ts.height,min:ts.minHeight,flex:ls.flexDirection}));
 }
 if(sidebar && group.querySelector('[role="tab"]').getBoundingClientRect().height < 36) failures.push('sidebar tab is too short');
 if(getComputedStyle(group.querySelector('[data-panel-header]')).height!==(sidebar ? '44px' : '34px')) failures.push('unexpected header height');
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
