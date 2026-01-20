/**
 * Notification Template Form Component
 * Form for creating and editing notification templates
 */

import React, { useState } from 'react';
import { NotificationTemplate } from '../../api/notificationTemplateApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useLanguage } from '../../providers/LanguageProvider';
import { X } from 'lucide-react';

interface TemplateFormProps {
  template?: NotificationTemplate;
  onSubmit: (data: Partial<NotificationTemplate>) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function TemplateForm({ template, onSubmit, onCancel, loading }: TemplateFormProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<Partial<NotificationTemplate>>({
    tenant_id: '00000000-0000-0000-0000-000000000001',
    template_code: '',
    template_name: '',
    description: '',
    subject: '',
    body_text: '',
    body_html: '',
    notification_type: 'email',
    category: '',
    priority: 'normal',
    language_code: 'vi',
    status: 'draft',
    delivery_channels: ['email'],
    send_immediately: true,
    is_system_template: false,
    is_editable: true,
    tags: [],
    ...template,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {template ? t('notificationTemplates.edit') : t('notificationTemplates.add')}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('notificationTemplates.templateCode')} *
              </label>
              <Input
                value={formData.template_code}
                onChange={(e) => handleChange('template_code', e.target.value.toUpperCase())}
                required
                placeholder="WELCOME_EMAIL"
                disabled={!!template}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('notificationTemplates.templateName')} *
              </label>
              <Input
                value={formData.template_name}
                onChange={(e) => handleChange('template_name', e.target.value)}
                required
                placeholder="Email chào mừng người dùng mới"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('notificationTemplates.description')}
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Mô tả mục đích sử dụng template"
            />
          </div>

          {/* Type, Category, Status */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('notificationTemplates.type')}
              </label>
              <select
                value={formData.notification_type}
                onChange={(e) => handleChange('notification_type', e.target.value as NotificationType)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="push">Push</option>
                <option value="in-app">In-App</option>
                <option value="webhook">Webhook</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('notificationTemplates.category')}
              </label>
              <Input
                value={formData.category || ''}
                onChange={(e) => handleChange('category', e.target.value)}
                placeholder="system, marketing..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('notificationTemplates.priority')}
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('notificationTemplates.status')}
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value as TemplateStatus)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="draft">{t('common.draft')}</option>
                <option value="active">{t('common.active')}</option>
                <option value="inactive">{t('common.inactive')}</option>
                <option value="archived">{t('common.archived')}</option>
              </select>
            </div>
          </div>

          {/* Subject (for email) */}
          {formData.notification_type === 'email' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('notificationTemplates.subject')}
              </label>
              <Input
                value={formData.subject || ''}
                onChange={(e) => handleChange('subject', e.target.value)}
                placeholder="Chào mừng {{userName}} đến với {{appName}}!"
              />
            </div>
          )}

          {/* Body Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('notificationTemplates.bodyText')} *
            </label>
            <textarea
              value={formData.body_text || ''}
              onChange={(e) => handleChange('body_text', e.target.value)}
              required
              rows={6}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono"
              placeholder="Xin chào {{userName}},&#10;&#10;Cảm ơn bạn đã đăng ký..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Sử dụng {`{{variableName}}`} để chèn biến động
            </p>
          </div>

          {/* Body HTML (for email) */}
          {formData.notification_type === 'email' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('notificationTemplates.bodyHtml')}
              </label>
              <textarea
                value={formData.body_html || ''}
                onChange={(e) => handleChange('body_html', e.target.value)}
                rows={8}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono"
                placeholder="<div>&#10;  <h2>Xin chào {{userName}}!</h2>&#10;  <p>...</p>&#10;</div>"
              />
            </div>
          )}

          {/* Settings */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.send_immediately}
                onChange={(e) => handleChange('send_immediately', e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">{t('notificationTemplates.sendImmediately')}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_system_template}
                onChange={(e) => handleChange('is_system_template', e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">{t('notificationTemplates.systemTemplate')}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_editable}
                onChange={(e) => handleChange('is_editable', e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">{t('notificationTemplates.editable')}</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}