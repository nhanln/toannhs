import React, { useState } from 'react';
import { User } from '../types.js';
import { api, authStorage } from '../services/api.js';
import { Lock, User as UserIcon, LogIn, UserPlus, GraduationCap, CheckCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [className, setClassName] = useState('12A1');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.login(username, password);
        authStorage.setAuth(res.token, res.user);
        onSuccess(res.user);
        onClose();
      } else {
        const res = await api.register({
          username,
          password,
          fullName,
          className: role === 'student' ? className : 'Tổ Toán',
          role
        });
        authStorage.setAuth(res.token, res.user);
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoUsername: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(demoUsername, '123456');
      authStorage.setAuth(res.token, res.user);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Đăng nhập mẫu thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scale-up relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
        >
          &times;
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <span className="font-bold text-2xl font-serif">∑</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {isLogin ? 'Đăng Nhập MathExam Hub' : 'Đăng Ký Tài Khoản Mới'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isLogin ? 'Nhập thông tin để vào hệ thống quản lý và thi Toán' : 'Tạo tài khoản để tham gia làm bài thi trực tuyến'}
          </p>
        </div>

        {/* Quick Demo Accounts */}
        {isLogin && (
          <div className="mb-5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
              1-Click Đăng Nhập Tài Khoản Thử Nghiệm
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('giaovien')}
                disabled={loading}
                className="p-2 bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl text-left transition-colors text-xs font-semibold text-indigo-900 shadow-2xs"
              >
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Giáo Viên</span>
                </div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">Thầy Nguyễn Văn Toán</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('hocsinh')}
                disabled={loading}
                className="p-2 bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50 rounded-xl text-left transition-colors text-xs font-semibold text-emerald-900 shadow-2xs"
              >
                <div className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Học Sinh</span>
                </div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">Trần Minh Đức (12A1)</div>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vai trò</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-white"
                  >
                    <option value="student">Học sinh</option>
                    <option value="teacher">Giáo viên</option>
                  </select>
                </div>

                {role === 'student' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Lớp học</label>
                    <input
                      type="text"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      placeholder="12A1"
                      className="w-full text-sm border border-slate-200 rounded-xl p-2.5"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên đăng nhập</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập username..."
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : isLogin ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập ngay</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Đăng ký tài khoản</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-600">
          {isLogin ? (
            <p>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(null); }}
                className="font-bold text-indigo-600 hover:underline"
              >
                Đăng ký ngay
              </button>
            </p>
          ) : (
            <p>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(null); }}
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
