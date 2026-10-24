// Converts the rendered lo-fi boards into an editable draw.io file: one diagram per board,
// each phone a container whose boxes, text and icons are separate cells, with real connectors between phones.
const X = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
const rgb = (c) => { const m = c.match(/[\d.]+/g); if (!m) return null; const [r, g, b, a = 1] = m.map(Number); if (a < 0.05) return null; const f = (v) => Math.round(v * a + 255 * (1 - a)).toString(16).padStart(2, '0'); return '#' + f(r) + f(g) + f(b); };
const R = (n) => Math.round(n * 10) / 10;

export function toDrawio() {
  const BARS = document.body.dataset.fi === 'lofi';
  const HIFI = document.body.dataset.hifi === '1', MID = document.body.dataset.fi === 'midfi' || HIFI;
  const FRAME = HIFI ? '#030404' : '#8FBBE8';
  const FONT = HIFI ? 'fontFamily=Nunito Sans;fontSource=https%3A%2F%2Ffonts.googleapis.com%2Fcss%3Ffamily%3DNunito%2BSans;' : MID ? 'fontFamily=Lato;fontSource=https%3A%2F%2Ffonts.googleapis.com%2Fcss%3Ffamily%3DLato;' : 'fontFamily=Helvetica;';
  const B64 = (s) => btoa(unescape(encodeURIComponent(s)));
  const BADGE = B64('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#0088FF" stroke="#FFFFFF" stroke-width="3"/><path d="M22 10 L14 22 H20 L18 30 L26 18 H20 Z" fill="#FFFFFF"/></svg>');
  const pages = document.body.dataset.sheet === '1' ? [document.getElementById('boards')] : [...document.querySelectorAll('.page')];
  const pageId = (i) => 'page-' + i;
  const linkTo = (href) => { const m = href.match(/^#b-(\d+)$/); if (m) return pageId(+m[1] + 2); if (href === '#cover') return pageId(0); if (href === '#audit') return pageId(1); return null; };
  let xml = `<mxfile host="app.diagrams.net" agent="Stash board export" version="24.0.0" type="device">`;
  pages.forEach((page, pi) => {
    let n = 2; const cells = []; const P = page.getBoundingClientRect(); const phoneIds = new Map();
    const add = (style, g, o = {}) => {
      const id = `c${pi}-${n++}`; const geo = `<mxGeometry x="${R(g.x)}" y="${R(g.y)}" width="${R(Math.max(1, g.w))}" height="${R(Math.max(1, g.h))}" as="geometry"/>`;
      const cell = `<mxCell${o.link ? '' : ` id="${id}" value="${X(o.value || '')}"`} style="${style}" vertex="1" parent="${o.parent || 1}">${geo}</mxCell>`;
      cells.push(o.link ? `<UserObject label="${X(o.value || '')}" link="data:page/id,${o.link}" id="${id}">${cell}</UserObject>` : cell); return id;
    };
    const walk = (el, parent, ox, oy, clip, k) => {
      const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return;
      if (el.matches('.sr, .hot, .badge, .b-arrow, .toast, script, input[type=file], svg.flow')) return;
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) { if (cs.display !== 'contents') return; }
      if (clip && (r.top >= clip.bottom - 2 || r.bottom <= clip.top + 1)) return;
      const g = { x: r.left - ox, y: r.top - oy, w: r.width, h: clip ? Math.min(r.bottom, clip.bottom) - r.top : r.height };
      if (el.tagName === 'IMG' && el.complete && el.naturalWidth) {
        const cv = document.createElement('canvas'); cv.width = Math.round(r.width * 2); cv.height = Math.round(r.height * 2);
        const cx = cv.getContext('2d'); if (getComputedStyle(el).filter.includes('grayscale')) cx.filter = 'grayscale(1)'; cx.drawImage(el, 0, 0, cv.width, cv.height);
        add(`shape=image;html=1;imageAspect=0;image=data:image/png,${cv.toDataURL('image/png').split(',')[1]};`, g, { parent }); return;
      }
      if (el.tagName === 'svg') {
        const c = rgb(cs.color) || '#000000'; const s = el.outerHTML.replace(/currentColor/g, c).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"').replace(/ class="[^"]*"/, '').replace(/ aria-hidden="true"/, '');
        add(`shape=image;html=1;imageAspect=1;aspect=fixed;image=data:image/svg+xml,${btoa(s)};`, g, { parent }); return;
      }
      if (el.classList.contains('phone')) {
        const zoom = parseFloat(cs.zoom) || 1;
        if (MID) add('rounded=1;arcSize=14;html=1;fillColor=#FFFFFF;strokeColor=${FRAME};strokeWidth=2.5;', { x: g.x - 11, y: g.y - 11, w: g.w + 22, h: g.h + 22 }, { parent });
        const id = add(`${MID ? 'rounded=1;arcSize=12;strokeColor=${FRAME};' : 'rounded=0;strokeColor=#000000;'}whiteSpace=wrap;html=1;fillColor=#FFFFFF;container=1;collapsible=0;recursiveResize=0;`, g, { parent });
        phoneIds.set(el, id); const inner = { top: r.top, bottom: r.bottom };
        for (const ch of el.children) walk(ch, id, r.left, r.top, inner, zoom);
        add(`${MID ? 'rounded=1;arcSize=12;strokeColor=${FRAME};strokeWidth=1.5;' : 'rounded=0;strokeColor=#000000;'}html=1;fillColor=none;pointerEvents=0;`, { x: 0, y: 0, w: g.w, h: g.h }, { parent: id });
        if (MID) add('rounded=1;arcSize=40;html=1;fillColor=#FFFFFF;strokeColor=${FRAME};strokeWidth=1.5;', { x: g.w / 2 - 50, y: -2, w: 100, h: 20 }, { parent: id });
        return;
      }
      if (el.classList.contains('scroll')) clip = { top: Math.max(clip?.top ?? -1e9, r.top), bottom: Math.min(clip?.bottom ?? 1e9, r.bottom) };
      // boxes
      const bgi = cs.backgroundImage.match(/url\("data:image\/svg\+xml,(.*)"\)/);
      if (bgi) {
        const svg = decodeURIComponent(bgi[1]), size = cs.backgroundSize.split(' ')[0];
        const w = size.endsWith('%') ? g.w * parseFloat(size) / 100 : parseFloat(size) * k || g.w * 0.5, h = w * 48 / 64;
        const bgc = rgb(cs.backgroundColor); if (bgc) add(`rounded=0;html=1;fillColor=${bgc};strokeColor=none;`, g, { parent });
        add(`shape=image;html=1;imageAspect=0;image=data:image/svg+xml,${B64(svg)};`, { x: g.x + (g.w - w) / 2, y: g.y + (g.h - h) / 2, w, h }, { parent });
        for (const ch of el.children) walk(ch, parent, ox, oy, clip, k);
        return;
      }
      const bg = rgb(cs.backgroundColor); const bw = ['Top', 'Right', 'Bottom', 'Left'].map((s) => (cs[`border${s}Style`] !== 'none' ? parseFloat(cs[`border${s}Width`]) : 0)); const bc = rgb(cs.borderTopColor) || rgb(cs.borderBottomColor);
      const round = parseFloat(cs.borderTopLeftRadius) >= Math.min(r.width, r.height) / 2 - 1 && Math.abs(r.width - r.height) < 2;
      const dashed = /dashed/.test(cs.borderTopStyle + cs.borderLeftStyle) ? 'dashed=1;' : '';
      const field = el.matches('input, textarea, select');
      if (el.classList.contains('b-note')) add('shape=note;size=14;whiteSpace=wrap;html=1;fillColor=#FFF2CC;strokeColor=#D6B656;', g, { parent });
      else if (el.matches('input[type=checkbox], input[type=radio]')) { add(`${el.type === 'radio' ? 'ellipse;' : 'rounded=0;'}html=1;fillColor=${el.checked ? '#DAE8FC' : '#FFFFFF'};strokeColor=#000000;fontSize=${R(13 * k)};`, g, { parent, value: el.checked ? (el.type === 'radio' ? '●' : '✓') : '' }); return; }
      else if (el.type === 'range') { add('rounded=0;html=1;fillColor=#B3B3B3;strokeColor=none;', { x: g.x, y: g.y + g.h / 2 - 1.5, w: g.w, h: 3 }, { parent }); const f = (el.value - el.min) / (el.max - el.min || 1); add('ellipse;html=1;fillColor=#6C8EBF;strokeColor=#000000;', { x: g.x + g.w * f - 6, y: g.y + g.h / 2 - 6, w: 12, h: 12 }, { parent }); return; }
      else if (field) {
        const v = BARS ? (el.tagName === 'SELECT' ? '▾' : '') : el.tagName === 'SELECT' ? (el.selectedOptions[0]?.textContent || '') + '  ▾' : el.value || el.placeholder || '';
        add(`rounded=0;whiteSpace=wrap;html=1;fillColor=${bg || '#FFFFFF'};strokeColor=${bc || '#000000'};${dashed}align=left;verticalAlign=${el.tagName === 'TEXTAREA' ? 'top' : 'middle'};spacingLeft=${R(parseFloat(cs.paddingLeft) * k)};spacingTop=${el.tagName === 'TEXTAREA' ? R(parseFloat(cs.paddingTop) * k) : 0};fontSize=${R(parseFloat(cs.fontSize) * k)};${FONT}fontColor=${el.value ? '#000000' : '#666666'};`, g, { parent, value: X(v) });
        if (BARS && (el.value || el.placeholder) && el.tagName !== 'SELECT') add('rounded=1;arcSize=50;html=1;fillColor=#A9A9A9;strokeColor=none;', { x: g.x + 10 * k, y: g.y + g.h / 2 - 3.5, w: Math.min(g.w * 0.45, 140), h: 7 }, { parent });
        return;
      } else if (bw.every((w) => w > 0) && bc) add(`${round ? 'ellipse;' : 'rounded=0;'}whiteSpace=wrap;html=1;fillColor=${bg || 'none'};strokeColor=${bc};${dashed}`, g, { parent });
      else {
        if (bg && !(el.classList.contains('app') || el.classList.contains('view') || el.classList.contains('page'))) add(`${round ? 'ellipse;' : 'rounded=0;'}html=1;fillColor=${bg};strokeColor=none;`, g, { parent });
        const line = (side, gg) => { const c = rgb(cs[`border${side}Color`]); if (c) add(`rounded=0;html=1;fillColor=${c};strokeColor=none;`, gg, { parent }); };
        if (bw[0]) line('Top', { x: g.x, y: g.y, w: g.w, h: bw[0] }); if (bw[2] && r.bottom <= (clip?.bottom ?? 1e9)) line('Bottom', { x: g.x, y: g.y + r.height - bw[2], w: g.w, h: bw[2] });
        if (bw[3]) line('Left', { x: g.x, y: g.y, w: bw[3], h: g.h });
      }
      // a few shapes that live in pseudo-elements
      if (el.matches('.journey li')) { const done = el.classList.contains('done'), now = el.classList.contains('now'); add(`ellipse;html=1;fillColor=${done ? '#6C8EBF' : '#FFFFFF'};strokeColor=${done || now ? '#6C8EBF' : '#000000'};`, { x: g.x + g.w / 2 - 5, y: g.y + 2, w: 10, h: 10 }, { parent }); if (el.previousElementSibling) add(`rounded=0;html=1;fillColor=${done || now ? '#6C8EBF' : '#B3B3B3'};strokeColor=none;`, { x: g.x - g.w / 2 + 5, y: g.y + 6, w: g.w - 10, h: 1.5 }, { parent }); }
      if (el.matches('.switch i')) add('ellipse;html=1;fillColor=#FFFFFF;strokeColor=#000000;', { x: g.x + (el.parentElement.getAttribute('aria-checked') === 'true' ? g.w - g.h + 2 : 2), y: g.y + 2, w: g.h - 4, h: g.h - 4 }, { parent });
      if (el.matches('.cal button.has')) add('ellipse;html=1;fillColor=#6C8EBF;strokeColor=none;', { x: g.x + g.w / 2 - 2.5, y: g.y + g.h - 8, w: 5, h: 5 }, { parent });
      // text
      for (const node of el.childNodes) {
        if (node.nodeType !== 3 || !node.textContent.trim()) continue;
        const range = document.createRange(); range.selectNodeContents(node); const rects = [...range.getClientRects()].filter((q) => q.width > 0); if (!rects.length) continue;
        const t = Math.min(...rects.map((q) => q.top)), b = Math.max(...rects.map((q) => q.bottom)), l = Math.min(...rects.map((q) => q.left)), rr = Math.max(...rects.map((q) => q.right));
        if (clip && (t + (rects[0].height) / 2 > clip.bottom || b < clip.top)) continue;
        const lines = new Set(rects.map((q) => Math.round(q.top))).size; let txt = node.textContent.replace(/\s+/g, ' ').trim();
        if (cs.textTransform === 'uppercase') txt = txt.toUpperCase();
        if (BARS && el.closest('.phone')) { // lo-fi: one grey bar per line of text, as long as the text
          const dark = el.matches('h1, h2, h3, .h1, .h2, .h3, b, strong, .btn, .eyebrow') || el.closest('h1, h2, h3, .h1, .h2, .h3, .btn');
          const th = Math.max(2, parseFloat(cs.fontSize) * 0.48 * k), byLine = new Map();
          rects.forEach((q) => { const key = Math.round(q.top); const o = byLine.get(key); byLine.set(key, o ? { top: o.top, h: o.h, l: Math.min(o.l, q.left), r: Math.max(o.r, q.right) } : { top: q.top, h: q.height, l: q.left, r: q.right }); });
          for (const ln of byLine.values()) if (!clip || ln.top + ln.h / 2 < clip.bottom) add(`rounded=1;arcSize=50;html=1;fillColor=${dark ? '#6B6B6B' : '#A9A9A9'};strokeColor=none;`, { x: ln.l - ox, y: ln.top + ln.h / 2 - th / 2 - oy, w: ln.r - ln.l, h: th }, { parent });
          continue;
        }
        const fs = R(parseFloat(cs.fontSize) * k), bold = parseInt(cs.fontWeight) >= 600 ? 1 : 0, ul = /underline/.test(cs.textDecorationLine) ? 4 : 0;
        const multi = lines > 1, al = multi && cs.textAlign === 'center' ? 'center' : 'left';
        const gx = multi ? (al === 'center' ? r.left : l) : l, gw = multi ? (al === 'center' ? r.width : Math.min(r.right, rr + 8) - l + 6) : rr - l + 6;
        add(`text;html=1;align=${al};verticalAlign=middle;${multi ? 'whiteSpace=wrap;' : ''}spacing=0;fontSize=${fs};fontStyle=${bold + ul};fontColor=${rgb(cs.color) || '#000000'};${FONT}strokeColor=none;fillColor=none;`, { x: gx - ox, y: t - oy, w: gw, h: b - t }, { parent, value: X(txt) });
      }
      if (el.tagName === 'A' && el.getAttribute('href')?.startsWith('#') && linkTo(el.getAttribute('href')) && !el.closest('.phone')) add('rounded=0;html=1;fillColor=none;strokeColor=none;', g, { parent, link: linkTo(el.getAttribute('href')) });
      for (const ch of el.children) walk(ch, parent, ox, oy, clip, k);
    };
    for (const ch of page.children) walk(ch, 1, P.left, P.top, null, 1);
    // real connectors between phones that link to each other
    page.querySelectorAll('.b-row').forEach((row) => { const cols = [...row.querySelectorAll('.b-col')]; cols.slice(0, -1).forEach((col, i) => { const via = col.querySelector('.b-label .via'); if (!via) return; const a = phoneIds.get(col.querySelector('.phone')), b = phoneIds.get(cols[i + 1].querySelector('.phone')); if (!MID) { cells.push(`<mxCell id="c${pi}-${n++}" value="" style="endArrow=block;endFill=1;html=1;rounded=0;strokeColor=#000000;exitX=1;exitY=0.45;entryX=0;entryY=0.45;" edge="1" parent="1" source="${a}" target="${b}"><mxGeometry relative="1" as="geometry"/></mxCell>`); return; }
      // Mid-fi: badge on the tapped control, blue connector from the phone edge at the same height, straight when it can be.
      const nextId = cols[i + 1].dataset.id, ph = col.querySelector('.phone'), nph = cols[i + 1].querySelector('.phone');
      const tap = [...col.querySelectorAll(`[data-hot="${nextId}"]`)].find((e) => !e.closest('.tabs') && !e.closest('.top')); if (!tap) return;
      const pr = ph.getBoundingClientRect(), nr = nph.getBoundingClientRect(), tr = tap.getBoundingClientRect();
      const sv = (tap.closest('.scroll') || ph).getBoundingClientRect(), ty = tr.top + tr.height / 2, hidden = ty > sv.bottom - 8 || ty < sv.top + 8;
      const y = Math.max(pr.top + 60, Math.min(ty, pr.bottom - 60)), exitY = Math.max(0.02, Math.min(0.98, (y - pr.top) / pr.height)), entryY = Math.max(70, Math.min(y - nr.top, nr.height - 70)) / nr.height;
      const others = [...ph.querySelectorAll('button, a, input, label.btn, .chip, .row')].filter((e) => e !== tap && !tap.contains(e) && !e.contains(tap)).map((e) => e.getBoundingClientRect());
      const hits = (x) => others.some((o) => o.width && x + 15 > o.left && x - 15 < o.right && y + 15 > o.top && y - 15 < o.bottom);
      const bxAbs = !hits(tr.right + 18) && tr.right + 18 < pr.right - 16 ? tr.right + 18 : Math.min(tr.right - 15, pr.right - 18);
      if (!hidden) add(`shape=image;html=1;imageAspect=0;image=data:image/svg+xml,${BADGE};`, { x: bxAbs - pr.left - 15, y: y - pr.top - 15, w: 30, h: 30 }, { parent: a });
      cells.push(`<mxCell id="c${pi}-${n++}" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;endArrow=block;endFill=1;endSize=8;html=1;strokeColor=#0088FF;strokeWidth=3;exitX=1;exitY=${exitY.toFixed(3)};exitDx=13;entryX=0;entryY=${entryY.toFixed(3)};entryDx=-13;" edge="1" parent="1" source="${a}" target="${b}"><mxGeometry relative="1" as="geometry"/></mxCell>`); }); });
    const name = document.body.dataset.sheet === '1' ? (HIFI ? 'Hi-fi prototype' : MID ? 'Mid-fi wireframe' : 'Lo-fi wireframe') : pi === 0 ? 'Journey map' : pi === 1 ? 'Audit' : `Board ${pi - 1}`;
    xml += `<diagram id="${pageId(pi)}" name="${name}"><mxGraphModel dx="1600" dy="1100" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${Math.round(P.width)}" pageHeight="${Math.round(P.height)}" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells.join('')}</root></mxGraphModel></diagram>`;
  });
  return xml + '</mxfile>';
}
