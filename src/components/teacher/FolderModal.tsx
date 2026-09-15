import React, { useState, useEffect } from 'react';
import { Folder, FolderType } from '../../types.js';
import { Folder as FolderIcon, X, Check, Tag } from 'lucide-react';

export const FOLDER_COLORS: Record<string, { label: string; badge: string; dot: string; border: string; bgLight: string }> = {
  indigo: {
    label: 'Xanh chàm',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
    border: 'border-indigo-300',
    bgLight: 'bg-indigo-50/60'
  },
  sky: {
    label: 'Xanh da trời',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
    border: 'border-sky-300',
    bgLight: 'bg-sky-50/60'
  },
  emerald: {
    label: 'Xanh lục',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    border: 'border-emerald-300',
    bgLight: 'bg-emerald-50/60'
  },
  amber: {
    label: 'Vàng cam',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    border: 'border-amber-300',
    bgLight: 'bg-amber-50/60'
  },
  rose: {
    label: 'Đỏ hồng',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    border: 'border-rose-300',
    bgLight: 'bg-rose-50/60'
  },
  violet: {
    label: 'Tím',
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    dot: 'bg-violet-500',
    border: 'border-violet-300',
    bgLight: 'bg-violet-50/60'
  }
};

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; color: string }) => Promise<void>;
  folderType: FolderType;
  editingFolder?: Folder | null;
}

export const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  folderType,
  editingFolder
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('indigo');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingFolder) {
      setName(editingFolder.name || '');
      setDescription(editingFolder.description || '');
      setColor(editingFolder.color || (folderType === 'question' ? 'indigo' : 'rose'));
    } else {
      setName('');
      setDescription('');
      setColor(folderType === 'question' ? 'indigo' : 'rose');
    }
    setError(null);
  }, [editingFolder, folderType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên thư mục.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        color
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi lưu thư mục.');
    } finally {
      setSaving(false);
    }
  };

  const isExam = folderType === 'exam';
  const typeLabel = isExam ? 'Đề thi' : 'Câu hỏi';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${FOLDER_COLORS[color]?.bgLight || 'bg-indigo-50'} border ${FOLDER_COLORS[color]?.border || 'border-indigo-200'}`}>
              <FolderIcon className={`w-5 h-5 ${FOLDER_COLORS[color]?.dot ? `text-${color}-600` : 'text-indigo-600'}`} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {editingFolder ? `Chỉnh Sửa Thư Mục ${typeLabel}` : `Tạo Thư Mục ${typeLabel} Mới`}
              </h3>
              <p className="text-xs text-slate-500">
                {isExam ? 'Phân loại đề thi theo chuyên đề, khối lớp hoặc kỳ thi' : 'Gom nhóm các câu hỏi theo từng bài học hoặc chuyên đề'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên Thư Mục <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isExam ? 'Ví dụ: Đề thi thử THPT 2025, Kiểm tra 1 tiết...' : 'Ví dụ: Chuyên đề Đạo hàm & Đồ thị...'}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mô Tả / Ghi Chú (Tùy chọn)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú ngắn về mục tiêu, phạm vi kiến thức của thư mục này..."
              rows={2}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white resize-none"
            />
          </div>

          {/* Color tag picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Màu Sắc Nhận Diện Thư Mục
            </label>
            <div className="grid grid-cols-6 gap-2">
              {Object.entries(FOLDER_COLORS).map(([colorKey, config]) => {
                const isSelected = color === colorKey;
                return (
                  <button
                    key={colorKey}
                    type="button"
                    onClick={() => setColor(colorKey)}
                    className={`h-9 rounded-xl flex items-center justify-center transition-all border ${
                      isSelected
                        ? 'ring-2 ring-offset-1 ring-slate-800 border-transparent shadow-xs scale-105'
                        : 'border-slate-200 hover:border-slate-400'
                    } ${config.badge}`}
                    title={config.label}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${config.dot} ${isSelected ? 'ring-2 ring-white' : ''}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? 'Đang lưu...' : editingFolder ? 'Cập Nhật Thư Mục' : 'Tạo Thư Mục'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
