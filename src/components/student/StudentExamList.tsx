import React, { useState, useEffect } from 'react';
import { Exam, ExamSession } from '../../types.js';
import { api } from '../../services/api.js';
import { FileText, Clock, Award, PlayCircle, CheckCircle } from 'lucide-react';

interface StudentExamListProps {
  onStartExam: (examId: number) => void;
  onViewResult: (sessionId: number) => void;
}

export const StudentExamList: React.FC<StudentExamListProps> = ({ onStartExam, onViewResult }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [examsRes, sessionsRes] = await Promise.all([
        api.getExams(),
        api.getSessions()
      ]);
      setExams(examsRes.exams);
      setSessions(sessionsRes.sessions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getSessionForExam = (examId: number) => {
    return sessions.find(s => s.examId === examId && s.status === 'completed');
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-700 to-sky-600 rounded-2xl p-6 text-white shadow-md">
        <h1 className="text-2xl font-bold tracking-tight">Kỳ Thi Trực Tuyến Môn Toán</h1>
        <p className="text-indigo-100 text-sm mt-1 max-w-2xl leading-relaxed">
          Chọn đề thi bên dưới để bắt đầu làm bài. Hệ thống hỗ trợ đồng hồ đếm ngược tự động, 
          bảng câu hỏi thông minh và chấm điểm ngay lập tức sau khi nộp bài.
        </p>
      </div>

      {loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
          <p className="text-sm text-slate-500">Đang tải danh sách bài thi...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-medium">Hiện chưa có đề thi nào được mở cho học sinh.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {exams.map((exam) => {
            const completedSession = getSessionForExam(exam.id);

            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Mã đề: {exam.code}
                    </span>

                    {completedSession ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Đã nộp: {completedSession.score?.toFixed(2)}đ
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                        Chưa làm bài
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">{exam.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {exam.description || 'Đề thi trắc nghiệm Toán chuẩn ma trận 4 mức độ tư duy.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{exam.durationMinutes} phút</span>
                    </div>
                    <div className="flex items-center gap-1 font-medium">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>{exam.totalQuestions || 0} câu hỏi</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {completedSession ? (
                    <>
                      <button
                        onClick={() => onViewResult(completedSession.id)}
                        className="w-full py-2.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Award className="w-4 h-4" />
                        Xem lại kết quả & Lời giải
                      </button>
                      <button
                        onClick={() => onStartExam(exam.id)}
                        className="py-2.5 px-3 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors whitespace-nowrap"
                        title="Thi lại lần nữa để luyện tập"
                      >
                        Làm lại
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onStartExam(exam.id)}
                      className="w-full py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Bắt đầu làm bài
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
