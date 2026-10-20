// App shell: routing, state changes, audio engine, background conversion job.
import { SCREENS, BOARDS, PRESET, frame, num } from './registry.js';
import { load, save, seed, showcase, get, set, uid, course, prog, allIdeas, episode, makePlan, makeSessions, iso } from './store.js';
import { readPdf, findSkills, buildScript, toEpisode, jobKey, download, transcriptFile, icsFile } from './services.js';
import { SAMPLE_DOC, P2P_DEFAULTS, COURSES, SKILLS } from './data.js';
import { exploreResults } from './s-learn.js';
import { fmt } from './ui.js';

let S = load();
const ui = { sheet: null, errs: null };
const synth = window.speechSynthesis || null;
const env = { now: new Date(), voices: [], tts: !!synth, dev: new URLSearchParams(location.search).has('dev') };
const $device = document.getElementById('device'), $view = document.getElementById('view'), $toast = document.getElementById('toast');
const stack = [];
let lastId = '', saveT = 0, toastT = 0, exportText = null;

// ---------- routing ----------
function route() {
  const [id, qs = ''] = location.hash.slice(2).split('?');
  return { id: SCREENS[id] ? id : S.session ? 'today' : 'welcome', q: Object.fromEntries(new URLSearchParams(qs)) };
}
function nav(r) { ui.sheet = null; ui.errs = null; const h = '#/' + r; if (location.hash === h) render(); else location.hash = h; }
window.addEventListener('hashchange', () => {
  const h = location.hash; if (stack.at(-2) === h) stack.pop(); else stack.push(h);
  ui.sheet = null; ui.errs = null; render();
});
const persist = () => { if (!save(S)) toast('Storage is full. Delete an episode or document to keep saving.'); };
const later = () => { clearTimeout(saveT); saveT = setTimeout(persist, 300); };
const commit = () => { persist(); render(); };
function toast(msg) { $toast.textContent = msg; clearTimeout(toastT); toastT = setTimeout(() => { $toast.textContent = ''; }, 3200); }

const focusKey = (el) => {
  if (!el || el === document.body || !$view.contains(el)) return null;
  const q = (v) => CSS.escape(v);
  if (el.id) return '#' + q(el.id);
  if (el.dataset.act) return `[data-act="${q(el.dataset.act)}"]${el.dataset.arg != null ? `[data-arg="${q(el.dataset.arg)}"]` : ''}`;
  if (el.dataset.go) return `[data-go="${q(el.dataset.go)}"]`;
  if (el.name) return `[name="${q(el.name)}"][value="${q(el.value)}"]`;
  if (el.dataset.change) return `[data-change="${q(el.dataset.change)}"][value="${q(el.value)}"]`;
  return null;
};
function render() {
  const r = route(), same = r.id + JSON.stringify(r.q) === lastId;
  const sc = $view.querySelector('.scroll'), y = same && sc ? sc.scrollTop : 0, fk = same ? focusKey(document.activeElement) : null;
  const hadSheet = !!$view.querySelector('.sheet');
  env.now = new Date();
  $view.innerHTML = frame(r.id, { s: S, q: r.q, env, ui });
  $device.dataset.solid = S.a11y.solid; $device.dataset.calm = S.a11y.calm; $device.style.setProperty('--ts', S.a11y.text);
  const ns = $view.querySelector('.scroll'); if (ns) ns.scrollTop = y;
  const sheet = $view.querySelector('.sheet');
  if (sheet && !hadSheet) sheet.querySelector('h2')?.focus();
  else if (fk) { try { $view.querySelector(fk)?.focus({ preventScroll: true }); } catch { /* selector no longer valid */ } }
  else if (!same) ($view.querySelector('h1, legend.h1') || $view).focus({ preventScroll: true });
  if (sheet && hadSheet) sheet.style.animation = 'none', sheet.parentElement.style.animation = 'none';
  lastId = r.id + JSON.stringify(r.q);
  document.title = SCREENS[r.id].title + ' · Stash';
  document.querySelectorAll('#index a').forEach((a) => a.toggleAttribute('aria-current', a.dataset.id === r.id));
}

