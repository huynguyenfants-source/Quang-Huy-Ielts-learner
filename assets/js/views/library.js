/* views/library.js — Vocab, Mistakes, Docs, Images, Bilingual, Assistant, Settings */
import { el, toast, openModal, closeModal, fmtDate, uuid, confirm, debounce } from '../utils.js';
import {
  getVocab, addVocabItem, deleteVocabItem, updateVocabItem,
  getMistakes, saveMistakes, addMistake, deleteMistake,
  getDocs, addDoc, deleteDoc, updateDoc,
  getImages, addImage, deleteImage,
  getChatHistory, appendChat, clearChat,
  getSettings, saveSettings,
  exportAll, importAll, backupToGist, restoreFromGist,
} from '../store.js';
import { DEFAULT_VOCAB } from '../content.js';
import { translate, chat, lookupWord, analyseImage, PROVIDER_LIST } from '../ai.js';

/* ============================================================
   VOCABULARY
   ============================================================ */
export function renderVocab(container) {
  container.innerHTML = '';
  container.append(el('h1', {}, '📚 Từ vựng'));

  let search = '';

  function seedDefaults() {
    const existing = getVocab();
    if (existing.length === 0) {
      for (const v of DEFAULT_VOCAB) {
        addVocabItem({ id: uuid(), ...v, date: new Date().toISOString(), review: 0 });
      }
    }
  }
  seedDefaults();

  function build() {
    const vocab = getVocab().filter(v =>
      !search || v.word.toLowerCase().includes(search) || (v.definition || '').toLowerCase().includes(search)
    );

    const toolbar = el('div', { style: 'display:flex;gap:.5rem;margin-bottom:1rem;flex-wrap:wrap' });
    const searchInput = el('input', { type: 'text', placeholder: '🔎 Tìm từ…', style: 'max-width:260px', value: search });
    searchInput.addEventListener('input', debounce(() => { search = searchInput.value.toLowerCase(); build(); }));

    const addBtn = el('button', { class: 'btn' }, '＋ Thêm từ');
    addBtn.addEventListener('click', () => showAddModal());

    const aiBtn = el('button', { class: 'btn success sm' }, '🤖 Tra AI');
    aiBtn.addEventListener('click', () => showLookupModal());

    toolbar.append(searchInput, addBtn, aiBtn);

    const list = el('div', { class: 'flex-col' });

    if (vocab.length === 0) {
      list.append(el('p', { class: 'muted' }, 'Chưa có từ nào. Thêm từ mới bằng nút ＋.'));
    }

    for (const v of vocab) {
      list.append(buildVocabCard(v));
    }

    container.innerHTML = '';
    container.append(el('h1', {}, '📚 Từ vựng'), toolbar, list);
  }

  function buildVocabCard(v) {
    const card = el('div', { class: 'vocab-card' });
    card.append(
      el('div', { style: 'flex:1' },
        el('div', { class: 'vocab-word' }, v.word),
        el('div', { class: 'vocab-phonetic' }, v.phonetic || ''),
        el('div', { class: 'vocab-def', style: 'margin-top:.15rem' }, v.definition || ''),
        v.example ? el('div', { class: 'muted small', style: 'margin-top:.15rem;font-style:italic' }, `"${v.example}"`) : null,
        el('div', { style: 'display:flex;gap:.4rem;margin-top:.3rem' },
          el('span', { class: 'tag grey' }, fmtDate(v.date)),
          el('a', {
            href: `https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(v.word)}`,
            target: '_blank', class: 'tag grey',
          }, '📖 Cambridge'),
          el('a', {
            href: `https://youglish.com/pronounce/${encodeURIComponent(v.word)}/english`,
            target: '_blank', class: 'tag grey',
          }, '🎬 YouGlish'),
        ),
      ),
      el('div', { class: 'vocab-actions' },
        el('button', { class: 'btn secondary sm', onclick: () => showEditModal(v) }, '✏️'),
        el('button', { class: 'btn danger sm', onclick: () => confirm(`Xoá từ "${v.word}"?`, () => { deleteVocabItem(v.id); build(); }) }, '🗑️'),
      ),
    );
    return card;
  }

  function showAddModal() {
    const wordI = el('input', { type: 'text', placeholder: 'Từ…' });
    const phonI = el('input', { type: 'text', placeholder: '/fəˈnɛtɪk/…' });
    const defI  = el('textarea', { placeholder: 'Định nghĩa (tiếng Việt hoặc Anh)…', style: 'min-height:80px' });
    const exI   = el('textarea', { placeholder: 'Ví dụ…', style: 'min-height:60px' });

    const body = el('div', { class: 'flex-col' },
      el('div', { class: 'form-group' }, el('label', {}, 'Từ'), wordI),
      el('div', { class: 'form-group' }, el('label', {}, 'Phiên âm'), phonI),
      el('div', { class: 'form-group' }, el('label', {}, 'Định nghĩa'), defI),
      el('div', { class: 'form-group' }, el('label', {}, 'Ví dụ'), exI),
    );

    openModal({
      title: '＋ Thêm từ vựng',
      body,
      footer: [
        el('button', { class: 'btn secondary', onclick: closeModal }, 'Huỷ'),
        el('button', { class: 'btn', onclick: () => {
          if (!wordI.value.trim()) { toast('Nhập từ vựng', 'error'); return; }
          addVocabItem({ id: uuid(), word: wordI.value.trim(), phonetic: phonI.value, definition: defI.value, example: exI.value, date: new Date().toISOString(), review: 0 });
          closeModal(); build();
          toast('Đã thêm từ vựng', 'success');
        }}, 'Lưu'),
      ],
    });
  }

  function showEditModal(v) {
    const wordI = el('input', { type: 'text', value: v.word });
    const phonI = el('input', { type: 'text', value: v.phonetic || '' });
    const defI  = el('textarea', { style: 'min-height:80px' });
    defI.value  = v.definition || '';
    const exI   = el('textarea', { style: 'min-height:60px' });
    exI.value   = v.example || '';

    openModal({
      title: `✏️ Sửa "${v.word}"`,
      body: el('div', { class: 'flex-col' },
        el('div', { class: 'form-group' }, el('label', {}, 'Từ'), wordI),
        el('div', { class: 'form-group' }, el('label', {}, 'Phiên âm'), phonI),
        el('div', { class: 'form-group' }, el('label', {}, 'Định nghĩa'), defI),
        el('div', { class: 'form-group' }, el('label', {}, 'Ví dụ'), exI),
      ),
      footer: [
        el('button', { class: 'btn secondary', onclick: closeModal }, 'Huỷ'),
        el('button', { class: 'btn', onclick: () => {
          updateVocabItem(v.id, { word: wordI.value.trim(), phonetic: phonI.value, definition: defI.value, example: exI.value });
          closeModal(); build();
          toast('Đã cập nhật', 'success');
        }}, 'Lưu'),
      ],
    });
  }

  function showLookupModal() {
    const inp = el('input', { type: 'text', placeholder: 'Nhập từ cần tra…' });
    const resultEl = el('div', { style: 'margin-top:.75rem' });

    const body = el('div', { class: 'flex-col' },
      inp,
      el('button', { class: 'btn sm', onclick: async () => {
        const word = inp.value.trim();
        if (!word) return;
        resultEl.textContent = '⏳ Đang tra…';
        try {
          const info = await lookupWord(word);
          resultEl.innerHTML = '';
          resultEl.append(
            el('strong', {}, info.word || ''),
            document.createTextNode(' ' + (info.phonetic || '')),
            el('br'),
            document.createTextNode(info.definition || ''),
            el('br'),
            el('em', {}, (info.examples || []).join(' / ')),
          );
          const addBtn2 = el('button', { class: 'btn sm', style: 'margin-top:.5rem' }, '➕ Thêm vào từ vựng');
          addBtn2.addEventListener('click', () => {
            addVocabItem({ id: uuid(), word: info.word, phonetic: info.phonetic, definition: info.definition, example: (info.examples || [])[0] || '', date: new Date().toISOString(), review: 0 });
            closeModal(); build();
            toast('Đã thêm', 'success');
          });
          resultEl.append(addBtn2);
        } catch (e) {
          resultEl.textContent = '❌ ' + e.message;
        }
      }}, '🔍 Tra'),
      resultEl,
    );
    openModal({ title: '🤖 Tra từ bằng AI', body });
  }

  build();
}

