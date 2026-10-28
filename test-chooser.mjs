import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'
const source=readFileSync(new URL('./plugin.js',import.meta.url),'utf8')
const start=source.indexOf('function mountPanelChooser(ctx)')
assert.ok(start>=0,'panel chooser must exist')
const fn=source.slice(start,source.indexOf('// ── Plugin',start))
const dir=mkdtempSync(join(tmpdir(),'chooser-test-'))
writeFileSync(join(dir,'test.html'),`<html data-hermes-theme="rounded"><body><button data-tour="right-pane-toggle">Panels</button><script>
const THEME_NAME='rounded';const calls=[],disposers=[];const host={notify(){},revealPane:id=>calls.push('reveal:'+id)};
${fn}
mountPanelChooser({listActions:()=>[{id:'view.showFiles'},{id:'view.showBrowser'},{id:'view.toggleReview'},{id:'nav.cron'}],runAction:id=>{calls.push(id);return {ok:true}},onDispose:fn=>disposers.push(fn)});
const errors=[];const trigger=document.querySelector('button');trigger.click();
const panel=document.querySelector('[role="dialog"]');
if(panel.hidden)errors.push('panel did not open');
const buttons=[...panel.querySelectorAll('button')];
if(buttons.length!==5)errors.push('missing choices');
if(buttons[1].disabled)errors.push('Terminal must use revealPane fallback');
buttons[1].click();if(calls[0]!=='reveal:terminal'||!panel.hidden)errors.push('Terminal fallback failed');
trigger.click();panel.querySelector('button').click();if(calls[1]!=='view.showFiles'||!panel.hidden)errors.push('Files action failed');
trigger.click();panel.querySelectorAll('button')[4].click();if(calls[2]!=='nav.cron'||!panel.hidden)errors.push('Scheduled jobs action failed');
trigger.click();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));if(!panel.hidden)errors.push('Escape failed');
for(const dispose of disposers)dispose();if(document.querySelector('[role="dialog"]'))errors.push('cleanup failed');
document.body.innerHTML='<pre id="result">'+JSON.stringify(errors)+'</pre>';
</script></body></html>`)
const result=spawnSync('chromium',['--headless','--no-sandbox','--disable-gpu',`--user-data-dir=${join(dir,'browser')}`,'--dump-dom',`file://${join(dir,'test.html')}`],{encoding:'utf8',timeout:30000,maxBuffer:2000000})
assert.equal(result.status,0,result.stderr)
const match=result.stdout.match(/<pre id="result">(.*?)<\/pre>/s)
assert.ok(match,result.stdout)
assert.deepEqual(JSON.parse(match[1]),[])
console.log('PASS: chooser opens, exposes five choices including Scheduled jobs, opens Terminal via revealPane, runs Files, handles Escape and cleans up.')
