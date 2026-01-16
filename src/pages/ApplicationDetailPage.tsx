/**
 * ApplicationDetailPage Component
 * Chi tiết application với sidebar navigation - Under 500 lines
 * ✅ UPDATED 2026-01-15: Now uses real Supabase data via applicationsApi
 * ✅ UPDATED 2026-01-15: Refactored to use flexbox layout (removed fixed positioning)
 * ✅ FIXED 2026-01-15: Use is_active boolean instead of status string
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  ArrowLeft, 
  Code, 
  Settings,
  BarChart,
  Layers,
  MoreVertical,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Activity,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { useApplication } from '@/hooks/useApplication';
import { ApplicationOverview } from '@/components/applications/detail/ApplicationOverview';
import { ApplicationCapabilities } from '@/components/applications/detail/ApplicationCapabilities';
import { ApplicationSettings } from '@/components/applications/detail/ApplicationSettings';
import { ApplicationStats } from '@/components/applications/detail/ApplicationStats';

type TabType = 'overview' | 'capabilities' | 'settings' | 'stats';

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showActions, setShowActions] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const { 
    application, 
    loading, 
    error, 
    updateApplication, 
    deleteApplication,
    toggleActive 
  } = useApplication(id);

  useEffect(() => {
    if (!id) {
      navigate('/core/applications');
    }
  }, [id, navigate]);

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

  if (error || !application) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error || t('applications.notFound')}</p>
          <Button onClick={() => navigate('/core/applications')} className="mt-4">
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'overview', label: 'Tổng quan', icon: Code },
    { id: 'capabilities', label: 'Khả năng', icon: Layers },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
    { id: 'stats', label: 'Thống kê', icon: BarChart },
  ];

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa ứng dụng này?')) return;
    try {
      await deleteApplication();
      navigate('/core/applications');
    } catch (err) {
      // Error already handled in hook
    }
  };

  const handleToggleActive = async () => {
    const isActive = application.is_active;
    if (!confirm(`Bạn có chắc muốn ${isActive ? 'vô hiệu hóa' : 'kích hoạt'} ứng dụng này?`)) return;
    try {
      await toggleActive();
      setShowActions(false);
    } catch (err) {
      // Error already handled in hook
    }
  };

  const isActive = application.is_active;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`
          bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? 'w-16' : 'w-64'}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/core/applications')}
            className={`gap-2 ${isSidebarCollapsed ? 'px-2' : ''}`}
          >
            <ArrowLeft className="w-4 h-4" />
            {!isSidebarCollapsed && <span>Quay lại</span>}
          </Button>
          
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${isSidebarCollapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>

        {/* App Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Code className="w-6 h-6 text-indigo-600" />
            </div>
            
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 truncate">
                  {application.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                    {application.code}
                  </code>
                  {isActive ? (
                    <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {!isSidebarCollapsed && (
            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/core/applications/${id}/edit`, { replace: true })}
                className="flex-1 gap-2"
              >
                <Edit className="w-4 h-4" />
                Chỉnh sửa
              </Button>
              
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowActions(!showActions)}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>

                {showActions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
                    <div className="py-1">
                      <button
                        onClick={handleToggleActive}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                      >
                        {isActive ? (
                          <>
                            <PowerOff className="w-4 h-4" />
                            Vô hiệu hóa
                          </>
                        ) : (
                          <>
                            <Power className="w-4 h-4" />
                            Kích hoạt
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="p-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors mb-1
                  ${isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Version Info */}
        {!isSidebarCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center justify-between">
                <span>Version</span>
                <span className="font-medium">{application.version}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span className={`font-medium ${isActive ? 'text-green-600' : 'text-gray-600'}`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {menuItems.find(item => item.id === activeTab)?.label}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Chi tiết và quản lý {application.name}
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          {activeTab === 'overview' && (
            <ApplicationOverview application={application} onUpdate={updateApplication} />
          )}
          {activeTab === 'capabilities' && (
            <ApplicationCapabilities appId={application._id} />
          )}
          {activeTab === 'settings' && (
            <ApplicationSettings application={application} onUpdate={updateApplication} />
          )}
          {activeTab === 'stats' && (
            <ApplicationStats appId={application._id} appCode={application.code} />
          )}
        </div>
      </main>
    </div>
  );
}