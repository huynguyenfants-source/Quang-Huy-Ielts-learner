// Small DOM + helper utilities (no dependencies).

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Create an element from an HTML string. */
export function html(strings, ...values) {
  const raw = typeof strings === 'string'
    ? strings
    : strings.reduce((acc, s, i) => acc + s + (values[i] ?? ''), '');
  const tpl = document.createElement('template');
  tpl.innerHTML = raw.trim();
  return tpl.content.firstElementChild;
}

/** Escape untrusted text for safe HTML interpolation. */
export function esc(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function fmtDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function toast(msg, type = '') {
  const root = $('#toastRoot');
  const t = html(`<div class="toast ${type}">${esc(msg)}</div>`);
  root.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 250); }, 3200);
}

/** Open a modal. content is an HTMLElement or html string. Returns {close}. */
export function modal(title, content, { footer } = {}) {
  const root = $('#modalRoot');
  const back = html(`<div class="modal-backdrop"><div class="modal"><div class="row between"><h3>${esc(title)}</h3><button class="icon-btn plain" data-close>✕</button></div><div class="modal-body"></div></div></div>`);
  const body = $('.modal-body', back);
  if (typeof content === 'string') body.innerHTML = content; else body.appendChild(content);
  if (footer) { const f = html(`<div class="row" style="margin-top:16px;justify-content:flex-end"></div>`); f.appendChild(footer); $('.modal', back).appendChild(f); }
  const close = () => back.remove();
  back.addEventListener('click', (e) => { if (e.target === back || e.target.hasAttribute('data-close')) close(); });
  root.appendChild(back);
  return { close, body };
}

export function confirmDialog(message) {
  return new Promise((resolve) => {
    const btns = html(`<div class="row"><button class="btn ghost" data-no>Huỷ</button><button class="btn danger" data-yes>Xoá</button></div>`);
    const m = modal('Xác nhận', `<p>${esc(message)}</p>`, { footer: btns });
    btns.querySelector('[data-yes]').onclick = () => { m.close(); resolve(true); };
    btns.querySelector('[data-no]').onclick = () => { m.close(); resolve(false); };
  });
}

export function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function readFileAsText(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsText(file);
  });
}

export function readFileAsDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

/** Simple word-level diff -> HTML with <ins>/<del>. */
export function diffWords(a = '', b = '') {
  const aw = a.split(/(\s+)/), bw = b.split(/(\s+)/);
  const n = aw.length, m = bw.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = aw[i] === bw[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  let i = 0, j = 0, out = '';
  while (i < n && j < m) {
    if (aw[i] === bw[j]) { out += esc(aw[i]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { if (aw[i].trim()) out += `<del>${esc(aw[i])}</del>`; else out += aw[i]; i++; }
    else { if (bw[j].trim()) out += `<ins>${esc(bw[j])}</ins>`; else out += bw[j]; j++; }
  }
  while (i < n) { if (aw[i].trim()) out += `<del>${esc(aw[i])}</del>`; else out += aw[i]; i++; }
  while (j < m) { if (bw[j].trim()) out += `<ins>${esc(bw[j])}</ins>`; else out += bw[j]; j++; }
  return out;
}
