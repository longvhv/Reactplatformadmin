/**
 * App Component Form
 * Specialized form for app_component type with custom fields: _id, title, parentId, isActive
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../providers/LanguageProvider';
import { SystemCategory, systemCategoryApi } from '../../api/systemCategoryApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import { AlertCircle } from 'lucide-react';

interface AppComponentFormProps {
  category?: SystemCategory;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function AppComponentForm({
  category,
  onSubmit,
  onCancel,
  loading = false,
}: AppComponentFormProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    _id: '',
    title: '',
    parentId: '',
    description: '',
    isActive: true,
    order: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [parentComponents, setParentComponents] = useState<SystemCategory[]>([]);

  useEffect(() => {
    loadParentComponents();
  }, []);

  useEffect(() => {
    if (category?.metadata) {
      setFormData({
        _id: category.metadata._id || category.code,
        title: category.metadata.title || category.name,
        parentId: category.metadata.parentId || '',
        description: category.description || '',
        isActive: category.metadata.isActive ?? true,
        order: category.order || 0,
      });
    }
  }, [category]);

  const loadParentComponents = async () => {
    try {
      const categories = await systemCategoryApi.getAll({
        type: 'app_component',
      });
      setParentComponents(categories);
    } catch (error) {
      console.error('Failed to load parent components:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData._id.trim()) {
      newErrors._id = 'Component ID is required';
    } else if (!/^[A-Z0-9_]+$/.test(formData._id)) {
      newErrors._id = 'Component ID must contain only uppercase letters, numbers, and underscores';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.order < 0) {
      newErrors.order = 'Order must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData = {
      code: formData._id.trim(),
      name: formData.title.trim(),
      type: 'app_component',
      category_group: 'app_structure',
      description: formData.description.trim() || undefined,
      is_editable: true,
      order: formData.order,
      status: formData.isActive ? 'active' : 'inactive',
      metadata: {
        _id: formData._id.trim(),
        title: formData.title.trim(),
        parentId: formData.parentId || null,
        isActive: formData.isActive,
      },
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Component ID */}
      <div className="space-y-2">
        <Label htmlFor="_id">
          Component ID <span className="text-red-500">*</span>
        </Label>
        <Input
          id="_id"
          value={formData._id}
          onChange={(e) => setFormData({ ...formData, _id: e.target.value.toUpperCase() })}
          placeholder="APP_COMP_EXAMPLE"
          className={errors._id ? 'border-red-500' : ''}
        />
        {errors._id && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors._id}
          </p>
        )}
        <p className="text-sm text-gray-500">
          Unique identifier for the component (uppercase, numbers, and underscores only)
        </p>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter component title"
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.title}
          </p>
        )}
      </div>

      {/* Parent Component */}
      <div className="space-y-2">
        <Label htmlFor="parentId">Parent Component</Label>
        <Select
          value={formData.parentId}
          onValueChange={(value) => setFormData({ ...formData, parentId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select parent component (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None (Root Level)</SelectItem>
            {parentComponents
              .filter((c) => c.id !== category?.id)
              .map((component) => (
                <SelectItem key={component.id} value={component.metadata?._id || component.code}>
                  {component.metadata?.title || component.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500">
          Select a parent component to create a hierarchy
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter component description"
          rows={3}
        />
      </div>

      {/* Order */}
      <div className="space-y-2">
        <Label htmlFor="order">Display Order</Label>
        <Input
          id="order"
          type="number"
          min="0"
          value={formData.order}
          onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
          className={errors.order ? 'border-red-500' : ''}
        />
        {errors.order && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.order}
          </p>
        )}
        <p className="text-sm text-gray-500">
          Lower numbers appear first in lists
        </p>
      </div>

      {/* Is Active */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="space-y-0.5">
          <Label htmlFor="isActive" className="text-base">
            Active Status
          </Label>
          <p className="text-sm text-gray-500">
            Enable or disable this component
          </p>
        </div>
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="submit"
          className="bg-[#6366f1] hover:bg-[#4f46e5] text-white"
          disabled={loading}
        >
          {loading ? t('common.saving') : category ? t('common.saveChanges') : t('common.add')}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
}