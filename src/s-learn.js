// Today, Explore, the course flow, My Stash, import and export.
import { esc, icon, btn, link, icbtn, chip, seg, tag, notice, row, tile, bar, field, top, title, head, sec, empty, act, go, day, mins, fmt } from './ui.js';
import { COURSES, SKILLS, TOPICS, SAMPLE_EPISODES } from './data.js';
import { course, prog, idea, allIdeas, recommended, why, episode, iso } from './store.js';

const greet = (d) => (d.getHours() < 12 ? 'Good morning' : d.getHours() < 18 ? 'Good afternoon' : 'Good evening');
const saved = (s, key) => s.saved.includes(key);
const saveBtn = (s, key) => icbtn('stash', saved(s, key) ? 'Remove from My Stash' : 'Save to My Stash', { act: 'save', arg: key, on: saved(s, key), pressed: saved(s, key) });
const courseRow = (s, c) => { const p = prog(s, c.id); return row({ lead: tile('book'), title: c.title, sub: `${c.ideas.length} ideas · ${c.minutes} min · ${c.topic}${p.completedAt ? ' · Finished' : p.done.length ? ` · ${p.done.length} of ${c.ideas.length} read` : ''}`, go: 'course?id=' + c.id }); };
const epRow = (e, s) => row({ lead: `<span class="art sm ${e.kind === 'generated' ? '' : 'pub'}">${icon(e.kind === 'generated' ? 'file' : 'mic', 20)}</span>`, title: e.title, sub: `${e.kind === 'generated' ? 'From your PDF' : e.topic || 'Course audio'} · ${mins(episode(s, e.id).duration)}`, go: 'episode?id=' + e.id });
export { epRow, courseRow };

export function p2pBand(s) {
  const j = s.jobs.find((x) => x.status === 'running');
  if (j) return `<button type="button" class="band" ${go('p2p-generate')}><span class="ic-wrap">${icon('headphones')}</span><span><b>Making your episode</b><span class="sub">${Math.round(j.progress * 100)}% · tap to check on it</span></span>${icon('next', 18)}</button>`;
  return `<button type="button" class="band" ${go('p2p-upload')}><span class="ic-wrap">${icon('headphones')}</span><span><b>Turn a PDF into a podcast</b><span class="sub">Listen to a document on your commute</span></span>${icon('next', 18)}</button>`;
}

export function exploreResults(ctx) {
  const s = ctx.s, q = (s.draft.q || '').trim().toLowerCase(), t = s.draft.topic || 'All';
  const m = (x) => (!q || x.toLowerCase().includes(q));
  const cs = COURSES.filter((c) => (t === 'All' || c.topic === t) && (m(c.title) || c.ideas.some((i) => m(i.title))));
  const es = [...s.episodes, ...SAMPLE_EPISODES].filter((e) => (t === 'All' || e.topic === t || e.kind === 'generated') && m(e.title));
  if (!cs.length && !es.length) return empty({ icon: 'search', title: `Nothing for "${s.draft.q || t}"`, body: 'Try another word or topic, or bring in your own material.', actions: btn('Import content', { kind: 'secondary', go: 'import' }) });
  return `${cs.length ? `<div>${sec('Courses')}<div class="list">${cs.map((c) => courseRow(s, c)).join('')}</div><p class="cap" style="margin-top:8px">Sample courses written for this prototype.</p></div>` : ''}
    ${es.length ? `<div>${sec('Listen', link('All audio', { go: 'podcasts', chev: true }))}<div class="list">${es.slice(0, 3).map((e) => epRow(e, s)).join('')}</div></div>` : ''}`;
}

