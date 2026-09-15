import React, { useState } from 'react';
import { StudentRecord } from '../../types.js';
import { api } from '../../services/api.js';
import {
  Edit3,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck
} from 'lucide-react';

interface EditStudentModalProps {
  student: StudentRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingClasses: string[];
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  student,
  isOpen,
  onClose,
  onSuccess,
  existingClasses
}) => {
  if (!isOpen || !student) return null;

  const [fullName, setFullName] = useState(student.fullName);
  const [className, setClassName] = useState(student.className);
  const [username, setUsername] = useState(student.username);
  const [newPassword, setNewPassword] = useState('');
  const [resetToDefault, setResetToDefault] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const updatePayload: {
      fullName?: string;
      className?: string;
      username?: string;
      password?: string;
    } = {
      fullName: fullName.trim(),
      className: className.trim(),
      username: username.trim()
    };

    if (resetToDefault) {
      updatePayload.password = '123456';
    } else if (newPassword.trim()) {
      updatePayload.password = newPassword.trim();
    }

    try {
      setLoading(true);
      await api.updateStudent(student.id, updatePayload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi cập nhật tài khoản học sinh.');
    } finally {
      setLoading(false);
    }
  };

  const copyStudentInfo = () => {
    const text = `Tài khoản học sinh: ${student.fullName} | Lớp: ${className} | Tên đăng nhập: ${username} | Mật khẩu: ${
      resetToDefault ? '123456' : newPassword.trim() || '(Không đổi)'
    }`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full my-8 shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Chỉnh Sửa Tài Khoản Học Sinh
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cập nhật họ tên, lớp học hoặc đặt lại mật khẩu cho học sinh.
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Họ và tên học sinh <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lớp học <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={className}
                onChange={e => setClassName(e.target.value)}
                placeholder="12A1"
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên đăng nhập <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                className="w-full font-mono text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Password Reset Section */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/70 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                Đặt lại Mật khẩu cho học sinh
              </span>

              <button
                type="button"
                onClick={() => {
                  setResetToDefault(true);
                  setNewPassword('123456');
                }}
                className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 bg-white px-2 py-1 rounded-md border border-amber-300"
              >
                Đặt về mặc định (123456)
              </button>
            </div>

            <div>
              <input
                type="text"
                value={newPassword}
                onChange={e => {
                  setNewPassword(e.target.value);
                  setResetToDefault(false);
                }}
                placeholder="Để trống nếu không đổi mật khẩu..."
                className="w-full font-mono text-xs border border-amber-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-amber-800 mt-1">
                Nếu học sinh quên mật khẩu, nhập mật khẩu mới tại đây để cấp lại cho học sinh.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={copyStudentInfo}
              className="text-xs px-3 py-2 text-slate-600 hover:text-slate-900 font-medium rounded-xl hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Đã copy thông tin
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Sao chép thông tin
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-all shadow-xs flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