/* ============================================================
   MISTAKES
   ============================================================ */
export function renderMistakes(container) {
  container.innerHTML = '';

  function build() {
    const mistakes = getMistakes();
    container.innerHTML = '';
    container.append(el('h1', {}, '⚠️ Lỗi hay gặp'));

    const addBtn = el('button', { class: 'btn', style: 'margin-bottom:1rem' }, '＋ Ghi lỗi mới');
    addBtn.addEventListener('click', showAddModal);
    container.append(addBtn);

    if (mistakes.length === 0) {
      container.append(el('p', { class: 'muted' }, 'Chưa ghi lỗi nào. Hãy thêm lỗi thường gặp để không bị lặp lại!'));
      return;
    }

    const list = el('div', { class: 'flex-col' });
    for (const m of mistakes) {
      const card = el('div', { class: 'card', style: 'border-left:4px solid var(--clr-danger)' });
      card.append(
        el('div', { style: 'display:flex;justify-content:space-between' },
          el('div', {},
            el('div', { style: 'font-weight:600' }, m.title || 'Lỗi không tên'),
            el('p', { class: 'muted small', style: 'margin-top:.2rem' }, m.description || ''),
            el('div', { style: 'margin-top:.4rem;display:flex;gap:.4rem' },
              m.skill ? el('span', { class: 'tag' }, m.skill) : null,
              el('span', { class: 'tag grey' }, fmtDate(m.date)),
              el('span', { class: 'tag orange' }, `✕ ${m.count || 1} lần`),
            ),
          ),
          el('div', { style: 'display:flex;gap:.3rem;flex-shrink:0' },
            el('button', { class: 'btn secondary sm', onclick: () => {
              const all = getMistakes().map(x => x.id === m.id ? { ...x, count: (x.count || 1) + 1 } : x);
              saveMistakes(all);
              build();
            }}, '＋1'),
            el('button', { class: 'btn danger sm', onclick: () => confirm('Xoá lỗi này?', () => { deleteMistake(m.id); build(); }) }, '🗑️'),
          ),
        )
      );
      list.append(card);
    }
    container.append(list);
  }

  function saveMistakesInPlace(_list) { /* replaced by direct saveMistakes import */ }

  function showAddModal() {
    const titleI = el('input', { type: 'text', placeholder: 'Tên lỗi…' });
    const descI  = el('textarea', { placeholder: 'Mô tả chi tiết lỗi và cách sửa…', style: 'min-height:80px' });
    const skillSel = el('select');
    ['Writing', 'Reading', 'Listening', 'Speaking', 'Từ vựng', 'Ngữ pháp', 'Phát âm'].forEach(s => {
      skillSel.append(el('option', { value: s }, s));
    });

    openModal({
      title: '＋ Ghi lỗi mới',
      body: el('div', { class: 'flex-col' },
        el('div', { class: 'form-group' }, el('label', {}, 'Loại kỹ năng'), skillSel),
        el('div', { class: 'form-group' }, el('label', {}, 'Tên lỗi'), titleI),
        el('div', { class: 'form-group' }, el('label', {}, 'Mô tả'), descI),
      ),
      footer: [
        el('button', { class: 'btn secondary', onclick: closeModal }, 'Huỷ'),
        el('button', { class: 'btn', onclick: () => {
          if (!titleI.value.trim()) { toast('Nhập tên lỗi', 'error'); return; }
          addMistake({ id: uuid(), title: titleI.value.trim(), description: descI.value, skill: skillSel.value, date: new Date().toISOString(), count: 1 });
          closeModal(); build();
          toast('Đã ghi lỗi', 'success');
        }}, 'Lưu'),
      ],
    });
  }

  build();
}

