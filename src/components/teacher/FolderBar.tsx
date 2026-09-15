import React from 'react';
import { Folder, FolderType } from '../../types.js';
import { Folder as FolderIcon, Plus, MoreVertical, Edit2, Trash2, FolderPlus, Layers } from 'lucide-react';
import { FOLDER_COLORS } from './FolderModal.js';

interface FolderBarProps {
  type: FolderType;
  folders: Folder[];
  selectedFolderId: 'all' | 'uncategorized' | number;
  onSelectFolder: (id: 'all' | 'uncategorized' | number) => void;
  onOpenCreate: () => void;
  onOpenEdit: (folder: Folder) => void;
  onDeleteFolder: (folder: Folder) => void;
  totalAllCount: number;
  totalUncategorizedCount: number;
}

export const FolderBar: React.FC<FolderBarProps> = ({
  type,
  folders,
  selectedFolderId,
  onSelectFolder,
  onOpenCreate,
  onOpenEdit,
  onDeleteFolder,
  totalAllCount,
  totalUncategorizedCount
}) => {
  const isExam = type === 'exam';
  const label = isExam ? 'đề thi' : 'câu hỏi';

  return (
    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <FolderIcon className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Thư mục phân loại {label}
          </span>
          <span className="text-xs text-slate-400">({folders.length} thư mục)</span>
        </div>

        <button
          onClick={onOpenCreate}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/80 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shadow-2xs"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          Tạo thư mục mới
        </button>
      </div>

      {/* Folder Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {/* All chip */}
        <button
          onClick={() => onSelectFolder('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 border ${
            selectedFolderId === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Tất cả {label}</span>
          <span
            className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
              selectedFolderId === 'all' ? 'bg-slate-700 text-slate-100' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {totalAllCount}
          </span>
        </button>

        {/* User Folders */}
        {folders.map((f) => {
          const isSelected = selectedFolderId === f.id;
          const colorConfig = FOLDER_COLORS[f.color || 'indigo'] || FOLDER_COLORS.indigo;

          return (
            <div
              key={f.id}
              className={`group flex items-center rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 border pl-2.5 pr-1 py-1 ${
                isSelected
                  ? `${colorConfig.badge} ${colorConfig.border} ring-2 ring-indigo-500/20 shadow-xs font-semibold`
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <button
                onClick={() => onSelectFolder(f.id)}
                className="flex items-center gap-1.5 pr-1.5 text-left"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${colorConfig.dot}`} />
                <span className="max-w-[140px] sm:max-w-[200px] truncate">{f.name}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
                    isSelected ? 'bg-white/80 text-slate-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {f.itemCount ?? 0}
                </span>
              </button>

              {/* Action buttons on hover/select */}
              <div className="flex items-center border-l border-slate-200/60 pl-1 ml-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenEdit(f);
                  }}
                  title="Chỉnh sửa thư mục"
                  className="p-1 hover:text-indigo-600 hover:bg-white rounded-md transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFolder(f);
                  }}
                  title="Xóa thư mục (câu hỏi sẽ chuyển về chưa phân loại)"
                  className="p-1 hover:text-rose-600 hover:bg-white rounded-md transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Uncategorized chip */}
        <button
          onClick={() => onSelectFolder('uncategorized')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 border ${
            selectedFolderId === 'uncategorized'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs font-semibold'
              : 'bg-white text-slate-600 border-dashed border-slate-300 hover:bg-slate-50'
          }`}
        >
          <span>Chưa phân loại</span>
          <span
            className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
              selectedFolderId === 'uncategorized'
                ? 'bg-amber-700 text-amber-100'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {totalUncategorizedCount}
          </span>
        </button>
      </div>
    </div>
  );
};
