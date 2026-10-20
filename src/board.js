// Renders every screen into workshop boards (four phones per sheet) for PDF export.
// Uses the same screen functions and CSS as the live prototype, with showcase data.
import { SCREENS, BOARDS, PRESET, ORDER, frame, num } from './registry.js';
import { showcase } from './store.js';
import { esc } from './ui.js';

const fi = new URLSearchParams(location.search).get('fi') || 'proto';
document.body.dataset.fi = fi;
const FI = { proto: ['03', 'Mobile prototype', 'Green glass. Translucent white over mint light, solid emerald actions.'], wire: ['02', 'Interactive wireframe', 'Structure and links. Dashed outlines are tappable; the number is the screen it opens.'], lofi: ['01', 'Lo-fi wireframe', 'Technical diagram: plain boxes, connectors and notes. Layout and flow only.'] }[fi];
const NOW = new Date('2026-10-12T19:10:00');
const MINI = ['today', 'stash', 'reader', 'transcript', 'p2p-source', 'player', 'player-sheet', 'podcasts'];
const ACT_TO = { guest: 'today', 'start-create': 'signin', signin: 'today', 'ob-finish': 'today', surprise: 'surprise', 'takeaway-save': 'quiz', 'course-complete': 'complete', 'evidence-save': 'skill', 'plan-create': 'plan', 'import-text': 'import-review', 'import-save': 'stash', 'export-run': 'export-done', 'p2p-script': 'p2p-script', 'p2p-generate': 'p2p-generate', 'job-retry': 'p2p-generate', play: 'player', 'rhythm-save': 'calendar', signout: 'welcome', 'set-career': 'ob-goal', 'seek-seg': 'player', 'ep-del': 'stash' };

function target(el) {
  if (el.dataset.go) return el.dataset.go.split('?')[0];
  const a = el.dataset.act, arg = el.dataset.arg || '';
  if (a === 'back' || a === 'ob-next' || a === 'go') return arg.split('?')[0];
  if (a === 'sheet' && arg === 'queue') return 'player-sheet';
  if (a === 'sheet-close' && el.closest('[data-screen="player-sheet"]')) return 'player';
  if (a === 'idea-go') return +arg.split('|')[1] > 3 ? 'takeaway' : 'reader';
  return ACT_TO[a];
}
function phone(id) {
  const s = showcase(); s.draft.quizPick = 1;
  if (!MINI.includes(id)) s.player.ep = null;
  if (id.startsWith('player')) s.player.playing = true;
  const q = Object.fromEntries(new URLSearchParams(PRESET[id] || ''));
  const ctx = { s, q, env: { now: NOW, voices: [{ name: 'Samantha', lang: 'en-US' }, { name: 'Daniel', lang: 'en-GB' }], tts: true }, ui: { sheet: id === 'player-sheet' ? 'queue' : null, errs: null } };
  return `<div class="phone" data-fi="${fi}"><div class="sb"><span>9:41</span><span>5G</span></div><div class="app">${frame(id, ctx)}</div></div>`;
}

const AUDIT = [
  ['Tab bar on sign-in and onboarding', 'Five tabs sat under Welcome, Login and setup, where none of them work.', 'Entry and setup are focused layouts with a step bar. Tabs appear after sign-in.'],
  ['One template for 40 screens', 'Headline, two cards, green button. The calendar was text, the player was a row of dashes.', 'Each task has its own form: month grid, scrubber and transport, reading view, editable script, radio quiz.'],
  ['Slogans where titles should be', '"Make every journey a learning session" on the player. Nobody knew which screen they were on.', 'Titles name the screen or the task. Persuasion is left to the Welcome screen.'],
  ['Competing or duplicate routes', 'Explore on the home screen and in the tabs (flagged on the paper sketch). Import and export on three screens.', 'One primary action per screen. Explore lives in the tab bar. Import and export have one home each.'],
  ['Claims the data cannot support', '"3 requirements matched", "Missing skills", "Why it could fit" with no source.', 'Four kinds of evidence, each named. "Not shown yet" replaces "missing". Counts, not scores, with a plain disclaimer.'],
  ['States that were never drawn', 'Recovery showed "check your inbox" before sending. Loading, empty and failed states were notes, not screens.', 'Validation, progress, empty, failure and success are real screens with real behaviour.'],
  ['Simulated results presented as real', '"Preview completed state" implied audio existed.', 'Demo mode is labelled where it applies. The generated episode says no audio file was rendered.'],
  ['Small text and unlabeled controls', '10 to 11px captions on a gradient, 36px targets, no focus styles.', '13px minimum, 44px targets, visible focus, labels on every field, reduced motion and transparency settings.'],
];

const page = (inner) => `<section class="page">${inner}</section>`;
const cover = () => page(`<div class="b-over"><span>Stash / mobile learning app</span><span>${FI[0]} / ${FI[1]}</span></div>
  <h1 class="c-title" id="cover">${FI[1]}</h1><p class="c-lead">${ORDER.length} screens on ${BOARDS.length} boards. ${FI[2]}</p>
  <div class="c-map">${[['Start', [0, 1]], ['Learn', [2, 3]], ['Keep', [4, 5]], ['Grow', [6, 7]], ['Listen, convert', [8, 9]], ['Generate, manage', [10, 11]]].map(([k, bs]) => `<div class="r"><span class="k">${k}</span>${bs.flatMap((b) => { const ids = BOARDS[b][2]; return [[ids[0], ids[1]], [ids[2], ids[3]]].map((pair) => `<a href="#b-${b}"><b>${pair.map((i) => SCREENS[i].title).join(' · ')}</b><span>Board ${b + 1} · screens ${num(pair[0])} and ${num(pair[1])}</span></a>`); }).join('')}</div>`).join('')}</div>
  <div class="c-how"><p><b>How to read this.</b> Each board shows four phones in journey order with a design note under each. An arrow between two phones names the control that links them. ${fi === 'lofi' ? 'This sheet is for layout and flow only; links are added in the interactive wireframe.' : 'Buttons, rows and tabs inside the phones are links: they jump to the screen they open. Typing, playback and file picking need the clickable prototype.'} A "continues" tag means the screen scrolls.</p>
  <p><b>Sample content throughout.</b> Jobs, courses and episodes were written for the prototype and are labelled as sample on the screens. No real listings, customers or results are shown. <a href="#audit">Audit and changes →</a></p></div>`);
