// Skill views: Dashboard, Writing, Reading, Listening, Speaking, Mock test.
import { $, $$, html, esc, uid, fmtDate, toast, diffWords, modal } from '../utils.js';
import * as store from '../store.js';
import * as ai from '../ai.js';
import { analyzeWriting } from '../grammar.js';

const el = (h) => html(h);

// ---------- Dashboard ----------
export function Dashboard() {
  const s = store.get();
  const a = store.analytics();
  const wrap = el('<div></div>');
  wrap.append(el(`
    <div class="hero">
      <h1>Xin chào ${esc(s.profile.name)} 👋</h1>
      <p>Mục tiêu IELTS <strong>${s.profile.goal}</strong>${s.profile.targetDate ? ' · hạn ' + esc(s.profile.targetDate) : ''}. Luyện đều 4 kỹ năng, để AI chấm &amp; chữa, rồi cải thiện điểm yếu.</p>
    </div>`));

  const stats = el('<div class="grid cols-4"></div>');
  stats.append(
    statCard('Điểm ước tính', a.overall || '—', 'Trung bình các kỹ năng'),
    statCard('Lượt luyện', a.totalAttempts, 'Tổng số bài đã làm'),
    statCard('Điểm yếu nhất', a.weakest ? `${a.weakest.skill}` : '—', a.weakest ? `Band ${a.weakest.avg}` : 'Chưa có dữ liệu'),
    statCard('Từ vựng', s.vocab.length, 'Trong sổ tay'),
  );
  wrap.append(stats);

  // Skill bars
  const skillCard = el('<div class="card" style="margin-top:16px"><h3>Tiến độ theo kỹ năng</h3><div class="sub">Dựa trên band trung bình các lượt luyện</div></div>');
  a.skills.forEach((sk) => {
    skillCard.append(el(`
      <div style="margin:10px 0">
        <div class="row between"><span>${sk.skill}</span><span class="muted">${sk.count ? 'Band ' + sk.avg : 'chưa có'} · ${sk.count} lượt</span></div>
        <div class="bar"><i style="width:${(sk.avg / 9) * 100 || 0}%"></i></div>
      </div>`));
  });
  wrap.append(skillCard);

  // Weakness improvement plan
  const plan = el('<div class="card" style="margin-top:16px"><h3>Kế hoạch cải thiện điểm yếu 🎯</h3></div>');
  const tips = buildImprovementTips(a, s);
  const list = el('<div class="list"></div>');
  tips.forEach((t) => list.append(el(`<div class="item"><span>${t.icon}</span><div class="grow"><strong>${esc(t.title)}</strong><div class="muted">${esc(t.detail)}</div></div><button class="btn sm" data-go="${t.route}">Luyện ngay</button></div>`)));
  plan.append(list);
  wrap.append(plan);
  $$('[data-go]', plan).forEach((b) => b.onclick = () => location.hash = '#/' + b.dataset.go);

  // Recent attempts
  if (s.attempts.length) {
    const rec = el('<div class="card" style="margin-top:16px"><h3>Hoạt động gần đây</h3></div>');
    const rl = el('<div class="list"></div>');
    s.attempts.slice(0, 6).forEach((at) => rl.append(el(`<div class="item"><span class="tag">${esc(at.skill)}</span><div class="grow">${esc(at.meta.title || '')}</div><span class="pill ${at.band >= s.profile.goal ? 'good' : 'warn'}">Band ${at.band}</span><span class="muted">${fmtDate(at.ts)}</span></div>`)));
    rec.append(rl); wrap.append(rec);
  }
  return wrap;
}

function statCard(label, n, sub) {
  return el(`<div class="card stat"><span class="n">${esc(String(n))}</span><span class="l">${esc(label)}</span><span class="muted" style="font-size:12px">${esc(sub)}</span></div>`);
}

