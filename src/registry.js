// Screen registry, board order and the phone frame shared by the live app and the PDF boards.
import { icon, esc } from './ui.js';
import start from './s-start.js';
import learn from './s-learn.js';
import growth from './s-growth.js';
import listen, { mini, sheets } from './s-listen.js';

export const SCREENS = { ...start, ...learn, ...growth, ...listen };

/** Workshop boards: four phones each, in journey order. */
export const BOARDS = [
  ['Start with the person', 'Welcome, sign-in, recovery, goal', ['welcome', 'signin', 'recover', 'ob-goal']],
  ['Make it personal', 'Skills, interests, rhythm, Today', ['ob-resume', 'ob-interests', 'ob-prefs', 'today']],
  ['Short sessions', 'Bites, Explore, Surprise me, course', ['bites', 'explore', 'surprise', 'course']],
  ['Read, reflect, check', 'Reader, takeaway, quiz, completion', ['reader', 'takeaway', 'quiz', 'complete']],
  ['Keep what matters', 'My Stash, takeaways, empty state, import', ['stash', 'collection', 'stash-empty', 'import']],
  ['Bring in, take out', 'Import review, failure recovery, export', ['import-review', 'import-error', 'export', 'export-done']],
  ['Evidence before claims', 'Growth, roles, job detail, comparison', ['growth', 'jobs', 'job', 'compare']],
  ['Close the gap', 'Skills Planner, skill, proof of skill, plan', ['gaps', 'skill', 'evidence', 'plan']],
  ['Listen', 'Audio home, episode, player, queue and sleep', ['podcasts', 'episode', 'player', 'player-sheet']],
  ['PDF to podcast: the source', 'Upload, review, configure, script', ['p2p-upload', 'p2p-review', 'p2p-config', 'p2p-script']],
  ['PDF to podcast: the audio', 'Generate, recover, manage, transcript', ['p2p-generate', 'p2p-error', 'p2p-episode', 'transcript']],
  ['Sources, schedule, account', 'Source page, calendar, profile, preferences', ['p2p-source', 'calendar', 'profile', 'settings']],
  ['Prove it, keep it', 'Skill check, result, sync, sync on a new device', ['check', 'check-done', 'sync', 'sync-join']],
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
