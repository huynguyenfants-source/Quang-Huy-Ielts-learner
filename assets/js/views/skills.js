/* views/skills.js — Dashboard, Writing, Reading, Listening, Speaking, Mock */
import { el, toast, openModal, closeModal, fmtDate, fmtTime, diffHtml, uuid, confirm } from '../utils.js';
import { getSettings, getBandHistory, addBandRecord, getWritingSessions, addWritingSession, addMistake } from '../store.js';
import { WRITING_TASKS, READING_PASSAGES, LISTENING_TRACKS, SPEAKING_TOPICS } from '../content.js';
import { checkGrammar, estimateBand, suggestCorrections } from '../grammar.js';
import { scoreWriting, scoreSpeaking } from '../ai.js';

/* ============================================================
   DASHBOARD
   ============================================================ */
export function renderDashboard(container) {
  const settings = getSettings();
  const history = getBandHistory();
  const sessions = getWritingSessions();

  const bandBySkill = { writing: [], reading: [], listening: [], speaking: [] };
  for (const r of history) {
    if (bandBySkill[r.skill]) bandBySkill[r.skill].push(r.band);
  }
  const avg = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '—';

  const skills = [
    { id: 'writing',   label: 'Writing',   icon: '✍️' },
    { id: 'reading',   label: 'Reading',   icon: '📖' },
    { id: 'listening', label: 'Listening', icon: '🎧' },
    { id: 'speaking',  label: 'Speaking',  icon: '🎤' },
  ];

  container.innerHTML = '';
  container.append(
    el('h1', {}, `Xin chào, ${settings.name || 'Quang Huy'}! 👋`),
    el('p', { class: 'muted' }, `Mục tiêu: Band ${settings.targetBand || 7.0} · Hôm nay: ${new Date().toLocaleDateString('vi-VN')}`),
  );

  // Band cards
  const grid = el('div', { class: 'grid-4', style: 'margin-top:1rem' });
  for (const sk of skills) {
    const bandVal = avg(bandBySkill[sk.id]);
    grid.append(
      el('div', { class: 'card stat-block' },
        el('div', { style: 'font-size:2rem' }, sk.icon),
        el('div', { class: 'stat-value', style: 'margin-top:.4rem' }, bandVal),
        el('div', { class: 'stat-label' }, sk.label),
      )
    );
  }
  container.append(grid);

  // Recent writing sessions
  if (sessions.length) {
    const sec = el('div', { style: 'margin-top:1.5rem' });
    sec.append(el('h2', {}, '📝 Bài viết gần đây'));
    const list = el('div', { class: 'flex-col', style: 'margin-top:.75rem' });
    for (const s of sessions.slice(0, 5)) {
      list.append(
        el('div', { class: 'card', style: 'padding:.75rem 1rem' },
          el('div', { style: 'display:flex;justify-content:space-between;align-items:center' },
            el('span', { style: 'font-weight:600' }, s.taskTitle || 'Bài viết'),
            el('div', { style: 'display:flex;gap:.5rem;align-items:center' },
              el('span', { class: 'tag' }, `Band ${s.band || '?'}`),
              el('span', { class: 'muted small' }, fmtDate(s.date)),
            ),
          ),
          el('p', { class: 'muted small', style: 'margin-top:.25rem' }, `${s.wordCount || 0} từ`),
        )
      );
    }
    sec.append(list);
    container.append(sec);
  }

  // Tips
  const tips = [
    '💡 Hãy luyện Writing mỗi ngày ít nhất 1 bài để cải thiện band.',
    '🎯 Đọc thêm báo tiếng Anh (BBC, Guardian) để làm giàu từ vựng.',
    '🎧 Nghe podcast IELTS 20 phút mỗi ngày.',
    '🗣️ Ghi âm phần Speaking và tự nghe lại để phát hiện lỗi phát âm.',
  ];
  const tip = el('div', { class: 'card', style: 'margin-top:1.5rem;background:var(--clr-primary);color:#fff' });
  tip.append(
    el('div', { class: 'card-title', style: 'color:#fff' }, 'Mẹo hôm nay'),
    el('p', {}, tips[new Date().getDay() % tips.length]),
  );
  container.append(tip);
}

