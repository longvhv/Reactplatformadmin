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
  onDuplicate: (template: NotificationTemplate) => void;
  onToggleStatus: (template: NotificationTemplate) => void;
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
              Template Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Channel
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Subject
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Updated
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {templates.map((template) => (
            <tr key={template._id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {template.name}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">{template.code}</div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  template.channel === 'EMAIL' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                  template.channel === 'SMS' ? 'bg-green-100 text-green-700 border-green-300' :
                  template.channel === 'PUSH' ? 'bg-purple-100 text-purple-700 border-purple-300' :
                  'bg-orange-100 text-orange-700 border-orange-300'
                }`}>
                  {template.channel}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm text-gray-700">{template.subject || '-'}</span>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onToggleStatus(template)}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    template.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {template.is_active ? 'Active' : 'Inactive'}
                </button>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {formatDate(template.updated_at)}
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
                    onClick={() => onDuplicate(template)}
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(template)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(template._id)}
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
          No templates found
        </div>
      )}
    </div>
  );
}