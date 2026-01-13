/**
 * System Announcements Page
 * Main page for managing system announcements with CRUD operations
 */

import React, { useState, useEffect } from 'react';
import { systemAnnouncementApi, SystemAnnouncement } from '../api/systemAnnouncementApi';
import { AnnouncementTable } from '../components/announcements/AnnouncementTable';
import { AnnouncementForm } from '../components/announcements/AnnouncementForm';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Search, Filter, Megaphone } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from '../providers/LanguageProvider';

export function SystemAnnouncementsPage() {
  const { t } = useLanguage();
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<SystemAnnouncement | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<AnnouncementFilters>({
    tenant_id: '00000000-0000-0000-0000-000000000001',
  });
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadAnnouncements();
    loadStats();
  }, [filters]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await systemAnnouncementApi.getAll(filters);
      setAnnouncements(data);
    } catch (error: any) {
      toast.error(t('announcements.loadError', { error: error.message }));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await systemAnnouncementApi.getStatistics(filters.tenant_id);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setFilters({ ...filters, search: searchTerm });
    } else {
      const { search, ...rest } = filters;
      setFilters(rest);
    }
  };

  const handleAdd = () => {
    setEditingAnnouncement(undefined);
    setShowForm(true);
  };

  const handleEdit = (announcement: SystemAnnouncement) => {
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };

  const handleSubmit = async (data: Partial<SystemAnnouncement>) => {
    try {
      setLoading(true);
      if (editingAnnouncement?._id) {
        await systemAnnouncementApi.update(editingAnnouncement._id, data);
        toast.success(t('announcements.updateSuccess'));
      } else {
        await systemAnnouncementApi.create(data as Omit<SystemAnnouncement, '_id'>);
        toast.success(t('announcements.createSuccess'));
      }
      setShowForm(false);
      setEditingAnnouncement(undefined);
      loadAnnouncements();
      loadStats();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('announcements.deleteConfirm'))) return;
    
    try {
      await systemAnnouncementApi.delete(id);
      toast.success(t('announcements.deleteSuccess'));
      loadAnnouncements();
      loadStats();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleStatus = async (id: string, status: string) => {
    try {
      await systemAnnouncementApi.updateStatus(id, status as any);
      toast.success(t('announcements.statusUpdated'));
      loadAnnouncements();
      loadStats();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleTogglePublish = async (id: string, isPublished: boolean) => {
    try {
      await systemAnnouncementApi.togglePublish(id, isPublished);
      toast.success(isPublished ? t('announcements.published') : t('announcements.unpublished'));
      loadAnnouncements();
      loadStats();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleTogglePin = async (id: string, isPinned: boolean) => {
    try {
      await systemAnnouncementApi.togglePin(id, isPinned);
      toast.success(isPinned ? t('announcements.pinned') : t('announcements.unpinned'));
      loadAnnouncements();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    if (value === 'all') {
      const { [field]: removed, ...rest } = filters;
      setFilters(rest);
    } else {
      setFilters({ ...filters, [field]: value });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('announcements.title')}
          </h1>
          <p className="text-gray-600">{t('announcements.description')}</p>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">{t('announcements.total')}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-600">{t('announcements.active')}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
              <div className="text-sm text-gray-600">{t('announcements.draft')}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{stats.published}</div>
              <div className="text-sm text-gray-600">{t('announcements.published')}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
              <div className="text-sm text-gray-600">{t('announcements.expired')}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-indigo-200">
              <div className="text-2xl font-bold text-indigo-600">{stats.total_views}</div>
              <div className="text-sm text-gray-600">{t('announcements.totalViews')}</div>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 flex gap-2">
              <Input
                placeholder={t('announcements.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} variant="outline">
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {/* Filter Dropdowns */}
            <select
              value={filters.status || 'all'}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">{t('announcements.allStatuses')}</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={filters.type || 'all'}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">{t('announcements.allTypes')}</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="success">Success</option>
              <option value="maintenance">Maintenance</option>
            </select>

            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              {t('announcements.add')}
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">{t('common.loading')}</div>
            </div>
          ) : (
            <AnnouncementTable
              announcements={announcements}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              onTogglePublish={handleTogglePublish}
              onTogglePin={handleTogglePin}
            />
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <AnnouncementForm
          announcement={editingAnnouncement}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingAnnouncement(undefined);
          }}
          loading={loading}
        />
      )}
    </div>
  );
}