/* ============================================================
   WRITING
   ============================================================ */
export function renderWriting(container) {
  container.innerHTML = '';
  let selectedTask = WRITING_TASKS[0];
  let feedback = null;

  function buildUI() {
    container.innerHTML = '';
    container.append(el('h1', {}, '✍️ Writing'));

    // Task selector
    const taskSel = el('select', { style: 'margin-bottom:1rem;max-width:400px' });
    for (const t of WRITING_TASKS) {
      const opt = el('option', { value: t.id }, `[${t.type.toUpperCase()}] ${t.title}`);
      if (t.id === selectedTask.id) opt.selected = true;
      taskSel.append(opt);
    }
    taskSel.addEventListener('change', () => {
      selectedTask = WRITING_TASKS.find(t => t.id === taskSel.value) || WRITING_TASKS[0];
      buildUI();
    });
    container.append(taskSel);

    // Prompt card
    const promptCard = el('div', { class: 'card', style: 'margin-bottom:1rem' });
    promptCard.append(
      el('div', { class: 'card-title' }, `📋 ${selectedTask.title}`),
      el('p', { style: 'white-space:pre-line;font-size:.9rem' }, selectedTask.prompt),
    );
    container.append(promptCard);

    // Textarea
    const essayArea = el('textarea', { placeholder: 'Viết bài của bạn ở đây…', style: 'min-height:260px;margin-bottom:.75rem' });
    const wordCountEl = el('span', { class: 'muted small' }, '0 từ');
    essayArea.addEventListener('input', () => {
      const wc = essayArea.value.trim().split(/\s+/).filter(Boolean).length;
      wordCountEl.textContent = `${wc} từ`;
    });
    container.append(essayArea);
    container.append(el('div', { style: 'margin-bottom:.75rem' }, wordCountEl));

    // Buttons
    const btnRow = el('div', { class: 'flex', style: 'flex-wrap:wrap;gap:.5rem;margin-bottom:1rem' });
    const btnOffline = el('button', { class: 'btn' }, '🔍 Chấm offline');
    const btnAI = el('button', { class: 'btn success' }, '🤖 Chấm bằng AI');
    const btnClear = el('button', { class: 'btn secondary' }, '🗑️ Xoá');

    btnOffline.addEventListener('click', () => {
      const text = essayArea.value.trim();
      if (!text) { toast('Vui lòng viết bài trước', 'error'); return; }
      const { errors } = checkGrammar(text);
      const band = estimateBand(text, selectedTask.type);
      const corrected = suggestCorrections(text);
      feedback = { band, errors, corrected, source: 'offline' };
      renderFeedback(feedbackEl, feedback, text);
    });

    btnAI.addEventListener('click', async () => {
      const text = essayArea.value.trim();
      if (!text) { toast('Vui lòng viết bài trước', 'error'); return; }
      btnAI.disabled = true;
      btnAI.textContent = '⏳ Đang chấm…';
      try {
        const result = await scoreWriting(text, selectedTask.type, selectedTask.prompt);
        feedback = { ...result, source: 'ai' };
        renderFeedback(feedbackEl, feedback, text);
        addWritingSession({
          id: uuid(), date: new Date().toISOString(),
          taskTitle: selectedTask.title, wordCount: text.trim().split(/\s+/).length,
          band: result.band, source: 'ai',
        });
        if (result.band) addBandRecord({ skill: 'writing', band: result.band, date: new Date().toISOString() });
      } catch (e) {
        toast(e.message, 'error', 5000);
      } finally {
        btnAI.disabled = false;
        btnAI.textContent = '🤖 Chấm bằng AI';
      }
    });

    btnClear.addEventListener('click', () => {
      if (essayArea.value) {
        confirm('Xoá bài viết?', () => { essayArea.value = ''; feedbackEl.innerHTML = ''; wordCountEl.textContent = '0 từ'; });
      }
    });

    btnRow.append(btnOffline, btnAI, btnClear);
    container.append(btnRow);

    const feedbackEl = el('div');
    container.append(feedbackEl);

    if (feedback) renderFeedback(feedbackEl, feedback, essayArea.value);
  }

  function renderFeedback(el2, fb, originalText) {
    el2.innerHTML = '';
    const card = el('div', { class: 'card', style: 'margin-top:.5rem' });
    card.append(el('div', { class: 'card-title' }, `📊 Kết quả chấm (${fb.source === 'ai' ? 'AI' : 'Offline'})`));

    if (fb.band != null) {
      const bandRow = el('div', { style: 'display:flex;gap:1rem;align-items:center;margin-bottom:.75rem' });
      bandRow.append(
        el('div', { class: 'band-badge', style: 'width:3.5rem;height:3.5rem;font-size:1.25rem;line-height:3.5rem' }, String(fb.band)),
        el('div', {},
          el('strong', {}, `Ước tính Band ${fb.band}`),
          el('p', { class: 'muted small' }, 'Dựa trên phân tích văn phong, từ vựng và ngữ pháp.'),
        )
      );
      card.append(bandRow);
    }

    if (fb.feedback) {
      const p = el('p', { style: 'margin-bottom:.75rem;font-size:.9rem' });
      p.textContent = fb.feedback;
      card.append(p);
    }

    if (fb.errors?.length) {
      card.append(el('h3', { style: 'margin-bottom:.5rem' }, `⚠️ Lỗi phát hiện (${fb.errors.length})`));
      const errList = el('div', { class: 'flex-col' });
      for (const e of fb.errors.slice(0, 15)) {
        const item = el('div', { class: 'mistake-item' },
          el('strong', {}, e.match),
          ` — ${e.message}`,
        );
        errList.append(item);
      }
      card.append(errList);
    }

    if (fb.corrected || fb.corrections) {
      const corr = fb.corrected || fb.corrections;
      card.append(el('h3', { style: 'margin:.75rem 0 .5rem' }, '📝 Bản sửa'));
      const diffDiv = el('div', { class: 'feedback-panel' });
      diffDiv.innerHTML = diffHtml(originalText, corr);
      card.append(diffDiv);
    }

    if (fb.tips?.length) {
      card.append(el('h3', { style: 'margin:.75rem 0 .5rem' }, '💡 Gợi ý cải thiện'));
      const tipList = el('ul', { style: 'padding-left:1.25rem;font-size:.875rem' });
      for (const t of fb.tips) tipList.append(el('li', {}, t));
      card.append(tipList);
    }

    el2.append(card);
  }

  buildUI();
}

