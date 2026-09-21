// Run in the open prototype: Get-Content -Raw verify-browser.js | agent-browser --session officebay-study eval --stdin
(async () => {
  const results = [];
  const check = (label, truth) => { results.push({ label, pass: !!truth }); if (!truth) throw new Error(label); };
  const el = (id) => document.getElementById(id);
  const click = (id) => el(id).click();
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const seek = (time) => { el('scrub').value = time; el('scrub').dispatchEvent(new Event('input', { bubbles: true })); };
  click('write-mode');
  const initialText = el('rich-text').innerHTML;
  el('rich-text').innerHTML = '<strong>Verified live edit</strong>';
  el('rich-text').dispatchEvent(new Event('input', { bubbles: true }));
  document.querySelectorAll('.note-button')[1].click();
  check('Different note selected', el('note-title').textContent === 'Meeting notes');
  document.querySelectorAll('.note-button')[0].click();
  check('Text retained per note', el('rich-text').textContent === 'Verified live edit');
  click('ink-visible'); check('Ink hidden without deletion', el('timed-ink').style.display === 'none' && el('timed-ink').children.length === 6); click('ink-visible');
  click('ink-lock'); check('Layer locked', el('ink-lock').getAttribute('aria-pressed') === 'true'); click('ink-lock');
  click('record'); check('Explicit recording state', el('record').getAttribute('aria-pressed') === 'true' && el('mode-status').textContent === 'Recording'); click('record');
  click('replay-toggle'); check('Replay read-only', el('rich-text').contentEditable === 'false' && el('save').disabled && el('restore').hidden);
  click('play'); await delay(700); const t1 = Number(el('scrub').value); check('Play advances timed stroke', t1 > 0.3 && Number(document.querySelector('#timed-ink path').style.strokeDashoffset) > 0);
  click('play'); await delay(250); check('Pause holds position', Number(el('scrub').value) === t1);
  el('speed').value = '4'; el('speed').dispatchEvent(new Event('change', { bubbles: true })); click('play'); await delay(400); click('play'); check('Speed changes elapsed progress', Number(el('scrub').value) - t1 > 0.9);
  seek(11); check('Gap holds missing external card', el('external-card').style.display === 'none' && el('replay-message').textContent.includes('Timing unavailable'));
  seek(14); check('Next snapshot applies discretely', el('external-card').style.display !== 'none' && el('replay-message').textContent.includes('snapshot applied'));
  click('return-live'); check('Replay preserved live edit', el('rich-text').textContent === 'Verified live edit');
  click('history-toggle'); const before = document.querySelectorAll('.version-button').length; document.querySelectorAll('.version-button')[2].click();
  check('Checkpoint preview guarded', el('rich-text').contentEditable === 'false' && !el('restore').hidden && el('replay-tray').hidden);
  click('return-live'); check('Checkpoint preview preserved live edit', el('rich-text').textContent === 'Verified live edit');
  document.querySelectorAll('.version-button')[2].click(); click('restore');
  check('Restore appends version', document.querySelectorAll('.version-button').length === before + 1 && document.querySelector('.version-button strong').textContent.startsWith('Restored:'));
  check('Restore exits preview and retains checkpoint scene', el('mode-status').textContent === 'Editing' && el('external-card').style.display === 'none');
  click('new-note'); check('New note initial state', el('note-title').textContent === 'Untitled note' && !el('blank-note').hidden);
  document.querySelectorAll('.note-button')[0].click();
  click('theme'); check('Dark chrome theme', document.documentElement.dataset.theme === 'dark'); click('theme');
  el('rich-text').innerHTML = initialText; el('rich-text').dispatchEvent(new Event('input', { bubbles: true }));
  return JSON.stringify({ checks: results.length, results });
})()
