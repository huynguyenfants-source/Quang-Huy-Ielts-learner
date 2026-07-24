// Offline heuristic writing assistant. Provides grading, corrections and
// suggestions without any external service. When an AI key is configured the
// app prefers AI feedback (see ai.js), but this always works as a fallback.

// Common ESL error patterns: [regex, replacement, explanation, type]
const RULES = [
  [/\bi\b/g, 'I', 'Đại từ "I" luôn viết hoa.', 'Capitalization'],
  [/\bteh\b/gi, 'the', 'Lỗi chính tả: "teh" → "the".', 'Spelling'],
  [/\brecieve\b/gi, 'receive', 'Chính tả: "i before e except after c".', 'Spelling'],
  [/\bvery\s+(like|enjoy|love|hate|want)\b/gi, 'really $1', 'Dùng "really" thay vì "very" trước động từ.', 'Word choice'],
  [/\bmore\s+better\b/gi, 'better', '"better" đã là so sánh hơn, bỏ "more".', 'Grammar'],
  [/\bpeoples\b/gi, 'people', '"people" đã là số nhiều.', 'Grammar'],
  [/\binformations\b/gi, 'information', '"information" là danh từ không đếm được.', 'Grammar'],
  [/\badvices\b/gi, 'advice', '"advice" là danh từ không đếm được.', 'Grammar'],
  [/\bin\s+nowadays\b/gi, 'nowadays', 'Bỏ "in" trước "nowadays".', 'Preposition'],
  [/\bdiscuss\s+about\b/gi, 'discuss', '"discuss" không đi với "about".', 'Preposition'],
  [/\bcan\s+able\s+to\b/gi, 'able to', 'Chọn "can" HOẶC "be able to", không dùng cả hai.', 'Grammar'],
  [/\bagree\s+with\s+that\b/gi, 'agree that', 'Bỏ "with" trong "agree that".', 'Preposition'],
];

const LINKERS = ['however', 'moreover', 'furthermore', 'in addition', 'therefore', 'nevertheless', 'consequently', 'for instance', 'on the other hand', 'as a result'];

export function analyzeWriting(text, task = 'Task 2') {
  const clean = (text || '').trim();
  const words = clean ? clean.split(/\s+/) : [];
  const wordCount = words.length;
  const sentences = clean.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const paragraphs = clean.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  // Find corrections
  const issues = [];
  let corrected = text || '';
  for (const [re, rep, why, type] of RULES) {
    if (re.test(corrected)) {
      corrected = corrected.replace(re, rep);
      issues.push({ type, why });
      re.lastIndex = 0;
    }
  }

  // Sentence-level checks
  for (const s of sentences) {
    const sw = s.split(/\s+/);
    if (sw.length > 40) issues.push({ type: 'Coherence', why: `Câu quá dài (${sw.length} từ) — nên tách nhỏ để rõ ý.` });
    if (/^[a-z]/.test(s)) issues.push({ type: 'Capitalization', why: 'Câu nên bắt đầu bằng chữ hoa.' });
  }

  // Lexical resource
  const unique = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z']/g, '')));
  const lexicalDiversity = wordCount ? unique.size / wordCount : 0;
  const linkerCount = LINKERS.filter((l) => clean.toLowerCase().includes(l)).length;

  const target = task === 'Task 1' ? 150 : 250;

  // Simple band estimation (0-9) from measurable signals
  const scores = {
    taskResponse: clamp(band(wordCount / target) - issues.filter(i => i.type === 'Coherence').length * 0.1),
    coherence: clamp(4 + Math.min(paragraphs.length, 4) * 0.6 + Math.min(linkerCount, 5) * 0.25),
    lexical: clamp(4 + lexicalDiversity * 8),
    grammar: clamp(8 - issues.filter((i) => ['Grammar', 'Preposition', 'Spelling'].includes(i.type)).length * 0.6),
  };
  const overall = roundHalf((scores.taskResponse + scores.coherence + scores.lexical + scores.grammar) / 4);

  const suggestions = [];
  if (wordCount < target) suggestions.push(`Bài viết mới ${wordCount}/${target} từ — viết thêm để đủ độ dài yêu cầu.`);
  if (paragraphs.length < (task === 'Task 1' ? 3 : 4)) suggestions.push('Chia bài thành các đoạn rõ ràng (mở bài, thân bài, kết bài).');
  if (linkerCount < 3) suggestions.push('Dùng thêm từ nối (however, moreover, therefore…) để tăng mạch lạc.');
  if (lexicalDiversity < 0.45) suggestions.push('Đa dạng hoá từ vựng, tránh lặp lại một từ nhiều lần.');
  if (!issues.length) suggestions.push('Không phát hiện lỗi phổ biến — hãy nhờ AI chấm sâu hơn ở phần cấu hình.');

  return { wordCount, sentences: sentences.length, paragraphs: paragraphs.length,
    corrected, issues, suggestions, scores, overall, lexicalDiversity: +(lexicalDiversity * 100).toFixed(0), linkerCount };
}

function band(ratio) { return 4 + Math.min(ratio, 1.2) * 4; }
function clamp(n) { return Math.max(3, Math.min(9, +n.toFixed(1))); }
function roundHalf(n) { return Math.round(n * 2) / 2; }
