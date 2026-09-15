import React, { useState } from 'react';
import { Folder, FolderType } from '../../types.js';
import { Folder as FolderIcon, X, Check, ArrowRight, FolderPlus } from 'lucide-react';
import { FOLDER_COLORS } from './FolderModal.js';

interface MoveToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: Folder[];
  itemCount: number;
  itemType: FolderType;
  currentFolderId?: number | null;
  onConfirmMove: (targetFolderId: number | null) => Promise<void>;
  onOpenCreateFolder: () => void;
}

export const MoveToFolderModal: React.FC<MoveToFolderModalProps> = ({
  isOpen,
  onClose,
  folders,
  itemCount,
  itemType,
  currentFolderId,
  onConfirmMove,
  onOpenCreateFolder
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(currentFolderId ?? null);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const itemLabel = itemType === 'exam' ? 'đề thi' : 'câu hỏi';

  const handleConfirm = async () => {
    try {
      setMoving(true);
      setError(null);
      await onConfirmMove(selectedFolderId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi chuyển thư mục.');
    } finally {
      setMoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
              <FolderIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Chuyển Vào Thư Mục</h3>
              <p className="text-xs text-slate-500">
                Đang chọn <span className="font-semibold text-slate-700">{itemCount}</span> {itemLabel}
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

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <p className="text-xs text-slate-600 font-medium">
            Chọn thư mục đích bạn muốn phân loại các {itemLabel} này:
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {/* Uncategorized option */}
            <label
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                selectedFolderId === null
                  ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="destinationFolder"
                  checked={selectedFolderId === null}
                  onChange={() => setSelectedFolderId(null)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-700">Chưa phân loại (Không có thư mục)</span>
              </div>
            </label>

            {/* Existing folders */}
            {folders.map((f) => {
              const colorConfig = FOLDER_COLORS[f.color || 'indigo'] || FOLDER_COLORS.indigo;
              const isSelected = selectedFolderId === f.id;

              return (
                <label
                  key={f.id}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="destinationFolder"
                      checked={isSelected}
                      onChange={() => setSelectedFolderId(f.id)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${colorConfig.dot}`} />
                      <span className="text-sm font-medium text-slate-800">{f.name}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                    {f.itemCount ?? 0} {itemLabel}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreateFolder();
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 py-1"
            >
              <FolderPlus className="w-4 h-4" />
              Tạo thư mục mới ngay...
            </button>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={moving}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              {moving ? 'Đang chuyển...' : 'Xác Nhận Chuyển'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
