# 📮 Hướng Dẫn Sử Dụng Postman Để Test Toàn Bộ API GLY

Tôi đã chuẩn bị sẵn bộ sưu tập **Postman Collection & Environment** với đầy đủ các request có kèm mã JavaScript tự động bắt và lưu JWT Token.

---

## 📥 Bước 1: Import vào Postman (Chỉ mất 10 giây)

1. Mở ứng dụng **Postman** trên máy tính của bạn.
2. Bấm vào nút **Import** (ở góc trên bên trái Postman).
3. Chọn hoặc kéo thả 2 file sau trong thư mục `backend/postman/`:
   - 📄 [`GLY_Postman_Collection.json`](file:///c:/Users/LENOVO/Documents/Github/GLY/backend/postman/GLY_Postman_Collection.json) *(Tập hợp tất cả API)*
   - 📄 [`GLY_Local_Environment.json`](file:///c:/Users/LENOVO/Documents/Github/GLY/backend/postman/GLY_Local_Environment.json) *(Biến môi trường URL & Token)*
4. Ở góc trên bên phải Postman, chọn Environment là: **`GLY Local Environment`**.

---

## ⚡ Bước 2: Bật Server Backend

Đảm bảo Backend NestJS đang chạy:
```bash
cd backend
npm run start:dev
```
*(Server sẵn sàng tại `http://localhost:3000`)*

---

## 🧪 Bước 3: Luồng Kiểm Thử Khuyến Nghị (Test Flow)

### 1️⃣ Đăng nhập lấy Token tự động
1. Mở thư mục **`🔐 1. Auth`** -> Chọn request **`Đăng nhập Admin`** (hoặc `Đăng nhập GLV`).
2. Bấm **Send**.
3. 👉 *Hệ thống sẽ trả về mã `accessToken` và mã script trong Postman sẽ **tự động lưu Token** này vào biến `{{jwt_token}}` để dùng cho tất cả các API cần đăng nhập phía sau (bạn không cần copy paste thủ công!)*.

---

### 2️⃣ Test Lấy Hồ Sơ Đang Đăng Nhập
- Chọn request **`Lấy thông tin tài khoản hiện tại (Profile)`** -> Bấm **Send**.
- Kết quả: Trả về thông tin Admin / GLV cùng lớp phụ trách.

---

### 3️⃣ Test Quản Lý Lớp Học & Sĩ Số
- Mở **`🏫 2. Classes`**:
  - `Lấy danh sách tất cả lớp học` -> Trả về 25 lớp kèm sĩ số `studentCount` tự động đếm.
  - `Lọc lớp theo Ca Sáng / Ca Tối` (`?session=SANG` / `?session=TOI`).
  - `Lấy chi tiết 1 lớp học (cls-kt1)` -> Trả về thông tin lớp + danh sách học sinh và điểm số.

---

### 4️⃣ Test Học Sinh & Hồ Sơ Bí Tích
- Mở **`👦 3. Students`**:
  - `Lọc học sinh theo lớp (classId=cls-kt1)`.
  - `Tìm kiếm học sinh theo Tên hoặc SĐT` (`?search=Mai Lan`).
  - `Lấy chi tiết hồ sơ & học bạ học sinh (std-001)` -> Trả về ngày Rửa Tội, Rước Lễ, Thêm Sức, Điểm HK1/HK2/Cả năm, lịch sử chuyên cần.
  - `Thêm học sinh mới vào lớp` -> Tạo học sinh mới và tự động sinh bản ghi điểm ban đầu.

---

### 5️⃣ Test Nhập Điểm Hàng Loạt & Tự Động Xếp Hạng
- Mở **`📊 4. Grades`**:
  - Chọn **`Lấy bảng điểm của cả lớp (cls-kt1)`** -> Xem các cột điểm và thứ hạng 🥇 🥈 🥉.
  - Chọn **`Lưu bảng điểm hàng loạt (Batch Update)`** -> Thử đổi điểm `hk1_thi` hoặc `hk2_thi` rồi bấm **Send**.
  - 👉 Hệ thống Backend NestJS sẽ tự động tính toán lại:
    - `TB HK1 = ((TX1 + TX2) / 2 + Thi) / 2`
    - `TB HK2 = ((TX1 + TX2) / 2 + Thi) / 2`
    - `TB Cả Năm = (TB HK1 + TB HK2) / 2`
    - Tự động gán lại thứ hạng `hk1_rank`, `hk2_rank`, `cn_rank` và kết quả `Lên lớp`.

---

## 🌐 Hoặc Test Trực Tiếp Bằng Trình Duyệt Qua Swagger UI

Nếu bạn không muốn mở Postman, bạn có thể mở thẳng trình duyệt vào địa chỉ:
👉 **`http://localhost:3000/api/docs`**

Giao diện Swagger cho phép bạn bấm nút **"Try it out"**, nhập dữ liệu và xem kết quả trả về ngay trên trình duyệt mà không cần cài đặt bất kỳ phần mềm nào.
