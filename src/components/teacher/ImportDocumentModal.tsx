import React, { useState, useRef } from 'react';
import { Question, QuestionLevel, COMMON_TOPICS, LEVEL_LABELS } from '../../types.js';
import { api } from '../../services/api.js';
import { MathView } from '../MathView.js';
import {
  Upload,
  FileText,
  FileCode2,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Sparkles,
  RefreshCw,
  HelpCircle,
  FileCheck,
  Edit3
} from 'lucide-react';

interface ImportDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (count: number) => void;
}

export const ImportDocumentModal: React.FC<ImportDocumentModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [rawText, setRawText] = useState('');
  const [defaultTopic, setDefaultTopic] = useState<string>(COMMON_TOPICS[0]);

  // Parsing state
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parserUsed, setParserUsed] = useState<string | null>(null);

  // Parsed results list
  const [parsedQuestions, setParsedQuestions] = useState<Omit<Question, 'id' | 'createdAt'>[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'docx' && ext !== 'doc' && ext !== 'pdf') {
      setParseError('Hệ thống hiện hỗ trợ file Microsoft Word (.docx, .doc) và file PDF (.pdf).');
      return;
    }
    setSelectedFile(file);
    setParseError(null);
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:...;base64, prefix
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleParse = async () => {
    setParseError(null);
    setParsing(true);

    try {
      let payload: {
        base64?: string;
        mimeType?: string;
        fileName?: string;
        rawText?: string;
        defaultTopic?: string;
      } = { defaultTopic };

      if (activeTab === 'upload') {
        if (!selectedFile) {
          throw new Error('Vui lòng chọn hoặc kéo thả một file Word hoặc PDF.');
        }
        const base64 = await convertFileToBase64(selectedFile);
        payload.base64 = base64;
        payload.fileName = selectedFile.name;
        payload.mimeType = selectedFile.type || (selectedFile.name.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      } else {
        if (!rawText.trim()) {
          throw new Error('Vui lòng dán nội dung văn bản đề thi vào ô bên dưới.');
        }
        payload.rawText = rawText;
      }

      const res = await api.importDocument(payload);
      if (!res.questions || res.questions.length === 0) {
        throw new Error('Không phát hiện được câu hỏi trắc nghiệm nào trong tài liệu. Vui lòng kiểm tra định dạng câu hỏi (Ví dụ: Câu 1: ... A. ... B. ... C. ... D. ...).');
      }

      setParsedQuestions(res.questions);
      setParserUsed(res.parserUsed);
      // Select all by default
      const initialSelected: Record<number, boolean> = {};
      res.questions.forEach((_, idx) => {
        initialSelected[idx] = true;
      });
      setSelectedIndices(initialSelected);
    } catch (err: any) {
      setParseError(err.message || 'Lỗi khi phân tích tệp tài liệu.');
    } finally {
      setParsing(false);
    }
  };

  const toggleSelect = (index: number) => {
    setSelectedIndices(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleSelectAll = () => {
    const allSelected = parsedQuestions.every((_, idx) => selectedIndices[idx]);
    const next: Record<number, boolean> = {};
    parsedQuestions.forEach((_, idx) => {
      next[idx] = !allSelected;
    });
    setSelectedIndices(next);
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    setParsedQuestions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveQuestion = (index: number) => {
    setParsedQuestions(prev => prev.filter((_, idx) => idx !== index));
    setSelectedIndices(prev => {
      const next: Record<number, boolean> = {};
      let nextIdx = 0;
      parsedQuestions.forEach((_, idx) => {
        if (idx !== index) {
          next[nextIdx] = prev[idx] ?? true;
          nextIdx++;
        }
      });
      return next;
    });
  };

  const handleSaveToBank = async () => {
    const questionsToSave = parsedQuestions.filter((_, idx) => selectedIndices[idx]);
    if (questionsToSave.length === 0) {
      alert('Vui lòng chọn ít nhất 1 câu hỏi để lưu vào ngân hàng.');
      return;
    }

    try {
      setSaving(true);
      const res = await api.createQuestionsBulk(questionsToSave);
      onImportSuccess(res.createdCount);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Lỗi lưu câu hỏi vào ngân hàng.');
    } finally {
      setSaving(false);
    }
  };

  const loadSampleText = () => {
    setRawText(`Câu 1: Cho hàm số $y = f(x)$ có bảng biến thiên với đạo hàm $f'(x) = x^2 - 4x + 3$. Hàm số đồng biến trên khoảng nào dưới đây?
A. $(1; 3)$
B. $(-\\infty; 1)$ và $(3; +\\infty)$
C. $(-1; 3)$
D. $(0; 4)$
Đáp án: B
Lời giải: Ta có $f'(x) = 0 \\iff x = 1$ hoặc $x = 3$. Bảng xét dấu cho thấy $f'(x) > 0$ trên $(-\\infty; 1)$ và $(3; +\\infty)$.

Câu 2: Tìm nguyên hàm $\\int (2x + \\sin x) dx$.
A. $x^2 - \\cos x + C$
B. $x^2 + \\cos x + C$
C. $2 - \\cos x + C$
D. $x^2 - \\sin x + C$
Đáp án: A
Lời giải: $\\int 2x dx = x^2$, $\\int \\sin x dx = -\\cos x$. Vậy nguyên hàm là $x^2 - \\cos x + C$.

Câu 3: Trong không gian $Oxyz$, cho mặt cầu $(S): (x-1)^2 + (y-2)^2 + (z+1)^2 = 25$. Tìm bán kính $R$ của $(S)$.
A. $R = 25$
B. $R = 5$
C. $R = \\sqrt{5}$
D. $R = 10$
Đáp án: B
Lời giải: Phương trình có $R^2 = 25 \\implies R = 5$.`);
  };

  const selectedCount = parsedQuestions.filter((_, idx) => selectedIndices[idx]).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Tải lên Câu hỏi từ File Word (.docx) hoặc PDF
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Hỗ trợ công thức LaTeX
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tự động nhận diện công thức toán học, trắc nghiệm 4 đáp án A/B/C/D, mức độ tư duy và lời giải.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {parsedQuestions.length === 0 ? (
            /* STEP 1: Upload or Paste */
            <div className="space-y-5">
              {/* Tabs */}
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl max-w-sm">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'upload'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Tải file Word / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('paste')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'paste'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileCode2 className="w-4 h-4" />
                  Dán văn bản trực tiếp
                </button>
              </div>

              {/* Default Topic Selector */}
              <div className="flex items-center gap-3 bg-indigo-50/70 p-3 rounded-xl border border-indigo-100">
                <label className="text-xs font-semibold text-indigo-900 whitespace-nowrap">
                  Chuyên đề mặc định:
                </label>
                <select
                  value={defaultTopic}
                  onChange={e => setDefaultTopic(e.target.value)}
                  className="bg-white border border-indigo-200 text-xs text-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {COMMON_TOPICS.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-indigo-700">
                  (Hệ thống sẽ tự nhận diện theo từng câu, nếu không khớp sẽ lấy chuyên đề này)
                </span>
              </div>

              {/* Tab Content: Upload File */}
              {activeTab === 'upload' ? (
                <div className="space-y-4">
                  <div
                    onDragOver={e => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      dragOver
                        ? 'border-indigo-500 bg-indigo-50/50'
                        : selectedFile
                        ? 'border-emerald-400 bg-emerald-50/40'
                        : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      accept=".docx,.doc,.pdf"
                      className="hidden"
                    />

                    {selectedFile ? (
                      <div className="flex flex-col items-center gap-2 text-emerald-700">
                        <FileCheck className="w-12 h-12 text-emerald-600" />
                        <span className="font-semibold text-sm text-slate-800">{selectedFile.name}</span>
                        <span className="text-xs text-slate-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB — Bấm để chọn file khác
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <Upload className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            Kéo thả file đề thi vào đây, hoặc <span className="text-indigo-600 underline">chọn từ máy tính</span>
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Hỗ trợ định dạng <b>.docx</b> (Word 2007+), <b>.doc</b> và <b>.pdf</b>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Format Notice */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1.5">
                    <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-indigo-600" />
                      Quy chuẩn đề bài được hỗ trợ tốt nhất:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li>Bắt đầu câu hỏi bằng <b>Câu 1:</b>, <b>Câu 2:</b> hoặc <b>Bài 1:</b></li>
                      <li>Các đáp án theo mẫu <b>A. [Nội dung]</b>, <b>B. ...</b>, <b>C. ...</b>, <b>D. ...</b></li>
                      <li>Đáp án đúng có thể ghi ở dạng <b>Đáp án: A</b> (hoặc gạch chân, in đậm, đánh dấu *)</li>
                      <li>Công thức toán học có thể dùng chuẩn LaTeX (ví dụ <code>$x^2 + y^2 = 1$</code>) hoặc phương trình Word thông thường</li>
                    </ul>
                  </div>
                </div>
              ) : (
                /* Tab Content: Paste Raw Text */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Dán nội dung văn bản đề thi vào đây:
                    </label>
                    <button
                      type="button"
                      onClick={loadSampleText}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Dán mẫu thử nghiệm
                    </button>
                  </div>
                  <textarea
                    rows={12}
                    value={rawText}
                    onChange={e => setRawText(e.target.value)}
                    placeholder={`Câu 1: Cho hàm số y = f(x)...&#10;A. ...&#10;B. ...&#10;C. ...&#10;D. ...&#10;Đáp án: A&#10;Lời giải: ...`}
                    className="w-full font-mono text-xs p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Error Message */}
              {parseError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Action Parse Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Hủy bỏ
                </button>

                <button
                  type="button"
                  disabled={parsing || (activeTab === 'upload' && !selectedFile) || (activeTab === 'paste' && !rawText.trim())}
                  onClick={handleParse}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-all shadow-xs flex items-center gap-2"
                >
                  {parsing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Đang phân tích & trích xuất câu hỏi...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Bắt đầu Phân tích & Trích xuất
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: Review and Approve Parsed Questions */
            <div className="space-y-4">
              {/* Header Summary */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-sm text-emerald-900">
                      Trích xuất thành công {parsedQuestions.length} câu hỏi trắc nghiệm!
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Động cơ phân tích:{' '}
                    <span className="font-semibold uppercase tracking-wider">
                      {parserUsed === 'gemini-ai' ? 'Gemini AI (Tối ưu công thức LaTeX)' : 'Quy chuẩn cấu trúc'}
                    </span>
                    . Vui lòng kiểm tra lại trước khi lưu vào ngân hàng.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100/50 transition-colors"
                  >
                    {parsedQuestions.every((_, idx) => selectedIndices[idx]) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setParsedQuestions([]);
                      setSelectedFile(null);
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Tải file khác
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {parsedQuestions.map((q, idx) => {
                  const isSelected = selectedIndices[idx] ?? true;
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-indigo-200 bg-white shadow-xs'
                          : 'border-slate-200 bg-slate-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(idx)}
                            className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
                          />
                          <span className="font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                            Câu {idx + 1}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Topic selector */}
                          <select
                            value={q.topic}
                            onChange={e => handleQuestionChange(idx, 'topic', e.target.value)}
                            className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
                          >
                            {COMMON_TOPICS.map(t => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>

                          {/* Level selector */}
                          <select
                            value={q.level}
                            onChange={e => handleQuestionChange(idx, 'level', e.target.value as QuestionLevel)}
                            className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium"
                          >
                            <option value="nhan_biet">Nhận biết</option>
                            <option value="thong_hieu">Thông hiểu</option>
                            <option value="van_dung">Vận dụng</option>
                            <option value="van_dung_cao">Vận dụng cao</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                            title="Xóa câu này khỏi danh sách nhập"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Question Content */}
                      <div className="text-xs text-slate-800 font-medium leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                        <MathView text={q.content} />
                      </div>

                      {/* 4 Options */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                        {(['A', 'B', 'C', 'D'] as const).map(opt => {
                          const isCorrect = q.correctOption === opt;
                          const optKey = `option${opt}` as keyof typeof q;
                          const optVal = q[optKey] as string;

                          return (
                            <button
                              type="button"
                              key={opt}
                              onClick={() => handleQuestionChange(idx, 'correctOption', opt)}
                              className={`p-2.5 rounded-lg text-left text-xs border transition-all flex items-start gap-2 ${
                                isCorrect
                                  ? 'border-emerald-400 bg-emerald-50 text-emerald-950 font-medium shadow-xs ring-1 ring-emerald-400'
                                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {opt}
                              </span>
                              <div className="flex-1 overflow-x-auto">
                                <MathView text={optVal} />
                              </div>
                              {isCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="mt-2 text-[11px] text-slate-600 bg-amber-50/60 border border-amber-200/60 p-2.5 rounded-lg">
                          <span className="font-semibold text-amber-900">Lời giải: </span>
                          <MathView text={q.explanation} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <span className="text-xs text-slate-600 font-medium">
                  Đã chọn: <b className="text-indigo-600 font-bold">{selectedCount}</b> / {parsedQuestions.length} câu hỏi
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    Hủy bỏ
                  </button>

                  <button
                    type="button"
                    disabled={saving || selectedCount === 0}
                    onClick={handleSaveToBank}
                    className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-xs flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Đang lưu vào ngân hàng...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Lưu {selectedCount} câu hỏi vào ngân hàng
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
