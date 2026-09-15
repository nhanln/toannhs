import React, { useState } from 'react';
import { StudentRecord } from '../../types.js';
import {
  FileText,
  Copy,
  Check,
  Printer,
  X,
  GraduationCap,
  Download,
  KeyRound
} from 'lucide-react';

interface StudentCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentRecord[];
}

export const StudentCredentialsModal: React.FC<StudentCredentialsModalProps> = ({
  isOpen,
  onClose,
  students
}) => {
  const [copied, setCopied] = useState(false);
  const [filterClass, setFilterClass] = useState('all');

  if (!isOpen) return null;

  const classes = Array.from(new Set(students.map(s => s.className || '12A1')));
  const filtered = filterClass === 'all' ? students : students.filter(s => s.className === filterClass);

  const handleCopy = () => {
    const lines = filtered.map(
      (s, idx) =>
        `${idx + 1}. Họ tên: ${s.fullName} | Lớp: ${s.className || '12A1'} | Mã đăng nhập: ${s.username} | Mật khẩu: 123456 (hoặc đã đổi)`
    );
    const content = `DANH SÁCH TÀI KHOẢN HỌC SINH - MATHEM HUB\n` + lines.join('\n');
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Danh Sách Thẻ Tài Khoản Học Sinh
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Sao chép hoặc in phiếu thông tin đăng nhập để phát cho học sinh trong lớp.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Lọc theo lớp:</span>
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả ({students.length} học sinh)</option>
              {classes.map(c => (
                <option key={c} value={c}>
                  Lớp {c} ({students.filter(s => s.className === c).length})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Đã sao chép!' : 'Sao chép văn bản'}
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              In phiếu phát lớp
            </button>
          </div>
        </div>

        {/* Slips Grid */}
        <div className="p-6 max-h-[65vh] overflow-y-auto bg-slate-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((s, idx) => (
              <div
                key={s.id}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{s.fullName}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                    Lớp {s.className || '12A1'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Mã / Tên đăng nhập:</span>
                    <span className="font-mono font-bold text-indigo-600">{s.username}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Mật khẩu ban đầu:</span>
                    <span className="font-mono font-bold text-slate-800">123456</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Cổng đăng nhập:</span>
                    <span className="font-medium text-slate-600">MathExam Hub &bull; Cổng Học Sinh</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">
              Không có học sinh nào trong lớp đã chọn.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between no-print">
          <span className="text-xs text-slate-500">
            Tổng cộng: <b>{filtered.length}</b> tài khoản học sinh
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
