/**
 * CategoryForm Component
 * Form for creating/editing categories with validation
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../providers/LanguageProvider';
import { Category, CreateCategoryDto, categoryApi } from '../../api/categoryApi';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { AlertCircle } from 'lucide-react';

interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: CreateCategoryDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CategoryForm({ category, onSubmit, onCancel, isLoading }: CategoryFormProps) {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateCategoryDto>({
    code: category?.code || '',
    name: category?.name || '',
    type: category?.type || '',
    description: category?.description || '',
    parent_id: category?.parent_id,
    order: category?.order ?? 0,
    status: category?.status || 'active',
    metadata: category?.metadata,
  });

  useEffect(() => {
    const loadCategories = async () => {
      const data = await categoryApi.getAll();
      setCategories(data);
    };
    loadCategories();
  }, []);

  const categoryTypes = [
    { value: 'tenant_type', label: t('categories.types.tenant_type') },
    { value: 'user_role', label: t('categories.types.user_role') },
    { value: 'user_status', label: t('categories.types.user_status') },
    { value: 'document_type', label: t('categories.types.document_type') },
    { value: 'priority_level', label: t('categories.types.priority_level') },
    { value: 'status_type', label: t('categories.types.status_type') },
    { value: 'custom', label: t('categories.types.custom') },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = t('categories.errors.codeRequired');
    } else if (!/^[A-Z0-9_]+$/.test(formData.code)) {
      newErrors.code = t('categories.errors.codeInvalid');
    }

    if (!formData.name.trim()) {
      newErrors.name = t('categories.errors.nameRequired');
    }

    if (!formData.type) {
      newErrors.type = t('categories.errors.typeRequired');
    }

    if (formData.order < 0) {
      newErrors.order = t('categories.errors.orderInvalid');
    }

    if (formData.metadata) {
      try {
        const metadataStr = typeof formData.metadata === 'string' 
          ? formData.metadata 
          : JSON.stringify(formData.metadata);
        JSON.parse(metadataStr);
      } catch {
        newErrors.metadata = t('categories.errors.metadataInvalid');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleChange = (field: keyof CreateCategoryDto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const parentCategories = categories.filter(
    c => c.id !== category?.id && c.type === formData.type
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="font-semibold">{t('tenants.basicInformation')}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code">
              {t('categories.code')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="code"
              value={formData.code}
              onChange={e => handleChange('code', e.target.value.toUpperCase())}
              placeholder={t('categories.codePlaceholder')}
              disabled={isLoading || !!category}
            />
            {errors.code && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.code}
              </p>
            )}
            <p className="text-sm text-gray-500">{t('categories.codeHelp')}</p>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">
              {t('categories.type')} <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={value => handleChange('type', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('categories.typePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {categoryTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.type}
              </p>
            )}
          </div>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            {t('categories.name')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={e => handleChange('name', e.target.value)}
            placeholder={t('categories.namePlaceholder')}
            disabled={isLoading}
          />
          {errors.name && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">{t('categories.description')}</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
            placeholder={t('categories.descriptionPlaceholder')}
            disabled={isLoading}
            rows={3}
          />
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="space-y-4">
        <h3 className="font-semibold">{t('settings.advanced')}</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Parent Category */}
          <div className="space-y-2">
            <Label htmlFor="parent">{t('categories.parentCategory')}</Label>
            <Select
              value={formData.parent_id || 'none'}
              onValueChange={value => handleChange('parent_id', value === 'none' ? undefined : value)}
              disabled={isLoading || !formData.type}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('categories.parentCategoryPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-</SelectItem>
                {parentCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Order */}
          <div className="space-y-2">
            <Label htmlFor="order">{t('categories.order')}</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={e => handleChange('order', parseInt(e.target.value) || 0)}
              placeholder={t('categories.orderPlaceholder')}
              disabled={isLoading}
              min={0}
            />
            {errors.order && (
              <p className="text-sm text-red-500">{errors.order}</p>
            )}
            <p className="text-sm text-gray-500">{t('categories.orderHelp')}</p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">{t('categories.status')}</Label>
            <Select
              value={formData.status}
              onValueChange={value => handleChange('status', value as 'active' | 'inactive')}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t('categories.statusOptions.active')}</SelectItem>
                <SelectItem value="inactive">{t('categories.statusOptions.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t('common.saving') : (category ? t('common.save') : t('common.add'))}
        </Button>
      </div>
    </form>
  );
}
