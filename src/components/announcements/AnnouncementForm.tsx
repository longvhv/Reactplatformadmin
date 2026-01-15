/**
 * System Announcement Form Component
 * Form for creating and editing system announcements
 * Matches API schema: priority (INFO|WARNING|CRITICAL), status (ACTIVE|INACTIVE)
 */

import React, { useState, useEffect } from 'react';
import { 
  SystemAnnouncement, 
  CreateSystemAnnouncementRequest,
  UpdateSystemAnnouncementRequest 
} from '../../api/systemAnnouncementApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useLanguage } from '../../providers/LanguageProvider';
import { AlertCircle, Info, AlertTriangle } from 'lucide-react';

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
    title: announcement?.title || '',
    content: announcement?.content || '',
    priority: announcement?.priority || 'INFO' as 'INFO' | 'WARNING' | 'CRITICAL',
    status: announcement?.status || 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    start_date: announcement?.start_date ? announcement.start_date.slice(0, 16) : '',
    end_date: announcement?.end_date ? announcement.end_date.slice(0, 16) : '',
    metadata: announcement?.metadata || {},
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề không được để trống';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Nội dung không được để trống';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Ngày bắt đầu không được để trống';
    }

    // If end_date is provided, it must be after start_date
    if (formData.end_date && formData.start_date) {
      if (new Date(formData.end_date) <= new Date(formData.start_date)) {
        newErrors.end_date = 'Ngày kết thúc phải sau ngày bắt đầu';
      }
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
      title: formData.title.trim(),
      content: formData.content.trim(),
      priority: formData.priority,
      start_date: new Date(formData.start_date).toISOString(),
      metadata: formData.metadata,
    };

    // Add optional fields
    if (formData.end_date) {
      submitData.end_date = new Date(formData.end_date).toISOString();
    }

    // For edit, include status and version
    if (isEdit && announcement) {
      submitData.status = formData.status;
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

  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'INFO':
        return { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Thông tin chung' };
      case 'WARNING':
        return { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', desc: 'Cảnh báo quan trọng' };
      case 'CRITICAL':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', desc: 'Khẩn cấp - Ưu tiên cao nhất' };
      default:
        return { icon: Info, color: 'text-gray-600', bg: 'bg-gray-50', desc: '' };
    }
  };

  const priorityInfo = getPriorityInfo(formData.priority);
  const PriorityIcon = priorityInfo.icon;

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
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
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

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mức độ ưu tiên <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['INFO', 'WARNING', 'CRITICAL'] as const).map((priority) => {
              const info = getPriorityInfo(priority);
              const Icon = info.icon;
              const isSelected = formData.priority === priority;
              
              return (
                <button
                  key={priority}
                  type="button"
                  onClick={() => handleChange('priority', priority)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? `border-indigo-500 ${info.bg}`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <Icon className={`w-6 h-6 ${isSelected ? info.color : 'text-gray-400'}`} />
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                      {priority}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {info.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status (only for edit) */}
        {isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleChange('status', 'ACTIVE')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  formData.status === 'ACTIVE'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`text-sm font-medium ${
                  formData.status === 'ACTIVE' ? 'text-green-700' : 'text-gray-600'
                }`}>
                  ACTIVE - Đang hoạt động
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Thông báo hiển thị cho người dùng
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleChange('status', 'INACTIVE')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  formData.status === 'INACTIVE'
                    ? 'border-gray-500 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`text-sm font-medium ${
                  formData.status === 'INACTIVE' ? 'text-gray-700' : 'text-gray-600'
                }`}>
                  INACTIVE - Tạm ngưng
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Thông báo không hiển thị
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày bắt đầu <span className="text-red-500">*</span>
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

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Lưu ý khi tạo thông báo:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Thông báo mới mặc định có trạng thái ACTIVE</li>
                <li>Thông báo CRITICAL sẽ hiển thị nổi bật nhất</li>
                <li>Thông báo sẽ tự động ẩn sau ngày kết thúc (nếu có)</li>
              </ul>
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