/* ============================================================
   READING
   ============================================================ */
export function renderReading(container) {
  container.innerHTML = '';
  let selected = READING_PASSAGES[0];
  let answers = {};
  let submitted = false;

  function build() {
    container.innerHTML = '';
    container.append(el('h1', {}, '📖 Reading'));

    const sel = el('select', { style: 'margin-bottom:1rem;max-width:360px' });
    for (const p of READING_PASSAGES) {
      const opt = el('option', { value: p.id }, p.title);
      if (p.id === selected.id) opt.selected = true;
      sel.append(opt);
    }
    sel.addEventListener('change', () => {
      selected = READING_PASSAGES.find(p => p.id === sel.value) || READING_PASSAGES[0];
      answers = {}; submitted = false; build();
    });
    container.append(sel);

    const layout = el('div', { class: 'flex', style: 'gap:1.5rem;align-items:flex-start' });

    // Passage
    const passageCard = el('div', { class: 'card', style: 'flex:1.2' });
    passageCard.append(
      el('div', { class: 'card-title' }, selected.title),
      el('div', { class: 'passage' }, selected.text),
    );

    // Questions
    const qCard = el('div', { class: 'card', style: 'flex:1' });
    qCard.append(el('div', { class: 'card-title' }, 'Câu hỏi'));

    for (const q of selected.questions) {
      const qEl = el('div', { class: 'question-item' });
      qEl.append(el('p', { class: 'question-text' }, q.text));
      const opts = el('div', { class: 'options' });
      q.options.forEach((opt, i) => {
        const lbl = el('label', { class: 'option-label' });
        const inp = el('input', { type: 'radio', name: q.id, value: String(i) });
        inp.addEventListener('change', () => { answers[q.id] = i; });
        if (submitted) {
          if (i === q.answer) lbl.classList.add('correct');
          else if (answers[q.id] === i) lbl.classList.add('wrong');
        }
        inp.disabled = submitted;
        if (submitted && answers[q.id] === i) inp.checked = true;
        lbl.append(inp, ` ${String.fromCharCode(65 + i)}. ${opt}`);
        opts.append(lbl);
      });
      qEl.append(opts);
      qCard.append(qEl);
    }

    if (!submitted) {
      const submitBtn = el('button', { class: 'btn', style: 'margin-top:.5rem' }, 'Nộp bài');
      submitBtn.addEventListener('click', () => {
        const answered = Object.keys(answers).length;
        if (answered < selected.questions.length) {
          toast(`Bạn còn ${selected.questions.length - answered} câu chưa trả lời`, 'error');
          return;
        }
        submitted = true;
        const correct = selected.questions.filter(q => answers[q.id] === q.answer).length;
        const score = correct / selected.questions.length;
        const band = score >= 0.9 ? 8 : score >= 0.7 ? 7 : score >= 0.5 ? 6 : score >= 0.3 ? 5 : 4;
        addBandRecord({ skill: 'reading', band, date: new Date().toISOString() });
        build();
        toast(`${correct}/${selected.questions.length} câu đúng · ≈ Band ${band}`, 'success');
      });
      qCard.append(submitBtn);
    } else {
      const correct = selected.questions.filter(q => answers[q.id] === q.answer).length;
      const resEl = el('div', { class: 'tag green', style: 'margin-top:.5rem;font-size:.9rem' },
        `✅ ${correct}/${selected.questions.length} câu đúng`);
      const retry = el('button', { class: 'btn secondary sm', style: 'margin-left:.5rem' }, 'Làm lại');
      retry.addEventListener('click', () => { answers = {}; submitted = false; build(); });
      qCard.append(el('div', { style: 'margin-top:.5rem' }, resEl, retry));
    }

    layout.append(passageCard, qCard);
    container.append(layout);
  }

  build();
}

