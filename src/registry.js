// Screen registry, board order and the phone frame shared by the live app and the PDF boards.
import { icon, esc } from './ui.js';
import start from './s-start.js';
import learn from './s-learn.js';
import growth from './s-growth.js';
import listen, { mini, sheets } from './s-listen.js';

export const SCREENS = { ...start, ...learn, ...growth, ...listen };

/** Workshop boards: four phones each, in journey order. */
export const BOARDS = [
  ['Sign up and sign in', 'Welcome, sign in, reset password, goal', ['welcome', 'signin', 'recover', 'ob-goal']],
  ['Onboarding', 'Skills and resume, interests, study time, Today', ['ob-resume', 'ob-interests', 'ob-prefs', 'today']],
  ['Discover', 'Daily bites, Explore, Surprise me, course page', ['bites', 'explore', 'surprise', 'course']],
  ['Learn', 'Reader, takeaway, recap question, course complete', ['reader', 'takeaway', 'quiz', 'complete']],
  ['My Stash', 'Saved, takeaways, empty state, import', ['stash', 'collection', 'stash-empty', 'import']],
  ['Import and export', 'Review import, import error, export, export done', ['import-review', 'import-error', 'export', 'export-done']],
  ['Jobs', 'Growth, suggested roles, job details, comparison', ['growth', 'jobs', 'job', 'compare']],
  ['Skills', 'Skills Planner, skill detail, add proof, study plan', ['gaps', 'skill', 'evidence', 'plan']],
  ['Listen', 'Listen home, episode, player, queue and sleep timer', ['podcasts', 'episode', 'player', 'player-sheet']],
  ['PDF to podcast: setup', 'Upload, review pages, settings, script', ['p2p-upload', 'p2p-review', 'p2p-config', 'p2p-script']],
  ['PDF to podcast: audio', 'Generating, error, episode, transcript', ['p2p-generate', 'p2p-error', 'p2p-episode', 'transcript']],
  ['Account and schedule', 'Source page, calendar, profile, preferences', ['p2p-source', 'calendar', 'profile', 'settings']],
  ['Skill checks and sync', 'Skill check, result, sync, sync code', ['check', 'check-done', 'sync', 'sync-join']],
];
export const ORDER = BOARDS.flatMap((b) => b[2]);
export const num = (id) => String(ORDER.indexOf(id) + 1).padStart(2, '0');

/** Route parameters that put each screen in a representative state for boards and the screen index. */
export const PRESET = {
  course: 'id=detect', reader: 'c=detect&i=1', takeaway: 'c=detect', quiz: 'c=detect', complete: 'c=decisions',
  surprise: 'id=d2', job: 'id=tsds', compare: 'id=tsds', skill: 'id=ml', evidence: 'skill=ml', 'import-error': 'reason=type',
  check: 'skill=ml', 'check-done': 'skill=policy', episode: 'id=ep-recall', 'p2p-generate': 'state=running', 'p2p-source': 'p=5',
};

const TABS = [['today', 'Today', 'today'], ['explore', 'Explore', 'explore'], ['stash', 'My Stash', 'stash'], ['growth', 'Growth', 'growth'], ['profile', 'Profile', 'profile']];
const tabs = (active) => `<nav class="tabs" aria-label="Primary">${TABS.map(([id, label, ic]) => `<button type="button" data-go="${id}" ${active === id ? 'aria-current="page"' : ''}>${icon(ic, 24)}<span>${label}</span></button>`).join('')}</nav>`;

export function frame(id, ctx) {
  const sc = SCREENS[id], r = sc.render(ctx);
  const showMini = (sc.chrome === 'tabs' || sc.chrome === 'task') && ctx.s.player.ep;
  return `<div class="view" data-screen="${esc(id)}">${r.top || ''}<main class="scroll${sc.noBar ? ' nobar' : ''}" id="scroll">${r.body}</main>${r.foot ? `<div class="foot">${r.foot}</div>` : ''}${showMini ? mini(ctx) : ''}${sc.chrome === 'tabs' ? tabs(sc.tab) : ''}${sheets(ctx)}</div>`;
}
