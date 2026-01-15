/**
 * Region Form Component
 * Form for creating and editing regions with date range
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../providers/LanguageProvider';
import { Region, regionsApi } from '../../api/regionsApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertCircle } from 'lucide-react';

interface RegionFormProps {
  region?: Region;
  type?: 'country' | 'province' | 'district';
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function RegionForm({ region, type = 'country', onSubmit, onCancel, loading = false }: RegionFormProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    name_en: '',
    type: type,
    parent_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [parents, setParents] = useState<Region[]>([]);

  useEffect(() => {
    loadParents();
  }, [formData.type]);

  useEffect(() => {
    if (region) {
      setFormData({
        code: region.code,
        name: region.name,
        name_en: region.name_en || '',
        type: region.type,
        parent_id: region.parent_id || '',
        start_date: region.start_date,
        end_date: region.end_date || '',
        description: region.description || '',
      });
    }
  }, [region]);

  const loadParents = async () => {
    try {
      if (formData.type === 'province') {
        const countries = await regionsApi.getCountries();
        setParents(countries);
      } else if (formData.type === 'district') {
        const provinces = await regionsApi.getAll({ type: 'province' });
        setParents(provinces);
      } else {
        setParents([]);
      }
    } catch (error) {
      console.error('Failed to load parents:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.code.trim()) newErrors.code = 'Mã là bắt buộc';
    if (!formData.name.trim()) newErrors.name = 'Tên là bắt buộc';
    if (!formData.start_date) newErrors.start_date = 'Ngày bắt đầu là bắt buộc';
    if (formData.type !== 'country' && !formData.parent_id) {
      newErrors.parent_id = 'Parent region là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSubmit({
      code: formData.code.trim(),
      name: formData.name.trim(),
      name_en: formData.name_en.trim() || undefined,
      type: formData.type,
      parent_id: formData.parent_id || null,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      description: formData.description.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Code */}
        <div className="space-y-2">
          <Label htmlFor="code">Mã <span className="text-red-500">*</span></Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="VN, VN-HN, VN-HN-HK"
            className={errors.code ? 'border-red-500' : ''}
            disabled={!!region}
          />
          {errors.code && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {errors.code}
            </p>
          )}
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label>Loại <span className="text-red-500">*</span></Label>
          <Select
            value={formData.type}
            onValueChange={(value: any) => setFormData({ ...formData, type: value, parent_id: '' })}
            disabled={!!region}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="country">Quốc gia</SelectItem>
              <SelectItem value="province">Tỉnh/Thành phố</SelectItem>
              <SelectItem value="district">Quận/Huyện</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Tên <span className="text-red-500">*</span></Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Việt Nam, Hà Nội, Hoàn Kiếm"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {errors.name}
            </p>
          )}
        </div>

        {/* Name EN */}
        <div className="space-y-2">
          <Label htmlFor="name_en">Tên tiếng Anh</Label>
          <Input
            id="name_en"
            value={formData.name_en}
            onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
            placeholder="Vietnam, Hanoi, Hoan Kiem"
          />
        </div>

        {/* Parent */}
        {formData.type !== 'country' && (
          <div className="space-y-2 md:col-span-2">
            <Label>
              {formData.type === 'province' ? 'Quốc gia' : 'Tỉnh/Thành phố'} <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.parent_id} onValueChange={(value) => setFormData({ ...formData, parent_id: value })}>
              <SelectTrigger className={errors.parent_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Chọn..." />
              </SelectTrigger>
              <SelectContent>
                {parents.map((parent) => (
                  <SelectItem key={parent.id} value={parent.id!}>
                    {parent.name} ({parent.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.parent_id && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> {errors.parent_id}
              </p>
            )}
          </div>
        )}

        {/* Start Date */}
        <div className="space-y-2">
          <Label htmlFor="start_date">Ngày bắt đầu <span className="text-red-500">*</span></Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className={errors.start_date ? 'border-red-500' : ''}
          />
          {errors.start_date && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {errors.start_date}
            </p>
          )}
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label htmlFor="end_date">Ngày kết thúc</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
          <p className="text-sm text-gray-500">Để trống nếu vô thời hạn</p>
        </div>

        {/* Description */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Mô tả</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Mô tả chi tiết..."
            rows={3}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
          {loading ? t('common.saving') : region ? t('common.saveChanges') : t('common.add')}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
}