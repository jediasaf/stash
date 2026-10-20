// Growth: goal, job comparison, Skills Planner, study plan, calendar, project evidence.
import { esc, icon, btn, link, icbtn, chip, seg, tag, notice, row, tile, field, top, title, head, sec, empty, act, day } from './ui.js';
import { JOBS, SKILLS, CHECKS, CHECK_PASS } from './data.js';
import { job, goalJob, coverage, gaps, evidenceFor, KIND, PROOF, courseFor, prog, iso } from './store.js';

const lvl = (v) => `${v === 'Mid' ? 'Intermediate' : v}-level`;
const DISCLAIMER = 'This compares the listing with what you have recorded. It is not a chance of being hired, and a blank does not mean you lack the skill.';
const covBar = (cov) => `<div class="bar multi" role="img" aria-label="Evidence on file for ${cov.have} of ${cov.total} requirements">${cov.rows.map((r) => `<i class="${r.ev.best}"></i>`).join('')}</div>`;
const evTag = (ev) => tag(KIND[ev.best], ev.best);
const ago = (d, now) => { if (!d) return ''; const n = Math.round((now - new Date(d + (d.length === 10 ? 'T12:00:00' : ''))) / 864e5); return n <= 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`; };
const mins = (d, now) => { const m = Math.round((now - new Date(d)) / 6e4); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`; };
const money = (x) => x && x.min ? `S$${x.min.toLocaleString()}${x.max && x.max !== x.min ? ` to ${x.max.toLocaleString()}` : ''} ${String(x.type || 'Monthly').toLowerCase()}` : '';
function jobCard(s, j, now) {
  const c = coverage(s, j), live = j.source === 'MyCareersFuture';
  return `<button type="button" class="card stack-s" style="width:100%;text-align:left;cursor:pointer" data-go="job?id=${j.id}">
    <span class="tags">${live ? tag('Live · MyCareersFuture', 'src') : tag('Sample', 'sample')}${j.title === s.profile.goal.role ? tag('Your target role', 'src') : ''}</span>
    <b class="h3" style="display:block">${esc(j.title)}</b>
    <span class="sub" style="display:block">${esc(j.employer)} · ${esc(j.location)}${live ? ` · posted ${ago(j.posted, now)}` : ` · ${esc(j.mode)}`}</span>
    ${c.total ? `${covBar(c)}<span class="sub" style="display:block">Evidence on file for ${c.have} of ${c.total} skills Stash can read</span>` : `<span class="sub" style="display:block">Stash could not match this listing's skills to yours yet</span>`}
  </button>`;
}

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
            ${row({ title: 'Proof you added', sub: 'Projects, certificates, work samples', trail: `<b class="strong">${n('project')}</b>` })}
            ${row({ title: 'Completed learning', sub: 'Courses finished in Stash', trail: `<b class="strong">${n('learning')}</b>` })}
            ${row({ title: 'Self-reported', sub: 'Skills you said you have', trail: `<b class="strong">${n('self')}</b>` })}
            ${row({ title: 'Assessed', sub: n('assessed') ? 'Passed short Stash checks, not certifications' : 'No skills verified yet', trail: `<b class="strong">${n('assessed')}</b>` })}
          </div></section>
          <div class="list">
            ${j ? row({ lead: tile('list'), title: 'Proof of Skill', sub: g.length ? `${g.length} unproven` : 'Every skill your target role needs is proven', go: 'gaps' }) : ''}
            ${row({ lead: tile('calendar'), title: 'Study plan', sub: s.plan ? `${s.plan.weeks.length} weeks · ${s.sessions.filter((x) => !x.done).length} sessions left` : 'Not created yet', go: 'plan' })}
            ${row({ lead: tile('briefcase'), title: 'Suggested roles', sub: `${[...(s.live?.jobs || []), ...JOBS].filter((x) => !s.dismissed.includes('job:' + x.id)).length} roles matched${s.live?.jobs?.length ? ' · live from MyCareersFuture' : ''}`, go: 'jobs' })}
          </div>`,
      };
    },
  },

  jobs: {
    title: 'Suggested roles', chrome: 'tabs', tab: 'growth',
    note: 'Live listings come from MyCareersFuture, searched with the target role, and show their source and posting date. Sample listings stay below, labelled. No match percentage: each card counts the skills Stash could read that have evidence on file.',
    render: (ctx) => {
      const s = ctx.s, L = s.live, now = ctx.env.now, vis = (j) => !s.dismissed.includes('job:' + j.id);
      const live = (L?.jobs || []).filter(vis), samples = JOBS.filter(vis);
      const liveBlock = !L || L.status === 'loading'
        ? `<div class="card stack-s" aria-busy="true"><p class="sub">Searching MyCareersFuture for "${esc(s.profile.goal.role)}"...</p><div class="bar"><i style="transform:scaleX(.35)"></i></div></div>`
        : L.status === 'error' ? notice(`<span>${esc(L.message || 'MyCareersFuture did not answer.')} Sample listings are below.</span><div style="margin-top:6px">${link('Try again', { act: 'live-refresh' })}</div>`, { tone: 'warn', title: 'Live listings unavailable' })
        : live.length ? live.map((j) => jobCard(s, j, now)).join('') + `<p class="cap">${L.total} results for "${esc(L.used || L.q)}"${L.asked && L.used && L.asked !== L.used ? ` (nothing matched "${esc(L.asked)}" exactly)` : ''} · updated ${mins(L.fetchedAt, now)} · ${link('Refresh', { act: 'live-refresh' })}</p>`
        : `<p class="sub">No live listings matched "${esc(L.q)}" or broader searches. Try a different target role. ${link('Refresh', { act: 'live-refresh' })}</p>`;
      return {
        top: top({ back: 'growth', title: 'Suggested roles' }),
        body: `${title('Roles to look at')}
          <section class="stack">${sec('Live in Singapore')}${liveBlock}</section>
          <section class="stack">${sec('Sample listings')}<p class="sub">Written for the prototype to show the full comparison.</p>
          ${samples.length ? samples.map((j) => jobCard(s, j, now)).join('') : empty({ icon: 'briefcase', title: 'No roles left', body: 'You hid every listing.', actions: btn('Show them again', { kind: 'secondary', act: 'undismiss' }) })}</section>
          <p class="cap">${DISCLAIMER}</p>`,
      };
    },
  },

  job: {
    title: 'Job details', chrome: 'tabs', tab: 'growth',
    note: 'Explains why the role is shown and gives two ways to correct it: edit the goal or hide the listing. The apply link is disabled because the listing is a sample, and says so.',
    render: (ctx) => {
      const s = ctx.s, j = job(ctx.q.id, s), c = coverage(s, j), isGoal = j.title === s.profile.goal.role, live = j.source === 'MyCareersFuture';
      return {
        top: top({ back: 'jobs', right: icbtn('more', 'More actions', { act: 'sheet', arg: 'job:' + j.id }) }),
        body: `<div class="stack-s"><div class="tags">${live ? tag('Live · MyCareersFuture', 'src') : tag('Sample listing', 'sample')}</div><h1 class="h1" tabindex="-1">${esc(j.title)}</h1><p class="sub">${esc(j.employer)} · ${esc(j.location)}${j.mode ? ' · ' + esc(j.mode) : ''}</p>
            <p class="cap">${live ? `Source: MyCareersFuture. Posted ${ago(j.posted, ctx.env.now)}${j.expires ? `, closes ${day(j.expires)}` : ''}.${j.minYears != null ? ` Asks for ${j.minYears}+ years.` : ''}${j.salary ? ` ${money(j.salary)}.` : ''}` : `Source: ${esc(j.source)}. Posted: not applicable.`}</p></div>
          <div class="quote"><p class="eyebrow">Why you see this</p><p>${isGoal ? 'It has the same title as your target role.' : live ? `It came up in a search for your target role, ${esc(s.profile.goal.role)}.` : `It shares ${c.rows.filter((r) => r.ev.best !== 'none').length} skills with what you have on file.`}</p><div>${link('Edit my goal', { go: 'ob-goal?edit=1' })} &nbsp; ${link('Hide this role', { act: 'dismiss', arg: 'job:' + j.id })}</div></div>
          <section>${sec(live ? 'Skills Stash could read' : 'What it asks for')}${j.requirements.length ? `<ul class="list">${j.requirements.map((r) => row({ title: r.text, sub: `${SKILLS[r.skill]} · ${r.must ? 'Essential' : live ? 'Listed' : 'Nice to have'}` })).join('')}</ul>` : '<p class="sub">None of the listed skills match skills Stash tracks yet.</p>'}</section>
          ${live && j.skills?.length ? `<section>${sec('Everything the listing names')}<div class="tags">${j.skills.map((x) => tag(x)).join('')}</div></section>` : ''}
          ${live && j.summary ? `<section>${sec('From the description')}<p class="sub">${esc(j.summary)}${j.summary.length >= 700 ? '...' : ''}</p></section>` : ''}`,
        foot: `${btn('Compare with my profile', { go: 'compare?id=' + j.id, disabled: !j.requirements.length })}${live && j.url ? `<a class="btn btn-secondary" href="${esc(j.url)}" target="_blank" rel="noopener">Open on MyCareersFuture</a>` : btn('Original listing unavailable (sample)', { kind: 'secondary', disabled: true })}`,
      };
    },
  },

  compare: {
    title: 'Requirement comparison', chrome: 'tabs', tab: 'growth',
    note: 'Every requirement is tied to a named piece of evidence and its kind. A blank reads "Not shown yet", never "missing skill", and offers "I have this" beside "Learn". The fit summary is a count with a plain disclaimer.',
    render: (ctx) => {
      const s = ctx.s, j = job(ctx.q.id, s), c = coverage(s, j);
      return {
        top: top({ back: 'job?id=' + j.id, title: j.title }),
        body: `${title(`Evidence on file for ${c.have} of ${c.total} requirements`)}
          ${covBar(c)}<div class="tags">${tag('Proof', 'project')}${tag('Check', 'assessed')}${tag('Learning', 'learning')}${tag('Self-reported', 'self')}${tag('Not shown yet', 'none')}</div>
          <p class="sub">${DISCLAIMER}</p>
          ${c.rows.map((r) => { const ref = r.ev.project[0] ? `${PROOF[r.ev.project[0].proof || 'project']}: ${r.ev.project[0].title} · ${day(r.ev.project[0].date)}` : r.ev.assessed[0] ? `Passed the Stash check, ${r.ev.assessed[0].score} of ${r.ev.assessed[0].total}` : r.ev.learning[0] ? `Finished: ${r.ev.learning[0].title}` : r.ev.self ? 'You said you have this skill' : 'Nothing recorded for this yet'; const cr = courseFor(r.skill);
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
    note: 'Four kinds of evidence for one skill, kept separate: proof added, a passed Stash check, completed learning, and a self-report. Each can be added or corrected here. The check is short and says plainly that it is not a certification.',
    render: (ctx) => {
      const s = ctx.s, k = ctx.q.id in SKILLS ? ctx.q.id : 'sql', ev = evidenceFor(s, k), c = courseFor(k), ch = (s.checks || {})[k];
      return {
        top: top({ back: 'gaps', title: 'Skill' }),
        body: `<div class="stack-s"><h1 class="h1" tabindex="-1">${esc(SKILLS[k])}</h1><div class="tags">${evTag(ev)}</div></div>
          <div class="list">
            ${row({ lead: tile('folder'), title: 'Proof you added', sub: ev.project.length ? ev.project.map((e) => `${PROOF[e.proof || 'project']}: ${e.title}${e.file ? ' (file attached)' : ''}`).join('; ') : 'None yet. Add a project, certificate or work sample.', trail: link('Add', { go: 'evidence?skill=' + k }) })}
            ${row({ lead: tile('check'), title: 'Skill check', sub: !CHECKS[k] ? 'No check for this skill yet.' : ch ? `${ch.score >= CHECK_PASS ? 'Passed' : 'Not passed'}: ${ch.score} of ${ch.total} · ${day(ch.date)}` : `${CHECKS[k].length} questions, about 2 minutes.`, trail: CHECKS[k] ? link(ch ? 'Retake' : 'Take it', { go: 'check?skill=' + k }) : '' })}
            ${row({ lead: tile('book'), title: 'Completed learning', sub: ev.learning.length ? ev.learning.map((x) => x.title).join(', ') : c ? `Not yet. ${c.title} covers it.` : 'No course covers this yet.', trail: c && !ev.learning.length ? link('Open', { go: 'course?id=' + c.id }) : '' })}
            ${row({ lead: tile('profile'), title: 'Self-reported', sub: ev.self ? 'You said you have this skill.' : 'You have not claimed this skill.', trail: link(ev.self ? 'Withdraw' : 'I have this', { act: 'toggle-in', arg: 'profile.selfSkills|' + k }) })}
          </div>
          <p class="sub">A course shows you studied it, a check shows you can recall it, and proof shows you used it. Stash does not verify proof, and none of this is a certification.</p>`,
        foot: btn('Not relevant to me', { kind: 'ghost', act: 'dismiss', arg: 'skill:' + k }),
      };
    },
  },

  evidence: {
    title: 'Add proof', chrome: 'task',
    note: 'One form for three kinds of proof: a project, a certificate, or a work sample. A file can be attached and stays on the device. Errors appear on save. The footer says how the entry will be described elsewhere: added by you, not verified.',
    render: (ctx) => {
      const f = { skill: ctx.q.skill || 'sql', proof: 'project', date: iso(ctx.env.now), ...(ctx.s.draft.evidence || {}) }, e = ctx.ui.errs || {}, cert = f.proof === 'certificate';
      return {
        top: top({ close: 'growth', title: 'Add proof' }),
        body: `${title('Show what you can do')}
          <form class="stack" data-submit="evidence-save" novalidate>
          <div><p class="label">Kind of proof</p><div style="margin-top:6px">${seg('Kind of proof', [['project', 'Project'], ['certificate', 'Certificate'], ['sample', 'Work sample']], f.proof, 'set', 'draft.evidence.proof=')}</div></div>
          ${field({ label: 'Skill', bind: 'draft.evidence.skill', type: 'select', value: f.skill, options: Object.entries(SKILLS) })}
          ${field({ label: cert ? 'Certificate name' : f.proof === 'sample' ? 'What is the sample?' : 'Project title', bind: 'draft.evidence.title', value: f.title, placeholder: cert ? 'Machine Learning Specialization' : f.proof === 'sample' ? 'Enforcement trends dashboard' : 'Spam-cluster detection notebook', err: e.title })}
          ${cert ? field({ label: 'Issued by', bind: 'draft.evidence.issuer', value: f.issuer, placeholder: 'Coursera, SMU, Google...', err: e.issuer }) : ''}
          ${field({ label: cert ? 'Notes (optional)' : 'What did you do, and what happened?', bind: 'draft.evidence.note', type: 'textarea', value: f.note, placeholder: cert ? 'What it covered.' : 'Two or three sentences.', err: e.note })}
          ${field({ label: cert ? 'Credential link (optional)' : 'Link (optional)', bind: 'draft.evidence.link', type: 'url', value: f.link, placeholder: 'https://', err: e.link, hint: cert ? 'The verification page, if the issuer has one.' : 'Repository, document or write-up.' })}
          <div class="stack-s"><p class="label">Attachment (optional)</p>${f.file ? `<div class="list">${row({ lead: tile('file'), title: f.file.name, sub: `${Math.max(1, Math.round(f.file.size / 1024))} KB · stays on this device`, trail: link('Remove', { act: 'evidence-file-del' }) })}</div>` : `<div class="filebtn"><input type="file" id="evf" accept="application/pdf,image/png,image/jpeg" data-change="evidence-file"><label for="evf" class="btn btn-secondary">${icon('upload', 20)}<span>Attach PDF or image</span></label></div><p class="cap">Up to 5 MB. Kept on this device only.</p>`}${e.file ? `<span class="err" role="alert">${icon('alert', 16)}${esc(e.file)}</span>` : ''}</div>
          ${field({ label: cert ? 'Date issued' : 'Date', bind: 'draft.evidence.date', type: 'date', value: f.date })}
          </form>`,
        foot: `${btn('Save proof', { act: 'evidence-save' })}<p class="fine">Saved as proof you added. Stash does not verify it.</p>`,
      };
    },
  },

  check: {
    title: 'Skill check', chrome: 'task',
    note: 'Four short questions for one skill. Real radio buttons, one submit, then the answers with explanations. Passing three of four records "Passed skill check", described everywhere as a short recall check rather than a certification.',
    render: (ctx) => {
      const s = ctx.s, k = CHECKS[ctx.q.skill] ? ctx.q.skill : 'ml', qs = CHECKS[k], ans = (s.draft.check && s.draft.check.skill === k ? s.draft.check.a : null) || [];
      const done = qs.every((_, i) => ans[i] != null);
      return {
        top: top({ close: 'skill?id=' + k, title: `${SKILLS[k]} check` }),
        body: `${title(`${SKILLS[k]}: quick check`, `${qs.length} questions. Pass with ${CHECK_PASS}.`)}
          ${qs.map((q, i) => `<fieldset class="stack-s"><legend class="h3" style="margin-bottom:8px">${i + 1}. ${esc(q.q)}</legend>${q.options.map((o, n) => `<label class="opt"><input type="radio" name="c${i}" value="${n}" data-change="check-pick" data-q="${i}" ${ans[i] === n ? 'checked' : ''}><span>${esc(o)}</span></label>`).join('')}</fieldset>`).join('')}
          <p class="cap">Checks recall, not on-the-job skill. Not a certification.</p>`,
        foot: btn(done ? 'See my result' : `Answer all ${qs.length} to finish`, { act: 'check-submit', arg: k, disabled: !done }),
      };
    },
  },

  'check-done': {
    title: 'Check result', chrome: 'task',
    note: 'Shows the score, each question with the right answer, and exactly what was recorded. A pass adds "Passed skill check" to the skill; a fail records nothing and invites a retake.',
    render: (ctx) => {
      const s = ctx.s, k = CHECKS[ctx.q.skill] ? ctx.q.skill : 'policy', qs = CHECKS[k], r = s.draft.checkResult && s.draft.checkResult.skill === k ? s.draft.checkResult : null, best = (s.checks || {})[k];
      const score = r ? r.score : best ? best.score : 0, pass = score >= CHECK_PASS;
      return {
        top: top({ close: 'skill?id=' + k, title: `${SKILLS[k]} check` }),
        body: `<div class="empty" style="padding-top:12px"><span class="ring" style="${pass ? 'border-style:solid;border-color:var(--emerald);color:var(--emerald-strong)' : ''}">${icon(pass ? 'check' : 'refresh', 30)}</span><h1 class="h1" tabindex="-1">${score} of ${qs.length}${pass ? ': passed' : ''}</h1><p class="sub">${pass ? `"Passed skill check" is now on ${esc(SKILLS[k])}. It means you recalled the basics, not that you are certified.` : `Nothing was recorded. You need ${CHECK_PASS} to pass, and you can retake it.`}</p></div>
          ${r ? `<ol class="list">${qs.map((q, i) => row({ lead: `<span class="tile num ${r.a[i] === q.answer ? 'done' : ''}">${icon(r.a[i] === q.answer ? 'check' : 'x', 18)}</span>`, title: q.q, sub: `Answer: ${q.options[q.answer]}` })).join('')}</ol>` : ''}`,
        foot: `${btn('Back to the skill', { go: 'skill?id=' + k })}${pass ? '' : btn('Retake', { kind: 'secondary', act: 'check-retake', arg: k })}`,
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