function buildImprovementTips(a, s) {
  const tips = [];
  if (a.weakest) tips.push({ icon: '🔧', title: `Ưu tiên: ${a.weakest.skill}`, detail: `Đây là kỹ năng yếu nhất (band ${a.weakest.avg}). Luyện thêm để kéo điểm tổng.`, route: a.weakest.skill.toLowerCase() });
  const topErr = Object.entries(a.errorTypes).sort((x, y) => y[1] - x[1])[0];
  if (topErr) tips.push({ icon: '⚠️', title: `Lỗi hay gặp: ${topErr[0]}`, detail: `Bạn mắc ${topErr[1]} lỗi loại này. Xem lại trong mục Lỗi hay gặp.`, route: 'mistakes' });
  if (s.vocab.length < 20) tips.push({ icon: '📖', title: 'Mở rộng từ vựng', detail: 'Thêm & ôn từ vựng mỗi ngày để tăng Lexical Resource.', route: 'vocab' });
  if (!a.totalAttempts) tips.push({ icon: '🚀', title: 'Bắt đầu luyện Writing', detail: 'Viết bài đầu tiên và để AI chấm để có dữ liệu cải thiện.', route: 'writing' });
  tips.push({ icon: '🧪', title: 'Thi thử IELTS', detail: 'Làm bài thi thử có tính giờ để đo trình độ thực tế.', route: 'mock' });
  return tips;
}

