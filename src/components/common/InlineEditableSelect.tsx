/**
 * Inline Editable Select Component
 * Allows adding and editing items directly in the select dropdown
 */

import React, { useState } from 'react';
import { Plus, Pencil, Check, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export interface SelectOption {
  value: string;
  label: string;
  editable?: boolean;
}

interface InlineEditableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  onAdd?: (label: string) => Promise<string>; // Returns new value
  onEdit?: (value: string, newLabel: string) => Promise<void>;
  placeholder?: string;
  addLabel?: string;
  className?: string;
  disabled?: boolean;
}

export function InlineEditableSelect({
  value,
  onChange,
  options,
  onAdd,
  onEdit,
  placeholder = 'Chọn...',
  addLabel = 'Thêm mới',
  className = '',
  disabled = false,
}: InlineEditableSelectProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!inputValue.trim() || !onAdd) return;

    try {
      setLoading(true);
      const newValue = await onAdd(inputValue.trim());
      onChange(newValue);
      setInputValue('');
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to add item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (optionValue: string) => {
    if (!inputValue.trim() || !onEdit) return;

    try {
      setLoading(true);
      await onEdit(optionValue, inputValue.trim());
      setInputValue('');
      setEditingValue(null);
    } catch (error) {
      console.error('Failed to edit item:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (option: SelectOption) => {
    setEditingValue(option.value);
    setInputValue(option.label);
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingValue(null);
    setInputValue('');
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingValue(null);
    setInputValue('');
  };

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {/* Existing options */}
        {options.map((option) => (
          <div key={option.value} className="relative group">
            {editingValue === option.value ? (
              // Edit mode
              <div className="flex items-center gap-1 px-2 py-1.5">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEdit(option.value);
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className="h-7 text-sm"
                  autoFocus
                  disabled={loading}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => handleEdit(option.value)}
                  disabled={loading}
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={cancelEdit}
                  disabled={loading}
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ) : (
              // Normal mode
              <div className="flex items-center">
                <SelectItem value={option.value} className="flex-1">
                  {option.label}
                </SelectItem>
                {option.editable !== false && onEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity mr-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(option);
                    }}
                  >
                    <Pencil className="h-3 w-3 text-gray-500" />
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Add new section */}
        {onAdd && (
          <>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            {isAdding ? (
              <div className="flex items-center gap-1 px-2 py-1.5">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd();
                    if (e.key === 'Escape') {
                      setIsAdding(false);
                      setInputValue('');
                    }
                  }}
                  placeholder="Nhập tên..."
                  className="h-7 text-sm"
                  autoFocus
                  disabled={loading}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={handleAdd}
                  disabled={loading}
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => {
                    setIsAdding(false);
                    setInputValue('');
                  }}
                  disabled={loading}
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ) : (
              <button
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-[#6366f1] hover:bg-[#6366f1]/10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  startAdd();
                }}
              >
                <Plus className="h-4 w-4" />
                <span>{addLabel}</span>
              </button>
            )}
          </>
        )}
      </SelectContent>
    </Select>
  );
}
