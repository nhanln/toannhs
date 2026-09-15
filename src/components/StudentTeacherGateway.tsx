import React, { useState } from 'react';
import { User } from '../types.js';
import { api, authStorage } from '../services/api.js';
import {
  GraduationCap,
  School,
  Sparkles,
  Lock,
  User as UserIcon,
  LogIn,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface StudentTeacherGatewayProps {
  onSuccess: (user: User) => void;
  onOpenRegister: (role: 'student' | 'teacher') => void;
}

export const StudentTeacherGateway: React.FC<StudentTeacherGatewayProps> = ({
  onSuccess,
  onOpenRegister
}) => {
  // Student Login Form
  const [studentUsername, setStudentUsername] = useState('hocsinh');
  const [studentPassword, setStudentPassword] = useState('123456');
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);

  // Teacher Login Form
  const [teacherUsername, setTeacherUsername] = useState('giaovien');
  const [teacherPassword, setTeacherPassword] = useState('123456');
  const [showTeacherPassword, setShowTeacherPassword] = useState(false);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [teacherError, setTeacherError] = useState<string | null>(null);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError(null);
    setStudentLoading(true);

    try {
      const res = await api.login(studentUsername.trim(), studentPassword.trim());
      authStorage.setAuth(res.token, res.user);
      onSuccess(res.user);
    } catch (err: any) {
      setStudentError(err.message || 'Tên đăng nhập hoặc mật khẩu học sinh không đúng.');
    } finally {
      setStudentLoading(false);
    }
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherError(null);
    setTeacherLoading(true);

    try {
      const res = await api.login(teacherUsername.trim(), teacherPassword.trim());
      authStorage.setAuth(res.token, res.user);
      onSuccess(res.user);
    } catch (err: any) {
      setTeacherError(err.message || 'Tên đăng nhập hoặc mật khẩu giáo viên không đúng.');
    } finally {
      setTeacherLoading(false);
    }
  };

  const handleQuickStudentSelect = (username: string) => {
    setStudentUsername(username);
    setStudentPassword('123456');
    setStudentError(null);
  };

  return (
    <div className="py-6 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Hero Welcome */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
          <span className="font-serif font-bold text-sm">∑</span>
          <span>MathExam Hub &bull; Cổng Đăng Nhập Trực Tuyến</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Chào Mừng Đến Với Hệ Thống Thi Toán
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto">
          Học sinh đăng nhập bằng tài khoản được giáo viên cấp để vào làm bài thi trắc nghiệm. Thầy cô đăng nhập để quản lý đề thi và tài khoản lớp.
        </p>
      </div>

      {/* Main Dual Portal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* STUDENT PORTAL CARD (EMERALD HIGHLIGHT) */}
        <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-xl overflow-hidden flex flex-col relative">
          <div className="bg-emerald-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full">
                Dành Cho Học Sinh
              </span>
            </div>
            <h2 className="text-xl font-bold mt-4 tracking-tight">Cổng Đăng Nhập Học Sinh</h2>
            <p className="text-emerald-100 text-xs mt-1">
              Vào phòng thi trắc nghiệm Toán, nộp bài trực tuyến và tra cứu kết quả tức thì.
            </p>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
            {/* Quick selector for sample students */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl">
              <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Chọn nhanh tài khoản học sinh mẫu:</span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickStudentSelect('hocsinh')}
                  className={`p-2 rounded-xl text-left text-xs transition-all border ${
                    studentUsername === 'hocsinh'
                      ? 'bg-white border-emerald-500 shadow-xs font-bold text-emerald-900'
                      : 'bg-white/70 border-emerald-200 text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className="font-semibold truncate">Trần Minh Đức</div>
                  <div className="text-[10px] text-slate-500">Lớp 12A1 &bull; TK: hocsinh</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickStudentSelect('hocsinh2')}
                  className={`p-2 rounded-xl text-left text-xs transition-all border ${
                    studentUsername === 'hocsinh2'
                      ? 'bg-white border-emerald-500 shadow-xs font-bold text-emerald-900'
                      : 'bg-white/70 border-emerald-200 text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className="font-semibold truncate">Lê Thu Hà</div>
                  <div className="text-[10px] text-slate-500">Lớp 12A2 &bull; TK: hocsinh2</div>
                </button>
              </div>
            </div>

            {studentError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{studentError}</span>
              </div>
            )}

            {/* Student Login Form */}
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã học sinh / Tên đăng nhập <span className="text-emerald-600">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentUsername}
                    onChange={e => setStudentUsername(e.target.value)}
                    placeholder="Ví dụ: hocsinh hoặc mã do thầy/cô cấp"
                    className="w-full pl-10 pr-3 py-2.5 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Mật khẩu <span className="text-emerald-600">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Mặc định: <b>123456</b></span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showStudentPassword ? 'text' : 'password'}
                    value={studentPassword}
                    onChange={e => setStudentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full pl-10 pr-10 py-2.5 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowStudentPassword(!showStudentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showStudentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={studentLoading || !studentUsername.trim() || !studentPassword.trim()}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {studentLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Vào Cổng Học Sinh &rarr;</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
              Học sinh chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => onOpenRegister('student')}
                className="font-bold text-emerald-700 hover:underline"
              >
                Tự đăng ký ngay
              </button>
            </div>
          </div>
        </div>

        {/* TEACHER PORTAL CARD (INDIGO HIGHLIGHT) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col relative">
          <div className="bg-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white">
                <School className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full">
                Dành Cho Giáo Viên
              </span>
            </div>
            <h2 className="text-xl font-bold mt-4 tracking-tight">Cổng Quản Trị Giáo Viên</h2>
            <p className="text-indigo-100 text-xs mt-1">
              Soạn câu hỏi Toán, tạo đề theo ma trận 4 mức độ và cấp tài khoản học sinh.
            </p>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
            {/* Quick teacher selector */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-200/60 rounded-2xl">
              <div className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Tài khoản giáo viên mẫu:</span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div
                onClick={() => {
                  setTeacherUsername('giaovien');
                  setTeacherPassword('123456');
                  setTeacherError(null);
                }}
                className="p-2.5 bg-white border border-indigo-300 rounded-xl cursor-pointer hover:border-indigo-500 transition-colors"
              >
                <div className="font-bold text-xs text-indigo-950">Thầy Nguyễn Văn Toán</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Tổ Toán &bull; TK: <code className="text-indigo-600 font-bold">giaovien</code> &bull; MK: 123456
                </div>
              </div>
            </div>

            {teacherError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{teacherError}</span>
              </div>
            )}

            {/* Teacher Login Form */}
            <form onSubmit={handleTeacherLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên tài khoản giáo viên <span className="text-indigo-600">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={teacherUsername}
                    onChange={e => setTeacherUsername(e.target.value)}
                    placeholder="giaovien"
                    className="w-full pl-10 pr-3 py-2.5 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu <span className="text-indigo-600">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showTeacherPassword ? 'text' : 'password'}
                    value={teacherPassword}
                    onChange={e => setTeacherPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full pl-10 pr-10 py-2.5 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showTeacherPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={teacherLoading || !teacherUsername.trim() || !teacherPassword.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {teacherLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Đăng Nhập Giáo Viên &rarr;</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
              Giáo viên mới chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => onOpenRegister('teacher')}
                className="font-bold text-indigo-600 hover:underline"
              >
                Đăng ký tài khoản giáo viên
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
