import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'
const source = readFileSync(new URL('./plugin.js', import.meta.url), 'utf8')
const start = source.indexOf('function mountPanelChooser(ctx)')
assert.ok(start >= 0, 'panel chooser must exist')
const fn = source.slice(start, source.indexOf('// ── Plugin', start))
const dir = mkdtempSync(join(tmpdir(), 'chooser-test-'))
writeFileSync(join(dir, 'test.html'), `<html data-hermes-theme="rounded"><body>
<button data-tour="right-pane-toggle">Panels</button>
<div data-terminal><textarea class="xterm-helper-textarea"></textarea></div>
<pre id="result"></pre>
<script>
const THEME_NAME='rounded';const calls=[],disposers=[],notices=[];
const state={terminalOnScreen:false};
const host={
  notify:msg=>notices.push(msg.message||''),
  paneVisibility:id=>({get:()=>id==='terminal'?state.terminalOnScreen:false})
};
${fn}
mountPanelChooser({
  listActions:()=>[{id:'view.showFiles'},{id:'view.showTerminal'},{id:'view.showBrowser'},{id:'view.toggleReview'},{id:'nav.cron'}],
  runAction:id=>{calls.push(id);if(id==='view.showTerminal')state.terminalOnScreen=true;return {ok:true}},
  onDispose:f=>disposers.push(f)
});
const errors=[];
const trigger=document.querySelector('button');
const panel=()=>document.querySelector('[role="dialog"]');
trigger.click();
if(panel().hidden)errors.push('panel did not open');
let buttons=[...panel().querySelectorAll('button')];
if(buttons.length!==5)errors.push('missing choices');
if(buttons[1].disabled)errors.push('Terminal must be enabled when the desktop exposes view.showTerminal');

// Not on screen: the click OPENs it once (view.showTerminal is a toggle).
buttons[1].click();
if(calls.length!==1||calls[0]!=='view.showTerminal')errors.push('Terminal must open via view.showTerminal, got: '+JSON.stringify(calls));
if(!panel().hidden)errors.push('panel must close after a choice');

// Already on screen: the click must NOT flip the toggle closed; it focuses the
// live terminal instead.
calls.length=0;
state.terminalOnScreen=true;
trigger.click();
buttons=[...panel().querySelectorAll('button')];
buttons[1].click();
if(calls.length!==0)errors.push('Terminal on screen must not be re-toggled, got: '+JSON.stringify(calls));
const ta=document.querySelector('.xterm-helper-textarea');
if(document.activeElement!==ta)errors.push('Terminal on screen must claim the keyboard');

calls.length=0;
trigger.click();panel().querySelector('button').click();
if(calls[0]!=='view.showFiles'||!panel().hidden)errors.push('Files action failed');

trigger.click();panel().querySelectorAll('button')[4].click();
if(calls[1]!=='nav.cron'||!panel().hidden)errors.push('Scheduled jobs action failed');

trigger.click();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));
if(!panel().hidden)errors.push('Escape failed');

for(const dispose of disposers)dispose();
if(document.querySelector('[role="dialog"]'))errors.push('cleanup failed');

document.getElementById('result').textContent=JSON.stringify(errors);
</script></body></html>`)
const result = spawnSync(
  'chromium',
  ['--headless', '--no-sandbox', '--disable-gpu', `--user-data-dir=${join(dir, 'browser')}`, '--dump-dom', `file://${join(dir, 'test.html')}`],
  { encoding: 'utf8', timeout: 30000, maxBuffer: 2000000 }
)
assert.equal(result.status, 0, result.stderr)
const match = result.stdout.match(/<pre id="result">(.*?)<\/pre>/s)
assert.ok(match, result.stdout)
assert.deepEqual(JSON.parse(match[1]), [])
console.log('PASS: chooser opens five choices, opens Terminal without toggling it closed, focuses it when already on screen, runs Files and Scheduled jobs, handles Escape and cleans up.')
