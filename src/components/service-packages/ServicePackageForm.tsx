/**
 * Service Package Form Component
 * Reusable form for create/edit service packages
 */

import React, { useState, useEffect } from 'react';
import { Package, CreatePackageRequest } from '../../api/packagesApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft } from 'lucide-react';

interface ServicePackageFormProps {
  package?: Package | null;
  onSubmit: (data: Partial<CreatePackageRequest>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const BILLING_CYCLES = [
  { value: 'DAILY', label: 'Hàng ngày' },
  { value: 'WEEKLY', label: 'Hàng tuần' },
  { value: 'MONTHLY', label: 'Hàng tháng' },
  { value: 'QUARTERLY', label: 'Hàng quý' },
  { value: 'YEARLY', label: 'Hàng năm' },
  { value: 'LIFETIME', label: 'Trọn đời' },
  { value: 'ONE_TIME', label: 'Một lần' },
  { value: 'CUSTOM', label: 'Tùy chỉnh' },
];

const STATUSES = [
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Không hoạt động' },
  { value: 'ARCHIVED', label: 'Lưu trữ' },
];

export function ServicePackageForm({ package: pkg, onSubmit, onCancel, loading }: ServicePackageFormProps) {
  const [formData, setFormData] = useState({
    tenant_id: '00000000-0000-0000-0000-000000000001', // Default tenant ID
    code: '',
    name: '',
    description: '',
    saas_product_id: '00000000-0000-0000-0000-000000000001', // Demo product ID
    price_amount: 0,
    currency_code: 'VND',
    billing_cycle: 'MONTHLY' as any,
    trial_days: 0,
    status: 'ACTIVE' as any,
    is_public: true,
    display_order: 0,
    max_users: null as number | null,
    max_storage: null as number | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (pkg) {
      setFormData({
        tenant_id: pkg.tenant_id,
        code: pkg.code,
        name: pkg.name,
        description: pkg.description || '',
        saas_product_id: pkg.saas_product_id,
        price_amount: pkg.price_amount,
        currency_code: pkg.currency_code,
        billing_cycle: pkg.billing_cycle || 'MONTHLY',
        // Extract from features object (limits_config in DB)
        trial_days: pkg.features?.trial_days || 0,
        status: pkg.status,
        is_public: pkg.is_public,
        display_order: pkg.display_order || 0,
        max_users: pkg.features?.max_users ?? null,
        max_storage: pkg.features?.max_storage ?? null,
      });
    }
  }, [pkg]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Mã gói dịch vụ là bắt buộc';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Tên gói dịch vụ là bắt buộc';
    }

    if (formData.price_amount < 0) {
      newErrors.price_amount = 'Giá phải lớn hơn hoặc bằng 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      // Transform data to pack limit fields into features object (maps to limits_config in DB)
      const submitData = {
        tenant_id: formData.tenant_id,
        code: formData.code,
        name: formData.name,
        description: formData.description,
        saas_product_id: formData.saas_product_id,
        price_amount: formData.price_amount,
        currency_code: formData.currency_code,
        billing_cycle: formData.billing_cycle,
        status: formData.status,
        is_public: formData.is_public,
        display_order: formData.display_order,
        entitlements_config: {},
        // Pack limit fields into features (maps to limits_config in DB)
        features: {
          trial_days: formData.trial_days || 0,
          max_users: formData.max_users,
          max_storage: formData.max_storage,
        },
      };
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Thông tin cơ bản
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="code">
              Mã gói dịch vụ <span className="text-red-500">*</span>
            </Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder="VD: PKG-BASIC"
              className={errors.code ? 'border-red-500' : ''}
              disabled={!!pkg} // Disable code edit for existing packages
            />
            {errors.code && (
              <p className="text-sm text-red-500 mt-1">{errors.code}</p>
            )}
          </div>

          <div>
            <Label htmlFor="name">
              Tên gói dịch vụ <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="VD: Gói cơ bản"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="description">Mô tả</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Mô tả chi tiết về gói dịch vụ..."
            rows={3}
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Thông tin giá
        </h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="price_amount">
              Giá <span className="text-red-500">*</span>
            </Label>
            <Input
              id="price_amount"
              type="number"
              value={formData.price_amount}
              onChange={(e) => handleChange('price_amount', parseFloat(e.target.value) || 0)}
              placeholder="0"
              min="0"
              step="1000"
              className={errors.price_amount ? 'border-red-500' : ''}
            />
            {errors.price_amount && (
              <p className="text-sm text-red-500 mt-1">{errors.price_amount}</p>
            )}
          </div>

          <div>
            <Label htmlFor="currency_code">Đơn vị tiền tệ</Label>
            <Select
              value={formData.currency_code}
              onValueChange={(value) => handleChange('currency_code', value)}
            >
              <SelectTrigger id="currency_code">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VND">VND</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="billing_cycle">Chu kỳ thanh toán</Label>
            <Select
              value={formData.billing_cycle}
              onValueChange={(value) => handleChange('billing_cycle', value)}
            >
              <SelectTrigger id="billing_cycle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BILLING_CYCLES.map(cycle => (
                  <SelectItem key={cycle.value} value={cycle.value}>
                    {cycle.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="trial_days">Số ngày dùng thử</Label>
            <Input
              id="trial_days"
              type="number"
              value={formData.trial_days}
              onChange={(e) => handleChange('trial_days', parseInt(e.target.value) || 0)}
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="max_users">Số người dùng tối đa</Label>
            <Input
              id="max_users"
              type="number"
              value={formData.max_users || ''}
              onChange={(e) => handleChange('max_users', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Không giới hạn"
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="max_storage">Dung lượng tối đa (GB)</Label>
            <Input
              id="max_storage"
              type="number"
              value={formData.max_storage || ''}
              onChange={(e) => handleChange('max_storage', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Không giới hạn"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Display Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Cài đặt hiển thị
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="status">Trạng thái</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange('status', value)}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="display_order">Thứ tự hiển thị</Label>
            <Input
              id="display_order"
              type="number"
              value={formData.display_order}
              onChange={(e) => handleChange('display_order', parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_public"
            checked={formData.is_public}
            onCheckedChange={(checked) => handleChange('is_public', checked)}
          />
          <Label htmlFor="is_public" className="cursor-pointer">
            Hiển thị công khai
          </Label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting || loading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Hủy
        </Button>
        <Button
          type="submit"
          disabled={submitting || loading}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {submitting || loading ? 'Đang lưu...' : pkg ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </div>
    </form>
  );
}