/* app.js — router, nav builder, theme toggle, global search, quick-add */
import { el, toast, openModal, closeModal, uuid, debounce } from './utils.js';
import { getSettings, saveSettings, addDoc, addVocabItem } from './store.js';
import {
  renderDashboard,
  renderWriting,
  renderReading,
  renderListening,
  renderSpeaking,
  renderMock,
} from './views/skills.js';
import {
  renderVocab,
  renderMistakes,
  renderDocs,
  renderImages,
  renderBilingual,
  renderAssistant,
  renderSettings,
} from './views/library.js';

/* ── Route definitions ───────────────────────────────────── */
const ROUTES = [
  {
    section: 'Tổng quan',
    items: [
      { id: 'dashboard', label: 'Trang chủ',  icon: '🏠', render: renderDashboard },
    ],
  },
  {
    section: '4 Kỹ năng',
    items: [
      { id: 'writing',   label: 'Writing',    icon: '✍️', render: renderWriting   },
      { id: 'reading',   label: 'Reading',    icon: '📖', render: renderReading   },
      { id: 'listening', label: 'Listening',  icon: '🎧', render: renderListening },
      { id: 'speaking',  label: 'Speaking',   icon: '🎤', render: renderSpeaking  },
    ],
  },
  {
    section: 'Luyện thi',
    items: [
      { id: 'mock',      label: 'Thi thử',    icon: '🏆', render: renderMock      },
    ],
  },
  {
    section: 'Thư viện',
    items: [
      { id: 'vocab',     label: 'Từ vựng',    icon: '📚', render: renderVocab     },
      { id: 'mistakes',  label: 'Lỗi hay gặp',icon: '⚠️', render: renderMistakes  },
      { id: 'docs',      label: 'Tài liệu',   icon: '📄', render: renderDocs      },
      { id: 'images',    label: 'Ảnh & OCR',  icon: '🖼️', render: renderImages    },
      { id: 'bilingual', label: 'Song ngữ',   icon: '🌐', render: renderBilingual },
      { id: 'assistant', label: 'Trợ lý AI',  icon: '🤖', render: renderAssistant },
    ],
  },
  {
    section: 'Cấu hình',
    items: [
      { id: 'settings',  label: 'Cấu hình',   icon: '⚙️', render: renderSettings  },
    ],
  },
];

/* ── Flat map for lookups ────────────────────────────────── */
const FLAT_ROUTES = ROUTES.flatMap(s => s.items);

/* ── DOM refs ────────────────────────────────────────────── */
const navEl        = document.getElementById('nav');
const viewEl       = document.getElementById('view');
const topbarTitle  = document.getElementById('topbarTitle');
const themeToggle  = document.getElementById('themeToggle');
const menuToggle   = document.getElementById('menuToggle');
const sidebar      = document.getElementById('sidebar');
const globalSearch = document.getElementById('globalSearch');
const quickAdd     = document.getElementById('quickAdd');

/* ── State ───────────────────────────────────────────────── */
let currentRoute = 'dashboard';

/* ── Theme ───────────────────────────────────────────────── */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function initTheme() {
  const s = getSettings();
  applyTheme(s.theme || 'light');
}

themeToggle.addEventListener('click', () => {
  const s = getSettings();
  const next = s.theme === 'dark' ? 'light' : 'dark';
  saveSettings({ ...s, theme: next });
  applyTheme(next);
});

/* ── Navigation builder ──────────────────────────────────── */
function buildNav() {
  navEl.innerHTML = '';
  for (const section of ROUTES) {
    navEl.append(el('div', { class: 'nav-section' }, section.section));
    for (const item of section.items) {
      const navItem = el('div', {
        class: `nav-item${item.id === currentRoute ? ' active' : ''}`,
        'data-route': item.id,
      },
        el('span', { class: 'icon' }, item.icon),
        item.label,
      );
      navItem.addEventListener('click', () => navigate(item.id));
      navEl.append(navItem);
    }
  }
}

/* ── Router ──────────────────────────────────────────────── */
function navigate(routeId) {
  const route = FLAT_ROUTES.find(r => r.id === routeId);
  if (!route) return;

  currentRoute = routeId;
  topbarTitle.textContent = route.label;
  window.location.hash = routeId;

  // Update nav
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.route === routeId);
  });

  // Close sidebar on mobile
  sidebar.classList.remove('open');

  // Render
  viewEl.innerHTML = '';
  try {
    route.render(viewEl);
  } catch (e) {
    viewEl.innerHTML = `<div class="card"><p class="muted">Lỗi khi tải trang: ${e.message}</p></div>`;
    console.error(e);
  }
}

/* ── Mobile sidebar toggle ───────────────────────────────── */
menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));

// Close sidebar when clicking outside
document.addEventListener('click', (e) => {
  if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
    sidebar.classList.remove('open');
  }
});

/* ── Global search ───────────────────────────────────────── */
globalSearch.addEventListener('input', debounce(() => {
  const q = globalSearch.value.trim().toLowerCase();
  if (!q) return;

  // Quick navigation: match route names
  const match = FLAT_ROUTES.find(r =>
    r.label.toLowerCase().includes(q) || r.id.includes(q)
  );
  if (match) {
    navigate(match.id);
    globalSearch.value = '';
  }
}, 400));

/* ── Quick-add note button ───────────────────────────────── */
quickAdd.addEventListener('click', () => {
  const titleI = el('input', { type: 'text', placeholder: 'Tiêu đề ghi chú…' });
  const contentI = el('textarea', { placeholder: 'Nội dung…', style: 'min-height:120px' });

  openModal({
    title: '＋ Ghi chú nhanh',
    body: el('div', { class: 'flex-col' },
      el('div', { class: 'form-group' }, el('label', {}, 'Tiêu đề'), titleI),
      el('div', { class: 'form-group' }, el('label', {}, 'Nội dung'), contentI),
    ),
    footer: [
      el('button', { class: 'btn secondary', onclick: closeModal }, 'Huỷ'),
      el('button', { class: 'btn', onclick: () => {
        if (!titleI.value.trim() && !contentI.value.trim()) { closeModal(); return; }
        addDoc({ id: uuid(), title: titleI.value.trim() || 'Ghi chú nhanh', content: contentI.value, date: new Date().toISOString() });
        closeModal();
        toast('Đã lưu ghi chú', 'success');
      }}, '💾 Lưu'),
    ],
  });
});

/* ── Handle hash routing ─────────────────────────────────── */
function routeFromHash() {
  const hash = window.location.hash.replace('#', '');
  return FLAT_ROUTES.find(r => r.id === hash) ? hash : 'dashboard';
}

window.addEventListener('hashchange', () => {
  const id = routeFromHash();
  if (id !== currentRoute) navigate(id);
});

/* ── Boot ────────────────────────────────────────────────── */
initTheme();
buildNav();
navigate(routeFromHash());
