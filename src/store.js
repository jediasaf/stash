// User state: one JSON document in localStorage. Selectors below derive everything shown about skills and jobs.
import { COURSES, JOBS, SAMPLE_EPISODES, SAMPLE_DOC, SKILLS, P2P_DEFAULTS, CHECK_PASS, CHECKS } from './data.js';
import { buildScript, toEpisode, jobKey } from './services.js';

const KEY = 'stash.v2';

export function seed() {
  return {
    v: 2,
    session: null, // {kind:'account'|'guest', email}
    profile: { name: '', mode: 'career', goal: { role: 'Trust & Safety Data Scientist', location: 'Singapore', level: 'Intermediate' }, current: '', interests: ['Data'], prefs: { minutes: 15, format: 'both', days: ['Mon', 'Wed', 'Fri'], time: '19:30', reminders: false }, selfSkills: [], resume: null, onboarded: false },
    a11y: { text: 1, solid: false, calm: false },
    progress: {}, // courseId -> {idea, done[], quiz:{choice,tries,correct}, completedAt}
    takeaways: [], evidence: [], saved: [], imports: [], dismissed: [], checks: {}, live: null, sync: null, log: [],
    plan: null, sessions: [],
    docs: [], scripts: [], jobs: [], episodes: [],
    player: { ep: null, seg: 0, t: 0, playing: false, rate: 1, sleep: null, queue: [] },
    draft: {}, demo: { failNext: false },
  };
}

/** A filled-in state used for the PDF boards and the "Load showcase data" control. */
export function showcase() {
  const s = seed();
  s.session = { kind: 'account', email: 'andi@example.com' };
  // Persona: Andi Pasca Hasanuddin. Role, skills and studies come from his LinkedIn profile export (Profile.pdf, Oct 2026).
  // Progress, takeaways and the evidence entry below are demo activity, not his real work.
  Object.assign(s.profile, { name: 'Andi', current: 'Rapid Response Analyst, TikTok', onboarded: true, selfSkills: ['python', 'sql', 'policy', 'communication'], interests: ['Trust & Safety', 'Data'] });
  s.profile.resume = { name: 'Profile.pdf', size: 52019, read: true, found: [
    { skill: 'python', snippet: '…Top Skills Python (Programming Language) PostgreSQL…' }, { skill: 'sql', snippet: '…Python (Programming Language) PostgreSQL Interpersonal Skills…' },
    { skill: 'policy', snippet: '…at the front lines of content moderation, manually reviewing…' }, { skill: 'ml', snippet: '…developing sophisticated detection methods that scaled…' },
    { skill: 'communication', snippet: '…PostgreSQL Interpersonal Skills Languages…' }] };
  s.progress = { detect: { idea: 1, done: ['x1'] }, decisions: { idea: 2, done: ['d1', 'd2', 'd3'], quiz: { choice: 1, tries: 1, correct: true }, completedAt: '2026-10-06' } };
  s.takeaways = [{ id: 't1', course: 'decisions', learned: 'Lead with the decision; the method comes after.', apply: 'Put the recommendation in the first line of my Friday update.', date: '2026-10-06' }];
  s.evidence = [{ id: 'e1', skill: 'sql', proof: 'project', title: 'Sample entry: weekly enforcement report', link: '', note: 'Demo entry for the prototype. Shows how a SQL report built at work would be recorded as proof.', date: '2026-10-02', kind: 'project' }];
  s.checks = { policy: { score: 4, total: 4, date: '2026-10-14' } };
  s.saved = ['idea:x2', 'idea:d3', 'course:sql', 'episode:ep-baseline'];
  s.imports = [{ id: 'im1', title: 'Workshop notes', tags: ['Careers'], ideas: ['Start with the decision', 'Show one example', 'Explain uncertainty'], source: 'Pasted text', date: '2026-10-08' }];
  s.plan = makePlan(s);
  s.sessions = makeSessions(s, new Date('2026-10-12T09:00:00'));
  const doc = structuredClone(SAMPLE_DOC);
  const script = buildScript(doc, { ...P2P_DEFAULTS });
  script.approved = true;
  script.pron = [{ from: 'MAPE', to: 'mape' }];
  const ep = toEpisode(script, doc);
  s.docs = [doc]; s.scripts = [script]; s.episodes = [ep];
  s.jobs = [{ id: 'job1', key: jobKey(script), scriptId: script.id, status: 'done', stage: 4, progress: 1, attempts: 1, error: null, episodeId: ep.id }];
  s.player = { ep: ep.id, seg: 4, t: ep.segments[4].t + 2, playing: false, rate: 1, sleep: null, queue: ['ep-baseline'] };
  s.draft = { p2p: { status: 'ready', docId: doc.id, scriptId: script.id, cfg: { ...P2P_DEFAULTS } } };
  return s;
}

