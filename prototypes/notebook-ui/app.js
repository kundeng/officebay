/* Isolated design study. Sample pages/events are illustrative; nothing is persisted. */
const $ = (id) => document.getElementById(id);
const notes = [
  { id: 'systems-sketch', title: 'Systems sketch', section: 'Architecture', subtitle: 'A notebook that keeps its sources' },
  { id: 'meeting-notes', title: 'Meeting notes', section: 'Architecture', subtitle: 'Decisions from the design review' },
  { id: 'reading-list', title: 'Reading list', section: 'Research', subtitle: 'Sources worth keeping close' },
  { id: 'open-questions', title: 'Open questions', section: 'Research', subtitle: 'What should we try next?' },
];
const initialText = $('rich-text').innerHTML;
const state = { note: notes[0], tool: 'select', locked: false, inkVisible: true, reviewVisible: true, replay: false, playing: false, time: 0, speed: 1, preview: null, recording: false, versionSequence: 4 };
const pages = new Map(notes.map((note) => [note.id, { time: 24, text: initialText, strokes: [], versions: [
  { id: 3, name: 'Working page', detail: 'Current · 10:42', time: 24, text: initialText, strokes: [] },
  { id: 2, name: 'Added source references', detail: 'Snapshot · 10:36', time: 14, text: initialText, strokes: [] },
  { id: 1, name: 'First architecture sketch', detail: 'Checkpoint · 10:31', time: 9, text: initialText, strokes: [] },
] }]));
let frame = null;
let previousFrame = null;
let activeStroke = null;
let sessionStart = null;
const currentPage = () => pages.get(state.note.id);
const readOnly = () => state.replay || !!state.preview;
function announce(message) { $('status').textContent = message; }
function modal(title, body) { $('dialog-title').textContent = title; $('dialog-body').textContent = body; $('source-dialog').showModal(); }
function renderTree() {
  $('note-tree').replaceChildren();
  for (const section of ['Architecture', 'Research']) {
    const toggle = document.createElement('button');
    toggle.className = 'section-button'; toggle.innerHTML = '<span class="section-dot"></span><span>⌄</span> ' + section; toggle.setAttribute('aria-expanded', 'true');
    const list = document.createElement('div'); list.className = 'section-notes';
    toggle.onclick = () => { list.hidden = !list.hidden; toggle.setAttribute('aria-expanded', String(!list.hidden)); };
    for (const note of notes.filter((item) => item.section === section)) {
      const button = document.createElement('button'); button.className = 'note-button' + (state.note.id === note.id ? ' active' : '');
      button.innerHTML = '<span class="note-glyph">▤</span><span></span>'; button.lastElementChild.textContent = note.title; button.setAttribute('aria-current', state.note.id === note.id ? 'page' : 'false'); button.onclick = () => selectNote(note);
      list.append(button);
    }
    $('note-tree').append(toggle, list);
  }
  document.querySelector('.note-pane .pane-heading .small').textContent = notes.length + ' notes';
}
function selectNote(note) {
  pause(); state.note = note; state.preview = null; state.replay = false; state.time = 0; state.recording = false; activeStroke = null;
  $('app').classList.remove('navigation-requested'); $('note-title').textContent = note.title; $('section-name').textContent = note.section; $('canvas-title').textContent = note.subtitle;
  $('file-name').textContent = note.id + '.excalidraw.md'; $('agent-context').textContent = note.title + ' · 3 layers'; $('rich-text').innerHTML = currentPage().text;
  renderTree(); renderVersions(); renderScene(); syncMode(); announce('Selected ' + note.title + ' · independent note page');
}
function renderVersions() {
  $('version-list').replaceChildren();
  for (const [index, version] of currentPage().versions.entries()) {
    const button = document.createElement('button'); button.className = 'version-button' + (state.preview?.id === version.id ? ' active' : '');
    const name = document.createElement('strong'); name.textContent = version.name;
    const detail = document.createElement('span'); detail.className = 'small muted'; detail.textContent = version.detail;
    const action = document.createElement('span'); action.className = 'small'; action.textContent = index === 0 ? 'Preview current checkpoint →' : 'Preview this version →';
    button.append(name, detail, action); button.onclick = () => previewVersion(version); $('version-list').append(button);
  }
}
function syncMode() {
  const isReadOnly = readOnly();
  $('preview-banner').hidden = !isReadOnly; $('replay-tray').hidden = !state.replay; $('replay-toggle').setAttribute('aria-expanded', String(state.replay));
  $('preview-title').textContent = state.replay ? 'Replay · read-only' : 'Version preview · read-only';
  $('preview-detail').textContent = state.replay ? 'Main session · live page is unchanged' : state.preview ? state.preview.name + ' · this note only' : '';
  $('restore').hidden = state.replay; $('rich-text').contentEditable = String(!isReadOnly && !state.note.blank); $('save').disabled = isReadOnly;
  document.querySelectorAll('[data-tool]').forEach((button) => { button.disabled = isReadOnly; button.setAttribute('aria-pressed', String(button.dataset.tool === state.tool)); });
  $('ink-lock').disabled = isReadOnly; $('record').disabled = isReadOnly; $('record').setAttribute('aria-pressed', String(state.recording)); $('record').textContent = state.recording ? '■ Stop recording' : '● Record session';
  $('input-target').textContent = isReadOnly ? 'Preview · editing disabled' : 'Page · Working ink' + (state.locked ? ' (locked)' : '');
  $('mode-status').textContent = isReadOnly ? 'Read-only' : state.recording ? 'Recording' : 'Editing';
  $('page-paper').classList.toggle('pen-mode', state.tool === 'pen' && !isReadOnly && !state.locked);
  $('canvas-hint').firstChild.textContent = isReadOnly ? 'Preview preserves your live page. ' : state.locked ? 'Working ink is locked. Unlock it to write. ' : state.tool === 'pen' ? 'Draw on the page with your mouse or pen. ' : 'Select an object or choose Pen to write. ';
  $('canvas-hint').lastElementChild.textContent = 'Working ink · ' + (state.locked ? 'locked' : 'unlocked');
  $('blank-note').hidden = !state.note.blank || currentPage().strokes.length > 0;
}
function pathFor(points) { return points.map((point, index) => (index ? 'L' : 'M') + point.x.toFixed(1) + ' ' + point.y.toFixed(1)).join(' '); }
function renderScene() {
  const t = state.replay ? state.time : state.preview ? state.preview.time : currentPage().time;
  $('foundation').style.display = state.note.blank ? 'none' : '';
  $('rich-text').hidden = !!state.note.blank;
  document.querySelectorAll('.source-hit').forEach((button) => { button.hidden = !!state.note.blank; });
  document.querySelectorAll('#timed-ink path').forEach((path) => {
    const length = path.getTotalLength(); const fraction = Math.max(0, Math.min(1, (t - Number(path.dataset.start)) / Number(path.dataset.duration)));
    path.style.strokeDasharray = String(length); path.style.strokeDashoffset = String(length * (1 - fraction));
  });
  $('timed-ink').style.display = state.inkVisible && !state.note.blank ? '' : 'none';
  $('ink-labels').style.display = state.inkVisible && !state.note.blank ? '' : 'none';
  [...$('ink-labels').children].forEach((label, index) => { label.style.opacity = t >= [9, 6, 18][index] ? '1' : '0'; });
  $('external-card').style.display = t >= 14 ? '' : 'none'; document.querySelector('.office-hit').hidden = t < 14 || !!state.note.blank;
  $('review-marks').style.display = state.reviewVisible && !state.note.blank ? '' : 'none';
  $('user-ink').replaceChildren();
  const strokes = state.preview ? state.preview.strokes : currentPage().strokes;
  if (state.inkVisible && !state.replay) for (const stroke of strokes) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', pathFor(stroke.points)); path.setAttribute('fill', 'none'); path.setAttribute('stroke', stroke.color); path.setAttribute('stroke-width', stroke.width); path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round'); $('user-ink').append(path);
  }
  $('ink-count').textContent = ((state.note.blank ? 0 : 6) + strokes.length) + ' strokes';
  $('elapsed').textContent = '00:' + String(Math.floor(state.time)).padStart(2, '0') + ' / 00:24'; $('scrub').value = state.time;
  const gap = state.time >= 9 && state.time < 14;
  $('replay-message').classList.toggle('in-gap', gap);
  $('replay-message').textContent = gap ? 'Timing unavailable: external edit. Holding the last known scene until the 00:14 snapshot.' : state.time >= 14 ? '00:14 snapshot applied: Office reference added. Captured stroke timing resumes.' : 'Captured pen input. Stroke paths follow the recorded timing.';
}
function pause() { state.playing = false; cancelAnimationFrame(frame); previousFrame = null; $('play').textContent = '▶'; $('play').setAttribute('aria-label', 'Play replay'); }
function tick(now) { if (!state.playing) return; if (previousFrame !== null) state.time = Math.min(24, state.time + (now - previousFrame) / 1000 * state.speed); previousFrame = now; renderScene(); if (state.time >= 24) pause(); else frame = requestAnimationFrame(tick); }
function enterReplay() {
  if (state.note.blank) { modal('No recorded session yet', 'This new note has no sample replay. The prototype captures pointer timings when Record session is active, but playback demonstrates the supplied Systems sketch sample only.'); return; }
  pause(); state.preview = null; state.replay = true; state.time = 0; state.recording = false; $('rich-text').innerHTML = initialText; syncMode(); renderScene(); renderVersions(); announce('Replay opened · sample track · live edits preserved');
}
function returnLive() { pause(); state.replay = false; state.preview = null; $('rich-text').innerHTML = currentPage().text; syncMode(); renderScene(); renderVersions(); announce('Returned to live page'); }
function previewVersion(version) { pause(); state.replay = false; state.preview = version; state.recording = false; $('rich-text').innerHTML = version.text; syncMode(); renderScene(); renderVersions(); announce('Read-only version preview; live page is unchanged'); }
function showInspector(mode) { $('app').classList.add('inspector-requested'); $('inspector').hidden = false; $('layers-panel').hidden = mode !== 'layers'; $('versions-panel').hidden = mode !== 'versions'; $('layers-tab').setAttribute('aria-pressed', String(mode === 'layers')); $('versions-tab').setAttribute('aria-pressed', String(mode === 'versions')); $('history-toggle').setAttribute('aria-expanded', String(mode === 'versions')); }
function showAgent() { $('agent-pane').hidden = false; $('app').classList.add('agent-requested'); $('agent-toggle').setAttribute('aria-expanded', 'true'); }
function agentDemo(message) { showAgent(); $('agent-response').textContent = 'Prototype response: “' + message + '” would use this note and its allowed source references. No request was sent and no marks were changed.'; announce('Simulated agent response shown'); }
$('replay-toggle').onclick = () => state.replay ? returnLive() : enterReplay(); $('replay-close').onclick = returnLive; $('return-live').onclick = returnLive; $('write-mode').onclick = returnLive;
$('play').onclick = () => { if (state.playing) return pause(); if (state.time >= 24) state.time = 0; state.playing = true; previousFrame = null; $('play').textContent = 'Ⅱ'; $('play').setAttribute('aria-label', 'Pause replay'); frame = requestAnimationFrame(tick); };
$('restart').onclick = () => { pause(); state.time = 0; renderScene(); };
$('scrub').oninput = (event) => { pause(); state.time = Number(event.target.value); renderScene(); };
$('speed').onchange = (event) => { state.speed = Number(event.target.value); };
$('history-toggle').onclick = () => showInspector('versions'); $('versions-tab').onclick = () => showInspector('versions'); $('layers-tab').onclick = () => showInspector('layers'); $('inspector-toggle').onclick = () => showInspector('layers');
$('inspector-close').onclick = () => { $('inspector').hidden = true; $('app').classList.remove('inspector-requested'); $('history-toggle').setAttribute('aria-expanded', 'false'); $('inspector-toggle').setAttribute('aria-expanded', 'false'); };
$('agent-toggle').onclick = () => { if (!$('agent-pane').hidden && (innerWidth >= 1300 || $('app').classList.contains('agent-requested'))) $('agent-close').click(); else showAgent(); };
$('agent-close').onclick = () => { $('agent-pane').hidden = true; $('app').classList.remove('agent-requested'); $('agent-toggle').setAttribute('aria-expanded', 'false'); };
$('navigation-toggle').onclick = () => { if (innerWidth < 760) $('app').classList.toggle('navigation-requested'); else $('note-pane').hidden = !$('note-pane').hidden; };
$('ink-visible').onclick = () => { state.inkVisible = !state.inkVisible; $('ink-visible').setAttribute('aria-pressed', String(state.inkVisible)); $('ink-visible').setAttribute('aria-label', (state.inkVisible ? 'Hide' : 'Show') + ' Working ink'); renderScene(); announce('Working ink ' + (state.inkVisible ? 'visible' : 'hidden; marks preserved')); };
$('review-visible').onclick = () => { state.reviewVisible = !state.reviewVisible; $('review-visible').setAttribute('aria-pressed', String(state.reviewVisible)); $('review-visible').setAttribute('aria-label', (state.reviewVisible ? 'Hide' : 'Show') + ' Review marks'); renderScene(); };
$('ink-lock').onclick = () => { state.locked = !state.locked; $('ink-lock').setAttribute('aria-pressed', String(state.locked)); $('ink-lock').setAttribute('aria-label', (state.locked ? 'Unlock' : 'Lock') + ' Working ink'); $('ink-lock').textContent = state.locked ? '◆' : '◇'; syncMode(); announce(state.locked ? 'Working ink locked; pointer edits rejected' : 'Working ink unlocked'); };
document.querySelectorAll('[data-tool]').forEach((button) => { button.onclick = () => { state.tool = button.dataset.tool; syncMode(); if (state.tool === 'text') { if (state.note.blank) { state.note.blank = false; currentPage().text = '<strong>New idea</strong><p>Write your note here.</p>'; $('rich-text').innerHTML = currentPage().text; renderScene(); syncMode(); } $('rich-text').focus(); } }; });
$('rich-text').oninput = () => { if (!readOnly()) { currentPage().text = $('rich-text').innerHTML; $('save-state').textContent = 'Edited · in-memory study'; announce('Rich text edited in this tab'); } };
const record = document.createElement('button'); record.id = 'record'; record.className = 'record-button'; record.setAttribute('aria-pressed', 'false'); record.textContent = '● Record session'; document.querySelector('.capture-badge').replaceWith(record);
record.onclick = () => { state.recording = !state.recording; sessionStart = state.recording ? performance.now() : null; syncMode(); announce(state.recording ? 'Recording new pointer timings in memory · prototype only' : 'Recording stopped · pointer timings stay in memory'); };
function point(event) { const inverse = $('scene').getScreenCTM().inverse(); const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(inverse); return { x: p.x, y: p.y, t: performance.now(), pressure: event.pressure }; }
$('scene').onpointerdown = (event) => { if (state.tool !== 'pen' || readOnly() || state.locked || !state.inkVisible) return; event.preventDefault(); $('scene').setPointerCapture(event.pointerId); activeStroke = { points: [point(event)], color: $('ink-color').value, width: Number($('ink-width').value), recorded: state.recording, sessionStart }; currentPage().strokes.push(activeStroke); renderScene(); syncMode(); };
$('scene').onpointermove = (event) => { if (!activeStroke) return; activeStroke.points.push(point(event)); renderScene(); };
function endStroke() { if (!activeStroke) return; announce(activeStroke.recorded ? 'Stroke captured with pointer timing · in-memory sample' : 'Stroke added without a recorded session'); activeStroke = null; $('save-state').textContent = 'Edited · in-memory study'; }
$('scene').onpointerup = endStroke; $('scene').onpointercancel = endStroke;
$('restore').onclick = () => { if (!state.preview) return; const version = state.preview; currentPage().time = version.time; currentPage().text = version.text; currentPage().strokes = structuredClone(version.strokes); currentPage().versions.unshift({ id: state.versionSequence++, name: 'Restored: ' + version.name, detail: 'New version · just now', time: version.time, text: version.text, strokes: structuredClone(version.strokes) }); returnLive(); showInspector('versions'); announce('Restored as a new note version; earlier versions retained'); };
$('save').onclick = () => { currentPage().versions.unshift({ id: state.versionSequence++, name: 'Manual checkpoint', detail: 'New version · just now', time: currentPage().time, text: currentPage().text, strokes: structuredClone(currentPage().strokes) }); renderVersions(); announce('Simulated checkpoint added · no files written'); };
$('new-note').onclick = () => { const note = { id: 'untitled-' + (notes.length + 1), title: 'Untitled note', section: state.note.section, subtitle: 'Untitled note', blank: true }; notes.push(note); pages.set(note.id, { time: 24, text: '', strokes: [], versions: [] }); selectNote(note); showInspector('layers'); announce('Blank note added to ' + note.section + ' · in memory'); };
document.querySelectorAll('[data-source]').forEach((button) => { button.onclick = () => modal(button.dataset.source, 'In OfficeBay this reference opens in its existing ' + (button.dataset.source.endsWith('.md') ? 'Markdown' : 'Docs') + ' editor. Its original editing behavior is retained. This isolated UI study has no editor integration; return to the note to continue.'); });
$('review-anchor').onclick = () => modal('Source anchor needs review', 'The referenced paragraph changed outside this note. The mark is preserved with its previous anchor. Production UI must offer a source comparison and explicit reattachment; this study shows the recoverable state.');
$('document-history').onclick = () => modal('Document checkpoint · Field notes', 'This checkpoint includes 2 sections, 4 note identities, their order, and archived page dependencies. Restoring the document has a wider scope than restoring Systems sketch. Aggregate preview/restore is not implemented in this study.');
$('agent-form').onsubmit = (event) => { event.preventDefault(); if ($('agent-input').value.trim()) { agentDemo($('agent-input').value.trim()); $('agent-input').value = ''; } };
$('agent-summarize').onclick = () => agentDemo('Summarize this note'); $('agent-organize').onclick = () => agentDemo('Suggest an organization for these notes');
$('theme').onclick = () => { const dark = document.documentElement.dataset.theme !== 'dark'; document.documentElement.dataset.theme = dark ? 'dark' : 'light'; $('theme').setAttribute('aria-label', 'Switch to ' + (dark ? 'light' : 'dark') + ' theme'); };
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { $('app').classList.remove('agent-requested', 'inspector-requested', 'navigation-requested'); if (readOnly()) returnLive(); } });
renderTree(); renderVersions(); renderScene(); syncMode();
const fitObserver = new ResizeObserver(() => {
  const viewport = $('canvas-viewport');
  const padding = innerWidth < 760 ? 20 : innerWidth < 1050 ? 40 : 48;
  const width = Math.min(viewport.clientWidth - padding, Math.max(260, viewport.clientHeight - 67) * 880 / 620, 1000);
  $('page-paper').style.width = width + 'px';
});
fitObserver.observe($('canvas-viewport'));
