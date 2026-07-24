/* grammar.js — offline heuristic Writing scorer */

/* ── Error rules ─────────────────────────────────────────── */
export const RULES = [
  // Articles — only flag 'a' before words with a clearly vowel sound (exclude 'u' and 'eu' words)
  {
    id: 'art1',
    pattern: /\ba\s+(?=[aeiou])(?!ni|nit|niv|nif|ni[a-z]|[eE]u)/gi,
    message: 'Dùng "an" trước âm nguyên âm (an hour, an apple). Lưu ý: "a university", "a European" vẫn đúng vì bắt đầu bằng phụ âm /j/.',
    type: 'grammar',
  },
  // Subject-verb agreement (simple cases)
  {
    id: 'sv1',
    pattern: /\b(he|she|it)\s+(?:don't|dont)\b/gi,
    message: 'Dùng "doesn\'t" thay vì "don\'t" với he/she/it.',
    type: 'grammar',
  },
  // Double negatives
  {
    id: 'neg1',
    pattern: /\bcan'?t\s+not\b/gi,
    message: 'Phủ định kép: dùng "cannot" hoặc "can\'t", không kết hợp cả hai.',
    type: 'grammar',
  },
  // Their / there / they're
  {
    id: 'sp1',
    pattern: /\btheir\s+is\b/gi,
    message: '"Their is" không đúng — hãy dùng "There is".',
    type: 'spelling',
  },
  // Its vs it's
  {
    id: 'sp2',
    pattern: /\bits'\b/gi,
    message: '"Its\'" không đúng — hãy dùng "it\'s" (it is) hoặc "its" (sở hữu).',
    type: 'spelling',
  },
  // Comma splice (very simple check)
  {
    id: 'punc1',
    pattern: /[a-z],\s+[A-Z][a-z]{2,}/g,
    message: 'Câu ghép bằng dấu phẩy (comma splice) — dùng dấu chấm hoặc liên từ.',
    type: 'punctuation',
  },
  // Sentence starting with "Because" without main clause check (simplified)
  {
    id: 'sent1',
    pattern: /^Because\b/m,
    message: '"Because" bắt đầu câu — đảm bảo câu có mệnh đề chính.',
    type: 'grammar',
  },
  // Repetitive "very"
  {
    id: 'rep1',
    pattern: /\bvery\s+very\b/gi,
    message: 'Tránh lặp "very very" — dùng trạng từ mạnh hơn (extremely, incredibly…).',
    type: 'style',
  },
  // Preposition errors (common)
  {
    id: 'prep1',
    pattern: /\bdiscuss\s+about\b/gi,
    message: '"Discuss about" không đúng — "discuss" không cần "about".',
    type: 'grammar',
  },
  {
    id: 'prep2',
    pattern: /\bexplain\s+about\b/gi,
    message: '"Explain about" không đúng — "explain" không cần "about".',
    type: 'grammar',
  },
  // Informal contractions in formal writing
  {
    id: 'inf1',
    pattern: /\b(don't|doesn't|can't|won't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|I'm|you're|we're|they're|it's)\b/g,
    message: 'Contractions (I\'m, don\'t…) không phù hợp với văn viết học thuật — viết đầy đủ.',
    type: 'style',
  },
  // Sentence too long (>60 words)
  {
    id: 'sent2',
    fn: (text) => {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
      return sentences
        .filter(s => s.trim().split(/\s+/).length > 60)
        .map(s => ({ match: s.trim().slice(0, 60) + '…', message: 'Câu quá dài (>60 từ) — hãy chia thành các câu ngắn hơn.' }));
    },
    type: 'style',
  },
];

/* ── Band estimation (rough heuristic) ──────────────────── */
const BAND_VOCAB = [
  ['ubiquitous', 'consequently', 'furthermore', 'nonetheless', 'nevertheless',
   'paramount', 'substantiate', 'alleviate', 'proliferate', 'exacerbate',
   'mitigate', 'facilitate', 'manifest', 'phenomenon', 'substantial',
   'predominant', 'intrinsic', 'inevitable', 'detrimental', 'advocate'],
];

function countAdvancedVocab(text) {
  const lower = text.toLowerCase();
  return BAND_VOCAB[0].filter(w => lower.includes(w)).length;
}

function avgSentenceLength(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const total = sentences.reduce((s, c) => s + c.trim().split(/\s+/).length, 0);
  return total / sentences.length;
}

function paragraphCount(text) {
  return text.split(/\n\s*\n/).filter(p => p.trim()).length;
}

function coherenceScore(text) {
  const connectives = ['however', 'furthermore', 'moreover', 'in addition', 'consequently',
    'therefore', 'nevertheless', 'on the other hand', 'in contrast', 'as a result',
    'for example', 'for instance', 'in conclusion', 'to summarise', 'firstly', 'secondly', 'finally'];
  const lower = text.toLowerCase();
  return connectives.filter(c => lower.includes(c)).length;
}

export function estimateBand(text, taskType = 'task2') {
  const wc = text.trim().split(/\s+/).length;
  const minWords = taskType === 'task1' ? 150 : 250;
  let score = 5.0;

  // Task achievement / length
  if (wc >= minWords)       score += 0.5;
  if (wc >= minWords + 50)  score += 0.25;
  if (wc >= minWords + 100) score += 0.25;

  // Vocabulary
  const adv = countAdvancedVocab(text);
  if (adv >= 3)  score += 0.25;
  if (adv >= 6)  score += 0.25;
  if (adv >= 10) score += 0.5;

  // Sentence variety
  const asl = avgSentenceLength(text);
  if (asl > 15 && asl < 35) score += 0.25;

  // Coherence
  const coh = coherenceScore(text);
  if (coh >= 3) score += 0.25;
  if (coh >= 6) score += 0.25;

  // Paragraphs
  const pc = paragraphCount(text);
  if (pc >= 3) score += 0.25;

  // Penalise errors
  const { errors } = checkGrammar(text);
  const errCount = errors.filter(e => e.type !== 'style').length;
  if (errCount > 8)  score -= 0.5;
  else if (errCount > 4) score -= 0.25;

  return Math.min(9, Math.max(4, Math.round(score * 2) / 2));
}

/* ── Main checker ────────────────────────────────────────── */
export function checkGrammar(text) {
  const errors = [];

  for (const rule of RULES) {
    if (rule.fn) {
      // Custom function rule
      const matches = rule.fn(text);
      for (const m of matches) {
        errors.push({ id: rule.id, type: rule.type, match: m.match, message: m.message });
      }
    } else if (rule.pattern) {
      let m;
      const re = new RegExp(rule.pattern.source, rule.pattern.flags);
      while ((m = re.exec(text)) !== null) {
        errors.push({ id: rule.id, type: rule.type, match: m[0], message: rule.message });
        if (!re.global) break;
      }
    }
  }

  // Deduplicate by id+match
  const seen = new Set();
  const unique = errors.filter(e => {
    const k = e.id + '|' + e.match;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return { errors: unique };
}

/* ── Simple correction suggestions ──────────────────────── */
export function suggestCorrections(text) {
  const corrections = [
    { from: /\ba ([aeiou])/gi, to: 'an $1' },
    { from: /\b(he|she|it) don't\b/gi, to: '$1 doesn\'t' },
    { from: /\bdiscuss about\b/gi, to: 'discuss' },
    { from: /\bexplain about\b/gi, to: 'explain' },
    { from: /\btheir is\b/gi, to: 'There is' },
  ];

  let corrected = text;
  for (const c of corrections) {
    corrected = corrected.replace(c.from, c.to);
  }
  return corrected;
}
