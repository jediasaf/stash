// Shared UI primitives. Every function is pure: it takes data and returns an HTML string.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const I = {
  today: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  explore: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  stash: '<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/>',
  growth: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
  back: '<path d="M15 5l-7 7 7 7"/>', next: '<path d="M9 5l7 7-7 7"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>', pause: '<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/>',
  back15: '<path d="M4 12a8 8 0 1 0 2.6-5.9"/><path d="M4 4v4.5h4.5"/>', fwd30: '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v4.5h-4.5"/>',
  headphones: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4.5" height="6.5" rx="1.5"/><rect x="16.500" y="14" width="4.5" height="6.5" rx="1.5"/>',
  file: '<path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>', download: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6v.2"/>', alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4.5M12 17.4v.2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  shuffle: '<path d="M3 7h3.5c5 0 5.500 10 10.500 10H21M3 17h3.500c1.500 0 2.600-.9 3.500-2.200M21 7h-4c-1.500 0-2.600.9-3.500 2.200"/><path d="M18 4l3 3-3 3M18 14l3 3-3 3"/>',
  more: '<circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/>',
  list: '<path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01"/>', moon: '<path d="M20 14.500A8 8 0 0 1 9.500 4a8 8 0 1 0 10.500 10.500z"/>',
  text: '<path d="M5 7h14M5 12h14M5 17h9"/>', edit: '<path d="M4 20h4l11-11-4-4L4 16z"/>', trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.600-5.900"/><path d="M20 4v4.500h-4.500"/>', link: '<path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>', mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  settings: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  bolt: '<path d="M13 3L5 13.500h6L10 21l8-10.500h-6z"/>', eye: '<path d="M2 12s3.600-6.500 10-6.500S22 12 22 12s-3.600 6.500-10 6.500S2 12 2 12z"/><circle cx="12" cy="12" r="2.500"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
};
export const icon = (n, s = 22) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || ''}</svg>`;

export const go = (r) => `data-go="${esc(r)}"`;
export const act = (a, arg) => `data-act="${a}"${arg != null ? ` data-arg="${esc(arg)}"` : ''}`;
const wire = (o) => `${o.go ? go(o.go) : ''} ${o.act ? act(o.act, o.arg) : ''}`;

export function btn(label, o = {}) {
  const kind = o.kind || 'primary';
  return `<button type="button" class="btn btn-${kind}${o.small ? ' btn-sm' : ''}" ${wire(o)} ${o.disabled ? 'disabled' : ''} ${o.aria ? `aria-label="${esc(o.aria)}"` : ''}>${o.icon ? icon(o.icon, 20) : ''}<span>${esc(label)}</span></button>`;
}
export const link = (label, o = {}) => `<button type="button" class="link" ${wire(o)}>${esc(label)}${o.chev ? icon('next', 16) : ''}</button>`;
export const icbtn = (ic, label, o = {}) => `<button type="button" class="icbtn${o.on ? ' on' : ''}" ${wire(o)} aria-label="${esc(label)}" ${o.pressed != null ? `aria-pressed="${o.pressed}"` : ''}>${icon(ic)}</button>`;
export const chip = (label, o = {}) => `<button type="button" class="chip" aria-pressed="${!!o.on}" ${wire(o)}>${o.on && o.tick ? icon('check', 16) : ''}${esc(label)}</button>`;
export function seg(label, options, value, a, prefix = '') {
  return `<div class="seg" role="radiogroup" aria-label="${esc(label)}">${options.map(([v, l]) => `<button type="button" role="radio" aria-checked="${v === value}" ${act(a, prefix + v)}>${esc(l)}</button>`).join('')}</div>`;
}
export const tag = (label, tone = '') => `<span class="tag ${tone}">${esc(label)}</span>`;
export function notice(body, o = {}) {
  return `<div class="notice ${o.tone || ''}" ${o.alert ? 'role="alert"' : ''}>${icon(o.icon || (o.tone ? 'alert' : 'info'), 20)}<div>${o.title ? `<b>${esc(o.title)}</b>` : ''}${body}</div></div>`;
}
export const demo = (text) => notice(`<span>${text}</span>`, { title: 'Demo mode' });
export function row(o) {
  const el = o.go || o.act ? 'button' : 'div';
  return `<${el} ${el === 'button' ? 'type="button"' : ''} class="row" ${wire(o)}>${o.lead || ''}<span class="mid"><b>${esc(o.title)}</b>${o.sub ? `<span>${o.subHtml ? o.sub : esc(o.sub)}</span>` : ''}${o.extra || ''}</span><span class="trail">${o.trail || ''}${el === 'button' && !o.noChev ? icon('next', 18) : ''}</span></${el}>`;
}
export const tile = (ic) => `<span class="tile">${icon(ic)}</span>`;
export const bar = (v, label) => `<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(v * 100)}" aria-label="${esc(label)}"><i style="transform:scaleX(${Math.max(0, Math.min(1, v))})"></i></div>`;
export function field(o) {
  const id = 'f-' + o.bind.replace(/\W+/g, '-');
  const common = `id="${id}" data-bind="${o.bind}" ${o.err ? `aria-invalid="true" aria-describedby="${id}-e"` : o.hint ? `aria-describedby="${id}-h"` : ''} ${o.attrs || ''}`;
  const ctl = o.type === 'textarea'
    ? `<textarea ${common} placeholder="${esc(o.placeholder || '')}">${esc(o.value)}</textarea>`
    : o.type === 'select'
      ? `<select ${common}>${o.options.map(([v, l, dis]) => `<option value="${esc(v)}" ${v === o.value ? 'selected' : ''} ${dis ? 'disabled' : ''}>${esc(l)}</option>`).join('')}</select>`
      : `<input ${common} type="${o.type || 'text'}" value="${esc(o.value)}" placeholder="${esc(o.placeholder || '')}">`;
  return `<div class="field${o.err ? ' bad' : ''}"><label for="${id}">${esc(o.label)}</label>${o.wrap ? o.wrap(ctl) : ctl}${o.hint ? `<span class="hint" id="${id}-h">${esc(o.hint)}</span>` : ''}${o.err ? `<span class="err" id="${id}-e" role="alert">${icon('alert', 16)}${esc(o.err)}</span>` : ''}</div>`;
}
export const toggle = (label, sub, on, a, arg) => `<button type="button" class="switch" role="switch" aria-checked="${!!on}" ${act(a, arg)}><span><b class="strong">${esc(label)}</b>${sub ? `<span class="cap" style="display:block">${esc(sub)}</span>` : ''}</span><i></i></button>`;
export function top(o = {}) {
  const left = o.back != null ? icbtn('back', 'Back', { act: 'back', arg: o.back }) : o.close != null ? icbtn('x', 'Close', { act: 'back', arg: o.close }) : '<span class="icbtn-sp"></span>';
  const steps = o.step ? `<div class="steps" role="img" aria-label="Step ${o.step[0]} of ${o.step[1]}">${Array.from({ length: o.step[1] }, (_, i) => `<i class="${i < o.step[0] ? 'on' : ''}"></i>`).join('')}</div>` : '';
  return `<header class="top">${left}<div class="top-title">${esc(o.title || '')}</div><div class="top-right">${o.right || ''}</div></header>${steps}`;
}
export const head = (title, o = {}) => `<div class="lg-head"><div>${o.over ? `<p class="cap">${esc(o.over)}</p>` : ''}<h1 class="h1" tabindex="-1">${esc(title)}</h1></div>${o.acts ? `<div class="acts">${o.acts}</div>` : ''}</div>`;
export const title = (t, sub) => `<div class="stack-s"><h1 class="h1" tabindex="-1">${esc(t)}</h1>${sub ? `<p class="lead">${esc(sub)}</p>` : ''}</div>`;
export const sec = (t, right = '') => `<div class="sec-head"><h2 class="h2">${esc(t)}</h2>${right}</div>`;
export function empty(o) {
  return `<div class="empty"><span class="ring">${icon(o.icon, 30)}</span><h2 class="h2">${esc(o.title)}</h2><p class="sub">${esc(o.body)}</p>${o.actions || ''}</div>`;
}
export const fmt = (s) => { s = Math.max(0, Math.round(s)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
export const mins = (s) => `${Math.max(1, Math.round(s / 60))} min`;
export const kb = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
export const day = (iso, o = { weekday: 'short', day: 'numeric', month: 'short' }) => new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('en-GB', o);
