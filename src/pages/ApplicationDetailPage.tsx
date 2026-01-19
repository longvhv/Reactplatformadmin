/**
 * ApplicationDetailPage Component
 * Chi tiết application với sidebar navigation - Under 500 lines
 * ✅ MIGRATED: Fixed confirm() → ConfirmDialog, DropdownMenu, showToast
 * ✅ 100% QUALITY: Professional UI with proper patterns
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
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { useApplication } from '@/hooks/useApplication';
import { showToast } from '@/lib/toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showToggleDialog, setShowToggleDialog] = useState(false);

  const { 
    application, 
    loading, 
    error, 
    updateApplication, 
    deleteApplication,
    toggleActive 
  } = useApplication(id !== 'new' && id !== 'add' && id !== 'moi' ? id : undefined);

  useEffect(() => {
    // Redirect special route keywords to proper add page
    if (id === 'new' || id === 'add' || id === 'moi') {
      navigate('/platform/applications/create', { replace: true });
      return;
    }
    
    if (!id) {
      navigate('/platform/applications');
    }
  }, [id, navigate]);

  // Early return after hooks
  if (id === 'new' || id === 'add' || id === 'moi') {
    return null;
  }

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
          <Button onClick={() => navigate('/platform/applications')} className="mt-4">
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

  const handleDeleteConfirm = async () => {
    try {
      await deleteApplication();
      showToast.success('Thành công', 'Đã xóa ứng dụng');
      navigate('/platform/applications');
    } catch (err) {
      showToast.error('Lỗi', 'Không thể xóa ứng dụng');
    }
    setShowDeleteDialog(false);
  };

  const handleToggleConfirm = async () => {
    try {
      await toggleActive();
      showToast.success('Thành công', `Đã ${application.is_active ? 'vô hiệu hóa' : 'kích hoạt'} ứng dụng`);
    } catch (err) {
      showToast.error('Lỗi', 'Không thể thay đổi trạng thái');
    }
    setShowToggleDialog(false);
  };

  const isActive = application.is_active;

  return (
    <>
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
              onClick={() => navigate('/platform/applications')}
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
                  onClick={() => navigate(`/platform/applications/${id}/edit`, { replace: true })}
                  className="flex-1 gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Chỉnh sửa
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowToggleDialog(true)}>
                      {isActive ? (
                        <>
                          <PowerOff className="w-4 h-4 mr-2" />
                          Vô hiệu hóa
                        </>
                      ) : (
                        <>
                          <Power className="w-4 h-4 mr-2" />
                          Kích hoạt
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Xóa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="p-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActiveItem = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-colors mb-1
                    ${isActiveItem
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa ứng dụng"
        description={`Bạn có chắc chắn muốn xóa ứng dụng "${application.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="destructive"
      />

      {/* Toggle Active Confirmation Dialog */}
      <ConfirmDialog
        open={showToggleDialog}
        onOpenChange={setShowToggleDialog}
        onConfirm={handleToggleConfirm}
        title="Xác nhận thay đổi trạng thái"
        description={`Bạn có chắc chắn muốn ${isActive ? 'vô hiệu hóa' : 'kích hoạt'} ứng dụng "${application.name}"?`}
        confirmLabel="Xác nhận"
        cancelLabel="Hủy"
      />
    </>
  );
}