export function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 2) { s.player.playing = false; if (s.profile.goal.level === 'Mid') s.profile.goal.level = 'Intermediate'; if (typeof s.draft.takeaway === 'string') s.draft.takeaway = null; return s; } } catch { /* fall through */ }
  return seed();
}
export function save(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s, (k, v) => (k === 'pw' ? undefined : v))); return true; } catch { return false; }
}
export const get = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
export function set(o, path, v) {
  const ks = path.split('.'); const last = ks.pop();
  const t = ks.reduce((a, k) => (a[k] ??= /^\d+$/.test(k) ? [] : {}), o); t[last] = v;
}
export const uid = (p) => p + Math.random().toString(36).slice(2, 8);

// ---------- selectors ----------
export const course = (id) => COURSES.find((c) => c.id === id) || COURSES[0];
export const job = (id, s) => JOBS.find((j) => j.id === id) || s?.live?.jobs?.find((j) => j.id === id) || JOBS[0];
export const prog = (s, id) => s.progress[id] || { idea: 0, done: [] };
export const goalJob = (s) => JOBS.find((j) => j.title === s.profile.goal.role) || null;

/** Evidence on file for one skill, split by kind. "assessed" is always empty: Stash runs no assessments yet. */
export function evidenceFor(s, skill) {
  const self = s.profile.selfSkills.includes(skill);
  const learning = COURSES.filter((c) => c.skills.includes(skill) && s.progress[c.id]?.completedAt);
  const project = s.evidence.filter((e) => e.skill === skill);
  const c = (s.checks || {})[skill]; const assessed = c && c.score >= CHECK_PASS ? [c] : [];
  const best = project.length ? 'project' : assessed.length ? 'assessed' : learning.length ? 'learning' : self ? 'self' : 'none';
  return { self, learning, project, assessed, best };
}
export const KIND = { project: 'Proof added', assessed: 'Passed skill check', learning: 'Completed learning', self: 'Self-reported', none: 'Not shown yet' };
export const PROOF = { project: 'Project', certificate: 'Certificate', sample: 'Work sample' };

export function coverage(s, j) {
  const rows = j.requirements.map((r) => ({ ...r, ev: evidenceFor(s, r.skill) }));
  return { rows, have: rows.filter((r) => r.ev.best !== 'none').length, total: rows.length };
}
/** Skills the goal role lists where the user has no project evidence yet, weakest first. */
export function gaps(s) {
  const j = goalJob(s); if (!j) return [];
  const order = { none: 0, self: 1, learning: 2 };
  return j.requirements.map((r) => ({ ...r, ev: evidenceFor(s, r.skill) }))
    .filter((r) => r.ev.best !== 'project' && r.ev.best !== 'assessed' && !s.dismissed.includes('skill:' + r.skill))
    .sort((a, b) => order[a.ev.best] - order[b.ev.best]);
}
export const courseFor = (skill) => COURSES.find((c) => c.skills.includes(skill));
/** The single most useful action for one unproven skill: a quick check first, then a course, then proof. */
export function moveFor(s, skill) {
  const c = courseFor(skill);
  if (CHECKS[skill] && !(s.checks || {})[skill]) return { label: 'Take the 2-minute check', go: 'check?skill=' + skill, how: 'A short check is the quickest way to show it.' };
  if (c && !s.progress[c.id]?.completedAt) return { label: `Start ${c.title}`, go: 'course?id=' + c.id, how: `${c.title} covers it in ${c.minutes} minutes.` };
  return { label: 'Add proof', go: 'evidence?skill=' + skill, how: 'Add a project, certificate or work sample that shows it.' };
}
/** One next step for the whole career journey, used by Today and Growth. */
export function nextMove(s) {
  if (s.profile.mode !== 'career') return null;
  if (!goalJob(s)) return { kind: 'goal', title: 'Pick a target role to compare with', sub: 'Stash has listings to compare for the roles it suggests.', label: 'Edit my goal', go: 'ob-goal?edit=1' };
  const g = gaps(s);
  if (g.length) { const r = g[0]; return { kind: 'skill', skill: r.skill, title: `Prove ${SKILLS[r.skill]}`, sub: `${s.profile.goal.role} needs it. ${r.ev.best === 'none' ? 'Nothing shown yet.' : `${KIND[r.ev.best]} so far.`}`, ...moveFor(s, r.skill) }; }
  return { kind: 'roles', title: 'Look at live roles', sub: 'Every skill your target role lists is proven.', label: 'See roles', go: 'jobs' };
}

