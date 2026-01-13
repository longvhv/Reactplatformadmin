/**
 * Capability Form Component
 * Reusable form for create/edit app capability
 * < 500 lines
 */

import React, { useState, useEffect } from 'react';
import { AppCapability, CapabilityType, CapabilityStatus } from '../../api/appCapabilityApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { AlertCircle } from 'lucide-react';

interface CapabilityFormProps {
  capability?: AppCapability | null;
  appId: string;
  onSubmit: (data: Partial<AppCapability>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const CAPABILITY_TYPES: { value: CapabilityType; label: string }[] = [
  { value: 'FEATURE', label: 'Tính năng' },
  { value: 'LIMIT', label: 'Giới hạn' },
];

const STATUSES: { value: CapabilityStatus; label: string }[] = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Không hoạt động' },
  { value: 'archived', label: 'Lưu trữ' },
];

const COMMON_UNITS = [
  'users', 'employees', 'contacts', 'projects', 'tasks', 'deals',
  'GB', 'MB', 'TB',
  'requests/day', 'requests/hour', 'emails/month',
  'members', 'departments', 'teams',
];

export function CapabilityForm({ capability, appId, onSubmit, onCancel, loading }: CapabilityFormProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'FEATURE' as CapabilityType,
    status: 'active' as CapabilityStatus,
    display_order: 0,
    is_required: false,
  });

  // For FEATURE type
  const [featureEnabled, setFeatureEnabled] = useState(true);

  // For LIMIT type
  const [limitValue, setLimitValue] = useState(0);
  const [limitUnit, setLimitUnit] = useState('users');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (capability) {
      setFormData({
        code: capability.code,
        name: capability.name,
        description: capability.description || '',
        type: capability.type,
        status: capability.status,
        display_order: capability.display_order,
        is_required: capability.is_required,
      });

      if (capability.type === 'FEATURE') {
        setFeatureEnabled(capability.default_value?.enabled ?? true);
      } else if (capability.type === 'LIMIT') {
        setLimitValue(capability.default_value?.value ?? 0);
        setLimitUnit(capability.default_value?.unit ?? 'users');
      }
    }
  }, [capability]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Mã là bắt buộc';
    } else if (!/^[a-z0-9-]+$/.test(formData.code)) {
      newErrors.code = 'Mã chỉ chứa chữ thường, số và dấu gạch ngang';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Tên là bắt buộc';
    }

    if (formData.type === 'LIMIT' && limitValue < 0) {
      newErrors.limitValue = 'Giá trị giới hạn không được âm';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const default_value = formData.type === 'FEATURE'
        ? { enabled: featureEnabled }
        : { value: limitValue, unit: limitUnit };

      await onSubmit({
        ...formData,
        app_id: appId,
        default_value,
        validation_rules: {},
        metadata: {},
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="code">
            Mã capability <span className="text-red-500">*</span>
          </Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
            placeholder="max-employees"
            className={errors.code ? 'border-red-500' : ''}
            disabled={!!capability}
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
            Tên hiển thị <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Số lượng nhân viên tối đa"
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
          placeholder="Mô tả chi tiết về capability..."
          rows={2}
        />
      </div>

      {/* Type Selection */}
      <div>
        <Label htmlFor="type">
          Loại <span className="text-red-500">*</span>
        </Label>
        <select
          id="type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as CapabilityType })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          {CAPABILITY_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Default Value - FEATURE */}
      {formData.type === 'FEATURE' && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <Switch
              id="feature-enabled"
              checked={featureEnabled}
              onCheckedChange={setFeatureEnabled}
            />
            <Label htmlFor="feature-enabled" className="cursor-pointer">
              Bật mặc định
            </Label>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Tính năng này sẽ {featureEnabled ? 'được bật' : 'bị tắt'} theo mặc định
          </p>
        </div>
      )}

      {/* Default Value - LIMIT */}
      {formData.type === 'LIMIT' && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <Label className="mb-2 block">Giá trị giới hạn mặc định</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                type="number"
                value={limitValue}
                onChange={(e) => setLimitValue(Number(e.target.value))}
                placeholder="100"
                min="0"
                className={errors.limitValue ? 'border-red-500' : ''}
              />
              {errors.limitValue && (
                <p className="text-sm text-red-500 mt-1">{errors.limitValue}</p>
              )}
            </div>
            <div>
              <select
                value={limitUnit}
                onChange={(e) => setLimitUnit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {COMMON_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Giới hạn: {limitValue} {limitUnit}
          </p>
        </div>
      )}

      {/* Settings */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="status">Trạng thái</Label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as CapabilityStatus })}
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

        <div className="flex items-end">
          <div className="flex items-center gap-2">
            <Switch
              id="is_required"
              checked={formData.is_required}
              onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked })}
            />
            <Label htmlFor="is_required" className="cursor-pointer">
              Bắt buộc
            </Label>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting || loading}>
          Hủy
        </Button>
        <Button type="submit" disabled={submitting || loading}>
          {submitting || loading ? 'Đang xử lý...' : capability ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </div>
    </form>
  );
}
