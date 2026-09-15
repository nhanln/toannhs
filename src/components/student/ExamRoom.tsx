import React, { useState, useEffect, useRef } from 'react';
import { Exam, Question, ExamSession } from '../../types.js';
import { api } from '../../services/api.js';
import { MathView } from '../MathView.js';
import confetti from 'canvas-confetti';
import { Clock, Flag, CheckCircle, ArrowLeft, ArrowRight, AlertTriangle, Send } from 'lucide-react';

interface ExamRoomProps {
  examId: number;
  onFinishExam: (sessionId: number) => void;
  onExit: () => void;
}

export const ExamRoom: React.FC<ExamRoomProps> = ({ examId, onFinishExam, onExit }) => {
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<Exam | null>(null);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize exam and session
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        setLoading(true);
        const res = await api.startSession(examId);
        if (!mounted) return;
        setExam(res.exam);
        setSession(res.session);

        // Set initial timer in seconds
        const totalSeconds = (res.exam.durationMinutes || 45) * 60;
        setTimeLeft(totalSeconds);
      } catch (err: any) {
        if (mounted) setErrorMessage(err.message || 'Không thể bắt đầu phiên thi.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();
    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examId]);

  // Countdown effect
  useEffect(() => {
    if (timeLeft <= 0 || !session || isSubmitting) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Auto submit on time-out
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, session, isSubmitting]);

  const handleAutoSubmit = async () => {
    alert('Hết giờ làm bài! Hệ thống đang tự động nộp bài thi của bạn.');
    await submitTest();
  };

  const handleSelectAnswer = (questionId: number, option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const toggleFlag = (questionId: number) => {
    setFlagged((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const submitTest = async () => {
    if (!session || isSubmitting) return;
    try {
      setIsSubmitting(true);
      setShowConfirmModal(false);

      const res = await api.submitSession(session.id, answers);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe fallback
      }

      onFinishExam(res.result.id);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi nộp bài');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
        <p className="text-sm text-slate-500">Đang chuẩn bị đề thi và tạo phòng thi trực tuyến...</p>
      </div>
    );
  }

  if (errorMessage || !exam || !exam.questions || exam.questions.length === 0) {
    return (
      <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 max-w-lg mx-auto">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-900">Không thể vào phòng thi</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">{errorMessage || 'Đề thi không có câu hỏi nào.'}</p>
        <button
          onClick={onExit}
          className="px-4 py-2 text-sm bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const currentQ = exam.questions[currentIndex];
  const questionsCount = exam.questions.length;
  const answeredCount = Object.keys(answers).length;

  // Format timer
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerWarning = timeLeft < 300; // less than 5 min
  const timerCritical = timeLeft < 60; // less than 1 min

  return (
    <div className="space-y-4">
      {/* Top Fixed Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 sticky top-20 z-30">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-xs font-bold border border-indigo-200">
              {exam.code}
            </span>
            <h1 className="font-bold text-slate-900 text-base line-clamp-1">{exam.title}</h1>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Tiến độ: Đã làm <strong className="text-indigo-600">{answeredCount}</strong> / {questionsCount} câu
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Countdown Clock */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold border transition-colors ${
              timerCritical
                ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                : timerWarning
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <Clock className={`w-4 h-4 ${timerCritical ? 'text-rose-600' : 'text-slate-600'}`} />
            <span>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            Nộp bài thi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left 3 cols: Main Active Question */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            {/* Question Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg text-sm">
                  Câu {currentIndex + 1} / {questionsCount}
                </span>
                <span className="text-xs text-slate-400">({currentQ.topic})</span>
              </div>

              <button
                onClick={() => toggleFlag(currentQ.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-colors ${
                  flagged[currentQ.id]
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Flag className={`w-3.5 h-3.5 ${flagged[currentQ.id] ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                {flagged[currentQ.id] ? 'Đã đánh dấu xem lại' : 'Đánh dấu câu này'}
              </button>
            </div>

            {/* Question Math Content */}
            <div className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed mb-6">
              <MathView content={currentQ.content} />
            </div>

            {/* 4 Options Radio List */}
            <div className="space-y-3">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                const optContent = currentQ[`option${opt}` as keyof Question] as string;
                const isSelected = answers[currentQ.id] === opt;

                return (
                  <label
                    key={opt}
                    onClick={() => handleSelectAnswer(currentQ.id, opt)}
                    className={`p-4 rounded-xl border text-sm flex items-start gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-400/50 shadow-xs'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {opt}
                    </div>

                    <div className="flex-1 pt-0.5 overflow-x-auto text-slate-800 font-medium">
                      <MathView content={optContent} />
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Prev / Next Navigation Bar */}
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                disabled={currentIndex === 0}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Câu trước
              </button>

              <button
                onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, questionsCount - 1))}
                disabled={currentIndex === questionsCount - 1}
                className="px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-30 rounded-xl transition-colors flex items-center gap-1.5"
              >
                Câu tiếp theo
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 col: Question Navigator Palette */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Bảng Danh Sách Câu Hỏi
            </h3>

            {/* Color Legend */}
            <div className="grid grid-cols-3 gap-1.5 text-[11px] text-slate-600 pb-2">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
                <span>Đã làm</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-amber-400"></span>
                <span>Xem lại</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-slate-200"></span>
                <span>Chưa làm</span>
              </div>
            </div>

            {/* Palette Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
              {exam.questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isFlag = !!flagged[q.id];
                const isCurrent = currentIndex === idx;

                let colorClass = 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200';
                if (isFlag) {
                  colorClass = 'bg-amber-100 text-amber-900 border-amber-400 font-bold';
                } else if (isAnswered) {
                  colorClass = 'bg-emerald-500 text-white font-bold border-emerald-600';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl text-xs font-semibold flex items-center justify-center border transition-all ${colorClass} ${
                      isCurrent ? 'ring-2 ring-indigo-600 ring-offset-1 scale-105' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-up">
            <h3 className="text-lg font-bold text-slate-900">Xác Nhận Nộp Bài Thi</h3>
            <div className="my-4 text-sm text-slate-600 space-y-2">
              <p>
                Bạn đã hoàn thành <strong>{answeredCount}</strong> trên tổng số <strong>{questionsCount}</strong> câu hỏi.
              </p>
              {answeredCount < questionsCount && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Còn <strong>{questionsCount - answeredCount} câu</strong> bạn chưa chọn đáp án. Hệ thống sẽ tính 0 điểm cho những câu chưa làm.
                  </span>
                </div>
              )}
              <p className="text-xs text-slate-500">
                Sau khi nộp bài, điểm số và lời giải chi tiết sẽ được hiển thị ngay lập tức.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                onClick={submitTest}
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
              >
                {isSubmitting ? 'Đang nộp...' : 'Đồng ý nộp bài'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
