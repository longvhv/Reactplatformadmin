/**
 * Category Group Selector (Level 1)
 */

import React from 'react';
import { SystemCategoryGroup } from '../../api/systemCategoryApi';
import { Layers } from 'lucide-react';

interface CategoryGroupSelectorProps {
  groups: SystemCategoryGroup[];
  selectedGroup: SystemCategoryGroup | null;
  onSelectGroup: (group: SystemCategoryGroup) => void;
  loading?: boolean;
}

export function CategoryGroupSelector({
  groups,
  selectedGroup,
  onSelectGroup,
  loading = false,
}: CategoryGroupSelectorProps) {
  if (loading) {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-32 bg-gray-100 dark:bg-gray-900 rounded-md animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {groups.map((group) => (
        <button
          key={group.code}
          onClick={() => onSelectGroup(group)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            selectedGroup?.code === group.code
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-500 hover:text-indigo-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400'
          }`}
        >
          <Layers className="h-4 w-4" />
          {group.name}
        </button>
      ))}
      
      {groups.length === 0 && (
        <div className="text-sm text-gray-500 py-2">
          Không có nhóm danh mục
        </div>
      )}
    </div>
  );
}