// ---------- Writing ----------
export function Writing() {
  const s = store.get();
  const wrap = el('<div></div>');
  const prompt = s.writingPrompts[0];
  let current = prompt;

  const picker = el('<div class="row" style="margin-bottom:12px"></div>');
  const sel = el('<select style="max-width:420px"></select>');
  s.writingPrompts.forEach((p) => sel.append(el(`<option value="${p.id}">[${esc(p.type)}] ${esc(p.title)}</option>`)));
  picker.append(sel, el('<span class="spacer"></span>'), el('<button class="btn ghost sm" id="addPrompt">＋ Đề của tôi</button>'));

  const promptBox = el(`<div class="card"><div class="row between"><span class="tag" id="pType">${esc(current.type)}</span></div><p id="pText" style="margin:8px 0 0">${esc(current.prompt)}</p></div>`);
  const editor = el('<textarea id="essay" placeholder="Viết bài của bạn ở đây… (tiếng Anh)" style="min-height:240px;margin-top:12px"></textarea>');
  const bar = el('<div class="row" style="margin-top:10px"><span class="muted" id="wc">0 từ</span><span class="spacer"></span><button class="btn ghost" id="checkBtn">⚡ Chấm nhanh (offline)</button><button class="btn" id="aiBtn">🤖 Chấm bằng AI</button></div>');
  const result = el('<div id="wresult" style="margin-top:16px"></div>');

  wrap.append(el('<div class="section-title"><h2>✍️ Writing — Viết</h2></div>'), picker, promptBox, editor, bar, result);

  sel.onchange = () => { current = s.writingPrompts.find((p) => p.id === sel.value); $('#pType', promptBox).textContent = current.type; $('#pText', promptBox).textContent = current.prompt; };
  editor.oninput = () => { const n = editor.value.trim() ? editor.value.trim().split(/\s+/).length : 0; $('#wc', bar).textContent = n + ' từ'; };
  $('#addPrompt', picker).onclick = () => addWritingPrompt(() => location.hash = location.hash);

  $('#checkBtn', bar).onclick = () => {
    const res = analyzeWriting(editor.value, current.type);
    renderWritingResult(result, res, editor.value);
    store.logAttempt('Writing', res.overall, { title: current.title, mode: 'offline' });
  };
  $('#aiBtn', bar).onclick = async () => {
    if (!editor.value.trim()) return toast('Hãy viết bài trước.', 'error');
    const btn = $('#aiBtn', bar); btn.disabled = true; btn.textContent = '⏳ Đang chấm…';
    try {
      const out = await ai.gradeWriting(current.type, current.prompt, editor.value);
      result.innerHTML = '';
      result.append(el(`<div class="card"><h3>🤖 Nhận xét từ ${esc(ai.PROVIDERS[ai.currentProvider()].label)}</h3><div style="white-space:pre-wrap">${esc(out)}</div></div>`));
      const band = (out.match(/overall[^0-9]*([0-9](?:\.5)?)/i) || [])[1];
      store.logAttempt('Writing', band ? +band : 6, { title: current.title, mode: 'ai' });
    } catch (e) { toast(e.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = '🤖 Chấm bằng AI'; }
  };
  return wrap;
}

function renderWritingResult(root, res, original) {
  root.innerHTML = '';
  const scoreCard = el(`<div class="card"><div class="row between"><h3>Kết quả ước tính</h3><span class="pill good" style="font-size:16px">Overall ${res.overall}</span></div></div>`);
  const grid = el('<div class="grid cols-4" style="margin-top:10px"></div>');
  grid.append(
    miniScore('Task', res.scores.taskResponse), miniScore('Coherence', res.scores.coherence),
    miniScore('Lexical', res.scores.lexical), miniScore('Grammar', res.scores.grammar));
  scoreCard.append(grid);
  scoreCard.append(el(`<div class="row" style="margin-top:12px"><span class="pill">${res.wordCount} từ</span><span class="pill">${res.paragraphs} đoạn</span><span class="pill">${res.linkerCount} từ nối</span><span class="pill">Đa dạng từ ${res.lexicalDiversity}%</span></div>`));

  const sug = el('<div class="card" style="margin-top:14px"><h3>💡 Gợi ý cải thiện</h3></div>');
  const ul = el('<ul></ul>'); res.suggestions.forEach((x) => ul.append(el(`<li>${esc(x)}</li>`))); sug.append(ul);

  const iss = el('<div class="card" style="margin-top:14px"><h3>🔎 Lỗi phát hiện</h3></div>');
  if (res.issues.length) {
    const il = el('<div class="list"></div>');
    res.issues.forEach((i) => il.append(el(`<div class="item"><span class="tag">${esc(i.type)}</span><div class="grow">${esc(i.why)}</div><button class="btn ghost sm" data-savem>Lưu lỗi</button></div>`)));
    iss.append(il);
    $$('[data-savem]', il).forEach((b, idx) => b.onclick = () => { store.addTo('mistakes', { id: uid(), wrong: '', correct: '', type: res.issues[idx].type, note: res.issues[idx].why }); toast('Đã lưu vào Lỗi hay gặp', 'success'); });
  } else iss.append(el('<p class="muted">Không phát hiện lỗi phổ biến.</p>'));

  const corr = el('<div class="card diff" style="margin-top:14px"><h3>✅ Bản sửa đề xuất</h3></div>');
  const corrP = el('<p></p>');
  corrP.appendChild(diffWords(original, res.corrected));
  corr.appendChild(corrP);

  root.append(scoreCard, sug, iss, corr);
}

const miniScore = (l, v) => el(`<div class="card stat" style="padding:12px"><span class="n" style="font-size:22px">${v}</span><span class="l">${esc(l)}</span></div>`);

function addWritingPrompt(after) {
  const form = el(`<div>
    <label class="field"><span>Loại</span><select id="pt"><option>Task 2</option><option>Task 1</option><option>Khác</option></select></label>
    <label class="field"><span>Tiêu đề</span><input id="ptt" placeholder="VD: Environment"></label>
    <label class="field"><span>Đề bài</span><textarea id="ptx"></textarea></label>
    <button class="btn" id="save">Lưu đề</button></div>`);
  const m = modal('Thêm đề Writing', form);
  $('#save', form).onclick = () => { store.addTo('writingPrompts', { id: uid(), type: $('#pt', form).value, title: $('#ptt', form).value || 'Đề mới', prompt: $('#ptx', form).value }); m.close(); toast('Đã thêm đề', 'success'); after(); };
}

// ---------- Reading ----------
export function Reading() {
  const s = store.get();
  const wrap = el('<div></div>');
  wrap.append(el('<div class="section-title"><h2>📖 Reading — Đọc</h2></div>'));
  const p = s.readingPassages[0];
  if (!p) { wrap.append(el('<div class="empty">Chưa có bài đọc. Thêm ở mục Tài liệu/Nội dung.</div>')); return wrap; }
  wrap.append(el(`<div class="card"><div class="row between"><h3>${esc(p.title)}</h3><span class="tag">${esc(p.level)}</span></div><p style="white-space:pre-wrap">${esc(p.text)}</p></div>`));
  const qc = el('<div style="margin-top:14px"></div>');
  renderQuiz(qc, p.questions, 'Reading', p.title);
  wrap.append(qc);
  return wrap;
}

// ---------- Listening ----------
export function Listening() {
  const s = store.get();
  const wrap = el('<div></div>');
  wrap.append(el('<div class="section-title"><h2>🎧 Listening — Nghe</h2></div>'));
  const it = s.listeningItems[0];
  if (!it) { wrap.append(el('<div class="empty">Chưa có bài nghe.</div>')); return wrap; }
  const card = el(`<div class="card"><div class="row between"><h3>${esc(it.title)}</h3><span class="tag">${esc(it.level)}</span></div>
    <div class="row"><button class="btn" id="play">▶️ Nghe</button><button class="btn ghost" id="stop">⏹ Dừng</button><label class="row" style="gap:6px"><span class="muted">Tốc độ</span><input type="range" id="rate" min="0.6" max="1.2" step="0.1" value="0.95" style="width:120px"></label></div>
    <details style="margin-top:10px"><summary class="muted">Xem transcript (sau khi nghe)</summary><p style="white-space:pre-wrap">${esc(it.transcript)}</p></details></div>`);
  wrap.append(card);
  const speak = () => { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(it.transcript); u.lang = 'en-US'; u.rate = +$('#rate', card).value; window.speechSynthesis.speak(u); };
  $('#play', card).onclick = speak;
  $('#stop', card).onclick = () => window.speechSynthesis.cancel();
  const qc = el('<div style="margin-top:14px"></div>');
  renderQuiz(qc, it.questions, 'Listening', it.title);
  wrap.append(qc);
  return wrap;
}

function renderQuiz(root, questions, skill, title) {
  const form = el('<div></div>');
  questions.forEach((q, qi) => {
    const box = el(`<div class="qa"><div class="q">${qi + 1}. ${esc(q.q)}</div></div>`);
    const opts = el('<div class="options"></div>');
    q.options.forEach((o, oi) => opts.append(el(`<label><input type="radio" name="q${qi}" value="${oi}"><span>${esc(o)}</span></label>`)));
    box.append(opts); form.append(box);
  });
  const submit = el('<button class="btn" style="margin-top:8px">Nộp bài</button>');
  const out = el('<div style="margin-top:12px"></div>');
  submit.onclick = () => {
    let correct = 0;
    questions.forEach((q, qi) => {
      const chosen = form.querySelector(`input[name="q${qi}"]:checked`);
      const labels = $$(`input[name="q${qi}"]`, form).map((i) => i.parentElement);
      labels[q.answer].classList.add('correct');
      if (chosen) { const v = +chosen.value; if (v === q.answer) correct++; else labels[v].classList.add('wrong'); }
    });
    const band = +(Math.min(9, 3 + (correct / questions.length) * 6)).toFixed(1);
    out.innerHTML = '';
    out.append(el(`<div class="card"><div class="row between"><h3>Đúng ${correct}/${questions.length}</h3><span class="pill good">Band ~${band}</span></div></div>`));
    store.logAttempt(skill, band, { title });
  };
  root.append(form, submit, out);
}

// ---------- Speaking ----------
export function Speaking() {
  const s = store.get();
  const wrap = el('<div></div>');
  wrap.append(el('<div class="section-title"><h2>🗣️ Speaking — Nói</h2></div>'));
  const sel = el('<select style="max-width:520px;margin-bottom:12px"></select>');
  s.speakingPrompts.forEach((p) => sel.append(el(`<option value="${p.id}">[${esc(p.part)}] ${esc(p.prompt.slice(0, 60))}…</option>`)));
  let current = s.speakingPrompts[0];
  const card = el(`<div class="card"><span class="tag" id="spart">${esc(current.part)}</span><p id="sprompt" style="margin:8px 0 0">${esc(current.prompt)}</p>
    <div class="row" style="margin-top:10px"><button class="btn ghost" id="listen">🔊 Nghe đề</button><button class="btn" id="rec">🎙️ Bắt đầu nói</button><button class="btn danger" id="stop" disabled>⏹ Dừng</button></div></div>`);
  const transcriptBox = el('<div class="card" style="margin-top:12px"><h3>Bản ghi lời nói</h3><p id="tr" class="muted">Nhấn “Bắt đầu nói” và cho phép micro. Trình duyệt sẽ nhận diện giọng nói (Chrome/Edge).</p></div>');
  const fb = el('<div style="margin-top:12px"></div>');
  wrap.append(sel, card, transcriptBox, fb);

  sel.onchange = () => { current = s.speakingPrompts.find((p) => p.id === sel.value); $('#spart', card).textContent = current.part; $('#sprompt', card).textContent = current.prompt; };
  $('#listen', card).onclick = () => { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(current.prompt); u.lang = 'en-US'; window.speechSynthesis.speak(u); };

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec, finalText = '';
  $('#rec', card).onclick = () => {
    if (!SR) return toast('Trình duyệt không hỗ trợ nhận diện giọng nói. Hãy dùng Chrome/Edge.', 'error');
    rec = new SR(); rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = true; finalText = '';
    rec.onresult = (e) => { let interim = ''; for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) finalText += t + ' '; else interim += t; } $('#tr', transcriptBox).textContent = finalText + interim; };
    rec.onend = () => { $('#rec', card).disabled = false; $('#stop', card).disabled = true; if (finalText.trim()) analyzeSpeaking(fb, finalText.trim(), current); };
    rec.start(); $('#rec', card).disabled = true; $('#stop', card).disabled = false;
  };
  $('#stop', card).onclick = () => rec && rec.stop();
  return wrap;
}