const audit = () => page(`<div class="b-over"><span>Stash / design audit</span><span>${FI[0]} / ${FI[1]}</span></div>
  <h1 class="b-title" id="audit">What the audit found, and what changed</h1><p class="b-sub">Review of the three earlier PDFs and the phase 1 paper prototype. Audience notes are working hypotheses, not research findings.</p>
  <div class="a-grid">${AUDIT.map(([t, was, now], i) => `<div class="a-item"><span class="n">${i + 1}</span><b>${t}</b><p>${was}</p><p><em>Now:</em> ${now}</p></div>`).join('')}</div>
  <div class="b-foot"><span>Hypotheses: busy learners in short sessions · people preparing for a target role · commuters who want to listen to documents</span><a href="#cover">Back to journey map</a></div>`);
const board = ([t, sub, ids], b) => page(`<div class="b-over"><span>Stash / board ${b + 1} of ${BOARDS.length}</span><span>${FI[0]} / ${FI[1]}</span></div>
  <h1 class="b-title" id="b-${b}">${String(b + 1).padStart(2, '0')} / ${t}</h1><p class="b-sub">${sub}</p>
  <div class="b-row">${ids.map((id) => `<div class="b-col" id="s-${id}" data-id="${id}"><div class="b-label"><b>${num(id)}</b><span class="nm">${esc(SCREENS[id].title)}</span></div>${phone(id)}<div class="b-note"><h3>${fi === 'lofi' ? 'Design note' : 'Interaction and behaviour'}</h3><p>${esc(SCREENS[id].note)}</p></div></div>`).join('')}</div>
  <div class="b-foot"><span>390 pt wide phone · sample content · ${FI[1].toLowerCase()}</span><span>${b > 0 ? `<a href="#b-${b - 1}">← Board ${b}</a> &nbsp; ` : ''}<a href="#cover">Journey map</a>${b < BOARDS.length - 1 ? ` &nbsp; <a href="#b-${b + 1}">Board ${b + 2} →</a>` : ''}</span></div>`);

document.getElementById('boards').innerHTML = cover() + audit() + BOARDS.map(board).join('');

// Post-render: link hot-spots, "continues" tags, arrows between linked neighbours.
document.querySelectorAll('.b-col').forEach((col) => {
  const sc = col.querySelector('.scroll');
  if (sc && sc.scrollHeight > sc.clientHeight + 12) sc.insertAdjacentHTML('afterend', '<span class="more" style="position:absolute;bottom:auto;top:' + (sc.offsetTop + sc.clientHeight - 28) + 'px">continues ↓</span>');
  col.querySelectorAll('.phone [data-go], .phone [data-act]').forEach((el) => {
    const t = target(el); if (!t || !SCREENS[t] || el.disabled) return;
    if (el.classList.contains('scrim')) return;
    el.dataset.hot = t; el.dataset.label = (el.getAttribute('aria-label') || (el.querySelector('b, .h3') || el).textContent || '').trim().replace(/\s+/g, ' ');
    if (fi === 'lofi') return;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.insertAdjacentHTML('beforeend', `<a class="hot" href="#s-${t}" aria-hidden="true" tabindex="-1"></a>${el.closest('.tabs') ? '' : `<span class="badge">${num(t)}</span>`}`);
  });
});
document.querySelectorAll('.b-row').forEach((rowEl) => {
  const cols = [...rowEl.children];
  cols.slice(0, -1).forEach((col, i) => {
    const next = cols[i + 1], id = next.dataset.id;
    const via = [...col.querySelectorAll(`[data-hot="${id}"]`)].find((e) => !e.closest('.tabs') && !e.closest('.top'));
    if (!via) return;
    const x = (col.offsetLeft + col.offsetWidth + next.offsetLeft) / 2;
    col.querySelector('.b-label').insertAdjacentHTML('beforeend', `<span class="via">${esc(via.dataset.label.length > 20 ? via.dataset.label.slice(0, 19) + '…' : via.dataset.label)} →</span>`);
    rowEl.insertAdjacentHTML('beforeend', `<div class="b-arrow" style="left:${x}px"><svg width="34" height="14" viewBox="0 0 34 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7h22M24 2.5l8 4.500-8 4.500z"/></svg></div>`);
  });
});
document.documentElement.dataset.ready = '1';

// ?export=drawio replaces the page with the draw.io XML so a headless browser can dump it.
if (new URLSearchParams(location.search).get('export') === 'drawio') {
  const { toDrawio } = await import('./drawio.js');
  await document.fonts.ready;
  const xml = toDrawio(); document.body.innerHTML = '<pre id="drawio"></pre>'; document.getElementById('drawio').textContent = xml;
}
