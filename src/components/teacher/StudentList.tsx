import React, { useState, useEffect } from 'react';
import { StudentRecord } from '../../types.js';
import { api } from '../../services/api.js';
import { CreateStudentModal } from './CreateStudentModal.js';
import { EditStudentModal } from './EditStudentModal.js';
import { StudentCredentialsModal } from './StudentCredentialsModal.js';
import {
  Users,
  UserPlus,
  Sparkles,
  Search,
  Filter,
  KeyRound,
  Edit3,
  Trash2,
  Printer,
  Copy,
  Check,
  GraduationCap,
  Award,
  ExternalLink,
  BookOpen,
  Calendar,
  ChevronDown,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface StudentListProps {
  onSwitchToStudent?: (username: string) => void;
}

export const StudentList: React.FC<StudentListProps> = ({ onSwitchToStudent }) => {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'avgScore' | 'totalExams' | 'newest'>('newest');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Status message
  const [message, setMessage] = useState<string | null>(null);

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

  const handleCreated = (count: number) => {
    loadStudents();
    setMessage(`Đã tạo thành công ${count} tài khoản học sinh mới!`);
    setTimeout(() => setMessage(null), 4000);
  };

  const handleEdited = () => {
    loadStudents();
    setMessage('Đã cập nhật thông tin tài khoản học sinh!');
    setTimeout(() => setMessage(null), 4000);
  };

  const handleDelete = async (student: StudentRecord) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản học sinh "${student.fullName}" (${student.username}) không?`)) {
      return;
    }

    try {
      setDeletingId(student.id);
      await api.deleteStudent(student.id);
      setStudents(prev => prev.filter(s => s.id !== student.id));
      setMessage(`Đã xóa tài khoản học sinh "${student.fullName}".`);
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa học sinh.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyUsername = (student: StudentRecord) => {
    navigator.clipboard.writeText(student.username);
    setCopiedId(student.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Distinct classes list
  const classes = Array.from(new Set(students.map(s => s.className || '12A1'))).sort();

  // Filter & Sort
  const filteredStudents = students
    .filter(s => {
      const matchSearch =
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.className && s.className.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchClass = selectedClass === 'all' || s.className === selectedClass;
      return matchSearch && matchClass;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.fullName.localeCompare(b.fullName, 'vi');
      if (sortBy === 'avgScore') return (b.avgScore || 0) - (a.avgScore || 0);
      if (sortBy === 'totalExams') return (b.totalExamsTaken || 0) - (a.totalExamsTaken || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Calculate summary stats
  const totalExamsSubmitted = students.reduce((sum, s) => sum + (s.totalExamsTaken || 0), 0);
  const studentsWithExams = students.filter(s => s.totalExamsTaken > 0);
  const classAvgScore = studentsWithExams.length
    ? Number((studentsWithExams.reduce((sum, s) => sum + (s.avgScore || 0), 0) / studentsWithExams.length).toFixed(2))
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Quản Lý Tài Khoản Học Sinh
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {students.length} học sinh
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Cấp tài khoản đăng nhập cho học sinh làm bài thi trực tuyến, đặt lại mật khẩu và theo dõi điểm số.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setCredentialsModalOpen(true)}
            disabled={students.length === 0}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
            title="In phiếu hoặc xuất danh sách tài khoản học sinh"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất Thẻ / In Phiếu</span>
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tạo Tài Khoản Học Sinh</span>
          </button>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center justify-between animate-fade-in">
          <span className="font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            {message}
          </span>
          <button onClick={() => setMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            &times;
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tổng số học sinh</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{students.length}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Đã đăng ký tài khoản</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Số lớp học</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{classes.length}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {classes.slice(0, 3).join(', ')} {classes.length > 3 ? '...' : ''}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tổng lượt bài thi</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{totalExamsSubmitted}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Bài thi đã nộp</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Điểm TB toàn khối</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {classAvgScore > 0 ? `${classAvgScore.toFixed(2)}/10` : '---'}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {studentsWithExams.length} học sinh có điểm
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên học sinh, tài khoản, lớp học..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Lớp:</span>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">Tất cả lớp ({students.length})</option>
              {classes.map(cls => (
                <option key={cls} value={cls}>
                  Lớp {cls} ({students.filter(s => s.className === cls).length})
                </option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="newest">Mới tạo nhất</option>
              <option value="name">Tên học sinh (A-Z)</option>
              <option value="avgScore">Điểm trung bình (Cao &rarr; Thấp)</option>
              <option value="totalExams">Số bài thi đã làm</option>
            </select>
          </div>

          <button
            onClick={loadStudents}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-2xs">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
          <p className="text-xs text-slate-500">Đang tải danh sách học sinh...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Không tìm thấy tài khoản học sinh phù hợp</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || selectedClass !== 'all'
              ? 'Thử thay đổi từ khóa tìm kiếm hoặc chọn lớp học khác.'
              : 'Chưa có tài khoản học sinh nào trong hệ thống. Hãy bấm nút tạo mới bên dưới để cấp tài khoản.'}
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Tạo tài khoản học sinh ngay
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Học sinh</th>
                  <th className="px-5 py-3.5">Mã / Tên đăng nhập</th>
                  <th className="px-5 py-3.5">Lớp</th>
                  <th className="px-5 py-3.5 text-center">Số bài đã thi</th>
                  <th className="px-5 py-3.5 text-center">Điểm trung bình</th>
                  <th className="px-5 py-3.5">Ngày tham gia</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map(st => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {st.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{st.fullName}</div>
                          <div className="text-[11px] text-slate-400">ID: #{st.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <span className="font-mono text-indigo-700 font-semibold text-xs">{st.username}</span>
                        <button
                          onClick={() => handleCopyUsername(st)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Sao chép tên đăng nhập"
                        >
                          {copiedId === st.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-200">
                        {st.className || '12A1'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-center font-semibold text-slate-700">
                      {st.totalExamsTaken > 0 ? (
                        <span className="inline-flex items-center gap-1 text-slate-800">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          {st.totalExamsTaken} bài
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Chưa thi</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          st.totalExamsTaken === 0
                            ? 'bg-slate-50 text-slate-400 border-slate-200'
                            : st.avgScore >= 8
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : st.avgScore >= 6.5
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : st.avgScore >= 5
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {st.totalExamsTaken > 0 ? `${st.avgScore.toFixed(2)}/10` : '---'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-[11px] text-slate-500">
                      {new Date(st.createdAt).toLocaleDateString('vi-VN')}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Switch View to Student */}
                        {onSwitchToStudent && (
                          <button
                            onClick={() => onSwitchToStudent(st.username)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Chuyển sang góc nhìn của học sinh này (Đăng nhập thử)"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}

                        {/* Edit / Reset Password */}
                        <button
                          onClick={() => setEditingStudent(st)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Đổi mật khẩu / Sửa thông tin"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete Student */}
                        <button
                          onClick={() => handleDelete(st)}
                          disabled={deletingId === st.id}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Xóa tài khoản học sinh"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateStudentModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreated}
        existingClasses={classes.length > 0 ? classes : ['12A1', '12A2', '12A3']}
      />

      <EditStudentModal
        isOpen={Boolean(editingStudent)}
        student={editingStudent}
        onClose={() => setEditingStudent(null)}
        onSuccess={handleEdited}
        existingClasses={classes.length > 0 ? classes : ['12A1', '12A2', '12A3']}
      />

      <StudentCredentialsModal
        isOpen={credentialsModalOpen}
        onClose={() => setCredentialsModalOpen(false)}
        students={students}
      />
    </div>
  );
};
