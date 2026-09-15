import React, { useState } from 'react';
import { Database, Cloud, Terminal, Copy, Check, ExternalLink } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const sqlCode = `-- SƠ ĐỒ CSDL (PostgreSQL / SQLite)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('teacher', 'student', 'admin')),
    full_name VARCHAR(100) NOT NULL,
    class_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE exam_questions (
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    PRIMARY KEY (exam_id, question_id)
);

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
);`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Sơ Đồ CSDL & Hướng Dẫn Chạy Dự Án</h2>
              <p className="text-xs text-slate-500">Tài liệu kiến trúc Full-Stack cho Nhà phát triển & Giáo viên</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
          >
            &times;
          </button>
        </div>

        <div className="overflow-y-auto space-y-6 pr-2 py-4 text-sm text-slate-700">
          {/* Section 1: SQL Schema */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                1. Sơ đồ CSDL Chi Tiết (PostgreSQL / SQLite)
              </h3>
              <button
                onClick={() => copyToClipboard(sqlCode, 'sql')}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
              >
                {copiedSection === 'sql' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSection === 'sql' ? 'Đã sao chép' : 'Sao chép SQL'}
              </button>
            </div>
            <div className="bg-slate-950 text-slate-200 rounded-xl p-3.5 font-mono text-xs overflow-x-auto max-h-56">
              <pre>{sqlCode}</pre>
            </div>
          </div>

          {/* Section 2: Run Local */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-600" />
              2. Cách Chạy Dự Án Tại Môi Trường Local
            </h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
              <p className="text-slate-500 font-sans"># Bước 1: Cài đặt các thư viện cần thiết</p>
              <div className="bg-white p-2 rounded border border-slate-200 text-slate-900">
                npm install
              </div>
              <p className="text-slate-500 font-sans"># Bước 2: Khởi động máy chủ Full-Stack (Express + Vite)</p>
              <div className="bg-white p-2 rounded border border-slate-200 text-slate-900">
                npm run dev
              </div>
              <p className="text-slate-500 font-sans"># Mở trình duyệt truy cập: http://localhost:3000</p>
            </div>
          </div>

          {/* Section 3: Deploy Cloud */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-indigo-600" />
              3. Hướng Dẫn Deploy Lên Cloud (Render / Cloud Run / Vercel)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-900">A. Deploy lên Render (Web Service)</div>
                <p className="text-slate-600">
                  - <strong>Build Command:</strong> <code className="bg-slate-200 px-1 py-0.5 rounded">npm run build</code>
                </p>
                <p className="text-slate-600">
                  - <strong>Start Command:</strong> <code className="bg-slate-200 px-1 py-0.5 rounded">npm start</code>
                </p>
                <p className="text-slate-600">
                  - Đặt biến môi trường: <code className="bg-slate-200 px-1 py-0.5 rounded">PORT=3000</code>, <code className="bg-slate-200 px-1 py-0.5 rounded">JWT_SECRET=your-secret</code>
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-900">B. Deploy qua Docker / Cloud Run</div>
                <p className="text-slate-600">
                  - Container tự động biên dịch backend bundle <code className="bg-slate-200 px-1 py-0.5 rounded">dist/server.cjs</code> và static files React.
                </p>
                <p className="text-slate-600">
                  - Phù hợp triển khai trên Google Cloud Run, AWS ECS, hoặc DigitalOcean App Platform.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