function analyzeSpeaking(root, text, prompt) {
  const words = text.split(/\s+/).filter(Boolean);
  const fillers = (text.match(/\b(um+|uh+|like|you know)\b/gi) || []).length;
  const unique = new Set(words.map((w) => w.toLowerCase())).size;
  const band = +(Math.min(9, 4 + Math.min(words.length, 120) / 40 + (unique / Math.max(words.length, 1)) * 2 - fillers * 0.2)).toFixed(1);
  root.innerHTML = '';
  const card = el(`<div class="card"><div class="row between"><h3>Phản hồi Speaking</h3><span class="pill good">Band ~${band}</span></div>
    <div class="row" style="margin-top:8px"><span class="pill">${words.length} từ</span><span class="pill">${unique} từ khác nhau</span><span class="pill ${fillers > 3 ? 'warn' : ''}">${fillers} từ đệm</span></div>
    <p class="muted" style="margin-top:10px">${fillers > 3 ? 'Giảm từ đệm (um, uh, like) để nói trôi chảy hơn. ' : ''}${words.length < 40 ? 'Nói dài hơn, phát triển ý với ví dụ. ' : 'Độ dài tốt. '}Muốn nhận xét sâu về ngữ pháp &amp; phát âm, hãy dùng nút AI bên dưới.</p>
    <button class="btn" id="aisp" style="margin-top:8px">🤖 Nhờ AI nhận xét</button></div>`);
  root.append(card);
  store.logAttempt('Speaking', band, { title: prompt.part });
  $('#aisp', card).onclick = async () => {
    const b = $('#aisp', card); b.disabled = true; b.textContent = '⏳…';
    try { const out = await ai.chat('You are an IELTS speaking examiner. Give band scores (Fluency, Lexical, Grammar, Pronunciation note from text), corrections and tips in Vietnamese.', `Question: ${prompt.prompt}\nMy answer (speech-to-text): ${text}`); root.append(el(`<div class="card" style="margin-top:12px"><div style="white-space:pre-wrap">${esc(out)}</div></div>`)); }
    catch (e) { toast(e.message, 'error'); } finally { b.disabled = false; b.textContent = '🤖 Nhờ AI nhận xét'; }
  };
}

