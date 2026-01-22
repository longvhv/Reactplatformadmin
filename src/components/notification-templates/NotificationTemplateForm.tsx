/**
 * Notification Template Form Component
 * Form for creating and editing notification templates
 * 
 * ✅ ENHANCED:
 * - Full page form layout support
 * - Tenant selection
 * - JSON editors for variables/sample_data/metadata/headers/attachments
 * - Comprehensive validation
 * - Strict schema compliance
 */

import React, { useState } from 'react';
import { 
  NotificationTemplate, 
  CreateTemplateRequest, 
  UpdateTemplateRequest,
  NotificationType,
  TemplateStatus,
  TemplatePriority
} from '../../api/notificationTemplateApi';
import { useTenants } from '../../api/tenantsApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useLanguage } from '../../providers/LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  FileText, Settings, Code, Mail, MessageSquare, 
  Smartphone, Bell, Webhook, Clock, Paperclip, List
} from 'lucide-react';

interface NotificationTemplateFormProps {
  template?: NotificationTemplate;
  onSubmit: (data: CreateTemplateRequest | UpdateTemplateRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function NotificationTemplateForm({ template, onSubmit, onCancel, loading }: NotificationTemplateFormProps) {
  const { t } = useLanguage();
  const isEdit = !!template;
  const { tenants } = useTenants();
  const [activeTab, setActiveTab] = useState('general');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    tenant_id: template?.tenant_id || '',
    template_code: template?.template_code || '',
    template_name: template?.template_name || '',
    description: template?.description || '',
    subject: template?.subject || '',
    body_text: template?.body_text || '',
    body_html: template?.body_html || '',
    notification_type: (template?.notification_type || 'email') as NotificationType,
    category: template?.category || '',
    priority: (template?.priority || 'normal') as TemplatePriority,
    language_code: template?.language_code || 'vi',
    status: (template?.status || 'draft') as TemplateStatus,
    delivery_channels: template?.delivery_channels || ['email'],
    send_immediately: template?.send_immediately ?? true,
    scheduled_send_time: template?.scheduled_send_time || '',
    is_system_template: template?.is_system_template ?? false,
    is_editable: template?.is_editable ?? true,
    tags: template?.tags ? template.tags.join(', ') : '',
    parent_template_id: template?.parent_template_id || '',
  });