/* ============================================================
   LISTENING
   ============================================================ */
export function renderListening(container) {
  container.innerHTML = '';
  let selected = LISTENING_TRACKS[0];
  let answers = {};
  let submitted = false;
  let speaking = false;

  function build() {
    container.innerHTML = '';
    container.append(el('h1', {}, '🎧 Listening'));

    const sel = el('select', { style: 'margin-bottom:1rem;max-width:360px' });
    for (const t of LISTENING_TRACKS) {
      const opt = el('option', { value: t.id }, t.title);
      if (t.id === selected.id) opt.selected = true;
      sel.append(opt);
    }
    sel.addEventListener('change', () => {
      selected = LISTENING_TRACKS.find(t => t.id === sel.value) || LISTENING_TRACKS[0];
      answers = {}; submitted = false; build();
    });
    container.append(sel);

    const card = el('div', { class: 'card' });
    card.append(el('div', { class: 'card-title' }, `🎧 ${selected.title}`));

    // TTS controls
    const ttsRow = el('div', { style: 'display:flex;gap:.5rem;margin-bottom:1rem;flex-wrap:wrap' });
    const playBtn = el('button', { class: 'btn' }, '▶️ Phát đoạn audio');
    const stopBtn = el('button', { class: 'btn secondary' }, '⏹ Dừng');

    let utterance = null;
    playBtn.addEventListener('click', () => {
      if (speaking) return;
      utterance = new SpeechSynthesisUtterance(selected.script);
      utterance.lang = 'en-GB';
      utterance.rate = 0.9;
      utterance.onend = () => { speaking = false; playBtn.disabled = false; };
      speechSynthesis.speak(utterance);
      speaking = true;
      playBtn.disabled = true;
    });
    stopBtn.addEventListener('click', () => {
      speechSynthesis.cancel();
      speaking = false;
      playBtn.disabled = false;
    });
    ttsRow.append(playBtn, stopBtn);
    if (!('speechSynthesis' in window)) {
      ttsRow.append(el('span', { class: 'muted small' }, '⚠️ Trình duyệt không hỗ trợ Text-to-Speech'));
    }
    card.append(ttsRow);

    // Questions
    card.append(el('h3', { style: 'margin-bottom:.75rem' }, 'Câu hỏi'));
    for (const q of selected.questions) {
      const qEl = el('div', { class: 'question-item' });
      qEl.append(el('p', { class: 'question-text' }, q.text));
      const opts = el('div', { class: 'options' });
      q.options.forEach((opt, i) => {
        const lbl = el('label', { class: 'option-label' });
        const inp = el('input', { type: 'radio', name: q.id, value: String(i) });
        inp.addEventListener('change', () => { answers[q.id] = i; });
        if (submitted) {
          if (i === q.answer) lbl.classList.add('correct');
          else if (answers[q.id] === i) lbl.classList.add('wrong');
        }
        inp.disabled = submitted;
        if (submitted && answers[q.id] === i) inp.checked = true;
        lbl.append(inp, ` ${String.fromCharCode(65 + i)}. ${opt}`);
        opts.append(lbl);
      });
      qEl.append(opts);
      card.append(qEl);
    }

    if (!submitted) {
      const submitBtn = el('button', { class: 'btn', style: 'margin-top:.5rem' }, 'Nộp bài');
      submitBtn.addEventListener('click', () => {
        submitted = true;
        const correct = selected.questions.filter(q => answers[q.id] === q.answer).length;
        const band = correct === selected.questions.length ? 8 : correct >= Math.ceil(selected.questions.length * 0.7) ? 7 : 6;
        addBandRecord({ skill: 'listening', band, date: new Date().toISOString() });
        build();
        toast(`${correct}/${selected.questions.length} câu đúng · ≈ Band ${band}`, 'success');
      });
      card.append(submitBtn);
    } else {
      const correct = selected.questions.filter(q => answers[q.id] === q.answer).length;
      const retry = el('button', { class: 'btn secondary sm', style: 'margin-top:.5rem' }, 'Làm lại');
      retry.addEventListener('click', () => { answers = {}; submitted = false; build(); });
      card.append(
        el('div', { class: 'tag green', style: 'margin-top:.5rem' }, `✅ ${correct}/${selected.questions.length}`),
        retry,
      );

      // Show transcript
      const showScript = el('button', { class: 'btn secondary sm', style: 'margin-left:.5rem' }, '📜 Xem script');
      showScript.addEventListener('click', () => {
        openModal({ title: 'Script', body: el('p', { style: 'white-space:pre-line;font-size:.875rem' }, selected.script) });
      });
      card.querySelector('.tag').after(showScript);
    }

    container.append(card);
  }

  build();
}

