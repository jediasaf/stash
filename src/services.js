// Integration boundaries. Everything that would call a backend in production goes through this file.
// Today: PDF text extraction runs locally with pdf.js; script writing is a template; no audio file is rendered.
// Nothing here sends a document anywhere.
import { P2P_LIMITS } from './data.js';

const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';

export const P2P_ERRORS = {
  type: ['This is not a PDF', 'Choose a file ending in .pdf. Word and image files are not supported yet.'],
  size: ['This file is too large', `The limit is ${P2P_LIMITS.mb} MB. Try exporting a smaller range of pages.`],
  notpdf: ['This file could not be read as a PDF', 'It has a .pdf name but not PDF contents. It may be damaged.'],
  locked: ['This PDF is password protected', 'Remove the password in a PDF reader, then choose it again.'],
  pages: ['This PDF has too many pages', `The limit is ${P2P_LIMITS.pages} pages. Split the document and try again.`],
  engine: ['The PDF reader did not load', 'pdf.js is fetched from a CDN the first time. Check your connection and retry, or use the sample document.'],
  empty: ['No text was found', 'Every page looks scanned. OCR is not connected, so pages would need typing in.'],
};
const fail = (code) => Object.assign(new Error(code), { code });

/** Validate and extract a PDF on this device. onProgress(done, total). Returns page objects. */
export async function readPdf(file, onProgress = () => {}) {
  if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') throw fail('type');
  if (file.size > P2P_LIMITS.mb * 1048576) throw fail('size');
  const buf = await file.arrayBuffer();
  const headBytes = new Uint8Array(buf.slice(0, 1024));
  if (!new TextDecoder('latin1').decode(headBytes).includes('%PDF-')) throw fail('notpdf');
  let lib;
  try { lib = await import(/* @vite-ignore */ PDFJS); lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; } catch { throw fail('engine'); }
  let pdf;
  try { pdf = await lib.getDocument({ data: buf }).promise; } catch (e) { throw fail(e?.name === 'PasswordException' ? 'locked' : 'notpdf'); }
  if (pdf.numPages > P2P_LIMITS.pages) throw fail('pages');
  const pages = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const tc = await (await pdf.getPage(n)).getTextContent();
    const text = tc.items.map((i) => i.str + (i.hasEOL ? '\n' : '')).join('').replace(/[ \t]+/g, ' ').trim().slice(0, 6000);
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const tokens = text.split(/\s+/).filter(Boolean);
    const numeric = tokens.filter((t) => /^[\d.,%$()-]+$/.test(t)).length;
    const flag = text.length < 40 ? 'scanned' : tokens.length > 12 && numeric / tokens.length > 0.4 ? 'table' : null;
    pages.push({ n, heading: lines[0] && lines[0].length <= 80 ? lines[0] : '', text: text.replace(/\n/g, ' '), flag, include: !flag });
    onProgress(n, pdf.numPages);
  }
  if (pages.every((p) => p.flag === 'scanned')) throw fail('empty');
  return pages;
}

const sentences = (t) => (t.match(/[^.!?]+[.!?]+/g) || [t]).map((x) => x.trim()).filter((x) => x.length > 8);
const hash = (str) => { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0; return h.toString(16).padStart(8, '0'); };

/** DEMO script writer. Quotes sentences from the selected pages and marks every line it adds itself. */
export function buildScript(doc, cfg) {
  const pages = doc.pages.filter((p) => p.include && p.text.trim());
  const per = cfg.treatment === 'summary' ? 1 : 3; const duo = cfg.format === 'duo';
  const segs = [{ speaker: 'A', kind: 'added', text: `This is ${doc.title}, from ${pages.length} selected page${pages.length > 1 ? 's' : ''}.` }];
  for (const p of pages) {
    const body = sentences(p.heading && p.text.startsWith(p.heading) ? p.text.slice(p.heading.length) : p.text).slice(0, per);
    if (!body.length) continue;
    if (duo && p.heading) segs.push({ speaker: 'B', kind: 'added', page: p.n, text: `What does page ${p.n} say about ${p.heading.toLowerCase()}?` });
    body.forEach((t) => segs.push({ speaker: 'A', kind: 'source', page: p.n, text: t }));
    if (p.example && cfg.focus.includes('Examples')) segs.push({ speaker: duo ? 'B' : 'A', kind: 'added', page: p.n, text: p.example });
  }
  segs.push({ speaker: duo ? 'B' : 'A', kind: 'added', text: 'That is the end of the selected pages.' });
  return { id: 'sc-' + hash(doc.id + JSON.stringify(cfg) + Date.now()), docId: doc.id, config: { ...cfg }, segments: segs, pron: [], approved: false };
}
export const scriptStats = (sc) => { const text = sc.segments.map((s) => s.text).join(' '); const words = text.split(/\s+/).filter(Boolean).length; return { chars: text.length, words, seconds: Math.round(words / 2.6) }; };

