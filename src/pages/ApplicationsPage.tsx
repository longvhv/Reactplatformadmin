/**
 * Applications Page
 * Manage third-party applications
 * ✅ UPDATED 2026-01-15: Unified statistics design
 * ✅ FIXED 2026-01-15: Use is_active boolean instead of status string
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApplications } from '../hooks/useApplications';
import { ApplicationsList } from '../components/applications/ApplicationsList';
import { useLanguage } from '../providers/LanguageProvider';
import { Card } from '../components/ui/card';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Server, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  CheckCircle, 
  XCircle,
  Code,
  Activity,
  MoreVertical,
  Edit,
  Settings,
  PowerOff,
  Power,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

export default function ApplicationsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { applications, loading, error, handleDelete, handleToggleActive, handleBulkAction, formatDate } = useApplications();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'OAUTH2' | 'API_KEY' | 'WEBHOOK'>('all');
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

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

    // Type filter
    if (typeFilter !== 'all' && app.type !== typeFilter) return false;

    return true;
  });

  // Stats - use is_active boolean field
  const stats = {
    total: applications.length,
    active: applications.filter(a => a.is_active).length,
    inactive: applications.filter(a => !a.is_active).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      icon={Server}
      title={t('applications.title')}
      description="Quản lý ứng dụng bên thứ ba"
      actions={
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
            onClick={() => navigate('/platform/applications/create')}
          >
            <Plus className="w-4 h-4" />
            {t('applications.addNew')}
          </Button>
        </div>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Total
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600">
              <Server className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Active
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.active}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Inactive
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.inactive}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="p-6">
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
                Loại
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="all">Tất cả</option>
                <option value="OAUTH2">OAUTH2</option>
                <option value="API_KEY">API Key</option>
                <option value="WEBHOOK">Webhook</option>
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
      </Card>

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
                            onClick={() => navigate(`/platform/applications/${app._id}`)}
                            className="text-base font-semibold text-gray-900 hover:text-indigo-600"
                          >
                            {app.name}
                          </button>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {app.code}
                            </code>
                            {app.is_active ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
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

                  {/* Actions - Fixed with DropdownMenu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 hover:bg-gray-100 rounded ml-2">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </DropdownMenuTrigger>
                    
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => navigate(`/platform/applications/${app._id}/edit`, { replace: true })}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate(`/platform/applications/${app._id}/settings`)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Cài đặt
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleActive(app._id, app.is_active)}
                      >
                        {app.is_active ? (
                          <>
                            <PowerOff className="w-4 h-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Power className="w-4 h-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(app._id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
}