  // JSON States
  const [jsonInput, setJsonInput] = useState({
    variables: JSON.stringify(template?.variables || [], null, 2),
    sample_data: JSON.stringify(template?.sample_data || {}, null, 2),
    metadata: JSON.stringify(template?.metadata || {}, null, 2),
    headers: JSON.stringify(template?.headers || {}, null, 2),
    attachments: JSON.stringify(template?.attachments || [], null, 2),
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.tenant_id) newErrors.tenant_id = 'Vui lòng chọn Tenant';
    if (!formData.template_code) newErrors.template_code = 'Mã template là bắt buộc';
    if (!formData.template_name) newErrors.template_name = 'Tên template là bắt buộc';
    
    // Validate body content based on type
    if (formData.notification_type === 'email') {
      if (!formData.subject) newErrors.subject = 'Tiêu đề Email là bắt buộc';
      if (!formData.body_html && !formData.body_text) newErrors.body = 'Nội dung Email là bắt buộc';
    } else {
      if (!formData.body_text) newErrors.body_text = 'Nội dung thông báo là bắt buộc';
    }

    // JSON Validation
    try { JSON.parse(jsonInput.variables); } catch { newErrors.variables = 'Invalid JSON'; }
    try { JSON.parse(jsonInput.sample_data); } catch { newErrors.sample_data = 'Invalid JSON'; }
    try { JSON.parse(jsonInput.metadata); } catch { newErrors.metadata = 'Invalid JSON'; }
    try { JSON.parse(jsonInput.headers); } catch { newErrors.headers = 'Invalid JSON'; }
    try { JSON.parse(jsonInput.attachments); } catch { newErrors.attachments = 'Invalid JSON'; }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const tagsArray = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const submitData: any = {
      ...formData,
      tags: tagsArray,
      variables: JSON.parse(jsonInput.variables),
      sample_data: JSON.parse(jsonInput.sample_data),
      metadata: JSON.parse(jsonInput.metadata),
      headers: JSON.parse(jsonInput.headers),
      attachments: JSON.parse(jsonInput.attachments),
      parent_template_id: formData.parent_template_id || null, // Convert empty string to null
    };

    if (isEdit && template) {
      submitData.version = template.version;
    }

    onSubmit(submitData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleJsonChange = (field: keyof typeof jsonInput, value: string) => {
    setJsonInput(prev => ({ ...prev, [field]: value }));
    try {
      JSON.parse(value);
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    } catch {
      setErrors(prev => ({ ...prev, [field]: 'Invalid JSON format' }));
    }
  };

  const toggleChannel = (channel: string) => {
    const current = formData.delivery_channels;
    const next = current.includes(channel)
      ? current.filter(c => c !== channel)
      : [...current, channel];
    handleChange('delivery_channels', next);
  };

  const getTypeIcon = () => {
    switch (formData.notification_type) {
      case 'email': return Mail;
      case 'sms': return MessageSquare;
      case 'push': return Bell;
      case 'in-app': return Smartphone;
      case 'webhook': return Webhook;
      default: return Mail;
    }
  };
  const TypeIcon = getTypeIcon();

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-10">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
          <TabsTrigger value="general">Thông tin chung</TabsTrigger>
          <TabsTrigger value="content">Nội dung</TabsTrigger>
          <TabsTrigger value="advanced">Cấu hình nâng cao</TabsTrigger>
        </TabsList>

        {/* --- GENERAL TAB --- */}
        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                Thông tin cơ bản
              </CardTitle>
              <CardDescription>Thiết lập thông tin định danh và phân loại template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tenant */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tenant <span className="text-red-500">*</span></label>
                  <select
                    value={formData.tenant_id}
                    onChange={(e) => handleChange('tenant_id', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    disabled={isEdit}
                  >
                    <option value="">-- Chọn Tenant --</option>
                    {tenants.map(t => (
                      <option key={t._id} value={t._id}>{t.name} ({t.code})</option>
                    ))}
                  </select>
                  {errors.tenant_id && <p className="text-xs text-red-500">{errors.tenant_id}</p>}
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="draft">Nháp (Draft)</option>
                    <option value="active">Hoạt động (Active)</option>
                    <option value="inactive">Ngừng hoạt động (Inactive)</option>
                    <option value="archived">Lưu trữ (Archived)</option>
                  </select>
                </div>

                {/* Code */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mã Template (Code) <span className="text-red-500">*</span></label>
                  <Input
                    value={formData.template_code}
                    onChange={(e) => handleChange('template_code', e.target.value.toUpperCase())}
                    placeholder="WELCOME_EMAIL"
                    disabled={isEdit} // Code usually immutable
                    className={errors.template_code ? "border-red-500" : ""}
                  />
                  {errors.template_code && <p className="text-xs text-red-500">{errors.template_code}</p>}
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tên Template <span className="text-red-500">*</span></label>
                  <Input
                    value={formData.template_name}
                    onChange={(e) => handleChange('template_name', e.target.value)}
                    placeholder="Email chào mừng"
                    className={errors.template_name ? "border-red-500" : ""}
                  />
                  {errors.template_name && <p className="text-xs text-red-500">{errors.template_name}</p>}
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Loại thông báo</label>
                  <div className="flex items-center gap-2 border rounded-md p-2 bg-gray-50">
                    <TypeIcon className="w-5 h-5 text-gray-500" />
                    <select
                      value={formData.notification_type}
                      onChange={(e) => handleChange('notification_type', e.target.value)}
                      className="bg-transparent border-none w-full text-sm focus:ring-0"
                    >
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                      <option value="push">Push Notification</option>
                      <option value="in-app">In-App Message</option>
                      <option value="webhook">Webhook</option>
                    </select>
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Danh mục</label>
                  <Input
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    placeholder="auth, billing, marketing..."
                  />
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Độ ưu tiên</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">Thấp (Low)</option>
                    <option value="normal">Bình thường (Normal)</option>
                    <option value="high">Cao (High)</option>
                    <option value="urgent">Khẩn cấp (Urgent)</option>
                  </select>
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ngôn ngữ mặc định</label>
                  <select
                    value={formData.language_code}
                    onChange={(e) => handleChange('language_code', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="vi">Tiếng Việt (vi)</option>
                    <option value="en">English (en)</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags (ngăn cách bằng dấu phẩy)</label>
                <Input
                  value={formData.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  placeholder="marketing, Q1_2024, promo"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="Mô tả mục đích sử dụng của template này..."
                />
              </div>

              {/* Toggles */}
              <div className="flex gap-6 pt-4 border-t">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_system_template}
                    onChange={(e) => handleChange('is_system_template', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm">System Template</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_editable}
                    onChange={(e) => handleChange('is_editable', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm">Có thể chỉnh sửa (Editable)</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- CONTENT TAB --- */}
        <TabsContent value="content" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Nội dung thông báo
              </CardTitle>
              <CardDescription>Soạn thảo nội dung và tiêu đề cho {formData.notification_type}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Subject (Email only) */}
              {formData.notification_type === 'email' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tiêu đề Email (Subject) <span className="text-red-500">*</span></label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    placeholder="Chào mừng {{name}} đến với hệ thống"
                    className={errors.subject ? "border-red-500" : ""}
                  />
                  {errors.subject && <p className="text-xs text-red-500">{errors.subject}</p>}
                </div>
              )}

              {/* Body Text */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Nội dung văn bản (Plain Text) 
                  {formData.notification_type !== 'email' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={formData.body_text}
                  onChange={(e) => handleChange('body_text', e.target.value)}
                  rows={6}
                  className={`w-full rounded-md border px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 ${
                    errors.body_text ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Nội dung thuần túy không có định dạng HTML..."
                />
                {errors.body_text && <p className="text-xs text-red-500">{errors.body_text}</p>}
              </div>

              {/* Body HTML */}
              {formData.notification_type === 'email' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nội dung HTML</label>
                  <textarea
                    value={formData.body_html}
                    onChange={(e) => handleChange('body_html', e.target.value)}
                    rows={12}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                    placeholder="<html><body><h1>Xin chào {{name}}</h1>...</body></html>"
                  />
                  <p className="text-xs text-gray-500">Hỗ trợ các biến dạng {`{{variable_name}}`}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ADVANCED TAB --- */}
        <TabsContent value="advanced" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-indigo-600" />
                Cấu hình nâng cao & Dữ liệu mẫu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Delivery Channels */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Kênh gửi (Delivery Channels)</label>
                <div className="flex gap-4">
                  {['email', 'sms', 'push', 'in-app', 'webhook'].map(ch => (
                    <label key={ch} className="flex items-center gap-2 border p-2 rounded cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.delivery_channels.includes(ch)}
                        onChange={() => toggleChannel(ch)}
                        className="rounded text-indigo-600"
                      />
                      <span className="text-sm capitalize">{ch}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Scheduling */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Lịch gửi
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={formData.send_immediately}
                      onChange={() => handleChange('send_immediately', true)}
                      className="text-indigo-600"
                    />
                    <span className="text-sm">Gửi ngay lập tức</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={!formData.send_immediately}
                      onChange={() => handleChange('send_immediately', false)}
                      className="text-indigo-600"
                    />
                    <span className="text-sm">Gửi theo lịch cố định</span>
                  </label>
                </div>
                {!formData.send_immediately && (
                  <div className="mt-2 w-40">
                     <Input 
                      type="time" 
                      step="1" // Allow seconds
                      value={formData.scheduled_send_time} 
                      onChange={(e) => handleChange('scheduled_send_time', e.target.value)}
                    />
                  </div>
                )}
              </div>

               {/* Parent Template ID */}
               <div className="space-y-2">
                  <label className="text-sm font-medium">Parent Template ID (Optional)</label>
                  <Input
                    value={formData.parent_template_id}
                    onChange={(e) => handleChange('parent_template_id', e.target.value)}
                    placeholder="UUID of parent template"
                  />
                </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Variables JSON */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Định nghĩa biến (Variables Schema)</label>
                  <textarea
                    value={jsonInput.variables}
                    onChange={(e) => handleJsonChange('variables', e.target.value)}
                    rows={6}
                    className={`w-full rounded-md border px-3 py-2 text-xs font-mono bg-gray-50 ${errors.variables ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.variables && <p className="text-xs text-red-500">{errors.variables}</p>}
                </div>

                {/* Sample Data JSON */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dữ liệu mẫu (Sample Data)</label>
                  <textarea
                    value={jsonInput.sample_data}
                    onChange={(e) => handleJsonChange('sample_data', e.target.value)}
                    rows={6}
                    className={`w-full rounded-md border px-3 py-2 text-xs font-mono bg-gray-50 ${errors.sample_data ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.sample_data && <p className="text-xs text-red-500">{errors.sample_data}</p>}
                </div>
                
                 {/* Headers JSON */}
                 <div className="space-y-2">
                  <label className="text-sm font-medium">Headers (JSON)</label>
                  <textarea
                    value={jsonInput.headers}
                    onChange={(e) => handleJsonChange('headers', e.target.value)}
                    rows={4}
                    className={`w-full rounded-md border px-3 py-2 text-xs font-mono bg-gray-50 ${errors.headers ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.headers && <p className="text-xs text-red-500">{errors.headers}</p>}
                </div>

                {/* Attachments JSON */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Attachments (JSON)</label>
                  <textarea
                    value={jsonInput.attachments}
                    onChange={(e) => handleJsonChange('attachments', e.target.value)}
                    rows={4}
                    className={`w-full rounded-md border px-3 py-2 text-xs font-mono bg-gray-50 ${errors.attachments ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.attachments && <p className="text-xs text-red-500">{errors.attachments}</p>}
                </div>

                {/* Metadata JSON */}
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-sm font-medium">Metadata (Tùy chỉnh thêm)</label>
                  <textarea
                    value={jsonInput.metadata}
                    onChange={(e) => handleJsonChange('metadata', e.target.value)}
                    rows={3}
                    className={`w-full rounded-md border px-3 py-2 text-xs font-mono bg-gray-50 ${errors.metadata ? 'border-red-500' : 'border-gray-300'}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t mt-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Hủy bỏ
        </Button>
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật Template' : 'Tạo Template Mới'}
        </Button>
      </div>
    </form>
  );
}