/* ============================================================
   DOCUMENTS / NOTES
   ============================================================ */
export function renderDocs(container) {
  container.innerHTML = '';

  function build() {
    const docs = getDocs();
    container.innerHTML = '';
    container.append(el('h1', {}, '📄 Tài liệu & Ghi chú'));

    const addBtn = el('button', { class: 'btn', style: 'margin-bottom:1rem' }, '＋ Thêm tài liệu');
    addBtn.addEventListener('click', showAddModal);
    container.append(addBtn);

    if (docs.length === 0) {
      container.append(el('p', { class: 'muted' }, 'Chưa có tài liệu nào.'));
      return;
    }

    const grid = el('div', { class: 'grid-2' });
    for (const d of docs) {
      const card = el('div', { class: 'card', style: 'cursor:pointer' });
      card.addEventListener('click', () => showDocModal(d));
      card.append(
        el('div', { style: 'display:flex;justify-content:space-between;align-items:flex-start' },
          el('div', {},
            el('h3', {}, d.title || 'Không tiêu đề'),
            el('p', { class: 'muted small', style: 'margin-top:.2rem' }, d.content ? d.content.slice(0, 120) + '…' : ''),
            el('div', { style: 'margin-top:.5rem' }, el('span', { class: 'tag grey' }, fmtDate(d.date))),
          ),
          el('button', { class: 'btn danger sm', onclick: (e) => { e.stopPropagation(); confirm('Xoá tài liệu?', () => { deleteDoc(d.id); build(); }); }}, '🗑️'),
        )
      );
      grid.append(card);
    }
    container.append(grid);
  }

  function showAddModal() {
    const titleI = el('input', { type: 'text', placeholder: 'Tiêu đề…' });
    const contentI = el('textarea', { placeholder: 'Nội dung…', style: 'min-height:180px' });

    openModal({
      title: '＋ Thêm tài liệu',
      body: el('div', { class: 'flex-col' },
        el('div', { class: 'form-group' }, el('label', {}, 'Tiêu đề'), titleI),
        el('div', { class: 'form-group' }, el('label', {}, 'Nội dung'), contentI),
      ),
      footer: [
        el('button', { class: 'btn secondary', onclick: closeModal }, 'Huỷ'),
        el('button', { class: 'btn', onclick: () => {
          if (!titleI.value.trim()) { toast('Nhập tiêu đề', 'error'); return; }
          addDoc({ id: uuid(), title: titleI.value.trim(), content: contentI.value, date: new Date().toISOString() });
          closeModal(); build();
          toast('Đã lưu tài liệu', 'success');
        }}, 'Lưu'),
      ],
    });
  }

  function showDocModal(d) {
    const contentEl = el('div', { style: 'white-space:pre-wrap;font-size:.875rem;line-height:1.7' }, d.content || '');
    openModal({
      title: d.title,
      body: el('div', {},
        contentEl,
        el('div', { style: 'margin-top:1rem;display:flex;gap:.5rem' },
          el('button', { class: 'btn secondary sm', onclick: () => { closeModal(); showEditModal(d, build); }}, '✏️ Sửa'),
        ),
      ),
      wide: true,
    });
  }

  function showEditModal(d, onSave) {
    const titleI = el('input', { type: 'text', value: d.title });
    const contentI = el('textarea', { style: 'min-height:200px' });
    contentI.value = d.content || '';
    openModal({
      title: '✏️ Sửa tài liệu',
      body: el('div', { class: 'flex-col' },
        el('div', { class: 'form-group' }, el('label', {}, 'Tiêu đề'), titleI),
        el('div', { class: 'form-group' }, el('label', {}, 'Nội dung'), contentI),
      ),
      footer: [
        el('button', { class: 'btn secondary', onclick: closeModal }, 'Huỷ'),
        el('button', { class: 'btn', onclick: () => {
          updateDoc(d.id, { title: titleI.value.trim(), content: contentI.value });
          closeModal(); onSave();
          toast('Đã cập nhật', 'success');
        }}, 'Lưu'),
      ],
    });
  }

  build();
}

