/**
 * Draggable Category Type Select
 * Allows dragging category types to different groups via drag & drop
 */

import React, { useState } from 'react';
import { GripVertical, Plus, Pencil, Check, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

export interface DraggableOption {
  value: string;
  label: string;
  groupValue?: string;
  editable?: boolean;
}

interface DraggableCategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  options: DraggableOption[];
  onAdd?: (label: string) => Promise<string>;
  onEdit?: (value: string, newLabel: string) => Promise<void>;
  onDragToGroup?: (categoryValue: string, newGroupValue: string) => Promise<void>;
  placeholder?: string;
  addLabel?: string;
  className?: string;
  disabled?: boolean;
  showGroup?: boolean;
}

export function DraggableCategorySelect({
  value,
  onChange,
  options,
  onAdd,
  onEdit,
  onDragToGroup,
  placeholder = 'Chọn loại danh mục...',
  addLabel = 'Thêm loại mới',
  className = '',
  disabled = false,
  showGroup = true,
}: DraggableCategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

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

  const handleDragStart = (e: React.DragEvent, option: DraggableOption) => {
    e.dataTransfer.setData('categoryValue', option.value);
    e.dataTransfer.setData('categoryLabel', option.label);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-card hover:border-primary focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={selectedOption ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {/* Options */}
            <div className="py-1">
              {options.map((option) => (
                <div key={option.value} className="group">
                  {editingValue === option.value ? (
                    // Edit mode
                    <div className="flex items-center gap-1 px-3 py-2">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEdit(option.value);
                          if (e.key === 'Escape') setEditingValue(null);
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
                        onClick={() => setEditingValue(null)}
                        disabled={loading}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    // Normal mode
                    <div
                      draggable={onDragToGroup ? true : false}
                      onDragStart={(e) => handleDragStart(e, option)}
                      className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary/50 transition-colors ${
                        value === option.value ? 'bg-primary/10 text-primary' : ''
                      }`}
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                      }}
                    >
                      {onDragToGroup && (
                        <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{option.label}</span>
                          {showGroup && option.groupValue && (
                            <Badge variant="secondary" className="text-xs">
                              {option.groupValue}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {option.editable !== false && onEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingValue(option.value);
                            setInputValue(option.label);
                          }}
                        >
                          <Pencil className="h-3 w-3 text-gray-500" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add new section */}
            {onAdd && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700" />
                {isAdding ? (
                  <div className="flex items-center gap-1 px-3 py-2">
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
                      placeholder="Nhập tên loại..."
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
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/10 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAdding(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    <span>{addLabel}</span>
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}