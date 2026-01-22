/**
 * Announcement Table Component
 * Display announcements in table format with inline actions
 * 
 * ✅ UPDATED 2026-01-20: Fixed Badge usage (variant instead of type)
 */

import React from 'react';
import { SystemAnnouncement, getTypeLabel, getPriorityLabel } from '../../api/systemAnnouncementsApi';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Edit, Trash2, Pin, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../../providers/LanguageProvider';

interface AnnouncementTableProps {
  announcements: SystemAnnouncement[];
  onEdit: (announcement: SystemAnnouncement) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, status: string) => void;
  onTogglePublish: (id: string, isPublished: boolean) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
}

export function AnnouncementTable({
  announcements,
  onEdit,
  onDelete,
  onToggleStatus,
  onTogglePublish,
  onTogglePin,
}: AnnouncementTableProps) {
  const { t } = useLanguage();

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeVariant = (type: string) => {
    switch (type) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary'; // or outline
      case 'info': return 'default';
      case 'success': return 'outline'; // Success isn't a default variant, fallback
      default: return 'secondary';
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('announcements.title') || 'Title'}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('announcements.type') || 'Type'}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('announcements.priority') || 'Priority'}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('announcements.status') || 'Status'}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('announcements.published') || 'Published'}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('announcements.dates') || 'Schedule'}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('announcements.views') || 'Views'}
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('common.actions') || 'Actions'}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {announcements.map((announcement) => (
            <tr key={announcement._id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {announcement.is_pinned && (
                    <Pin className="w-4 h-4 text-indigo-600 fill-indigo-600 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]" title={announcement.title}>
                      {announcement.title}
                    </div>
                    {announcement.category && (
                      <div className="text-xs text-gray-500">{announcement.category}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge variant={getTypeVariant(announcement.type)}>
                  {getTypeLabel(announcement.type)}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Badge variant="outline">
                  {getPriorityLabel(announcement.priority)}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <select
                  value={announcement.status}
                  onChange={(e) => onToggleStatus(announcement._id, e.target.value)}
                  className="text-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-1"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="archived">Archived</option>
                </select>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onTogglePublish(announcement._id, !announcement.is_published)}
                  className="inline-flex items-center gap-1 text-sm focus:outline-none"
                >
                  {announcement.is_published ? (
                    <>
                      <Eye className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 font-medium text-xs">Yes</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500 text-xs">No</span>
                    </>
                  )}
                </button>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                <div className="text-xs">S: {formatDate(announcement.start_date)}</div>
                <div className="text-xs">E: {formatDate(announcement.end_date)}</div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {announcement.view_count || 0}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onTogglePin(announcement._id, !announcement.is_pinned)}
                    title={announcement.is_pinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin className={`w-4 h-4 ${announcement.is_pinned ? 'fill-indigo-600 text-indigo-600' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onEdit(announcement)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onDelete(announcement._id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {announcements.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {t('announcements.noData') || 'No announcements found'}
        </div>
      )}
    </div>
  );
}
