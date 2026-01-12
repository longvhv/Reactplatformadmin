/**
 * Category Form Dialog
 */

import React, { useState, useEffect } from 'react';
import {
  CategoryInstance,
  SystemCategoryType,
  CategoryStatusHelper,
  CategoryStatus,
  ExtraField,
} from '../../api/systemCategoryApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { X, AlertCircle, Plus, Trash2 } from 'lucide-react';

interface CategoryFormDialogProps {
  category: CategoryInstance | null;
  categoryType: SystemCategoryType;
  onSubmit: (data: any) => void;
  onClose: () => void;
}

export function CategoryFormDialog({
  category,
  categoryType,
  onSubmit,
  onClose,
}: CategoryFormDialogProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    order: 0,
    status: CategoryStatusHelper.ACTIVE as CategoryStatus,
    is_editable: true,
    group_category_id: '', // For SystemCategoryType
    collection_name: 'system_categories', // For SystemCategoryType
    extra_fields: [] as ExtraField[], // For SystemCategoryType
    metadata: {} as Record<string, any>,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Check if this is SystemCategoryType
  const isSystemCategoryType = categoryType.code === 'SYSTEM_CATEGORY_TYPE';

  useEffect(() => {
    if (category) {
      setFormData({
        code: category.code,
        name: category.name,
        description: category.description || '',
        order: category.order || 0,
        status: category.status,
        is_editable: category.is_editable ?? true,
        group_category_id: category.group_category_id || '',
        collection_name: category.collection_name || 'system_categories',
        extra_fields: category.extra_fields || [],
        metadata: category.metadata || {},
      });
    }
  }, [category]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Mã là bắt buộc';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Tên là bắt buộc';
    }

    // Validate SystemCategoryType specific fields
    if (isSystemCategoryType) {
      if (!formData.group_category_id.trim()) {
        newErrors.group_category_id = 'Mã nhóm danh mục là bắt buộc';
      }
      if (!formData.collection_name.trim()) {
        newErrors.collection_name = 'Tên bảng lưu dữ liệu là bắt buộc';
      }
    } else {
      // Validate extra fields for other types
      categoryType.extra_fields?.forEach((field) => {
        const value = formData.metadata[field.code];
        
        // Check if field has value when required
        if (field.config?.required && !value) {
          newErrors[field.code] = `${field.name} là bắt buộc`;
        }

        // Validate data type
        if (value) {
          if (field.dataType === 'number' && isNaN(Number(value))) {
            newErrors[field.code] = `${field.name} phải là số`;
          }
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData: any = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        order: formData.order,
        status: formData.status,
        is_editable: formData.is_editable,
      };

      // Add SystemCategoryType specific fields
      if (isSystemCategoryType) {
        submitData.group_category_id = formData.group_category_id.trim();
        submitData.collection_name = formData.collection_name.trim();
        submitData.extra_fields = formData.extra_fields;
      } else {
        submitData.metadata = formData.metadata;
      }

      await onSubmit(submitData);
    } finally {
      setLoading(false);
    }
  };

  const handleExtraFieldChange = (fieldCode: string, value: any) => {
    setFormData({
      ...formData,
      metadata: {
        ...formData.metadata,
        [fieldCode]: value,
      },
    });
  };

  // Handlers for managing extra fields (SystemCategoryType)
  const addExtraField = () => {
    setFormData({
      ...formData,
      extra_fields: [
        ...formData.extra_fields,
        {
          code: '',
          name: '',
          dataType: 'string',
          defaultValue: null,
          config: {},
        },
      ],
    });
  };

  const removeExtraField = (index: number) => {
    setFormData({
      ...formData,
      extra_fields: formData.extra_fields.filter((_, i) => i !== index),
    });
  };

  const updateExtraFieldDefinition = (index: number, field: Partial<ExtraField>) => {
    const updatedFields = [...formData.extra_fields];
    updatedFields[index] = { ...updatedFields[index], ...field };
    setFormData({
      ...formData,
      extra_fields: updatedFields,
    });
  };

  const updateExtraFieldSettings = (index: number, settingsText: string) => {
    try {
      const settings = settingsText ? JSON.parse(settingsText) : {};
      updateExtraFieldDefinition(index, { config: settings });
    } catch (error) {
      // Keep the text as is if JSON is invalid
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {category ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-130px)]">
          <div className="px-6 py-4 space-y-4">
            {/* Type Info */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800">
              <div className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                Loại danh mục: {categoryType.name}
              </div>
              {categoryType.description && (
                <div className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">
                  {categoryType.description}
                </div>
              )}
            </div>

            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code">
                Mã <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="CAT_CODE"
                className={errors.code ? 'border-red-500' : ''}
              />
              {errors.code && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {errors.code}
                </p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Tên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Tên danh mục"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả chi tiết..."
                rows={3}
              />
            </div>

            {/* Order */}
            <div className="space-y-2">
              <Label htmlFor="order">Thứ tự hiển thị</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            {/* SystemCategoryType Specific Fields */}
            {isSystemCategoryType && (
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Thông tin loại danh mục
                </h3>
                
                {/* Group Category ID */}
                <div className="space-y-2">
                  <Label htmlFor="group_category_id">
                    Mã nhóm danh mục <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="group_category_id"
                    value={formData.group_category_id}
                    onChange={(e) => setFormData({ ...formData, group_category_id: e.target.value.toUpperCase() })}
                    placeholder="GRP_SYSTEM"
                    className={errors.group_category_id ? 'border-red-500' : ''}
                  />
                  {errors.group_category_id && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" /> {errors.group_category_id}
                    </p>
                  )}
                </div>

                {/* Collection Name */}
                <div className="space-y-2">
                  <Label htmlFor="collection_name">
                    Tên bảng lưu dữ liệu <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="collection_name"
                    value={formData.collection_name}
                    onChange={(e) => setFormData({ ...formData, collection_name: e.target.value })}
                    placeholder="system_categories"
                    className={errors.collection_name ? 'border-red-500' : ''}
                  />
                  {errors.collection_name && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" /> {errors.collection_name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Tên bảng trong database để lưu trữ instances
                  </p>
                </div>

                {/* Extra Fields Definition */}
                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Các trường bổ sung (Extra Fields)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addExtraField}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Thêm trường
                    </Button>
                  </div>

                  {formData.extra_fields.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                      <p className="text-sm">Chưa có trường bổ sung</p>
                      <p className="text-xs mt-1">Click "Thêm trường" để thêm mới</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.extra_fields.map((field, index) => (
                        <div
                          key={index}
                          className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              Trường #{index + 1}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExtraField(index)}
                              className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {/* Code */}
                            <div className="space-y-1">
                              <Label htmlFor={`field_code_${index}`} className="text-xs">
                                Mã trường
                              </Label>
                              <Input
                                id={`field_code_${index}`}
                                value={field.code}
                                onChange={(e) => updateExtraFieldDefinition(index, { code: e.target.value })}
                                placeholder="field_code"
                                className="h-8 text-sm"
                              />
                            </div>

                            {/* Name */}
                            <div className="space-y-1">
                              <Label htmlFor={`field_name_${index}`} className="text-xs">
                                Tên trường
                              </Label>
                              <Input
                                id={`field_name_${index}`}
                                value={field.name}
                                onChange={(e) => updateExtraFieldDefinition(index, { name: e.target.value })}
                                placeholder="Tên hiển thị"
                                className="h-8 text-sm"
                              />
                            </div>

                            {/* Type */}
                            <div className="space-y-1">
                              <Label htmlFor={`field_type_${index}`} className="text-xs">
                                Kiểu dữ liệu
                              </Label>
                              <select
                                id={`field_type_${index}`}
                                value={field.dataType}
                                onChange={(e) => updateExtraFieldDefinition(index, { dataType: e.target.value as any })}
                                className="w-full h-8 px-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="string">Text</option>
                                <option value="number">Number</option>
                                <option value="boolean">Checkbox</option>
                                <option value="array">Combobox</option>
                                <option value="object">Textarea</option>
                                <option value="date">Date</option>
                              </select>
                            </div>

                            {/* Default Value */}
                            <div className="space-y-1">
                              <Label htmlFor={`field_default_${index}`} className="text-xs">
                                Giá trị mặc định
                              </Label>
                              <Input
                                id={`field_default_${index}`}
                                value={field.defaultValue ?? ''}
                                onChange={(e) => updateExtraFieldDefinition(index, { defaultValue: e.target.value })}
                                placeholder="Mặc định"
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>

                          {/* Settings */}
                          <div className="space-y-1">
                            <Label htmlFor={`field_settings_${index}`} className="text-xs">
                              Cấu hình (JSON)
                            </Label>
                            <Textarea
                              id={`field_settings_${index}`}
                              value={field.config ? JSON.stringify(field.config, null, 2) : ''}
                              onChange={(e) => updateExtraFieldSettings(index, e.target.value)}
                              placeholder='{"required": true}'
                              rows={2}
                              className="text-xs font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Extra Fields */}
            {!isSystemCategoryType && categoryType.extra_fields && categoryType.extra_fields.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Thông tin bổ sung
                </h3>
                {categoryType.extra_fields.map((field) => (
                  <div key={field.code} className="space-y-2">
                    <Label htmlFor={field.code}>
                      {field.name}
                      {field.config?.required && <span className="text-red-500"> *</span>}
                    </Label>
                    {renderExtraFieldInput(
                      field,
                      formData.metadata[field.code] ?? field.defaultValue,
                      (value) => handleExtraFieldChange(field.code, value),
                      errors[field.code]
                    )}
                    {errors[field.code] && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" /> {errors[field.code]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Settings */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <Label htmlFor="status" className="cursor-pointer">
                    Trạng thái Active
                  </Label>
                  <p className="text-sm text-gray-500">Danh mục đang hoạt động</p>
                </div>
                <Switch
                  id="status"
                  checked={CategoryStatusHelper.isActive(formData.status)}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      status: checked ? CategoryStatusHelper.ACTIVE : CategoryStatusHelper.INACTIVE,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <Label htmlFor="is_editable" className="cursor-pointer">
                    Cho phép chỉnh sửa
                  </Label>
                  <p className="text-sm text-gray-500">Người dùng có thể sửa/xóa</p>
                </div>
                <Switch
                  id="is_editable"
                  checked={formData.is_editable}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_editable: checked })
                  }
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : category ? 'Cập nhật' : 'Tạo mới'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper function to render input for extra fields
function renderExtraFieldInput(
  field: any,
  value: any,
  onChange: (value: any) => void,
  error?: string
) {
  const className = error ? 'border-red-500' : '';

  switch (field.dataType) {
    case 'number':
      return (
        <Input
          id={field.code}
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          placeholder={`Nhập ${field.name.toLowerCase()}`}
          className={className}
        />
      );

    case 'boolean':
      return (
        <Switch
          id={field.code}
          checked={value ?? false}
          onCheckedChange={onChange}
        />
      );

    case 'date':
      return (
        <Input
          id={field.code}
          type="date"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className={className}
        />
      );

    case 'array':
      return (
        <Input
          id={field.code}
          value={Array.isArray(value) ? value.join(', ') : ''}
          onChange={(e) => onChange(e.target.value.split(',').map((s: string) => s.trim()))}
          placeholder="Nhập các giá trị, cách nhau bởi dấu phẩy"
          className={className}
        />
      );

    case 'string':
    default:
      return (
        <Input
          id={field.code}
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Nhập ${field.name.toLowerCase()}`}
          className={className}
        />
      );
  }
}