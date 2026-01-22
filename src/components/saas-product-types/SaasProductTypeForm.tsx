/**
 * SaasProductTypeForm Component
 * Reusable form for Add/Edit SaaS Product Type pages
 * Adapted from ProductTypeForm
 */

import React, { useState, useEffect } from 'react';
import { 
  SaasProductType, 
  CreateSaasProductTypeRequest, 
  UpdateSaasProductTypeRequest,
  validateCode
} from '../../api/saasProductTypesApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Package, AlertCircle, Info, CheckCircle } from 'lucide-react';

interface SaasProductTypeFormProps {
  initialData?: SaasProductType | null;
  onSubmit: (data: CreateSaasProductTypeRequest | UpdateSaasProductTypeRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function SaasProductTypeForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  loading = false 
}: SaasProductTypeFormProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || '',
        name: initialData.name || '',
        description: initialData.description || '',
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        is_active: true,
      });
    }
  }, [initialData]);

  const validateFormCode = (code: string) => {
    if (!code.trim()) {
      return 'Mã loại sản phẩm là bắt buộc';
    }
    
    if (code.length > 50) {
      return 'Mã không được vượt quá 50 ký tự';
    }
    
    if (!validateCode(code)) {
      return 'Mã chỉ được chứa chữ IN HOA, số và dấu gạch dưới (A-Z, 0-9, _)';
    }
    
    return '';
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Validate code (only for create)
    if (!initialData) {
      const codeError = validateFormCode(formData.code);
      if (codeError) {
        newErrors.code = codeError;
      }
    }

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Tên loại sản phẩm là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);
    try {
      if (initialData) {
        // Update existing product type
        const updateData: UpdateSaasProductTypeRequest = {
          name: formData.name,
          description: formData.description || undefined,
          is_active: formData.is_active,
          version: initialData.version // Optimistic locking
        };
        await onSubmit(updateData);
      } else {
        // Create new product type
        const createData: CreateSaasProductTypeRequest = {
          code: formData.code.toUpperCase(), // Ensure uppercase
          name: formData.name,
          description: formData.description || undefined,
          is_active: formData.is_active,
        };
        await onSubmit(createData);
      }
    } catch (error: any) {
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCodeChange = (value: string) => {
    // Auto-convert to uppercase
    const upperValue = value.toUpperCase();
    setFormData({ ...formData, code: upperValue });
    
    // Clear error when typing
    if (errors.code) {
      setErrors({ ...errors, code: '' });
    }
  };

  const isCodeValid = !initialData && formData.code && !validateFormCode(formData.code);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Banner */}
      {errors.submit && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div className="text-sm text-red-800 dark:text-red-300">
              <p className="font-semibold">Lỗi</p>
              <p>{errors.submit}</p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-indigo-600" />
          Thông tin loại sản phẩm SaaS
        </h3>

        <div className="space-y-4">
          {/* Code (only for create) */}
          {!initialData && (
            <div>
              <Label htmlFor="code">
                Mã loại sản phẩm <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                type="text"
                value={formData.code}
                onChange={e => handleCodeChange(e.target.value)}
                className={errors.code ? 'border-red-500' : isCodeValid ? 'border-green-500' : ''}
                placeholder="VD: SAAS_BASIC, ENT_PLUS"
                disabled={loading || submitting}
                maxLength={50}
              />
              {errors.code && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.code}
                </p>
              )}
              {isCodeValid && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Mã hợp lệ
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <Info className="w-3 h-3 inline mr-1" />
                Chỉ sử dụng chữ IN HOA (A-Z), số (0-9) và dấu gạch dưới (_)
              </p>
            </div>
          )}

          {/* Code Display (for edit) */}
          {initialData && (
            <div>
              <Label>Mã loại sản phẩm</Label>
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md">
                <code className="text-sm font-mono text-gray-900 dark:text-white">
                  {initialData.code}
                </code>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <Info className="w-3 h-3 inline mr-1" />
                Mã không thể thay đổi sau khi tạo
              </p>
            </div>
          )}

          {/* Name */}
          <div>
            <Label htmlFor="name">
              Tên loại sản phẩm <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? 'border-red-500' : ''}
              placeholder="VD: SaaS Basic, Enterprise Plus"
              disabled={loading || submitting}
            />
            {errors.name && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả về loại sản phẩm này..."
              rows={3}
              disabled={loading || submitting}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tùy chọn: Thêm mô tả chi tiết về loại sản phẩm
            </p>
          </div>

          {/* Is Active */}
          <div>
            <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                className="mt-1"
                disabled={loading || submitting}
              />
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900 dark:text-white">
                  Kích hoạt
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Loại sản phẩm này có thể được sử dụng trong hệ thống
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Hủy
        </Button>
        <Button
          type="submit"
          disabled={submitting || loading}
          className="min-w-[120px]"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Đang lưu...
            </>
          ) : (
            <>{initialData ? 'Cập nhật' : 'Tạo mới'}</>
          )}
        </Button>
      </div>
    </form>
  );
}