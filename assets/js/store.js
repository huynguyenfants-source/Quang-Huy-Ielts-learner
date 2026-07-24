// Persistent data layer backed by localStorage. All user content lives here,
// so the app is fully editable and works offline.
import * as seed from './content.js';

const KEY = 'qh_ielts_v1';

const DEFAULT_STATE = () => ({
  version: 1,
  profile: { name: 'Quang Huy', goal: 7.0, targetDate: '' },
  settings: {
    theme: 'light',
    ai: { provider: 'gemini', keys: {}, model: {} },
    github: { token: '', gistId: '' },
  },
  vocab: structuredClone(seed.SEED_VOCAB),
  mistakes: structuredClone(seed.SEED_MISTAKES),
  docs: structuredClone(seed.SEED_DOCS),
  notes: [],
  attempts: [],       // {id, skill, band, ts, meta}
  images: [],         // {id, name, dataUrl, note, ts}
  // Editable exercise banks (seeded, user can add/edit)
  writingPrompts: structuredClone(seed.WRITING_PROMPTS),
  readingPassages: structuredClone(seed.READING_PASSAGES),
  listeningItems: structuredClone(seed.LISTENING_ITEMS),
  speakingPrompts: structuredClone(seed.SPEAKING_PROMPTS),
});

let state = load();
const subscribers = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE();
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE(), ...parsed };
  } catch {
    return DEFAULT_STATE();
  }
}

export function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
  subscribers.forEach((fn) => fn(state));
}

export function subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); }
export function get() { return state; }

/** Mutate state via a callback then persist. */
export function update(mutator) { mutator(state); save(); }

// Collection helpers -------------------------------------------------------
export function addTo(collection, item) {
  state[collection].unshift(item);
  save();
  return item;
}
export function updateIn(collection, id, patch) {
  const list = state[collection];
  const idx = list.findIndex((x) => x.id === id);
  if (idx >= 0) { list[idx] = { ...list[idx], ...patch }; save(); }
}
export function removeFrom(collection, id) {
  state[collection] = state[collection].filter((x) => x.id !== id);
  save();
}

// Attempts / analytics -----------------------------------------------------
export function logAttempt(skill, band, meta = {}) {
  state.attempts.unshift({ id: Date.now().toString(36), skill, band, ts: Date.now(), meta });
  save();
}

export function analytics() {
  const bySkill = {};
  for (const a of state.attempts) {
    (bySkill[a.skill] ||= []).push(a.band);
  }
  const avg = (arr) => arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0;
  const skills = ['Writing', 'Reading', 'Listening', 'Speaking'].map((s) => ({
    skill: s,
    count: (bySkill[s] || []).length,
    avg: +avg(bySkill[s] || []).toFixed(1),
  }));
  const overall = +avg(skills.filter((s) => s.count).map((s) => s.avg)).toFixed(1);
  const weakest = skills.filter((s) => s.count).sort((a, b) => a.avg - b.avg)[0];
  const strongest = skills.filter((s) => s.count).sort((a, b) => b.avg - a.avg)[0];
  // Common error types from mistakes log
  const errorTypes = {};
  for (const m of state.mistakes) errorTypes[m.type] = (errorTypes[m.type] || 0) + 1;
  return { skills, overall, weakest, strongest, errorTypes, totalAttempts: state.attempts.length };
}

// Import / export ----------------------------------------------------------
export function exportState() { return JSON.stringify(state, null, 2); }
export function importState(json) {
  const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  state = { ...DEFAULT_STATE(), ...parsed };
  save();
}
export function resetState() { state = DEFAULT_STATE(); save(); }
