/**
 * LegalDocumentModal Component
 * Modal form để thêm/sửa legal document
 */

import React, { useState, useEffect } from 'react';
import { X, FileText, Save, AlertCircle } from 'lucide-react';
import {
  LegalDocument,
  LegalDocumentType,
  LegalDocumentStatus,
  CreateLegalDocumentData,
  UpdateLegalDocumentData,
} from '../../api/legalDocumentsApi';
import { useTenants } from '../../hooks/useTenants';

interface LegalDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLegalDocumentData | UpdateLegalDocumentData, id?: string) => Promise<void>;
  editData?: LegalDocument;
  currentUserId?: string;
}

const DOCUMENT_TYPES: { value: LegalDocumentType; label: string }[] = [
  { value: 'terms_of_service', label: 'Terms of Service' },
  { value: 'privacy_policy', label: 'Privacy Policy' },
  { value: 'cookie_policy', label: 'Cookie Policy' },
  { value: 'gdpr', label: 'GDPR' },
  { value: 'eula', label: 'EULA' },
  { value: 'sla', label: 'SLA' },
  { value: 'dpa', label: 'DPA' },
  { value: 'other', label: 'Other' },
];

const STATUSES: { value: LegalDocumentStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'published', label: 'Published', color: 'green' },
  { value: 'archived', label: 'Archived', color: 'orange' },
];

const LANGUAGES = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
];

export function LegalDocumentModal({ isOpen, onClose, onSubmit, editData, currentUserId }: LegalDocumentModalProps) {
  const { tenants } = useTenants();

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    type: 'terms_of_service' as LegalDocumentType,
    version: '1.0',
    content: '',
    summary: '',
    status: 'draft' as LegalDocumentStatus,
    effective_date: '',
    expiry_date: '',
    tenant_id: '',
    language: 'vi',
    is_active: true,
    metadata: '{}',
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load edit data
  useEffect(() => {
    if (editData) {
      setFormData({
        title: editData.title,
        slug: editData.slug,
        type: editData.type,
        version: editData.version,
        content: editData.content,
        summary: editData.summary || '',
        status: editData.status,
        effective_date: editData.effective_date ? new Date(editData.effective_date).toISOString().slice(0, 10) : '',
        expiry_date: editData.expiry_date ? new Date(editData.expiry_date).toISOString().slice(0, 10) : '',
        tenant_id: editData.tenant_id || '',
        language: editData.language || 'vi',
        is_active: editData.is_active ?? true,
        metadata: editData.metadata ? JSON.stringify(editData.metadata, null, 2) : '{}',
      });
    } else {
      resetForm();
    }
  }, [editData, isOpen]);

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      type: 'terms_of_service',
      version: '1.0',
      content: '',
      summary: '',
      status: 'draft',
      effective_date: '',
      expiry_date: '',
      tenant_id: '',
      language: 'vi',
      is_active: true,
      metadata: '{}',
    });
    setErrors({});
  };

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: editData ? prev.slug : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (!formData.version.trim()) {
      newErrors.version = 'Version is required';
    }

    // Validate metadata JSON
    try {
      JSON.parse(formData.metadata);
    } catch (e) {
      newErrors.metadata = 'Invalid JSON format';
    }

    // Validate dates
    if (formData.effective_date && formData.expiry_date) {
      if (new Date(formData.effective_date) > new Date(formData.expiry_date)) {
        newErrors.expiry_date = 'Expiry date must be after effective date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSaving(true);
    try {
      // Parse metadata
      let metadataObj = {};
      try {
        metadataObj = JSON.parse(formData.metadata);
      } catch (e) {
        // Should be caught by validate, but safe fallback
        metadataObj = {};
      }

      const submitData: any = {
        title: formData.title,
        slug: formData.slug,
        type: formData.type,
        version: formData.version,
        content: formData.content,
        summary: formData.summary || undefined,
        status: formData.status,
        effective_date: formData.effective_date || undefined,
        expiry_date: formData.expiry_date || undefined,
        tenant_id: formData.tenant_id || undefined,
        language: formData.language,
        is_active: formData.is_active,
        metadata: metadataObj,
      };

      // Handle audit fields
      if (!editData) {
        // Create
        if (currentUserId) submitData.created_by = currentUserId;
        if (formData.status === 'published') {
          if (currentUserId) submitData.published_by = currentUserId;
          submitData.published_at = new Date().toISOString();
        }
      } else {
        // Update
        if (currentUserId) submitData.updated_by = currentUserId;
        // If changing status to published (and wasn't before), set published info
        if (formData.status === 'published' && editData.status !== 'published') {
           if (currentUserId) submitData.published_by = currentUserId;
           submitData.published_at = new Date().toISOString();
        }
      }

      await onSubmit(submitData, editData?._id);
      resetForm();
      onClose();
    } catch (err) {
      console.error('Error saving document:', err);
      // alert(err instanceof Error ? err.message : 'Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {editData ? 'Sửa văn bản pháp lý' : 'Thêm văn bản pháp lý'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Terms of Service"
                  />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors ${
                      errors.slug ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="terms-of-service-v1"
                  />
                  {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as LegalDocumentType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {DOCUMENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Version */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phiên bản <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                      errors.version ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="1.0"
                  />
                  {errors.version && <p className="text-red-500 text-xs mt-1">{errors.version}</p>}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as LegalDocumentStatus })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ngôn ngữ</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Summary */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tóm tắt</label>
                  <textarea
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Brief summary..."
                  />
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ngày hiệu lực</label>
                    <input
                      type="date"
                      value={formData.effective_date}
                      onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ngày hết hạn</label>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                         errors.expiry_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.expiry_date && <p className="text-red-500 text-xs mt-1">{errors.expiry_date}</p>}
                  </div>
                </div>

                {/* Tenant */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tenant (để trống = Global)
                  </label>
                  <select
                    value={formData.tenant_id}
                    onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Global (All Tenants)</option>
                    {tenants.map((tenant) => (
                      <option key={tenant._id} value={tenant._id}>
                        {tenant.name} ({tenant.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Is Active */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                    Kích hoạt (Hiển thị cho người dùng)
                  </label>
                </div>

                {/* Metadata */}
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Metadata (JSON)</label>
                   <textarea
                     value={formData.metadata}
                     onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
                     rows={3}
                     className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs ${
                        errors.metadata ? 'border-red-500' : 'border-gray-300'
                     }`}
                     placeholder="{}"
                   />
                   {errors.metadata && <p className="text-red-500 text-xs mt-1">{errors.metadata}</p>}
                </div>
              </div>

              {/* Content - Full Width */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung (Markdown) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={15}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm ${
                    errors.content ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="# Terms of Service\n\nWelcome..."
                />
                {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}
                <p className="text-xs text-gray-500 mt-1">Hỗ trợ định dạng Markdown</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Đang lưu...' : editData ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LegalDocumentModal;
