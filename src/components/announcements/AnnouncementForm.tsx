/**
 * Announcement Form Component
 * Form for creating and editing announcements
 */

import React, { useState } from 'react';
import { SystemAnnouncement } from '../../api/systemAnnouncementApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useLanguage } from '../../providers/LanguageProvider';
import { X } from 'lucide-react';

interface AnnouncementFormProps {
  announcement?: SystemAnnouncement;
  onSubmit: (data: Partial<SystemAnnouncement>) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function AnnouncementForm({ announcement, onSubmit, onCancel, loading }: AnnouncementFormProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<Partial<SystemAnnouncement>>({
    tenant_id: '00000000-0000-0000-0000-000000000001',
    title: '',
    content: '',
    type: 'info',
    priority: 'normal',
    status: 'draft',
    category: '',
    is_published: false,
    is_pinned: false,
    start_date: '',
    end_date: '',
    link_url: '',
    link_text: '',
    ...announcement,
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {announcement ? t('announcements.edit') : t('announcements.add')}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('announcements.title')} *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
              placeholder={t('announcements.titlePlaceholder')}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('announcements.content')} *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              required
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder={t('announcements.contentPlaceholder')}
            />
          </div>

          {/* Type, Priority, Status */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('announcements.type')}
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="success">Success</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('announcements.priority')}
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('announcements.status')}
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('announcements.category')}
            </label>
            <Input
              value={formData.category || ''}
              onChange={(e) => handleChange('category', e.target.value)}
              placeholder="system, maintenance, feature, etc."
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('announcements.startDate')}
              </label>
              <Input
                type="datetime-local"
                value={formData.start_date ? formData.start_date.slice(0, 16) : ''}
                onChange={(e) => handleChange('start_date', e.target.value ? new Date(e.target.value).toISOString() : '')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('announcements.endDate')}
              </label>
              <Input
                type="datetime-local"
                value={formData.end_date ? formData.end_date.slice(0, 16) : ''}
                onChange={(e) => handleChange('end_date', e.target.value ? new Date(e.target.value).toISOString() : '')}
              />
            </div>
          </div>

          {/* Link */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('announcements.linkUrl')}
              </label>
              <Input
                value={formData.link_url || ''}
                onChange={(e) => handleChange('link_url', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('announcements.linkText')}
              </label>
              <Input
                value={formData.link_text || ''}
                onChange={(e) => handleChange('link_text', e.target.value)}
                placeholder="Learn More"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => handleChange('is_published', e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">{t('announcements.published')}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_pinned}
                onChange={(e) => handleChange('is_pinned', e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">{t('announcements.pinned')}</span>
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