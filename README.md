# MathExam Hub - Ứng Dụng Quản Lý và Tạo Đề Thi Môn Toán Chuẩn Ma Trận

Ứng dụng web Full-Stack hoàn chỉnh phục vụ công tác giảng dạy, quản lý ngân hàng câu hỏi, tự động sinh đề thi môn Toán theo ma trận tư duy (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao), tổ chức thi trắc nghiệm trực tuyến có đếm ngược và in đề thi chuẩn Bộ Giáo Dục & Đào Tạo kèm công thức Toán LaTeX (KaTeX).

---

## 1. Kiến Trúc Hệ Thống (Architecture)

- **Frontend**: React 19, TypeScript, Tailwind CSS, KaTeX (render công thức Toán học mượt mà), Lucide Icons, Canvas Confetti.
- **Backend**: Node.js, Express RESTful API, JSON Web Token (JWT) Authentication, Bcrypt password hashing.
- **Database**: 
  - Đầy đủ sơ đồ quan hệ ANSI SQL (`schema.sql`) tương thích **PostgreSQL** và **SQLite**.
  - Lưu trữ dữ liệu với đầy đủ các bảng: `users`, `questions`, `exams`, `exam_questions`, `exam_sessions`.
- **In ấn & Xuất bản**: 
  - CSS `@media print` chuyên biệt, loại bỏ hoàn toàn các thanh công cụ web, bố cục trang A4 chuẩn format Bộ GD&ĐT.
  - Tích hợp Phiếu trả lời trắc nghiệm chuẩn tô tròn (Bubble Answer Sheet) và Bảng đáp án/Lời giải chi tiết.

---

## 2. Sơ Đồ Cơ Sở Dữ Liệu (Database Schema)

File mã nguồn DDL SQL đầy đủ nằm tại `/schema.sql`:

```sql
-- 1. Bảng tài khoản người dùng
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('teacher', 'student', 'admin')),
    full_name VARCHAR(100) NOT NULL,
    class_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng ngân hàng câu hỏi Toán (Hỗ trợ LaTeX)
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    topic VARCHAR(100) NOT NULL,
    level VARCHAR(30) NOT NULL CHECK (level IN ('nhan_biet', 'thong_hieu', 'van_dung', 'van_dung_cao')),
    content TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng đề thi
CREATE TABLE exams (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    shuffle_options BOOLEAN DEFAULT TRUE,
    shuffle_questions BOOLEAN DEFAULT TRUE,
    matrix_config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng liên kết đề thi và câu hỏi
CREATE TABLE exam_questions (
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    PRIMARY KEY (exam_id, question_id)
);

-- 5. Bảng phiên thi của học sinh
CREATE TABLE exam_sessions (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submit_time TIMESTAMP,
    score NUMERIC(4, 2),
    total_correct INTEGER DEFAULT 0,
    total_questions INTEGER NOT NULL,
    student_answers JSONB,
    status VARCHAR(20) DEFAULT 'in_progress'
);
```

---

## 3. Danh Sách RESTful API Backend

### Xác thực & Tài khoản (Auth)
- `POST /api/auth/login`: Đăng nhập hệ thống (trả về JWT Token và User Info).
- `POST /api/auth/register`: Đăng ký tài khoản (học sinh hoặc giáo viên).
- `GET /api/auth/me`: Lấy thông tin tài khoản đang đăng nhập.

### Ngân hàng câu hỏi (Questions)
- `GET /api/questions`: Lấy danh sách câu hỏi (hỗ trợ lọc theo `topic`, `level`, `search`).
- `GET /api/questions/:id`: Lấy chi tiết một câu hỏi.
- `POST /api/questions`: Thêm câu hỏi mới (yêu cầu quyền Teacher/Admin).
- `PUT /api/questions/:id`: Cập nhật câu hỏi.
- `DELETE /api/questions/:id`: Xóa câu hỏi.

### Đề thi & Ma trận (Exams & Matrix Generator)
- `GET /api/exams`: Danh sách tất cả các đề thi.
- `GET /api/exams/:id`: Chi tiết đề thi và danh sách câu hỏi kèm theo.
- `POST /api/exams/generate-matrix`: Thuật toán tự động rút câu hỏi ngẫu nhiên theo ma trận tư duy (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao) và chủ đề.
- `DELETE /api/exams/:id`: Xóa đề thi.

### Thi trực tuyến & Chấm điểm (Online Examination)
- `POST /api/exams/:id/start-session`: Khởi tạo phòng thi và lượt thi cho học sinh.
- `POST /api/exam-sessions/:id/submit`: Nộp bài thi, tự động chấm điểm trên thang điểm 10 và lưu đáp án.
- `GET /api/exam-sessions`: Lịch sử các lượt thi.
- `GET /api/exam-sessions/:id`: Xem lại chi tiết bài làm, câu đúng/sai và lời giải chi tiết.

### Thống kê & Quản lý (Dashboard & Stats)
- `GET /api/stats/overview`: Thống kê tổng số câu, tổng đề, phổ điểm phân loại học lực (Giỏi, Khá, Trung bình, Yếu).
- `GET /api/students`: Danh sách học sinh, số bài đã thi và điểm trung bình.

---

## 4. Hướng Dẫn Cài Đặt và Chạy Dự Án

### A. Chạy ở môi trường Local (Development)

1. **Yêu cầu môi trường**: Đã cài đặt Node.js (phiên bản 18+ trở lên) và npm.
2. **Cài đặt dependencies**:
   ```bash
   npm install
   ```
3. **Khởi động server phát triển**:
   ```bash
   npm run dev
   ```
4. **Truy cập ứng dụng**:
   Mở trình duyệt và truy cập `http://localhost:3000`.

### Tài khoản mặc định có sẵn để thử nghiệm:
- **Giáo viên**: Tên đăng nhập `giaovien` | Mật khẩu: `123456`
- **Học sinh**: Tên đăng nhập `hocsinh` | Mật khẩu: `123456`
- **Học sinh 2**: Tên đăng nhập `hocsinh2` | Mật khẩu: `123456`

---

### B. Hướng dẫn Deploy lên Cloud

#### 1. Deploy lên Render (Web Service)
1. Tạo tài khoản trên [Render.com](https://render.com).
2. Tạo mới **Web Service**, kết nối với GitHub repository của dự án.
3. Cấu hình cài đặt:
   - **Environment**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
4. Cấu hình biến môi trường (Environment Variables):
   - `PORT`: `3000`
   - `JWT_SECRET`: `your_random_secure_jwt_secret_key`

#### 2. Deploy lên Google Cloud Run / Docker
Dự án đã cấu hình sẵn script build:
```bash
npm run build
```
Lệnh này sẽ biên dịch React frontend vào thư mục `dist/` đồng thời bundle backend Express thành file CommonJS độc lập `dist/server.cjs` thông qua `esbuild`. Sau đó chạy trực tiếp `node dist/server.cjs` mà không cần bất kỳ bước thiết lập phụ trợ nào.

#### 3. Deploy lên Vercel
Có thể cấu hình `vercel.json` định tuyến API vào `server.ts` thông qua Vercel Serverless Functions và thư mục static output `dist`.
