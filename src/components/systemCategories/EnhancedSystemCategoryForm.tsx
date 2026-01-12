/**
 * Enhanced System Category Form
 * With inline editing and drag-drop for groups and categories
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../providers/LanguageProvider';
import { SystemCategory, systemCategoryApi, CategoryStatusHelper, CategoryStatus } from '../../api/systemCategoryApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { DroppableGroupSelect } from '../common/DroppableGroupSelect';
import { DraggableCategorySelect } from '../common/DraggableCategorySelect';
import { toast } from 'sonner@2.0.3';

interface EnhancedSystemCategoryFormProps {
  category?: SystemCategory;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function EnhancedSystemCategoryForm({
  category,
  onSubmit,
  onCancel,
  loading = false,
}: EnhancedSystemCategoryFormProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'SystemCategory',
    categoryGroup: '',
    description: '',
    isEditable: true,
    order: 0,
    status: CategoryStatusHelper.ACTIVE as CategoryStatus,
    metadata: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [groups, setGroups] = useState<SystemCategory[]>([]);
  const [categories, setCategories] = useState<SystemCategory[]>([]);

  useEffect(() => {
    loadGroupsAndCategories();
  }, []);

  useEffect(() => {
    if (category) {
      setFormData({
        code: category.code,
        name: category.name,
        type: category.type,
        categoryGroup: category.categoryGroup,
        description: category.description || '',
        isEditable: category.isEditable,
        order: category.order,
        status: category.status,
        metadata: category.metadata ? JSON.stringify(category.metadata, null, 2) : '',
      });
    }
  }, [category]);

  const loadGroupsAndCategories = async () => {
    try {
      const [groupsData, categoriesData] = await Promise.all([
        systemCategoryApi.getGroups(),
        systemCategoryApi.getCategories(),
      ]);
      console.log('Loaded groups:', groupsData);
      console.log('Loaded categories:', categoriesData);
      setGroups(groupsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Không thể tải dữ liệu: ' + (error as Error).message);
    }
  };

  // Handle adding new group inline
  const handleAddGroup = async (label: string): Promise<string> => {
    try {
      const code = `GRP_${label.toUpperCase().replace(/\s+/g, '_')}`;
      const categoryGroup = label.toLowerCase().replace(/\s+/g, '_');

      const newGroup = await systemCategoryApi.create({
        code,
        name: label,
        type: 'SYSTEM_CATEGORY_GROUP',
        categoryGroup: categoryGroup,
        description: `Nhóm danh mục ${label}`,
        isSystem: false,
        isEditable: true,
        order: groups.length + 1,
        status: CategoryStatusHelper.ACTIVE,
        metadata: {},
      });

      await loadGroupsAndCategories();
      toast.success(`Đã tạo nhóm "${label}"`);
      return newGroup.categoryGroup;
    } catch (error: any) {
      toast.error(error.message || 'Không thể tạo nhóm');
      throw error;
    }
  };

  // Handle editing group inline
  const handleEditGroup = async (value: string, newLabel: string): Promise<void> => {
    try {
      const group = groups.find((g) => g.categoryGroup === value);
      if (!group) return;

      await systemCategoryApi.update(group.id!, {
        name: newLabel,
      });

      await loadGroupsAndCategories();
      toast.success(`Đã cập nhật nhóm "${newLabel}"`);
    } catch (error: any) {
      toast.error(error.message || 'Không thể cập nhật nhóm');
      throw error;
    }
  };

  // Handle drop category to group
  const handleDropToGroup = async (
    categoryValue: string,
    categoryLabel: string,
    groupValue: string
  ): Promise<void> => {
    try {
      const catItem = categories.find((c) => c.id === categoryValue);
      if (!catItem) return;

      await systemCategoryApi.updateCategoryGroup(categoryValue, groupValue);
      await loadGroupsAndCategories();
      toast.success(`Đã di chuyển "${categoryLabel}" sang nhóm mới`);
    } catch (error: any) {
      toast.error(error.message || 'Không thể di chuyển');
      throw error;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) newErrors.code = 'Mã là bắt buộc';
    if (!formData.name.trim()) newErrors.name = 'Tên là bắt buộc';
    if (!formData.type) newErrors.type = 'Loại là bắt buộc';
    if (!formData.categoryGroup) newErrors.categoryGroup = 'Nhóm danh mục là bắt buộc';

    if (formData.metadata.trim()) {
      try {
        JSON.parse(formData.metadata);
      } catch (e) {
        newErrors.metadata = 'JSON không hợp lệ';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      type: formData.type,
      categoryGroup: formData.categoryGroup,
      description: formData.description.trim(),
      isEditable: formData.isEditable,
      order: formData.order,
      status: formData.status,
      metadata: formData.metadata.trim() ? JSON.parse(formData.metadata) : {},
      isSystem: false,
    };

    onSubmit(submitData);
  };

  const groupOptions = groups.map((g) => ({
    value: g.categoryGroup,
    label: g.name,
    editable: g.isEditable,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Code */}
        <div className="space-y-2">
          <Label htmlFor="code">
            Mã <span className="text-red-500">*</span>
          </Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="SYS_CATEGORY_CODE"
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
            placeholder="Category Name"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {errors.name}
            </p>
          )}
        </div>

        {/* Category Group with Inline Editing & Drop Zone */}
        <div className="space-y-2">
          <Label>
            Nhóm danh mục <span className="text-red-500">*</span>
          </Label>
          <DroppableGroupSelect
            value={formData.categoryGroup}
            onChange={(value) => setFormData({ ...formData, categoryGroup: value })}
            options={groupOptions}
            onAdd={handleAddGroup}
            onEdit={handleEditGroup}
            onDrop={handleDropToGroup}
            placeholder="Chọn hoặc thêm nhóm..."
            addLabel="Thêm nhóm mới"
            className={errors.categoryGroup ? 'border-red-500' : ''}
          />
          {errors.categoryGroup && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {errors.categoryGroup}
            </p>
          )}
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <ArrowRight className="h-3 w-3" />
            Kéo loại danh mục vào đây để đổi nhóm
          </p>
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

        {/* Description */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Mô tả</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Mô tả chi tiết về danh mục..."
            rows={3}
          />
        </div>

        {/* Metadata */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="metadata">Metadata (JSON)</Label>
          <Textarea
            id="metadata"
            value={formData.metadata}
            onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
            placeholder='{"key": "value"}'
            rows={4}
            className={`font-mono text-sm ${errors.metadata ? 'border-red-500' : ''}`}
          />
          {errors.metadata && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {errors.metadata}
            </p>
          )}
        </div>

        {/* Settings */}
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="is_editable" className="cursor-pointer">
                Cho phép chỉnh sửa
              </Label>
              <p className="text-sm text-gray-500">Người dùng c thể sửa/xóa danh mục này</p>
            </div>
            <Switch
              id="is_editable"
              checked={formData.isEditable}
              onCheckedChange={(checked) => setFormData({ ...formData, isEditable: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="status" className="cursor-pointer">
                Trạng thái Active
              </Label>
              <p className="text-sm text-gray-500">Danh mục này đang hoạt động</p>
            </div>
            <Switch
              id="status"
              checked={CategoryStatusHelper.isActive(formData.status)}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, status: checked ? CategoryStatusHelper.ACTIVE : CategoryStatusHelper.INACTIVE })
              }
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button type="submit" className="bg-[#6366f1] hover:bg-[#4f46e5] text-white" disabled={loading}>
          {loading ? t('common.saving') : category ? t('common.saveChanges') : t('common.add')}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
}