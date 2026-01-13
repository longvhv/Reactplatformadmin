/**
 * Product Form Component
 * Reusable form for create/edit product
 * Max 500 lines, clean code
 */

import React, { useState, useEffect } from 'react';
import { SaaSProduct, BillingCycle, ProductStatus } from '../../api/saasProductApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { X, AlertCircle, Plus, Trash2 } from 'lucide-react';

interface ProductFormProps {
  product?: SaaSProduct | null;
  onSubmit: (data: Partial<SaaSProduct>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'DAILY', label: 'Ngày' },
  { value: 'WEEKLY', label: 'Tuần' },
  { value: 'MONTHLY', label: 'Tháng' },
  { value: 'QUARTERLY', label: 'Quý' },
  { value: 'YEARLY', label: 'Năm' },
  { value: 'LIFETIME', label: 'Trọn đời' },
];

const STATUSES: { value: ProductStatus; label: string }[] = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Không hoạt động' },
  { value: 'archived', label: 'Lưu trữ' },
];

export function ProductForm({ product, onSubmit, onCancel, loading }: ProductFormProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    product_type_code: '',
    base_price: 0,
    currency: 'VND',
    billing_cycle: 'MONTHLY' as BillingCycle,
    trial_days: 0,
    status: 'active' as ProductStatus,
    is_featured: false,
    display_order: 0,
  });

  const [features, setFeatures] = useState<Array<{ key: string; value: string }>>([]);
  const [limits, setLimits] = useState<Array<{ key: string; value: string }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        code: product.code,
        name: product.name,
        description: product.description || '',
        product_type_code: product.product_type_code || '',
        base_price: product.base_price,
        currency: product.currency,
        billing_cycle: product.billing_cycle,
        trial_days: product.trial_days,
        status: product.status,
        is_featured: product.is_featured,
        display_order: product.display_order,
      });

      // Convert features object to array
      if (product.features && typeof product.features === 'object') {
        setFeatures(
          Object.entries(product.features).map(([key, value]) => ({
            key,
            value: JSON.stringify(value),
          }))
        );
      }

      // Convert limits object to array
      if (product.limits && typeof product.limits === 'object') {
        setLimits(
          Object.entries(product.limits).map(([key, value]) => ({
            key,
            value: JSON.stringify(value),
          }))
        );
      }
    }
  }, [product]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Mã sản phẩm là bắt buộc';
    } else if (!/^[a-z0-9-]+$/.test(formData.code)) {
      newErrors.code = 'Mã chỉ chứa chữ thường, số và dấu gạch ngang';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Tên sản phẩm là bắt buộc';
    }

    if (formData.base_price < 0) {
      newErrors.base_price = 'Giá không được âm';
    }

    if (formData.trial_days < 0) {
      newErrors.trial_days = 'Số ngày dùng thử không được âm';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Convert features array to object
      const featuresObj: Record<string, any> = {};
      features.forEach(({ key, value }) => {
        if (key.trim()) {
          try {
            featuresObj[key] = JSON.parse(value);
          } catch {
            featuresObj[key] = value;
          }
        }
      });

      // Convert limits array to object
      const limitsObj: Record<string, any> = {};
      limits.forEach(({ key, value }) => {
        if (key.trim()) {
          try {
            limitsObj[key] = JSON.parse(value);
          } catch {
            limitsObj[key] = value;
          }
        }
      });

      await onSubmit({
        ...formData,
        features: featuresObj,
        limits: limitsObj,
        metadata: {},
      });
    } finally {
      setSubmitting(false);
    }
  };

  const addFeature = () => {
    setFeatures([...features, { key: '', value: '' }]);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, field: 'key' | 'value', value: string) => {
    const newFeatures = [...features];
    newFeatures[index][field] = value;
    setFeatures(newFeatures);
  };

  const addLimit = () => {
    setLimits([...limits, { key: '', value: '' }]);
  };

  const removeLimit = (index: number) => {
    setLimits(limits.filter((_, i) => i !== index));
  };

  const updateLimit = (index: number, field: 'key' | 'value', value: string) => {
    const newLimits = [...limits];
    newLimits[index][field] = value;
    setLimits(newLimits);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="code">
            Mã sản phẩm <span className="text-red-500">*</span>
          </Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
            placeholder="hrm-suite-pro"
            className={errors.code ? 'border-red-500' : ''}
            disabled={!!product}
          />
          {errors.code && (
            <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.code}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="name">
            Tên sản phẩm <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="HRM Suite Professional"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.name}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Mô tả chi tiết về sản phẩm..."
          rows={3}
        />
      </div>

      {/* Product Type */}
      <div>
        <Label htmlFor="product_type_code">Loại sản phẩm</Label>
        <Input
          id="product_type_code"
          value={formData.product_type_code}
          onChange={(e) => setFormData({ ...formData, product_type_code: e.target.value })}
          placeholder="APP, DOMAIN, SSL, etc."
        />
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="base_price">
            Giá <span className="text-red-500">*</span>
          </Label>
          <Input
            id="base_price"
            type="number"
            value={formData.base_price}
            onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })}
            min="0"
            step="1000"
            className={errors.base_price ? 'border-red-500' : ''}
          />
          {errors.base_price && (
            <p className="text-sm text-red-500 mt-1">{errors.base_price}</p>
          )}
        </div>

        <div>
          <Label htmlFor="currency">Tiền tệ</Label>
          <select
            id="currency"
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="VND">VND</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>

        <div>
          <Label htmlFor="billing_cycle">Chu kỳ thanh toán</Label>
          <select
            id="billing_cycle"
            value={formData.billing_cycle}
            onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value as BillingCycle })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {BILLING_CYCLES.map((cycle) => (
              <option key={cycle.value} value={cycle.value}>
                {cycle.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Trial & Status */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="trial_days">Ngày dùng thử miễn phí</Label>
          <Input
            id="trial_days"
            type="number"
            value={formData.trial_days}
            onChange={(e) => setFormData({ ...formData, trial_days: Number(e.target.value) })}
            min="0"
            className={errors.trial_days ? 'border-red-500' : ''}
          />
        </div>

        <div>
          <Label htmlFor="status">Trạng thái</Label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="display_order">Thứ tự hiển thị</Label>
          <Input
            id="display_order"
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
            min="0"
          />
        </div>
      </div>

      {/* Featured Toggle */}
      <div className="flex items-center gap-3">
        <Switch
          id="is_featured"
          checked={formData.is_featured}
          onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
        />
        <Label htmlFor="is_featured" className="cursor-pointer">
          Đánh dấu sản phẩm nổi bật
        </Label>
      </div>

      {/* Features Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label>Tính năng</Label>
          <Button type="button" variant="outline" size="sm" onClick={addFeature}>
            <Plus className="w-4 h-4 mr-1" />
            Thêm tính năng
          </Button>
        </div>
        <div className="space-y-2">
          {features.map((feature, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Key (ví dụ: modules)"
                value={feature.key}
                onChange={(e) => updateFeature(index, 'key', e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder='Value (JSON: ["attendance", "payroll"])'
                value={feature.value}
                onChange={(e) => updateFeature(index, 'value', e.target.value)}
                className="flex-[2]"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFeature(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Limits Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label>Giới hạn</Label>
          <Button type="button" variant="outline" size="sm" onClick={addLimit}>
            <Plus className="w-4 h-4 mr-1" />
            Thêm giới hạn
          </Button>
        </div>
        <div className="space-y-2">
          {limits.map((limit, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Key (ví dụ: max_employees)"
                value={limit.key}
                onChange={(e) => updateLimit(index, 'key', e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Value (ví dụ: 100)"
                value={limit.value}
                onChange={(e) => updateLimit(index, 'value', e.target.value)}
                className="flex-[2]"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeLimit(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting || loading}>
          Hủy
        </Button>
        <Button type="submit" disabled={submitting || loading}>
          {submitting || loading ? 'Đang xử lý...' : product ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </div>
    </form>
  );
}
