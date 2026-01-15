/**
 * Service Package Detail Page
 * Hiển thị chi tiết gói dịch vụ với sidebar layout tương tự Application Detail
 * Fullscreen - che header và sidebar chính
 * ✅ UPDATED 2026-01-15: Sử dụng đúng field names từ packagesApi
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  ChevronRight,
  Package,
  Settings,
  BarChart3,
  Info,
  MoreVertical,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Users,
  HardDrive,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { getServicePackageById, ServicePackage } from '../api/servicePackages';
import { subscriptionsApi } from '../api/subscriptionApi';
import { toast } from 'sonner@2.0.3';

interface PackageStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalRevenue: number;
}

export default function ServicePackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [servicePackage, setServicePackage] = useState<ServicePackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'stats'>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [packageStats, setPackageStats] = useState<PackageStats | null>(null);

  useEffect(() => {
    if (id) {
      // Skip fetching for special routes
      if (id === 'new' || id === 'add' || id === 'create') {
        toast.info('Tính năng đang được phát triển');
        navigate('/core/service-packages');
        return;
      }
      loadServicePackage();
    }
  }, [id]);

  const loadServicePackage = async () => {
    try {
      setLoading(true);
      const data = await getServicePackageById(id!);
      if (data) {
        console.log('Loaded service package:', data);
        setServicePackage(data);
      } else {
        toast.error('Không tìm thấy gói dịch vụ');
        navigate('/core/service-packages');
      }
    } catch (error: any) {
      console.error('Error loading service package:', error);
      toast.error('Không thể tải gói dịch vụ: ' + error.message);
      navigate('/core/service-packages');
    } finally {
      setLoading(false);
    }
  };

  const loadPackageStats = async () => {
    if (servicePackage) {
      try {
        const stats = await subscriptionsApi.getPackageStats(servicePackage._id);
        setPackageStats(stats);
      } catch (error: any) {
        console.error('Error loading package stats:', error);
        toast.error('Không thể tải thống kê gói dịch vụ: ' + error.message);
      }
    }
  };

  const formatPrice = (price: number, currency?: string) => {
    // Default to USD if currency is not provided or empty
    const currencyCode = currency && currency.trim() !== '' ? currency : 'USD';
    
    if (currencyCode === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(price);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(price);
  };

  const getBillingCycleLabel = (cycle?: string) => {
    if (!cycle) return 'Không xác định';
    const labels: Record<string, string> = {
      DAILY: 'Hàng ngày',
      WEEKLY: 'Hàng tuần',
      MONTHLY: 'Hàng tháng',
      QUARTERLY: 'Hàng quý',
      YEARLY: 'Hàng năm',
      LIFETIME: 'Trọn đời',
      ONE_TIME: 'Một lần',
      CUSTOM: 'Tùy chỉnh',
    };
    return labels[cycle] || cycle;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!servicePackage) {
    return null;
  }

  const menuItems = [
    { id: 'overview' as const, label: 'Tổng quan', icon: Info },
    { id: 'features' as const, label: 'Tính năng', icon: Package },
    { id: 'stats' as const, label: 'Thống kê', icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`
          bg-white border-r border-gray-200 transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? 'w-16' : 'w-72'}
        `}
      >
        {/* Back Button & Collapse Toggle */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/core/service-packages')}
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

        {/* Package Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-indigo-600" />
            </div>
            
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 truncate">
                  {servicePackage.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                    {servicePackage.code}
                  </code>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      servicePackage.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : servicePackage.status === 'INACTIVE'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {servicePackage.status === 'ACTIVE' ? 'Active' : servicePackage.status === 'INACTIVE' ? 'Inactive' : 'Archived'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Info */}
          {!isSidebarCollapsed && (
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Giá:</span>
                <span className="font-semibold text-indigo-600">
                  {formatPrice(servicePackage.price_amount, servicePackage.currency_code)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Chu kỳ:</span>
                <span className="font-medium text-gray-900">
                  {getBillingCycleLabel(servicePackage.billing_cycle)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Loại:</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    servicePackage.is_public
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {servicePackage.is_public ? 'Công khai' : 'Riêng tư'}
                </span>
              </div>
              {servicePackage.trial_days !== undefined && servicePackage.trial_days > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Dùng thử:</span>
                  <span className="font-medium text-gray-900">
                    {servicePackage.trial_days} ngày
                  </span>
                </div>
              )}
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
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id === 'stats' && !packageStats) {
                    loadPackageStats();
                  }
                }}
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

        {/* Metadata Footer */}
        {!isSidebarCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center justify-between">
                <span>Version</span>
                <span className="font-medium">{servicePackage.version}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Updated</span>
                <span className="font-medium">
                  {new Date(servicePackage.updated_at).toLocaleDateString('vi-VN')}
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
                {servicePackage.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {servicePackage.description || 'Không có mô tả'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/core/service-packages/edit/${servicePackage._id}`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Chỉnh sửa
              </Button>
              
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowActions(!showActions)}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>

                {showActions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowActions(false);
                          // Handle toggle active
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                      >
                        {servicePackage.status === 'ACTIVE' ? (
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
                        onClick={() => {
                          setShowActions(false);
                          // Handle delete
                        }}
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
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4">Thông tin cơ bản</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-gray-500">Mã gói</label>
                    <p className="font-mono text-gray-900 mt-1">{servicePackage.code}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Tên gói</label>
                    <p className="text-gray-900 mt-1">{servicePackage.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Sản phẩm SaaS</label>
                    <p className="text-gray-900 mt-1">
                      {servicePackage.product_name || servicePackage.saas_product_id}
                    </p>
                    {servicePackage.product_code && (
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                        {servicePackage.product_code}
                      </code>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Giá</label>
                    <p className="text-xl font-bold text-indigo-600 mt-1">
                      {formatPrice(servicePackage.price_amount, servicePackage.currency_code)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Chu kỳ thanh toán</label>
                    <p className="text-gray-900 mt-1">
                      {getBillingCycleLabel(servicePackage.billing_cycle)}
                    </p>
                  </div>
                  {servicePackage.trial_days !== undefined && servicePackage.trial_days > 0 && (
                    <div>
                      <label className="text-sm text-gray-500">Thời gian dùng thử</label>
                      <p className="text-gray-900 mt-1">
                        {servicePackage.trial_days} ngày miễn phí
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm text-gray-500">Loại gói</label>
                    <p className="mt-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          servicePackage.is_public
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {servicePackage.is_public ? 'Công khai' : 'Riêng tư'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Trạng thái</label>
                    <p className="mt-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          servicePackage.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : servicePackage.status === 'INACTIVE'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {servicePackage.status === 'ACTIVE' ? 'Hoạt động' : servicePackage.status === 'INACTIVE' ? 'Không hoạt động' : 'Đã lưu trữ'}
                      </span>
                    </p>
                  </div>
                  {servicePackage.description && (
                    <div className="col-span-2">
                      <label className="text-sm text-gray-500">Mô tả</label>
                      <p className="text-gray-900 mt-1">{servicePackage.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Resource Limits */}
              {(servicePackage.max_users !== null || servicePackage.max_storage !== null) && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-lg font-semibold mb-4">Giới hạn tài nguyên</h2>
                  <div className="grid grid-cols-2 gap-6">
                    {servicePackage.max_users !== null && (
                      <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                        <Users className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="text-sm text-blue-600">Số người dùng tối đa</p>
                          <p className="text-2xl font-bold text-blue-900 mt-1">
                            {servicePackage.max_users === -1 ? 'Không giới hạn' : servicePackage.max_users.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                    {servicePackage.max_storage !== null && (
                      <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
                        <HardDrive className="w-8 h-8 text-purple-600" />
                        <div>
                          <p className="text-sm text-purple-600">Dung lượng tối đa</p>
                          <p className="text-2xl font-bold text-purple-900 mt-1">
                            {servicePackage.max_storage === -1 ? 'Không giới hạn' : `${(servicePackage.max_storage / 1024).toFixed(2)} GB`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-6">
              {/* Entitlements Config */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4">Cấu hình quyền lợi (Entitlements)</h2>
                {servicePackage.entitlements_config && Object.keys(servicePackage.entitlements_config).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(servicePackage.entitlements_config).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{key}</p>
                          <p className="text-sm text-gray-500 font-mono">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </p>
                        </div>
                        {typeof value === 'boolean' && (
                          value ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-400" />
                          )
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Chưa có cấu hình quyền lợi</p>
                )}
              </div>

              {/* Features Config */}
              {servicePackage.features && Object.keys(servicePackage.features).length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-lg font-semibold mb-4">Tính năng bổ sung</h2>
                  <div className="space-y-3">
                    {Object.entries(servicePackage.features).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{key}</p>
                          <p className="text-sm text-gray-500 font-mono">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {servicePackage.metadata && Object.keys(servicePackage.metadata).length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-lg font-semibold mb-4">Metadata</h2>
                  <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                    {JSON.stringify(servicePackage.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Thống kê</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <p className="text-sm text-indigo-600">Số lần đăng ký</p>
                  <p className="text-2xl font-bold text-indigo-900 mt-2">
                    {packageStats ? packageStats.totalSubscriptions : 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Chưa có dữ liệu</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">Doanh thu ước tính</p>
                  <p className="text-2xl font-bold text-green-900 mt-2">
                    {formatPrice(packageStats ? packageStats.totalRevenue : 0, servicePackage.currency_code)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Chưa có dữ liệu</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600">Đăng ký hoạt động</p>
                  <p className="text-2xl font-bold text-purple-900 mt-2">
                    {packageStats ? packageStats.activeSubscriptions : 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Chưa có dữ liệu</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center mt-6">
                Thống kê chi tiết sẽ được cập nhật khi có subscription data
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}