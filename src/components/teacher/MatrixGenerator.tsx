import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Question, Exam, QuestionLevel, COMMON_TOPICS } from '../../types.js';
import { Sparkles, Sliders, CheckCircle, AlertTriangle, ArrowRight, Printer, Play } from 'lucide-react';

interface MatrixGeneratorProps {
  onExamCreated: (exam: Exam) => void;
  onNavigatePrint: (examId: number) => void;
}

export const MatrixGenerator: React.FC<MatrixGeneratorProps> = ({ onExamCreated, onNavigatePrint }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingBank, setLoadingBank] = useState(true);

  // Form parameters
  const [title, setTitle] = useState('Đề Khảo Sát Toán 12 - Ôn Thi THPT');
  const [description, setDescription] = useState('Cấu trúc chuẩn theo 4 mức độ tư duy của Bộ GD&ĐT');
  const [code, setCode] = useState(`TOAN-${Math.floor(100 + Math.random() * 900)}`);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);

  // Cognitive Levels Counts
  const [nhanBiet, setNhanBiet] = useState(5);
  const [thongHieu, setThongHieu] = useState(4);
  const [vanDung, setVanDung] = useState(2);
  const [vanDungCao, setVanDungCao] = useState(1);

  // Topics selection
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  // Execution states
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{ exam: Exam; questionsCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBankStats();
  }, []);

  const loadBankStats = async () => {
    try {
      setLoadingBank(true);
      const res = await api.getQuestions();
      setQuestions(res.questions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBank(false);
    }
  };

  // Bank availability calculation
  const pool = selectedTopics.length > 0
    ? questions.filter(q => selectedTopics.includes(q.topic))
    : questions;

  const countByLevel: Record<QuestionLevel, number> = {
    nhan_biet: pool.filter(q => q.level === 'nhan_biet').length,
    thong_hieu: pool.filter(q => q.level === 'thong_hieu').length,
    van_dung: pool.filter(q => q.level === 'van_dung').length,
    van_dung_cao: pool.filter(q => q.level === 'van_dung_cao').length,
  };

  const totalRequested = nhanBiet + thongHieu + vanDung + vanDungCao;

  const isNhanBietValid = nhanBiet <= countByLevel.nhan_biet;
  const isThongHieuValid = thongHieu <= countByLevel.thong_hieu;
  const isVanDungValid = vanDung <= countByLevel.van_dung;
  const isVanDungCaoValid = vanDungCao <= countByLevel.van_dung_cao;
  const canGenerate = totalRequested > 0 && isNhanBietValid && isThongHieuValid && isVanDungValid && isVanDungCaoValid;

  const applyPreset = (preset: 'quick' | 'standard' | 'max') => {
    if (preset === 'quick') {
      setTitle('Bài Kiểm Tra Nhanh 15 Phút Toán 12');
      setDurationMinutes(15);
      setNhanBiet(3);
      setThongHieu(3);
      setVanDung(1);
      setVanDungCao(0);
    } else if (preset === 'standard') {
      setTitle('Đề Kiểm Tra 1 Tiết (45 Phút) Môn Toán');
      setDurationMinutes(45);
      setNhanBiet(5);
      setThongHieu(4);
      setVanDung(2);
      setVanDungCao(1);
    } else if (preset === 'max') {
      setTitle('Đề Khảo Sát Toàn Diện Môn Toán');
      setDurationMinutes(60);
      setNhanBiet(countByLevel.nhan_biet);
      setThongHieu(countByLevel.thong_hieu);
      setVanDung(countByLevel.van_dung);
      setVanDungCao(countByLevel.van_dung_cao);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGeneratedResult(null);

    if (totalRequested <= 0) {
      setError('Vui lòng chọn ít nhất 1 câu hỏi.');
      return;
    }

    try {
      setGenerating(true);
      const res = await api.generateExamFromMatrix({
        title,
        description,
        code,
        durationMinutes,
        shuffleOptions,
        shuffleQuestions,
        matrix: {
          totalQuestions: totalRequested,
          nhanBiet,
          thongHieu,
          vanDung,
          vanDungCao,
          topics: selectedTopics.length > 0 ? selectedTopics : undefined
        }
      });

      setGeneratedResult({
        exam: res.exam,
        questionsCount: res.questionsCount
      });
      onExamCreated(res.exam);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo đề theo ma trận.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 rounded-2xl p-6 text-white shadow-md">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-indigo-100 mb-2.5 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Thuật toán Trộn Đề & Rút Ngẫu nhiên Theo Ma Trận
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Tạo Đề Thi Tự Động Theo Ma Trận Chuẩn
          </h1>
          <p className="text-indigo-100/90 text-sm mt-1.5 leading-relaxed">
            Hệ thống phân bổ câu hỏi ngẫu nhiên từ ngân hàng dựa trên tỷ lệ % 4 mức độ tư duy: 
            Nhận biết, Thông hiểu, Vận dụng và Vận dụng cao, đồng thời tự động đảo vị trí đáp án và xáo trộn mã đề.
          </p>
        </div>
      </div>

      {/* Generated Result Success Alert */}
      {generatedResult && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 shadow-sm animate-fade-in">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-950">
                  Tạo Đề Thi Thành Công! (Mã đề: {generatedResult.exam.code})
                </h3>
                <p className="text-sm text-emerald-800 mt-1">
                  Đã rút ngẫu nhiên thành công <strong>{generatedResult.questionsCount} câu hỏi</strong> phù hợp với ma trận: 
                  Nhận biết ({nhanBiet}), Thông hiểu ({thongHieu}), Vận dụng ({vanDung}), Vận dụng cao ({vanDungCao}).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onNavigatePrint(generatedResult.exam.id)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                Xem & In Đề Ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Matrix Builder Form */}
      <form onSubmit={handleGenerate} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Matrix Configurations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Presets */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mẫu Đề Có Sẵn (Presets)</span>
              <span className="text-xs text-indigo-600 font-medium">Bấm để áp dụng nhanh</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => applyPreset('quick')}
                className="p-3 border border-slate-200 rounded-xl text-left hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors"
              >
                <div className="font-semibold text-xs text-slate-800">Kiểm tra 15 phút</div>
                <div className="text-[11px] text-slate-500 mt-0.5">7 câu (3 NB, 3 TH, 1 VD)</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('standard')}
                className="p-3 border border-indigo-200 bg-indigo-50/20 rounded-xl text-left hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors"
              >
                <div className="font-semibold text-xs text-indigo-900">Kiểm tra 1 tiết (45p)</div>
                <div className="text-[11px] text-indigo-700 mt-0.5">12 câu (5 NB, 4 TH, 2 VD, 1 VDC)</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('max')}
                className="p-3 border border-slate-200 rounded-xl text-left hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors"
              >
                <div className="font-semibold text-xs text-slate-800">Toàn bộ ngân hàng</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Tất cả {questions.length} câu hiện có</div>
              </button>
            </div>
          </div>

          {/* Matrix Sliders */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  Cấu Hình Số Lượng Câu Theo Mức Độ Tư Duy
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kiểm tra khả năng cung cấp câu hỏi trực tiếp từ ngân hàng hiện hành.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500">Tổng số câu trong đề:</span>
                <div className="text-2xl font-bold text-indigo-600">{totalRequested}</div>
              </div>
            </div>

            {/* 1. Nhận biết */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  <span className="font-semibold text-slate-800">1. Mức độ: Nhận biết</span>
                  <span className="text-xs text-slate-400">(Tái hiện kiến thức, định nghĩa)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Ngân hàng có: {countByLevel.nhan_biet} câu</span>
                  <span className="font-bold text-sm text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">
                    {nhanBiet} câu
                  </span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(countByLevel.nhan_biet, 10)}
                value={nhanBiet}
                onChange={(e) => setNhanBiet(Number(e.target.value))}
                className="w-full accent-sky-600"
              />
              {!isNhanBietValid && (
                <p className="text-xs text-rose-600 font-medium">
                  Vượt quá số lượng trong kho ({countByLevel.nhan_biet} câu có sẵn).
                </p>
              )}
            </div>

            {/* 2. Thông hiểu */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-slate-800">2. Mức độ: Thông hiểu</span>
                  <span className="text-xs text-slate-400">(Áp dụng trực tiếp công thức)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Ngân hàng có: {countByLevel.thong_hieu} câu</span>
                  <span className="font-bold text-sm text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                    {thongHieu} câu
                  </span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(countByLevel.thong_hieu, 10)}
                value={thongHieu}
                onChange={(e) => setThongHieu(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              {!isThongHieuValid && (
                <p className="text-xs text-rose-600 font-medium">
                  Vượt quá số lượng trong kho ({countByLevel.thong_hieu} câu có sẵn).
                </p>
              )}
            </div>

            {/* 3. Vận dụng */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="font-semibold text-slate-800">3. Mức độ: Vận dụng</span>
                  <span className="text-xs text-slate-400">(Phối hợp nhiều bước giải)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Ngân hàng có: {countByLevel.van_dung} câu</span>
                  <span className="font-bold text-sm text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                    {vanDung} câu
                  </span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(countByLevel.van_dung, 10)}
                value={vanDung}
                onChange={(e) => setVanDung(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
              {!isVanDungValid && (
                <p className="text-xs text-rose-600 font-medium">
                  Vượt quá số lượng trong kho ({countByLevel.van_dung} câu có sẵn).
                </p>
              )}
            </div>

            {/* 4. Vận dụng cao */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="font-semibold text-slate-800">4. Mức độ: Vận dụng cao</span>
                  <span className="text-xs text-slate-400">(Tư duy sáng tạo, phân loại điểm 9-10)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Ngân hàng có: {countByLevel.van_dung_cao} câu</span>
                  <span className="font-bold text-sm text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200">
                    {vanDungCao} câu
                  </span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(countByLevel.van_dung_cao, 10)}
                value={vanDungCao}
                onChange={(e) => setVanDungCao(Number(e.target.value))}
                className="w-full accent-rose-600"
              />
              {!isVanDungCaoValid && (
                <p className="text-xs text-rose-600 font-medium">
                  Vượt quá số lượng trong kho ({countByLevel.van_dung_cao} câu có sẵn).
                </p>
              )}
            </div>
          </div>

          {/* Topic selection */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Lọc theo Chủ đề (Để trống nếu muốn lấy toàn bộ kiến thức):
            </h4>
            <div className="flex flex-wrap gap-2">
              {COMMON_TOPICS.map((topic) => {
                const isSelected = selectedTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTopics(selectedTopics.filter(t => t !== topic));
                      } else {
                        setSelectedTopics([...selectedTopics, topic]);
                      }
                    }}
                    className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-colors border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {topic}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Exam Info & Output Action */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Thông Tin Khóa Thi & Đề Thi
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tiêu đề đề thi</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mã đề thi</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 font-mono uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian (phút)</label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú đề thi</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 text-slate-600"
              />
            </div>

            {/* Randomization Options */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                Trộn thứ tự câu hỏi trong đề
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                Xáo trộn thứ tự các phương án A, B, C, D
              </label>
            </div>

            {/* Submit Generator Button */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={!canGenerate || generating}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Đang trích xuất & tạo đề...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Tạo Đề Theo Ma Trận Ngay</span>
                  </>
                )}
              </button>

              {!canGenerate && (
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Vui lòng điều chỉnh số lượng câu hỏi phù hợp với số lượng trong kho.
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
