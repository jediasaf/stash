// Account entry, onboarding, profile and preferences.
import { esc, icon, btn, link, chip, seg, tag, notice, demo, row, tile, bar, field, toggle, top, title, head, sec, kb, act } from './ui.js';
import { SKILLS, TOPICS, ROLES, PROVIDERS } from './data.js';
import { evidenceFor, KIND } from './store.js';

const d = (ctx, k) => ctx.s.draft[k] || {};
const lvl = (v) => `${v === 'Mid' ? 'Intermediate' : v}-level`;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default {
  welcome: {
    title: 'Welcome', chrome: 'auth', noBar: true,
    note: 'Three clear choices, ranked. No tab bar before sign-in. States the three things Stash does in plain words and says up front that this build holds sample content.',
    render: () => ({
      body: `<div style="padding-top:24px" class="stack">
        <p class="h2" style="color:var(--emerald)" aria-label="Stash">stash</p>
        ${title('Short lessons. Shortest path to your next role')}
        <div class="list plain" style="margin-top:28px">
          ${row({ lead: tile('book'), title: 'Learn in five-minute ideas', sub: 'Read or listen, then try one thing.' })}
          ${row({ lead: tile('headphones'), title: 'Turn a PDF into a podcast', sub: 'Solo narration or a two-host conversation.' })}
          ${row({ lead: tile('target'), title: 'See what a target role asks for', sub: 'Compared with evidence you have recorded.' })}
        </div></div>`,
      foot: `${btn('Create account', { act: 'start-create' })}${btn('Sign in', { kind: 'secondary', go: 'signin' })}${btn('Look around first', { kind: 'ghost', act: 'guest' })}<p class="fine">Prototype with sample content. Your data stays on this device.</p>`,
    }),
  },

  signin: {
    title: 'Sign in', chrome: 'auth',
    note: 'Labelled fields, show/hide password, errors appear after submit and name the fix. The error never reveals whether an account exists. Demo sign-in is stated, not hidden.',
    render: (ctx) => {
      const f = d(ctx, 'signin'), e = ctx.ui.errs || {}, isNew = ctx.q.new;
      if (isNew) return {
        top: top({ back: 'welcome' }),
        body: `${title('Create your account')}
          <form class="stack" data-submit="signin" novalidate>
          ${field({ label: 'First name', bind: 'profile.name', value: ctx.s.profile.name, attrs: 'autocomplete="given-name"', hint: 'Optional. Used in greetings.' })}
          ${field({ label: 'Email', bind: 'draft.signin.email', type: 'email', value: f.email, placeholder: 'you@example.com', err: e.email, attrs: 'autocomplete="email" inputmode="email"' })}
          ${field({ label: 'Password', bind: 'draft.signin.pw', type: f.show ? 'text' : 'password', value: f.pw, err: e.pw, hint: '8 characters or more', attrs: 'autocomplete="new-password"', wrap: (c) => `<div class="pw">${c}<button type="button" ${act('toggle', 'draft.signin.show')} aria-pressed="${!!f.show}">${f.show ? 'Hide' : 'Show'}</button></div>` })}
          ${btn('Create account', { act: 'signin', arg: 'new' })}
          </form>
          ${demo('No account service is connected. The account exists only in this browser and the password is not stored.')}`,
        foot: `<p class="fine">Already have one? ${link('Sign in', { go: 'signin' })}</p>`,
      };
      return {
        top: top({ back: 'welcome' }),
        body: `${title('Welcome back')}
          <form class="stack" data-submit="signin" novalidate>
          ${field({ label: 'Email', bind: 'draft.signin.email', type: 'email', value: f.email, placeholder: 'you@example.com', err: e.email, attrs: 'autocomplete="email" inputmode="email"' })}
          ${field({ label: 'Password', bind: 'draft.signin.pw', type: f.show ? 'text' : 'password', value: f.pw, err: e.pw, hint: '8 characters or more', attrs: 'autocomplete="current-password"', wrap: (c) => `<div class="pw">${c}<button type="button" ${act('toggle', 'draft.signin.show')} aria-pressed="${!!f.show}">${f.show ? 'Hide' : 'Show'}</button></div>` })}
          ${btn('Sign in', { act: 'signin' })}
          </form>
          <div class="center">${link('Forgot password?', { go: 'recover' })}</div>
          ${demo('No account service is connected. Any valid email with an 8+ character password continues, and nothing is sent.')}`,
        foot: `<p class="fine">New here? ${link('Create account', { act: 'start-create' })}</p>`,
      };
    },
  },

  recover: {
    title: 'Reset password', chrome: 'auth',
    note: 'One field, then a confirmation state that reads the same whether or not the account exists. The old design showed "check your inbox" before anything was sent.',
    render: (ctx) => {
      const f = d(ctx, 'recover'), e = ctx.ui.errs || {};
      if (f.sent) return {
        top: top({ back: 'signin' }),
        body: `<div class="empty" style="padding-top:64px"><span class="ring">${icon('check', 30)}</span><h1 class="h1" tabindex="-1">Check your inbox</h1><p class="sub">If an account exists for <b class="strong">${esc(f.email)}</b>, a reset link is on its way. It expires in 30 minutes.</p></div>
          ${demo('No email was sent. A live build needs an auth service.')}`,
        foot: `${btn('Back to sign in', { go: 'signin' })}${btn('Use a different email', { kind: 'ghost', act: 'set', arg: 'draft.recover.sent=false' })}`,
      };
      return {
        top: top({ back: 'signin' }),
        body: `${title('Reset your password', 'Enter your email and we will send a link.')}
          <form class="stack" data-submit="recover" novalidate>${field({ label: 'Email', bind: 'draft.recover.email', type: 'email', value: f.email, placeholder: 'you@example.com', err: e.email, attrs: 'autocomplete="email"' })}</form>`,
        foot: btn('Send reset link', { act: 'recover' }),
      };
    },
  },

  'ob-goal': {
    title: 'Your goal', chrome: 'auth',
    note: 'Career goal is optional. "Just curious" is a first-class path, so nobody has to invent a job target to start learning. Editable later from Growth.',
    render: (ctx) => {
      const p = ctx.s.profile, edit = ctx.q.edit;
      return {
        top: top({ back: edit ? 'growth' : 'welcome', step: edit ? null : [1, 4], title: edit ? 'Edit goal' : '' }),
        body: `${title('What are you working toward?')}
          ${seg('Goal type', [['career', 'A target role'], ['curious', 'Just curious']], p.mode, 'set', 'profile.mode=')}
          ${p.mode === 'career' ? `
            ${field({ label: 'Target role', bind: 'profile.goal.role', value: p.goal.role, hint: 'Sample listings exist for the roles below.' })}
            <div class="chips">${ROLES.map((r) => chip(r, { on: p.goal.role === r, act: 'set', arg: 'profile.goal.role=' + r })).join('')}</div>
            ${field({ label: 'Location', bind: 'profile.goal.location', value: p.goal.location })}
            <div><p class="label" id="lvl">Experience</p><div style="margin-top:6px">${seg('Experience', [['Entry', 'Entry'], ['Intermediate', 'Intermediate'], ['Senior', 'Senior']], p.goal.level, 'set', 'profile.goal.level=')}</div>
            <p class="cap" style="margin-top:8px">${{ Entry: 'Entry: new to this kind of role, or up to about 2 years in it.', Intermediate: 'Intermediate: about 2 to 5 years, working without close supervision.', Senior: 'Senior: 5 years or more, leading work or mentoring others.' }[p.goal.level] || ''}</p></div>`
          : notice('<span>No goal needed. Stash will suggest ideas from the topics you pick next. You can add a target role later under &quot;Growth&quot;.</span>')}`,
        foot: btn(edit ? 'Save goal' : 'Continue', { act: 'ob-next', arg: edit ? 'growth' : p.mode === 'career' ? 'ob-resume' : 'ob-interests' }),
      };
    },
  },

  'ob-resume': {
    title: 'What you know', chrome: 'auth',
    note: 'No silent inference. A PDF resume is read on the device and each skill it mentions is shown with the sentence it came from. Nothing is recorded until the person taps Add, and everything is stored as self-reported.',
    render: (ctx) => {
      const p = ctx.s.profile, r = p.resume, edit = ctx.q.edit;
      const found = r?.found || [];
      const resumeBlock = !r ? `<div class="filebtn"><input type="file" id="resume" accept=".pdf,.doc,.docx" data-change="resume"><label for="resume" class="btn btn-secondary">${icon('upload', 20)}<span>Upload resume</span></label></div><p class="cap">PDF is read on this device to suggest skills. DOCX is attached but not read yet. Nothing is uploaded.</p>`
        : r.status === 'reading' ? `<div class="card stack-s">${row({ lead: tile('file'), title: r.name, sub: `Reading on this device · page ${r.done || 0} of ${r.total || '?'}` }).replace('class="row"', 'class="row" style="padding:0;border:0;min-height:0"')}${bar(r.total ? r.done / r.total : 0.05, 'Reading resume')}</div>`
        : `<div class="list">${row({ lead: tile('file'), title: r.name, sub: `${kb(r.size)} · ${r.read ? `read on this device · ${found.length} skill${found.length === 1 ? '' : 's'} found` : r.error ? 'could not be read' : 'attached, not read'}`, trail: link('Remove', { act: 'set', arg: 'profile.resume=null' }) })}</div>
          ${r.error ? notice(`<span>${esc(r.error)} Your skills list is unchanged; pick skills above instead.</span>`, { tone: 'warn', title: 'Resume not read' })
          : !r.read ? notice('<span>Word files are attached but not read in this prototype. Upload a PDF to get suggestions, or pick skills above.</span>', { title: 'Attached, not analysed' })
          : found.length ? `<div><p class="label">Found in your resume</p><p class="cap" style="margin:2px 0 6px">Tap Add for the ones you would claim. Nothing is added for you.</p><div class="list">${found.map((f) => { const on = p.selfSkills.includes(f.skill); return row({ title: SKILLS[f.skill], sub: `"${f.snippet}"`, trail: `<button type="button" class="chip" aria-pressed="${on}" ${act('toggle-in', 'profile.selfSkills|' + f.skill)} aria-label="${on ? 'Remove' : 'Add'} ${esc(SKILLS[f.skill])}">${on ? icon('check', 16) + 'Added' : 'Add'}</button>` }); }).join('')}</div></div>`
          : notice('<span>No skills from the list above were mentioned. Pick them yourself instead.</span>', { title: 'Nothing matched' })}`;
      return {
        top: top({ back: edit ? 'profile' : 'ob-goal', step: edit ? null : [2, 4], title: edit ? 'Skills and resume' : '' }),
        body: `${title('Add what you already know', 'Upload your resume, or pick the skills you would claim today.')}
          <div class="stack">${sec('Resume (optional)')}${resumeBlock}</div>
          <div><p class="label">Skills</p><div class="chips" style="margin-top:6px" role="group" aria-label="Skills">${Object.entries(SKILLS).map(([k, v]) => chip(v, { on: p.selfSkills.includes(k), tick: true, act: 'toggle-in', arg: 'profile.selfSkills|' + k })).join('')}</div>
          <p class="cap" style="margin-top:8px">Saved as <b class="strong">self-reported</b>. You can back them with projects later.</p></div>`,
        foot: edit ? btn('Done', { go: 'profile' }) : `${btn('Continue', { go: 'ob-interests' })}${btn('Skip for now', { kind: 'ghost', go: 'ob-interests' })}`,
      };
    },
  },

  'ob-interests': {
    title: 'Interests', chrome: 'auth',
    note: 'Multi-select chips with a visible minimum. Format choice sits here because it changes what Today shows (read, listen or both).',
    render: (ctx) => {
      const p = ctx.s.profile;
      return {
        top: top({ back: p.mode === 'career' ? 'ob-resume' : 'ob-goal', step: [3, 4] }),
        body: `${title('Pick a few topics', 'At least one. Change them any time.')}
          <div class="chips" role="group" aria-label="Topics">${TOPICS.map((t) => chip(t, { on: p.interests.includes(t), tick: true, act: 'toggle-in', arg: 'profile.interests|' + t })).join('')}</div>
          <div><p class="label">How do you like to learn?</p><div style="margin-top:6px">${seg('Format', [['read', 'Read'], ['listen', 'Listen'], ['both', 'Both']], p.prefs.format, 'set', 'profile.prefs.format=')}</div></div>`,
        foot: btn('Continue', { go: 'ob-prefs', disabled: !p.interests.length }),
      };
    },
  },

  'ob-prefs': {
    title: 'Study rhythm', chrome: 'auth',
    note: 'Time budget, days and hour drive the study calendar. Reminders are off until the person opts in. The summary shows exactly what will be saved before they commit.',
    render: (ctx) => {
      const p = ctx.s.profile, pr = p.prefs, edit = ctx.q.edit;
      return {
        top: top({ back: edit ? 'calendar' : 'ob-interests', step: edit ? null : [4, 4], title: edit ? 'Study rhythm' : '' }),
        body: `${title('When will you study?')}
          <div><p class="label">Minutes a day</p><div style="margin-top:6px">${seg('Minutes a day', [[5, '5'], [10, '10'], [15, '15'], [30, '30']], pr.minutes, 'set', 'profile.prefs.minutes=')}</div></div>
          <div><p class="label">Days</p><div class="chips" style="margin-top:6px" role="group" aria-label="Days">${DAYS.map((x) => chip(x, { on: pr.days.includes(x), act: 'toggle-in', arg: 'profile.prefs.days|' + x })).join('')}</div></div>
          ${field({ label: 'Usual time', bind: 'profile.prefs.time', type: 'time', value: pr.time })}
          ${toggle('Reminders', 'Off by default. Needs notification permission.', pr.reminders, 'toggle', 'profile.prefs.reminders')}
          ${edit ? '' : `<div class="card"><p class="eyebrow">Your starter profile</p><dl class="kv" style="margin-top:10px">
            <dt>Goal</dt><dd>${p.mode === 'career' ? esc(p.goal.role) : 'Learning for curiosity'}</dd>
            <dt>Topics</dt><dd>${esc(p.interests.join(', '))}</dd>
            <dt>Skills</dt><dd>${p.selfSkills.length} self-reported</dd>
            <dt>Rhythm</dt><dd>${pr.minutes} min · ${pr.days.length} days a week</dd></dl></div>`}`,
        foot: btn(edit ? 'Save rhythm' : 'Build my Today', { act: edit ? 'rhythm-save' : 'ob-finish', disabled: !pr.days.length }),
      };
    },
  },

  profile: {
    title: 'Profile', chrome: 'tabs', tab: 'profile',
    note: 'Skills are grouped by the strongest kind of evidence on file, never as a single "level". Each row opens the skill so it can be corrected. Import, export and preferences live here once, not on three screens.',
    render: (ctx) => {
      const s = ctx.s, p = s.profile;
      const skills = [...new Set([...p.selfSkills, ...s.evidence.map((e) => e.skill), ...Object.keys(SKILLS).filter((k) => evidenceFor(s, k).best !== 'none')])];
      return {
        body: `${head(p.name || (s.session?.kind === 'guest' ? 'Guest' : 'Your profile'), { over: p.current || s.session?.email || 'Not signed in', acts: `<button class="icbtn" data-go="settings" aria-label="Preferences">${icon('settings')}</button>` })}
          ${s.session?.kind === 'guest' ? notice('<span>You are browsing as a guest. Progress is kept on this device only.</span>') : ''}
          <div class="list">
            ${row({ lead: tile('target'), title: p.mode === 'career' ? p.goal.role : 'Learning for curiosity', sub: p.mode === 'career' ? `${p.goal.location} · ${lvl(p.goal.level)}` : 'No target role set', go: 'ob-goal?edit=1' })}
            ${row({ lead: tile('clock'), title: `${p.prefs.minutes} min · ${p.prefs.days.join(' · ')}`, sub: 'Study rhythm', go: 'ob-prefs?edit=1' })}
          </div>
          <div>${sec('Skills on file', link('Add', { go: 'ob-resume?edit=1' }))}
          ${skills.length ? `<div class="list">${skills.map((k) => { const ev = evidenceFor(s, k); return row({ title: SKILLS[k], extra: `<span class="tags" style="margin-top:4px">${tag(KIND[ev.best], ev.best)}</span>`, go: 'skill?id=' + k }); }).join('')}</div>` : `<p class="sub">Nothing recorded yet. Add skills you have, or finish a course.</p>`}
          <p class="cap" style="margin-top:8px">Consider relevant certification courses.</p></div>
          <div class="list">
            ${row({ lead: tile('refresh'), title: 'Sync across devices', sub: s.sync ? `On · last synced ${s.sync.lastPush ? new Date(s.sync.lastPush).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'not yet'}` : 'Off', go: 'sync' })}
            ${row({ lead: tile('upload'), title: 'Import content', go: 'import' })}
            ${row({ lead: tile('download'), title: 'Export my data', go: 'export' })}
            ${row({ lead: tile('settings'), title: 'Preferences and privacy', go: 'settings' })}
          </div>
          ${btn(s.session?.kind === 'guest' ? 'Create account' : 'Sign out', { kind: 'secondary', act: 'signout' })}`,
      };
    },
  },

  settings: {
    title: 'Preferences', chrome: 'tabs', tab: 'profile',
    note: 'Real, persisted accessibility controls: text size, reduced transparency, reduced motion. Privacy explains where documents are processed. Integration status is listed so nobody mistakes demo behaviour for a live service.',
    render: (ctx) => {
      const a = ctx.s.a11y;
      return {
        top: top({ back: 'profile', title: 'Preferences' }),
        body: `<h1 class="sr" tabindex="-1">Preferences</h1>
          <div>${sec('Reading and motion')}
            <p class="label">Text size</p><div style="margin:6px 0 8px">${seg('Text size', [[1, 'Default'], [1.12, 'Large'], [1.25, 'Larger']], a.text, 'set', 'a11y.text=')}</div>
            ${toggle('Reduce transparency', 'Solid surfaces instead of glass.', a.solid, 'toggle', 'a11y.solid')}
            ${toggle('Reduce motion', 'Turns off sheet and progress animation.', a.calm, 'toggle', 'a11y.calm')}
          </div>
          <div>${sec('Privacy')}
            <p class="sub">PDFs are read in your browser. The file is not uploaded and is not stored. Extracted text, scripts and progress are saved in this browser until you delete them.</p>
            <div class="btn-row" style="margin-top:12px">${btn('Export my data', { kind: 'secondary', small: true, go: 'export' })}${btn('Delete all data', { kind: 'danger', small: true, act: 'sheet', arg: 'wipe' })}</div>
          </div>
          ${ctx.env.dev ? `<div>${sec('What is connected')}
            <div class="list plain">${PROVIDERS.map(([n, now, need]) => row({ title: n, sub: `${esc(now)}<br><span class="cap">Live build needs: ${esc(need)}</span>`, subHtml: true })).join('')}</div>
          </div>
          <div>${sec('Prototype controls')}
            ${toggle('Fail the next audio job', 'Demo only. Lets you test recovery.', ctx.s.demo.failNext, 'toggle', 'demo.failNext')}
            ${toggle('Record this session', 'For usability tests. Logs screens and taps with times, on this device only.', ctx.s.demo.logging, 'toggle', 'demo.logging')}
            <p class="cap">Session log: ${(ctx.s.log || []).length} events. ${link('Download', { act: 'log-download' })} &nbsp; ${link('Clear', { act: 'log-clear' })}</p>
            <div class="btn-row">${btn('Load showcase data', { kind: 'secondary', small: true, act: 'showcase' })}</div>
          </div>` : ''}`,
      };
    },
  },

  sync: {
    title: 'Sync', chrome: 'tabs', tab: 'profile',
    note: 'Sync without a password. A random code is the only key: progress is encrypted on the device before it is stored, so the server holds only ciphertext. The screen says what syncs, what stays local, and what losing the code means.',
    render: (ctx) => {
      const s = ctx.s, y = s.sync, busy = ctx.ui.busy === 'sync';
      return {
        top: top({ back: 'profile', title: 'Sync' }),
        body: y ? `${title('Sync is on', 'Use this code on your other phone or laptop.')}
            <div class="card center stack-s"><p class="eyebrow">Your sync code</p><p class="h2" style="letter-spacing:0.08em;font-variant-numeric:tabular-nums" aria-label="Sync code ${esc(y.code.split('').join(' '))}">${esc(y.code)}</p><div>${link('Copy code', { act: 'sync-copy' })}</div></div>
            ${notice('<span>Anyone with this code can open your copy, and nobody, including Stash, can open it without the code. If you lose it, the copy cannot be recovered.</span>', { title: 'Keep it private' })}
            <dl class="kv"><dt>Last synced</dt><dd>${y.lastPush ? new Date(y.lastPush).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Not yet'}</dd><dt>Status</dt><dd>${busy ? 'Syncing...' : y.error ? 'Last try failed' : 'Up to date'}</dd></dl>
            ${y.error ? notice(`<span>${esc(y.error)}</span>`, { tone: 'warn', title: 'Sync did not finish' }) : ''}
            <section>${sec('What syncs')}<p class="sub">Profile, goal, skills, proof details, progress, takeaways, imports, study plan and scripts. Audio files and attachments stay on the device that made them.</p></section>`
          : `${title('Use Stash on more than one device', 'No password needed.')}
            <ul class="stack-s sub"><li>${icon('check', 16)} Stash makes a private code for you.</li><li>${icon('check', 16)} Your progress is encrypted on this device before it is stored, so only that code can open it.</li><li>${icon('check', 16)} Enter the code on another device to pick up where you left off.</li></ul>`,
        foot: y ? `${btn(busy ? 'Syncing...' : 'Sync now', { act: 'sync-now', disabled: busy })}${btn('Turn off sync', { kind: 'ghost', act: 'sync-off' })}`
          : `${btn('Turn on sync', { act: 'sync-on', disabled: busy })}${btn('I have a code', { kind: 'secondary', go: 'sync-join' })}`,
      };
    },
  },

  'sync-join': {
    title: 'Use a sync code', chrome: 'task',
    note: 'Restores a synced copy on a new device. The code is validated and the copy decrypted on the device. The person is told plainly that this replaces what is on this device.',
    render: (ctx) => {
      const v = ctx.s.draft.syncCode || '', e = ctx.ui.errs || {}, busy = ctx.ui.busy === 'sync';
      return {
        top: top({ back: 'sync', title: 'Sync' }),
        body: `${title('Enter your sync code', 'It is on the Sync screen of your other device.')}
          <form class="stack" data-submit="sync-join" novalidate>${field({ label: 'Sync code', bind: 'draft.syncCode', value: v, placeholder: 'ABCD-EFGH-JKLM-NPQR', err: e.code, attrs: 'autocomplete="off" autocapitalize="characters" spellcheck="false"' })}</form>
          ${notice('<span>Your progress on this device will be replaced by the synced copy.</span>', { tone: 'warn', title: 'This replaces local data' })}`,
        foot: btn(busy ? 'Opening...' : 'Open my copy', { act: 'sync-join', disabled: busy }),
      };
    },
  },
};