/* ============================================================
   IMAGES / OCR
   ============================================================ */
export function renderImages(container) {
  container.innerHTML = '';

  function build() {
    const images = getImages();
    container.innerHTML = '';
    container.append(el('h1', {}, '🖼️ Ảnh & OCR'));

    const uploadLabel = el('label', { class: 'btn', style: 'cursor:pointer;margin-bottom:1rem' });
    uploadLabel.textContent = '📁 Tải ảnh lên';
    const fileInput = el('input', { type: 'file', accept: 'image/*', style: 'display:none' });
    fileInput.addEventListener('change', handleUpload);
    uploadLabel.append(fileInput);
    container.append(uploadLabel);

    if (images.length === 0) {
      container.append(el('p', { class: 'muted' }, 'Chưa có ảnh nào.'));
      return;
    }

    const grid = el('div', { class: 'grid-3' });
    for (const img of images) {
      const card = el('div', { class: 'card', style: 'padding:.75rem' });
      const imgEl = el('img', { src: img.data, style: 'border-radius:var(--radius);margin-bottom:.5rem' });
      card.append(imgEl);
      card.append(el('p', { class: 'muted small' }, fmtDate(img.date)));

      const btnOCR = el('button', { class: 'btn sm', style: 'margin-right:.3rem' }, '🤖 OCR & Phân tích');
      btnOCR.addEventListener('click', async () => {
        btnOCR.disabled = true; btnOCR.textContent = '⏳…';
        try {
          const base64 = img.data.split(',')[1];
          const mime = img.data.split(';')[0].split(':')[1];
          const result = await analyseImage(base64, mime);
          openModal({ title: '📝 Kết quả OCR', body: el('pre', { style: 'white-space:pre-wrap;font-size:.875rem' }, result), wide: true });
        } catch (e) {
          toast(e.message, 'error', 5000);
        } finally {
          btnOCR.disabled = false; btnOCR.textContent = '🤖 OCR & Phân tích';
        }
      });

      const btnDel = el('button', { class: 'btn danger sm' }, '🗑️');
      btnDel.addEventListener('click', () => confirm('Xoá ảnh?', () => { deleteImage(img.id); build(); }));

      card.append(el('div', {}, btnOCR, btnDel));
      grid.append(card);
    }
    container.append(grid);
  }

  function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      addImage({ id: uuid(), data: ev.target.result, name: file.name, date: new Date().toISOString() });
      build();
      toast('Đã tải ảnh lên', 'success');
    };
    reader.readAsDataURL(file);
  }

  build();
}

