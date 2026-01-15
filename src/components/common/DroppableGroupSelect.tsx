/**
 * Droppable Group Select
 * Accepts dragged category types and updates their group
 */

import React, { useState } from 'react';
import { Plus, Pencil, Check, X, Inbox } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export interface GroupOption {
  value: string;
  label: string;
  editable?: boolean;
}

interface DroppableGroupSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: GroupOption[];
  onAdd?: (label: string) => Promise<string>;
  onEdit?: (value: string, newLabel: string) => Promise<void>;
  onDrop?: (categoryValue: string, categoryLabel: string, groupValue: string) => Promise<void>;
  placeholder?: string;
  addLabel?: string;
  className?: string;
  disabled?: boolean;
}

export function DroppableGroupSelect({
  value,
  onChange,
  options,
  onAdd,
  onEdit,
  onDrop,
  placeholder = 'Chọn nhóm...',
  addLabel = 'Thêm nhóm mới',
  className = '',
  disabled = false,
}: DroppableGroupSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOverValue, setDragOverValue] = useState<string | null>(null);

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

  const handleDragOver = (e: React.DragEvent, groupValue: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverValue(groupValue);
  };

  const handleDragLeave = () => {
    setDragOverValue(null);
  };

  const handleDrop = async (e: React.DragEvent, groupValue: string) => {
    e.preventDefault();
    setDragOverValue(null);

    const categoryValue = e.dataTransfer.getData('categoryValue');
    const categoryLabel = e.dataTransfer.getData('categoryLabel');

    if (!categoryValue || !onDrop) return;

    try {
      await onDrop(categoryValue, categoryLabel, groupValue);
    } catch (error) {
      console.error('Failed to drop category:', error);
    }
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
        <span className={selectedOption ? 'text-foreground' : 'text-muted-foreground'}>
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
                    // Normal mode with drop zone
                    <div
                      onDragOver={(e) => onDrop && handleDragOver(e, option.value)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => onDrop && handleDrop(e, option.value)}
                      className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary/50 transition-all ${
                        value === option.value ? 'bg-primary/10 text-primary' : ''
                      } ${
                        dragOverValue === option.value
                          ? 'bg-primary/20 border-2 border-dashed border-primary scale-105'
                          : ''
                      }`}
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                      }}
                    >
                      {onDrop && dragOverValue === option.value && (
                        <Inbox className="h-4 w-4 text-primary animate-pulse" />
                      )}
                      <span className="flex-1 text-sm">{option.label}</span>
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
                      placeholder="Nhập tên nhóm..."
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