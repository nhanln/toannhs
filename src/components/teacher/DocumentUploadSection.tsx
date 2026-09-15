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
  FileCheck,
  Edit3,
  BookOpen,
  ArrowRight,
  HelpCircle
} from 'lucide-react';

interface DocumentUploadSectionProps {
  onSuccess: (count: number) => void;
  onCancel?: () => void;
}

export const DocumentUploadSection: React.FC<DocumentUploadSectionProps> = ({
  onSuccess,
  onCancel
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
        payload.mimeType =
          selectedFile.type ||
          (selectedFile.name.endsWith('.pdf')
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      } else {
        if (!rawText.trim()) {
          throw new Error('Vui lòng dán nội dung văn bản đề thi vào ô bên dưới.');
        }
        payload.rawText = rawText;
      }

      const res = await api.importDocument(payload);
      if (!res.questions || res.questions.length === 0) {
        throw new Error(
          'Không phát hiện được câu hỏi trắc nghiệm nào trong tài liệu. Vui lòng kiểm tra định dạng câu hỏi (Ví dụ: Câu 1: ... A. ... B. ... C. ... D. ...).'
        );
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
      onSuccess(res.createdCount);
    } catch (err: any) {
      alert(err.message || 'Lỗi lưu câu hỏi vào ngân hàng.');
    } finally {
      setSaving(false);
    }
  };

  const loadSampleText = () => {
    setRawText(`Câu 1: Cho hàm số $y = f(x)$ có đạo hàm $f'(x) = x^2 - 4x + 3$. Hàm số đồng biến trên khoảng nào dưới đây?
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
    <div className="space-y-5">
      {parsedQuestions.length === 0 ? (
        /* STEP 1: Upload or Paste */
        <div className="space-y-4">
          {/* Sub Tabs */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl max-w-sm">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Tải file Word / PDF
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'paste'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              Dán văn bản đề thi
            </button>
          </div>

          {/* Error display */}
          {parseError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{parseError}</p>
                <p className="text-[11px] text-rose-600 mt-1">
                  Mẹo: Đảm bảo file Word (.docx) hoặc PDF chứa các câu hỏi có tiền tố như <b>"Câu 1:"</b> và các phương án <b>"A. ... B. ... C. ... D. ..."</b>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'upload' ? (
            /* Upload File Dropzone */
            <div className="space-y-3">
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
                    ? 'border-indigo-500 bg-indigo-50/70 scale-[0.99]'
                    : selectedFile
                    ? 'border-emerald-400 bg-emerald-50/40'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.doc,.pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Kích thước: {(selectedFile.size / 1024).toFixed(1)} KB &bull; Định dạng:{' '}
                        {selectedFile.name.endsWith('.pdf') ? 'PDF' : 'Microsoft Word'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="text-xs text-rose-600 hover:underline inline-block mt-1 font-medium"
                    >
                      Chọn file khác
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Kéo thả file Word (.docx) hoặc PDF (.pdf) vào đây
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Hoặc bấm vào vùng này để duyệt file từ máy tính
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[11px] text-slate-600 font-medium mt-1">
                      <span>Hỗ trợ: .docx, .doc, .pdf</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Format Hint Guide */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-600 space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Quy chuẩn định dạng đề thi nhận diện tự động:</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-slate-500">
                  <li>Mỗi câu bắt đầu bằng <b>Câu 1:</b>, <b>Câu 2:</b> hoặc <b>Bài 1:</b></li>
                  <li>Bốn đáp án trắc nghiệm định dạng <b>A.</b>, <b>B.</b>, <b>C.</b>, <b>D.</b> (trên từng dòng hoặc cùng dòng)</li>
                  <li>Đáp án đúng có thể để ở dòng <b>Đáp án: A</b> hoặc in đậm/đánh dấu sao <b>*A.</b></li>
                  <li>Công thức toán học kẹp trong dấu <b>$formula$</b> hoặc chữ số mũ/chỉ số thông dụng</li>
                </ul>
              </div>
            </div>
          ) : (
            /* Paste Text Mode */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Dán nội dung đề thi vào khung bên dưới:
                </label>
                <button
                  type="button"
                  onClick={loadSampleText}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Tải văn bản mẫu đề Toán
                </button>
              </div>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder={`Câu 1: Cho hàm số y = f(x)...
A. ...
B. ...
C. ...
D. ...
Đáp án: A
Lời giải: ...`}
                rows={9}
                className="w-full text-xs font-mono border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          )}

          {/* Config options before parse */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-semibold">Chủ đề mặc định:</span>
              <select
                value={defaultTopic}
                onChange={e => setDefaultTopic(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500"
              >
                {COMMON_TOPICS.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
              )}
              <button
                type="button"
                onClick={handleParse}
                disabled={parsing || (activeTab === 'upload' && !selectedFile) || (activeTab === 'paste' && !rawText.trim())}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {parsing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang bóc tách câu hỏi & LaTeX...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Bắt đầu trích xuất câu hỏi &rarr;</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* STEP 2: Preview, Select and Bulk Save */
        <div className="space-y-4">
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-950">
                  Đã trích xuất thành công {parsedQuestions.length} câu hỏi từ tài liệu!
                </p>
                <p className="text-[11px] text-emerald-700">
                  {parserUsed === 'gemini-ai' ? 'Trí tuệ nhân tạo Gemini AI' : 'Bộ giải mã thông minh chuẩn Bộ GD&ĐT'} &bull; Đã chọn {selectedCount}/{parsedQuestions.length} câu
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-white px-2.5 py-1 rounded-lg border border-emerald-200"
              >
                {parsedQuestions.every((_, idx) => selectedIndices[idx]) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
              <button
                type="button"
                onClick={() => setParsedQuestions([])}
                className="text-xs text-slate-600 hover:text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200"
              >
                Tải file khác
              </button>
            </div>
          </div>

          {/* List of parsed questions */}
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {parsedQuestions.map((q, idx) => {
              const isSelected = selectedIndices[idx] ?? true;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    isSelected ? 'bg-white border-slate-300 shadow-xs' : 'bg-slate-50/70 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(idx)}
                        className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="font-bold text-slate-800 text-xs px-2 py-0.5 bg-slate-100 rounded-md">
                        Câu {idx + 1}
                      </span>
                      <select
                        value={q.topic}
                        onChange={e => handleQuestionChange(idx, 'topic', e.target.value)}
                        className="text-[11px] border border-slate-200 rounded-lg px-2 py-0.5 bg-white font-medium"
                      >
                        {COMMON_TOPICS.map(t => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <select
                        value={q.level}
                        onChange={e => handleQuestionChange(idx, 'level', e.target.value)}
                        className="text-[11px] border border-slate-200 rounded-lg px-2 py-0.5 bg-white font-medium"
                      >
                        <option value="nhan_biet">Nhận biết</option>
                        <option value="thong_hieu">Thông hiểu</option>
                        <option value="van_dung">Vận dụng</option>
                        <option value="van_dung_cao">Vận dụng cao</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Xóa câu này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="text-xs text-slate-900 font-medium mb-3">
                    <MathView content={q.content} />
                  </div>

                  {/* 4 Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {(['A', 'B', 'C', 'D'] as const).map(optKey => {
                      const optText = q[`option${optKey}` as keyof typeof q] as string;
                      const isCorrect = q.correctOption === optKey;

                      return (
                        <div
                          key={optKey}
                          onClick={() => handleQuestionChange(idx, 'correctOption', optKey)}
                          className={`p-2 rounded-xl border flex items-start gap-2 cursor-pointer transition-all ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-300 font-semibold text-emerald-950'
                              : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {optKey}
                          </span>
                          <div className="flex-1 overflow-x-auto text-[11px]">
                            <MathView content={optText} />
                          </div>
                          {isCorrect && (
                            <span className="text-[10px] text-emerald-700 font-bold ml-auto shrink-0">
                              Đúng
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation if any */}
                  {q.explanation && (
                    <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                      <span className="font-semibold text-slate-700">Lời giải: </span>
                      <MathView content={q.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Save Action Bar */}
          <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
            <span className="text-xs text-slate-600">
              Đã chọn <b>{selectedCount}</b> / {parsedQuestions.length} câu hỏi
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setParsedQuestions([])}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy & Tải lại
              </button>
              <button
                type="button"
                onClick={handleSaveToBank}
                disabled={saving || selectedCount === 0}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang lưu vào ngân hàng...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Lưu {selectedCount} câu hỏi vào Ngân hàng</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