/** Same script and settings always give the same key, so a retry can never start a second job or a second charge. */
export const jobKey = (sc) => hash(JSON.stringify([sc.docId, sc.config, sc.segments.map((s) => [s.speaker, s.text, s.emph]), sc.pron]));

export function toEpisode(sc, doc) {
  let t = 0;
  const segments = sc.segments.map((s) => { const d = Math.max(2, Math.round(s.text.split(/\s+/).length / 2.6)); const o = { ...s, t, d }; t += d; return o; });
  return { id: 'ep-' + jobKey(sc), title: doc.title, kind: 'generated', docId: doc.id, scriptId: sc.id, format: sc.config.format, voices: { A: sc.config.voiceA, B: sc.config.voiceB }, pron: sc.pron, segments, duration: t, jobKey: jobKey(sc), created: new Date().toISOString().slice(0, 10) };
}

// ---------- real file output ----------
export function download(name, text, type = 'text/plain') {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
const stamp = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}.000`; };
export function transcriptFile(ep, fmt) {
  if (fmt === 'vtt') return 'WEBVTT\n\n' + ep.segments.map((s) => `${stamp(s.t)} --> ${stamp(s.t + s.d)}\n<v Host ${s.speaker}>${s.text}`).join('\n\n') + '\n';
  return `${ep.title}\n\n` + ep.segments.map((s) => `[${stamp(s.t).slice(3, 8)}] Host ${s.speaker}: ${s.text}${s.kind === 'source' && s.page ? ` (source: p. ${s.page})` : s.kind === 'added' ? ' (added, not from the PDF)' : ''}`).join('\n') + '\n';
}
export function icsFile(sessions) {
  const z = (d, t) => d.replace(/-/g, '') + 'T' + t.replace(':', '') + '00';
  const end = (s) => { const [h, m] = s.time.split(':').map(Number); const e = h * 60 + m + s.minutes; return `${String(Math.floor(e / 60) % 24).padStart(2, '0')}:${String(e % 60).padStart(2, '0')}`; };
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Stash//Prototype//EN', ...sessions.flatMap((s) => ['BEGIN:VEVENT', `UID:${s.id}@stash.local`, `DTSTAMP:${z(s.date, s.time)}`, `DTSTART:${z(s.date, s.time)}`, `DTEND:${z(s.date, end(s))}`, `SUMMARY:Stash: ${s.title} (${s.minutes} min)`, 'END:VEVENT']), 'END:VCALENDAR'].join('\r\n');
}

/** Résumé reading, on this device. Finds skill keywords and returns the sentence each came from.
 *  These are suggestions only: nothing is recorded until the person adds it. */
const SKILL_PATTERNS = {
  python: /\bpython\b/i, sql: /\b(sql|postgres(?:ql)?|mysql|bigquery)\b/i, policy: /trust (?:and|&) safety|content moderation|community guidelines|policy/i,
  ml: /machine learning|detection (?:models?|methods?)|classifiers?/i, communication: /communicat\w*|stakeholder|interpersonal|present(?:ed|ing)? (?:to|findings)/i,
  forecasting: /forecast\w*/i, excel: /\bexcel\b|spreadsheet/i, inventory: /inventory|safety stock/i, cloud: /\b(?:aws|azure|gcp|google cloud)\b/i, apis: /\bapis?\b|\brest\b/i,
};
export function findSkills(text) {
  const flat = text.replace(/\s+/g, ' ');
  return Object.entries(SKILL_PATTERNS).flatMap(([skill, re]) => {
    const m = flat.match(re); if (!m) return [];
    const from = Math.max(0, m.index - 28), to = Math.min(flat.length, m.index + m[0].length + 32);
    return [{ skill, snippet: (from ? '…' : '') + flat.slice(from, to).trim() + (to < flat.length ? '…' : '') }];
  });
}

/** Which Stash skills a job's listed skills and text mention. Returns {skill: [matching listed names or 'description']}. */
export function matchSkills(names = [], text = '') {
  const out = {};
  for (const [skill, re] of Object.entries(SKILL_PATTERNS)) {
    const hits = names.filter((n) => re.test(n));
    if (hits.length) out[skill] = hits.slice(0, 3);
    else if (text && re.test(text)) out[skill] = ['description'];
  }
  return out;
}

// ---------- on-device storage for large files (audio, attachments) ----------
const DB = 'stash-files';
const idbOpen = () => new Promise((ok, no) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore('files'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
const idbTx = async (mode, fn) => { const db = await idbOpen(); return new Promise((ok, no) => { const t = db.transaction('files', mode); const q = fn(t.objectStore('files')); t.oncomplete = () => ok(q?.result); t.onerror = () => no(t.error); }); };
export const files = {
  put: (key, blob) => idbTx('readwrite', (s) => s.put(blob, key)),
  get: (key) => idbTx('readonly', (s) => s.get(key)),
  del: (key) => idbTx('readwrite', (s) => s.delete(key)),
};

// ---------- real speech, rendered on this device ----------
// Kokoro-82M (Apache-2.0) runs in a Web Worker through kokoro-js. The model (~90 MB) downloads once and is cached by the browser.
export const VOICES = [['af_heart', 'Heart (US, warm)'], ['af_bella', 'Bella (US, bright)'], ['am_michael', 'Michael (US, calm)'], ['am_fenrir', 'Fenrir (US, deep)'], ['bf_emma', 'Emma (UK)'], ['bm_george', 'George (UK)']];
const WORKER = `
let tts;
self.onmessage = async (e) => {
  const { id, type, text, voice, speed } = e.data;
  try {
    if (!tts) {
      const { KokoroTTS } = await import('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm');
      tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'wasm',
        progress_callback: (p) => { if (p.status === 'progress' && p.total > 1e6) self.postMessage({ id, type: 'download', loaded: p.loaded, total: p.total }); } });
    }
    if (type === 'load') return self.postMessage({ id, type: 'ready' });
    const a = await tts.generate(text, { voice, speed: speed || 1 });
    self.postMessage({ id, type: 'audio', audio: a.audio, rate: a.sampling_rate }, [a.audio.buffer]);
  } catch (err) { self.postMessage({ id, type: 'error', message: String(err && err.message || err) }); }
};`;
let worker, seq = 0;
const pending = new Map();
function engine() {
  if (worker) return worker;
  worker = new Worker(URL.createObjectURL(new Blob([WORKER], { type: 'text/javascript' })), { type: 'module' });
  worker.onmessage = (e) => { const p = pending.get(e.data.id); if (!p) return; if (e.data.type === 'download') return p.progress?.(e.data.loaded, e.data.total); pending.delete(e.data.id); e.data.type === 'error' ? p.no(new Error(e.data.message)) : p.ok(e.data); };
  worker.onerror = (e) => { for (const p of pending.values()) p.no(new Error(e.message || 'Voice engine failed to start')); pending.clear(); worker = null; };
  return worker;
}
const ask = (msg, progress) => new Promise((ok, no) => { const id = ++seq; pending.set(id, { ok, no, progress }); engine().postMessage({ ...msg, id }); });
export const voiceEngine = {
  load: (onProgress) => ask({ type: 'load' }, onProgress),
  speak: (text, voice, speed) => ask({ type: 'say', text, voice, speed }),
  stop: () => { if (worker) { worker.terminate(); worker = null; } for (const p of pending.values()) p.no(Object.assign(new Error('cancelled'), { cancelled: true })); pending.clear(); },
};
/** Joins rendered lines into one WAV file and returns it with each line's real start time and length. */
export function toWav(parts, rate = 24000, gap = 0.35) {
  const gapN = Math.round(gap * rate); let n = 0; const timing = [];
  for (const p of parts) { timing.push({ t: n / rate, d: p.length / rate }); n += p.length + gapN; }
  const buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  let o = 44; for (const p of parts) { for (let i = 0; i < p.length; i++, o += 2) v.setInt16(o, Math.max(-1, Math.min(1, p[i])) * 0x7fff, true); o += gapN * 2; }
  return { blob: new Blob([buf], { type: 'audio/wav' }), timing, duration: n / rate };
}

// ---------- encrypted sync ----------
// The sync code is the only secret. Its SHA-256 names the stored copy; a key derived from it (PBKDF2) encrypts the copy with AES-GCM.
const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = (u8) => btoa(String.fromCharCode(...u8)), unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
export function newSyncCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = crypto.getRandomValues(new Uint8Array(16));
  return [...r].map((x) => A[x % 32]).join('').match(/.{4}/g).join('-');
}
export const normCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').match(/.{1,4}/g)?.join('-') || '';
async function keyFor(code) {
  const base = await crypto.subtle.importKey('raw', enc.encode(normCode(code)), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: enc.encode('stash-sync-v1'), iterations: 200000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
const syncId = async (code) => hex(await crypto.subtle.digest('SHA-256', enc.encode('stash:' + normCode(code))));
export async function pushSync(code, state) {
  const iv = crypto.getRandomValues(new Uint8Array(12)), key = await keyFor(code), updatedAt = new Date().toISOString();
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(state))));
  const r = await fetch(`/api/sync?id=${await syncId(code)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ iv: b64(iv), data: b64(data), updatedAt }) });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Sync failed');
  return updatedAt;
}
export async function deleteSync(code) {
  const r = await fetch(`/api/sync?id=${await syncId(code)}`, { method: 'DELETE' });
  if (!r.ok && r.status !== 404) throw new Error('Could not delete the stored copy');
}
export async function pullSync(code) {
  const r = await fetch(`/api/sync?id=${await syncId(code)}`, { cache: 'no-store' });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('Sync storage did not answer');
  const p = await r.json(), key = await keyFor(code);
  try { return { updatedAt: p.updatedAt, state: JSON.parse(dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(p.iv) }, key, unb64(p.data)))) }; }
  catch { throw new Error('That code does not open this copy'); }
}
