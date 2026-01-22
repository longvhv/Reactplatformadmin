/**
 * System Category Form Component
 * Reusable form for creating and editing system categories
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '../../providers/LanguageProvider';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Card } from '../ui/card';
import { AlertCircle } from 'lucide-react';
import { systemCategoryApi, SystemCategory, CategoryStatusHelper, CategoryStatus } from '../../api/systemCategoriesApi';

interface SystemCategoryFormProps {
  category?: SystemCategory;
  onSave: (category: Omit<SystemCategory, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function SystemCategoryForm({
  category,
  onSave,
  onCancel,
  isLoading = false,
}: SystemCategoryFormProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: '',
    categoryGroup: '', // Changed from category_group to camelCase
    description: '',
    isEditable: true, // Changed from is_editable to camelCase
    order: 0,
    status: CategoryStatusHelper.ACTIVE as CategoryStatus,
    metadata: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [types, setTypes] = useState<string[]>([]);
  const [groups, setGroups] = useState<SystemCategory[]>([]); // Changed from string[] to SystemCategory[]

  useEffect(() => {
    loadTypes();
    loadGroups();
  }, []);

  useEffect(() => {
    if (category) {
      setFormData({
        code: category.code,
        name: category.name,
        type: category.type,
        categoryGroup: category.categoryGroup, // Use camelCase
        description: category.description || '',
        isEditable: category.isEditable, // Use camelCase
        order: category.order,
        status: category.status,
        metadata: category.metadata ? JSON.stringify(category.metadata, null, 2) : '',
      });
    }
  }, [category]);

  const loadTypes = async () => {
    try {
      const data = await systemCategoryApi.getTypes();
      setTypes(data);
    } catch (error) {
      console.error('Failed to load types:', error);
    }
  };

  const loadGroups = async () => {
    try {
      const data = await systemCategoryApi.getAllGroups();
      setGroups(data);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = t('systemCategories.errors.codeRequired');
    } else if (!/^[A-Z0-9_]+$/.test(formData.code)) {
      newErrors.code = t('systemCategories.errors.codeInvalid');
    }

    if (!formData.name.trim()) {
      newErrors.name = t('systemCategories.errors.nameRequired');
    }

    if (!formData.type.trim()) {
      newErrors.type = t('systemCategories.errors.typeRequired');
    }

    if (!formData.categoryGroup.trim()) {
      newErrors.categoryGroup = t('systemCategories.errors.groupRequired');
    }

    if (formData.order < 0) {
      newErrors.order = t('systemCategories.errors.orderInvalid');
    }

    if (formData.metadata.trim()) {
      try {
        JSON.parse(formData.metadata);
      } catch {
        newErrors.metadata = t('systemCategories.errors.metadataInvalid');
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
      categoryGroup: formData.categoryGroup, // Use camelCase for submission
      description: formData.description.trim() || undefined,
      isEditable: formData.isEditable, // Use camelCase for submission
      order: formData.order,
      status: formData.status,
      metadata: formData.metadata.trim()
        ? JSON.parse(formData.metadata)
        : undefined,
    };

    onSave(submitData);
  };

  const isReadOnly = category && !category.is_editable; // Use camelCase

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Warning for non-editable categories */}
      {isReadOnly && (
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                {t('systemCategories.nonEditableWarning')}
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                {t('systemCategories.nonEditableDescription')}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Code */}
        <div className="space-y-2">
          <Label htmlFor="code">{t('systemCategories.code')} *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder={t('systemCategories.codePlaceholder')}
            disabled={isReadOnly || isLoading}
            className={errors.code ? 'border-red-500' : ''}
          />
          {errors.code ? (
            <p className="text-sm text-red-600">{errors.code}</p>
          ) : (
            <p className="text-sm text-gray-500">{t('systemCategories.codeHelp')}</p>
          )}
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">{t('systemCategories.name')} *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder={t('systemCategories.namePlaceholder')}
            disabled={isReadOnly || isLoading}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label htmlFor="type">{t('systemCategories.type')} *</Label>
          <Select
            value={formData.type}
            onValueChange={value => setFormData({ ...formData, type: value })}
            disabled={isReadOnly || isLoading}
          >
            <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
              <SelectValue placeholder={t('systemCategories.typePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {types.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
              <SelectItem value="custom">{t('systemCategories.types.custom')}</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
        </div>

        {/* Category Group */}
        <div className="space-y-2">
          <Label htmlFor="category_group">{t('systemCategories.categoryGroup')} *</Label>
          <Select
            value={formData.categoryGroup}
            onValueChange={value => setFormData({ ...formData, categoryGroup: value })}
            disabled={isReadOnly || isLoading}
          >
            <SelectTrigger className={errors.categoryGroup ? 'border-red-500' : ''}>
              <SelectValue placeholder={t('systemCategories.categoryGroupPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {groups.map(group => (
                <SelectItem key={group.id || group.code} value={group.categoryGroup}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryGroup && (
            <p className="text-sm text-red-600">{errors.categoryGroup}</p>
          )}
        </div>

        {/* Order */}
        <div className="space-y-2">
          <Label htmlFor="order">{t('systemCategories.order')}</Label>
          <Input
            id="order"
            type="number"
            value={formData.order}
            onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
            placeholder={t('systemCategories.orderPlaceholder')}
            disabled={isReadOnly || isLoading}
            className={errors.order ? 'border-red-500' : ''}
          />
          {errors.order ? (
            <p className="text-sm text-red-600">{errors.order}</p>
          ) : (
            <p className="text-sm text-gray-500">{t('systemCategories.orderHelp')}</p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">{t('systemCategories.status')}</Label>
          <Select
            value={CategoryStatusHelper.toLabel(formData.status)}
            onValueChange={value => setFormData({ 
              ...formData, 
              status: CategoryStatusHelper.fromLabel(value as 'active' | 'inactive')
            })}
            disabled={isReadOnly || isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t('systemCategories.statusOptions.active')}</SelectItem>
              <SelectItem value="inactive">
                {t('systemCategories.statusOptions.inactive')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">{t('systemCategories.description')}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          placeholder={t('systemCategories.descriptionPlaceholder')}
          rows={3}
          disabled={isReadOnly || isLoading}
        />
      </div>

      {/* Is Editable */}
      {!category && (
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex-1">
            <Label htmlFor="is_editable" className="text-base">
              {t('systemCategories.isEditable')}
            </Label>
            <p className="text-sm text-gray-500 mt-1">
              {t('systemCategories.isEditableHelp')}
            </p>
          </div>
          <Switch
            id="is_editable"
            checked={formData.isEditable}
            onCheckedChange={checked => setFormData({ ...formData, isEditable: checked })}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Metadata */}
      <div className="space-y-2">
        <Label htmlFor="metadata">{t('systemCategories.metadata')}</Label>
        <Textarea
          id="metadata"
          value={formData.metadata}
          onChange={e => setFormData({ ...formData, metadata: e.target.value })}
          placeholder={t('systemCategories.metadataPlaceholder')}
          rows={4}
          className={`font-mono text-sm ${errors.metadata ? 'border-red-500' : ''}`}
          disabled={isReadOnly || isLoading}
        />
        {errors.metadata ? (
          <p className="text-sm text-red-600">{errors.metadata}</p>
        ) : (
          <p className="text-sm text-gray-500">{t('systemCategories.metadataHelp')}</p>
        )}
      </div>

      {/* Actions */}
      {!isReadOnly && (
        <div className="flex gap-3 pt-4 border-t">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading
              ? t('common.loading')
              : category
              ? t('systemCategories.updateCategory')
              : t('systemCategories.createCategory')}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
        </div>
      )}
    </form>
  );
}