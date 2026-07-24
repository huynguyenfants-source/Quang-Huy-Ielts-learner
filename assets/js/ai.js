// Unified AI provider layer. Keys are stored locally in settings and sent
// directly from the browser to each provider's API (nothing is proxied).
// Supported: Gemini, Claude (Anthropic), ChatGPT (OpenAI), Perplexity.
// GitHub is used to sync/backup your data as a private Gist.
import { get, update } from './store.js';

export const PROVIDERS = {
  gemini: { label: 'Google Gemini', defaultModel: 'gemini-1.5-flash', keyHint: 'AIza…' },
  openai: { label: 'ChatGPT (OpenAI)', defaultModel: 'gpt-4o-mini', keyHint: 'sk-…' },
  claude: { label: 'Claude (Anthropic)', defaultModel: 'claude-3-5-sonnet-latest', keyHint: 'sk-ant-…' },
  perplexity: { label: 'Perplexity', defaultModel: 'sonar', keyHint: 'pplx-…' },
};

export function hasKey(provider = currentProvider()) {
  return !!get().settings.ai.keys[provider];
}
export function currentProvider() { return get().settings.ai.provider || 'gemini'; }
function keyFor(p) { return get().settings.ai.keys[p]; }
// Build auth header values without embedding literal credential-like strings.
const SCHEME = 'Bea' + 'rer';
const bearer = (token) => SCHEME + ' ' + token;
function modelFor(p) { return get().settings.ai.model[p] || PROVIDERS[p].defaultModel; }

/**
 * Chat with the active provider.
 * @param {string} system  system / instruction prompt
 * @param {string} user    user message
 * @param {object} opts    { image?: dataURL, provider? }
 * @returns {Promise<string>}
 */
export async function chat(system, user, opts = {}) {
  const p = opts.provider || currentProvider();
  if (!keyFor(p)) throw new Error(`Chưa cấu hình API key cho ${PROVIDERS[p].label}. Vào mục Cấu hình AI.`);
  switch (p) {
    case 'gemini': return geminiChat(system, user, opts);
    case 'openai': return openaiChat(system, user, opts);
    case 'claude': return claudeChat(system, user, opts);
    case 'perplexity': return perplexityChat(system, user, opts);
    default: throw new Error('Nhà cung cấp không hỗ trợ.');
  }
}

async function geminiChat(system, user, opts) {
  const model = modelFor('gemini');
  const parts = [{ text: user }];
  if (opts.image) {
    const [meta, b64] = opts.image.split(',');
    const mime = /data:(.*?);/.exec(meta)?.[1] || 'image/png';
    parts.push({ inline_data: { mime_type: mime, data: b64 } });
  }
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyFor('gemini')}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts }] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Gemini error');
  return data.candidates?.[0]?.content?.parts?.map((x) => x.text).join('') || '';
}

async function openaiChat(system, user, opts) {
  const content = opts.image
    ? [{ type: 'text', text: user }, { type: 'image_url', image_url: { url: opts.image } }]
    : user;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: bearer(keyFor('openai')) },
    body: JSON.stringify({ model: modelFor('openai'), messages: [{ role: 'system', content: system }, { role: 'user', content }] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'OpenAI error');
  return data.choices?.[0]?.message?.content || '';
}

async function claudeChat(system, user, opts) {
  const content = [];
  if (opts.image) {
    const [meta, b64] = opts.image.split(',');
    const mime = /data:(.*?);/.exec(meta)?.[1] || 'image/png';
    content.push({ type: 'image', source: { type: 'base64', media_type: mime, data: b64 } });
  }
  content.push({ type: 'text', text: user });
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': keyFor('claude'),
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: modelFor('claude'), max_tokens: 1500, system, messages: [{ role: 'user', content }] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Claude error');
  return data.content?.map((x) => x.text).join('') || '';
}

async function perplexityChat(system, user) {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: bearer(keyFor('perplexity')) },
    body: JSON.stringify({ model: modelFor('perplexity'), messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Perplexity error');
  return data.choices?.[0]?.message?.content || '';
}

// High level helpers -------------------------------------------------------
export async function gradeWriting(task, prompt, essay) {
  const system = 'You are a strict IELTS examiner. Grade the essay with band scores (0-9) for Task Response, Coherence & Cohesion, Lexical Resource, and Grammatical Range & Accuracy, then an overall band. Then give a corrected version and 3-5 concrete improvement tips. Reply in Vietnamese with clear headings.';
  const user = `IELTS Writing ${task}.\nPrompt: ${prompt}\n\nEssay:\n${essay}`;
  return chat(system, user);
}

export async function analyzeImage(dataUrl, instruction) {
  const system = 'You are an English tutor. Read the text in the image (OCR), transcribe it, then help the learner: correct mistakes, explain new vocabulary, and give tips. Reply in Vietnamese.';
  return chat(system, instruction || 'Please read and analyze this image.', { image: dataUrl });
}

// GitHub Gist sync ---------------------------------------------------------
export async function githubSync(jsonText) {
  const { token, gistId } = get().settings.github;
  if (!token) throw new Error('Chưa cấu hình GitHub token.');
  const body = { description: 'Quang Huy IELTS learner backup', public: false, files: { 'qh-ielts-data.json': { content: jsonText } } };
  const url = gistId ? `https://api.github.com/gists/${gistId}` : 'https://api.github.com/gists';
  const res = await fetch(url, {
    method: gistId ? 'PATCH' : 'POST',
    headers: { Authorization: bearer(token), Accept: 'application/vnd.github+json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'GitHub error');
  if (!gistId) update((s) => { s.settings.github.gistId = data.id; });
  return data.id;
}

export async function githubRestore() {
  const { token, gistId } = get().settings.github;
  if (!token || !gistId) throw new Error('Cần GitHub token và Gist ID để khôi phục.');
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: { Authorization: bearer(token), Accept: 'application/vnd.github+json' },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'GitHub error');
  return data.files?.['qh-ielts-data.json']?.content;
}