// ---------- Mock test (YouPass-style) ----------
export function Mock() {
  const s = store.get();
  const wrap = el('<div></div>');
  wrap.append(el('<div class="section-title"><h2>🧪 Thi thử IELTS</h2></div>'));
  wrap.append(el('<p class="muted">Giao diện thi có tính giờ, mô phỏng phòng thi. Chọn phần thi để bắt đầu.</p>'));
  const grid = el('<div class="grid cols-3"></div>');
  const tests = [
    { key: 'reading', label: '📖 Reading', mins: 20, get: () => s.readingPassages[0] },
    { key: 'listening', label: '🎧 Listening', mins: 10, get: () => s.listeningItems[0] },
    { key: 'writing', label: '✍️ Writing', mins: 40, get: () => s.writingPrompts[0] },
  ];
  tests.forEach((t) => {
    const c = el(`<div class="card"><h3>${t.label}</h3><div class="sub">${t.mins} phút</div><button class="btn">Bắt đầu</button></div>`);
    c.querySelector('button').onclick = () => startMock(wrap, t);
    grid.append(c);
  });
  wrap.append(grid);
  return wrap;
}

function startMock(wrap, t) {
  const s = store.get();
  const item = t.get();
  const panel = el('<div class="card" style="margin-top:16px"></div>');
  const timerBox = el(`<div class="row between"><h3>${t.label}</h3><span class="timer" id="tm">${String(t.mins).padStart(2, '0')}:00</span></div>`);
  panel.append(timerBox);
  const body = el('<div style="margin-top:12px"></div>');
  panel.append(body);

  if (t.key === 'reading') { body.append(el(`<div class="card"><p style="white-space:pre-wrap">${esc(item.text)}</p></div>`)); const qc = el('<div></div>'); renderQuiz(qc, item.questions, 'Reading', item.title + ' (mock)'); body.append(qc); }
  else if (t.key === 'listening') { body.append(el(`<button class="btn" id="p">▶️ Nghe</button>`)); body.querySelector('#p').onclick = () => { const u = new SpeechSynthesisUtterance(item.transcript); u.lang = 'en-US'; speechSynthesis.speak(u); }; const qc = el('<div style="margin-top:10px"></div>'); renderQuiz(qc, item.questions, 'Listening', item.title + ' (mock)'); body.append(qc); }
  else { body.append(el(`<div class="card"><p>${esc(item.prompt)}</p></div>`), el('<textarea id="me" style="min-height:220px" placeholder="Viết bài…"></textarea>')); const sub = el('<button class="btn" style="margin-top:8px">Nộp &amp; chấm</button>'); const out = el('<div style="margin-top:12px"></div>'); sub.onclick = () => { const res = analyzeWriting(body.querySelector('#me').value, item.type); renderWritingResult(out, res, body.querySelector('#me').value); store.logAttempt('Writing', res.overall, { title: item.title + ' (mock)' }); }; body.append(sub, out); }

  wrap.append(panel);
  panel.scrollIntoView({ behavior: 'smooth' });
  let left = t.mins * 60;
  const iv = setInterval(() => {
    left--; const mm = String(Math.floor(left / 60)).padStart(2, '0'); const ss = String(left % 60).padStart(2, '0');
    const tm = $('#tm', panel); if (!document.body.contains(panel)) return clearInterval(iv);
    if (tm) tm.textContent = `${mm}:${ss}`;
    if (left <= 0) { clearInterval(iv); toast('Hết giờ!', 'error'); }
  }, 1000);
}

export const SkillViews = { Dashboard, Writing, Reading, Listening, Speaking, Mock };
