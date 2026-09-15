import React, { useState, useEffect } from 'react';
import { Question, QuestionLevel, LEVEL_LABELS, COMMON_TOPICS } from '../../types.js';
import { api } from '../../services/api.js';
import { MathView } from '../MathView.js';
import { Plus, Search, Filter, Trash2, Edit3, CheckCircle2, ChevronDown, ChevronUp, RefreshCw, Eye, UploadCloud, FileText, Sparkles, Check } from 'lucide-react';
import { ImportDocumentModal } from './ImportDocumentModal.js';
import { DocumentUploadSection } from './DocumentUploadSection.js';

export const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Filters
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<QuestionLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addModalTab, setAddModalTab] = useState<'manual' | 'upload'>('manual');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<number, boolean>>({});

  // Form State
  const [formTopic, setFormTopic] = useState(COMMON_TOPICS[0]);
  const [formLevel, setFormLevel] = useState<QuestionLevel>('nhan_biet');
  const [formContent, setFormContent] = useState('');
  const [formOptionA, setFormOptionA] = useState('');
  const [formOptionB, setFormOptionB] = useState('');
  const [formOptionC, setFormOptionC] = useState('');
  const [formOptionD, setFormOptionD] = useState('');
  const [formCorrect, setFormCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [formExplanation, setFormExplanation] = useState('');
  const [activeInput, setActiveInput] = useState<'content' | 'optionA' | 'optionB' | 'optionC' | 'optionD' | 'explanation'>('content');
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getQuestions({
        topic: selectedTopic,
        level: selectedLevel,
        search: searchQuery
      });
      setQuestions(res.questions);
    } catch (e: any) {
      setError(e.message || 'Không thể tải danh sách câu hỏi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedTopic, selectedLevel]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuestions();
  };

  const toggleExplanation = (id: number) => {
    setExpandedExplanations(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateModal = (mode: 'manual' | 'upload' = 'manual') => {
    setEditingQuestion(null);
    setAddModalTab(mode);
    setFormTopic(COMMON_TOPICS[0]);
    setFormLevel('nhan_biet');
    setFormContent('');
    setFormOptionA('');
    setFormOptionB('');
    setFormOptionC('');
    setFormOptionD('');
    setFormCorrect('A');
    setFormExplanation('');
    setIsModalOpen(true);
  };

  const handleBulkImportSuccess = (count: number) => {
    setIsModalOpen(false);
    setIsImportModalOpen(false);
    fetchQuestions();
    setBannerMessage(`Đã thêm thành công ${count} câu hỏi từ file Word / PDF vào ngân hàng!`);
    setTimeout(() => setBannerMessage(null), 6000);
  };

  const openEditModal = (q: Question) => {
    setEditingQuestion(q);
    setAddModalTab('manual');
    setFormTopic(q.topic);
    setFormLevel(q.level);
    setFormContent(q.content);
    setFormOptionA(q.optionA);
    setFormOptionB(q.optionB);
    setFormOptionC(q.optionC);
    setFormOptionD(q.optionD);
    setFormCorrect(q.correctOption);
    setFormExplanation(q.explanation || '');
    setIsModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim() || !formOptionA.trim() || !formOptionB.trim() || !formOptionC.trim() || !formOptionD.trim()) {
      alert('Vui lòng điền nội dung câu hỏi và cả 4 phương án trả lời.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingQuestion) {
        await api.updateQuestion(editingQuestion.id, {
          topic: formTopic,
          level: formLevel,
          content: formContent,
          optionA: formOptionA,
          optionB: formOptionB,
          optionC: formOptionC,
          optionD: formOptionD,
          correctOption: formCorrect,
          explanation: formExplanation
        });
      } else {
        await api.createQuestion({
          topic: formTopic,
          level: formLevel,
          content: formContent,
          optionA: formOptionA,
          optionB: formOptionB,
          optionC: formOptionC,
          optionD: formOptionD,
          correctOption: formCorrect,
          explanation: formExplanation
        });
      }
      setIsModalOpen(false);
      fetchQuestions();
    } catch (err: any) {
      alert(err.message || 'Lỗi lưu câu hỏi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng?')) return;
    try {
      await api.deleteQuestion(id);
      fetchQuestions();
    } catch (e: any) {
      alert(e.message || 'Không thể xóa câu hỏi');
    }
  };

  const handleResetSeed = async () => {
    if (!confirm('Khôi phục lại toàn bộ ngân hàng câu hỏi mẫu chuẩn THPT Quốc Gia?')) return;
    try {
      await api.resetSampleData();
      fetchQuestions();
      alert('Đã khôi phục dữ liệu mẫu thành công!');
    } catch (e: any) {
      alert(e.message || 'Lỗi');
    }
  };

  const insertFormula = (snippet: string) => {
    const setters = {
      content: setFormContent,
      optionA: setFormOptionA,
      optionB: setFormOptionB,
      optionC: setFormOptionC,
      optionD: setFormOptionD,
      explanation: setFormExplanation,
    };
    const values = {
      content: formContent,
      optionA: formOptionA,
      optionB: formOptionB,
      optionC: formOptionC,
      optionD: formOptionD,
      explanation: formExplanation,
    };

    setters[activeInput]((prev: string) => prev + snippet);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Ngân hàng Câu hỏi Môn Toán
            <span className="text-sm font-normal px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {questions.length} câu
            </span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Quản lý cơ sở dữ liệu câu hỏi trắc nghiệm Toán theo 4 mức độ tư duy (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao) và công thức LaTeX.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleResetSeed}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
            title="Khôi phục lại bộ câu hỏi mẫu"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Khôi phục mẫu
          </button>

          <button
            onClick={() => openCreateModal('upload')}
            className="px-3.5 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            title="Tự động trích xuất câu hỏi từ file Word (.docx) hoặc PDF"
          >
            <UploadCloud className="w-4 h-4 text-indigo-600" />
            Tải từ Word / PDF
          </button>

          <button
            onClick={() => openCreateModal('manual')}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Thêm câu hỏi mới
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {bannerMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-sm shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{bannerMessage}</span>
          </div>
          <button
            onClick={() => setBannerMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 text-xs font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm nội dung câu hỏi, chủ đề, công thức..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
          />
        </form>

        {/* Topic Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Chủ đề:</span>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tất cả chủ đề</option>
            {COMMON_TOPICS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Level Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Mức độ:</span>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as any)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tất cả mức độ</option>
            <option value="nhan_biet">Nhận biết</option>
            <option value="thong_hieu">Thông hiểu</option>
            <option value="van_dung">Vận dụng</option>
            <option value="van_dung_cao">Vận dụng cao</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
          <p className="text-sm text-slate-500">Đang tải câu hỏi từ hệ thống...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <p className="text-slate-600 font-medium">Không tìm thấy câu hỏi phù hợp với bộ lọc hiện tại.</p>
          <button
            onClick={() => { setSelectedTopic('all'); setSelectedLevel('all'); setSearchQuery(''); }}
            className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 underline"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const levelInfo = LEVEL_LABELS[q.level];
            const isExpOpen = !!expandedExplanations[q.id];

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all p-5"
              >
                {/* Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm px-2.5 py-1 bg-slate-100 rounded-lg">
                      Câu {idx + 1}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${levelInfo.color}`}>
                      {levelInfo.label}
                    </span>
                    <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                      {q.topic}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(q)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Chỉnh sửa câu hỏi"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Content */}
                <div className="text-slate-900 font-medium text-base mb-4">
                  <MathView content={q.content} />
                </div>

                {/* 4 Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                    const optText = q[`option${optKey}` as keyof Question] as string;
                    const isCorrect = q.correctOption === optKey;

                    return (
                      <div
                        key={optKey}
                        className={`p-3 rounded-xl border text-sm flex items-start gap-2.5 transition-all ${
                          isCorrect
                            ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950 font-medium ring-1 ring-emerald-300/50'
                            : 'bg-slate-50/50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {optKey}
                        </span>
                        <div className="flex-1 overflow-x-auto">
                          <MathView content={optText} />
                        </div>
                        {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation accordion */}
                {q.explanation && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => toggleExplanation(q.id)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 focus:outline-hidden"
                    >
                      {isExpOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {isExpOpen ? 'Ẩn lời giải chi tiết' : 'Xem lời giải chi tiết'}
                    </button>

                    {isExpOpen && (
                      <div className="mt-2.5 p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-sm text-slate-800">
                        <div className="font-semibold text-indigo-900 text-xs mb-1">Lời giải chi tiết:</div>
                        <MathView content={q.explanation} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900">
                  {editingQuestion ? 'Chỉnh sửa Câu hỏi' : 'Thêm Câu hỏi mới vào Ngân hàng'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            {/* Mode Switcher Tabs for Adding */}
            {!editingQuestion && (
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl my-3 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAddModalTab('manual')}
                  className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                    addModalTab === 'manual'
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>1. Nhập thủ công & Soạn công thức LaTeX</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddModalTab('upload')}
                  className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                    addModalTab === 'upload'
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>2. Tải lên từ file Word (.docx) hoặc PDF (.pdf)</span>
                </button>
              </div>
            )}

            {/* If Word / PDF Upload mode */}
            {!editingQuestion && addModalTab === 'upload' ? (
              <div className="overflow-y-auto pr-1 flex-1 py-2">
                <DocumentUploadSection
                  onSuccess={handleBulkImportSuccess}
                  onCancel={() => setIsModalOpen(false)}
                />
              </div>
            ) : (
              /* Manual Input Mode */
              <>
                {!editingQuestion && (
                  <div className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-xl text-xs flex items-center justify-between gap-3 text-indigo-950 mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Có sẵn file đề thi? Bóc tách tự động từ <b>file Word (.docx)</b> hoặc <b>PDF (.pdf)</b> sang câu hỏi & công thức Toán chuẩn LaTeX.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddModalTab('upload')}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-2xs transition-colors shrink-0 text-[11px] flex items-center gap-1"
                    >
                      <UploadCloud className="w-3 h-3" />
                      Tải file ngay &rarr;
                    </button>
                  </div>
                )}

                {/* Quick LaTeX Bar */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 mb-3">
                  <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                    <span>Chèn nhanh công thức Toán vào ô đang chọn:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {[
                      { label: 'Phân số', code: '$\\frac{a}{b}$' },
                      { label: 'Căn bậc hai', code: '$\\sqrt{x}$' },
                      { label: 'Mũ', code: '$x^2$' },
                      { label: 'Chỉ số', code: '$x_1$' },
                      { label: 'Tích phân', code: '$\\int_0^1 f(x)dx$' },
                      { label: 'Logarit', code: '$\\log_a b$' },
                      { label: 'Vectơ', code: '$\\vec{n}$' },
                      { label: 'Vô cực', code: '$\\infty$' },
                      { label: 'Thuộc', code: '$\\in \\mathbb{R}$' },
                      { label: 'Tương đương', code: '$\\iff$' },
                      { label: 'Suy ra', code: '$\\implies$' },
                      { label: 'Hệ phương trình', code: '$\\begin{cases} x = 1 \\\\ y = 2 \\end{cases}$' }
                    ].map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => insertFormula(item.code)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded-md hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 font-mono text-[11px] transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSaveQuestion} className="overflow-y-auto space-y-4 pr-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Chủ đề môn Toán</label>
                      <select
                        value={formTopic}
                        onChange={(e) => setFormTopic(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white"
                      >
                        {COMMON_TOPICS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Mức độ tư duy</label>
                      <select
                        value={formLevel}
                        onChange={(e) => setFormLevel(e.target.value as QuestionLevel)}
                        className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white"
                      >
                        <option value="nhan_biet">Nhận biết</option>
                        <option value="thong_hieu">Thông hiểu</option>
                        <option value="van_dung">Vận dụng</option>
                        <option value="van_dung_cao">Vận dụng cao</option>
                      </select>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">Nội dung câu hỏi (hỗ trợ LaTeX)</label>
                      <span className="text-[11px] text-slate-400">Dùng $formula$ cho inline, $$formula$$ cho khối</span>
                    </div>
                    <textarea
                      rows={3}
                      value={formContent}
                      onFocus={() => setActiveInput('content')}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="Ví dụ: Cho hàm số $y = \frac{2x+1}{x-1}$. Tìm tiệm cận đứng..."
                      className="w-full text-sm border border-slate-200 rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      required
                    />
                    {formContent && (
                      <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Xem trước câu hỏi:</div>
                        <MathView content={formContent} />
                      </div>
                    )}
                  </div>

                  {/* 4 Options */}
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-700">Các phương án lựa chọn (Chọn nút tròn cho đáp án ĐÚNG):</label>
                    {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                      const val = opt === 'A' ? formOptionA : opt === 'B' ? formOptionB : opt === 'C' ? formOptionC : formOptionD;
                      const setter = opt === 'A' ? setFormOptionA : opt === 'B' ? setFormOptionB : opt === 'C' ? setFormOptionC : setFormOptionD;

                      return (
                        <div key={opt} className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() => setFormCorrect(opt)}
                            className={`w-7 h-7 mt-1 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                              formCorrect === opt
                                ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 ring-offset-1'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title="Chọn làm đáp án đúng"
                          >
                            {opt}
                          </button>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={val}
                              onFocus={() => setActiveInput(`option${opt}` as any)}
                              onChange={(e) => setter(e.target.value)}
                              placeholder={`Nội dung đáp án ${opt}...`}
                              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                              required
                            />
                            {val && (
                              <div className="mt-1 px-2 py-1 bg-slate-50 rounded text-xs">
                                <MathView content={val} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Lời giải chi tiết & Phương pháp giải</label>
                    <textarea
                      rows={2}
                      value={formExplanation}
                      onFocus={() => setActiveInput('explanation')}
                      onChange={(e) => setFormExplanation(e.target.value)}
                      placeholder="Giải thích từng bước, công thức biến đổi..."
                      className="w-full text-sm border border-slate-200 rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Đang lưu...' : editingQuestion ? 'Cập nhật' : 'Thêm vào Ngân hàng'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Import Word / PDF Modal */}
      <ImportDocumentModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={(count) => {
          fetchQuestions();
          alert(`Đã nhập thành công ${count} câu hỏi vào ngân hàng!`);
        }}
      />
    </div>
  );
};
