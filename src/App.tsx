import React, { useState, useEffect } from 'react';
import { User } from './types.js';
import { api, authStorage } from './services/api.js';
import { Navbar } from './components/Navbar.js';
import { QuestionBank } from './components/teacher/QuestionBank.js';
import { MatrixGenerator } from './components/teacher/MatrixGenerator.js';
import { ExamList } from './components/teacher/ExamList.js';
import { TeacherStatsView } from './components/teacher/TeacherStatsView.js';
import { StudentList } from './components/teacher/StudentList.js';
import { StudentExamList } from './components/student/StudentExamList.js';
import { ExamRoom } from './components/student/ExamRoom.js';
import { ExamResultView } from './components/student/ExamResultView.js';
import { StudentHistory } from './components/student/StudentHistory.js';
import { PrintExamView } from './components/PrintExamView.js';
import { AuthModal } from './components/AuthModal.js';
import { GuideModal } from './components/GuideModal.js';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('bank');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  // Sub-view parameters
  const [activeExamId, setActiveExamId] = useState<number | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Initialize auth state on load
  useEffect(() => {
    const initAuth = async () => {
      const savedUser = authStorage.getUser();
      const token = authStorage.getToken();

      if (token && savedUser) {
        try {
          const res = await api.getMe();
          setCurrentUser(res.user);
          setCurrentTab(res.user.role === 'student' ? 'student-exams' : 'bank');
        } catch (e) {
          // Token expired or invalid, auto log in as default teacher demo
          handleQuickSwitch('giaovien');
        }
      } else {
        // Auto sign-in demo teacher by default for instantaneous exploration
        handleQuickSwitch('giaovien');
      }
      setInitializing(false);
    };

    initAuth();
  }, []);

  const handleQuickSwitch = async (username: string) => {
    try {
      const res = await api.login(username, '123456');
      authStorage.setAuth(res.token, res.user);
      setCurrentUser(res.user);
      setCurrentTab(res.user.role === 'student' ? 'student-exams' : 'bank');
      setActiveExamId(null);
      setActiveSessionId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    authStorage.clearAuth();
    setCurrentUser(null);
    setAuthModalOpen(true);
  };

  // Nav actions
  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
    setActiveExamId(null);
    setActiveSessionId(null);
  };

  const handleOpenPrint = (examId: number) => {
    setActiveExamId(examId);
    setCurrentTab('print');
  };

  const handleStartExam = (examId: number) => {
    setActiveExamId(examId);
    setCurrentTab('exam_room');
  };

  const handleFinishExam = (sessionId: number) => {
    setActiveSessionId(sessionId);
    setCurrentTab('session_review');
  };

  const handleViewSession = (sessionId: number) => {
    setActiveSessionId(sessionId);
    setCurrentTab('session_review');
  };

  const handleExamCreated = (examId: number) => {
    setActiveExamId(examId);
    setCurrentTab('print');
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md animate-pulse">
            <span className="font-bold text-2xl font-serif">∑</span>
          </div>
          <p className="text-sm font-medium text-slate-600">Đang khởi tạo hệ thống MathExam Hub...</p>
        </div>
      </div>
    );
  }

  const isTeacher = currentUser?.role === 'teacher' || currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Navigation */}
      <Navbar
        user={currentUser}
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onLogout={handleLogout}
        onOpenAuth={() => setAuthModalOpen(true)}
        onSwitchUser={handleQuickSwitch}
        onOpenGuide={() => setGuideModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Print View Mode */}
        {currentTab === 'print' && activeExamId && (
          <PrintExamView
            examId={activeExamId}
            onBack={() => setCurrentTab(isTeacher ? 'exams' : 'student-exams')}
          />
        )}

        {/* Student Active Exam Room */}
        {currentTab === 'exam_room' && activeExamId && (
          <ExamRoom
            examId={activeExamId}
            onFinishExam={handleFinishExam}
            onExit={() => setCurrentTab('student-exams')}
          />
        )}

        {/* Exam Review / Score Report */}
        {currentTab === 'session_review' && activeSessionId && (
          <ExamResultView
            sessionId={activeSessionId}
            onBack={() => setCurrentTab(isTeacher ? 'stats' : 'student-history')}
            onRetake={handleStartExam}
          />
        )}

        {/* Teacher Tab Views */}
        {isTeacher && (
          <>
            {currentTab === 'bank' && <QuestionBank />}
            {currentTab === 'matrix' && <MatrixGenerator onExamCreated={handleExamCreated} />}
            {currentTab === 'exams' && (
              <ExamList
                onNavigatePrint={handleOpenPrint}
                onNavigateMatrix={() => setCurrentTab('matrix')}
              />
            )}
            {currentTab === 'stats' && (
              <TeacherStatsView onViewSessionReview={handleViewSession} />
            )}
            {currentTab === 'students' && <StudentList />}
          </>
        )}

        {/* Student Tab Views */}
        {!isTeacher && (
          <>
            {currentTab === 'student-exams' && (
              <StudentExamList
                onStartExam={handleStartExam}
                onViewResult={handleViewSession}
              />
            )}
            {currentTab === 'student-history' && (
              <StudentHistory
                onViewSession={handleViewSession}
                onBrowseExams={() => setCurrentTab('student-exams')}
              />
            )}
          </>
        )}
      </main>

      {/* Footer (Hidden on print) */}
      <footer className="no-print bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-600 font-serif">∑</span>
            <span className="font-semibold text-slate-700">MathExam Hub</span>
            <span>&bull; Hệ thống quản lý thi và tạo đề thi môn Toán chuẩn ma trận Bộ GD&ĐT</span>
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <button
              onClick={() => setGuideModalOpen(true)}
              className="hover:text-indigo-600 transition-colors underline"
            >
              Xem Sơ đồ SQL & Hướng dẫn Deploy
            </button>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          setCurrentTab(user.role === 'student' ? 'student-exams' : 'bank');
        }}
      />

      {/* Architecture & SQL Guide Modal */}
      <GuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
      />
    </div>
  );
}
