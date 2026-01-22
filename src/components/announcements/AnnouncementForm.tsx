/**
 * System Announcement Form Component
 * Form for creating and editing system announcements
 * 
 * ✅ UPDATED 2026-01-20:
 * - Added Tenant Selection
 * - Added Target Audience configuration
 * - Added Display Location configuration
 * - Added JSON editor for complex fields (metadata, attachments)
 */

import React, { useState, useEffect } from 'react';
import { 
  SystemAnnouncement, 
  CreateSystemAnnouncementRequest,
  UpdateSystemAnnouncementRequest,
  AnnouncementType,
  AnnouncementPriority,
  AnnouncementStatus,
  TargetAudience
} from '../../api/systemAnnouncementsApi';
import { useTenants } from '../../api/tenantsApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useLanguage } from '../../providers/LanguageProvider';
import { 
  AlertCircle, Info, AlertTriangle, CheckCircle, Wrench, 
  Users, Monitor, Paperclip, Code 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface AnnouncementFormProps {
  announcement?: SystemAnnouncement;
  onSubmit: (data: CreateSystemAnnouncementRequest | UpdateSystemAnnouncementRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function AnnouncementForm({ announcement, onSubmit, onCancel, loading }: AnnouncementFormProps) {
  const { t } = useLanguage();
  const isEdit = !!announcement;
  const { tenants } = useTenants();

  const [formData, setFormData] = useState({
    tenant_id: announcement?.tenant_id || '',
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
    target_audience: announcement?.target_audience || { all: true } as TargetAudience,
    display_location: announcement?.display_location || ['dashboard'],
    icon: announcement?.icon || '',
    color: announcement?.color || '',
    link_url: announcement?.link_url || '',
    link_text: announcement?.link_text || '',
    metadata: announcement?.metadata || {},
    attachments: announcement?.attachments || {},
  });

  const [jsonInput, setJsonInput] = useState({
    target_audience: JSON.stringify(announcement?.target_audience || { all: true }, null, 2),
    metadata: JSON.stringify(announcement?.metadata || {}, null, 2),
    attachments: JSON.stringify(announcement?.attachments || {}, null, 2),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('general');

  // Update JSON inputs when form data changes (if needed, but usually we sync the other way)
  // Here we just initialize.

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.tenant_id) {
      newErrors.tenant_id = 'Vui lòng chọn Tenant';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề không được để trống';
    }
    
    if (formData.title.length > 500) {
      newErrors.title = 'Tiêu đề không được vượt quá 500 ký tự';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Nội dung không được để trống';
    }

    if (formData.end_date && formData.start_date) {
      if (new Date(formData.end_date) <= new Date(formData.start_date)) {
        newErrors.end_date = 'Ngày kết thúc phải sau ngày bắt đầu';
      }
    }
    
    if (formData.link_url && formData.link_url.length > 500) {
      newErrors.link_url = 'Link URL không được vượt quá 500 ký tự';
    }

    // Validate JSON fields
    try {
      JSON.parse(jsonInput.target_audience);
    } catch (e) {
      newErrors.target_audience = 'Invalid JSON format';
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
      category: formData.category.trim() || null,
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      icon: formData.icon.trim() || null,
      color: formData.color.trim() || null,
      link_url: formData.link_url.trim() || null,
      link_text: formData.link_text.trim() || null,
      display_location: formData.display_location,
      target_audience: JSON.parse(jsonInput.target_audience),
      metadata: JSON.parse(jsonInput.metadata),
      attachments: JSON.parse(jsonInput.attachments),
    };

    if (isEdit && announcement) {
      submitData.version = announcement.version;
    }

    onSubmit(submitData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleJsonChange = (field: string, value: string) => {
    setJsonInput(prev => ({ ...prev, [field]: value }));
    try {
      JSON.parse(value);
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    } catch (e) {
      setErrors(prev => ({ ...prev, [field]: 'Invalid JSON' }));
    }
  };

  const toggleLocation = (loc: string) => {
    const current = formData.display_location;
    const next = current.includes(loc)
      ? current.filter(l => l !== loc)
      : [...current, loc];
    handleChange('display_location', next);
  };

  const getTypeInfo = (type: AnnouncementType) => {
    switch (type) {
      case 'info': return { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'warning': return { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' };
      case 'error': return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' };
      case 'success': return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' };
      case 'maintenance': return { icon: Wrench, color: 'text-purple-600', bg: 'bg-purple-50' };
      default: return { icon: Info, color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  const typeInfo = getTypeInfo(formData.type);
  const TypeIcon = typeInfo.icon;

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Thông tin chung</TabsTrigger>
            <TabsTrigger value="targeting">Đối tượng & Hiển thị</TabsTrigger>
            <TabsTrigger value="advanced">Nâng cao</TabsTrigger>
          </TabsList>

          {/* GENERAL TAB */}
          <TabsContent value="general" className="space-y-6 mt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                {/* Tenant */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tenant <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.tenant_id}
                    onChange={(e) => handleChange('tenant_id', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                    disabled={isEdit} // Usually cannot change tenant on edit
                  >
                    <option value="">-- Chọn Tenant --</option>
                    {tenants.map(t => (
                      <option key={t._id} value={t._id}>{t.name} ({t.code})</option>
                    ))}
                  </select>
                  {errors.tenant_id && <p className="mt-1 text-sm text-red-600">{errors.tenant_id}</p>}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Ví dụ: Bảo trì hệ thống định kỳ"
                    maxLength={500}
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nội dung <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => handleChange('content', e.target.value)}
                    rows={6}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 ${
                      errors.content ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
                </div>

                {/* Type & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại thông báo</label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleChange('type', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                      <option value="success">Success</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Độ ưu tiên</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => handleChange('priority', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Status & Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2 pt-6">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_published"
                        checked={formData.is_published}
                        onChange={(e) => handleChange('is_published', e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <label htmlFor="is_published" className="text-sm font-medium">Đã xuất bản (Published)</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_pinned"
                        checked={formData.is_pinned}
                        onChange={(e) => handleChange('is_pinned', e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <label htmlFor="is_pinned" className="text-sm font-medium">Ghim lên đầu (Pinned)</label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TARGETING TAB */}
          <TabsContent value="targeting" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" /> Đối tượng & Thời gian
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu</label>
                    <Input
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => handleChange('start_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ngày kết thúc</label>
                    <Input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => handleChange('end_date', e.target.value)}
                    />
                    {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>}
                  </div>
                </div>

                {/* Display Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Monitor className="w-4 h-4" /> Vị trí hiển thị
                  </label>
                  <div className="flex gap-4">
                    {['dashboard', 'login', 'banner', 'notification_center'].map(loc => (
                      <div key={loc} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`loc-${loc}`}
                          checked={formData.display_location.includes(loc)}
                          onChange={() => toggleLocation(loc)}
                          className="rounded text-indigo-600"
                        />
                        <label htmlFor={`loc-${loc}`} className="text-sm capitalize">{loc.replace('_', ' ')}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Target Audience JSON */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Code className="w-4 h-4" /> Target Audience (JSON)
                  </label>
                  <textarea
                    value={jsonInput.target_audience}
                    onChange={(e) => handleJsonChange('target_audience', e.target.value)}
                    rows={4}
                    className="w-full font-mono text-xs rounded-lg border border-gray-300 px-3 py-2 bg-gray-50"
                  />
                  {errors.target_audience && <p className="mt-1 text-sm text-red-600">{errors.target_audience}</p>}
                  <p className="mt-1 text-xs text-gray-500">
                    Ex: {`{"all": true}`} or {`{"roles": ["admin"], "tenants": ["uuid"]}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ADVANCED TAB */}
          <TabsContent value="advanced" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" /> Cấu hình nâng cao
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Link & Visuals */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Link URL</label>
                    <Input value={formData.link_url} onChange={(e) => handleChange('link_url', e.target.value)} placeholder="https://" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Link Text</label>
                    <Input value={formData.link_text} onChange={(e) => handleChange('link_text', e.target.value)} placeholder="Xem chi tiết" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Icon (Lucide)</label>
                    <Input value={formData.icon} onChange={(e) => handleChange('icon', e.target.value)} placeholder="info, bell..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Màu sắc</label>
                    <div className="flex gap-2">
                      <Input type="color" value={formData.color || '#6366f1'} onChange={(e) => handleChange('color', e.target.value)} className="w-12 h-10 p-1" />
                      <Input value={formData.color} onChange={(e) => handleChange('color', e.target.value)} placeholder="#RRGGBB" />
                    </div>
                  </div>
                </div>

                {/* Metadata JSON */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Code className="w-4 h-4" /> Metadata (JSON)
                  </label>
                  <textarea
                    value={jsonInput.metadata}
                    onChange={(e) => handleJsonChange('metadata', e.target.value)}
                    rows={3}
                    className="w-full font-mono text-xs rounded-lg border border-gray-300 px-3 py-2 bg-gray-50"
                  />
                </div>

                {/* Attachments JSON */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" /> Attachments (JSON)
                  </label>
                  <textarea
                    value={jsonInput.attachments}
                    onChange={(e) => handleJsonChange('attachments', e.target.value)}
                    rows={3}
                    className="w-full font-mono text-xs rounded-lg border border-gray-300 px-3 py-2 bg-gray-50"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Preview Box */}
        <div className={`${typeInfo.bg} border border-${typeInfo.color.replace('text-', '')} rounded-lg p-4`}>
          <div className="flex gap-3">
            <TypeIcon className={`w-5 h-5 ${typeInfo.color} flex-shrink-0 mt-0.5`} />
            <div className="text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold">{formData.title || 'Tiêu đề thông báo'}</span>
                {formData.is_pinned && <span className="text-xs bg-gray-200 px-1 rounded">Pinned</span>}
                {formData.status === 'draft' && <span className="text-xs bg-yellow-200 px-1 rounded">Draft</span>}
              </div>
              <p className="text-gray-700">{formData.content || 'Nội dung thông báo...'}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Hủy bỏ</Button>
          <Button type="submit" disabled={loading || Object.keys(errors).length > 0} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </div>
      </form>
    </div>
  );
}
