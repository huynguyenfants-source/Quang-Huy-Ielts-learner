// App shell: navigation, hash router, theme, global search, quick note.
import { $, $$, html, esc, uid, toast, modal } from './utils.js';
import * as store from './store.js';
import { SkillViews } from './views/skills.js';
import { LibraryViews } from './views/library.js';

const ROUTES = [
  { group: 'Học tập' },
  { path: 'dashboard', title: 'Trang chủ', icon: '🏠', view: SkillViews.Dashboard },
  { path: 'writing', title: 'Writing · Viết', icon: '✍️', view: SkillViews.Writing },
  { path: 'reading', title: 'Reading · Đọc', icon: '📖', view: SkillViews.Reading },
  { path: 'listening', title: 'Listening · Nghe', icon: '🎧', view: SkillViews.Listening },
  { path: 'speaking', title: 'Speaking · Nói', icon: '🗣️', view: SkillViews.Speaking },
  { path: 'mock', title: 'Thi thử IELTS', icon: '🧪', view: SkillViews.Mock },
  { group: 'Kho cá nhân' },
  { path: 'vocab', title: 'Từ vựng', icon: '📚', view: LibraryViews.Vocab },
  { path: 'mistakes', title: 'Lỗi hay gặp', icon: '⚠️', view: LibraryViews.Mistakes },
  { path: 'docs', title: 'Tài liệu', icon: '🗂️', view: LibraryViews.Docs },
  { path: 'images', title: 'Ảnh & OCR', icon: '🖼️', view: LibraryViews.Images },
  { group: 'Công cụ' },
  { path: 'bilingual', title: 'Song ngữ', icon: '🌐', view: LibraryViews.Bilingual },
  { path: 'assistant', title: 'Trợ lý AI', icon: '🤖', view: LibraryViews.Assistant },
  { path: 'settings', title: 'Cấu hình', icon: '⚙️', view: LibraryViews.Settings },
];

const routable = ROUTES.filter((r) => r.path);

function buildNav() {
  const nav = $('#nav');
  nav.innerHTML = '';
  ROUTES.forEach((r) => {
    if (r.group) { nav.append(html(`<div class="group-label">${esc(r.group)}</div>`)); return; }
    const a = html(`<a href="#/${r.path}" data-path="${r.path}"><span class="ico">${r.icon}</span><span>${esc(r.title)}</span></a>`);
    nav.append(a);
  });
}

function currentPath() {
  const p = (location.hash.replace(/^#\//, '') || 'dashboard').split('?')[0];
  return routable.some((r) => r.path === p) ? p : 'dashboard';
}

function render() {
  const path = currentPath();
  const route = routable.find((r) => r.path === path);
  $('#topbarTitle').textContent = route.title;
  $$('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.path === path));
  const view = $('#view');
  view.innerHTML = '';
  try { view.append(route.view()); }
  catch (e) { view.append(html(`<div class="empty">Lỗi hiển thị: ${esc(e.message)}</div>`)); console.error(e); }
  window.scrollTo(0, 0);
  $('#sidebar').classList.remove('open');
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function quickNote() {
  const form = html(`<div><label class="field"><span>Ghi chú nhanh</span><textarea id="qn" placeholder="Ý tưởng, từ mới, lỗi vừa gặp…"></textarea></label><button class="btn" id="save">Lưu vào Tài liệu</button></div>`);
  const m = modal('Ghi chú nhanh', form);
  $('#save', form).onclick = () => { const t = $('#qn', form).value.trim(); if (!t) return; store.addTo('docs', { id: uid(), title: 'Ghi chú ' + new Date().toLocaleString('vi-VN'), tags: ['note'], body: t }); m.close(); toast('Đã lưu ghi chú', 'success'); if (currentPath() === 'docs') render(); };
}

function init() {
  buildNav();
  applyTheme(store.get().settings.theme || 'light');

  window.addEventListener('hashchange', render);
  $('#menuToggle').onclick = () => $('#sidebar').classList.toggle('open');
  $('#themeToggle').onclick = () => {
    const next = (document.documentElement.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
    applyTheme(next); store.update((s) => { s.settings.theme = next; });
  };
  $('#quickAdd').onclick = quickNote;

  const search = $('#globalSearch');
  search.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const q = search.value.trim(); if (!q) return;
    location.hash = '#/vocab';
    setTimeout(() => { const vq = $('#vq'); if (vq) { vq.value = q; $('#look')?.click(); } }, 60);
  });

  if (!location.hash) location.hash = '#/dashboard';
  render();
}

init();
