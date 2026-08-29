# ⛪ Hệ Thống Quản Lý Giáo Lý — Giáo Xứ Sơn Lộc (GLY)

Hệ thống quản lý giáo lý toàn diện dành cho **Ban Điều Hành (Admin)**, **Giáo Lý Viên (GLV)** và **Phụ Huynh** với kiến trúc phân tách Monorepo: Frontend React + Backend NestJS + Cơ sở dữ liệu PostgreSQL (Prisma ORM).

---

## 📁 Cấu Trúc Dự Án

```
GLY/
├── frontend/             # Giao diện người dùng (React, TypeScript, TailwindCSS, Vite)
├── backend/              # Máy chủ API (NestJS, TypeScript, Prisma ORM, PostgreSQL)
└── package.json          # Root runner scripts
```

---

## 🚀 Hướng Dẫn Chạy Dự Án

### 1. Khởi chạy Frontend (React Vite)
```bash
cd frontend
npm install
npm run dev
```
🌐 Giao diện web chạy tại: **`http://localhost:5173`**

---

### 2. Cấu hình & Khởi chạy Backend (NestJS + PostgreSQL)

#### Bước 2.1: Cấu hình biến môi trường (`backend/.env`)
Mở file `backend/.env` và cập nhật đường dẫn kết nối PostgreSQL của bạn (Local hoặc Supabase):
```env
# Ví dụ PostgreSQL local:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gly_db?schema=public"

# Hoặc link kết nối Supabase Cloud:
# DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

JWT_SECRET="gly_sonloc_secret_key_2026_super_secure_key"
PORT=3000
```

#### Bước 2.2: Đồng bộ cấu trúc Database & Nạp dữ liệu mẫu
```bash
cd backend

# Tạo các bảng trong PostgreSQL
npx prisma migrate dev --name init

# Nạp dữ liệu mẫu 25 lớp, học sinh & điểm số chuẩn
npm run prisma:seed
```

#### Bước 2.3: Khởi chạy Backend Server
```bash
npm run start:dev
```
🚀 Backend API chạy tại: **`http://localhost:3000`**  
📖 Xem tài liệu Swagger API trực quan tại: **`http://localhost:3000/api/docs`**

---

## 🔑 Tài Khoản Đăng Nhập Mẫu (Seed Data)

| Vai trò | Email đăng nhập | Mật khẩu | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin.giaoly@gxsonloc.vn` | `admin123` | Quản lý toàn bộ 25 lớp, thêm/sửa hồ sơ học sinh, xuất Excel |
| **Giáo Lý Viên** | `tuyetmai.glv@gxsonloc.vn` | `glv123` | Tổng quan lớp, nhập điểm HK1/HK2/Cả năm, điểm danh |
| **Phụ Huynh** | `hung.nguyen@gmail.com` | `parent123` | Xem học bạ, điểm số chi tiết, xếp hạng, hồ sơ bí tích |

---

## 🛠️ Công Nghệ Sử Dụng
- **Frontend**: React 18, TypeScript, TailwindCSS, Lucide Icons, React Router DOM v7.
- **Backend**: NestJS 10, TypeScript, Prisma ORM 6, JWT, Passport, Bcrypt, Class-validator, Swagger OpenAPI.
- **Database**: PostgreSQL (Tương thích 100% Supabase / Neon / Local).
