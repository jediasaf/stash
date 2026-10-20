// Growth: goal, job comparison, Skills Planner, study plan, calendar, project evidence.
import { esc, icon, btn, link, icbtn, chip, tag, notice, row, tile, field, top, title, head, sec, empty, act, day } from './ui.js';
import { JOBS, SKILLS } from './data.js';
import { job, goalJob, coverage, gaps, evidenceFor, KIND, courseFor, prog, iso } from './store.js';

const lvl = (v) => `${v === 'Mid' ? 'Intermediate' : v}-level`;
const DISCLAIMER = 'This compares the listing with what you have recorded. It is not a chance of being hired, and a blank does not mean you lack the skill.';
const covBar = (cov) => `<div class="bar multi" role="img" aria-label="Evidence on file for ${cov.have} of ${cov.total} requirements">${cov.rows.map((r) => `<i class="${r.ev.best}"></i>`).join('')}</div>`;
const evTag = (ev) => tag(KIND[ev.best], ev.best);

export default {
  growth: {
    title: 'Growth', chrome: 'tabs', tab: 'growth',
    note: 'Answers the sketch\'s "entry point?" question: Growth opens on the journey line, so the person sees where they are between goal and opportunity. Evidence is counted by kind. "Assessed" is shown as zero rather than left out.',
    render: (ctx) => {
      const s = ctx.s, p = s.profile;
      if (p.mode !== 'career') return { body: `${head('Growth')}${empty({ icon: 'target', title: 'No target role set', body: 'That is fine. You can keep learning for curiosity. Add a role when you want to see what it asks for.', actions: btn('Set a target role', { act: 'set-career' }) })}` };
      const j = goalJob(s), g = gaps(s), all = Object.keys(SKILLS).map((k) => evidenceFor(s, k));
      const n = (k) => all.filter((e) => (k === 'self' ? e.self : e[k].length)).length;
      const step = !j ? 0 : !s.plan ? 1 : !Object.values(s.progress).some((x) => x.completedAt) ? 2 : !s.evidence.length ? 3 : g.length ? 4 : 5;
      return {
        body: `${head('Growth', { over: 'Target role', acts: icbtn('edit', 'Edit goal', { go: 'ob-goal?edit=1' }) })}
          <div class="stack-s"><h2 class="h2">${esc(p.goal.role)}</h2><p class="sub">${esc(p.goal.location)} · ${esc(lvl(p.goal.level))}</p></div>
          <ol class="journey" aria-label="Your journey">${['Goal', 'Gaps', 'Learn', 'Apply', 'Evidence', 'Roles'].map((l, i) => `<li class="${i < step ? 'done' : i === step ? 'now' : ''}" ${i === step ? 'aria-current="step"' : ''}>${l}</li>`).join('')}</ol>
          ${!j ? notice(`<span>There is no sample listing for "${esc(p.goal.role)}", so Stash cannot compare requirements. Pick one of the sample roles to see the flow.</span>`, { tone: 'warn', title: 'No listing to compare' }) : ''}
          <section>${sec('Evidence on file')}<div class="list">
            ${row({ title: 'Project evidence', sub: 'Work you described and linked', trail: `<b class="strong">${n('project')}</b>` })}
            ${row({ title: 'Completed learning', sub: 'Courses finished in Stash', trail: `<b class="strong">${n('learning')}</b>` })}
            ${row({ title: 'Self-reported', sub: 'Skills you said you have', trail: `<b class="strong">${n('self')}</b>` })}
            ${row({ title: 'Assessed', sub: 'No skills verified yet', trail: `<b class="strong">0</b>` })}
          </div></section>
          <div class="list">
            ${j ? row({ lead: tile('list'), title: 'Proof of Skill', sub: g.length ? `${g.length} unproven` : 'Every skill your target role needs is proven', go: 'gaps' }) : ''}
            ${row({ lead: tile('calendar'), title: 'Study plan', sub: s.plan ? `${s.plan.weeks.length} weeks · ${s.sessions.filter((x) => !x.done).length} sessions left` : 'Not created yet', go: 'plan' })}
            ${row({ lead: tile('briefcase'), title: 'Suggested roles', sub: `${JOBS.filter((x) => !s.dismissed.includes('job:' + x.id)).length} roles matched`, go: 'jobs' })}
          </div>`,
      };
    },
  },

  jobs: {
    title: 'Suggested roles', chrome: 'tabs', tab: 'growth',
    note: 'Sample listings are labelled on the page and on every row. No match percentage: each row states how many requirements have evidence on file. A live listing would show its source and posting date in the same spot.',
    render: (ctx) => {
      const s = ctx.s, list = JOBS.filter((j) => !s.dismissed.includes('job:' + j.id));
      return {
        top: top({ back: 'growth', title: 'Suggested roles' }),
        body: `${title('Roles to look at')}
          ${notice(`<span>These ${JOBS.length} listings were written for the prototype. Live listings would show where they came from and when they were posted.</span>`, { title: 'Sample listings', tone: 'warn', icon: 'info' })}
          ${list.length ? list.map((j) => { const c = coverage(s, j); return `<button type="button" class="card stack-s" style="width:100%;text-align:left;cursor:pointer" data-go="job?id=${j.id}">
            <span class="tags">${tag('Sample', 'sample')}${j.title === s.profile.goal.role ? tag('Your target role', 'src') : ''}</span>
            <b class="h3" style="display:block">${esc(j.title)}</b>
            <span class="sub" style="display:block">${esc(j.employer)} · ${esc(j.location)} · ${esc(j.mode)}</span>
            ${covBar(c)}<span class="sub" style="display:block">Evidence on file for ${c.have} of ${c.total} requirements</span>
          </button>`; }).join('') : empty({ icon: 'briefcase', title: 'No roles left', body: 'You hid every sample listing.', actions: btn('Show them again', { kind: 'secondary', act: 'undismiss' }) })}
          <p class="cap">${DISCLAIMER}</p>`,
      };
    },
  },

  job: {
    title: 'Job details', chrome: 'tabs', tab: 'growth',
    note: 'Explains why the role is shown and gives two ways to correct it: edit the goal or hide the listing. The apply link is disabled because the listing is a sample, and says so.',
    render: (ctx) => {
      const s = ctx.s, j = job(ctx.q.id), c = coverage(s, j), isGoal = j.title === s.profile.goal.role;
      return {
        top: top({ back: 'jobs', right: icbtn('more', 'More actions', { act: 'sheet', arg: 'job:' + j.id }) }),
        body: `<div class="stack-s"><div class="tags">${tag('Sample listing', 'sample')}</div><h1 class="h1" tabindex="-1">${esc(j.title)}</h1><p class="sub">${esc(j.employer)} · ${esc(j.location)} · ${esc(j.mode)}</p><p class="cap">Source: ${esc(j.source)}. Posted: not applicable.</p></div>
          <div class="quote"><p class="eyebrow">Why you see this</p><p>${isGoal ? `It has the same title as your target role.` : `It shares ${c.rows.filter((r) => r.ev.best !== 'none').length} skills with what you have on file.`}</p><div>${link('Edit my goal', { go: 'ob-goal?edit=1' })} &nbsp; ${link('Hide this role', { act: 'dismiss', arg: 'job:' + j.id })}</div></div>
          <section>${sec('What it asks for')}<ul class="list">${j.requirements.map((r) => row({ title: r.text, sub: `${SKILLS[r.skill]} · ${r.must ? 'Essential' : 'Nice to have'}` })).join('')}</ul></section>`,
        foot: `${btn('Compare with my profile', { go: 'compare?id=' + j.id })}${btn('Original listing unavailable (sample)', { kind: 'secondary', disabled: true })}`,
      };
    },
  },

  compare: {
    title: 'Requirement comparison', chrome: 'tabs', tab: 'growth',
    note: 'Every requirement is tied to a named piece of evidence and its kind. A blank reads "Not shown yet", never "missing skill", and offers "I have this" beside "Learn". The fit summary is a count with a plain disclaimer.',
    render: (ctx) => {
      const s = ctx.s, j = job(ctx.q.id), c = coverage(s, j);
      return {
        top: top({ back: 'job?id=' + j.id, title: j.title }),
        body: `${title(`Evidence on file for ${c.have} of ${c.total} requirements`)}
          ${covBar(c)}<div class="tags">${tag('Project', 'project')}${tag('Learning', 'learning')}${tag('Self-reported', 'self')}${tag('Not shown yet', 'none')}</div>
          <p class="sub">${DISCLAIMER}</p>
          ${c.rows.map((r) => { const ref = r.ev.project[0] ? `Project: ${r.ev.project[0].title} · ${day(r.ev.project[0].date)}` : r.ev.learning[0] ? `Finished: ${r.ev.learning[0].title}` : r.ev.self ? 'You said you have this skill' : 'Nothing recorded for this yet'; const cr = courseFor(r.skill);
            return `<article class="stack-s" style="padding:14px 0;border-top:1px solid var(--hair)">
              <div class="tags">${evTag(r.ev)}${r.must ? '' : tag('Nice to have')}</div>
              <h2 class="h3">${esc(r.text)}</h2><p class="sub">${esc(ref)}</p>
              <div class="btn-row" style="gap:4px 18px">${r.ev.best === 'none' ? link('I have this', { act: 'self-add', arg: r.skill }) : ''}${r.ev.best !== 'project' ? link('Add evidence', { go: 'evidence?skill=' + r.skill }) : ''}${r.ev.best !== 'project' && cr && !prog(s, cr.id).completedAt ? link('Learn', { go: 'course?id=' + cr.id }) : ''}${link('Details', { go: 'skill?id=' + r.skill })}</div>
            </article>`; }).join('')}`,
        foot: btn('Open Skills Planner', { go: 'gaps' }),
      };
    },
  },

  gaps: {
    title: 'Skills Planner', chrome: 'tabs', tab: 'growth',
    note: 'Renamed from "Missing skills" to "Proof of skill" and "Skills Planner". The list is the skills the target role needs that the work history does not show yet, weakest first, each with one suggested next step. Any row can be marked "not relevant".',
    render: (ctx) => {
      const s = ctx.s, g = gaps(s), j = goalJob(s);
      return {
        top: top({ back: 'growth', title: 'Proof of Skill' }),
        body: `${title('Skills Planner', 'Skills to pick up next.')}
          ${j ? `<p class="sub">Skills your target role needs that your work history doesn’t show.</p>` : ''}
          ${g.length ? `<div class="list">${g.map((r) => { const c = courseFor(r.skill); const nextStep = r.ev.best === 'none' ? (c ? `Next: ${c.title} (${c.minutes} min)` : 'Already know this? Tell us.') : r.ev.best === 'self' ? (c ? `Next: ${c.title}, or add a project` : 'Next: add a project') : 'Next: apply it and add a project';
            return row({ title: SKILLS[r.skill], sub: nextStep, extra: `<span class="tags" style="margin-top:6px">${evTag(r.ev)}${r.must ? tag('Essential') : ''}</span>`, go: 'skill?id=' + r.skill }); }).join('')}</div>`
          : empty({ icon: 'check', title: j ? 'Nothing open' : 'No listing to compare', body: j ? 'Every skill this role lists has project evidence on file.' : 'Choose one of the sample roles as your goal to see this list.', actions: btn('Edit goal', { kind: 'secondary', go: 'ob-goal?edit=1' }) })}
          <p class="cap">A blank means nothing is recorded yet. It does not mean you cannot do it.</p>`,
        foot: g.length ? btn(s.plan ? 'Open study plan' : 'Create a study plan', { act: s.plan ? 'go' : 'plan-create', arg: 'plan' }) : '',
      };
    },
  },

  skill: {
    title: 'Skill detail', chrome: 'tabs', tab: 'growth',
    note: 'The four kinds of evidence, shown separately for one skill. The person can correct each: add or withdraw a self-report, add a project, or mark the skill as not relevant. "Assessed" explains why it is empty.',
    render: (ctx) => {
      const s = ctx.s, k = ctx.q.id in SKILLS ? ctx.q.id : 'sql', ev = evidenceFor(s, k), c = courseFor(k);
      return {
        top: top({ back: 'gaps', title: 'Skill' }),
        body: `<div class="stack-s"><h1 class="h1" tabindex="-1">${esc(SKILLS[k])}</h1><div class="tags">${evTag(ev)}</div></div>
          <div class="list">
            ${row({ lead: tile('folder'), title: 'Project evidence', sub: ev.project.length ? ev.project.map((e) => `${e.title} · ${day(e.date)}`).join('; ') : 'None yet. Self-submitted, not verified.', trail: link(ev.project.length ? 'Add' : 'Add', { go: 'evidence?skill=' + k }) })}
            ${row({ lead: tile('book'), title: 'Completed learning', sub: ev.learning.length ? ev.learning.map((x) => x.title).join(', ') : c ? `Not yet. ${c.title} covers it.` : 'No course covers this yet.', trail: c && !ev.learning.length ? link('Open', { go: 'course?id=' + c.id }) : '' })}
            ${row({ lead: tile('profile'), title: 'Self-reported', sub: ev.self ? 'You said you have this skill.' : 'You have not claimed this skill.', trail: link(ev.self ? 'Withdraw' : 'I have this', { act: 'toggle-in', arg: 'profile.selfSkills|' + k }) })}
            ${row({ lead: tile('eye'), title: 'Assessed', sub: 'Not available. Stash runs no proficiency assessments, so nothing here is independently checked.' })}
          </div>
          <p class="sub">Finishing a course shows you studied it. A project shows you used it. Neither proves mastery.</p>`,
        foot: btn('Not relevant to me', { kind: 'ghost', act: 'dismiss', arg: 'skill:' + k }),
      };
    },
  },

  evidence: {
    title: 'Add project evidence', chrome: 'task',
    note: 'A short form tied to one skill. Labels sit above fields, the link is optional, errors appear on save. The footer line tells the person how the entry will be described elsewhere: self-submitted, not verified.',
    render: (ctx) => {
      const f = { skill: ctx.q.skill || 'forecasting', date: iso(ctx.env.now), ...(ctx.s.draft.evidence || {}) }, e = ctx.ui.errs || {};
      return {
        top: top({ close: 'growth', title: 'Project evidence' }),
        body: `${title('Show what you did')}
          <form class="stack" data-submit="evidence-save" novalidate>
          ${field({ label: 'Skill', bind: 'draft.evidence.skill', type: 'select', value: f.skill, options: Object.entries(SKILLS) })}
          ${field({ label: 'Project title', bind: 'draft.evidence.title', value: f.title, placeholder: 'Canteen demand forecast', err: e.title })}
          ${field({ label: 'What did you do, and what happened?', bind: 'draft.evidence.note', type: 'textarea', value: f.note, placeholder: 'Two or three sentences.', err: e.note })}
          ${field({ label: 'Link (optional)', bind: 'draft.evidence.link', type: 'url', value: f.link, placeholder: 'https://', err: e.link, hint: 'Repository, document or write-up.' })}
          ${field({ label: 'Date', bind: 'draft.evidence.date', type: 'date', value: f.date })}
          </form>`,
        foot: `${btn('Save evidence', { act: 'evidence-save' })}<p class="fine">Stored as project evidence: self-submitted, not verified.</p>`,
      };
    },
  },

  plan: {
    title: 'Study plan', chrome: 'tabs', tab: 'growth',
    note: 'Built from the skills-to-evidence list: one skill per week, each week pairing something to learn with something to apply. The plan says which role it serves and can be rebuilt after the profile changes.',
    render: (ctx) => {
      const s = ctx.s, pl = s.plan, pr = s.profile.prefs;
      if (!pl) return { top: top({ back: 'growth', title: 'Study plan' }), body: empty({ icon: 'calendar', title: 'No study plan yet', body: 'Stash builds one from the skills your target role lists where evidence is thin.', actions: btn('Create a study plan', { act: 'plan-create' }) }) };
      return {
        top: top({ back: 'growth', title: 'Study plan', right: icbtn('refresh', 'Rebuild plan', { act: 'plan-create' }) }),
        body: `${title(`Plan for ${pl.role}`, `${pr.minutes} min on ${pr.days.join(' · ')}`)}
          ${pl.weeks.length ? pl.weeks.map((w) => `<section>${sec(`${w.title}: ${SKILLS[w.skill]}`)}<div class="list">${w.items.map((it) => { const done = it.kind === 'course' ? !!s.progress[it.id]?.completedAt : it.kind === 'project' ? s.evidence.some((e) => e.skill === it.skill) : false;
            return row({ lead: `<span class="tile num ${done ? 'done' : ''}">${done ? icon('check', 18) : icon(it.kind === 'project' ? 'folder' : 'book', 18)}</span>`, title: it.label, sub: done ? 'Done' : it.kind === 'course' ? `Learn · ${it.minutes} min` : it.kind === 'project' ? 'Apply · your own project' : 'No course yet', go: it.kind === 'course' ? 'course?id=' + it.id : it.kind === 'project' ? 'evidence?skill=' + it.skill : 'explore' }); }).join('')}</div></section>`).join('')
          : notice('<span>Nothing to plan: every listed skill already has project evidence.</span>')}`,
        foot: btn('Open calendar', { icon: 'calendar', go: 'calendar' }),
      };
    },
  },

  calendar: {
    title: 'Study calendar', chrome: 'tabs', tab: 'growth',
    note: 'An actual month grid with 44px day targets. Dots mark sessions, tapping a day lists them, and sessions can be added, ticked off or removed. Export writes a real .ics file.',
    render: (ctx) => {
      const s = ctx.s, now = ctx.env.now, sel = s.draft.calDay || iso(now), base = new Date(sel + 'T12:00:00');
      const y = base.getFullYear(), m = base.getMonth(), first = (new Date(y, m, 1).getDay() + 6) % 7, n = new Date(y, m + 1, 0).getDate();
      const has = new Set(s.sessions.map((x) => x.date)), dayS = s.sessions.filter((x) => x.date === sel);
      const cell = (d) => { const k = iso(new Date(y, m, d)); return `<button type="button" class="${has.has(k) ? 'has ' : ''}${k === iso(now) ? 'today' : ''}" aria-pressed="${k === sel}" aria-label="${d} ${base.toLocaleDateString('en-GB', { month: 'long' })}${has.has(k) ? ', has a session' : ''}" ${act('set', 'draft.calDay=' + k)}>${d}</button>`; };
      const shift = (by) => iso(new Date(y, m + by, 1));
      return {
        top: top({ back: 'plan', title: 'Calendar', right: icbtn('download', 'Export calendar file', { act: 'ics' }) }),
        body: `<div class="lg-head" style="padding-top:0"><h1 class="h1" tabindex="-1">${base.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h1><div class="acts">${icbtn('back', 'Previous month', { act: 'set', arg: 'draft.calDay=' + shift(-1) })}${icbtn('next', 'Next month', { act: 'set', arg: 'draft.calDay=' + shift(1) })}</div></div>
          <div class="cal">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => `<span class="dow" aria-hidden="true">${d}</span>`).join('')}${'<span></span>'.repeat(first)}${Array.from({ length: n }, (_, i) => cell(i + 1)).join('')}</div>
          <section>${sec(day(sel, { weekday: 'long', day: 'numeric', month: 'long' }))}
            ${dayS.length ? `<div class="list">${dayS.map((x) => `<div class="row"><label class="check" style="flex:1;padding:0;align-items:center"><input type="checkbox" data-change="session-done" value="${x.id}" ${x.done ? 'checked' : ''}><span><b class="strong">${esc(x.title)}</b><span class="cap" style="display:block">${x.time} · ${x.minutes} min</span></span></label>${icbtn('trash', 'Remove session', { act: 'session-del', arg: x.id })}</div>`).join('')}</div>` : `<p class="sub">No session on this day.</p>`}
            <div class="btn-row" style="margin-top:12px">${btn(`Add ${s.profile.prefs.minutes} min session`, { kind: 'secondary', small: true, icon: 'plus', act: 'session-add', arg: sel })}${btn('Edit rhythm', { kind: 'ghost', small: true, go: 'ob-prefs?edit=1' })}</div>
          </section>`,
      };
    },
  },
};