/* ============================================================
   BILINGUAL TRANSLATION
   ============================================================ */
export function renderBilingual(container) {
  container.innerHTML = '';
  container.append(el('h1', {}, '🌐 Song ngữ Anh–Việt'));

  const srcArea = el('textarea', { placeholder: 'Nhập văn bản tiếng Anh cần dịch…', style: 'min-height:180px' });
  const dstArea = el('textarea', { placeholder: 'Bản dịch tiếng Việt…', style: 'min-height:180px' });
  dstArea.readOnly = true;

  const btnTranslate = el('button', { class: 'btn' }, '🌐 Dịch bằng AI');
  const btnGoogle    = el('button', { class: 'btn secondary' }, '🔗 Google Dịch');

  btnTranslate.addEventListener('click', async () => {
    const text = srcArea.value.trim();
    if (!text) { toast('Nhập văn bản cần dịch', 'error'); return; }
    btnTranslate.disabled = true; btnTranslate.textContent = '⏳ Đang dịch…';
    try {
      dstArea.value = await translate(text, 'en', 'vi');
    } catch (e) {
      toast(e.message, 'error', 5000);
    } finally {
      btnTranslate.disabled = false; btnTranslate.textContent = '🌐 Dịch bằng AI';
    }
  });

  btnGoogle.addEventListener('click', () => {
    const text = encodeURIComponent(srcArea.value.trim());
    if (!text) return;
    window.open(`https://translate.google.com/?sl=en&tl=vi&text=${text}`, '_blank');
  });

  const grid = el('div', { class: 'bilingual-row', style: 'margin-top:1rem' });
  grid.append(
    el('div', { class: 'form-group' }, el('label', {}, '🇬🇧 Tiếng Anh'), srcArea),
    el('div', { class: 'form-group' }, el('label', {}, '🇻🇳 Tiếng Việt'), dstArea),
  );

  container.append(
    grid,
    el('div', { style: 'display:flex;gap:.5rem;margin-top:.75rem' }, btnTranslate, btnGoogle),
  );
}

/* ============================================================
   AI ASSISTANT CHAT
   ============================================================ */
