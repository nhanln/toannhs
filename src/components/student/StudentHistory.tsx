import React, { useState, useEffect } from 'react';
import { ExamSession } from '../../types.js';
import { api } from '../../services/api.js';
import { Award, Clock, FileText, ChevronRight, CheckCircle2 } from 'lucide-react';

interface StudentHistoryProps {
  onViewSession: (sessionId: number) => void;
  onBrowseExams: () => void;
}

export const StudentHistory: React.FC<StudentHistoryProps> = ({ onViewSession, onBrowseExams }) => {
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getSessions();
      setSessions(res.sessions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Lịch Sử Làm Bài & Điểm Số
            <span className="text-sm font-normal px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {sessions.length} bài thi
            </span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Xem lại kết quả các bài thi đã hoàn thành, lời giải chi tiết và theo dõi tiến bộ môn Toán của bạn.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
          <p className="text-sm text-slate-500">Đang tải lịch sử thi...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-medium">Bạn chưa tham gia bài thi nào.</p>
          <button
            onClick={onBrowseExams}
            className="mt-3 text-sm font-bold text-indigo-600 hover:underline"
          >
            Xem danh sách đề thi đang mở &rarr;
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((sess) => {
            const score = sess.score || 0;
            const scoreColor =
              score >= 8 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              score >= 6.5 ? 'bg-sky-50 text-sky-700 border-sky-200' :
              score >= 5 ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-rose-50 text-rose-700 border-rose-200';

            return (
              <div
                key={sess.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-200 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {sess.examCode}
                    </span>
                    <h3 className="font-bold text-base text-slate-900">{sess.examTitle}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                    <span>
                      Đúng: <strong className="text-slate-800">{sess.totalCorrect}</strong> / {sess.totalQuestions} câu
                    </span>
                    <span>&bull;</span>
                    <span>
                      Ngày thi: {sess.submitTime ? new Date(sess.submitTime).toLocaleString('vi-VN') : 'Đang thi'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className={`px-3 py-1.5 rounded-xl border text-sm font-extrabold ${scoreColor}`}>
                    {score.toFixed(2)} điểm
                  </div>

                  <button
                    onClick={() => onViewSession(sess.id)}
                    className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center gap-1"
                  >
                    Xem lời giải
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
