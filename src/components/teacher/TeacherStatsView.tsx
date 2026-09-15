import React, { useState, useEffect } from 'react';
import { TeacherStats, ExamSession } from '../../types.js';
import { api } from '../../services/api.js';
import { BarChart3, Users, Award, BookOpen, Clock, CheckCircle2, ChevronRight, RefreshCw, FileSpreadsheet } from 'lucide-react';

interface TeacherStatsViewProps {
  onViewSessionReview: (sessionId: number) => void;
}

export const TeacherStatsView: React.FC<TeacherStatsViewProps> = ({ onViewSessionReview }) => {
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [allSessions, setAllSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsRes, sessRes] = await Promise.all([
        api.getTeacherStats(),
        api.getSessions()
      ]);
      setStats(statsRes.stats);
      setAllSessions(sessRes.sessions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
        <p className="text-sm text-slate-500">Đang tổng hợp dữ liệu thống kê...</p>
      </div>
    );
  }

  // Calculate score bands
  const completed = allSessions.filter(s => s.status === 'completed');
  const bandGioi = completed.filter(s => (s.score || 0) >= 8).length;
  const bandKha = completed.filter(s => (s.score || 0) >= 6.5 && (s.score || 0) < 8).length;
  const bandTB = completed.filter(s => (s.score || 0) >= 5 && (s.score || 0) < 6.5).length;
  const bandYeu = completed.filter(s => (s.score || 0) < 5).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Thống Kê Khảo Sát & Kết Quả Thi Môn Toán
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Theo dõi phổ điểm, tỷ lệ hoàn thành và chi tiết từng bài làm của học sinh.
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Làm mới
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tổng Số Câu Hỏi</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.totalQuestions}</div>
          <div className="text-[11px] text-slate-400 mt-1">Trong ngân hàng dữ liệu</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tổng Đề Thi</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.totalExams}</div>
          <div className="text-[11px] text-slate-400 mt-1">Đã khởi tạo ma trận</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Lượt Nộp Bài</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{completed.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Học sinh hoàn thành</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Điểm Trung Bình</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-600 mt-2">
            {stats.avgScore > 0 ? stats.avgScore : '--'}/10
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Thang điểm tiêu chuẩn</div>
        </div>
      </div>

      {/* Phổ điểm & Phân loại học lực */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            Phổ Điểm & Phân Loại Học Lực
          </h3>

          <div className="space-y-3 pt-2">
            {/* Giỏi */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Giỏi (8.0 - 10.0 điểm)
                </span>
                <span className="text-slate-900 font-bold">{bandGioi} lượt</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${completed.length ? (bandGioi / completed.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Khá */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  Khá (6.5 - 7.9 điểm)
                </span>
                <span className="text-slate-900 font-bold">{bandKha} lượt</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-500"
                  style={{ width: `${completed.length ? (bandKha / completed.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Trung bình */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Trung bình (5.0 - 6.4 điểm)
                </span>
                <span className="text-slate-900 font-bold">{bandTB} lượt</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${completed.length ? (bandTB / completed.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Yếu */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  Yếu / Dưới trung bình (&lt; 5.0 điểm)
                </span>
                <span className="text-slate-900 font-bold">{bandYeu} lượt</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${completed.length ? (bandYeu / completed.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Cognitive Levels Breakdown in Bank */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            Cơ Cấu Ngân Hàng Câu Hỏi Theo Mức Độ
          </h3>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl">
              <div className="text-xs font-semibold text-sky-800">Nhận biết</div>
              <div className="text-xl font-bold text-sky-950 mt-1">{stats.levelCounts.nhan_biet} câu</div>
              <div className="text-[10px] text-sky-600 mt-0.5">
                {stats.totalQuestions ? Math.round((stats.levelCounts.nhan_biet / stats.totalQuestions) * 100) : 0}% ngân hàng
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="text-xs font-semibold text-emerald-800">Thông hiểu</div>
              <div className="text-xl font-bold text-emerald-950 mt-1">{stats.levelCounts.thong_hieu} câu</div>
              <div className="text-[10px] text-emerald-600 mt-0.5">
                {stats.totalQuestions ? Math.round((stats.levelCounts.thong_hieu / stats.totalQuestions) * 100) : 0}% ngân hàng
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="text-xs font-semibold text-amber-800">Vận dụng</div>
              <div className="text-xl font-bold text-amber-950 mt-1">{stats.levelCounts.van_dung} câu</div>
              <div className="text-[10px] text-amber-600 mt-0.5">
                {stats.totalQuestions ? Math.round((stats.levelCounts.van_dung / stats.totalQuestions) * 100) : 0}% ngân hàng
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
              <div className="text-xs font-semibold text-rose-800">Vận dụng cao</div>
              <div className="text-xl font-bold text-rose-950 mt-1">{stats.levelCounts.van_dung_cao} câu</div>
              <div className="text-[10px] text-rose-600 mt-0.5">
                {stats.totalQuestions ? Math.round((stats.levelCounts.van_dung_cao / stats.totalQuestions) * 100) : 0}% ngân hàng
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Danh Sách Bài Thi Của Học Sinh</h3>
            <p className="text-xs text-slate-500 mt-0.5">Chi tiết kết quả, thời gian nộp và xem bài làm của từng học sinh.</p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {allSessions.length} bài thi
          </span>
        </div>

        {allSessions.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">Chưa có học sinh nào nộp bài thi.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Học sinh</th>
                  <th className="px-5 py-3">Lớp</th>
                  <th className="px-5 py-3">Đề thi</th>
                  <th className="px-5 py-3 text-center">Số câu đúng</th>
                  <th className="px-5 py-3 text-center">Điểm số</th>
                  <th className="px-5 py-3">Thời gian nộp</th>
                  <th className="px-5 py-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allSessions.map((session) => {
                  const score = session.score || 0;
                  const scoreColor =
                    score >= 8 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                    score >= 6.5 ? 'text-sky-700 bg-sky-50 border-sky-200' :
                    score >= 5 ? 'text-amber-700 bg-amber-50 border-amber-200' :
                    'text-rose-700 bg-rose-50 border-rose-200';

                  return (
                    <tr key={session.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {session.studentName || `Học sinh #${session.studentId}`}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium">
                          {session.studentClass || '12A1'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-800">
                        <div className="font-medium text-xs">{session.examTitle}</div>
                        <div className="text-[11px] font-mono text-slate-400">{session.examCode}</div>
                      </td>
                      <td className="px-5 py-3.5 text-center font-medium text-slate-700">
                        {session.totalCorrect} / {session.totalQuestions}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold border ${scoreColor}`}>
                          {score.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {session.submitTime ? new Date(session.submitTime).toLocaleString('vi-VN') : 'Đang thi'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => onViewSessionReview(session.id)}
                          className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          Xem bài làm
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
