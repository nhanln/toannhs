import React, { useState } from 'react';
import { StudentCreatePayload, StudentRecord } from '../../types.js';
import { api } from '../../services/api.js';
import {
  UserPlus,
  Users,
  Sparkles,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  Copy,
  Check,
  KeyRound,
  ShieldCheck
} from 'lucide-react';

interface CreateStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdCount: number) => void;
  existingClasses: string[];
}

export const CreateStudentModal: React.FC<CreateStudentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingClasses
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'pattern' | 'paste'>('single');

  // Single student form
  const [fullName, setFullName] = useState('');
  const [className, setClassName] = useState(existingClasses[0] || '12A1');
  const [customClass, setCustomClass] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123456');

  // Pattern / Bulk generator form
  const [bulkClass, setBulkClass] = useState(existingClasses[0] || '12A1');
  const [bulkPrefix, setBulkPrefix] = useState('hs12a1_');
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkPassword, setBulkPassword] = useState('123456');

  // Paste text form
  const [pasteText, setPasteText] = useState('');
  const [pasteDefaultClass, setPasteDefaultClass] = useState(existingClasses[0] || '12A1');
  const [pasteDefaultPassword, setPasteDefaultPassword] = useState('123456');

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    count: number;
    accounts: Array<{ fullName: string; username: string; password?: string; className: string }>;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Auto-generate username from fullName and className
  const handleAutoSuggestUsername = () => {
    if (!fullName.trim()) return;
    const cleanName = fullName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]/g, '');

    const selectedCls = (className === '__new__' ? customClass : className)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    const randomSuffix = Math.floor(10 + Math.random() * 90);
    setUsername(`${cleanName}_${selectedCls || '12'}_${randomSuffix}`);
  };

  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const targetClass = className === '__new__' ? customClass.trim() : className.trim();
    if (!targetClass) {
      setError('Vui lòng nhập hoặc chọn lớp học.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.createStudent({
        fullName: fullName.trim(),
        username: username.trim(),
        className: targetClass,
        password: password.trim() || '123456'
      });

      setSuccessInfo({
        count: 1,
        accounts: [
          {
            fullName: res.student.fullName,
            username: res.student.username,
            password: password.trim() || '123456',
            className: res.student.className
          }
        ]
      });
      onSuccess(1);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo tài khoản học sinh.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePattern = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (bulkCount < 1 || bulkCount > 50) {
      setError('Số lượng tài khoản tạo theo mẫu từ 1 đến 50 học sinh.');
      return;
    }

    const students: StudentCreatePayload[] = [];
    const accountsForPreview: Array<{ fullName: string; username: string; password?: string; className: string }> = [];

    for (let i = 1; i <= bulkCount; i++) {
      const idxStr = i < 10 ? `0${i}` : `${i}`;
      const uname = `${bulkPrefix.trim()}${idxStr}`;
      const name = `Học Sinh ${bulkClass} - Số ${idxStr}`;
      const pwd = bulkPassword.trim() || '123456';

      students.push({
        fullName: name,
        username: uname,
        className: bulkClass,
        password: pwd
      });

      accountsForPreview.push({
        fullName: name,
        username: uname,
        password: pwd,
        className: bulkClass
      });
    }

    try {
      setLoading(true);
      const res = await api.createStudentsBulk(students);
      if (res.errors && res.errors.length > 0 && res.totalCreated === 0) {
        throw new Error(res.errors.join('\n'));
      }

      setSuccessInfo({
        count: res.totalCreated,
        accounts: accountsForPreview.slice(0, res.totalCreated)
      });
      onSuccess(res.totalCreated);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo danh sách học sinh theo mẫu.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromPaste = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const lines = pasteText
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setError('Vui lòng nhập hoặc dán ít nhất 1 dòng tên học sinh.');
      return;
    }

    const students: StudentCreatePayload[] = [];
    const accountsForPreview: Array<{ fullName: string; username: string; password?: string; className: string }> = [];

    lines.forEach((line, idx) => {
      // Check if format is "Full Name, Class, Username" or just "Full Name"
      const parts = line.split(/[,;\t]/).map(p => p.trim()).filter(Boolean);
      let name = parts[0] || `Học Sinh ${idx + 1}`;
      let cls = parts[1] || pasteDefaultClass;

      // Auto generate username from name
      let baseUser = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]/g, '');

      if (!baseUser) baseUser = `hs_${idx + 1}`;
      const num = idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`;
      const finalUsername = parts[2] || `${baseUser}_${cls.toLowerCase().replace(/[^a-z0-9]/g, '')}_${num}`;
      const pwd = pasteDefaultPassword || '123456';

      students.push({
        fullName: name,
        className: cls,
        username: finalUsername,
        password: pwd
      });

      accountsForPreview.push({
        fullName: name,
        className: cls,
        username: finalUsername,
        password: pwd
      });
    });

    try {
      setLoading(true);
      const res = await api.createStudentsBulk(students);
      if (res.errors && res.errors.length > 0 && res.totalCreated === 0) {
        throw new Error(res.errors.join('\n'));
      }

      setSuccessInfo({
        count: res.totalCreated,
        accounts: accountsForPreview.slice(0, res.totalCreated)
      });
      onSuccess(res.totalCreated);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi nhập danh sách học sinh.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasteSample = () => {
    setPasteText(`Nguyễn Hoàng An
