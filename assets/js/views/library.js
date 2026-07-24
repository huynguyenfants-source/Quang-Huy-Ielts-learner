// Content & tool views: Vocabulary, Mistakes, Documents, Images, Bilingual,
// AI Assistant, Settings.
import { $, $$, html, esc, uid, fmtDate, toast, modal, confirmDialog, download, readFileAsText, readFileAsDataURL } from '../utils.js';
import * as store from '../store.js';
import * as ai from '../ai.js';

const el = (h) => html(h);

// ---------- Vocabulary (with YouGlish-style video + dictionary) ----------
export function Vocab() {
  const s = store.get();
  const wrap = el('<div></div>');
  wrap.append(el('<div class="section-title"><h2>📚 Từ vựng</h2></div>'));
  const tools = el('<div class="row" style="margin-bottom:12px"><input id="vq" placeholder="Tra từ (video YouGlish + từ điển Cambridge)…" style="max-width:420px"><button class="btn" id="look">🔎 Tra</button><span class="spacer"></span><button class="btn ghost" id="addv">＋ Thêm từ</button></div>');
  wrap.append(tools);
  const lookOut = el('<div id="lookout" style="margin-bottom:16px"></div>');
  wrap.append(lookOut);

  const doLook = () => {
    const raw = $('#vq', tools).value.trim();
    if (!raw) return;
    // Restrict lookups to plain words/phrases (letters, spaces, hyphen, apostrophe).
    const w = raw.replace(/[^\p{L}\p{N}\s'-]/gu, '').slice(0, 60).trim();
    if (!w) return toast('Từ tra không hợp lệ.', 'error');
    const q = encodeURIComponent(w);
    lookOut.innerHTML = '';
    lookOut.append(el(`<div class="card">
      <div class="row between"><h3>“${esc(w)}”</h3>
        <div class="row">
          <a class="btn ghost sm" target="_blank" rel="noopener" href="https://dictionary.cambridge.org/dictionary/english/${q}">📖 Cambridge</a>
          <a class="btn ghost sm" target="_blank" rel="noopener" href="https://youglish.com/pronounce/${q}/english">▶️ YouGlish</a>
        </div>
      </div>
      <div class="sub">Phát âm qua video người bản xứ (YouGlish) &amp; định nghĩa đầy đủ (Cambridge).</div>
      <iframe class="embed-frame" loading="lazy" src="https://youglish.com/pronounce/${q}/english?embed=1" allow="fullscreen"></iframe>
      <div class="row" style="margin-top:10px"><button class="btn sm" id="speakw">🔊 Đọc từ</button><button class="btn ghost sm" id="savew">＋ Lưu vào sổ</button></div>
    </div>`));
    $('#speakw', lookOut).onclick = () => { const u = new SpeechSynthesisUtterance(w); u.lang = 'en-US'; speechSynthesis.speak(u); };
    $('#savew', lookOut).onclick = () => editVocab({ word: w }, () => render());
  };
  $('#look', tools).onclick = doLook;
  $('#vq', tools).addEventListener('keydown', (e) => { if (e.key === 'Enter') doLook(); });
  $('#addv', tools).onclick = () => editVocab({}, () => render());

  const listWrap = el('<div class="list"></div>');
  wrap.append(listWrap);
  function render() {
    const st = store.get();
    listWrap.innerHTML = '';
    if (!st.vocab.length) { listWrap.append(el('<div class="empty">Chưa có từ nào. Nhấn “Thêm từ”.</div>')); return; }
    st.vocab.forEach((v) => {
      const it = el(`<div class="item"><div class="grow">
        <div class="row"><strong>${esc(v.word)}</strong> <span class="muted">${esc(v.ipa || '')}</span> ${(v.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        <div>${esc(v.meaning || '')}</div>${v.example ? `<div class="muted" style="font-style:italic">“${esc(v.example)}”</div>` : ''}
      </div>
      <div class="row"><button class="btn ghost sm" data-speak>🔊</button><button class="btn ghost sm" data-edit>✏️</button><button class="btn ghost sm" data-del>🗑️</button></div></div>`);
      it.querySelector('[data-speak]').onclick = () => { const u = new SpeechSynthesisUtterance(v.word); u.lang = 'en-US'; speechSynthesis.speak(u); };
      it.querySelector('[data-edit]').onclick = () => editVocab(v, render);
      it.querySelector('[data-del]').onclick = async () => { if (await confirmDialog(`Xoá từ “${v.word}”?`)) { store.removeFrom('vocab', v.id); render(); } };
      listWrap.append(it);
    });
  }
  render();
  return wrap;
}

function editVocab(v, after) {
  const isNew = !v.id;
  const form = el(`<div>
    <label class="field"><span>Từ</span><input id="w" value="${esc(v.word || '')}"></label>
    <label class="field"><span>Phiên âm (IPA)</span><input id="ipa" value="${esc(v.ipa || '')}"></label>
    <label class="field"><span>Nghĩa</span><input id="mean" value="${esc(v.meaning || '')}"></label>
    <label class="field"><span>Ví dụ</span><textarea id="ex">${esc(v.example || '')}</textarea></label>
    <label class="field"><span>Tag (cách nhau bởi dấu phẩy)</span><input id="tags" value="${esc((v.tags || []).join(', '))}"></label>
    <button class="btn" id="save">Lưu</button></div>`);
  const m = modal(isNew ? 'Thêm từ' : 'Sửa từ', form);
  $('#save', form).onclick = () => {
    const data = { word: $('#w', form).value.trim(), ipa: $('#ipa', form).value.trim(), meaning: $('#mean', form).value.trim(), example: $('#ex', form).value.trim(), tags: $('#tags', form).value.split(',').map((x) => x.trim()).filter(Boolean) };
    if (!data.word) return toast('Nhập từ đã.', 'error');
    if (isNew) store.addTo('vocab', { id: uid(), ...data }); else store.updateIn('vocab', v.id, data);
    m.close(); toast('Đã lưu', 'success'); after();
  };
}

// ---------- Mistakes ----------
export function Mistakes() {
  const wrap = el('<div></div>');
  wrap.append(el('<div class="section-title"><h2>⚠️ Lỗi hay gặp</h2></div>'));
  wrap.append(el('<p class="muted">Ghi lại lỗi để hệ thống phân tích điểm yếu và nhắc bạn tránh lặp lại.</p>'));
  wrap.append(el('<div class="row" style="margin-bottom:12px"><button class="btn" id="add">＋ Thêm lỗi</button></div>'));
  const listWrap = el('<div class="list"></div>');
  wrap.append(listWrap);
  function render() {
    const st = store.get();
    listWrap.innerHTML = '';
    if (!st.mistakes.length) { listWrap.append(el('<div class="empty">Chưa ghi lỗi nào.</div>')); return; }
    st.mistakes.forEach((m) => {
      const it = el(`<div class="item"><span class="tag">${esc(m.type || 'Khác')}</span><div class="grow">
        ${m.wrong ? `<div>❌ <del>${esc(m.wrong)}</del> → ✅ <ins>${esc(m.correct || '')}</ins></div>` : ''}
        ${m.note ? `<div class="muted">${esc(m.note)}</div>` : ''}</div>
        <div class="row"><button class="btn ghost sm" data-edit>✏️</button><button class="btn ghost sm" data-del>🗑️</button></div></div>`);
      it.querySelector('[data-edit]').onclick = () => editMistake(m, render);
      it.querySelector('[data-del]').onclick = async () => { if (await confirmDialog('Xoá lỗi này?')) { store.removeFrom('mistakes', m.id); render(); } };
      listWrap.append(it);
    });
  }
  $('#add', wrap).onclick = () => editMistake({}, render);
  render();
  return wrap;
}

function editMistake(m, after) {
  const isNew = !m.id;
  const form = el(`<div>
    <label class="field"><span>Loại lỗi</span><select id="type">${['Grammar', 'Spelling', 'Word choice', 'Preposition', 'Pronunciation', 'Coherence', 'Khác'].map((t) => `<option ${m.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <label class="field"><span>Câu sai</span><input id="wrong" value="${esc(m.wrong || '')}"></label>
    <label class="field"><span>Câu đúng</span><input id="correct" value="${esc(m.correct || '')}"></label>
    <label class="field"><span>Ghi chú</span><textarea id="note">${esc(m.note || '')}</textarea></label>
    <button class="btn" id="save">Lưu</button></div>`);
  const mo = modal(isNew ? 'Thêm lỗi' : 'Sửa lỗi', form);
  $('#save', form).onclick = () => {
    const data = { type: $('#type', form).value, wrong: $('#wrong', form).value, correct: $('#correct', form).value, note: $('#note', form).value };
    if (isNew) store.addTo('mistakes', { id: uid(), ...data }); else store.updateIn('mistakes', m.id, data);
    mo.close(); after();
  };
}

// ---------- Documents / knowledge ----------
export function Docs() {
  const wrap = el('<div></div>');
  wrap.append(el('<div class="section-title"><h2>🗂️ Tài liệu &amp; kiến thức</h2></div>'));
  wrap.append(el('<div class="row" style="margin-bottom:12px"><button class="btn" id="add">＋ Thêm tài liệu</button></div>'));
  const listWrap = el('<div class="list"></div>');
  wrap.append(listWrap);
  function render() {
    const st = store.get();
    listWrap.innerHTML = '';
    if (!st.docs.length) { listWrap.append(el('<div class="empty">Chưa có tài liệu.</div>')); return; }
    st.docs.forEach((d) => {
      const it = el(`<div class="item"><div class="grow"><div class="row"><strong>${esc(d.title)}</strong>${(d.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div><details><summary class="muted">Xem nội dung</summary><div style="white-space:pre-wrap;margin-top:6px">${esc(d.body || '')}</div></details></div>
        <div class="row"><button class="btn ghost sm" data-edit>✏️</button><button class="btn ghost sm" data-del>🗑️</button></div></div>`);
      it.querySelector('[data-edit]').onclick = () => editDoc(d, render);
      it.querySelector('[data-del]').onclick = async () => { if (await confirmDialog('Xoá tài liệu này?')) { store.removeFrom('docs', d.id); render(); } };
      listWrap.append(it);
    });
  }
  $('#add', wrap).onclick = () => editDoc({}, render);
  render();
  return wrap;
}

function editDoc(d, after) {
  const isNew = !d.id;
  const form = el(`<div>
    <label class="field"><span>Tiêu đề</span><input id="title" value="${esc(d.title || '')}"></label>
    <label class="field"><span>Tag</span><input id="tags" value="${esc((d.tags || []).join(', '))}"></label>
    <label class="field"><span>Nội dung</span><textarea id="body" style="min-height:180px">${esc(d.body || '')}</textarea></label>
    <button class="btn" id="save">Lưu</button></div>`);
  const mo = modal(isNew ? 'Thêm tài liệu' : 'Sửa tài liệu', form);
  $('#save', form).onclick = () => {
    const data = { title: $('#title', form).value.trim() || 'Tài liệu', tags: $('#tags', form).value.split(',').map((x) => x.trim()).filter(Boolean), body: $('#body', form).value };
    if (isNew) store.addTo('docs', { id: uid(), ...data }); else store.updateIn('docs', d.id, data);
    mo.close(); after();
  };
}

// ---------- Images (OCR / vision via AI) ----------
export function Images() {
  const wrap = el('<div></div>');
  wrap.append(el('<div class="section-title"><h2>🖼️ Ảnh &amp; OCR</h2></div>'));
  wrap.append(el('<p class="muted">Tải ảnh (đề bài, ghi chú, sách…). AI có thể đọc chữ trong ảnh, sửa lỗi và giải thích từ vựng.</p>'));
  const up = el('<div class="row" style="margin-bottom:12px"><input type="file" id="file" accept="image/*"></div>');
  wrap.append(up);
  const listWrap = el('<div class="grid cols-2"></div>');
  wrap.append(listWrap);

  $('#file', up).onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const dataUrl = await readFileAsDataURL(f);
    store.addTo('images', { id: uid(), name: f.name, dataUrl, note: '', ts: Date.now() });
    render(); e.target.value = '';
  };

  function render() {
    const st = store.get();
    listWrap.innerHTML = '';
    if (!st.images.length) { listWrap.append(el('<div class="empty">Chưa có ảnh nào.</div>')); return; }
    st.images.forEach((img) => {
      const c = el(`<div class="card"><img src="${img.dataUrl}" alt="${esc(img.name)}" style="width:100%;border-radius:10px;max-height:260px;object-fit:contain;background:var(--surface-2)">
        <div class="row between" style="margin-top:8px"><span class="muted">${esc(img.name)}</span><span class="muted">${fmtDate(img.ts)}</span></div>
        <div class="row" style="margin-top:8px"><button class="btn sm" data-ai>🤖 Đọc &amp; phân tích (AI)</button><button class="btn ghost sm" data-del>🗑️ Xoá</button></div>
        <div class="ai-out" style="margin-top:10px"></div></div>`);
      c.querySelector('[data-del]').onclick = async () => { if (await confirmDialog('Xoá ảnh này?')) { store.removeFrom('images', img.id); render(); } };
      c.querySelector('[data-ai]').onclick = async () => {
        const b = c.querySelector('[data-ai]'); b.disabled = true; b.textContent = '⏳…';
        try { const out = await ai.analyzeImage(img.dataUrl, 'Đọc chữ trong ảnh, sửa lỗi và giải thích từ mới.'); c.querySelector('.ai-out').innerHTML = `<div class="card" style="white-space:pre-wrap">${esc(out)}</div>`; }
        catch (err) { toast(err.message, 'error'); } finally { b.disabled = false; b.textContent = '🤖 Đọc & phân tích (AI)'; }
      };
      listWrap.append(c);
    });
  }
  render();
  return wrap;
}

// ---------- Bilingual (Glot-style) ----------
export function Bilingual() {
  const wrap = el('<div></div>');
  wrap.append(el('<div class="section-title"><h2>🌐 Song ngữ</h2></div>'));
  wrap.append(el('<p class="muted">Dán đoạn văn tiếng Anh, xem bản dịch tiếng Việt song song (giống Glot). Cần cấu hình AI để dịch chất lượng cao.</p>'));
  const input = el('<textarea id="src" placeholder="Dán văn bản tiếng Anh…" style="min-height:120px"></textarea>');
  const bar = el('<div class="row" style="margin:10px 0"><button class="btn" id="tr">Dịch song ngữ</button><button class="btn ghost" id="read">🔊 Đọc</button></div>');
  const out = el('<div id="bout"></div>');
  wrap.append(input, bar, out);
  $('#read', bar).onclick = () => { const u = new SpeechSynthesisUtterance(input.value); u.lang = 'en-US'; speechSynthesis.speak(u); };
  $('#tr', bar).onclick = async () => {
    const text = input.value.trim(); if (!text) return;
    const b = $('#tr', bar); b.disabled = true; b.textContent = '⏳…';
    let vi = '';
    try { vi = await ai.chat('You are a translator. Translate the English text to natural Vietnamese. Keep paragraph breaks. Reply with translation only.', text); }
    catch (e) { toast('Không dịch được bằng AI: ' + e.message + '. Dùng liên kết Google Dịch.', 'error'); vi = ''; }
    finally { b.disabled = false; b.textContent = 'Dịch song ngữ'; }
    out.innerHTML = '';
    const bi = el('<div class="bilingual"></div>');
    bi.append(el(`<div class="col"><strong class="muted">English</strong><p style="white-space:pre-wrap">${esc(text)}</p></div>`));
    bi.append(el(`<div class="col"><strong class="muted">Tiếng Việt</strong><p style="white-space:pre-wrap">${vi ? esc(vi) : ''}</p>${vi ? '' : `<a class="btn ghost sm" target="_blank" rel="noopener" href="https://translate.google.com/?sl=en&tl=vi&text=${encodeURIComponent(text)}">Mở Google Dịch</a>`}</div>`));
    out.append(bi);
  };
  return wrap;
}

// ---------- AI Assistant ----------
export function Assistant() {
  const wrap = el('<div></div>');
  wrap.append(el('<div class="section-title"><h2>🤖 Trợ lý AI</h2></div>'));
  if (!ai.hasKey()) wrap.append(el('<div class="empty">Chưa cấu hình API key. Vào <b>Cấu hình AI</b> để dùng Gemini / ChatGPT / Claude / Perplexity.</div>'));
  const log = el('<div class="list" id="log" style="margin-bottom:12px"></div>');
  const bar = el('<div class="row"><input id="msg" placeholder="Hỏi bất cứ điều gì về tiếng Anh…" style="flex:1"><button class="btn" id="send">Gửi</button></div>');
  wrap.append(log, bar);
  const send = async () => {
    const q = $('#msg', bar).value.trim(); if (!q) return;
    $('#msg', bar).value = '';
    log.append(el(`<div class="item"><span>🧑</span><div class="grow">${esc(q)}</div></div>`));
    const holder = el('<div class="item"><span>🤖</span><div class="grow muted">Đang trả lời…</div></div>');
    log.append(holder);
    try { const out = await ai.chat('You are a helpful, friendly English tutor for a Vietnamese IELTS learner. Be concise, give examples, and reply in Vietnamese unless asked otherwise.', q); holder.querySelector('.grow').innerHTML = esc(out).replace(/\n/g, '<br>'); holder.querySelector('.grow').classList.remove('muted'); }
    catch (e) { holder.querySelector('.grow').textContent = e.message; }
  };
  $('#send', bar).onclick = send;
  $('#msg', bar).addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  return wrap;
}

// ---------- Settings ----------
export function Settings() {
  const s = store.get();
  const wrap = el('<div></div>');
  wrap.append(el('<div class="section-title"><h2>⚙️ Cấu hình</h2></div>'));

  // Profile
  const prof = el(`<div class="card"><h3>Hồ sơ &amp; mục tiêu</h3>
    <label class="field"><span>Tên</span><input id="name" value="${esc(s.profile.name)}"></label>
    <div class="grid cols-2">
      <label class="field"><span>Mục tiêu band</span><input id="goal" type="number" step="0.5" min="0" max="9" value="${s.profile.goal}"></label>
      <label class="field"><span>Ngày thi dự kiến</span><input id="date" type="text" placeholder="dd/mm/yyyy" value="${esc(s.profile.targetDate || '')}"></label>
    </div>
    <button class="btn" id="saveProf">Lưu hồ sơ</button></div>`);
  $('#saveProf', prof).onclick = () => { store.update((st) => { st.profile.name = $('#name', prof).value; st.profile.goal = +$('#goal', prof).value || 6.5; st.profile.targetDate = $('#date', prof).value; }); toast('Đã lưu hồ sơ', 'success'); };
  wrap.append(prof);

  // AI providers
  const aiCard = el(`<div class="card" style="margin-top:16px"><h3>Kết nối AI</h3>
    <div class="sub">Nhập API key của bạn. Khoá chỉ lưu trên máy này và gửi thẳng tới nhà cung cấp.</div>
    <label class="field"><span>Nhà cung cấp mặc định</span><select id="prov">${Object.entries(ai.PROVIDERS).map(([k, v]) => `<option value="${k}" ${s.settings.ai.provider === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label>
  </div>`);
  Object.entries(ai.PROVIDERS).forEach(([k, v]) => {
    aiCard.append(el(`<div class="card" style="background:var(--surface-2);margin-top:8px">
      <strong>${esc(v.label)}</strong>
      <label class="field" style="margin-top:6px"><span>API key (${esc(v.keyHint)})</span><input type="password" data-key="${k}" value="${esc(s.settings.ai.keys[k] || '')}" placeholder="Dán API key"></label>
      <label class="field"><span>Model (tuỳ chọn)</span><input type="text" data-model="${k}" value="${esc(s.settings.ai.model[k] || '')}" placeholder="${esc(v.defaultModel)}"></label>
    </div>`));
  });
  aiCard.append(el('<button class="btn" id="saveAI" style="margin-top:10px">Lưu cấu hình AI</button>'));
  $('#saveAI', aiCard).onclick = () => {
    store.update((st) => {
      st.settings.ai.provider = $('#prov', aiCard).value;
      $$('[data-key]', aiCard).forEach((i) => { st.settings.ai.keys[i.dataset.key] = i.value.trim(); });
      $$('[data-model]', aiCard).forEach((i) => { st.settings.ai.model[i.dataset.model] = i.value.trim(); });
    });
    toast('Đã lưu cấu hình AI', 'success');
  };
  wrap.append(aiCard);

  // GitHub sync
  const gh = el(`<div class="card" style="margin-top:16px"><h3>GitHub (sao lưu &amp; đồng bộ)</h3>
    <div class="sub">Dùng Personal Access Token (scope: gist) để lưu dữ liệu vào Gist riêng tư.</div>
    <label class="field"><span>Token</span><input type="password" id="ghtok" value="${esc(s.settings.github.token || '')}" placeholder="ghp_…"></label>
    <label class="field"><span>Gist ID (tự tạo khi sao lưu lần đầu)</span><input type="text" id="ghgist" value="${esc(s.settings.github.gistId || '')}"></label>
    <div class="row"><button class="btn ghost" id="ghsavecfg">Lưu</button><button class="btn" id="ghpush">⬆️ Sao lưu lên GitHub</button><button class="btn outline" id="ghpull">⬇️ Khôi phục</button></div></div>`);
  $('#ghsavecfg', gh).onclick = () => { store.update((st) => { st.settings.github.token = $('#ghtok', gh).value.trim(); st.settings.github.gistId = $('#ghgist', gh).value.trim(); }); toast('Đã lưu cấu hình GitHub', 'success'); };
  $('#ghpush', gh).onclick = async () => { store.update((st) => { st.settings.github.token = $('#ghtok', gh).value.trim(); st.settings.github.gistId = $('#ghgist', gh).value.trim(); }); try { const id = await ai.githubSync(store.exportState()); $('#ghgist', gh).value = id; toast('Đã sao lưu lên GitHub', 'success'); } catch (e) { toast(e.message, 'error'); } };
  $('#ghpull', gh).onclick = async () => { try { const json = await ai.githubRestore(); if (json && await confirmDialog('Khôi phục sẽ ghi đè dữ liệu hiện tại. Tiếp tục?')) { store.importState(json); toast('Đã khôi phục', 'success'); location.reload(); } } catch (e) { toast(e.message, 'error'); } };
  wrap.append(gh);

  // Data import/export
  const data = el(`<div class="card" style="margin-top:16px"><h3>Dữ liệu</h3>
    <div class="row"><button class="btn ghost" id="exp">⬇️ Xuất JSON</button><label class="btn outline" style="cursor:pointer">⬆️ Nhập JSON<input type="file" id="imp" accept="application/json" hidden></label><button class="btn danger" id="reset">Xoá tất cả</button></div></div>`);
  $('#exp', data).onclick = () => download('qh-ielts-data.json', store.exportState());
  $('#imp', data).onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { store.importState(await readFileAsText(f)); toast('Đã nhập dữ liệu', 'success'); location.reload(); } catch { toast('File không hợp lệ', 'error'); } };
  $('#reset', data).onclick = async () => { if (await confirmDialog('Xoá toàn bộ dữ liệu và về mặc định?')) { store.resetState(); location.reload(); } };
  wrap.append(data);

  return wrap;
}

export const LibraryViews = { Vocab, Mistakes, Docs, Images, Bilingual, Assistant, Settings };
