/**
 * System Announcement Form Component
 * Form for creating and editing system announcements
 * Matches database schema: type, priority (low/normal/high/critical), status (draft/active/expired/archived)
 */

import React, { useState, useEffect } from 'react';
import { 
  SystemAnnouncement, 
  CreateSystemAnnouncementRequest,
  UpdateSystemAnnouncementRequest,
  AnnouncementType,
  AnnouncementPriority,
  AnnouncementStatus
} from '../../api/systemAnnouncementsApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useLanguage } from '../../providers/LanguageProvider';
import { AlertCircle, Info, AlertTriangle, CheckCircle, Wrench } from 'lucide-react';

interface AnnouncementFormProps {
  announcement?: SystemAnnouncement;
  onSubmit: (data: CreateSystemAnnouncementRequest | UpdateSystemAnnouncementRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function AnnouncementForm({ announcement, onSubmit, onCancel, loading }: AnnouncementFormProps) {
  const { t } = useLanguage();
  const isEdit = !!announcement;

  const [formData, setFormData] = useState({
    tenant_id: announcement?.tenant_id || '00000000-0000-0000-0000-000000000001', // Default tenant
    title: announcement?.title || '',
    content: announcement?.content || '',
    type: (announcement?.type || 'info') as AnnouncementType,
    priority: (announcement?.priority || 'normal') as AnnouncementPriority,
    status: (announcement?.status || 'draft') as AnnouncementStatus,
    category: announcement?.category || '',
    is_published: announcement?.is_published ?? false,
    is_pinned: announcement?.is_pinned ?? false,
    start_date: announcement?.start_date ? announcement.start_date.slice(0, 16) : '',
    end_date: announcement?.end_date ? announcement.end_date.slice(0, 16) : '',
    icon: announcement?.icon || '',
    color: announcement?.color || '',
    link_url: announcement?.link_url || '',
    link_text: announcement?.link_text || '',
    metadata: announcement?.metadata || {},
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề không được để trống';
    }
    
    if (formData.title.length > 500) {
      newErrors.title = 'Tiêu đề không được vượt quá 500 ký tự';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Nội dung không được để trống';
    }

    // If end_date is provided, it must be after start_date
    if (formData.end_date && formData.start_date) {
      if (new Date(formData.end_date) <= new Date(formData.start_date)) {
        newErrors.end_date = 'Ngày kết thúc phải sau ngày bắt đầu';
      }
    }
    
    // Validate link_url if provided
    if (formData.link_url && formData.link_url.length > 500) {
      newErrors.link_url = 'Link URL không được vượt quá 500 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData: any = {
      tenant_id: formData.tenant_id,
      title: formData.title.trim(),
      content: formData.content.trim(),
      type: formData.type,
      priority: formData.priority,
      status: formData.status,
      is_published: formData.is_published,
      is_pinned: formData.is_pinned,
      metadata: formData.metadata,
    };

    // Add optional fields
    if (formData.category.trim()) {
      submitData.category = formData.category.trim();
    }
    if (formData.start_date) {
      submitData.start_date = new Date(formData.start_date).toISOString();
    }
    if (formData.end_date) {
      submitData.end_date = new Date(formData.end_date).toISOString();
    }
    if (formData.icon.trim()) {
      submitData.icon = formData.icon.trim();
    }
    if (formData.color.trim()) {
      submitData.color = formData.color.trim();
    }
    if (formData.link_url.trim()) {
      submitData.link_url = formData.link_url.trim();
    }
    if (formData.link_text.trim()) {
      submitData.link_text = formData.link_text.trim();
    }

    // For edit, include version
    if (isEdit && announcement) {
      submitData.version = announcement.version;
    }

    onSubmit(submitData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getTypeInfo = (type: AnnouncementType) => {
    switch (type) {
      case 'info':
        return { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Thông tin chung' };
      case 'warning':
        return { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', desc: 'Cảnh báo quan trọng' };
      case 'error':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', desc: 'Lỗi hệ thống' };
      case 'success':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', desc: 'Thành công' };
      case 'maintenance':
        return { icon: Wrench, color: 'text-purple-600', bg: 'bg-purple-50', desc: 'Bảo trì hệ thống' };
      default:
        return { icon: Info, color: 'text-gray-600', bg: 'bg-gray-50', desc: '' };
    }
  };

  const getPriorityBadge = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'critical':
        return { label: 'Khẩn cấp', color: 'bg-red-100 text-red-800 border-red-300' };
      case 'high':
        return { label: 'Cao', color: 'bg-orange-100 text-orange-800 border-orange-300' };
      case 'normal':
        return { label: 'Bình thường', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'low':
        return { label: 'Thấp', color: 'bg-gray-100 text-gray-800 border-gray-300' };
    }
  };

  const typeInfo = getTypeInfo(formData.type);
  const TypeIcon = typeInfo.icon;

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tiêu đề thông báo <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Ví dụ: Bảo trì hệ thống định kỳ"
            maxLength={500}
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {formData.title.length}/500 ký tự
          </p>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nội dung thông báo <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => handleChange('content', e.target.value)}
            rows={6}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 ${
              errors.content ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Mô tả chi tiết về thông báo..."
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Hỗ trợ định dạng Markdown. Sử dụng **in đậm**, *in nghiêng*, [link](url)
          </p>
        </div>

        {/* Type & Priority */}
        <div className="grid grid-cols-2 gap-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại thông báo <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value as AnnouncementType)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="info">Info - Thông tin</option>
              <option value="warning">Warning - Cảnh báo</option>
              <option value="error">Error - Lỗi</option>
              <option value="success">Success - Thành công</option>
              <option value="maintenance">Maintenance - Bảo trì</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mức độ ưu tiên <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value as AnnouncementPriority)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="low">Low - Thấp</option>
              <option value="normal">Normal - Bình thường</option>
              <option value="high">High - Cao</option>
              <option value="critical">Critical - Khẩn cấp</option>
            </select>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Danh mục <span className="text-gray-400">(Tùy chọn)</span>
          </label>
          <Input
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            placeholder="Ví dụ: system, maintenance, security, feature..."
            maxLength={100}
          />
          <p className="mt-1 text-xs text-gray-500">
            Danh mục giúp phân loại thông báo (system, maintenance, security, feature...)
          </p>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trạng thái <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['draft', 'active', 'expired', 'archived'] as const).map((status) => {
              const isSelected = formData.status === status;
              const colors = {
                draft: 'border-gray-400 bg-gray-50 text-gray-700',
                active: 'border-green-500 bg-green-50 text-green-700',
                expired: 'border-orange-500 bg-orange-50 text-orange-700',
                archived: 'border-blue-500 bg-blue-50 text-blue-700',
              };
              
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleChange('status', status)}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    isSelected
                      ? colors[status]
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="text-sm font-medium capitalize">{status}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Publishing & Pinning Options */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published}
              onChange={(e) => handleChange('is_published', e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
              Đã xuất bản
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_pinned"
              checked={formData.is_pinned}
              onChange={(e) => handleChange('is_pinned', e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="is_pinned" className="text-sm font-medium text-gray-700">
              Ghim lên đầu
            </label>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày bắt đầu <span className="text-gray-400">(Tùy chọn)</span>
            </label>
            <Input
              type="datetime-local"
              value={formData.start_date}
              onChange={(e) => handleChange('start_date', e.target.value)}
              className={errors.start_date ? 'border-red-500' : ''}
            />
            {errors.start_date && (
              <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày kết thúc <span className="text-gray-400">(Tùy chọn)</span>
            </label>
            <Input
              type="datetime-local"
              value={formData.end_date}
              onChange={(e) => handleChange('end_date', e.target.value)}
              className={errors.end_date ? 'border-red-500' : ''}
            />
            {errors.end_date && (
              <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Để trống nếu không có ngày hết hạn
            </p>
          </div>
        </div>

        {/* Link (Optional) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link URL <span className="text-gray-400">(Tùy chọn)</span>
            </label>
            <Input
              type="url"
              value={formData.link_url}
              onChange={(e) => handleChange('link_url', e.target.value)}
              placeholder="https://example.com"
              maxLength={500}
              className={errors.link_url ? 'border-red-500' : ''}
            />
            {errors.link_url && (
              <p className="mt-1 text-sm text-red-600">{errors.link_url}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link Text <span className="text-gray-400">(Tùy chọn)</span>
            </label>
            <Input
              value={formData.link_text}
              onChange={(e) => handleChange('link_text', e.target.value)}
              placeholder="Xem thêm"
              maxLength={200}
            />
          </div>
        </div>

        {/* Icon & Color (Optional) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon <span className="text-gray-400">(Tùy chọn)</span>
            </label>
            <Input
              value={formData.icon}
              onChange={(e) => handleChange('icon', e.target.value)}
              placeholder="alert-circle, info, bell..."
              maxLength={100}
            />
            <p className="mt-1 text-xs text-gray-500">
              Tên icon từ Lucide icons
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Màu sắc <span className="text-gray-400">(Tùy chọn)</span>
            </label>
            <Input
              type="color"
              value={formData.color || '#6366f1'}
              onChange={(e) => handleChange('color', e.target.value)}
              className="h-10"
            />
          </div>
        </div>

        {/* Info Box */}
        <div className={`${typeInfo.bg} border border-${typeInfo.color.replace('text-', '')} rounded-lg p-4`}>
          <div className="flex gap-3">
            <TypeIcon className={`w-5 h-5 ${typeInfo.color} flex-shrink-0 mt-0.5`} />
            <div className="text-sm">
              <p className="font-medium mb-1">Xem trước thông báo ({formData.type} - {getPriorityBadge(formData.priority).label})</p>
              <p className="text-gray-700">
                <strong>{formData.title || 'Tiêu đề thông báo'}</strong>
              </p>
              <p className="text-gray-600 mt-1">
                {formData.content || 'Nội dung thông báo sẽ hiển thị ở đây...'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Đang lưu...
              </span>
            ) : (
              isEdit ? 'Cập nhật' : 'Tạo thông báo'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}