export function renderAssistant(container) {
  container.innerHTML = '';
  container.append(el('h1', {}, '🤖 Trợ lý AI'));

  const messages = getChatHistory();
  const chatWin = el('div', { class: 'chat-window' });
  const chatMsgs = el('div', { class: 'chat-messages' });

  function appendBubble(msg) {
    const bubble = el('div', { class: `chat-bubble ${msg.role}` });
    bubble.textContent = msg.content;
    chatMsgs.append(bubble);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
  }

  for (const m of messages) appendBubble(m);

  const inputEl = el('input', { type: 'text', placeholder: 'Hỏi gì đó về tiếng Anh / IELTS…', class: 'chat-input' });
  const sendBtn = el('button', { class: 'btn' }, 'Gửi');
  const clearBtn = el('button', { class: 'btn secondary sm' }, '🗑️ Xoá lịch sử');

  async function send() {
    const text = inputEl.value.trim();
    if (!text) return;
    const userMsg = { role: 'user', content: text };
    appendChat(userMsg);
    appendBubble(userMsg);
    inputEl.value = '';
    sendBtn.disabled = true;

    const typingBubble = el('div', { class: 'chat-bubble ai' }, '⏳ Đang trả lời…');
    chatMsgs.append(typingBubble);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;

    try {
      const history = getChatHistory().slice(-20);
      const reply = await chat(history);
      typingBubble.remove();
      const aiMsg = { role: 'ai', content: reply };
      appendChat(aiMsg);
      appendBubble(aiMsg);
    } catch (e) {
      typingBubble.textContent = '❌ ' + e.message;
    } finally {
      sendBtn.disabled = false;
    }
  }

  sendBtn.addEventListener('click', send);
  inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
  clearBtn.addEventListener('click', () => confirm('Xoá toàn bộ lịch sử chat?', () => { clearChat(); chatMsgs.innerHTML = ''; }));

  const inputRow = el('div', { class: 'chat-input-row' }, inputEl, sendBtn);
  chatWin.append(chatMsgs, inputRow);
  container.append(chatWin, clearBtn);
}

/* ============================================================
   SETTINGS
   ============================================================ */
