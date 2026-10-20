// Listening and the PDF-to-podcast flow. Also the mini-player and all bottom sheets.
import { esc, icon, btn, link, icbtn, chip, seg, tag, notice, demo, row, tile, bar, field, toggle, top, title, head, sec, empty, act, go, fmt, mins, kb, day } from './ui.js';
import { SAMPLE_EPISODES, SAMPLE_DOC, P2P_DEFAULTS, P2P_LIMITS, STAGES, JOBS } from './data.js';
import { episode, course, why, job } from './store.js';
import { P2P_ERRORS, scriptStats, buildScript, VOICES } from './services.js';
import { epRow, p2pBand } from './s-learn.js';

const RATES = [0.8, 1, 1.25, 1.5, 2];
const p2p = (s) => s.draft.p2p || {};
const docOf = (s, id) => s.docs.find((d) => d.id === (id || p2p(s).docId)) || s.docs[0] || SAMPLE_DOC;
const scriptOf = (s, id) => s.scripts.find((x) => x.id === (id || p2p(s).scriptId)) || s.scripts.at(-1);
const curJob = (s) => s.jobs.find((j) => j.scriptId === p2p(s).scriptId) || s.jobs.at(-1);
const art = (e, sm, md) => `<div class="art ${sm ? 'sm' : ''} ${md ? 'md' : ''} ${e.kind === 'generated' ? '' : 'pub'}" ${sm ? 'aria-hidden="true"' : 'role="img" aria-label="Episode artwork"'}>${sm ? icon(e.kind === 'generated' ? 'file' : 'mic', 20) : `<span class="k">${e.kind === 'generated' ? `From your PDF · ${e.format === 'duo' ? 'Two hosts' : 'Solo'}` : e.kind === 'course' ? 'Course audio' : 'Sample episode'}</span><span class="t">${esc(e.title)}</span>`}</div>`;
const voiceNote = (ctx, e) => e && e.audio ? 'Real audio, rendered on the device that made it with an open-source voice (Kokoro).' : ctx.env.tts ? 'Playback is your device voice reading the text aloud. No audio file exists.' : 'This browser has no speech voice, so playback is a silent timer over the transcript.';
const stepTop = (n, back, t) => top({ back, title: `PDF to podcast · ${n} of 5`, step: [n, 5], right: icbtn('x', 'Close and keep draft', { go: 'stash' }) });
const srcTag = (sg, docId) => sg.kind === 'source' ? `<button type="button" class="pglink" ${go(`p2p-source?doc=${docId || ''}&p=${sg.page}`)} aria-label="From the PDF, open page ${sg.page}"><span class="tag src">From PDF · p. ${sg.page}</span></button>` : tag('Added by Stash', 'added');

export function mini(ctx) {
  const P = ctx.s.player, e = episode(ctx.s, P.ep); if (!e) return '';
  return `<div class="mini" role="region" aria-label="Now playing">
    <button type="button" class="open" ${go('player')} aria-label="Open player: ${esc(e.title)}">${art(e, true)}<span class="meta"><b>${esc(e.title)}</b><span><span data-p="cur">${fmt(P.t)}</span> of ${fmt(e.duration)}</span></span></button>
    ${icbtn(P.playing ? 'pause' : 'play', P.playing ? 'Pause' : 'Play', { act: 'pp' })}${icbtn('x', 'Stop and close player', { act: 'stop' })}
    <div class="prog"><i data-p="bar" style="transform:scaleX(${P.t / e.duration})"></i></div></div>`;
}

