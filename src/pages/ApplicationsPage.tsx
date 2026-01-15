/**
 * ApplicationsPage Component
 * Main applications management page - Under 500 lines
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter,
  Download,
  Upload,
  MoreVertical,
  Edit,
  Trash2,
  Code,
  Power,
  PowerOff,
  Settings,
  Activity,
  Target
} from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApplications } from '@/hooks/useApplications';

export function ApplicationsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Hooks
  const { applications, loading, error, deleteApplication, updateApplication } = useApplications({ autoLoad: true });

  // Apply filters
  const filteredApplications = applications.filter(app => {
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches = 
        app.code.toLowerCase().includes(query) ||
        app.name.toLowerCase().includes(query) ||
        app.description?.toLowerCase().includes(query);
      if (!matches) return false;
    }

    // Active filter - map to status field
    if (activeFilter === 'active' && app.status !== 'ACTIVE') return false;
    if (activeFilter === 'inactive' && app.status === 'ACTIVE') return false;

    return true;
  });

  // Stats - use status field
  const stats = {
    total: applications.length,
    active: applications.filter(a => a.status === 'ACTIVE').length,
    inactive: applications.filter(a => a.status !== 'ACTIVE').length,
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('applications.confirmDelete'))) return;
    try {
      await deleteApplication(id);
    } catch (err) {
      alert('Failed to delete application');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await updateApplication(id, { status: newStatus });
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedApps.length === 0) {
      alert('Please select applications first');
      return;
    }
    
    if (!confirm(`${action} ${selectedApps.length} applications?`)) return;
    
    // Implementation for bulk actions
    console.log(`Bulk ${action}:`, selectedApps);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/90 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-foreground">
                {t('applications.title')}
              </span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Quản lý ứng dụng trong hệ thống
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {/* Export */}}
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {/* Import */}}
            >
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => navigate('/core/applications/new')}
            >
              <Plus className="w-4 h-4" />
              {t('applications.addNew')}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-gray-500">Tổng số</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-gray-500">Đang hoạt động</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{stats.active}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-gray-500">Không hoạt động</p>
            <p className="text-2xl font-bold text-gray-600 mt-2">{stats.inactive}</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Tìm theo mã, tên, mô tả..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="all">Tất cả</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
              </div>
            </div>
          )}

          {/* Bulk actions */}
          {selectedApps.length > 0 && (
            <div className="flex items-center gap-2 pt-4 border-t mt-4">
              <span className="text-sm text-gray-600">
                {selectedApps.length} đã chọn
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('delete')}
              >
                Delete
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('activate')}
              >
                Activate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('deactivate')}
              >
                Deactivate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedApps([])}
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Applications Grid */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Code className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Không tìm thấy ứng dụng</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApplications.map((app) => (
              <div key={app._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedApps.includes(app._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedApps([...selectedApps, app._id]);
                          } else {
                            setSelectedApps(selectedApps.filter(id => id !== app._id));
                          }
                        }}
                        className="mt-1 rounded border-gray-300"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Code className="w-5 h-5 text-indigo-600" />
                          </div>
                          
                          <div className="flex-1">
                            <button
                              onClick={() => navigate(`/core/applications/${app._id}`)}
                              className="text-base font-semibold text-gray-900 hover:text-indigo-600"
                            >
                              {app.name}
                            </button>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {app.code}
                              </code>
                              {app.status === 'ACTIVE' ? (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Active
                                </span>
                              ) : app.status === 'DEPRECATED' ? (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  Deprecated
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Inactive
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {app.description && (
                          <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                            {app.description}
                          </p>
                        )}

                        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            v{app.version}
                          </span>
                          <span>
                            {formatDate(app.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="relative group">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                      
                      <div className="hidden group-hover:block absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-10">
                        <div className="py-1">
                          <button
                            onClick={() => navigate(`/core/applications/${app._id}/edit`)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Chỉnh sửa
                          </button>
                          <button
                            onClick={() => navigate(`/core/applications/${app._id}/settings`)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Settings className="w-4 h-4" />
                            Cài đặt
                          </button>
                          <button
                            onClick={() => handleToggleActive(app._id, app.status)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                          >
                            {app.status === 'ACTIVE' ? (
                              <>
                                <PowerOff className="w-4 h-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="w-4 h-4" />
                                Activate
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(app._id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ApplicationsPage;