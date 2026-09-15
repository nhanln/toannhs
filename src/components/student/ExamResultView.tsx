import React, { useState, useEffect } from 'react';
import { ExamSession, Question } from '../../types.js';
import { api } from '../../services/api.js';
import { MathView } from '../MathView.js';
import { Award, CheckCircle2, XCircle, AlertCircle, ArrowLeft, RefreshCw, Filter, BookOpen } from 'lucide-react';

interface ExamResultViewProps {
  sessionId: number;
  onBack: () => void;
  onRetake?: (examId: number) => void;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({ sessionId, onBack, onRetake }) => {
  const [session, setSession] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'wrong' | 'correct'>('all');

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const res = await api.getSession(sessionId);
      setSession(res.session);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !session) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
        <p className="text-sm text-slate-500">Đang tải kết quả bài thi và lời giải...</p>
      </div>
    );
  }

  const questions = session.reviewQuestions || [];
  const score = session.score || 0;
  const totalCorrect = session.totalCorrect || 0;
  const totalQuestions = session.totalQuestions || 0;
  const wrongCount = totalQuestions - totalCorrect;
  const percent = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const filteredQuestions = questions.filter((q) => {
    if (filterMode === 'correct') return q.isCorrect;
    if (filterMode === 'wrong') return !q.isCorrect;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner with Score */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Award className="w-3.5 h-3.5" />
            Kết Quả Bài Thi Trắc Nghiệm Môn Toán
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{session.examTitle}</h1>
          <p className="text-xs text-slate-500">
            Thí sinh: <strong className="text-slate-800">{session.studentName}</strong> (Lớp {session.studentClass || '12A1'}) &bull; Mã đề: <strong>{session.examCode}</strong>
          </p>
        </div>

        {/* Score Badge */}
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl">
          <div className="text-center">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Điểm số</div>
            <div className={`text-4xl font-extrabold tracking-tight ${score >= 8 ? 'text-emerald-600' : score >= 5 ? 'text-sky-600' : 'text-rose-600'}`}>
              {score.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Thang 10</div>
          </div>

          <div className="w-px h-12 bg-slate-200"></div>

          <div className="space-y-1 text-xs">
            <div className="text-slate-700">
              Số câu đúng: <strong className="text-emerald-600 font-bold">{totalCorrect}</strong> / {totalQuestions}
            </div>
            <div className="text-slate-700">
              Số câu sai/chưa làm: <strong className="text-rose-600 font-bold">{wrongCount}</strong>
            </div>
            <div className="text-slate-700">
              Tỷ lệ chính xác: <strong className="text-indigo-600 font-bold">{percent}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Control Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <button
          onClick={onBack}
          className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Quay lại danh sách
        </button>

        {/* Filter Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({questions.length})
          </button>
          <button
            onClick={() => setFilterMode('wrong')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterMode === 'wrong' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Câu sai ({wrongCount})
          </button>
          <button
            onClick={() => setFilterMode('correct')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterMode === 'correct' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Câu đúng ({totalCorrect})
          </button>
        </div>

        {onRetake && (
          <button
            onClick={() => onRetake(session.examId)}
            className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Luyện tập lại đề này
          </button>
        )}
      </div>

      {/* Review Questions List */}
      <div className="space-y-4">
        {filteredQuestions.map((q, idx) => {
          const isCorrect = q.isCorrect;
          const studentAns = q.studentAnswer;

          return (
            <div
              key={q.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs transition-all ${
                isCorrect ? 'border-emerald-200/80 bg-emerald-50/10' : 'border-rose-200/80 bg-rose-50/10'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                    Câu {idx + 1}
                  </span>
                  <span className="text-xs text-slate-400">({q.topic})</span>
                </div>

                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Chính xác
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                      <XCircle className="w-3.5 h-3.5" />
                      {studentAns ? 'Trả lời sai' : 'Chưa trả lời'}
                    </span>
                  )}
                </div>
              </div>

              {/* Question Content */}
              <div className="text-base font-medium text-slate-900 mb-4">
                <MathView content={q.content} />
              </div>

              {/* 4 Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const optText = q[`option${opt}` as keyof Question] as string;
                  const isRightOption = q.correctOption === opt;
                  const isStudentPicked = studentAns === opt;

                  let cardStyle = 'bg-slate-50 border-slate-200 text-slate-700';
                  if (isRightOption) {
                    cardStyle = 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold ring-1 ring-emerald-300';
                  } else if (isStudentPicked && !isRightOption) {
                    cardStyle = 'bg-rose-50 border-rose-300 text-rose-950 font-semibold ring-1 ring-rose-300 line-through';
                  }

                  return (
                    <div key={opt} className={`p-3 rounded-xl border text-sm flex items-start gap-2.5 ${cardStyle}`}>
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          isRightOption
                            ? 'bg-emerald-600 text-white'
                            : isStudentPicked
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {opt}
                      </span>
                      <div className="flex-1 overflow-x-auto">
                        <MathView content={optText} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Explanation (Lời giải chi tiết) */}
              {q.explanation && (
                <div className="mt-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-sm">
                  <div className="font-bold text-indigo-900 text-xs flex items-center gap-1.5 mb-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    Lời giải chi tiết:
                  </div>
                  <div className="text-slate-800 leading-relaxed">
                    <MathView content={q.explanation} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
