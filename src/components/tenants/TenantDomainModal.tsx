/**
 * TenantDomainModal Component
 * Modal for adding/editing tenant domains
 * Standardized for tenant_domains schema
 */

import React, { useState, useEffect } from 'react';
import { X, Info, Globe, Shield, AlertCircle, Copy, RefreshCw } from 'lucide-react';
import { 
  tenantDomainsApi, 
  TenantDomain, 
  CreateDomainRequest, 
  UpdateDomainRequest, 
  VerificationMethod, 
  DomainPolicy,
  VerificationInstructions
} from '../../api/tenantDomainsApi';
import { Button } from '../ui/button';
import { useTranslation } from '../../providers/LanguageProvider'; // Or react-i18next depending on project
import { toast } from 'sonner';

interface TenantDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateDomainRequest | UpdateDomainRequest) => Promise<void>;
  domain?: TenantDomain | null;
  tenantId: string;
}

export function TenantDomainModal({ isOpen, onClose, onSave, domain, tenantId }: TenantDomainModalProps) {
  const { t } = useTranslation(); // Assuming translation hook exists
  const isEdit = !!domain;

  const [formData, setFormData] = useState<Partial<CreateDomainRequest>>({
    tenant_id: tenantId,
    domain: '',
    verification_method: 'DNS_TXT',
    policy: 'NONE',
  });

  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [instructions, setInstructions] = useState<VerificationInstructions | null>(null);

  useEffect(() => {
    if (domain) {
      setFormData({
        domain: domain.domain,
        verification_method: domain.verification_method || 'DNS_TXT',
        policy: domain.policy,
      });
      setInstructions(tenantDomainsApi.getVerificationInstructions(domain));
    } else {
      setFormData({
        tenant_id: tenantId,
        domain: '',
        verification_method: 'DNS_TXT',
        policy: 'NONE',
      });
      setInstructions(null);
    }
    setValidationErrors([]);
  }, [domain, tenantId, isOpen]);

  const validateForm = () => {
    const errors: string[] = [];
    if (!formData.domain?.trim()) {
      errors.push('Tên miền không được để trống');
    } else if (!tenantDomainsApi.validate({ domain: formData.domain }).valid) {
      errors.push('Tên miền không hợp lệ (chỉ chứa chữ thường, số, dấu chấm và gạch ngang)');
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await onSave(formData as CreateDomainRequest); // Type assertion, validated above
      onClose();
    } catch (error: any) {
      console.error('Error saving domain:', error);
      setValidationErrors([error.message || 'Lỗi khi lưu tên miền']);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép vào clipboard');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Chi tiết Tên miền' : 'Thêm Tên miền mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Domain Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tên miền <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value.toLowerCase() })}
                    disabled={isEdit} // Prevent editing domain name once created, consistent with common practices
                    placeholder="example.com"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
                  />
                </div>
                {!isEdit && (
                  <p className="mt-1 text-xs text-gray-500">
                    Nhập tên miền đầy đủ (ví dụ: example.com hoặc app.example.com).
                  </p>
                )}
              </div>

              {/* Verification Method & Policy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phương thức xác thực
                  </label>
                  <select
                    value={formData.verification_method}
                    onChange={(e) => setFormData({ ...formData, verification_method: e.target.value as VerificationMethod })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="DNS_TXT">DNS TXT Record</option>
                    <option value="HTML_FILE">HTML File Upload</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Chính sách tên miền
                  </label>
                  <select
                    value={formData.policy}
                    onChange={(e) => setFormData({ ...formData, policy: e.target.value as DomainPolicy })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="NONE">Không áp dụng (None)</option>
                    <option value="CAPTURE">Thu thập tài khoản (Capture)</option>
                    <option value="ENFORCE_SSO">Bắt buộc SSO (Enforce SSO)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Verification Instructions (View Mode Only) */}
            {isEdit && instructions && (
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  Hướng dẫn xác thực
                </h3>
                
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {instructions.instructions}
                    </p>
                  </div>

                  {instructions.method === 'DNS_TXT' && (
                    <div className="space-y-3">
                       <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                          Record Name (Host)
                        </label>
                        <div className="flex gap-2">
                          <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
                            {instructions.recordName}
                          </code>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleCopy(instructions.recordName || '')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                          Record Value (TXT)
                        </label>
                        <div className="flex gap-2">
                          <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
                            {instructions.recordValue}
                          </code>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleCopy(instructions.recordValue || '')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {instructions.method === 'HTML_FILE' && (
                     <div className="space-y-3">
                       <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                          File Path
                        </label>
                        <div className="flex gap-2">
                          <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
                            {instructions.filePath}
                          </code>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleCopy(instructions.filePath || '')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                          File Content
                        </label>
                        <div className="flex gap-2">
                          <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
                            {instructions.fileContent}
                          </code>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleCopy(instructions.fileContent || '')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Thêm tên miền')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TenantDomainModal;
