/**
 * Notification Templates Page
 * Main page for managing notification templates with CRUD operations
 */

import React, { useState, useEffect } from 'react';
import { notificationTemplateApi, NotificationTemplate } from '../api/notificationTemplateApi';
import { TemplateTable } from '../components/notification-templates/TemplateTable';
import { TemplateForm } from '../components/notification-templates/TemplateForm';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Search, Mail } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from '../providers/LanguageProvider';

export function NotificationTemplatesPage() {
  const { t } = useLanguage();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    tenant_id: '00000000-0000-0000-0000-000000000001',
  });
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadTemplates();
    loadStats();
  }, [filters]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await notificationTemplateApi.getAll(filters);
      setTemplates(data);
    } catch (error: any) {
      toast.error(t('notificationTemplates.loadError', { error: error.message }));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await notificationTemplateApi.getStatistics(filters.tenant_id);
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
    setEditingTemplate(undefined);
    setShowForm(true);
  };

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleSubmit = async (data: Partial<NotificationTemplate>) => {
    try {
      setLoading(true);
      if (editingTemplate?._id) {
        await notificationTemplateApi.update(editingTemplate._id, data);
        toast.success(t('notificationTemplates.updateSuccess'));
      } else {
        await notificationTemplateApi.create(data as Omit<NotificationTemplate, '_id'>);
        toast.success(t('notificationTemplates.createSuccess'));
      }
      setShowForm(false);
      setEditingTemplate(undefined);
      loadTemplates();
      loadStats();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('notificationTemplates.deleteConfirm'))) return;
    
    try {
      await notificationTemplateApi.delete(id);
      toast.success(t('notificationTemplates.deleteSuccess'));
      loadTemplates();
      loadStats();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleStatus = async (id: string, status: string) => {
    try {
      await notificationTemplateApi.updateStatus(id, status as any);
      toast.success(t('notificationTemplates.statusUpdated'));
      loadTemplates();
      loadStats();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await notificationTemplateApi.duplicate(id);
      toast.success(t('notificationTemplates.duplicateSuccess'));
      loadTemplates();
      loadStats();
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
            {t('notificationTemplates.title')}
          </h1>
          <p className="text-gray-600">{t('notificationTemplates.description')}</p>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">{t('notificationTemplates.total')}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-600">{t('notificationTemplates.active')}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
              <div className="text-sm text-gray-600">{t('notificationTemplates.draft')}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <div className="text-2xl font-bold text-blue-600">{stats.by_type.email}</div>
              </div>
              <div className="text-sm text-gray-600">Email</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <div className="text-2xl font-bold text-green-600">{stats.by_type.sms}</div>
              </div>
              <div className="text-sm text-gray-600">SMS</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-600" />
                <div className="text-2xl font-bold text-purple-600">{stats.by_type.push}</div>
              </div>
              <div className="text-sm text-gray-600">Push</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-indigo-200">
              <div className="text-2xl font-bold text-indigo-600">{stats.total_usage.toLocaleString()}</div>
              <div className="text-sm text-gray-600">{t('notificationTemplates.totalUsage')}</div>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 flex gap-2">
              <Input
                placeholder={t('notificationTemplates.search')}
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
              <option value="all">{t('notificationTemplates.allStatuses')}</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={filters.notification_type || 'all'}
              onChange={(e) => handleFilterChange('notification_type', e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">{t('notificationTemplates.allTypes')}</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="push">Push</option>
              <option value="in-app">In-App</option>
              <option value="webhook">Webhook</option>
            </select>

            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              {t('notificationTemplates.add')}
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
            <TemplateTable
              templates={templates}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onToggleStatus={handleToggleStatus}
            />
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <TemplateForm
          template={editingTemplate}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingTemplate(undefined);
          }}
          loading={loading}
        />
      )}
    </div>
  );
}