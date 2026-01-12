/**
 * Category Type Selector (Level 2)
 */

import React from 'react';
import { SystemCategoryType } from '../../api/systemCategoryApi';
import { FolderTree } from 'lucide-react';

interface CategoryTypeSelectorProps {
  types: SystemCategoryType[];
  selectedType: SystemCategoryType | null;
  onSelectType: (type: SystemCategoryType) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function CategoryTypeSelector({
  types,
  selectedType,
  onSelectType,
  loading = false,
  disabled = false,
}: CategoryTypeSelectorProps) {
  if (loading) {
    return (
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-40 bg-gray-100 dark:bg-gray-900 rounded-md animate-pulse" />
        ))}
      </div>
    );
  }

  if (disabled) {
    return (
      <div className="flex items-center h-10 px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 text-sm text-gray-400">
        <FolderTree className="h-4 w-4 mr-2" />
        Chọn nhóm danh mục trước
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {types.map((type) => (
        <button
          key={type.code}
          onClick={() => onSelectType(type)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            selectedType?.code === type.code
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-500 hover:text-indigo-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400'
          }`}
        >
          <FolderTree className="h-4 w-4" />
          {type.name}
        </button>
      ))}
      
      {types.length === 0 && (
        <div className="text-sm text-gray-500 py-2">
          Không có loại danh mục
        </div>
      )}
    </div>
  );
}