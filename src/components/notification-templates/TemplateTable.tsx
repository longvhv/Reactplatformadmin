/**
 * Notification Template Table Component
 * Display templates in table format with inline actions
 */

import React from 'react';
import { NotificationTemplate } from '../../api/notificationTemplateApi';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Edit, Trash2, Copy, Eye, Code } from 'lucide-react';
import { useLanguage } from '../../providers/LanguageProvider';

interface TemplateTableProps {
  templates: NotificationTemplate[];
  onEdit: (template: NotificationTemplate) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleStatus: (id: string, status: string) => void;
  onPreview?: (template: NotificationTemplate) => void;
}

const TYPE_BADGE_STYLES: Record<string, string> = {
  email: 'bg-blue-100 text-blue-700 border-blue-300',
  sms: 'bg-green-100 text-green-700 border-green-300',
  push: 'bg-purple-100 text-purple-700 border-purple-300',
  'in-app': 'bg-orange-100 text-orange-700 border-orange-300',
  webhook: 'bg-gray-100 text-gray-700 border-gray-300',
};

export function TemplateTable({
  templates,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
  onPreview,
}: TemplateTableProps) {
  const { t } = useLanguage();

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('notificationTemplates.templateName')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('notificationTemplates.type')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('notificationTemplates.category')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('notificationTemplates.status')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('notificationTemplates.usage')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('notificationTemplates.lastUsed')}
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('common.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {templates.map((template) => (
            <tr key={template._id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-gray-900">
                      {template.template_name}
                    </div>
                    {template.is_system_template && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                        System
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{template.template_code}</div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${TYPE_BADGE_STYLES[template.notification_type] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                  {template.notification_type}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm text-gray-700">{template.category || '-'}</span>
              </td>
              <td className="px-4 py-3">
                <select
                  value={template.status}
                  onChange={(e) => onToggleStatus(template._id!, e.target.value)}
                  disabled={template.is_system_template && !template.is_editable}
                  className="text-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm text-gray-900">{template.usage_count || 0}</div>
                <div className="text-xs text-gray-500">
                  {template.success_count || 0} / {(template.success_count || 0) + (template.failure_count || 0)}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {formatDate(template.last_used_at)}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  {onPreview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPreview(template)}
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDuplicate(template._id!)}
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(template)}
                    disabled={template.is_system_template && !template.is_editable}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(template._id!)}
                    disabled={template.is_system_template && !template.is_editable}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {templates.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {t('notificationTemplates.noData')}
        </div>
      )}
    </div>
  );
}