export default {
  today: {
    title: 'Today', chrome: 'tabs', tab: 'today',
    note: 'One primary action: continue where you stopped. The bite, PDF-to-podcast and next session follow in that order. Explore lives only in the tab bar; the sketch flagged it appearing twice. Each suggestion can explain itself.',
    render: (ctx) => {
      const s = ctx.s, p = s.profile, rec = recommended(s), c = rec[0], pr = c && prog(s, c.id);
      const bite = allIdeas().find((i) => i.course.id !== c?.id && !s.dismissed.includes('idea:' + i.id) && !prog(s, i.course.id).done.includes(i.id));
      const next = s.sessions.find((x) => !x.done && x.date >= iso(ctx.env.now));
      return {
        body: `${head(`${greet(ctx.env.now)}${p.name ? ', ' + p.name : ''}`, { over: ctx.env.now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) })}
          ${s.session?.kind === 'guest' ? notice(`<span>You are looking around as a guest. ${link('Create account', { act: 'start-create' })}</span>`) : ''}
          ${c ? `<section class="card hero stack" aria-label="Continue learning">
            <p class="eyebrow">${pr.done.length ? 'Continue' : 'Start here'}</p>
            <h2 class="h2">${esc(c.title)}</h2>
            <p class="sub">${pr.done.length ? `Idea ${Math.min(c.ideas.length, pr.done.length + 1)} of ${c.ideas.length}` : `${c.ideas.length} ideas`} · about ${Math.max(1, Math.round(c.minutes * (1 - pr.done.length / c.ideas.length)))} min left</p>
            ${bar(pr.done.length / c.ideas.length, 'Course progress')}
            ${btn(pr.done.length ? 'Continue' : 'Start', { go: `reader?c=${c.id}&i=${Math.min(c.ideas.length - 1, pr.idea || 0)}` })}
            <div class="center">${link('Why this?', { act: 'sheet', arg: 'why:' + c.id })}</div>
          </section>` : `<section class="card hero stack"><h2 class="h2">You have finished every sample course</h2><p class="sub">Import your own notes or turn a PDF into audio.</p>${btn('Import content', { go: 'import' })}</section>`}
          ${p2pBand(s)}
          ${bite ? `<section>${sec('Today\'s bite', link('More bites', { go: 'bites', chev: true }))}
            <div class="list">${row({ lead: tile('bolt'), title: bite.title, sub: `2 min · ${bite.course.topic}`, go: `reader?c=${bite.course.id}&i=${bite.course.ideas.findIndex((x) => x.id === bite.id)}` })}</div></section>` : ''}
          ${next ? `<section>${sec('Next session')}<div class="list">${row({ lead: tile('calendar'), title: `${day(next.date)} · ${next.time}`, sub: `${next.minutes} min · ${next.title}`, go: 'calendar' })}</div></section>` : ''}
          ${btn('Surprise me', { kind: 'secondary', icon: 'shuffle', act: 'surprise' })}`,
      };
    },
  },

  bites: {
    title: 'Daily bites', chrome: 'tabs', tab: 'today',
    note: 'A short reading feed, not a grid of cards. Each bite shows its first lines so the person can decide without opening it. "Not for me" removes it and is remembered.',
    render: (ctx) => {
      const s = ctx.s, list = allIdeas().filter((i) => !s.dismissed.includes('idea:' + i.id)).slice(0, 5);
      return {
        top: top({ back: 'today', title: 'Daily bites' }),
        body: `<h1 class="sr" tabindex="-1">Daily bites</h1>${list.length ? list.map((i) => `<article class="stack-s" style="padding-bottom:18px;border-bottom:1px solid var(--hair)">
            <p class="cap">${esc(i.course.topic)} · 2 min · from ${esc(i.course.title)}</p>
            <h2 class="h2">${esc(i.title)}</h2>
            <p>${esc(i.body[0])}</p>
            <div class="btn-row" style="align-items:center;margin-top:8px">${btn('Read', { small: true, go: `reader?c=${i.course.id}&i=${i.course.ideas.findIndex((x) => x.id === i.id)}` })}${saveBtn(s, 'idea:' + i.id)}<span style="flex:1"></span>${link('Not for me', { act: 'dismiss', arg: 'idea:' + i.id })}</div>
          </article>`).join('') : empty({ icon: 'bolt', title: 'No bites left', body: 'You dismissed them all. Restore them or browse courses.', actions: btn('Restore bites', { kind: 'secondary', act: 'undismiss' }) })}`,
      };
    },
  },

  explore: {
    title: 'Explore', chrome: 'tabs', tab: 'explore',
    note: 'Search filters live across courses, ideas and audio. Topic chips scroll sideways. An empty result offers a way out instead of a blank list.',
    render: (ctx) => {
      const s = ctx.s, t = s.draft.topic || 'All';
      return {
        body: `${head('Explore', { acts: icbtn('shuffle', 'Surprise me', { act: 'surprise' }) })}
          <div class="search"><label class="sr" for="q">Search ideas, courses and audio</label>${icon('search', 20)}<input id="q" type="search" data-bind="draft.q" data-input="search" value="${esc(s.draft.q || '')}" placeholder="Search ideas, courses, audio"></div>
          <div class="chips scroll-x" role="group" aria-label="Topic">${['All', ...TOPICS].map((x) => chip(x, { on: t === x, act: 'set', arg: 'draft.topic=' + x })).join('')}</div>
          <div id="results" class="stack" style="--g:20px">${exploreResults(ctx)}</div>`,
      };
    },
  },

  surprise: {
    title: 'Surprise me', chrome: 'tabs', tab: 'explore',
    note: 'One idea, full width, with the reason it was picked. Serendipity is drawn from outside the chosen topics on purpose and says so. It never changes the career goal.',
    render: (ctx) => {
      const s = ctx.s, i = idea(ctx.q.id) || allIdeas()[5];
      return {
        top: top({ back: 'explore', title: 'Surprise me', right: saveBtn(s, 'idea:' + i.id) }),
        body: `<div class="card hero stack" style="margin-top:12px;padding:24px 20px">
            <p class="eyebrow">${esc(i.course.topic)} · 2 min</p>
            <h1 class="h1" tabindex="-1">${esc(i.title)}</h1>
            <p class="lead">${esc(i.body[0])}</p>
          </div>
          <p class="sub">${icon('info', 16)} ${esc(why(s, i.course))}</p>`,
        foot: `${btn('Read it', { go: `reader?c=${i.course.id}&i=${i.course.ideas.findIndex((x) => x.id === i.id)}` })}${btn('Another one', { kind: 'secondary', icon: 'shuffle', act: 'surprise' })}`,
      };
    },
  },

  course: {
    title: 'Course overview', chrome: 'tabs', tab: 'explore',
    note: 'From the sketch: overview, key ideas, a listen button and related audio. Adds outcomes and an honest line about what finishing records. Source is labelled as sample.',
    render: (ctx) => {
      const s = ctx.s, c = course(ctx.q.id), p = prog(s, c.id), rel = SAMPLE_EPISODES.find((e) => e.topic === c.topic);
      const at = Math.min(c.ideas.length - 1, p.idea || 0);
      return {
        top: top({ back: 'explore', right: saveBtn(s, 'course:' + c.id) }),
        body: `<div class="stack-s"><div class="tags">${tag('Sample course', 'sample')}${tag(c.topic)}</div><h1 class="h1" tabindex="-1">${esc(c.title)}</h1><p class="sub">${c.ideas.length} ideas · ${c.minutes} min · quick check at the end</p></div>
          <div>${sec('You will be able to')}<ul class="stack-s">${c.outcomes.map((o) => `<li style="display:flex;gap:10px">${icon('check', 20)}<span>${esc(o)}</span></li>`).join('')}</ul></div>
          <div>${sec(`${c.ideas.length} key ideas`)}<div class="list">${c.ideas.map((i, n) => row({ lead: `<span class="tile num ${p.done.includes(i.id) ? 'done' : ''}">${p.done.includes(i.id) ? icon('check', 18) : n + 1}</span>`, title: i.title, sub: p.done.includes(i.id) ? 'Read' : '2 min', go: `reader?c=${c.id}&i=${n}` })).join('')}</div></div>
          <div class="notice">${icon('info', 20)}<div>Finishing adds <b style="display:inline">completed learning</b> for ${c.skills.map((k) => esc(SKILLS[k])).join(', ')}. It does not certify that you can do it.</div></div>
          ${rel ? `<div>${sec('Related audio')}<div class="list">${epRow(rel, s)}</div></div>` : ''}`,
        foot: `<div class="row2">${btn(p.completedAt ? 'Read again' : p.done.length ? 'Continue' : 'Start', { go: `reader?c=${c.id}&i=${p.completedAt ? 0 : at}` })}${btn('Listen', { kind: 'secondary', icon: 'headphones', act: 'play', arg: 'course:' + c.id })}</div>`,
      };
    },
  },

  reader: {
    title: 'Idea reader', chrome: 'task',
    note: 'Reading comes first: 18px text, long line height, no cards. Text size is one tap away. Position is saved, so closing and returning lands on the same idea.',
    render: (ctx) => {
      const s = ctx.s, c = course(ctx.q.c), n = Math.max(0, Math.min(c.ideas.length - 1, +ctx.q.i || 0)), i = c.ideas[n], last = n === c.ideas.length - 1;
      return {
        top: top({ close: 'course?id=' + c.id, title: `${n + 1} of ${c.ideas.length}`, right: `${icbtn('text', 'Change text size', { act: 'text-size' })}${saveBtn(s, 'idea:' + i.id)}`, step: [n + 1, c.ideas.length] }),
        body: `<article class="read-wrap" style="padding-top:8px">
            <h1 class="h1" tabindex="-1">${esc(i.title)}</h1>
            <div class="read">${i.body.map((b) => `<p>${esc(b)}</p>`).join('')}</div>
            <div class="quote"><p class="eyebrow">Try it</p><p class="read" style="margin-top:4px">${esc(i.try)}</p></div>
            <p class="cap">From ${esc(c.title)}. Sample content written for this prototype.</p>
          </article>`,
        foot: `<div class="row2">${btn('Previous', { kind: 'secondary', act: 'idea-go', arg: `${c.id}|${n - 1}`, disabled: n === 0 })}${btn(last ? 'Finish reading' : 'Next idea', { act: 'idea-go', arg: `${c.id}|${n + 1}` })}</div>`,
      };
    },
  },

  takeaway: {
    title: 'Takeaway', chrome: 'task',
    note: 'Two separate questions: what was learned, and how it will be used this week. The "Try it" suggestions only fill the second field, so learning and applying stay distinct. Skipping is allowed.',
    render: (ctx) => {
      const c = course(ctx.q.c), v = typeof ctx.s.draft.takeaway === 'object' && ctx.s.draft.takeaway ? ctx.s.draft.takeaway : {};
      return {
        top: top({ back: `reader?c=${c.id}&i=${c.ideas.length - 1}`, title: c.title }),
        body: `${title('Wrap up', 'One sentence each is enough.')}
          ${field({ label: 'What I learned', bind: 'draft.takeaway.learned', type: 'textarea', value: v.learned, placeholder: 'The main idea, in my own words...', err: (ctx.ui.errs || {}).learned })}
          ${field({ label: 'How I will use it this week', bind: 'draft.takeaway.apply', type: 'textarea', value: v.apply, placeholder: 'This week I will...' })}
          <div><p class="label">Need an idea for how to use it?</p><p class="cap">Tapping one fills in the second box only.</p><div class="stack-s" style="margin-top:8px">${c.ideas.slice(0, 3).map((i) => `<button type="button" class="opt" style="width:100%;text-align:left" aria-pressed="${v.apply === i.try}" ${act('set', 'draft.takeaway.apply=' + i.try)}>${esc(i.try)}</button>`).join('')}</div></div>`,
        foot: `${btn('Save takeaway', { act: 'takeaway-save', arg: c.id })}${btn('Skip', { kind: 'ghost', go: 'quiz?c=' + c.id })}`,
      };
    },
  },

  quiz: {
    title: 'Quick check', chrome: 'task',
    note: 'Real radio buttons, real feedback, retry allowed. The screen says plainly that a recall question is not an assessment of proficiency.',
    render: (ctx) => {
      const s = ctx.s, c = course(ctx.q.c), q = c.quiz, st = prog(s, c.id).quiz || {}, pick = s.draft.quizPick;
      const checked = st.choice != null;
      return {
        top: top({ back: 'takeaway?c=' + c.id, title: 'Quick check' }),
        body: `<fieldset class="stack"><legend class="h1" tabindex="-1" style="margin-bottom:14px">${esc(q.q)}</legend>
            ${q.options.map((o, n) => `<label class="opt ${checked && n === q.answer && st.correct ? 'right' : checked && n === st.choice && !st.correct ? 'wrong' : ''}"><input type="radio" name="quiz" value="${n}" data-change="quiz-pick" ${(checked ? st.choice : pick) === n ? 'checked' : ''} ${checked && st.correct ? 'disabled' : ''}><span>${esc(o)}</span></label>`).join('')}
          </fieldset>
          ${checked ? notice(`<span>${esc(st.correct ? q.why : 'Read the options once more and pick again. You can retry as often as you like.')}</span>`, { title: st.correct ? 'Correct' : 'Not quite', tone: st.correct ? '' : 'warn', alert: true, icon: st.correct ? 'check' : 'alert' }) : ''}
          <p class="cap">A quick recall check. It is not an assessment of how well you can do this at work.</p>`,
        foot: checked && st.correct ? btn('Finish course', { act: 'course-complete', arg: c.id }) : btn(checked ? 'Check again' : 'Check answer', { act: 'quiz-check', arg: c.id, disabled: pick == null }),
      };
    },
  },

  complete: {
    title: 'Course complete', chrome: 'task',
    note: 'Says exactly what was recorded and what was not. The next step is to apply the idea and add project evidence, which is the link from learning to the Growth tab.',
    render: (ctx) => {
      const s = ctx.s, c = course(ctx.q.c), p = prog(s, c.id), tk = s.takeaways.find((t) => t.course === c.id);
      return {
        top: top({ close: 'today' }),
        body: `<div class="empty" style="padding-top:20px"><span class="ring" style="border-style:solid;border-color:var(--emerald);color:var(--emerald)">${icon('check', 32)}</span><h1 class="h1" tabindex="-1">Finished: ${esc(c.title)}</h1></div>
          <div>${sec('What was recorded')}<div class="list">
            ${row({ lead: tile('book'), title: 'Completed learning', sub: c.skills.map((k) => SKILLS[k]).join(', ') })}
            ${row({ lead: tile('check'), title: `Quick check: correct${p.quiz?.tries > 1 ? ` on try ${p.quiz.tries}` : ''}`, sub: 'Recall only, not proficiency' })}
            ${tk ? row({ lead: tile('edit'), title: 'Your takeaway', sub: `${tk.learned || tk.text}${tk.apply ? ' · Use it: ' + tk.apply : ''}` }) : ''}
          </div></div>
          <div class="quote"><p class="eyebrow">Next</p><p>Use it on something real, then record what you did. Project evidence is stronger than a finished course.</p></div>`,
        foot: `${btn('Add project evidence', { go: 'evidence?skill=' + c.skills[0] })}${btn('Back to Today', { kind: 'ghost', go: 'today' })}`,
      };
    },
  },

  stash: {
    title: 'My Stash', chrome: 'tabs', tab: 'stash',
    note: 'Three kinds of owned content behind one segmented control: saved, imported, audio. The plus button opens a sheet with the two ways to add. Each tab has its own empty state.',
    render: (ctx) => stashView(ctx, false),
  },
  'stash-empty': {
    title: 'My Stash (empty)', chrome: 'tabs', tab: 'stash',
    note: 'Empty state: one sentence on what belongs here and two concrete first actions. The same pattern serves empty search and an empty study plan.',
    render: (ctx) => stashView(ctx, true),
  },

  collection: {
    title: 'Saved takeaways', chrome: 'tabs', tab: 'stash',
    note: 'Takeaways are the person\'s own words, kept with the course and date they came from. They export as Markdown.',
    render: (ctx) => {
      const s = ctx.s;
      return {
        top: top({ back: 'stash', title: 'Takeaways', right: icbtn('download', 'Export', { go: 'export' }) }),
        body: `${title('Your takeaways')}
          ${s.takeaways.length ? s.takeaways.map((t) => `<article class="quote stack-s"><p class="read">${esc(t.learned || t.text)}</p>${t.apply ? `<p><b class="strong">Use it:</b> ${esc(t.apply)}</p>` : ''}<p class="cap">${esc(course(t.course).title)} · ${day(t.date)}</p><div>${link('Remove', { act: 'takeaway-del', arg: t.id })}</div></article>`).join('') : empty({ icon: 'edit', title: 'No takeaways yet', body: 'You write one at the end of each course.', actions: btn('Browse courses', { kind: 'secondary', go: 'explore' }) })}`,
      };
    },
  },

  import: {
    title: 'Import', chrome: 'task',
    note: 'Sources that work are at the top. Sources that need a server are shown but disabled with the reason, so the list is honest about what is possible today. Paste is validated before review.',
    render: (ctx) => {
      const f = ctx.s.draft.import || {}, e = ctx.ui.errs || {};
      return {
        top: top({ close: 'stash', title: 'Add to My Stash' }),
        body: `${title('Bring your own material')}
          ${field({ label: 'Paste text', bind: 'draft.import.text', type: 'textarea', value: f.text, placeholder: 'Notes, an article, lecture text...', hint: 'Up to 20,000 characters. Blank lines separate ideas.', err: e.text })}
          <div class="list">
            <div class="filebtn"><input type="file" id="imp" accept=".txt,.md,text/plain,text/markdown" data-change="import-file"><label for="imp" class="row" style="cursor:pointer">${tile('file')}<span class="mid"><b>Text or Markdown file</b><span>Upload .txt or .md files from this device</span></span><span class="trail">${icon('next', 18)}</span></label></div>
            ${row({ lead: tile('headphones'), title: 'PDF to podcast', sub: 'Turn a document into audio', go: 'p2p-upload' })}
          </div>`,
        foot: btn('Review import', { act: 'import-text' }),
      };
    },
  },

  'import-review': {
    title: 'Import review', chrome: 'task',
    note: 'Nothing is saved until the person has seen it. Title, tags and each extracted idea can be edited or removed. A duplicate title is flagged with a choice, not silently merged.',
    render: (ctx) => {
      const s = ctx.s, f = s.draft.import || { title: 'Workshop notes', ideas: ['Start with the decision', 'Show one example', 'Explain uncertainty'], tags: ['Careers'], source: 'Pasted text' };
      const dup = s.imports.some((x) => x.title.trim().toLowerCase() === (f.title || '').trim().toLowerCase());
      return {
        top: top({ back: 'import', title: 'Review import' }),
        body: `${title('Check before saving')}
          ${field({ label: 'Title', bind: 'draft.import.title', value: f.title, err: (ctx.ui.errs || {}).title })}
          ${dup ? notice('<span>You already have an import with this title. Saving keeps both. Rename this one if that helps.</span>', { tone: 'warn', title: 'Possible duplicate' }) : ''}
          <div><p class="label">Tags</p><div class="chips" style="margin-top:6px" role="group" aria-label="Tags">${TOPICS.map((t) => chip(t, { on: (f.tags || []).includes(t), act: 'toggle-in', arg: 'draft.import.tags|' + t })).join('')}</div></div>
          <div>${sec(`${(f.ideas || []).length} ideas found`)}
            ${(f.ideas || []).map((t, n) => `<div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><label class="sr" for="idea${n}">Idea ${n + 1}</label><input class="input" id="idea${n}" data-bind="draft.import.ideas.${n}" value="${esc(t)}">${icbtn('trash', 'Remove idea ' + (n + 1), { act: 'import-idea-del', arg: n })}</div>`).join('')}</div>`,
        foot: btn('Save to My Stash', { act: 'import-save', disabled: !(f.ideas || []).length }),
      };
    },
  },

  'import-error': {
    title: 'Import failed', chrome: 'task',
    note: 'Failure recovery: names the specific cause, confirms what is safe, and offers three ways forward. Typed text is kept so nobody retypes it.',
    render: (ctx) => {
      const R = { type: ['This file type is not supported', 'Stash can read .txt and .md files here. For a PDF, use PDF to podcast.'], size: ['This file is too large', 'The limit for text import is 200 KB.'], empty: ['The file is empty', 'No text was found in it.'], read: ['The file could not be read', 'It may have moved or be open in another app.'] };
      const [t, b] = R[ctx.q.reason] || R.type;
      return {
        top: top({ close: 'stash', title: 'Import' }),
        body: `<div class="empty" style="padding-top:40px"><span class="ring">${icon('alert', 30)}</span><h1 class="h1" tabindex="-1">${t}</h1><p class="sub">${b}</p></div>
          ${notice('<span>Nothing was added or changed in My Stash. Text you pasted is still in the import form.</span>', { title: 'Your content is safe' })}`,
        foot: `<div class="filebtn"><input type="file" id="imp2" accept=".txt,.md,text/plain,text/markdown" data-change="import-file"><label for="imp2" class="btn btn-primary">Choose another file</label></div>${btn('Paste text instead', { kind: 'secondary', go: 'import' })}${btn('Back to My Stash', { kind: 'ghost', go: 'stash' })}`,
      };
    },
  },

  export: {
    title: 'Export', chrome: 'task',
    note: 'Real checkboxes with live counts, then a format. The file is built on the device. Audio is absent from the list because no audio files exist in this build.',
    render: (ctx) => {
      const s = ctx.s, x = { what: ['takeaways', 'imports', 'progress', 'evidence'], format: 'md', ...(s.draft.export || {}) };
      const items = [['takeaways', 'Takeaways', s.takeaways.length], ['imports', 'Imported notes', s.imports.length], ['saved', 'Saved items', s.saved.length], ['progress', 'Learning progress', Object.keys(s.progress).length], ['evidence', 'Skill evidence', s.evidence.length], ['transcripts', 'Episode transcripts', s.episodes.length]];
      const n = items.filter(([k]) => x.what.includes(k)).reduce((a, i) => a + i[2], 0);
      return {
        top: top({ close: 'stash', title: 'Export' }),
        body: `${title('Take your learning with you')}
          <fieldset><legend class="label">What to include</legend>${items.map(([k, l, c]) => `<label class="check"><input type="checkbox" data-change="export-what" value="${k}" ${x.what.includes(k) ? 'checked' : ''}><span><b class="strong">${l}</b><span class="cap" style="display:block">${c} on this device</span></span></label>`).join('')}</fieldset>
          <div><p class="label">Format</p><div style="margin-top:6px">${seg('Format', [['md', 'Markdown'], ['json', 'JSON'], ['csv', 'CSV']], x.format, 'set', 'draft.export.format=')}</div>
          <p class="cap" style="margin-top:8px">${{ md: 'Readable notes for any editor.', json: 'Everything, structured. Best for backup.', csv: 'One row per record, for spreadsheets.' }[x.format]}</p></div>`,
        foot: `${btn(`Prepare export (${n} records)`, { act: 'export-run', disabled: !n })}`,
      };
    },
  },

  'export-done': {
    title: 'Export ready', chrome: 'task',
    note: 'Success state with the real file name and size. Download is an explicit tap. States that restore from JSON is not built, so the backup is not oversold.',
    render: (ctx) => {
      const f = ctx.s.draft.exportFile || { name: 'stash-export.md', size: 2140, records: 6 };
      return {
        top: top({ close: 'stash', title: 'Export' }),
        body: `<div class="empty" style="padding-top:36px"><span class="ring" style="border-style:solid;border-color:var(--emerald);color:var(--emerald)">${icon('check', 30)}</span><h1 class="h1" tabindex="-1">Your export is ready</h1></div>
          <div class="list">${row({ lead: tile('file'), title: f.name, sub: `${Math.max(1, Math.round(f.size / 1024))} KB · ${f.records} records · built on this device` })}</div>
          <p class="cap">JSON holds everything for a backup. Restoring from a file is not built yet.</p>`,
        foot: `${btn('Download file', { icon: 'download', act: 'export-download' })}${btn('Export another format', { kind: 'secondary', go: 'export' })}${btn('Done', { kind: 'ghost', go: 'stash' })}`,
      };
    },
  },
};

