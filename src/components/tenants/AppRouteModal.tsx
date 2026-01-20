/**
 * AppRouteModal Component
 * Modal for creating/editing tenant app routes
 * Dựa trên schema mới: domain-based routing
 */

import React, { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { TenantAppRoute, CreateRouteData, UpdateRouteData, SSLStatus, RouteScope } from '@/api/tenantAppRoutesApi';
import { useTenantAppRoutesResolver } from '@/hooks/useTenantAppRoutesResolver';
import { useTranslation } from 'react-i18next';

interface AppRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateRouteData | UpdateRouteData) => Promise<void>;
  route?: TenantAppRoute | null;
  tenantId?: string;
}

export function AppRouteModal({ isOpen, onClose, onSave, route, tenantId }: AppRouteModalProps) {
  const [formData, setFormData] = useState<Partial<CreateRouteData>>({
    tenant_id: tenantId || '',
    app_code: 'HRM_APP',
    domain: '',
    path_prefix: '/',
    route_scope: 'SPECIFIC_DOMAIN',
    is_primary: false,
    is_custom_domain: false,
    ssl_status: 'NONE',
    status: 'ACTIVE',
  });

  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { validateRoute } = useTenantAppRoutesResolver();
  const { t } = useTranslation();

  useEffect(() => {
    if (route) {
      setFormData({
        tenant_id: route.tenant_id,
        app_code: route.app_code,
        domain: route.domain,
        path_prefix: route.path_prefix,
        route_scope: route.route_scope || 'SPECIFIC_DOMAIN',
        is_primary: route.is_primary,
        is_custom_domain: route.is_custom_domain,
        ssl_status: route.ssl_status,
        status: route.status,
      });
    } else {
      setFormData({
        tenant_id: tenantId || '',
        app_code: 'HRM_APP',
        domain: '',
        path_prefix: '/',
        route_scope: 'SPECIFIC_DOMAIN',
        is_primary: false,
        is_custom_domain: false,
        ssl_status: 'NONE',
        status: 'ACTIVE',
      });
    }
    setValidationErrors([]);
  }, [route, tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setValidationErrors([]);

    try {
      // Validate trước khi save
      const validation = await validateRoute({
        tenant_id: formData.tenant_id!,
        route_scope: formData.route_scope!,
        domain: formData.domain || null,
        path_prefix: formData.path_prefix!,
        app_code: formData.app_code!,
        route_id: route?._id,
      });

      if (!validation.valid) {
        setValidationErrors(validation.errors);
        setSaving(false);
        return;
      }

      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving route:', error);
      alert('Lỗi khi lưu route: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {route ? 'Chỉnh sửa Route' : 'Thêm Route mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-red-800 mb-1">Validation Errors:</div>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((err, idx) => (
                      <li key={idx}>• {err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Route Scope - MỚI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Route Scope <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.route_scope}
              onChange={(e) => {
                const scope = e.target.value as RouteScope;
                setFormData({ 
                  ...formData, 
                  route_scope: scope,
                  // Auto clear domain nếu chọn ALL_MY_DOMAINS hoặc INHERITED
                  domain: (scope === 'ALL_MY_DOMAINS' || scope === 'INHERITED') ? null : formData.domain
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="SPECIFIC_DOMAIN">Specific Domain (Domain cụ thể)</option>
              <option value="ALL_MY_DOMAINS">All My Domains (Tất cả domain của tenant)</option>
              <option value="INHERITED">Inherited (Domain của tenant cha)</option>
            </select>
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              {formData.route_scope === 'SPECIFIC_DOMAIN' && (
                <p>✓ Route chạy trên 1 domain cụ thể (mặc định)</p>
              )}
              {formData.route_scope === 'ALL_MY_DOMAINS' && (
                <p className="text-blue-600">✓ Route chạy trên TẤT CẢ domains của tenant này (domain field sẽ bị bỏ qua)</p>
              )}
              {formData.route_scope === 'INHERITED' && (
                <p className="text-purple-600">✓ Route chạy trên TẤT CẢ domains của TENANT CHA (cho mô hình Tập đoàn/Đại lý)</p>
              )}
            </div>
          </div>

          {/* Domain - chỉ hiện khi SPECIFIC_DOMAIN */}
          {formData.route_scope === 'SPECIFIC_DOMAIN' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domain <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.domain || ''}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="example.saas.com hoặc custom-domain.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Subdomain của platform (vd: tenant-name.saas.com) hoặc custom domain
              </p>
            </div>
          )}

          {/* Info box cho ALL_MY_DOMAINS và INHERITED */}
          {formData.route_scope !== 'SPECIFIC_DOMAIN' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  {formData.route_scope === 'ALL_MY_DOMAINS' && (
                    <p>Route này sẽ tự động chạy trên tất cả domains đã verified của tenant. Không cần khai báo domain cụ thể.</p>
                  )}
                  {formData.route_scope === 'INHERITED' && (
                    <p>Route này sẽ tự động chạy trên tất cả domains của tenant cha. Tenant hiện tại phải có parent_tenant_id.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Path Prefix */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Path Prefix <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.path_prefix}
              onChange={(e) => setFormData({ ...formData, path_prefix: e.target.value })}
              placeholder="/app, /admin, hoặc /"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Tiền tố đường dẫn cho routing (mặc định là /)
            </p>
          </div>

          {/* App Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              App Code <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.app_code}
              onChange={(e) => setFormData({ ...formData, app_code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="HRM_APP">HRM_APP</option>
              <option value="CRM_APP">CRM_APP</option>
              <option value="PM_APP">PM_APP</option>
              <option value="FINANCE_APP">FINANCE_APP</option>
              <option value="PORTAL_APP">PORTAL_APP</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Mã ứng dụng sẽ được route đến
            </p>
          </div>

          {/* Type & SSL Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Domain Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại Domain
              </label>
              <select
                value={formData.is_custom_domain ? 'custom' : 'subdomain'}
                onChange={(e) => setFormData({ ...formData, is_custom_domain: e.target.value === 'custom' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="subdomain">Subdomain</option>
                <option value="custom">Custom Domain</option>
              </select>
            </div>

            {/* SSL Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SSL Status
              </label>
              <select
                value={formData.ssl_status}
                onChange={(e) => setFormData({ ...formData, ssl_status: e.target.value as SSLStatus })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="NONE">None</option>
                <option value="PENDING">{t('common.pending')}</option>
                <option value="ACTIVE">{t('common.active')}</option>
                <option value="FAILED">{t('common.failed')}</option>
              </select>
            </div>
          </div>

          {/* Primary Route */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_primary"
              checked={formData.is_primary || false}
              onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="is_primary" className="ml-2 text-sm text-gray-700">
              Đặt làm route chính (primary)
            </label>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-xs font-medium text-gray-600 mb-2">Preview:</div>
            <div className="font-mono text-sm text-gray-900">
              https://{formData.domain || '<domain>'}{formData.path_prefix || '/'} → {formData.app_code}
            </div>
            {formData.is_custom_domain && (
              <div className="mt-2 text-xs text-purple-600">
                ✓ Custom domain - cần cấu hình DNS
              </div>
            )}
            {formData.is_primary && (
              <div className="mt-2 text-xs text-yellow-600">
                ⭐ Primary route - route mặc định cho tenant
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : route ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AppRouteModal;