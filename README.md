# Chung Sức (Family Feud) - Web Game Night

Ứng dụng web Game Show **Chung Sức (Family Feud)** xây dựng bằng React, TypeScript và Tailwind CSS dành cho các buổi Game Night, tiệc gia đình, bạn bè hoặc team building.

---

## 🚀 Cách chạy ứng dụng

1. **Cài đặt thư viện (nếu chưa cài)**:
   ```bash
   npm install
   ```

2. **Chạy máy chủ phát triển (Dev Server)**:
   ```bash
   npm run dev
   ```
   Mở trình duyệt tại đường dẫn `http://localhost:5173`.

---

## 🌟 Các tính năng nổi bật

### 1. Quản lý & Thêm câu hỏi cực kỳ dễ dàng
- **Giao diện trực quan (Visual Editor)**: Bấm vào tab **Quản Lý Câu Hỏi** để thêm, sửa, xóa câu hỏi, đặt hệ số nhân điểm (x1, x2, x3) và số điểm từng đáp án (tổng ~100 điểm).
- **Xuất / Nhập JSON (Import / Export)**:
  - Bấm **Tải File JSON** để lưu trữ bộ câu hỏi ra máy tính.
  - Bấm **Nạp File JSON** để tải tệp câu hỏi của bạn lên web.
  - Hoặc dán trực tiếp mã JSON vào tab **Soạn Mã JSON Trực Tiếp**.
- Tích hợp sẵn tệp mẫu [`sample_questions.json`](./sample_questions.json) và bộ câu hỏi mẫu tiếng Việt cực vui.

### 2. Chế độ 2 Màn hình chuyên nghiệp (TV / Máy chiếu / Zoom)
- **Tab 1: Màn hình Game (Chiếu TV)**: Chiếu lên màn hình TV, máy chiếu, hoặc chia sẻ màn hình qua Zoom/Discord. Người chơi chỉ thấy các ô số bí mật, điểm tích lũy và bảng điểm 2 đội.
- **Tab 2: Bảng điều khiển MC (Host)**: Dành riêng cho người dẫn chương trình xem trước mọi đáp án, bấm lật từng câu, bấm sai (+1X, +2X, +3X), gán quyền chơi và trao điểm tích lũy.
- Hai màn hình **tự động đồng bộ thời gian thực** thông qua `BroadcastChannel API` (không cần cấu hình mạng).

### 3. Vòng Đặc Biệt (Fast Money)
- Dành cho 2 người chơi đại diện của đội chiến thắng.
- 5 câu hỏi nhanh với đồng hồ đếm ngược 20 giây (Người 1) và 25 giây (Người 2).
- Tự động phát hiện và cảnh báo nếu Người 2 trả lời trùng đáp án với Người 1.
- Hiệu ứng pháo hoa ăn mừng khi tổng điểm đạt mốc **200 điểm**.

### 4. Bấm chuông giành quyền (Face-off Buzzer)
- 2 đội có thể bấm chuông trên màn hình hoặc dùng phím tắt để xem ai bấm nhanh hơn đến từng mili-giây.

---

## ⌨️ Bảng Phím Tắt Nhanh

| Phím tắt | Chức năng |
| :--- | :--- |
| **`1` - `8`** | Lật mở / Ẩn đáp án từ ô số 1 đến 8 |
| **`X`** | Bấm sai (Thêm 1 dấu X và âm thanh Buzz) |
| **`N`** / **`P`** | Chuyển Vòng tiếp theo (`N`) / Vòng trước (`P`) |
| **`Space`** | Bật / Tắt Mic nhận diện giọng nói (hoặc đặt lại chuông bấm) |
| **`A`** hoặc **`Z`** | Chuông bấm Đội Đỏ (Team A) |
| **`L`** hoặc **`M`** | Chuông bấm Đội Xanh (Team B) |