export function sheets(ctx) {
  const sh = ctx.ui.sheet; if (!sh) return '';
  const [name, arg] = sh.split(':'); const s = ctx.s, P = s.player;
  const wrap = (t, body) => `<div class="scrim" ${act('sheet-close')}><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(t)}" data-stop><div class="grab"></div><div class="sheet-head"><h2 class="h2" tabindex="-1">${esc(t)}</h2>${icbtn('x', 'Close', { act: 'sheet-close' })}</div>${body}</div></div>`;
  if (name === 'add') return wrap('Add to My Stash', `<div class="list">${row({ lead: tile('headphones'), title: 'Turn a PDF into a podcast', sub: 'Narration or a two-host conversation', go: 'p2p-upload' })}${row({ lead: tile('upload'), title: 'Import notes or text', sub: 'Paste, or add a .txt or .md file', go: 'import' })}</div>`);
  if (name === 'why') { const c = course(arg); return wrap('Why this?', `<p>${esc(why(s, c))}</p><p class="sub">Suggestions use your goal, your topics and what you have finished. Nothing else.</p><div class="list">${row({ title: 'Edit my goal', go: 'ob-goal?edit=1' })}${row({ title: 'Edit my topics', go: 'ob-interests' })}${row({ title: 'Not relevant, hide it', act: 'dismiss', arg: 'course:' + c.id, noChev: true })}</div>`); }
  if (name === 'job') return wrap('This role', `<div class="list">${row({ title: 'Hide this role', sub: 'It will not be suggested again', act: 'dismiss', arg: 'job:' + arg, noChev: true })}${row({ title: 'Edit my goal', go: 'ob-goal?edit=1' })}</div>`);
  if (name === 'queue') {
    const q = P.queue.map((id) => episode(s, id)).filter(Boolean);
    return wrap('Up next and sleep timer', `<section>${q.length ? `<div class="list">${q.map((e) => row({ lead: art(e, true), title: e.title, sub: mins(e.duration), trail: icbtn('x', 'Remove from queue', { act: 'queue-del', arg: e.id }) })).join('')}</div>` : `<p class="sub">Nothing queued. Add episodes from their page.</p>`}</section>
      <section><p class="label">Stop playing after</p><div class="chips" style="margin-top:8px" role="group" aria-label="Sleep timer">${[['0', 'Off'], ['5', '5 min'], ['15', '15 min'], ['30', '30 min'], ['end', 'This episode']].map(([v, l]) => chip(l, { on: String(P.sleep?.v ?? '0') === v, act: 'sleep', arg: v })).join('')}</div></section>`);
  }
  if (name === 'ep') { const e = episode(s, arg); return wrap(e.title, `<div class="list">${row({ title: 'Add to queue', act: 'queue-add', arg: e.id, noChev: true })}${row({ title: 'Download transcript (.txt)', act: 'dl', arg: e.id + '|txt', noChev: true })}${row({ title: 'Download captions (.vtt)', act: 'dl', arg: e.id + '|vtt', noChev: true })}${e.audio ? row({ title: 'Download audio (.wav)', act: 'dl-audio', arg: e.id, noChev: true }) : row({ title: 'Download audio', sub: e.kind === 'generated' ? 'Made with the device voice, so there is no file. Regenerate to render audio.' : 'Sample episodes have no recording', trail: tag('No file', 'none') })}${e.kind === 'generated' ? row({ title: 'Regenerate with new settings', go: 'p2p-config' }) + row({ title: 'Delete episode', act: 'sheet', arg: 'del:' + e.id, noChev: true }) : ''}</div>`); }
  if (name === 'del') { const e = episode(s, arg); return wrap('Delete this episode?', `<p>"${esc(e.title)}" and its transcript will be removed from this device. The script and extracted text stay, so you can generate it again.</p>${btn('Delete episode', { kind: 'danger', act: 'ep-del', arg: e.id })}${btn('Keep it', { kind: 'secondary', act: 'sheet-close' })}`); }
  if (name === 'wipe') return wrap('Delete all data?', `<p>This removes your profile, progress, evidence, imports, scripts and episodes from this browser. It cannot be undone.</p>${btn('Export first', { kind: 'secondary', go: 'export' })}${btn('Delete everything', { kind: 'danger', act: 'wipe' })}`);
  if (name === 'cancel') return wrap('Cancel generation?', `<p>The job stops. Your script and page selection are kept, and you can start again later with the same job key.</p>${btn('Cancel generation', { kind: 'danger', act: 'job-cancel' })}${btn('Keep going', { kind: 'secondary', act: 'sheet-close' })}`);
  return '';
}

