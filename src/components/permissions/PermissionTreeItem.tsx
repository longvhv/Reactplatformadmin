/**
 * Permission Tree Item Component
 * Hiển thị một permission node trong cây phân cấp
 */

import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { PermissionNode } from '../../api/permissionsApi';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen,
  Shield,
  Edit,
  Trash2,
  Plus,
} from 'lucide-react';

interface PermissionTreeItemProps {
  permission: PermissionNode;
  level?: number;
  onEdit: (permission: PermissionNode) => void;
  onDelete: (permission: PermissionNode) => void;
  onAddChild: (parentPermission: PermissionNode) => void;
}

export function PermissionTreeItem({ 
  permission, 
  level = 0,
  onEdit,
  onDelete,
  onAddChild,
}: PermissionTreeItemProps) {
  const [expanded, setExpanded] = useState(level < 2); // Auto expand first 2 levels
  const hasChildren = permission.children && permission.children.length > 0;
  const indent = level * 20;

  return (
    <div>
      {/* Current Item */}
      <div
        className="group flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        style={{ paddingLeft: `${12 + indent}px` }}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        {/* Icon */}
        <div className="flex-shrink-0">
          {permission.is_group ? (
            expanded ? (
              <FolderOpen className="h-4 w-4 text-yellow-500" />
            ) : (
              <Folder className="h-4 w-4 text-yellow-500" />
            )
          ) : (
            <Shield className="h-4 w-4 text-indigo-500" />
          )}
        </div>

        {/* Name & Code */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white truncate">
              {permission.name}
            </span>
            {permission.is_group && (
              <Badge variant="secondary" className="text-xs">
                Group
              </Badge>
            )}
          </div>
          <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">
            {permission.code}
          </p>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {permission.is_group && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddChild(permission)}
              title="Thêm quyền con"
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(permission)}
            title="Chỉnh sửa"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(permission)}
            className="text-red-600 hover:text-red-700"
            title="Xóa"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {permission.children!.map((child) => (
            <PermissionTreeItem
              key={child._id}
              permission={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}