/* ============================================================
   SPEAKING
   ============================================================ */
export function renderSpeaking(container) {
  container.innerHTML = '';
  container.append(el('h1', {}, '🎤 Speaking'));

  const topics = SPEAKING_TOPICS;
  let recognizing = false;
  let recognition = null;
  let transcript = '';

  const tabsEl = el('div', { class: 'tabs' });
  const parts = [
    { id: 'part1', label: 'Part 1 — Q&A' },
    { id: 'part2', label: 'Part 2 — Cue Card' },
    { id: 'part3', label: 'Part 3 — Discussion' },
  ];
  let activePart = 'part1';

  function renderPartContent(partId) {
    body.innerHTML = '';
    const t = topics.find(t => t.id === partId.replace('part', 's'));

    if (partId === 'part1' || partId === 'part3') {
      const src = partId === 'part1' ? topics[0] : topics[2];
      src.questions.forEach((q, i) => {
        body.append(
          el('div', { class: 'card', style: 'margin-bottom:.75rem' },
            el('p', { class: 'question-text' }, `${i + 1}. ${q}`),
            buildRecorder(q),
          )
        );
      });
    } else {
      const cue = topics[1];
      const cueCard = el('div', { class: 'card', style: 'margin-bottom:1rem' });
      cueCard.append(
        el('div', { class: 'card-title' }, '🃏 Cue Card'),
        el('p', { style: 'white-space:pre-line;font-size:.9rem' }, cue.cue),
        el('div', { style: 'margin-top:.75rem' }, buildRecorder(cue.cue)),
      );
      body.append(cueCard);
    }
  }

  function buildRecorder(question) {
    const wrap = el('div', { style: 'margin-top:.5rem' });
    const transcriptEl = el('div', { class: 'feedback-panel', style: 'min-height:48px;margin-bottom:.5rem;font-size:.875rem' }, 'Transcript xuất hiện ở đây…');
    const btnRecord = el('button', { class: 'btn secondary sm' }, '🎙️ Bắt đầu ghi âm');
    const btnStop   = el('button', { class: 'btn danger sm', style: 'display:none' }, '⏹ Dừng');
    const btnScore  = el('button', { class: 'btn success sm', style: 'display:none' }, '🤖 Chấm AI');

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      wrap.append(el('p', { class: 'muted small' }, '⚠️ Nhận diện giọng nói cần Chrome/Edge'), transcriptEl);
      return wrap;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    btnRecord.addEventListener('click', () => {
      recognition = new SR();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      let interim = '';
      recognition.onresult = (e) => {
        interim = '';
        let final = transcript;
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
          else interim += e.results[i][0].transcript;
        }
        transcript = final;
        transcriptEl.textContent = transcript + interim;
      };
      recognition.onerror = (e) => toast('Lỗi nhận diện: ' + e.error, 'error');
      recognition.onend = () => { recognizing = false; btnRecord.style.display = ''; btnStop.style.display = 'none'; if (transcript) btnScore.style.display = ''; };
      recognition.start();
      recognizing = true;
      btnRecord.style.display = 'none';
      btnStop.style.display = '';
    });

    btnStop.addEventListener('click', () => { if (recognition) recognition.stop(); });

    btnScore.addEventListener('click', async () => {
      if (!transcript.trim()) { toast('Chưa có transcript', 'error'); return; }
      btnScore.disabled = true;
      btnScore.textContent = '⏳ Đang chấm…';
      try {
        const result = await scoreSpeaking(transcript, question);
        addBandRecord({ skill: 'speaking', band: result.band || 6, date: new Date().toISOString() });
        openModal({
          title: `Speaking Feedback · Band ${result.band || '?'}`,
          body: el('div', {},
            el('p', {}, result.feedback || ''),
            el('ul', { style: 'margin-top:.5rem;padding-left:1.2rem' },
              ...(result.suggestions || []).map(s => el('li', {}, s))
            ),
          ),
        });
      } catch (e) {
        toast(e.message, 'error', 5000);
      } finally {
        btnScore.disabled = false;
        btnScore.textContent = '🤖 Chấm AI';
      }
    });

    wrap.append(transcriptEl, el('div', { style: 'display:flex;gap:.5rem' }, btnRecord, btnStop, btnScore));
    return wrap;
  }

  for (const p of parts) {
    const tabBtn = el('button', { class: `tab${p.id === activePart ? ' active' : ''}` }, p.label);
    tabBtn.addEventListener('click', () => {
      activePart = p.id;
      tabsEl.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tabBtn.classList.add('active');
      renderPartContent(p.id);
    });
    tabsEl.append(tabBtn);
  }

  const body = el('div');
  container.append(tabsEl, body);
  renderPartContent(activePart);
}