// ---------- helpers ----------
const today = () => iso(new Date());
const email = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '');
const toggleIn = (arr, v) => { const i = arr.indexOf(v); if (i < 0) arr.push(v); else arr.splice(i, 1); };
const parse = (v) => { try { return JSON.parse(v); } catch { return v; } };
const P = () => S.player;
const curEp = () => episode(S, P().ep);
const p2p = () => (S.draft.p2p ??= {});
const curDoc = () => S.docs.find((d) => d.id === p2p().docId);
const curScript = () => S.scripts.find((x) => x.id === p2p().scriptId);
function draftImport(text, source) {
  const parts = text.split(/\n\s*\n/).map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
  S.draft.import = { ...(S.draft.import || {}), text, title: (parts[0] || 'Untitled').slice(0, 60), ideas: parts.slice(0, 12).map((x) => x.slice(0, 220)), tags: [], source };
}

// ---------- audio engine (device voice; no audio files) ----------
let token = 0, segStart = 0, tickT = 0;
function loadVoices() { env.voices = synth ? synth.getVoices().filter((v) => v.lang.startsWith('en')).slice(0, 12).map((v) => ({ name: v.name, lang: v.lang })) : []; }
if (synth) { loadVoices(); synth.onvoiceschanged = () => { loadVoices(); if (route().id === 'p2p-config') render(); }; }
function spoken(ep, sg) { let t = sg.text; for (const p of ep.pron || []) if (p.from) t = t.split(p.from).join(p.to); return t; }
function utter(text, o = {}) {
  const u = new SpeechSynthesisUtterance(text); u.rate = o.rate || 1; u.pitch = o.emph ? 1.2 : 1; u.lang = 'en';
  const all = synth.getVoices(), en = all.filter((v) => v.lang.startsWith('en'));
  u.voice = all.find((v) => v.name === o.voice) || (o.second && en[1]) || en[0] || null; return u;
}
function speak() {
  const ep = curEp(), sg = ep?.segments[P().seg]; const my = ++token; clearInterval(tickT);
  if (!sg) return ended();
  segStart = performance.now() - ((P().t - sg.t) / P().rate) * 1000;
  if (synth) {
    synth.cancel();
    const u = utter(spoken(ep, sg), { rate: P().rate, emph: sg.emph, voice: ep.voices?.[sg.speaker], second: sg.speaker === 'B' });
    u.onend = () => { if (my === token && P().playing) advance(); };
    synth.speak(u);
  }
  tickT = setInterval(() => {
    if (my !== token) return;
    const el = ((performance.now() - segStart) / 1000) * P().rate;
    P().t = sg.t + Math.min(sg.d, el); patchPlayer();
    if (P().sleep?.at && Date.now() > P().sleep.at) { P().sleep = null; pause(); toast('Sleep timer ended. Paused.'); return render(); }
    if (!synth && el >= sg.d) advance();
  }, 250);
}
function advance() { const ep = curEp(); P().seg++; if (P().seg >= ep.segments.length) return ended(); P().t = ep.segments[P().seg].t; later(); patchPlayer(true); speak(); }
function ended() {
  token++; clearInterval(tickT); synth?.cancel(); const p = P();
  const nextId = p.sleep?.v === 'end' ? null : p.queue.shift(); p.sleep = p.sleep?.v === 'end' ? null : p.sleep;
  if (nextId && episode(S, nextId)) { Object.assign(p, { ep: nextId, seg: 0, t: 0, playing: true }); speak(); }
  else { p.playing = false; p.seg = 0; p.t = 0; }
  commit();
}
function pause() { token++; clearInterval(tickT); synth?.cancel(); P().playing = false; persist(); }
function seekTo(t) {
  const ep = curEp(); if (!ep) return; t = Math.max(0, Math.min(ep.duration - 1, +t));
  let i = ep.segments.findIndex((g) => t < g.t + g.d); if (i < 0) i = ep.segments.length - 1;
  P().seg = i; P().t = ep.segments[i].t; if (P().playing) speak(); patchPlayer(true); later();
}
function patchPlayer(segChanged) {
  const ep = curEp(); if (!ep) return;
  $view.querySelectorAll('[data-p="cur"]').forEach((e) => { e.textContent = fmt(P().t); });
  $view.querySelectorAll('[data-p="bar"]').forEach((e) => { e.style.transform = `scaleX(${P().t / ep.duration})`; });
  const r = $view.querySelector('[data-p="range"]'); if (r && document.activeElement !== r) { r.value = Math.round(P().t); r.setAttribute('aria-valuetext', `${fmt(P().t)} of ${fmt(ep.duration)}`); }
  if (segChanged) $view.querySelectorAll('[data-seg]').forEach((e) => { const on = +e.dataset.seg === P().seg; e.classList.toggle('now', on); if (on && P().playing) e.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
}
function play(id) { const p = P(); if (p.ep !== id) Object.assign(p, { ep: id, seg: 0, t: 0 }); p.playing = true; speak(); persist(); }

// ---------- conversion job (simulated provider; real state machine) ----------
let jobT = 0;
function runJob(j) {
  clearInterval(jobT);
  jobT = setInterval(() => {
    if (j.status !== 'running') return clearInterval(jobT);
    j.progress = Math.min(1, j.progress + 0.03); j.stage = Math.min(3, Math.floor(j.progress * 4));
    if (S.demo.failNext && j.progress >= 0.6) { Object.assign(j, { status: 'failed', error: 'voice' }); S.demo.failNext = false; clearInterval(jobT); persist(); toast('Generation stopped. Your script is saved.'); return route().id === 'p2p-generate' ? nav('p2p-error') : render(); }
    if (j.progress >= 1) {
      clearInterval(jobT); const sc = S.scripts.find((x) => x.id === j.scriptId), doc = S.docs.find((d) => d.id === sc.docId);
      const ep = toEpisode(sc, doc); S.episodes = S.episodes.filter((e) => e.id !== ep.id); S.episodes.unshift(ep);
      Object.assign(j, { status: 'done', stage: 4, episodeId: ep.id }); persist(); toast('Episode ready: ' + ep.title); return render();
    }
    later(); if (['p2p-generate', 'today', 'stash'].includes(route().id) && !ui.sheet) render();
  }, 260);
}

// ---------- actions ----------
const ACT = {
  back(fallback) {
    if (stack.length < 2) return nav(fallback || 'today');
    const want = stack.at(-2); history.back();
    // Browsers may skip history entries made without a user gesture. If back did not land where expected, go there directly.
    setTimeout(() => { if (location.hash !== want) { stack.length = 0; location.replace(location.pathname + location.search + '#/' + (fallback || 'today')); } }, 350);
  },
  go: nav,
  set(arg) { const i = arg.indexOf('='); set(S, arg.slice(0, i), parse(arg.slice(i + 1))); commit(); },
  toggle(path) { set(S, path, !get(S, path)); commit(); },
  'toggle-default-on'(path) { set(S, path, get(S, path) === false); commit(); },
  'toggle-in'(arg) { const [path, v] = arg.split('|'); if (!Array.isArray(get(S, path))) set(S, path, []); toggleIn(get(S, path), v); commit(); },
  sheet(name) { ui.sheet = name; render(); },
  'sheet-close'() { ui.sheet = null; render(); },

  'start-create'() { nav('signin?new=1'); },
  guest() { S.session = { kind: 'guest' }; persist(); nav('today'); },
  signin(mode) {
    const f = S.draft.signin || {}, e = {};
    if (!email(f.email)) e.email = 'Enter an email like name@example.com';
    if ((f.pw || '').length < 8) e.pw = 'Use 8 characters or more';
    if (e.email || e.pw) { ui.errs = e; return render(); }
    S.session = { kind: 'account', email: f.email }; delete S.draft.signin; persist();
    nav(mode === 'new' || !S.profile.onboarded ? 'ob-goal' : 'today');
  },
  recover() { const f = (S.draft.recover ??= {}); if (!email(f.email)) { ui.errs = { email: 'Enter an email like name@example.com' }; return render(); } f.sent = true; commit(); },
  signout() { pause(); S.player.ep = null; S.session = null; persist(); nav('welcome'); },
  'ob-next'(to) { if (S.profile.mode === 'career' && !S.profile.goal.role.trim()) return toast('Add a target role, or choose "Just curious".'); if (to === 'growth') { S.plan = null; toast('Goal saved'); } persist(); nav(to); },
  'ob-finish'() { const p = S.profile; p.onboarded = true; if (p.mode === 'career') { S.plan = makePlan(S); S.sessions = makeSessions(S); } persist(); nav('today'); toast('Your Today is ready'); },
  'rhythm-save'() { S.sessions = [...S.sessions.filter((x) => x.done), ...makeSessions(S)]; persist(); nav('calendar'); toast('Sessions rescheduled'); },
  'set-career'() { S.profile.mode = 'career'; persist(); nav('ob-goal?edit=1'); },
  showcase() { pause(); S = showcase(); persist(); nav('today'); toast('Showcase data loaded'); },
  wipe() { pause(); localStorage.removeItem('stash.v2'); S = seed(); nav('welcome'); toast('All data deleted from this browser'); },

  save(key) { toggleIn(S.saved, key); commit(); toast(S.saved.includes(key) ? 'Saved to My Stash' : 'Removed from My Stash'); },
  dismiss(key) { if (!S.dismissed.includes(key)) S.dismissed.push(key); persist(); toast('Hidden. Suggestions will skip it.'); const t = key.split(':')[0]; if (t === 'job') nav('jobs'); else if (t === 'skill') nav('gaps'); else { ui.sheet = null; render(); } },
  undismiss() { S.dismissed = []; commit(); },
  surprise() { const cur = route().q.id; const pool = allIdeas().filter((i) => i.id !== cur); const out = pool.filter((i) => !S.profile.interests.includes(i.course.topic)); const pick = (out.length ? out : pool)[Math.floor(Math.random() * (out.length || pool.length))]; nav('surprise?id=' + pick.id); },
  'text-size'() { const o = [1, 1.12, 1.25]; S.a11y.text = o[(o.indexOf(S.a11y.text) + 1) % 3]; commit(); toast('Text size: ' + ['Default', 'Large', 'Larger'][o.indexOf(S.a11y.text)]); },
  'idea-go'(arg) {
    const [cid, n] = arg.split('|'), c = course(cid), i = +n, p = (S.progress[cid] ??= { idea: 0, done: [] }), from = route().q.i | 0;
    if (i > from && !p.done.includes(c.ideas[from].id)) p.done.push(c.ideas[from].id);
    p.idea = Math.min(i, c.ideas.length - 1); persist();
    nav(i >= c.ideas.length ? 'takeaway?c=' + cid : `reader?c=${cid}&i=${i}`);
  },
  'takeaway-save'(cid) { const d = typeof S.draft.takeaway === 'object' && S.draft.takeaway ? S.draft.takeaway : {}; const learned = (d.learned || '').trim(), apply = (d.apply || '').trim(); if (!learned) { ui.errs = { learned: 'Write what you learned in a sentence, or tap Skip' }; return render(); } S.takeaways.unshift({ id: uid('t'), course: cid, learned, apply, date: today() }); S.draft.takeaway = null; persist(); nav('quiz?c=' + cid); },
  'takeaway-del'(id) { S.takeaways = S.takeaways.filter((t) => t.id !== id); commit(); },
  'quiz-check'(cid) { const c = course(cid), p = (S.progress[cid] ??= { idea: 0, done: [] }), pick = S.draft.quizPick; if (pick == null) return; p.quiz = { choice: pick, tries: (p.quiz?.tries || 0) + 1, correct: pick === c.quiz.answer }; commit(); },
  'course-complete'(cid) { S.progress[cid].completedAt = today(); S.draft.quizPick = null; persist(); nav('complete?c=' + cid); },

  'self-add'(k) { if (!S.profile.selfSkills.includes(k)) S.profile.selfSkills.push(k); commit(); toast(`${SKILLS[k]} added as self-reported`); },
  'evidence-save'() {
    const f = { skill: route().q.skill || 'forecasting', date: today(), ...(S.draft.evidence || {}) }, e = {};
    if (!(f.title || '').trim()) e.title = 'Give the project a short title';
    if ((f.note || '').trim().length < 20) e.note = 'Describe what you did in a sentence or two';
    if (f.link && !/^https?:\/\/\S+\.\S+/.test(f.link)) e.link = 'Use a full link starting with https://';
    if (Object.keys(e).length) { ui.errs = e; return render(); }
    S.evidence.unshift({ id: uid('e'), skill: f.skill, title: f.title.trim(), note: f.note.trim(), link: f.link || '', date: f.date, kind: 'project' }); S.draft.evidence = null; persist();
    nav('skill?id=' + f.skill); toast('Project evidence saved');
  },
  'plan-create'() { S.plan = makePlan(S); S.sessions = [...S.sessions.filter((x) => x.done), ...makeSessions(S)]; persist(); nav('plan'); toast('Study plan built from your open skills'); },
  'session-add'(date) { S.sessions.push({ id: uid('s'), date, time: S.profile.prefs.time, minutes: S.profile.prefs.minutes, title: 'Study session', done: false }); commit(); },
  'session-del'(id) { S.sessions = S.sessions.filter((x) => x.id !== id); commit(); },
  ics() { if (!S.sessions.length) return toast('No sessions to export yet.'); download('stash-study-sessions.ics', icsFile(S.sessions), 'text/calendar'); toast('Calendar file downloaded'); },

  'import-text'() { const t = (S.draft.import?.text || '').trim(); if (!t) { ui.errs = { text: 'Paste some text, or choose a file below' }; return render(); } if (t.length > 20000) { ui.errs = { text: `That is ${t.length.toLocaleString()} characters. The limit is 20,000.` }; return render(); } draftImport(t, 'Pasted text'); persist(); nav('import-review'); },
  'import-idea-del'(n) { S.draft.import.ideas.splice(+n, 1); commit(); },
  'import-save'() { const f = S.draft.import; if (!(f.title || '').trim()) { ui.errs = { title: 'Add a title' }; return render(); } S.imports.unshift({ id: uid('im'), title: f.title.trim(), tags: f.tags || [], ideas: f.ideas.filter((x) => x.trim()), source: f.source, date: today() }); S.draft.import = null; S.draft.stashTab = 'imported'; persist(); nav('stash'); toast('Saved to My Stash'); },
  'import-del'(id) { S.imports = S.imports.filter((m) => m.id !== id); commit(); toast('Import deleted'); },
  'export-run'() { const x = { what: ['takeaways', 'imports', 'progress', 'evidence'], format: 'md', ...(S.draft.export || {}) }; const out = buildExport(x); exportText = out.text; S.draft.exportFile = { name: out.name, size: new Blob([out.text]).size, records: out.records, type: out.type }; persist(); nav('export-done'); },
  'export-download'() { const f = S.draft.exportFile; if (!f) return nav('export'); if (exportText == null) exportText = buildExport({ what: ['takeaways', 'imports', 'progress', 'evidence'], format: 'md', ...(S.draft.export || {}) }).text; download(f.name, exportText, f.type); toast('Downloaded ' + f.name); },

  'p2p-sample'() { if (!S.docs.some((d) => d.id === SAMPLE_DOC.id)) S.docs.push(structuredClone(SAMPLE_DOC)); S.draft.p2p = { status: 'ready', docId: SAMPLE_DOC.id, cfg: { ...P2P_DEFAULTS }, keepText: p2p().keepText }; commit(); },
  'p2p-clear'() { S.draft.p2p = {}; commit(); },
  'p2p-all'(on) { curDoc()?.pages.forEach((p) => { p.include = !!+on && !!p.text.trim() && p.flag !== 'scanned'; }); commit(); },
  'p2p-ocr'() { toast('OCR is not connected. Type the text in, or leave the page out.'); },
  'p2p-script'() {
    const doc = curDoc() || S.docs[0]; if (!doc) return nav('p2p-upload');
    const cfg = { ...P2P_DEFAULTS, ...(p2p().cfg || {}) };
    const sc = buildScript(doc, cfg); S.scripts.push(sc); if (S.scripts.length > 6) S.scripts.shift();
    Object.assign(p2p(), { docId: doc.id, scriptId: sc.id, cfg }); persist(); nav('p2p-script');
  },
  'seg-del'(n) { curScript().segments.splice(+n, 1); commit(); },
  'seg-emph'(n) { const g = curScript().segments[+n]; g.emph = !g.emph; commit(); },
  'pron-add'() { const d = S.draft.pron || {}; if (!(d.from || '').trim() || !(d.to || '').trim()) return toast('Fill in both boxes.'); curScript().pron.push({ from: d.from.trim(), to: d.to.trim() }); S.draft.pron = {}; commit(); },
  'pron-del'(n) { curScript().pron.splice(+n, 1); commit(); },
  say(n) { const sc = curScript(), g = sc.segments[+n]; if (!synth) return toast('This browser has no speech voice.'); pause(); render(); synth.speak(utter(spoken(sc, g), { emph: g.emph, voice: g.speaker === 'B' ? sc.config.voiceB : sc.config.voiceA, second: g.speaker === 'B' })); },
  'p2p-generate'() {
    const sc = curScript(); if (!sc) return nav('p2p-script'); sc.approved = true; const key = jobKey(sc);
    let j = S.jobs.find((x) => x.key === key);
    if (j?.status === 'done' && S.episodes.some((e) => e.id === j.episodeId)) { toast('Already generated from this exact script. Opening it.'); return nav('p2p-episode?id=' + j.episodeId); }
    if (j?.status === 'running') return nav('p2p-generate');
    if (j) Object.assign(j, { status: 'running', attempts: j.attempts + 1, progress: 0, stage: 0, error: null, scriptId: sc.id });
    else { j = { id: uid('job'), key, scriptId: sc.id, status: 'running', stage: 0, progress: 0, attempts: 1, error: null, episodeId: null }; S.jobs.push(j); }
    persist(); runJob(j); nav('p2p-generate');
  },
  'job-cancel'() { const j = S.jobs.find((x) => x.status === 'running'); if (j) j.status = 'cancelled'; clearInterval(jobT); ui.sheet = null; commit(); toast('Generation cancelled. Script kept.'); },
  'job-retry'() { const j = S.jobs.find((x) => x.status === 'failed'); if (!j) return nav('p2p-script'); Object.assign(j, { status: 'running', attempts: j.attempts + 1, progress: j.stage * 0.25, error: null }); p2p().scriptId = j.scriptId; persist(); runJob(j); nav('p2p-generate'); },
  'ep-del'(id) { if (P().ep === id) { pause(); P().ep = null; } S.episodes = S.episodes.filter((e) => e.id !== id); S.jobs = S.jobs.filter((j) => j.episodeId !== id); S.saved = S.saved.filter((k) => k !== 'episode:' + id); P().queue = P().queue.filter((q) => q !== id); S.draft.stashTab = 'audio'; persist(); nav('stash'); toast('Episode deleted'); },
  dl(arg) { const [id, f] = arg.split('|'), e = episode(S, id); download(`${e.title.replace(/\W+/g, '-').toLowerCase()}-transcript.${f}`, transcriptFile(e, f), f === 'vtt' ? 'text/vtt' : 'text/plain'); ui.sheet = null; render(); toast('Transcript downloaded'); },

  play(id) { play(id); nav('player'); },
  pp() { if (!curEp()) return; if (P().playing) pause(); else { P().playing = true; speak(); } render(); },
  stop() { pause(); P().ep = null; commit(); },
  skip(d) { seekTo(P().t + +d); },
  'seek-seg'(arg) { const [id, n] = arg.split('|'); if (P().ep !== id) Object.assign(P(), { ep: id }); const ep = curEp(); P().seg = +n; P().t = ep.segments[+n].t; P().playing = true; speak(); commit(); },
  rate() { const o = [0.8, 1, 1.25, 1.5, 2]; P().rate = o[(o.indexOf(P().rate) + 1) % o.length]; if (P().playing) speak(); commit(); },
  sleep(v) { P().sleep = v === '0' ? null : { v, at: v === 'end' ? null : Date.now() + +v * 60000 }; commit(); toast(v === '0' ? 'Sleep timer off' : v === 'end' ? 'Stops after this episode' : `Stops in ${v} minutes`); },
  'queue-add'(id) { if (P().ep === id || P().queue.includes(id)) return toast('Already playing or queued'); P().queue.push(id); ui.sheet = null; commit(); toast('Added to queue'); },
  'queue-del'(id) { P().queue = P().queue.filter((q) => q !== id); commit(); },
};

const CHANGE = {
  async resume(el) {
    const f = el.files[0]; if (!f) return;
    const base = { name: f.name, size: f.size };
    if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') { S.profile.resume = { ...base, read: false }; return commit(); }
    S.profile.resume = { ...base, status: 'reading', done: 0, total: 0 }; render();
    try {
      const pages = await readPdf(f, (done, total) => { Object.assign(S.profile.resume, { done, total }); render(); });
      S.profile.resume = { ...base, read: true, found: findSkills(pages.map((p) => p.text).join(' ')) };
    } catch (e) { S.profile.resume = { ...base, read: false, error: ({ size: 'The file is over 25 MB.', locked: 'The PDF is password protected.', empty: 'No text was found; it may be a scan.', engine: 'The PDF reader did not load. Check your connection.' })[e.code] || 'The file could not be read as a PDF.' }; }
    commit();
  },
  'quiz-pick'(el) { S.draft.quizPick = +el.value; const cid = route().q.c, p = S.progress[cid]; if (p?.quiz && !p.quiz.correct) p.quiz = { tries: p.quiz.tries }; commit(); },
  'export-what'(el) { const x = (S.draft.export ??= {}); x.what ??= ['takeaways', 'imports', 'progress', 'evidence']; toggleIn(x.what, el.value); commit(); },
  'session-done'(el) { const x = S.sessions.find((q) => q.id === el.value); if (x) x.done = el.checked; commit(); },
  'p2p-page'(el) { const p = curDoc()?.pages[+el.value - 1]; if (p) p.include = el.checked; commit(); },
  async 'import-file'(el) {
    const f = el.files[0]; if (!f) return;
    if (!/\.(txt|md|markdown)$/i.test(f.name)) return nav('import-error?reason=type');
    if (f.size > 200 * 1024) return nav('import-error?reason=size');
    let t; try { t = await f.text(); } catch { return nav('import-error?reason=read'); }
    if (!t.trim()) return nav('import-error?reason=empty');
    draftImport(t.slice(0, 20000), f.name); S.draft.import.title = f.name.replace(/\.\w+$/, ''); persist(); nav('import-review');
  },
  async 'p2p-pick'(el) {
    const f = el.files[0]; if (!f) return; const keepText = p2p().keepText;
    S.draft.p2p = { status: 'reading', name: f.name, size: f.size, done: 0, total: 0, keepText }; render();
    let lastPaint = 0;
    try {
      const pages = await readPdf(f, (done, total) => { Object.assign(p2p(), { done, total }); if (performance.now() - lastPaint > 120 && route().id === 'p2p-upload') { lastPaint = performance.now(); render(); } });
      const doc = { id: uid('doc'), title: f.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' '), name: f.name, size: f.size, pages, sample: false, extractor: 'pdfjs', addedAt: today(), keepText: keepText !== false };
      S.docs.push(doc); if (S.docs.length > 4) S.docs.shift();
      S.draft.p2p = { status: 'ready', docId: doc.id, cfg: { ...P2P_DEFAULTS }, keepText };
    } catch (e) { S.draft.p2p = { status: 'error', error: e.code || 'notpdf', keepText }; }
    commit();
  },
};

function buildExport(x) {
  const data = {}; const has = (k) => x.what.includes(k);
  if (has('takeaways')) data.takeaways = S.takeaways.map((t) => ({ course: course(t.course).title, text: (t.learned || t.text) + (t.apply ? ` Use it: ${t.apply}` : ''), date: t.date }));
  if (has('imports')) data.imports = S.imports;
  if (has('saved')) data.saved = S.saved;
  if (has('progress')) data.progress = Object.entries(S.progress).map(([id, p]) => ({ course: course(id).title, ideasRead: p.done.length, completedAt: p.completedAt || '' }));
  if (has('evidence')) data.evidence = S.evidence.map((e) => ({ skill: SKILLS[e.skill], title: e.title, note: e.note, link: e.link, date: e.date, kind: 'project, self-submitted' }));
  if (has('transcripts')) data.transcripts = S.episodes.map((e) => ({ title: e.title, text: transcriptFile(e, 'txt') }));
  const records = Object.values(data).reduce((a, v) => a + v.length, 0);
  if (x.format === 'json') return { name: 'stash-export.json', type: 'application/json', records, text: JSON.stringify({ exported: new Date().toISOString(), ...data }, null, 2) };
  if (x.format === 'csv') { const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`; const rows = [['type', 'title', 'detail', 'date']]; for (const [k, list] of Object.entries(data)) for (const r of list) rows.push(typeof r === 'string' ? [k, r, '', ''] : [k, r.title || r.course || r.skill || '', r.text || r.note || (r.ideas || []).join(' | ') || r.ideasRead || '', r.date || r.completedAt || '']); return { name: 'stash-export.csv', type: 'text/csv', records, text: rows.map((r) => r.map(q).join(',')).join('\n') }; }
  let md = `# Stash export\n\n${new Date().toDateString()}\n`;
  for (const [k, list] of Object.entries(data)) { md += `\n## ${k[0].toUpperCase() + k.slice(1)}\n\n`; for (const r of list) md += typeof r === 'string' ? `- ${r}\n` : k === 'transcripts' ? `### ${r.title}\n\n${r.text}\n` : `- **${r.title || r.course || r.skill}**${r.date || r.completedAt ? ` (${r.date || r.completedAt})` : ''}: ${r.text || r.note || (r.ideas || []).join('; ') || (r.ideasRead != null ? r.ideasRead + ' ideas read' : '')}\n`; }
  return { name: 'stash-export.md', type: 'text/markdown', records, text: md };
}

// ---------- events ----------
$view.addEventListener('click', (e) => {
  const el = e.target.closest('[data-go],[data-act]'); if (!el || el.disabled) return;
  if (el.classList.contains('scrim') && e.target !== el) return;
  if (el.dataset.act) ACT[el.dataset.act]?.(el.dataset.arg, el);
  if (el.dataset.go) nav(el.dataset.go);
});
$view.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.bind && el.type !== 'file') { set(S, el.dataset.bind, el.value); later(); }
  if (el.dataset.input === 'search') { const r = $view.querySelector('#results'); if (r) r.innerHTML = exploreResults({ s: S }); }
  if (el.dataset.input === 'seek') seekTo(el.value);
});
$view.addEventListener('change', (e) => { const el = e.target; if (el.dataset.change) CHANGE[el.dataset.change]?.(el); if (el.dataset.bind && el.tagName === 'SELECT') { set(S, el.dataset.bind, el.value); persist(); } });
$view.addEventListener('submit', (e) => { e.preventDefault(); ACT[e.target.dataset.submit]?.(e.target.querySelector('[data-act="signin"]')?.dataset.arg); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && ui.sheet) { ui.sheet = null; render(); }
  if (e.key === 'Tab' && ui.sheet) { const f = [...$view.querySelectorAll('.sheet button:not([disabled])')]; if (!f.length) return; const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus(); } else if (!e.shiftKey && (i === f.length - 1 || i < 0)) { e.preventDefault(); f[0].focus(); } }
});
window.addEventListener('beforeunload', () => { synth?.cancel(); save(S); });

// ---------- prototype guide (desktop only) ----------
const $index = document.getElementById('index');
if ($index) {
  $index.innerHTML = BOARDS.map(([t, , ids], b) => `<li><span>${b + 1}. ${t}</span><ul>${ids.map((id) => `<li><a href="#/${id}${PRESET[id] ? '?' + PRESET[id] : ''}" data-id="${id}">${num(id)} ${SCREENS[id].title}</a></li>`).join('')}</ul></li>`).join('');
  document.querySelectorAll('[data-fi-set]').forEach((b) => b.addEventListener('click', () => { $device.dataset.fi = b.dataset.fiSet; document.querySelectorAll('[data-fi-set]').forEach((x) => x.setAttribute('aria-pressed', x === b)); }));
  document.getElementById('g-showcase').addEventListener('click', () => ACT.showcase());
  document.getElementById('g-reset').addEventListener('click', () => ACT.wipe());
}
const fi = new URLSearchParams(location.search).get('fi'); if (fi) $device.dataset.fi = fi;

stack.push(location.hash);
const running = S.jobs.find((j) => j.status === 'running'); if (running) runJob(running);
render();
