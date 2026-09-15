-- ==============================================================================
-- SƠ ĐỒ CƠ SỞ DỮ LIỆU: HỆ THỐNG QUẢN LÝ VÀ TẠO ĐỀ THI MÔN TOÁN
-- Hỗ trợ: PostgreSQL và SQLite (ANSI SQL tương thích cao)
-- ==============================================================================

-- 1. Bảng người dùng (Users: Giáo viên / Quản trị viên & Học sinh)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('teacher', 'student', 'admin')),
    full_name VARCHAR(100) NOT NULL,
    class_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index cho tra cứu nhanh người dùng
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Bảng ngân hàng câu hỏi môn Toán (Questions)
-- Hỗ trợ lưu trữ LaTeX trong content, options và explanation
-- level: 'nhan_biet' (Nhận biết), 'thong_hieu' (Thông hiểu), 'van_dung' (Vận dụng), 'van_dung_cao' (Vận dụng cao)
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    topic VARCHAR(100) NOT NULL, -- Ví dụ: 'Đại số & Giải tích', 'Hình học không gian', 'Hàm số & Đồ thị'
    level VARCHAR(30) NOT NULL CHECK (level IN ('nhan_biet', 'thong_hieu', 'van_dung', 'van_dung_cao')),
    content TEXT NOT NULL,       -- Chứa công thức LaTeX: $\int f(x)dx$, $\frac{a}{b}$
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    explanation TEXT,            -- Lời giải chi tiết kèm công thức Toán
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
CREATE INDEX IF NOT EXISTS idx_questions_level ON questions(level);

-- 3. Bảng đề thi (Exams)
-- matrix_config lưu cấu trúc ma trận đề (JSON): số lượng câu theo từng mức độ, chủ đề
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    code VARCHAR(20) NOT NULL,            -- Mã đề (ví dụ: TOAN-101)
    duration_minutes INTEGER NOT NULL,    -- Thời gian làm bài (phút)
    shuffle_options BOOLEAN DEFAULT TRUE, -- Trộn thứ tự đáp án
    shuffle_questions BOOLEAN DEFAULT TRUE, -- Trộn thứ tự câu hỏi
    start_time TIMESTAMP,                 -- Thời gian mở đề thi
    end_time TIMESTAMP,                   -- Thời gian đóng đề thi
    matrix_config JSONB,                  -- Cấu hình ma trận tạo đề { nhan_biet: 10, thong_hieu: 10, van_dung: 5, van_dung_cao: 5, topics: [...] }
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng liên kết đề thi và câu hỏi (Exam Questions)
CREATE TABLE IF NOT EXISTS exam_questions (
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,         -- Thứ tự câu hỏi trong đề (1, 2, 3...)
    PRIMARY KEY (exam_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON exam_questions(exam_id, order_index);

-- 5. Bảng lượt thi của học sinh (Exam Sessions)
-- student_answers lưu mảng hoặc object JSON các câu trả lời: { "1": "A", "2": "C" }
CREATE TABLE IF NOT EXISTS exam_sessions (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submit_time TIMESTAMP,
    score NUMERIC(4, 2),                  -- Điểm số thang 10 (ví dụ: 8.50)
    total_correct INTEGER DEFAULT 0,      -- Số câu đúng
    total_questions INTEGER NOT NULL,     -- Tổng số câu
    student_answers JSONB,                -- Chi tiết câu trả lời của thí sinh
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'timed_out'))
);

CREATE INDEX IF NOT EXISTS idx_exam_sessions_student ON exam_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam ON exam_sessions(exam_id);