function playerView(ctx) {
  const s = ctx.s, P = s.player, e = episode(s, P.ep) || episode(s, 'ep-baseline');
  return {
    top: top({ back: e.kind === 'generated' ? 'episode?id=' + e.id : 'podcasts', title: 'Now playing', right: icbtn('more', 'Episode actions', { act: 'sheet', arg: 'ep:' + e.id }) }),
    body: `<div style="padding-top:8px">${art(e)}</div>
      <div class="center stack-s"><h1 class="h2" tabindex="-1">${esc(e.title)}</h1><p class="sub">${e.kind === 'generated' ? `Generated from ${esc((s.docs.find((d) => d.id === e.docId) || {}).name || 'your PDF')}` : esc(e.by || '')}</p></div>
      <div class="scrub"><label class="sr" for="seek">Position</label><input id="seek" type="range" min="0" max="${e.duration}" step="1" value="${Math.round(P.t)}" data-p="range" data-input="seek" aria-valuetext="${fmt(P.t)} of ${fmt(e.duration)}"><div class="times"><span data-p="cur">${fmt(P.t)}</span><span>${fmt(e.duration)}</span></div></div>
      <div class="transport">${icbtn('back15', 'Back 15 seconds', { act: 'skip', arg: -15 })}<button type="button" class="pp" ${act('pp')} aria-label="${P.playing ? 'Pause' : 'Play'}">${icon(P.playing ? 'pause' : 'play', 32)}</button>${icbtn('fwd30', 'Forward 30 seconds', { act: 'skip', arg: 30 })}</div>
      <div class="player-tools">
        <button type="button" ${act('rate')} aria-label="Playback speed ${P.rate}x. Tap to change"><b>${P.rate}x</b>Speed</button>
        <button type="button" ${act('sheet', 'queue')} aria-label="Sleep timer"><b>${icon('moon', 20)}</b>${P.sleep ? (P.sleep.v === 'end' ? 'End of ep.' : P.sleep.v + ' min') : 'Sleep'}</button>
        <button type="button" ${act('sheet', 'queue')} aria-label="Queue, ${P.queue.length} waiting"><b>${icon('list', 20)}</b>Queue ${P.queue.length || ''}</button>
        <button type="button" ${go('transcript')}><b>${icon('text', 20)}</b>Transcript</button>
      </div>
      <p class="cap center">${voiceNote(ctx, e)}</p>`,
  };
}

function episodeView(ctx, id) {
  const s = ctx.s, e = episode(s, id) || episode(s, 'ep-baseline'), gen = e.kind === 'generated', doc = gen && s.docs.find((d) => d.id === e.docId);
  const key = 'episode:' + e.id, on = s.saved.includes(key), cur = s.player.ep === e.id;
  return {
    top: top({ back: gen ? 'stash' : 'podcasts', right: `${icbtn('stash', on ? 'Remove from My Stash' : 'Save to My Stash', { act: 'save', arg: key, on, pressed: on })}${icbtn('more', 'More actions', { act: 'sheet', arg: 'ep:' + e.id })}` }),
    body: `<div style="display:flex;gap:16px;align-items:flex-end">${art(e, false, true)}<div class="stack-s"><div class="tags">${gen ? tag('Generated', 'src') : tag('Sample', 'sample')}</div><h1 class="h2" tabindex="-1">${esc(e.title)}</h1><p class="sub">${mins(e.duration)} · ${e.segments.length} lines${gen ? ` · ${e.format === 'duo' ? 'two hosts' : 'solo'}` : ''}</p></div></div>
      ${gen ? (e.audio ? notice(`<span>${voiceNote(ctx, e)} ${e.audioLocal === false ? 'This device does not have the file; playback falls back to the device voice.' : ''}</span>`, { title: 'Audio on this device', icon: 'headphones' }) : demo('No audio file was rendered. ' + voiceNote(ctx, e))) : `<p class="sub">${esc(e.by)}. ${voiceNote(ctx, e)}</p>`}
      ${gen ? `<div class="list">
        ${row({ lead: tile('text'), title: 'Transcript with timestamps', sub: `${e.segments.filter((x) => x.kind === 'source').length} lines from the PDF, ${e.segments.filter((x) => x.kind === 'added').length} added`, go: 'transcript?id=' + e.id })}
        ${row({ lead: tile('file'), title: 'Source pages', sub: doc ? `${doc.name} · ${doc.pages.filter((p) => p.include).length} of ${doc.pages.length} pages used` : 'Extracted text was not kept', go: doc ? `p2p-source?doc=${doc.id}&p=${(e.segments.find((x) => x.page) || {}).page || 1}` : null })}
        ${e.audio ? row({ lead: tile('download'), title: 'Download audio', sub: `.wav · ${mins(e.duration)}`, act: 'dl-audio', arg: e.id, noChev: true }) : ''}
        ${row({ lead: tile('download'), title: 'Download transcript', sub: '.txt with page references', act: 'dl', arg: e.id + '|txt', noChev: true })}
        ${row({ lead: tile('refresh'), title: 'Regenerate', sub: 'Change format, length or voices', go: 'p2p-config' })}
        ${row({ lead: tile('trash'), title: 'Delete episode', act: 'sheet', arg: 'del:' + e.id, noChev: true })}
      </div>` : `<div class="list">${row({ lead: tile('text'), title: 'Transcript', go: 'transcript?id=' + e.id })}</div>`}`,
    foot: `<div class="row2">${btn(cur && s.player.playing ? 'Open player' : cur ? 'Resume' : 'Play', { icon: 'play', act: 'play', arg: e.id })}${btn('Add to queue', { kind: 'secondary', act: 'queue-add', arg: e.id })}</div>`,
  };
}

