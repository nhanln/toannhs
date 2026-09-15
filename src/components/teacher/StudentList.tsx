import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Users, GraduationCap, Award, Calendar } from 'lucide-react';

export const StudentList: React.FC = () => {
  const [students, setStudents] = useState<Array<{
    id: number;
    username: string;
    fullName: string;
    className: string;
    totalExamsTaken: number;
    avgScore: number;
    createdAt: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await api.getStudents();
      setStudents(res.students);
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
            Danh Sách Học Sinh
            <span className="text-sm font-normal px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {students.length} học sinh
            </span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Quản lý tài khoản học sinh, theo dõi số bài kiểm tra đã làm và điểm trung bình tích lũy.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
          <p className="text-sm text-slate-500">Đang tải danh sách học sinh...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Học sinh</th>
                <th className="px-5 py-3">Tên đăng nhập</th>
                <th className="px-5 py-3">Lớp</th>
                <th className="px-5 py-3 text-center">Số bài thi đã làm</th>
                <th className="px-5 py-3 text-center">Điểm trung bình</th>
                <th className="px-5 py-3">Ngày tham gia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      {st.fullName.charAt(0)}
                    </div>
                    {st.fullName}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                    {st.username}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold">
                      {st.className || '12A1'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center font-semibold text-slate-700">
                    {st.totalExamsTaken}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                      st.avgScore >= 8 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      st.avgScore >= 6.5 ? 'bg-sky-50 text-sky-700 border-sky-200' :
                      st.avgScore >= 5 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {st.totalExamsTaken > 0 ? `${st.avgScore.toFixed(2)}/10` : 'Chưa thi'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">
                    {new Date(st.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