export function renderSettings(container) {
  container.innerHTML = '';
  container.append(el('h1', {}, '⚙️ Cấu hình'));

  const settings = getSettings();

  function build() {
    container.innerHTML = '';
    container.append(el('h1', {}, '⚙️ Cấu hình'));

    /* Profile */
    const nameI = el('input', { type: 'text', value: settings.name || '' });
    const bandI = el('input', { type: 'number', value: settings.targetBand || 7, min: '1', max: '9', step: '0.5', style: 'width:80px' });
    const profileCard = el('div', { class: 'card settings-section' });
    profileCard.append(
      el('h3', {}, '👤 Hồ sơ'),
      el('div', { class: 'form-row' },
        el('div', { class: 'form-group' }, el('label', {}, 'Tên'), nameI),
        el('div', { class: 'form-group' }, el('label', {}, 'Band mục tiêu'), bandI),
      ),
      el('button', { class: 'btn sm', style: 'margin-top:.5rem', onclick: () => {
        saveSettings({ ...getSettings(), name: nameI.value.trim(), targetBand: parseFloat(bandI.value) });
        toast('Đã lưu hồ sơ', 'success');
      }}, '💾 Lưu hồ sơ'),
    );
    container.append(profileCard);

    /* AI Provider */
    const aiCard = el('div', { class: 'card settings-section' });
    aiCard.append(el('h3', {}, '🤖 Kết nối AI'));

    const provSel = el('select', { style: 'margin-bottom:1rem' });
    for (const p of PROVIDER_LIST) {
      const opt = el('option', { value: p.id }, p.name);
      if (p.id === settings.aiProvider) opt.selected = true;
      provSel.append(opt);
    }
    provSel.addEventListener('change', () => {
      saveSettings({ ...getSettings(), aiProvider: provSel.value });
      toast('Đã đổi nhà cung cấp AI', 'info');
    });

    aiCard.append(el('div', { class: 'form-group' }, el('label', {}, 'Nhà cung cấp mặc định'), provSel));

    for (const p of PROVIDER_LIST) {
      const keyWrap = el('div', { class: 'form-group key-field', style: 'margin-bottom:.5rem' });
      const keyI = el('input', { type: 'password', placeholder: `${p.name} API Key…` });
      keyI.value = settings.apiKeys?.[p.id] || '';
      const toggleBtn = el('button', { class: 'key-toggle', type: 'button' }, 'Hiện');
      toggleBtn.addEventListener('click', () => {
        keyI.type = keyI.type === 'password' ? 'text' : 'password';
        toggleBtn.textContent = keyI.type === 'password' ? 'Hiện' : 'Ẩn';
      });
      keyI.addEventListener('blur', () => {
        const s = getSettings();
        s.apiKeys = s.apiKeys || {};
        s.apiKeys[p.id] = keyI.value.trim();
        saveSettings(s);
      });
      keyWrap.append(el('label', {}, p.name), keyI, toggleBtn);
      aiCard.append(keyWrap);
    }
    container.append(aiCard);

    /* GitHub backup */
    const ghCard = el('div', { class: 'card settings-section' });
    ghCard.append(el('h3', {}, '🐙 Sao lưu GitHub Gist'));

    const tokenI = el('input', { type: 'password', placeholder: 'GitHub Personal Access Token (quyền gist)…' });
    tokenI.value = settings.githubToken || '';
    const gistI = el('input', { type: 'text', placeholder: 'Gist ID (tuỳ chọn — để trống khi lần đầu)…' });
    gistI.value = settings.githubGistId || '';

    tokenI.addEventListener('blur', () => saveSettings({ ...getSettings(), githubToken: tokenI.value.trim() }));
    gistI.addEventListener('blur',  () => saveSettings({ ...getSettings(), githubGistId: gistI.value.trim() }));

    const backupBtn  = el('button', { class: 'btn sm' }, '☁️ Sao lưu lên Gist');
    const restoreBtn = el('button', { class: 'btn secondary sm' }, '⬇️ Khôi phục từ Gist');

    backupBtn.addEventListener('click', async () => {
      backupBtn.disabled = true;
      try {
        const url = await backupToGist();
        toast('Sao lưu thành công!', 'success');
        window.open(url, '_blank');
        build();
      } catch (e) { toast(e.message, 'error', 5000); }
      finally { backupBtn.disabled = false; }
    });

    restoreBtn.addEventListener('click', () => confirm('Khôi phục sẽ ghi đè dữ liệu hiện tại. Tiếp tục?', async () => {
      try {
        await restoreFromGist();
        toast('Khôi phục thành công! Hãy tải lại trang.', 'success', 6000);
      } catch (e) { toast(e.message, 'error', 5000); }
    }));

    ghCard.append(
      el('div', { class: 'form-group' }, el('label', {}, 'GitHub Token'), tokenI),
      el('div', { class: 'form-group' }, el('label', {}, 'Gist ID'), gistI),
      el('div', { style: 'display:flex;gap:.5rem;margin-top:.5rem' }, backupBtn, restoreBtn),
    );
    container.append(ghCard);

    /* Export / Import */
    const dataCard = el('div', { class: 'card settings-section' });
    dataCard.append(el('h3', {}, '💾 Xuất / Nhập dữ liệu'));

    const exportBtn = el('button', { class: 'btn sm' }, '⬆️ Xuất JSON');
    exportBtn.addEventListener('click', () => {
      const data = exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = el('a', { href: URL.createObjectURL(blob), download: `qhielts_backup_${Date.now()}.json` });
      a.click();
    });

    const importLabel = el('label', { class: 'btn secondary sm', style: 'cursor:pointer' }, '⬇️ Nhập JSON');
    const importFile = el('input', { type: 'file', accept: '.json', style: 'display:none' });
    importFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          importAll(data);
          toast('Nhập dữ liệu thành công! Hãy tải lại trang.', 'success', 5000);
        } catch { toast('File JSON không hợp lệ', 'error'); }
      };
      reader.readAsText(file);
    });
    importLabel.append(importFile);

    dataCard.append(el('div', { style: 'display:flex;gap:.5rem' }, exportBtn, importLabel));
    container.append(dataCard);
  }

  build();
}
