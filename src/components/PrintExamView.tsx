import React, { useState, useEffect } from 'react';
import { Exam, Question } from '../types.js';
import { api } from '../services/api.js';
import { MathView } from './MathView.js';
import { Printer, ArrowLeft, CheckSquare, FileText, Settings, Download } from 'lucide-react';

interface PrintExamViewProps {
  examId: number;
  onBack: () => void;
}

export const PrintExamView: React.FC<PrintExamViewProps> = ({ examId, onBack }) => {
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

  // Print customization options
  const [schoolName, setSchoolName] = useState('SỞ GIÁO DỤC VÀ ĐÀO TẠO');
  const [examCategory, setExamCategory] = useState('KỲ THI KHẢO SÁT CHẤT LƯỢNG MÔN TOÁN');
  const [includeBubbleSheet, setIncludeBubbleSheet] = useState(true);
  const [includeSolutions, setIncludeSolutions] = useState(false);
  const [twoColumnOptions, setTwoColumnOptions] = useState(true);

  useEffect(() => {
    loadExam();
  }, [examId]);

  const loadExam = async () => {
    try {
      setLoading(true);
      const res = await api.getExam(examId);
      setExam(res.exam);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // KaTeX is already rendered in DOM synchronously
    window.print();
  };

  if (loading || !exam) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
        <p className="text-sm text-slate-500">Đang khởi tạo bản in chuẩn và công thức Toán...</p>
      </div>
    );
  }

  const questions = exam.questions || [];

  return (
    <div className="space-y-6">
      {/* Top Controls Toolbar (Hidden during printing via .no-print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              title="Quay lại"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Xem Trước Bản In & Xuất PDF (Chuẩn Bộ GD&ĐT)
              </h1>
              <p className="text-xs text-slate-500">
                Mã đề: <strong className="font-mono text-indigo-700">{exam.code}</strong> &bull; {questions.length} câu hỏi trắc nghiệm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              In Đề / Lưu PDF (Ctrl+P)
            </button>
          </div>
        </div>

        {/* Print Configuration Controls */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Đơn vị chủ quản / Trường</label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Tên kỳ thi</label>
            <input
              type="text"
              value={examCategory}
              onChange={(e) => setExamCategory(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
            />
          </div>

          <div className="flex items-center gap-2 pt-5">
            <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeBubbleSheet}
                onChange={(e) => setIncludeBubbleSheet(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              In kèm Phiếu trả lời trắc nghiệm
            </label>
          </div>

          <div className="flex items-center gap-2 pt-5">
            <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSolutions}
                onChange={(e) => setIncludeSolutions(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              In kèm Bảng Đáp án & Lời giải
            </label>
          </div>
        </div>
      </div>

      {/* Actual Printable Document Container (A4 styling) */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-md max-w-4xl mx-auto print:max-w-full print:p-0 print:border-none print:shadow-none font-serif text-slate-900 print:text-black">
        {/* Formal Exam Header (Chuẩn Bộ GD&ĐT) */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-center items-center">
            {/* Left Header Box */}
            <div className="border-r border-slate-300 print:border-black pr-3">
              <div className="font-bold text-xs uppercase tracking-wider">{schoolName}</div>
              <div className="font-extrabold text-sm uppercase mt-0.5">{examCategory}</div>
              <div className="text-xs italic mt-1">(Đề thi có {questions.length} câu trắc nghiệm)</div>
            </div>

            {/* Right Header Box */}
            <div className="pl-3">
              <div className="font-extrabold text-sm uppercase tracking-wide">BÀI THI MÔN TOÁN</div>
              <div className="text-xs font-semibold mt-0.5">Thời gian làm bài: {exam.durationMinutes} phút</div>
              <div className="text-xs font-bold font-mono mt-1 text-indigo-900 print:text-black">
                MÃ ĐỀ THI: {exam.code}
              </div>
            </div>
          </div>

          {/* Candidate Info Box */}
          <div className="mt-4 pt-3 border-t border-slate-300 print:border-black grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>Họ và tên thí sinh: .................................</div>
            <div>Lớp: .........................</div>
            <div>Số báo danh: .....................</div>
            <div>Phòng thi: ....................</div>
          </div>
        </div>

        {/* Section 1: Questions */}
        <div className="space-y-4 text-sm leading-relaxed">
          {questions.map((q, idx) => (
            <div key={q.id} className="avoid-break pb-3 border-b border-dashed border-slate-200 print:border-slate-400">
              {/* Question prompt */}
              <div className="font-medium text-slate-900 print:text-black mb-2 flex items-start gap-1.5">
                <span className="font-bold shrink-0">Câu {idx + 1}:</span>
                <div className="flex-1">
                  <MathView content={q.content} />
                </div>
              </div>

              {/* 4 Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-1.5 text-xs pl-5">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                  <div key={opt} className="flex items-start gap-1">
                    <span className="font-bold">{opt}.</span>
                    <div className="flex-1">
                      <MathView content={q[`option${opt}` as keyof Question] as string} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Exam Footer Signatures */}
        <div className="avoid-break mt-8 pt-4 border-t border-black text-center text-xs italic">
          <p className="font-bold not-italic">---------- HẾT ----------</p>
          <p className="mt-1 text-slate-600 print:text-black">
            Cán bộ coi thi không giải thích gì thêm. Thí sinh không được sử dụng tài liệu.
          </p>
        </div>

        {/* Optional Section 2: Answer Bubble Sheet (Phiếu trả lời trắc nghiệm) */}
        {includeBubbleSheet && (
          <div className="page-break mt-12 pt-8 border-t-2 border-dashed border-slate-400 print:border-black avoid-break">
            <div className="text-center mb-6">
              <h2 className="text-base font-extrabold uppercase">PHIẾU TRẢ LỜI TRẮC NGHIỆM MÔN TOÁN</h2>
              <p className="text-xs italic text-slate-600 print:text-black">
                (Dành cho thí sinh tô tròn bằng bút chì 2B vào ô đáp án tương ứng)
              </p>
            </div>

            {/* Bubble Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="border border-slate-300 print:border-black p-2 rounded-sm flex items-center justify-between"
                >
                  <span className="font-bold text-slate-800 print:text-black">C{idx + 1}</span>
                  <div className="flex items-center gap-1.5">
                    {(['A', 'B', 'C', 'D'] as const).map((letter) => (
                      <span
                        key={letter}
                        className="w-5 h-5 rounded-full border border-slate-400 print:border-black flex items-center justify-center font-bold text-[10px]"
                      >
                        {letter}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optional Section 3: Answer Key & Detailed Solutions for Teachers */}
        {includeSolutions && (
          <div className="page-break mt-12 pt-8 border-t-2 border-black avoid-break">
            <div className="text-center mb-6">
              <h2 className="text-base font-extrabold uppercase">BẢNG ĐÁP ÁN & LỜI GIẢI CHI TIẾT</h2>
              <p className="text-xs font-mono">MÃ ĐỀ: {exam.code}</p>
            </div>

            {/* Quick Answer Key Matrix */}
            <div className="mb-8 p-3 bg-slate-50 print:bg-transparent border border-black rounded-lg">
              <div className="font-bold text-xs uppercase mb-2 text-center">Bảng Đáp Án Nhanh</div>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 text-xs text-center">
                {questions.map((q, idx) => (
                  <div key={q.id} className="border border-slate-200 print:border-black p-1">
                    <span className="text-[10px] text-slate-500 block">{idx + 1}</span>
                    <strong className="text-indigo-900 print:text-black text-sm">{q.correctOption}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Explanations */}
            <div className="space-y-4 text-xs">
              <div className="font-bold uppercase text-slate-700 border-b pb-1">Hướng Dẫn Giải Chi Tiết</div>
              {questions.map((q, idx) => (
                <div key={q.id} className="avoid-break p-3 bg-slate-50/50 print:bg-transparent rounded-lg border border-slate-200 print:border-slate-400">
                  <div className="font-bold text-slate-900 mb-1">
                    Câu {idx + 1} - Đáp án đúng: <span className="text-emerald-700 font-extrabold">{q.correctOption}</span>
                  </div>
                  <div className="text-slate-700 print:text-black leading-relaxed">
                    <MathView content={q.explanation || 'Áp dụng công thức lý thuyết cơ bản.'} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
