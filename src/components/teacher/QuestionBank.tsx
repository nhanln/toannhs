import React, { useState, useEffect } from 'react';
import { Question, QuestionLevel, LEVEL_LABELS, COMMON_TOPICS, Folder } from '../../types.js';
import { api } from '../../services/api.js';
import { MathView } from '../MathView.js';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  UploadCloud,
  FileText,
  Sparkles,
  Check,
  Folder as FolderIcon,
  FolderInput,
  FolderPlus,
  CheckSquare,
  Square
} from 'lucide-react';
import { ImportDocumentModal } from './ImportDocumentModal.js';
import { DocumentUploadSection } from './DocumentUploadSection.js';
import { FolderBar } from './FolderBar.js';
import { FolderModal, FOLDER_COLORS } from './FolderModal.js';
import { MoveToFolderModal } from './MoveToFolderModal.js';

export const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Folder states
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<'all' | 'uncategorized' | number>('all');
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [questionsToMove, setQuestionsToMove] = useState<number[]>([]);

  // Batch multi-select state
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);

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
  const [formFolderId, setFormFolderId] = useState<number | null>(null);
  const [formContent, setFormContent] = useState('');
  const [formOptionA, setFormOptionA] = useState('');
  const [formOptionB, setFormOptionB] = useState('');
  const [formOptionC, setFormOptionC] = useState('');
  const [formOptionD, setFormOptionD] = useState('');
  const [formCorrect, setFormCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [formExplanation, setFormExplanation] = useState('');
  const [activeInput, setActiveInput] = useState<'content' | 'optionA' | 'optionB' | 'optionC' | 'optionD' | 'explanation'>('content');
  const [submitting, setSubmitting] = useState(false);

  // Load folders
  const loadFolders = async () => {
    try {
      const res = await api.getFolders('question');
      setFolders(res.folders);
    } catch (e) {
      console.error('Error loading folders:', e);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getQuestions({
        topic: selectedTopic,
        level: selectedLevel,
        search: searchQuery,
        folderId: selectedFolderId
      });
      setQuestions(res.questions);
    } catch (e: any) {
      setError(e.message || 'Không thể tải danh sách câu hỏi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    fetchQuestions();
    setSelectedQuestionIds([]);
  }, [selectedTopic, selectedLevel, selectedFolderId]);

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
    setFormFolderId(typeof selectedFolderId === 'number' ? selectedFolderId : null);
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
    loadFolders();
    setBannerMessage(`Đã thêm thành công ${count} câu hỏi từ file Word / PDF vào ngân hàng!`);
    setTimeout(() => setBannerMessage(null), 6000);
  };

  const openEditModal = (q: Question) => {
    setEditingQuestion(q);
    setAddModalTab('manual');
    setFormTopic(q.topic);
    setFormLevel(q.level);
    setFormFolderId(q.folderId ?? null);
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
          folderId: formFolderId,
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
          folderId: formFolderId,
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
      loadFolders();
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
      loadFolders();
    } catch (e: any) {
      alert(e.message || 'Không thể xóa câu hỏi');
    }
  };

  // Folder CRUD handlers
  const handleCreateOrUpdateFolder = async (data: { name: string; description: string; color: string }) => {
    if (editingFolder) {
      await api.updateFolder(editingFolder.id, data);
      setBannerMessage(`Đã cập nhật thư mục "${data.name}"`);
    } else {
      const res = await api.createFolder({
        name: data.name,
        type: 'question',
        description: data.description,
        color: data.color
      });
      setSelectedFolderId(res.folder.id);
      setBannerMessage(`Đã tạo thư mục mới "${res.folder.name}"`);
    }
    await loadFolders();
    fetchQuestions();
    setTimeout(() => setBannerMessage(null), 5000);
  };

  const handleDeleteFolder = async (folder: Folder) => {
    if (!confirm(`Bạn có chắc muốn xóa thư mục "${folder.name}"?\nCác câu hỏi bên trong sẽ được chuyển về "Chưa phân loại" (không bị xóa).`)) {
      return;
    }
    try {
      await api.deleteFolder(folder.id);
      if (selectedFolderId === folder.id) {
        setSelectedFolderId('all');
      }
      await loadFolders();
      fetchQuestions();
      setBannerMessage(`Đã xóa thư mục "${folder.name}". Các câu hỏi đã chuyển về chưa phân loại.`);
      setTimeout(() => setBannerMessage(null), 5000);
    } catch (e: any) {
      alert(e.message || 'Không thể xóa thư mục');
    }
  };

  // Move items to folder handler
  const handleConfirmMoveToFolder = async (targetFolderId: number | null) => {
    if (questionsToMove.length === 0) return;
    const res = await api.moveQuestionsToFolder(questionsToMove, targetFolderId);
    setBannerMessage(res.message);
    setSelectedQuestionIds([]);
    await loadFolders();
    fetchQuestions();
    setTimeout(() => setBannerMessage(null), 5000);
  };

  const openMoveModalForSelected = () => {
    if (selectedQuestionIds.length === 0) return;
    setQuestionsToMove(selectedQuestionIds);
    setIsMoveModalOpen(true);
  };

  const openMoveModalForSingle = (questionId: number) => {
    setQuestionsToMove([questionId]);
    setIsMoveModalOpen(true);
  };

  const toggleSelectQuestion = (id: number) => {
    setSelectedQuestionIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    if (selectedQuestionIds.length === questions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(questions.map(q => q.id));
    }
  };

  const handleResetSeed = async () => {
    if (!confirm('Khôi phục lại toàn bộ ngân hàng câu hỏi mẫu chuẩn THPT Quốc Gia?')) return;
    try {
      await api.resetSampleData();
      loadFolders();
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
    const currentSetter = setters[activeInput];
    if (currentSetter) {
      currentSetter(prev => prev ? `${prev} ${snippet}` : snippet);
    }
  };

  // Counts for folders
  const totalCount = folders.reduce((sum, f) => sum + (f.itemCount ?? 0), 0);
  const uncategorizedFolder = folders.find(f => f.id === 0);
  const uncategorizedCount = uncategorizedFolder?.itemCount ?? 0;
  const activeFolderObj = typeof selectedFolderId === 'number' ? folders.find(f => f.id === selectedFolderId) : null;

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

      {/* Folder Bar */}
      <FolderBar
        folders={folders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
        onOpenCreateModal={() => {
          setEditingFolder(null);
          setIsFolderModalOpen(true);
        }}
        onOpenEditModal={(folder) => {
          setEditingFolder(folder);
          setIsFolderModalOpen(true);
        }}
        onDeleteFolder={handleDeleteFolder}
        folderType="question"
        totalCount={totalCount}
        uncategorizedCount={uncategorizedCount}
      />

      {/* Active Folder Header */}
      {activeFolderObj && (
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0"
              style={{ backgroundColor: activeFolderObj.color || '#4f46e5' }}
            />
            <div>
              <span className="font-bold text-slate-800 text-sm">{activeFolderObj.name}</span>
              {activeFolderObj.description && (
                <span className="text-xs text-slate-500 ml-2">— {activeFolderObj.description}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingFolder(activeFolderObj);
                setIsFolderModalOpen(true);
              }}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 px-2 py-1 rounded-md hover:bg-white transition-colors"
            >
              Sửa thư mục
            </button>
            <button
              onClick={() => handleDeleteFolder(activeFolderObj)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-2 py-1 rounded-md hover:bg-white transition-colors"
            >
              Xóa thư mục
            </button>
          </div>
        </div>
      )}

      {/* Batch Selection Action Bar */}
      {selectedQuestionIds.length > 0 && (
        <div className="p-3 bg-indigo-900 text-white rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-md animate-fade-in">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckSquare className="w-4 h-4 text-indigo-300" />
            <span>Đã chọn {selectedQuestionIds.length} câu hỏi</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openMoveModalForSelected}
              className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <FolderInput className="w-3.5 h-3.5" />
              Chuyển vào Thư mục...
            </button>
            <button
              type="button"
              onClick={() => setSelectedQuestionIds([])}
              className="px-3 py-1.5 bg-indigo-800 hover:bg-indigo-700 text-indigo-200 text-xs rounded-lg transition-colors"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Select All Checkbox */}
        {questions.length > 0 && (
          <button
            type="button"
            onClick={toggleSelectAllVisible}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors shrink-0"
            title="Chọn / Bỏ chọn tất cả câu hỏi đang hiển thị"
          >
            {selectedQuestionIds.length > 0 && selectedQuestionIds.length === questions.length ? (
              <CheckSquare className="w-4 h-4 text-indigo-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Chọn tất cả ({questions.length})</span>
          </button>
        )}

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
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Checkbox for batch move */}
                    <button
                      type="button"
                      onClick={() => toggleSelectQuestion(q.id)}
                      className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                      title={selectedQuestionIds.includes(q.id) ? 'Bỏ chọn' : 'Chọn câu hỏi'}
                    >
                      {selectedQuestionIds.includes(q.id) ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 hover:text-slate-400" />
                      )}
                    </button>

                    <span className="font-bold text-slate-800 text-sm px-2.5 py-1 bg-slate-100 rounded-lg">
                      Câu {idx + 1}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${levelInfo.color}`}>
                      {levelInfo.label}
                    </span>
                    <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                      {q.topic}
                    </span>

                    {/* Folder Badge */}
                    {q.folderName ? (
                      <button
                        type="button"
                        onClick={() => openMoveModalForSingle(q.id)}
                        className="text-xs px-2.5 py-0.5 rounded-md font-medium border bg-indigo-50/70 text-indigo-700 border-indigo-200 flex items-center gap-1.5 hover:bg-indigo-100 transition-colors"
                        title="Bấm để chuyển thư mục"
                      >
                        <FolderIcon className="w-3 h-3 text-indigo-600 shrink-0" />
                        <span className="max-w-[150px] truncate">{q.folderName}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openMoveModalForSingle(q.id)}
                        className="text-xs px-2 py-0.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-dashed border-slate-300 flex items-center gap-1 transition-colors"
                        title="Chưa phân loại - Bấm để chuyển vào thư mục"
                      >
                        <FolderInput className="w-3 h-3" />
                        <span>Chưa phân loại</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openMoveModalForSingle(q.id)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 text-xs"
                      title="Chuyển vào thư mục khác"
                    >
                      <FolderInput className="w-4 h-4" />
                    </button>
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
                  {/* Folder Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <FolderIcon className="w-3.5 h-3.5 text-indigo-600" />
                        Thư mục lưu trữ câu hỏi
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFolder(null);
                          setIsFolderModalOpen(true);
                        }}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Tạo thư mục mới
                      </button>
                    </div>
                    <select
                      value={formFolderId ?? ''}
                      onChange={(e) => setFormFolderId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white"
                    >
                      <option value="">-- Chưa phân loại (Không thuộc thư mục nào) --</option>
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.itemCount ?? 0} câu)
                        </option>
                      ))}
                    </select>
                  </div>

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
          loadFolders();
          alert(`Đã nhập thành công ${count} câu hỏi vào ngân hàng!`);
        }}
      />

      {/* Folder Create / Edit Modal */}
      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => {
          setIsFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onSubmit={handleCreateOrUpdateFolder}
        folderType="question"
        editingFolder={editingFolder}
      />

      {/* Move questions to folder modal */}
      <MoveToFolderModal
        isOpen={isMoveModalOpen}
        onClose={() => {
          setIsMoveModalOpen(false);
          setQuestionsToMove([]);
        }}
        folders={folders}
        itemCount={questionsToMove.length}
        itemType="question"
        onConfirmMove={handleConfirmMoveToFolder}
        onOpenCreateFolder={() => {
          setEditingFolder(null);
          setIsFolderModalOpen(true);
        }}
      />
    </div>
  );
};
