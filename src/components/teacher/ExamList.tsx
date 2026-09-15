import React, { useState, useEffect } from 'react';
import { Exam } from '../../types.js';
import { api } from '../../services/api.js';
import { MathView } from '../MathView.js';
import { FileText, Printer, Trash2, Clock, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, PlusCircle } from 'lucide-react';

interface ExamListProps {
  onNavigatePrint: (examId: number) => void;
  onNavigateMatrix: () => void;
}

export const ExamList: React.FC<ExamListProps> = ({ onNavigatePrint, onNavigateMatrix }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedExamId, setExpandedExamId] = useState<number | null>(null);
  const [examDetail, setExamDetail] = useState<Exam | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.getExams();
      setExams(res.exams);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleToggleDetail = async (examId: number) => {
    if (expandedExamId === examId) {
      setExpandedExamId(null);
      setExamDetail(null);
      return;
    }

    try {
      setExpandedExamId(examId);
      setLoadingDetail(true);
      const res = await api.getExam(examId);
      setExamDetail(res.exam);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa đề thi này?')) return;
    try {
      await api.deleteExam(id);
      fetchExams();
      if (expandedExamId === id) {
        setExpandedExamId(null);
        setExamDetail(null);
      }
    } catch (e: any) {
      alert(e.message || 'Không thể xóa đề thi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Danh Sách Đề Thi Môn Toán
            <span className="text-sm font-normal px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {exams.length} đề
            </span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Quản lý các đề thi đã tạo theo ma trận, chuẩn bị in ấn hoặc phân phát cho học sinh làm trực tuyến.
          </p>
        </div>

        <button
          onClick={onNavigateMatrix}
          className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          Tạo Đề Thi Mới
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
          <p className="text-sm text-slate-500">Đang tải danh sách đề thi...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-medium">Chưa có đề thi nào được tạo.</p>
          <button
            onClick={onNavigateMatrix}
            className="mt-3 text-sm text-indigo-600 font-semibold hover:underline"
          >
            Tạo đề thi đầu tiên bằng công cụ Ma trận ngay &rarr;
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => {
            const isExpanded = expandedExamId === exam.id;

            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
              >
                <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {exam.code}
                      </span>
                      <h2 className="text-base font-bold text-slate-900">{exam.title}</h2>
                    </div>

                    <p className="text-xs text-slate-500">{exam.description || 'Đề thi trắc nghiệm Toán'}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {exam.durationMinutes} phút
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        {exam.totalQuestions || 0} câu hỏi
                      </span>
                      {exam.matrixConfig && (
                        <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          NB: {exam.matrixConfig.nhanBiet} | TH: {exam.matrixConfig.thongHieu} | VD: {exam.matrixConfig.vanDung} | VDC: {exam.matrixConfig.vanDungCao}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <button
                      onClick={() => onNavigatePrint(exam.id)}
                      className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      In Đề & PDF
                    </button>

                    <button
                      onClick={() => handleToggleDetail(exam.id)}
                      className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {isExpanded ? 'Đóng chi tiết' : 'Xem câu hỏi'}
                    </button>

                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Xóa đề thi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Questions Detail */}
                {isExpanded && (
                  <div className="bg-slate-50/70 border-t border-slate-100 p-5 space-y-3">
                    {loadingDetail ? (
                      <div className="text-center py-6 text-xs text-slate-500">Đang tải câu hỏi trong đề...</div>
                    ) : examDetail?.questions && examDetail.questions.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {examDetail.questions.map((q, idx) => (
                          <div key={q.id} className="bg-white p-3.5 rounded-xl border border-slate-200 text-sm">
                            <div className="font-semibold text-slate-900 text-xs mb-1.5 flex items-center gap-2">
                              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-sm font-bold">
                                Câu {idx + 1}
                              </span>
                              <span className="text-slate-400">({q.topic} - {q.level})</span>
                            </div>
                            <MathView content={q.content} />
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs">
                              {(['A', 'B', 'C', 'D'] as const).map(opt => (
                                <div
                                  key={opt}
                                  className={`p-1.5 rounded-md border ${
                                    q.correctOption === opt ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-800' : 'bg-slate-50 border-slate-100 text-slate-600'
                                  }`}
                                >
                                  {opt}. <MathView content={q[`option${opt}` as keyof typeof q] as string} />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">Không có câu hỏi trong đề này.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