export function makePlan(s) {
  const g = gaps(s);
  const weeks = g.slice(0, 3).map((r, i) => {
    const c = courseFor(r.skill);
    return { title: `Week ${i + 1}`, skill: r.skill, items: [c ? { kind: 'course', id: c.id, label: c.title, minutes: c.minutes } : { kind: 'find', label: `Find material on ${SKILLS[r.skill]}` }, { kind: 'project', skill: r.skill, label: `Apply it and record evidence for ${SKILLS[r.skill]}` }] };
  });
  return { role: s.profile.goal.role, created: new Date().toISOString().slice(0, 10), weeks };
}
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function makeSessions(s, from = new Date()) {
  const out = []; const p = s.profile.prefs; const weeks = s.plan?.weeks || [];
  for (let i = 0; i < 21; i++) {
    const d = new Date(from); d.setDate(d.getDate() + i);
    if (!p.days.includes(DOW[d.getDay()])) continue;
    const w = weeks[Math.min(weeks.length - 1, Math.floor(i / 7))];
    out.push({ id: uid('s'), date: iso(d), time: p.time, minutes: p.minutes, title: w ? SKILLS[w.skill] : 'Daily bite', done: false });
  }
  return out;
}

// ---------- content lookup ----------
export function idea(id) { for (const c of COURSES) { const i = c.ideas.find((x) => x.id === id); if (i) return { ...i, course: c }; } return null; }
export function allIdeas() { return COURSES.flatMap((c) => c.ideas.map((i) => ({ ...i, course: c }))); }
const timed = (lines) => { let t = 0; return lines.map((l) => { const d = Math.max(2, Math.round(l.text.split(/\s+/).length / 2.6)); const o = { ...l, t, d }; t += d; return o; }); };
export function episode(s, id) {
  const g = s.episodes.find((e) => e.id === id); if (g) return g;
  const sm = SAMPLE_EPISODES.find((e) => e.id === id);
  if (sm) { const segments = timed(sm.lines); return { ...sm, segments, duration: segments.at(-1).t + segments.at(-1).d }; }
  if (id?.startsWith('course:')) {
    const c = course(id.slice(7)); const segments = timed(c.ideas.flatMap((i) => [{ speaker: 'A', kind: 'source', text: i.title + '.' }, ...i.body.map((b) => ({ speaker: 'A', kind: 'source', text: b }))]));
    return { id, title: c.title, kind: 'course', by: 'Course ideas read aloud', segments, duration: segments.at(-1).t + segments.at(-1).d };
  }
  return null;
}
/** Why a piece of content is recommended, in words the user can check and correct. */
export function why(s, c) {
  if (s.profile.mode === 'career') {
    const g = gaps(s).find((r) => c.skills.includes(r.skill));
    if (g) return `Your target role, ${s.profile.goal.role}, lists ${SKILLS[g.skill]}. You have ${g.ev.best === 'none' ? 'nothing on file' : 'only ' + KIND[g.ev.best].toLowerCase()} for it.`;
  }
  if (s.profile.interests.includes(c.topic)) return `You follow ${c.topic}.`;
  return `It sits outside your usual topics (${s.profile.interests.join(', ') || 'none chosen'}).`;
}
export function recommended(s) {
  const open = COURSES.filter((c) => !s.progress[c.id]?.completedAt && !s.dismissed.includes('course:' + c.id));
  const g = s.profile.mode === 'career' ? gaps(s).map((r) => r.skill) : [];
  return open.sort((a, b) => score(b) - score(a));
  function score(c) { return (s.progress[c.id] ? 4 : 0) + (c.skills.some((k) => g.includes(k)) ? 2 : 0) + (s.profile.interests.includes(c.topic) ? 1 : 0); }
}
