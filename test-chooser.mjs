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
  paneVisibility:id=>({get:()=>id==='terminal'?state.terminalOnScreen:false}),
  revealPane:id=>{calls.push('reveal:'+id);if(id==='terminal')state.terminalOnScreen=true}
};
${fn}
mountPanelChooser({
  // The real allowlist: view.showTerminal is NOT here (PLUGIN_APP_ACTIONS has no
  // terminal id), so the tile must still work through host.revealPane.
  listActions:()=>[{id:'view.showFiles'},{id:'view.showBrowser'},{id:'view.toggleReview'},{id:'nav.cron'}],
  runAction:id=>{calls.push(id);return {ok:true}},
  onDispose:f=>disposers.push(f)
});
const errors=[];
const trigger=document.querySelector('button');
const panel=()=>document.querySelector('[role="dialog"]');
const open=()=>{trigger.click();return [...panel().querySelectorAll('button')]};
let buttons=open();
if(panel().hidden)errors.push('panel did not open');
if(buttons.length!==5)errors.push('missing choices');
if(buttons[1].disabled)errors.push('Terminal must stay enabled: revealPane can open it without a plugin action');

// Hidden terminal: the click reveals it, and never runs a toggling action.
buttons[1].click();
if(calls.length!==1||calls[0]!=='reveal:terminal')errors.push('Terminal must open via host.revealPane, got: '+JSON.stringify(calls));
if(!panel().hidden)errors.push('panel must close after a choice');

const ta=document.querySelector('.xterm-helper-textarea');
const finish=()=>{
  if(document.activeElement!==ta)errors.push('revealed terminal must claim the keyboard');

  // Already on screen: the click must NOT re-toggle (it would close the pane).
  calls.length=0;
  buttons=open();
  buttons[1].click();
  if(calls.length!==0)errors.push('Terminal on screen must not be re-opened or toggled, got: '+JSON.stringify(calls));

  calls.length=0;
  buttons=open();
  buttons[0].click();
  if(calls[0]!=='view.showFiles'||!panel().hidden)errors.push('Files action failed');

  calls.length=0;
  buttons=open();
  buttons[4].click();
  if(calls[0]!=='nav.cron'||!panel().hidden)errors.push('Scheduled jobs action failed');

  buttons=open();
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));
  if(!panel().hidden)errors.push('Escape failed');

  for(const dispose of disposers)dispose();
  if(document.querySelector('[role="dialog"]'))errors.push('cleanup failed');
  document.getElementById('result').textContent=JSON.stringify(errors);
};
setTimeout(finish,120);
</script></body></html>`)
const result = spawnSync(
  'chromium',
  [
    '--headless',
    '--no-sandbox',
    '--disable-gpu',
    '--virtual-time-budget=1500',
    `--user-data-dir=${join(dir, 'browser')}`,
    '--dump-dom',
    `file://${join(dir, 'test.html')}`
  ],
  { encoding: 'utf8', timeout: 40000, maxBuffer: 2000000 }
)
assert.equal(result.status, 0, result.stderr)
const match = result.stdout.match(/<pre id="result">(.*?)<\/pre>/s)
assert.ok(match, result.stdout)
assert.deepEqual(JSON.parse(match[1]), [])
console.log('PASS: chooser opens five choices, opens a hidden Terminal through revealPane, focuses it without toggling, runs Files and Scheduled jobs, handles Escape and cleans up.')
