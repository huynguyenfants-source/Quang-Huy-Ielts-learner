/* store.js — localStorage data layer */

const PREFIX = 'qhielts_';

function key(name) { return PREFIX + name; }

function load(name, defaultVal) {
  try {
    const raw = localStorage.getItem(key(name));
    return raw ? JSON.parse(raw) : defaultVal;
  } catch { return defaultVal; }
}

function save(name, value) {
  try { localStorage.setItem(key(name), JSON.stringify(value)); } catch (e) {
    console.warn('Store save failed:', e);
  }
}

/* ── Settings / profile ──────────────────────────────────── */
export function getSettings() {
  return load('settings', {
    name: 'Quang Huy',
    targetBand: 7.0,
    theme: 'light',
    aiProvider: 'gemini',
    apiKeys: {},
    githubToken: '',
    githubGistId: '',
  });
}
export function saveSettings(s) { save('settings', s); }

/* ── Vocabulary ──────────────────────────────────────────── */
export function getVocab() { return load('vocab', []); }
export function saveVocab(list) { save('vocab', list); }

export function addVocabItem(item) {
  const list = getVocab();
  list.unshift(item);
  saveVocab(list);
}
export function deleteVocabItem(id) {
  saveVocab(getVocab().filter(v => v.id !== id));
}
export function updateVocabItem(id, patch) {
  saveVocab(getVocab().map(v => v.id === id ? { ...v, ...patch } : v));
}

/* ── Mistakes ────────────────────────────────────────────── */
export function getMistakes() { return load('mistakes', []); }
export function saveMistakes(list) { save('mistakes', list); }

export function addMistake(item) {
  const list = getMistakes();
  list.unshift(item);
  saveMistakes(list);
}
export function deleteMistake(id) { saveMistakes(getMistakes().filter(m => m.id !== id)); }

/* ── Documents / notes ───────────────────────────────────── */
export function getDocs() { return load('docs', []); }
export function saveDocs(list) { save('docs', list); }
export function addDoc(doc) { const l = getDocs(); l.unshift(doc); saveDocs(l); }
export function deleteDoc(id) { saveDocs(getDocs().filter(d => d.id !== id)); }
export function updateDoc(id, patch) {
  saveDocs(getDocs().map(d => d.id === id ? { ...d, ...patch } : d));
}

/* ── Writing sessions ────────────────────────────────────── */
export function getWritingSessions() { return load('writing_sessions', []); }
export function addWritingSession(s) {
  const list = getWritingSessions();
  list.unshift(s);
  if (list.length > 50) list.pop();
  save('writing_sessions', list);
}

/* ── Band history ────────────────────────────────────────── */
export function getBandHistory() { return load('band_history', []); }
export function addBandRecord(r) {
  const list = getBandHistory();
  list.push(r);
  save('band_history', list);
}

/* ── Images / OCR ────────────────────────────────────────── */
export function getImages() { return load('images', []); }
export function addImage(img) { const l = getImages(); l.unshift(img); save('images', l); }
export function deleteImage(id) { save('images', getImages().filter(i => i.id !== id)); }

/* ── Chat history ────────────────────────────────────────── */
export function getChatHistory() { return load('chat', []); }
export function appendChat(msg)  { const l = getChatHistory(); l.push(msg); if (l.length > 200) l.shift(); save('chat', l); }
export function clearChat()      { save('chat', []); }

/* ── Export / Import ─────────────────────────────────────── */
export function exportAll() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith(PREFIX)) {
      try { data[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k)); } catch {/* */}
    }
  }
  return data;
}

export function importAll(data) {
  for (const [name, value] of Object.entries(data)) {
    save(name, value);
  }
}

/* ── GitHub Gist backup / restore ───────────────────────── */
const GIST_API = 'https://api.github.com/gists';

export async function backupToGist() {
  const s = getSettings();
  if (!s.githubToken) throw new Error('Chưa đặt GitHub Token');
  const data = exportAll();
  const content = JSON.stringify(data, null, 2);
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `token ${s.githubToken}`,
  };

  if (s.githubGistId) {
    const r = await fetch(`${GIST_API}/${s.githubGistId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ files: { 'qhielts_backup.json': { content } } }),
    });
    if (!r.ok) throw new Error(`GitHub PATCH ${r.status}`);
    return (await r.json()).html_url;
  } else {
    const r = await fetch(GIST_API, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        description: 'Quang Huy IELTS backup',
        public: false,
        files: { 'qhielts_backup.json': { content } },
      }),
    });
    if (!r.ok) throw new Error(`GitHub POST ${r.status}`);
    const g = await r.json();
    const settings = getSettings();
    saveSettings({ ...settings, githubGistId: g.id });
    return g.html_url;
  }
}

export async function restoreFromGist() {
  const s = getSettings();
  if (!s.githubToken || !s.githubGistId) throw new Error('Chưa đặt GitHub Token / Gist ID');
  const r = await fetch(`${GIST_API}/${s.githubGistId}`, {
    headers: { Authorization: `token ${s.githubToken}` },
  });
  if (!r.ok) throw new Error(`GitHub GET ${r.status}`);
  const g = await r.json();
  const raw = g.files['qhielts_backup.json']?.content;
  if (!raw) throw new Error('Không tìm thấy file backup trong Gist');
  importAll(JSON.parse(raw));
}