/* ============================================================
   MOCK EXAM
   ============================================================ */
export function renderMock(container) {
  container.innerHTML = '';
  container.append(el('h1', {}, '🏆 Thi thử IELTS'));

  const skills = [
    { id: 'writing', label: 'Writing', duration: 60, icon: '✍️' },
    { id: 'reading', label: 'Reading', duration: 60, icon: '📖' },
    { id: 'listening', label: 'Listening', duration: 40, icon: '🎧' },
    { id: 'speaking', label: 'Speaking', duration: 15, icon: '🎤' },
  ];

  let activeSkill = null;
  let timeLeft = 0;
  let timerInterval = null;

  const grid = el('div', { class: 'grid-2', style: 'margin-bottom:1.5rem' });
  for (const sk of skills) {
    const card = el('div', { class: 'card', style: 'cursor:pointer' },
      el('div', { style: 'font-size:2rem' }, sk.icon),
      el('h3', {}, sk.label),
      el('p', { class: 'muted' }, `${sk.duration} phút`),
    );
    card.addEventListener('click', () => startMock(sk));
    grid.append(card);
  }
  container.append(grid);

  const timerSection = el('div', { style: 'display:none' });
  const timerTitle = el('h2');
  const timerDisplay = el('div', { class: 'timer-display' });
  const stopBtn = el('button', { class: 'btn danger', style: 'margin-top:1rem' }, '⏹ Dừng thi');

  stopBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerSection.style.display = 'none';
    grid.style.display = '';
    toast('Đã kết thúc phiên thi thử', 'info');
  });

  timerSection.append(timerTitle, timerDisplay, stopBtn);
  container.append(timerSection);

  // Embed writing area
  const mockContent = el('div');
  container.append(mockContent);

  function startMock(sk) {
    activeSkill = sk;
    timeLeft = sk.duration * 60;
    grid.style.display = 'none';
    timerTitle.textContent = `${sk.icon} ${sk.label} — ${sk.duration} phút`;
    timerSection.style.display = '';
    updateTimer();
    timerInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        timerDisplay.textContent = '00:00';
        timerDisplay.className = 'timer-display danger';
        toast(`Hết giờ ${sk.label}!`, 'error', 5000);
        return;
      }
      updateTimer();
    }, 1000);

    mockContent.innerHTML = '';
    if (sk.id === 'writing') {
      const task = WRITING_TASKS[1]; // Task 2 for mock
      mockContent.append(
        el('div', { class: 'card', style: 'margin-top:1rem' },
          el('div', { class: 'card-title' }, task.title),
          el('p', { style: 'white-space:pre-line;font-size:.9rem;margin-bottom:.75rem' }, task.prompt),
          el('textarea', { placeholder: 'Viết bài của bạn…', style: 'min-height:220px' }),
        )
      );
    } else if (sk.id === 'reading') {
      renderReading(mockContent);
    } else if (sk.id === 'listening') {
      renderListening(mockContent);
    } else {
      renderSpeaking(mockContent);
    }
  }

  function updateTimer() {
    timerDisplay.textContent = fmtTime(timeLeft);
    timerDisplay.className = 'timer-display' +
      (timeLeft < 300 ? ' danger' : timeLeft < 600 ? ' warn' : '');
  }
}
