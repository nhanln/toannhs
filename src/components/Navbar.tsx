import React from 'react';
import { User } from '../types.js';
import { BookOpen, Award, FileText, BarChart3, Users, Printer, LogOut, Sparkles, HelpCircle, GraduationCap, School } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  onOpenAuth: (role?: 'student' | 'teacher') => void;
  onSwitchUser: (username: string) => void;
  onOpenGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentTab,
  onSelectTab,
  onLogout,
  onOpenAuth,
  onSwitchUser,
  onOpenGuide
}) => {
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  return (
    <nav className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab(isTeacher ? 'bank' : 'exams')}>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <span className="font-bold text-xl font-serif">∑</span>
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                MathExam <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">Hub</span>
              </span>
              <p className="text-[11px] text-slate-500 hidden sm:block">Hệ thống Quản lý & Tạo đề thi Toán</p>
            </div>
          </div>

          {/* Navigation Links */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              {isTeacher ? (
                <>
                  <button
                    onClick={() => onSelectTab('bank')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      currentTab === 'bank' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Ngân hàng câu hỏi
                  </button>

                  <button
                    onClick={() => onSelectTab('matrix')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      currentTab === 'matrix' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Tạo đề theo Ma trận
                  </button>

                  <button
                    onClick={() => onSelectTab('exams')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      currentTab === 'exams' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Quản lý đề thi
                  </button>

                  <button
                    onClick={() => onSelectTab('stats')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      currentTab === 'stats' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Thống kê & Kết quả
                  </button>

                  <button
                    onClick={() => onSelectTab('students')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      currentTab === 'students' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Học sinh
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onSelectTab('student-exams')}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      currentTab === 'student-exams' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Đề thi có sẵn
                  </button>

                  <button
                    onClick={() => onSelectTab('student-history')}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      currentTab === 'student-history' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    Lịch sử & Điểm số
                  </button>
                </>
              )}
            </div>
          )}

          {/* Right Section: User & Quick Switcher */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenGuide}
              className="hidden lg:flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-indigo-600 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
              title="Xem sơ đồ SQL & Hướng dẫn Deploy"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              SQL & Deploy
            </button>

            {user ? (
              <div className="flex items-center space-x-2">
                {/* Fast role switcher for instant demonstration */}
                <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => onSwitchUser('giaovien')}
                    className={`px-2 py-1 rounded-md transition-all font-medium ${
                      user.role === 'teacher' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Chuyển sang tài khoản Giáo viên"
                  >
                    Giáo viên
                  </button>
                  <button
                    onClick={() => onSwitchUser('hocsinh')}
                    className={`px-2 py-1 rounded-md transition-all font-medium ${
                      user.role === 'student' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Chuyển sang tài khoản Học sinh"
                  >
                    Học sinh
                  </button>
                </div>

                <div className="text-right pl-2">
                  <div className="text-sm font-semibold text-slate-900 leading-tight">{user.fullName}</div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-end gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${user.role === 'teacher' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
                    {user.role === 'teacher' ? 'Giáo viên' : `Lớp ${user.className || '12A'}`}
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('student')}
                  className="px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <span>Cổng Học Sinh</span>
                </button>
                <button
                  onClick={() => onOpenAuth('teacher')}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <School className="w-4 h-4" />
                  <span>Cổng Giáo Viên</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile subnav */}
      {user && (
        <div className="md:hidden flex overflow-x-auto py-2 px-4 border-t border-slate-100 space-x-1 bg-slate-50/70 text-xs">
          {isTeacher ? (
            <>
              <button
                onClick={() => onSelectTab('bank')}
                className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${currentTab === 'bank' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-600'}`}
              >
                Ngân hàng câu hỏi
              </button>
              <button
                onClick={() => onSelectTab('matrix')}
                className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${currentTab === 'matrix' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-600'}`}
              >
                Tạo đề Ma trận
              </button>
              <button
                onClick={() => onSelectTab('exams')}
                className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${currentTab === 'exams' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-600'}`}
              >
                Đề thi
              </button>
              <button
                onClick={() => onSelectTab('stats')}
                className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${currentTab === 'stats' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-600'}`}
              >
                Thống kê
              </button>
              <button
                onClick={() => onSelectTab('students')}
                className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${currentTab === 'students' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-600'}`}
              >
                Học sinh
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onSelectTab('student-exams')}
                className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${currentTab === 'student-exams' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-600'}`}
              >
                Đề thi có sẵn
              </button>
              <button
                onClick={() => onSelectTab('student-history')}
                className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${currentTab === 'student-history' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-600'}`}
              >
                Lịch sử thi
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};
