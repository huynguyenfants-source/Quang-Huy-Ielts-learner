/* utils.js — DOM helpers, toast, modal */
export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

export function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null) continue;
    e.append(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return e;
}

export function html(strings, ...vals) {
  const raw = strings.reduce((a, s, i) => a + (vals[i - 1] == null ? '' : String(vals[i - 1])) + s);
  const t = document.createElement('template');
  t.innerHTML = raw;
  return t.content;
}

/** Simple UUID v4 */
export const uuid = () => crypto.randomUUID
  ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });

/** Format ISO date string as dd/mm/yyyy */
export const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('vi-VN')
  : '';

/** Format seconds → mm:ss */
export const fmtTime = (secs) => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

/** Debounce */
export const debounce = (fn, ms = 300) => {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};

/* ── Toast ──────────────────────────────────────────────── */
export function toast(msg, type = 'info', duration = 3000) {
  const root = document.getElementById('toastRoot');
  if (!root) return;
  const t = el('div', { class: `toast ${type}` }, msg);
  root.appendChild(t);
  setTimeout(() => t.remove(), duration);
}

/* ── Modal ──────────────────────────────────────────────── */
export function openModal({ title, body, footer, wide = false }) {
  const root = document.getElementById('modalRoot');
  if (!root) return;
  root.innerHTML = '';

  const overlay = el('div', { class: 'modal-overlay' });
  const modal   = el('div', { class: `modal${wide ? ' wide' : ''}` });

  const header = el('div', { class: 'modal-header' },
    el('span', { class: 'modal-title' }, title),
    el('button', { class: 'modal-close', onclick: () => overlay.remove() }, '✕')
  );
  modal.append(header);

  if (typeof body === 'string') {
    const d = el('div', { class: 'modal-body' });
    d.innerHTML = body;
    modal.append(d);
  } else if (body instanceof Node) {
    modal.append(body);
  }

  if (footer) {
    const f = el('div', { class: 'modal-footer' });
    if (typeof footer === 'string') f.innerHTML = footer;
    else f.append(...(Array.isArray(footer) ? footer : [footer]));
    modal.append(f);
  }

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  overlay.append(modal);
  root.append(overlay);
  return overlay;
}

export function closeModal() {
  document.getElementById('modalRoot').innerHTML = '';
}

/* ── Confirm dialog ─────────────────────────────────────── */
export function confirm(msg, onOk) {
  openModal({
    title: 'Xác nhận',
    body: el('p', {}, msg),
    footer: [
      el('button', { class: 'btn secondary', onclick: closeModal }, 'Huỷ'),
      el('button', { class: 'btn danger', onclick: () => { closeModal(); onOk(); } }, 'Đồng ý'),
    ],
  });
}

/* ── Render tabs ────────────────────────────────────────── */
export function renderTabs(container, tabs, active, onChange) {
  const bar = el('div', { class: 'tabs' });
  for (const t of tabs) {
    bar.append(el('button', {
      class: `tab${t.id === active ? ' active' : ''}`,
      onclick: () => onChange(t.id),
    }, t.label));
  }
  container.prepend(bar);
}

/* ── Highlight text diff ────────────────────────────────── */
export function diffHtml(original, corrected) {
  const orig = original.split(/\s+/);
  const corr = corrected.split(/\s+/);
  const dp = Array.from({ length: orig.length + 1 }, () => new Array(corr.length + 1).fill(0));
  for (let i = 1; i <= orig.length; i++)
    for (let j = 1; j <= corr.length; j++)
      dp[i][j] = orig[i - 1] === corr[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);

  const res = [];
  let i = orig.length, j = corr.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && orig[i - 1] === corr[j - 1]) { res.unshift({ t: 'same', w: orig[i - 1] }); i--; j--; }
    else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) { res.unshift({ t: 'add', w: corr[j - 1] }); j--; }
    else { res.unshift({ t: 'del', w: orig[i - 1] }); i--; }
  }

  return res.map(r => {
    if (r.t === 'same') return r.w;
    if (r.t === 'add')  return `<span class="diff-add">${r.w}</span>`;
    return `<span class="diff-del">${r.w}</span>`;
  }).join(' ');
}