function stashView(ctx, forceEmpty) {
  const s = ctx.s, tab = forceEmpty ? 'saved' : s.draft.stashTab || 'saved';
  const E = { saved: empty({ icon: 'stash', title: 'Nothing saved yet', body: 'Tap the bookmark on any idea, course or episode to keep it here.', actions: `${btn('Explore ideas', { go: 'explore' })}${btn('Import my notes', { kind: 'secondary', go: 'import' })}` }),
    imported: empty({ icon: 'upload', title: 'No imports yet', body: 'Add your own content to study.', actions: btn('Import content', { go: 'import' }) }),
    audio: empty({ icon: 'headphones', title: 'No episodes yet', body: 'Turn a PDF into a narrated episode or a two-host conversation.', actions: btn('Turn a PDF into a podcast', { go: 'p2p-upload' }) }) };
  let body = E[tab];
  if (!forceEmpty) {
    if (tab === 'saved' && (s.saved.length || s.takeaways.length)) {
      body = `<div class="list">${row({ lead: tile('edit'), title: 'Takeaways', sub: `${s.takeaways.length} in your own words`, go: 'collection' })}
        ${s.saved.map((k) => { const [t, id] = k.split(':'); if (t === 'idea') { const i = idea(id); return row({ lead: tile('bolt'), title: i.title, sub: 'Idea · ' + i.course.title, go: `reader?c=${i.course.id}&i=${i.course.ideas.findIndex((x) => x.id === id)}` }); } if (t === 'course') return courseRow(s, course(id)); const e = episode(s, id); return e ? epRow(e, s) : ''; }).join('')}</div>`;
    }
    if (tab === 'imported' && s.imports.length) body = `<div class="list">${s.imports.map((m) => row({ lead: tile('file'), title: m.title, sub: `${m.ideas.length} ideas · ${m.source} · ${day(m.date)}`, trail: icbtn('trash', 'Delete ' + m.title, { act: 'import-del', arg: m.id }) })).join('')}</div>${btn('Import more', { kind: 'secondary', go: 'import' })}`;
    if (tab === 'audio') {
      const j = s.jobs.find((x) => x.status === 'running' || x.status === 'failed');
      if (s.episodes.length || j) body = `${p2pBand(s)}<div class="list">${j && j.status === 'failed' ? row({ lead: tile('alert'), title: 'An episode did not finish', sub: 'Your script is saved. Tap to recover.', go: 'p2p-error' }) : ''}${s.episodes.map((e) => epRow(e, s)).join('')}</div>`;
    }
  }
  return {
    body: `${head('My Stash', { acts: `${icbtn('download', 'Export', { go: 'export' })}${icbtn('plus', 'Add to My Stash', { act: 'sheet', arg: 'add' })}` })}
      ${seg('Section', [['saved', 'Saved'], ['imported', 'Imported'], ['audio', 'Audio']], tab, 'set', 'draft.stashTab=')}
      ${body}`,
  };
}
