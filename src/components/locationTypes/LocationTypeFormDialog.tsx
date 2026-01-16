/**
 * Location Type Form Dialog
 * Form dialog for creating/editing location types with extra fields editor
 */

import React, { useState, useEffect } from 'react';
import {
  LocationType,
  CreateLocationTypeData,
  UpdateLocationTypeData,
  ExtraFieldDefinition,
  LocationTypeValidation,
} from '../../api/locationTypesApi';
import { X, Save, Plus, Trash2, GripVertical, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';

interface LocationTypeFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLocationTypeData | UpdateLocationTypeData, id?: string) => Promise<void>;
  editData?: LocationType;
  tenantId: string;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Yes/No' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Single Select' },
  { value: 'multiselect', label: 'Multi Select' },
] as const;

export function LocationTypeFormDialog({
  isOpen,
  onClose,
  onSubmit,
  editData,
  tenantId,
}: LocationTypeFormDialogProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    is_active: true,
  });

  const [extraFields, setExtraFields] = useState<ExtraFieldDefinition[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Load edit data
  useEffect(() => {
    if (editData) {
      setFormData({
        code: editData.code,
        name: editData.name,
        description: editData.description || '',
        is_active: editData.is_active,
      });
      setExtraFields(editData.extra_fields || []);
    } else {
      resetForm();
    }
  }, [editData, isOpen]);

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      is_active: true,
    });
    setExtraFields([]);
    setErrors({});
  };

  // Handle code change with auto-formatting
  const handleCodeChange = (value: string) => {
    const formatted = LocationTypeValidation.formatCode(value);
    setFormData(prev => ({ ...prev, code: formatted }));
    
    // Clear code error on change
    if (errors.code) {
      setErrors(prev => ({ ...prev, code: '' }));
    }
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate code
    const codeError = LocationTypeValidation.getCodeError(formData.code);
    if (codeError) newErrors.code = codeError;

    // Validate name
    const nameError = LocationTypeValidation.getNameError(formData.name);
    if (nameError) newErrors.name = nameError;

    // Validate extra fields
    extraFields.forEach((field, index) => {
      if (!field.code) {
        newErrors[`field_code_${index}`] = 'Field code is required';
      } else if (!/^[a-z0-9_]+$/.test(field.code)) {
        newErrors[`field_code_${index}`] = 'Field code must be lowercase letters, numbers, and underscores';
      }

      if (!field.name) {
        newErrors[`field_name_${index}`] = 'Field name is required';
      }

      if ((field.type === 'select' || field.type === 'multiselect') && (!field.options || field.options.length === 0)) {
        newErrors[`field_options_${index}`] = 'Options are required for select fields';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSaving(true);
    try {
      if (editData) {
        // Update
        await onSubmit(
          {
            ...formData,
            extra_fields: extraFields,
            version: editData.version,
          },
          editData._id
        );
      } else {
        // Create
        await onSubmit({
          ...formData,
          tenant_id: tenantId,
          extra_fields: extraFields,
        });
      }

      onClose();
      resetForm();
    } catch (err: any) {
      setErrors({ submit: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Extra fields management
  const addExtraField = () => {
    setExtraFields([
      ...extraFields,
      {
        code: '',
        name: '',
        type: 'text',
        required: false,
        order: extraFields.length,
      },
    ]);
  };

  const updateExtraField = (index: number, field: Partial<ExtraFieldDefinition>) => {
    const updated = [...extraFields];
    updated[index] = { ...updated[index], ...field };
    setExtraFields(updated);
  };

  const removeExtraField = (index: number) => {
    setExtraFields(extraFields.filter((_, i) => i !== index));
  };

  const moveExtraField = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= extraFields.length) return;

    const updated = [...extraFields];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    
    // Update order
    updated.forEach((field, i) => {
      field.order = i;
    });

    setExtraFields(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editData ? 'Edit Location Type' : 'Create Location Type'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* General Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white">General Information</h3>

            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleCodeChange(e.target.value)}
                disabled={editData?.is_system}
                placeholder="WAREHOUSE"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono ${
                  errors.code
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } ${editData?.is_system ? 'bg-gray-100 cursor-not-allowed' : 'bg-white dark:bg-gray-900'}`}
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.code}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Uppercase letters, numbers, and underscores only (e.g., WAREHOUSE, RETAIL_STORE)
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Warehouse"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                  errors.name
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-900`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Optional description..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-900"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>
          </div>

          {/* Extra Fields */}
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-white">Extra Fields</h3>
              <Button
                type="button"
                size="sm"
                onClick={addExtraField}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Field
              </Button>
            </div>

            {extraFields.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No extra fields defined</p>
            ) : (
              <div className="space-y-3">
                {extraFields.map((field, index) => (
                  <ExtraFieldEditor
                    key={index}
                    field={field}
                    index={index}
                    errors={errors}
                    onUpdate={(updates) => updateExtraField(index, updates)}
                    onRemove={() => removeExtraField(index)}
                    onMoveUp={index > 0 ? () => moveExtraField(index, 'up') : undefined}
                    onMoveDown={index < extraFields.length - 1 ? () => moveExtraField(index, 'down') : undefined}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errors.submit}
              </p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : editData ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Extra Field Editor Component
 */
interface ExtraFieldEditorProps {
  field: ExtraFieldDefinition;
  index: number;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<ExtraFieldDefinition>) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

function ExtraFieldEditor({ 
  field, 
  index, 
  errors, 
  onUpdate, 
  onRemove, 
  onMoveUp, 
  onMoveDown 
}: ExtraFieldEditorProps) {
  const handleOptionsChange = (value: string) => {
    const options = value.split('\n').filter(opt => opt.trim());
    onUpdate({ options });
  };

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div className="flex flex-col gap-1 pt-2">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!onMoveUp}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!onMoveDown}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Field Configuration */}
        <div className="flex-1 grid grid-cols-2 gap-3">
          {/* Field Code */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Field Code *
            </label>
            <input
              type="text"
              value={field.code}
              onChange={(e) => onUpdate({ code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
              placeholder="max_capacity"
              className={`w-full px-2 py-1 text-sm border rounded font-mono ${
                errors[`field_code_${index}`] ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors[`field_code_${index}`] && (
              <p className="text-xs text-red-500 mt-1">{errors[`field_code_${index}`]}</p>
            )}
          </div>

          {/* Field Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Field Name *
            </label>
            <input
              type="text"
              value={field.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="Maximum Capacity"
              className={`w-full px-2 py-1 text-sm border rounded ${
                errors[`field_name_${index}`] ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors[`field_name_${index}`] && (
              <p className="text-xs text-red-500 mt-1">{errors[`field_name_${index}`]}</p>
            )}
          </div>

          {/* Field Type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={field.type}
              onChange={(e) => onUpdate({ type: e.target.value as any })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            >
              {FIELD_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Required */}
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id={`required_${index}`}
              checked={field.required || false}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
            />
            <label htmlFor={`required_${index}`} className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Required
            </label>
          </div>

          {/* Options (for select/multiselect) */}
          {(field.type === 'select' || field.type === 'multiselect') && (
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Options (one per line) *
              </label>
              <textarea
                value={(field.options || []).join('\n')}
                onChange={(e) => handleOptionsChange(e.target.value)}
                rows={3}
                placeholder="Option 1&#10;Option 2&#10;Option 3"
                className={`w-full px-2 py-1 text-sm border rounded font-mono ${
                  errors[`field_options_${index}`] ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors[`field_options_${index}`] && (
                <p className="text-xs text-red-500 mt-1">{errors[`field_options_${index}`]}</p>
              )}
            </div>
          )}
        </div>

        {/* Remove Button */}
        <button
          type="button"
          onClick={onRemove}
          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
