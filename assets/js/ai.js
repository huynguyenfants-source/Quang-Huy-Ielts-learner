/* ai.js — AI provider integrations */
import { getSettings } from './store.js';

/* ── Provider configs ────────────────────────────────────── */
const PROVIDERS = {
  gemini: {
    name: 'Gemini (Google)',
    endpoint: (key) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`,
    buildBody: (prompt) => ({
      contents: [{ parts: [{ text: prompt }] }],
    }),
    parseResponse: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
  },
  openai: {
    name: 'ChatGPT (OpenAI)',
    endpoint: () => 'https://api.openai.com/v1/chat/completions',
    headers: (key) => ({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }),
    buildBody: (prompt) => ({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content ?? '',
  },
  claude: {
    name: 'Claude (Anthropic)',
    endpoint: () => 'https://api.anthropic.com/v1/messages',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    }),
    buildBody: (prompt) => ({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
    parseResponse: (data) => data.content?.[0]?.text ?? '',
  },
  perplexity: {
    name: 'Perplexity',
    endpoint: () => 'https://api.perplexity.ai/chat/completions',
    headers: (key) => ({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }),
    buildBody: (prompt) => ({
      model: 'pplx-7b-online',
      messages: [{ role: 'user', content: prompt }],
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content ?? '',
  },
};

/* ── Core call ───────────────────────────────────────────── */
export async function callAI(prompt, providerOverride = null) {
  const settings = getSettings();
  const provName = providerOverride || settings.aiProvider || 'gemini';
  const prov = PROVIDERS[provName];
  if (!prov) throw new Error(`Nhà cung cấp AI không hợp lệ: ${provName}`);

  const apiKey = settings.apiKeys?.[provName];
  if (!apiKey) throw new Error(`Chưa đặt API key cho ${prov.name}. Vào Cấu hình → Kết nối AI.`);

  const url = typeof prov.endpoint === 'function' ? prov.endpoint(apiKey) : prov.endpoint;
  const headers = prov.headers ? prov.headers(apiKey) : { 'Content-Type': 'application/json' };
  const body = prov.buildBody(prompt);

  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`${prov.name} API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  return prov.parseResponse(data);
}

/* ── Convenience helpers ─────────────────────────────────── */

/** Score a Writing submission and return structured feedback */
export async function scoreWriting(essay, taskType = 'task2', taskPrompt = '') {
  const prompt = `You are an experienced IELTS examiner. Evaluate the following IELTS Writing ${taskType === 'task1' ? 'Task 1' : 'Task 2'} response.

${taskPrompt ? `Task prompt:\n${taskPrompt}\n\n` : ''}Essay:
${essay}

Provide feedback in Vietnamese with the following JSON structure (no markdown, raw JSON only):
{
  "band": <number 1–9 in 0.5 increments>,
  "taskAchievement": <score 1–9>,
  "coherenceCohesion": <score 1–9>,
  "lexicalResource": <score 1–9>,
  "grammaticalRange": <score 1–9>,
  "feedback": "<overall feedback in Vietnamese>",
  "corrections": "<a corrected version of the essay with improvements>",
  "tips": ["<tip 1>", "<tip 2>", "<tip 3>"]
}`;

  const raw = await callAI(prompt);
  try {
    const json = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(json);
  } catch {
    return { band: null, feedback: raw, corrections: '', tips: [] };
  }
}

/** Evaluate a speaking response */
export async function scoreSpeaking(transcript, question = '') {
  const prompt = `You are an experienced IELTS examiner. Evaluate the following spoken response to an IELTS Speaking question.

Question: ${question}

Response transcript:
${transcript}

Provide structured feedback in Vietnamese with this JSON (raw, no markdown):
{
  "band": <number 1–9>,
  "fluency": <1–9>,
  "vocabulary": <1–9>,
  "grammar": <1–9>,
  "pronunciation": <1–9>,
  "feedback": "<overall feedback>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>"]
}`;

  const raw = await callAI(prompt);
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return { band: null, feedback: raw, suggestions: [] };
  }
}

/** OCR + explanation from base64 image */
export async function analyseImage(base64, mimeType = 'image/jpeg') {
  const settings = getSettings();
  const provName = settings.aiProvider || 'gemini';

  // Only Gemini supports vision in this simple integration
  if (provName !== 'gemini') {
    throw new Error('Tính năng phân tích ảnh hiện chỉ hỗ trợ Gemini. Vui lòng chọn Gemini trong Cấu hình.');
  }

  const apiKey = settings.apiKeys?.gemini;
  if (!apiKey) throw new Error('Chưa đặt API key cho Gemini.');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`;
  const body = {
    contents: [{
      parts: [
        { text: 'Read the text in this image (OCR). Then:\n1. Correct any errors and rewrite improved text.\n2. Explain any difficult vocabulary or concepts in Vietnamese.' },
        { inline_data: { mime_type: mimeType, data: base64 } },
      ],
    }],
  };

  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Gemini Vision API error ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

/** Translate text */
export async function translate(text, from = 'en', to = 'vi') {
  const langNames = { en: 'English', vi: 'Vietnamese', zh: 'Chinese', ja: 'Japanese', ko: 'Korean', fr: 'French' };
  const prompt = `Translate the following text from ${langNames[from] || from} to ${langNames[to] || to}. Return only the translation, nothing else.\n\n${text}`;
  return callAI(prompt);
}

/** Chat with AI assistant */
export async function chat(messages) {
  const history = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
  const prompt = `You are a helpful English and IELTS tutor. Answer clearly in a mix of Vietnamese and English as appropriate. Keep answers concise.\n\nConversation:\n${history}\nAssistant:`;
  return callAI(prompt);
}

/** Get vocabulary details */
export async function lookupWord(word) {
  const prompt = `Provide detailed information about the English word "${word}" in the following JSON format (raw JSON, no markdown):
{
  "word": "${word}",
  "phonetic": "<IPA>",
  "partOfSpeech": "<noun/verb/adj/adv>",
  "definition": "<definition in Vietnamese>",
  "examples": ["<example sentence 1>", "<example sentence 2>"],
  "synonyms": ["<synonym 1>", "<synonym 2>", "<synonym 3>"],
  "ieltsUsage": "<how to use this word in IELTS writing/speaking>"
}`;
  const raw = await callAI(prompt);
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return { word, definition: raw };
  }
}

export const PROVIDER_LIST = Object.entries(PROVIDERS).map(([id, p]) => ({ id, name: p.name }));
