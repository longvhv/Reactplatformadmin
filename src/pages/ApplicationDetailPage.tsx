/**
 * Application Detail Page
 * Full screen layout với sidebar riêng cho quản lý chi tiết ứng dụng
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Settings, 
  Shield, 
  FileText,
  Activity,
  Users,
  Boxes,
} from 'lucide-react';
import { projectId, publicAnonKey } from '@/utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { PermissionsManagementPage } from './PermissionsManagementPage';
import { TenantsOfAppPage } from './TenantsOfAppPage';
import { CapabilitiesManagementPage } from './CapabilitiesManagementPage';

interface Application {
  _id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Get active tab from URL
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path && ['overview', 'permissions', 'tenants', 'capabilities', 'settings', 'logs'].includes(path)) {
      setActiveTab(path);
    }
  }, [location.pathname]);

  // Fetch application data
  useEffect(() => {
    if (!id) return;
    
    const fetchApplication = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/applications/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch application');
        }

        const data = await response.json();
        setApplication(data);
      } catch (error) {
        console.error('Error fetching application:', error);
        toast.error('Không thể tải thông tin ứng dụng');
        navigate('/core/applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id, navigate]);

  const menuItems = [
    { key: 'overview', label: 'Tổng quan', icon: FileText },
    { key: 'permissions', label: 'Permissions', icon: Shield },
    { key: 'tenants', label: 'Tenants', icon: Users },
    { key: 'settings', label: 'Cài đặt', icon: Settings },
    { key: 'logs', label: 'Logs', icon: Activity },
    { key: 'capabilities', label: 'Capabilities', icon: Boxes },
  ];

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    navigate(`/core/applications/${id}/${tabKey}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (!application) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-white">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/core/applications')}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">{application.name}</h2>
              <Badge variant={application.is_active ? 'default' : 'secondary'}>
                {application.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="mt-1 text-sm font-mono text-gray-500">{application.code}</p>
          </div>
        </div>

        {/* Menu */}
        <nav className="p-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            
            return (
              <button
                key={item.key}
                onClick={() => handleTabChange(item.key)}
                className={`
                  flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium
                  transition-colors
                  ${isActive 
                    ? 'bg-[#6366f1] text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          {activeTab === 'overview' && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Tổng quan</h1>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mã ứng dụng</label>
                    <p className="mt-1 font-mono text-gray-900">{application.code}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tên ứng dụng</label>
                    <p className="mt-1 text-gray-900">{application.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mô tả</label>
                    <p className="mt-1 text-gray-900">{application.description || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                    <div className="mt-1">
                      <Badge variant={application.is_active ? 'default' : 'secondary'}>
                        {application.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <PermissionsManagementPage />
          )}

          {activeTab === 'tenants' && (
            <TenantsOfAppPage />
          )}

          {activeTab === 'settings' && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Cài đặt</h1>
              <p className="text-gray-600">Cài đặt cho ứng dụng {application.name}</p>
            </div>
          )}

          {activeTab === 'logs' && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Logs</h1>
              <p className="text-gray-600">Logs của ứng dụng {application.name}</p>
            </div>
          )}

          {activeTab === 'capabilities' && (
            <CapabilitiesManagementPage />
          )}
        </div>
      </main>
    </div>
  );
}

export default ApplicationDetailPage;