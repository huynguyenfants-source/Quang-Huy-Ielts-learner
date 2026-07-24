# Quang Huy · 

Ứng dụng web **học tiếng Anh cá nhân** cho Quang Huy — đủ **4 kỹ năng Nghe · Nói · Đọc · Viết**, có **chấm – chữa – gợi ý sửa**, phân tích điểm yếu và nhiều công cụ hữu ích. Toàn bộ chạy ngay trên trình duyệt, **dữ liệu lưu trên máy bạn**, và **bạn có thể tự sửa dễ dàng**.

> 🌐 Mở `index.html` bằng trình duyệt là dùng được ngay (khuyến nghị chạy qua một web server tĩnh để một số tính năng nhúng hoạt động tốt nhất).

## ✨ Tính năng

| Nhóm | Tính năng |
| --- | --- |
| **4 kỹ năng** | Writing (viết + chấm band + bản sửa), Reading & Listening (quiz tự chấm, Listening đọc bằng giọng máy), Speaking (nhận diện giọng nói + phản hồi) |
| **Chấm & chữa** | Chấm nhanh **offline** (heuristic: lỗi ngữ pháp/chính tả/giới từ, ước tính band, bản sửa dạng diff) hoặc **chấm bằng AI** chi tiết |
| **Thi thử IELTS** | Giao diện phòng thi có **đồng hồ đếm ngược** (kiểu YouPass) cho Reading/Listening/Writing |
| **Từ vựng** | Sổ tay từ vựng + tra từ với **video YouGlish** (phát âm người bản xứ) và **từ điển Cambridge** (nhúng/liên kết) |
| **Điểm yếu** | Bảng phân tích band theo kỹ năng, **kế hoạch cải thiện** dựa trên lỗi hay gặp |
| **Lỗi hay gặp** | Ghi & quản lý lỗi, hệ thống nhắc để tránh lặp lại |
| **Tài liệu** | Thêm/sửa tài liệu kiến thức, ghi chú nhanh |
| **Ảnh & OCR** | Tải ảnh (đề, sách, ghi chú) → AI đọc chữ, sửa lỗi, giải thích từ |
| **Song ngữ** | Dịch song song Anh–Việt (kiểu Glot) bằng AI hoặc Google Dịch |
| **Trợ lý AI** | Chat hỏi đáp tiếng Anh |
| **Tích hợp AI** | Gemini · ChatGPT (OpenAI) · Claude (Anthropic) · Perplexity |
| **GitHub** | Sao lưu & khôi phục dữ liệu qua Gist riêng tư |
| **Cá nhân hoá** | Giao diện sáng/tối, hồ sơ & mục tiêu band, xuất/nhập JSON |

## 🚀 Chạy ứng dụng

```bash
# Cách 1: mở trực tiếp
open index.html            # hoặc double-click index.html

# Cách 2: chạy web server tĩnh (khuyến nghị)
python3 -m http.server 8080
# rồi mở http://localhost:8080
```

Có thể deploy miễn phí bằng **GitHub Pages** (Settings → Pages → nhánh chính, thư mục `/root`).

## 🔑 Kết nối tài khoản AI

Vào **Cấu hình → Kết nối AI**, dán API key của bạn (chỉ lưu trên máy, gửi thẳng tới nhà cung cấp):

- **Gemini**: https://aistudio.google.com/apikey
- **OpenAI (ChatGPT)**: https://platform.openai.com/api-keys
- **Claude (Anthropic)**: https://console.anthropic.com/
- **Perplexity**: https://www.perplexity.ai/settings/api
- **GitHub** (sao lưu): tạo Personal Access Token với quyền `gist`

Nếu chưa có key, phần **chấm Writing / Speaking vẫn hoạt động** ở chế độ offline (heuristic).

## 🛠️ Cấu trúc & cách chỉnh sửa

Mọi thứ là HTML/CSS/JS thuần, không cần build:

```
index.html                     # khung trang
assets/css/styles.css          # giao diện (đổi màu ở phần :root)
assets/js/
  app.js                       # điều hướng (thêm/bớt trang ở mảng ROUTES)
  store.js                     # lưu dữ liệu (localStorage)
  content.js                   # nội dung mẫu: đề, bài đọc, bài nghe, từ vựng…
  grammar.js                   # bộ chấm Writing offline (thêm luật vào RULES)
  ai.js                        # tích hợp các nhà cung cấp AI
  utils.js                     # tiện ích DOM
  views/skills.js              # Dashboard, Writing, Reading, Listening, Speaking, Mock
  views/library.js             # Vocab, Mistakes, Docs, Images, Bilingual, Assistant, Settings
```

- **Thêm đề/bài học**: sửa `assets/js/content.js` hoặc thêm ngay trong app (nút “＋”).
- **Đổi giao diện**: chỉnh biến màu trong `:root` của `styles.css`.
- **Thêm luật chấm**: thêm dòng vào mảng `RULES` trong `grammar.js`.
- **Thêm trang mới**: viết hàm view rồi khai báo trong `ROUTES` ở `app.js`.

## 📌 Lưu ý

- **Nhận diện giọng nói** (Speaking) và **đọc văn bản** dùng Web Speech API — hoạt động tốt nhất trên **Chrome/Edge**.
- Nội dung **Cambridge Dictionary** và video **YouGlish** được **nhúng/liên kết tới nguồn chính thức** (không sao chép nội dung có bản quyền vào ứng dụng).
- Dữ liệu chỉ nằm trong trình duyệt của bạn; hãy dùng **Xuất JSON** hoặc **sao lưu GitHub** để không mất dữ liệu.