export default {
  podcasts: {
    title: 'Listen', chrome: 'tabs', tab: 'explore',
    note: 'Your own generated episodes are kept apart from published or sample shows. PDF-to-podcast is the first thing on the page. From the sketch: "listen to your notes" and "find related podcasts".',
    render: (ctx) => {
      const s = ctx.s;
      return {
        top: top({ back: 'explore', title: 'Listen' }),
        body: `${title('Listen')}${p2pBand(s)}
          <section>${sec('Made from your documents')}${s.episodes.length ? `<div class="list">${s.episodes.map((e) => epRow(e, s)).join('')}</div>` : `<p class="sub">Nothing yet. Episodes you generate from PDFs appear here.</p>`}</section>
          <section>${sec('Sample episodes')}<div class="list">${SAMPLE_EPISODES.map((e) => epRow(e, s)).join('')}</div><p class="cap" style="margin-top:8px">Written for this prototype. A live build would show the publisher and original feed.</p></section>`,
      };
    },
  },
  episode: { title: 'Episode', chrome: 'tabs', tab: 'explore', note: 'Play and queue are fixed at the bottom. The contextual menu holds downloads. A sample episode says who wrote it and that no recording exists.', render: (ctx) => episodeView(ctx, ctx.q.id || 'ep-baseline') },
  'p2p-episode': { title: 'Generated episode', chrome: 'tabs', tab: 'stash', note: 'Step 6, listen and manage. Transcript, source pages, download, regenerate and delete in one list. The demo notice is explicit that no audio file was produced, so a finished progress bar is not mistaken for real audio.', render: (ctx) => episodeView(ctx, ctx.q.id || ctx.s.episodes[0]?.id) },

  player: { title: 'Player', chrome: 'player', note: 'Looks and behaves like a player: artwork, scrubber with a 44px hit area, back 15 and forward 30, speed, sleep, queue, transcript. Every control has a spoken label. Seeking jumps to the line at that time.', render: playerView },
  'player-sheet': { title: 'Queue and sleep timer', chrome: 'player', note: 'Bottom sheet over the player. The queue is reorder-free on purpose at this stage: add and remove only. The sleep timer really pauses playback when it ends.', render: playerView },

  transcript: {
    title: 'Transcript', chrome: 'task',
    note: 'Timestamps are buttons that seek. Each line carries either a page link back to the PDF or an "Added by Stash" tag, so source and embellishment never blur. The current line is highlighted during playback.',
    render: (ctx) => {
      const s = ctx.s, e = episode(s, ctx.q.id || s.player.ep) || episode(s, 'ep-baseline'), cur = s.player.ep === e.id ? s.player.seg : -1;
      return {
        top: top({ back: s.player.ep === e.id ? 'player' : 'episode?id=' + e.id, title: 'Transcript', right: icbtn('download', 'Download transcript', { act: 'dl', arg: e.id + '|txt' }) }),
        body: `<h1 class="h2" tabindex="-1">${esc(e.title)}</h1>
          ${e.kind === 'generated' ? `<div class="tags">${tag('From PDF · page link', 'src')}${tag('Added by Stash', 'added')}</div>` : ''}
          <ol style="margin-top:8px">${e.segments.map((g, n) => `<li class="line ${n === cur ? 'now' : ''}" data-seg="${n}"><button type="button" class="ts" ${act('seek-seg', e.id + '|' + n)} aria-label="Play from ${fmt(g.t)}">${fmt(g.t)}</button><span class="who">${e.format === 'duo' || e.segments.some((x) => x.speaker === 'B') ? 'Host ' + g.speaker : 'Narrator'}</span><span class="txt">${esc(g.text)}</span>${e.kind === 'generated' ? `<span class="tags">${srcTag(g, e.docId)}</span>` : ''}</li>`).join('')}</ol>`,
      };
    },
  },

  'p2p-upload': {
    title: 'PDF: upload', chrome: 'task',
    note: 'Step 1. Limits are stated before picking. After picking: name, size, page count and real read progress. Processing and retention are explained here because this is where the person decides. The file is read in the browser and never uploaded.',
    render: (ctx) => {
      const s = ctx.s, d = p2p(s), E = d.error && P2P_ERRORS[d.error], doc = d.status === 'ready' && docOf(s);
      return {
        top: stepTop(1, 'stash'),
        body: `${title('Choose a PDF', 'Lecture notes, a report, a chapter.')}
          ${d.status === 'reading' ? `<div class="card stack-s">${row({ lead: tile('file'), title: d.name, sub: `${kb(d.size)} · reading page ${d.done || 0} of ${d.total || '?'}` }).replace('class="row"', 'class="row" style="padding:0;border:0;min-height:0"')}${bar(d.total ? d.done / d.total : 0.05, 'Reading PDF')}<p class="cap">Extracting text on this device.</p></div>`
          : doc ? `<div class="card stack-s">${row({ lead: tile('file'), title: doc.name, sub: `${kb(doc.size)} · ${doc.pages.length} pages · text found on ${doc.pages.filter((p) => p.flag !== 'scanned').length}`, trail: link('Change', { act: 'p2p-clear' }) }).replace('class="row"', 'class="row" style="padding:0;border:0;min-height:0"')}<div class="tags">${doc.sample ? tag('Sample document', 'sample') : tag('Read on this device', 'src')}${doc.pages.some((p) => p.flag) ? tag(`${doc.pages.filter((p) => p.flag).length} pages need a look`, 'added') : ''}</div></div>`
          : `<div class="filebtn"><input type="file" id="pdf" accept="application/pdf,.pdf" data-change="p2p-pick"><label for="pdf" class="drop">${icon('upload', 30)}<b class="strong">Choose a PDF</b><span class="cap">PDF only · up to ${P2P_LIMITS.mb} MB · up to ${P2P_LIMITS.pages} pages</span></label></div>`}
          ${E ? notice(`<span>${E[1]}</span>`, { title: E[0], tone: 'danger', alert: true }) : ''}
          ${!doc && d.status !== 'reading' ? `<div class="center">${link('Use the sample document instead', { act: 'p2p-sample' })}</div>` : ''}
          <section class="stack">${sec('What happens to your file')}
            <ul class="stack-s sub"><li>${icon('check', 16)} Stash reads the words in your PDF right here on your device. The file is never uploaded.</li><li>${icon('check', 16)} The PDF itself is not kept. Only its text is saved, so each part of the episode can point back to its page.</li></ul>
            ${toggle('Keep the text after the episode is made', 'Lets you jump to source pages and remake the episode later.', d.keepText !== false, 'toggle-default-on', 'draft.p2p.keepText')}
          </section>`,
        foot: btn('Review extracted text', { go: 'p2p-review', disabled: !doc }),
      };
    },
  },

  'p2p-review': {
    title: 'PDF: review content', chrome: 'task',
    note: 'Step 2. Every page is listed with its heading and first lines. Scanned pages and number-heavy tables are flagged with specific choices: type it in, keep, or exclude. OCR is offered but honestly marked as not connected.',
    render: (ctx) => {
      const s = ctx.s, doc = docOf(s), inc = doc.pages.filter((p) => p.include && p.text.trim()), flagged = doc.pages.filter((p) => p.flag);
      return {
        top: stepTop(2, 'p2p-upload'),
        body: `${title('Check what was read', `${doc.pages.length} pages · ${inc.length} selected${flagged.length ? ` · ${flagged.length} need a look` : ''}`)}
          <div class="btn-row" style="gap:4px 18px">${link('Select all readable', { act: 'p2p-all', arg: 1 })}${link('Clear', { act: 'p2p-all', arg: 0 })}${doc.sample ? '' : link('Read the file again', { go: 'p2p-upload' })}</div>
          <div>${doc.pages.map((p) => `<div class="pg ${p.include ? '' : 'off'}">
            <input type="checkbox" id="pg${p.n}" data-change="p2p-page" value="${p.n}" ${p.include ? 'checked' : ''} ${!p.text.trim() ? 'disabled' : ''} aria-label="Include page ${p.n}">
            <label class="mid" for="pg${p.n}"><b class="strong">Page ${p.n}${p.heading ? ' · ' + esc(p.heading) : ''}</b>
              ${p.flag === 'scanned' && !p.text.trim() ? `<span class="tags" style="margin:4px 0">${tag('Looks scanned: no text found', 'added')}</span>` : p.flag === 'table' ? `<span class="tags" style="margin:4px 0">${tag('Table: may read poorly aloud', 'added')}</span>` : ''}
              <span class="prev">${esc(p.text) || 'No text could be extracted from this page.'}</span></label>
            <div class="acts">${link(p.text.trim() ? 'View and correct' : 'Type it in', { go: `p2p-source?doc=${doc.id}&p=${p.n}&edit=1` })}${p.flag === 'scanned' && !p.text.trim() ? link('Try OCR', { act: 'p2p-ocr', arg: p.n }) : ''}</div>
          </div>`).join('')}</div>`,
        foot: `${btn(inc.length ? `Continue with ${inc.length} page${inc.length > 1 ? 's' : ''}` : 'Select at least one page', { go: 'p2p-config', disabled: !inc.length })}`,
      };
    },
  },

  'p2p-config': {
    title: 'PDF: configure', chrome: 'task',
    note: 'Step 3. Segmented controls for the two real choices (format, treatment). Voices list what this device actually has. The estimate block gives time and cost where known and says "none in demo" rather than inventing a price.',
    render: (ctx) => {
      const s = ctx.s, c = { ...P2P_DEFAULTS, ...(p2p(s).cfg || {}) }, doc = docOf(s);
      const est = mins(scriptStats(buildScript(doc, c)).seconds);
      const vo = VOICES;
      return {
        top: stepTop(3, 'p2p-review'),
        body: `${title('Shape the episode')}
          <div><p class="label">Format</p><div style="margin-top:6px">${seg('Format', [['solo', 'Solo narration'], ['duo', 'Two hosts']], c.format, 'set', 'draft.p2p.cfg.format=')}</div></div>
          <div><p class="label">Treatment</p><div style="margin-top:6px">${seg('Treatment', [['summary', 'Summary'], ['detailed', 'Detailed']], c.treatment, 'set', 'draft.p2p.cfg.treatment=')}</div><p class="cap" style="margin-top:6px">About ${est} from your selected pages.</p></div>
          <div><p class="label">Learning focus</p><div class="chips" style="margin-top:6px" role="group" aria-label="Learning focus">${['Key ideas', 'Examples', 'Definitions', 'Exam revision'].map((f) => chip(f, { on: c.focus.includes(f), tick: true, act: 'toggle-in', arg: 'draft.p2p.cfg.focus|' + f })).join('')}</div></div>
          ${field({ label: 'Language', bind: 'draft.p2p.cfg.language', type: 'select', value: c.language, options: [['en', 'English'], ['id', 'Bahasa Indonesia (needs a translation provider)', 1], ['zh', 'Chinese (needs a translation provider)', 1]] })}
          ${field({ label: c.format === 'duo' ? 'Host A voice' : 'Narrator voice', bind: 'draft.p2p.cfg.voiceA', type: 'select', value: c.voiceA || 'af_heart', options: vo })}
          ${c.format === 'duo' ? field({ label: 'Host B voice', bind: 'draft.p2p.cfg.voiceB', type: 'select', value: c.voiceB || 'am_michael', options: vo, hint: 'Open-source synthetic voices. No real person is imitated.' }) : ''}
          <div class="card"><p class="eyebrow">Estimate</p><dl class="kv" style="margin-top:10px"><dt>Episode length</dt><dd>${est}</dd><dt>Script</dt><dd>Instant (template)</dd><dt>Audio</dt><dd>Made on this device</dd><dt>Cost</dt><dd>Free</dd></dl><p class="cap" style="margin-top:10px">The first time, Stash downloads a 90 MB voice model and keeps it for next time. Rendering takes roughly one to four minutes per minute of audio, depending on the device. You can keep using Stash meanwhile.</p></div>`,
        foot: btn('Draft the script', { act: 'p2p-script' }),
      };
    },
  },

  'p2p-script': {
    title: 'PDF: review script', chrome: 'task',
    note: 'Step 4. Every line is editable. Lines quoted from the PDF carry a page link; lines Stash added are dashed and tagged. Emphasis and pronunciation fixes change how the line is spoken. Nothing is generated until the person approves.',
    render: (ctx) => {
      const s = ctx.s, sc = scriptOf(s); if (!sc) return { top: stepTop(4, 'p2p-config'), body: empty({ icon: 'text', title: 'No script yet', body: 'Go back one step and draft it.', actions: btn('Back to settings', { go: 'p2p-config' }) }) };
      const st = scriptStats(sc), si = s.scripts.indexOf(sc), duo = sc.config.format === 'duo', pd = s.draft.pron || {};
      return {
        top: stepTop(4, 'p2p-config'),
        body: `${title('Edit before it is spoken', `${sc.segments.length} lines · about ${mins(st.seconds)} · ${st.chars.toLocaleString()} characters`)}
          ${demo('This script is a template: it quotes sentences from your pages and adds short linking lines. No language model wrote it.')}
          <div class="tags">${tag('From PDF · page link', 'src')}${tag('Added by Stash', 'added')}</div>
          <div>${sc.segments.map((g, n) => `<div class="seg-ed ${g.kind}"><div class="hd"><b class="strong">${duo ? 'Host ' + g.speaker : 'Narrator'}</b>${srcTag(g, sc.docId)}<span class="sp"></span>${icbtn('play', `Hear line ${n + 1}`, { act: 'say', arg: n })}${icbtn('bolt', g.emph ? 'Remove emphasis' : 'Emphasise this line', { act: 'seg-emph', arg: n, on: g.emph, pressed: !!g.emph })}${icbtn('trash', `Delete line ${n + 1}`, { act: 'seg-del', arg: n })}</div><label class="sr" for="sg${n}">Line ${n + 1} text</label><textarea id="sg${n}" data-bind="scripts.${si}.segments.${n}.text">${esc(g.text)}</textarea></div>`).join('')}</div>
          <section class="stack">${sec('Pronunciation')}
            ${sc.pron.length ? `<div class="list">${sc.pron.map((p, n) => row({ title: `${p.from} → ${p.to}`, sub: 'Spoken as written on the right', trail: icbtn('trash', 'Remove', { act: 'pron-del', arg: n }) })).join('')}</div>` : ''}
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${field({ label: 'Written', bind: 'draft.pron.from', value: pd.from, placeholder: 'MAPE' })}${field({ label: 'Say it as', bind: 'draft.pron.to', value: pd.to, placeholder: 'mape' })}</div>
            ${btn('Add pronunciation', { kind: 'secondary', small: true, act: 'pron-add' })}
          </section>`,
        foot: `${btn('Approve and generate', { act: 'p2p-generate', disabled: !sc.segments.length })}<p class="fine">Nothing is generated until you approve.</p>`,
      };
    },
  },

  'p2p-generate': {
    title: 'PDF: generate', chrome: 'task',
    note: 'Step 5. Named stages, a labelled progress bar, the job key and attempt count. The person can leave: the job is stored and resumes. Cancel asks first. Approving the same script twice reuses the job, so there is never a duplicate episode or charge.',
    render: (ctx) => {
      const s = ctx.s, j = ctx.q.state === 'running' ? { key: '7f3a91c2', status: 'running', stage: 1, progress: 0.46, attempts: 1, line: 12, lines: 26 } : curJob(s);
      if (!j) return { top: stepTop(5, 'p2p-script'), body: empty({ icon: 'headphones', title: 'Nothing is being generated', body: 'Approve a script to start.', actions: btn('Open script', { go: 'p2p-script' }) }) };
      const done = j.status === 'done', run = j.status === 'running';
      return {
        top: stepTop(5, 'p2p-script'),
        body: `${title(done ? 'Episode ready' : run ? 'Making your episode' : j.status === 'cancelled' ? 'Generation cancelled' : 'Generation stopped')}
          ${bar(j.progress, 'Generation progress')}<p class="sub" aria-live="polite" data-p="jobpct">${Math.round(j.progress * 100)}%${run && j.stage === 0 && j.dl ? ` · downloading the voice, ${Math.round(j.dl * 100)}%` : run && j.stage === 1 && j.lines ? ` · line ${j.line || 0} of ${j.lines}` : ''}</p>
          <ol class="stages">${STAGES.map((t, n) => `<li class="${n < j.stage || done ? 'done' : n === j.stage && run ? 'now' : n === j.stage && j.status === 'failed' ? 'bad' : ''}"><span class="dot">${n < j.stage || done ? icon('check', 16) : n === j.stage && j.status === 'failed' ? icon('x', 16) : ''}</span>${t}</li>`).join('')}</ol>
          <dl class="kv"><dt>Job key</dt><dd>${esc(j.key)}</dd><dt>Attempt</dt><dd>${j.attempts}</dd><dt>Cost</dt><dd>Free, made on this device</dd></dl>
          ${done ? (s.episodes.find((e) => e.id === j.episodeId)?.audio ? notice('<span>Real audio was rendered on this device with an open-source voice. Download it from the episode page.</span>', { title: 'Audio ready', icon: 'check' }) : demo('This episode uses the device voice reading the approved script. No audio file was rendered.'))
          : run ? notice('<span>You can leave this screen. The job is saved and carries on while Stash is open, and resumes when you come back.</span>')
          : j.status === 'cancelled' ? notice('<span>Your script and pages are kept. Starting again reuses the same job key.</span>') : ''}`,
        foot: done ? `${btn('Open episode', { go: 'p2p-episode?id=' + j.episodeId })}${btn('Back to My Stash', { kind: 'ghost', go: 'stash' })}`
          : run ? `${btn('Keep learning meanwhile', { go: 'today' })}${btn('Cancel generation', { kind: 'ghost', act: 'sheet', arg: 'cancel' })}`
          : j.status === 'failed' ? btn('See what went wrong', { go: 'p2p-error' }) : `${btn('Start again', { act: 'p2p-generate' })}${btn('Edit script', { kind: 'secondary', go: 'p2p-script' })}`,
      };
    },
  },

  'p2p-error': {
    title: 'PDF: conversion failed', chrome: 'task',
    note: 'Failed-conversion recovery. Says which stage failed, what was kept, and that the failed attempt cost nothing. Retry reuses the same job key so a double tap or a flaky network cannot create two jobs.',
    render: (ctx) => {
      const s = ctx.s, j = s.jobs.find((x) => x.status === 'failed') || { key: '7f3a91c2', stage: 1, progress: 0.62, attempts: 1 };
      return {
        top: top({ close: 'stash', title: 'PDF to podcast' }),
        body: `<div class="empty" style="padding-top:28px"><span class="ring">${icon('alert', 30)}</span><h1 class="h1" tabindex="-1">Voice rendering stopped</h1><p class="sub">It stopped at ${Math.round(j.progress * 100)}%, during "${STAGES[j.stage]}". ${j.error === 'sim' || !j.error ? 'This was a simulated failure for testing.' : `Reason: ${esc(j.error)}`}</p></div>
          <div class="list">
            ${row({ lead: tile('check'), title: 'Your script is saved', sub: 'Edits, emphasis and pronunciations are intact' })}
            ${row({ lead: tile('check'), title: 'Your page selection is saved', sub: 'No need to read the PDF again' })}
            ${row({ lead: tile('check'), title: 'Nothing is lost by retrying', sub: `Retry reuses job key ${j.key}, attempt ${j.attempts + 1}` })}
          </div>`,
        foot: `${btn('Retry generation', { icon: 'refresh', act: 'job-retry' })}${btn('Use the device voice instead', { kind: 'secondary', act: 'job-fallback' })}${btn('Edit script first', { kind: 'ghost', go: 'p2p-script' })}${btn('Back to My Stash', { kind: 'ghost', go: 'stash' })}`,
      };
    },
  },

  'p2p-source': {
    title: 'PDF: source page', chrome: 'task',
    note: 'Where transcript page links land. Shows the extracted text of one page and which spoken lines quote it. The same screen is the correction editor in step 2. It states that this is extracted text, not a picture of the page.',
    render: (ctx) => {
      const s = ctx.s, doc = docOf(s, ctx.q.doc), n = Math.max(1, Math.min(doc.pages.length, +ctx.q.p || 2)), p = doc.pages[n - 1], di = s.docs.indexOf(doc);
      const ep = s.episodes.find((e) => e.docId === doc.id), quotes = ep ? ep.segments.filter((g) => g.page === n) : [];
      const nav = (k) => `p2p-source?doc=${doc.id}&p=${k}${ctx.q.edit ? '&edit=1' : ''}`;
      return {
        top: top({ back: ctx.q.edit ? 'p2p-review' : ep ? 'transcript?id=' + ep.id : 'p2p-review', title: doc.name }),
        body: `<div class="lg-head" style="padding-top:0"><h1 class="h1" tabindex="-1">Page ${n} of ${doc.pages.length}</h1><div class="acts">${icbtn('back', 'Previous page', { go: nav(Math.max(1, n - 1)) })}${icbtn('next', 'Next page', { go: nav(Math.min(doc.pages.length, n + 1)) })}</div></div>
          ${p.flag ? notice(`<span>${p.flag === 'scanned' ? 'No text was found on this page. It may be a scan. Type the text below to include it.' : 'This page is mostly numbers. Rewrite it as sentences or leave it out.'}</span>`, { tone: 'warn', title: p.flag === 'scanned' ? 'Looks scanned' : 'Table detected' }) : ''}
          ${di >= 0 && (ctx.q.edit || p.flag) ? field({ label: 'Extracted text (editable)', bind: `docs.${di}.pages.${n - 1}.text`, type: 'textarea', value: p.text, attrs: 'style="min-height:220px"', hint: 'Corrections are saved as you type and used in the next script.' })
          : `<div class="card read">${p.heading ? `<p class="strong">${esc(p.heading)}</p>` : ''}<p>${esc(p.text) || 'No text on this page.'}</p></div>`}
          ${quotes.length ? `<section>${sec('Quoted in the episode')}<div class="list">${quotes.map((g) => row({ title: `${fmt(g.t)} · ${g.kind === 'source' ? 'From this page' : 'Added by Stash near this page'}`, sub: g.text, act: 'seek-seg', arg: ep.id + '|' + ep.segments.indexOf(g) })).join('')}</div></section>` : ''}
          <p class="cap">This is the extracted text, not an image of the page. The original file is not stored.</p>`,
        foot: ctx.q.edit ? btn('Done', { go: 'p2p-review' }) : '',
      };
    },
  },
};
