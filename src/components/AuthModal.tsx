import React, { useState, useEffect } from 'react';
import { User } from '../types.js';
import { api, authStorage } from '../services/api.js';
import {
  Lock,
  User as UserIcon,
  LogIn,
  UserPlus,
  GraduationCap,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  School,
  KeyRound
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  initialRole?: 'student' | 'teacher';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole = 'student'
}) => {
  const [activePortal, setActivePortal] = useState<'student' | 'teacher'>(initialRole);
  const [isLogin, setIsLogin] = useState(true);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [className, setClassName] = useState('12A1');

  // Request states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync initialRole when modal opens
  useEffect(() => {
    if (isOpen) {
      setActivePortal(initialRole);
      setError(null);
      setUsername('');
      setPassword('');
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.login(username.trim(), password.trim());
        authStorage.setAuth(res.token, res.user);
        onSuccess(res.user);
        onClose();
      } else {
        const res = await api.register({
          username: username.trim(),
          password: password.trim(),
          fullName: fullName.trim(),
          className: activePortal === 'student' ? className.trim() : 'Tổ Toán - Tin học',
          role: activePortal
        });
        authStorage.setAuth(res.token, res.user);
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoUsername: string, role: 'student' | 'teacher') => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(demoUsername, '123456');
      authStorage.setAuth(res.token, res.user);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Đăng nhập nhanh thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scale-up relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 text-xl font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          &times;
        </button>

        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-2.5 shadow-md">
            <span className="font-bold text-2xl font-serif">∑</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {isLogin ? 'Đăng Nhập MathExam Hub' : 'Đăng Ký Tài Khoản'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Hệ thống quản lý đề thi và làm bài trắc nghiệm Toán chuẩn ma trận
          </p>
        </div>

        {/* Portal Switcher (Học Sinh vs Giáo Viên) */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              setActivePortal('student');
              setError(null);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activePortal === 'student'
                ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className={`w-4 h-4 ${activePortal === 'student' ? 'text-emerald-600' : 'text-slate-500'}`} />
            <span>Cổng Học Sinh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePortal('teacher');
              setError(null);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activePortal === 'teacher'
                ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <School className={`w-4 h-4 ${activePortal === 'teacher' ? 'text-indigo-600' : 'text-slate-500'}`} />
            <span>Cổng Giáo Viên</span>
          </button>
        </div>

        {/* Sub-banner according to active portal */}
        {activePortal === 'student' ? (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200/70 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-semibold">Dành cho Học sinh vào thi trực tuyến</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-medium">Mật khẩu mặc định: 123456</span>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200/70 rounded-2xl flex items-center justify-between text-xs text-indigo-900">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span className="font-semibold">Dành cho Giáo viên & Quản trị</span>
            </div>
            <span className="text-[11px] text-indigo-700 font-medium">Tạo đề, quản lý HS</span>
          </div>
        )}

        {/* Quick 1-Click Login for demonstration */}
        {isLogin && (
          <div className="mb-5 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Đăng nhập nhanh (Tài khoản mẫu)</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>

            {activePortal === 'student' ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('hocsinh', 'student')}
                  disabled={loading}
                  className="p-2 bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/40 rounded-xl text-left transition-all text-xs font-semibold text-emerald-900 shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Trần Minh Đức</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                    Lớp 12A1 &bull; TK: <code className="text-emerald-700 font-bold">hocsinh</code>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('hocsinh2', 'student')}
                  disabled={loading}
                  className="p-2 bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/40 rounded-xl text-left transition-all text-xs font-semibold text-emerald-900 shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Lê Thu Hà</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                    Lớp 12A2 &bull; TK: <code className="text-emerald-700 font-bold">hocsinh2</code>
                  </div>
                </button>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('giaovien', 'teacher')}
                  disabled={loading}
                  className="w-full p-2.5 bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/40 rounded-xl text-left transition-all text-xs font-semibold text-indigo-900 shadow-2xs flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <School className="w-4 h-4 text-indigo-600" />
                      <span>Thầy Nguyễn Văn Toán</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                      Tổ Toán - Tin học &bull; TK: <code className="text-indigo-700 font-bold">giaovien</code> &bull; MK: 123456
                    </div>
                  </div>
                  <span className="text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-1 rounded-md">
                    Vào ngay &rarr;
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login / Register Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên {activePortal === 'student' ? 'học sinh' : 'giáo viên'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              {activePortal === 'student' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lớp học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={className}
                    onChange={e => setClassName(e.target.value)}
                    placeholder="Ví dụ: 12A1"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    required
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {activePortal === 'student' ? 'Mã học sinh hoặc Tên đăng nhập' : 'Tên tài khoản giáo viên'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={activePortal === 'student' ? 'Ví dụ: hocsinh, hs12a1_01...' : 'Ví dụ: giaovien'}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                required
              />
            </div>
            {activePortal === 'student' && isLogin && (
              <p className="text-[11px] text-slate-500 mt-1">
                Nhập mã học sinh do giáo viên bộ môn cấp hoặc dùng tài khoản mẫu ở trên.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Mật khẩu <span className="text-rose-500">*</span>
              </label>
              {activePortal === 'student' && isLogin && (
                <span className="text-[11px] text-slate-500">Mặc định: <b>123456</b></span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full pl-10 pr-10 py-2.5 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            className={`w-full py-3 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-3 disabled:opacity-50 ${
              activePortal === 'student'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : isLogin ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>
                  {activePortal === 'student' ? 'Vào Cổng Học Sinh' : 'Đăng nhập Giáo Viên'}
                </span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Đăng ký tài khoản {activePortal === 'student' ? 'Học sinh' : 'Giáo viên'}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-600 border-t border-slate-100 pt-4">
          {isLogin ? (
            <p>
              {activePortal === 'student' ? 'Học sinh chưa có tài khoản?' : 'Chưa có tài khoản giáo viên?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError(null);
                }}
                className={`font-bold hover:underline ${
                  activePortal === 'student' ? 'text-emerald-700' : 'text-indigo-600'
                }`}
              >
                Đăng ký tại đây
              </button>
            </p>
          ) : (
            <p>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError(null);
                }}
                className="font-bold text-indigo-600 hover:underline"
              >
                Đăng nhập ngay
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