Trần Minh Bảo
Lê Khánh Chi
Phạm Đức Dũng
Vũ Thị Kim Dung
Hoàng Văn Giang
Đỗ Hải Yến`);
  };

  const copyAccountList = () => {
    if (!successInfo) return;
    const text = successInfo.accounts
      .map(
        (acc, i) =>
          `${i + 1}. Họ tên: ${acc.fullName} | Lớp: ${acc.className} | Tài khoản: ${acc.username} | Mật khẩu: ${acc.password || '123456'}`
      )
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Tạo Tài Khoản Học Sinh Mới
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cấp tài khoản để học sinh đăng nhập vào hệ thống làm bài thi Toán trực tuyến.
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

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {successInfo ? (
            /* Success State with Credentials & Copy */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-emerald-900">
                    Đã tạo thành công {successInfo.count} tài khoản học sinh!
                  </h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Học sinh có thể dùng Tên đăng nhập và Mật khẩu dưới đây để đăng nhập vào MathExam Hub ngay lập tức.
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    Danh sách tài khoản vừa tạo ({successInfo.accounts.length})
                  </span>
                  <button
                    type="button"
                    onClick={copyAccountList}
                    className="text-xs px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg border border-indigo-200 transition-colors flex items-center gap-1.5"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Đã sao chép!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Sao chép để gửi lớp
                      </>
                    )}
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 p-2">
                  {successInfo.accounts.map((acc, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>{acc.fullName}</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded font-medium">
                            {acc.className}
                          </span>
                        </div>
                        <div className="text-slate-500 mt-0.5 flex items-center gap-3 font-mono text-[11px]">
                          <span>Tài khoản: <b className="text-indigo-600">{acc.username}</b></span>
                          <span>Mật khẩu: <b className="text-emerald-700">{acc.password || '123456'}</b></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSuccessInfo(null);
                    setFullName('');
                    setUsername('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                >
                  Tạo thêm tài khoản khác
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs"
                >
                  Hoàn tất & Đóng
                </button>
              </div>
            </div>
          ) : (
            /* Creation Form */
            <>
              {/* Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => { setActiveTab('single'); setError(null); }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'single'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Tạo 1 Học sinh
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('pattern'); setError(null); }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'pattern'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Tạo theo mẫu số lượng
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('paste'); setError(null); }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'paste'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Dán danh sách lớp
                </button>
              </div>

              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="whitespace-pre-line">{error}</span>
                </div>
              )}

              {/* TAB 1: Single Student */}
              {activeTab === 'single' && (
                <form onSubmit={handleCreateSingle} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Họ và tên học sinh <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      onBlur={handleAutoSuggestUsername}
                      placeholder="Ví dụ: Nguyễn Văn An"
                      className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Lớp học <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={className}
                        onChange={e => setClassName(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:ring-2 focus:ring-indigo-500"
                      >
                        {existingClasses.map(cls => (
                          <option key={cls} value={cls}>
                            {cls}
                          </option>
                        ))}
                        <option value="__new__">+ Nhập lớp mới...</option>
                      </select>
                    </div>

                    {className === '__new__' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Tên lớp mới
                        </label>
                        <input
                          type="text"
                          value={customClass}
                          onChange={e => setCustomClass(e.target.value)}
                          placeholder="Ví dụ: 12A3"
                          className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Tên đăng nhập / Mã học sinh <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAutoSuggestUsername}
                        className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        Gợi ý tự động
                      </button>
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                      placeholder="Ví dụ: an_12a1 hoặc hs12a1_01"
                      className="w-full font-mono text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      required
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Dùng để học sinh nhập vào ô đăng nhập. Viết liền không dấu.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mật khẩu khởi tạo
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Mặc định: 123456"
                        className="w-full pl-9 pr-3 py-2.5 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Mặc định là <code>123456</code>. Thầy cô có thể thay đổi hoặc để học sinh tự đổi sau này.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !fullName.trim() || !username.trim()}
                      className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-all shadow-xs flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Đang tạo tài khoản...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Tạo tài khoản học sinh
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: Pattern Generator */}
              {activeTab === 'pattern' && (
                <form onSubmit={handleCreatePattern} className="space-y-4">
                  <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs text-indigo-900 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <b className="font-semibold">Sinh tài khoản tự động cho lớp:</b>
                      <p className="text-indigo-700 mt-0.5">
                        Tự động tạo hàng loạt tài khoản có thứ tự theo số báo danh. Ví dụ:{' '}
                        <code>hs12a1_01</code>, <code>hs12a1_02</code>,...
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Lớp học áp dụng
                      </label>
                      <input
                        type="text"
                        value={bulkClass}
                        onChange={e => {
                          setBulkClass(e.target.value);
                          setBulkPrefix(`hs${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')}_`);
                        }}
                        placeholder="12A1"
                        className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Tiền tố tài khoản (Prefix)
                      </label>
                      <input
                        type="text"
                        value={bulkPrefix}
                        onChange={e => setBulkPrefix(e.target.value.toLowerCase().replace(/\s/g, ''))}
                        placeholder="hs12a1_"
                        className="w-full font-mono text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Số lượng học sinh cần tạo
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={bulkCount}
                        onChange={e => setBulkCount(Number(e.target.value))}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mật khẩu chung ban đầu
                      </label>
                      <input
                        type="text"
                        value={bulkPassword}
                        onChange={e => setBulkPassword(e.target.value)}
                        placeholder="123456"
                        className="w-full font-mono text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Preview of pattern */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Xem trước tài khoản mẫu: </span>
                    <span className="font-mono text-indigo-700 font-medium">
                      {bulkPrefix}01, {bulkPrefix}02, ... {bulkPrefix}
                      {bulkCount < 10 ? `0${bulkCount}` : bulkCount}
                    </span>{' '}
                    (Lớp: {bulkClass} | Mật khẩu: {bulkPassword})
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
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
                          Đang khởi tạo {bulkCount} tài khoản...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Khởi tạo {bulkCount} tài khoản học sinh
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: Paste Roster */}
              {activeTab === 'paste' && (
                <form onSubmit={handleCreateFromPaste} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Dán danh sách tên học sinh (Mỗi dòng một tên):
                    </label>
                    <button
                      type="button"
                      onClick={handlePasteSample}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Dán danh sách mẫu
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    placeholder={`Nguyễn Văn An&#10;Trần Thị Bình&#10;Lê Hoàng Nam&#10;...`}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-sans"
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Lớp học mặc định
                      </label>
                      <input
                        type="text"
                        value={pasteDefaultClass}
                        onChange={e => setPasteDefaultClass(e.target.value)}
                        placeholder="12A1"
                        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mật khẩu khởi tạo
                      </label>
                      <input
                        type="text"
                        value={pasteDefaultPassword}
                        onChange={e => setPasteDefaultPassword(e.target.value)}
                        placeholder="123456"
                        className="w-full font-mono text-sm border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Hệ thống sẽ tự động chuyển họ tên thành tên đăng nhập không dấu kèm số thứ tự.
                  </p>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !pasteText.trim()}
                      className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-all shadow-xs flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Đang tạo danh sách...
                        </>
                      ) : (
                        <>
                          <Users className="w-4 h-4" />
                          Tạo tài khoản từ danh sách
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
