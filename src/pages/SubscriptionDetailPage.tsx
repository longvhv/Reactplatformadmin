/**
 * Subscription Detail Page
 * Hiển thị chi tiết đăng ký dịch vụ với sidebar layout
 * Fullscreen - che header và sidebar chính
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
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Shield,
  Code2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { subscriptionApi, TenantSubscription } from '../api/subscriptionApi';
import { toast } from 'sonner@2.0.3';

export default function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'entitlements' | 'apps' | 'stats'>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    if (id) {
      loadSubscription();
    }
  }, [id]);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const data = await subscriptionApi.getById(id!);
      if (data) {
        setSubscription(data);
      } else {
        toast.error('Không tìm thấy đăng ký dịch vụ');
        navigate('/core/tenant-subscriptions');
      }
    } catch (error: any) {
      console.error('Error loading subscription:', error);
      toast.error('Không thể tải đăng ký dịch vụ: ' + error.message);
      navigate('/core/tenant-subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    // Handle missing or invalid currency code
    const validCurrency = currency || 'USD';
    
    if (validCurrency === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: validCurrency,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      ACTIVE: 'bg-green-100 text-green-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      PAST_DUE: 'bg-orange-100 text-orange-800',
    };
    return badges[status as keyof typeof badges] || badges.ACTIVE;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      ACTIVE: 'Đang hoạt động',
      EXPIRED: 'Đã hết hạn',
      CANCELLED: 'Đã hủy',
      PAST_DUE: 'Quá hạn thanh toán',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      ACTIVE: <CheckCircle2 className="w-4 h-4" />,
      EXPIRED: <XCircle className="w-4 h-4" />,
      CANCELLED: <XCircle className="w-4 h-4" />,
      PAST_DUE: <AlertTriangle className="w-4 h-4" />,
    };
    return icons[status as keyof typeof icons] || null;
  };

  const getDaysRemaining = (endAt?: string) => {
    if (!endAt) return null;
    const end = new Date(endAt);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!subscription) {
    return null;
  }

  const menuItems = [
    { id: 'overview' as const, label: 'Tổng quan', icon: Info },
    { id: 'entitlements' as const, label: 'Quyền lợi', icon: Shield },
    { id: 'apps' as const, label: 'Ứng dụng', icon: Code2 },
    { id: 'stats' as const, label: 'Thống kê', icon: BarChart3 },
  ];

  const daysRemaining = getDaysRemaining(subscription.end_at);

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
            onClick={() => navigate('/core/tenant-subscriptions')}
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

        {/* Subscription Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-indigo-600" />
            </div>
            
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 truncate">
                  {subscription.tenant_name || subscription.tenant_id}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {subscription.package_name || 'N/A'}
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
                  {formatPrice(subscription.price_amount, subscription.currency_code)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Trạng thái:</span>
                <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getStatusBadge(subscription.status)}`}>
                  {getStatusIcon(subscription.status)}
                  {getStatusLabel(subscription.status)}
                </span>
              </div>
              {subscription.end_at && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Hết hạn:</span>
                  <span className={`font-medium ${daysRemaining && daysRemaining <= 7 ? 'text-red-600' : 'text-gray-900'}`}>
                    {daysRemaining !== null && daysRemaining > 0 ? `${daysRemaining} ngày` : 'Đã hết hạn'}
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
                onClick={() => setActiveTab(item.id)}
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
        {!isSidebarCollapsed && subscription.created_at && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center justify-between">
                <span>Tạo lúc</span>
                <span className="font-medium">
                  {new Date(subscription.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
              {subscription.updated_at && (
                <div className="flex items-center justify-between">
                  <span>Cập nhật</span>
                  <span className="font-medium">
                    {new Date(subscription.updated_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              )}
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
                {subscription.package_name || 'Đăng ký dịch vụ'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Tenant: {subscription.tenant_name || subscription.tenant_id}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/core/tenant-subscriptions/edit/${subscription._id}`)}
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
                        {subscription.status === 'ACTIVE' ? (
                          <>
                            <PowerOff className="w-4 h-4" />
                            Hủy đăng ký
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
              {/* Status Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Status Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      subscription.status === 'ACTIVE' ? 'bg-green-100' :
                      subscription.status === 'EXPIRED' ? 'bg-gray-100' :
                      subscription.status === 'CANCELLED' ? 'bg-red-100' :
                      'bg-orange-100'
                    }`}>
                      {getStatusIcon(subscription.status)}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Trạng thái</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {getStatusLabel(subscription.status)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Price Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-100">
                      <DollarSign className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Giá gói</p>
                      <p className="text-sm font-semibold text-indigo-600 mt-0.5">
                        {formatPrice(subscription.price_amount, subscription.currency_code)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Days Remaining Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${daysRemaining && daysRemaining <= 7 ? 'bg-red-100' : 'bg-blue-100'}`}>
                      <Clock className={`w-4 h-4 ${daysRemaining && daysRemaining <= 7 ? 'text-red-600' : 'text-blue-600'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Thời gian còn lại</p>
                      <p className={`text-sm font-semibold mt-0.5 ${daysRemaining && daysRemaining <= 7 ? 'text-red-600' : 'text-gray-900'}`}>
                        {daysRemaining !== null && daysRemaining > 0 ? `${daysRemaining} ngày` : 
                         daysRemaining !== null && daysRemaining < 0 ? `Quá hạn ${Math.abs(daysRemaining)} ngày` :
                         'Đã hết hạn'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Usage Duration Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Calendar className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Đã sử dụng</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {Math.ceil((new Date().getTime() - new Date(subscription.start_at).getTime()) / (1000 * 60 * 60 * 24))} ngày
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-indigo-600" />
                    Thông tin cơ bản
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-start justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Subscription ID</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-900">
                        {subscription._id}
                      </code>
                    </div>
                    
                    <div className="flex items-start justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Tenant ID</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-900">
                        {subscription.tenant_id}
                      </code>
                    </div>
                    
                    <div className="flex items-start justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Tên Tenant</span>
                      <span className="text-sm font-medium text-gray-900">
                        {subscription.tenant_name || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex items-start justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Package ID</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-900">
                        {subscription.package_id}
                      </code>
                    </div>
                    
                    <div className="flex items-start justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Tên gói</span>
                      <span className="text-sm font-medium text-gray-900">
                        {subscription.package_name || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex items-start justify-between py-2">
                      <span className="text-sm text-gray-500">Version</span>
                      <span className="text-sm font-medium text-gray-900">
                        {subscription.version}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    Thời gian
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-2 rounded-lg bg-green-100">
                        <Calendar className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Ngày bắt đầu</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          {new Date(subscription.start_at).toLocaleString('vi-VN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 p-2 rounded-lg ${daysRemaining && daysRemaining <= 7 ? 'bg-red-100' : 'bg-blue-100'}`}>
                        <Calendar className={`w-4 h-4 ${daysRemaining && daysRemaining <= 7 ? 'text-red-600' : 'text-blue-600'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Ngày kết thúc</p>
                        <p className={`text-sm font-semibold mt-1 ${daysRemaining && daysRemaining <= 7 ? 'text-red-600' : 'text-gray-900'}`}>
                          {subscription.end_at 
                            ? new Date(subscription.end_at).toLocaleString('vi-VN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Không giới hạn'
                          }
                        </p>
                        {daysRemaining !== null && (
                          <p className={`text-xs mt-1 ${daysRemaining <= 7 ? 'text-red-600' : 'text-gray-500'}`}>
                            {daysRemaining > 0 ? `Còn ${daysRemaining} ngày` : `Quá hạn ${Math.abs(daysRemaining)} ngày`}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-2 rounded-lg bg-gray-100">
                        <Calendar className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Ngày tạo</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          {new Date(subscription.created_at).toLocaleString('vi-VN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    {subscription.updated_at && subscription.updated_at !== subscription.created_at && (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-2 rounded-lg bg-gray-100">
                          <Calendar className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">Cập nhật lần cuối</p>
                          <p className="text-sm font-semibold text-gray-900 mt-1">
                            {new Date(subscription.updated_at).toLocaleString('vi-VN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Entitlements & Apps Quick View */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Entitlements */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-indigo-600" />
                      Quyền lợi
                    </h2>
                    <span className="text-sm text-gray-500">
                      {subscription.granted_entitlements ? Object.keys(subscription.granted_entitlements).length : 0} quyền
                    </span>
                  </div>
                  
                  {subscription.granted_entitlements && Object.keys(subscription.granted_entitlements).length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-auto">
                      {Object.entries(subscription.granted_entitlements).slice(0, 5).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            {key}
                          </span>
                          <code className="text-xs bg-white px-2 py-1 rounded border text-gray-600">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </code>
                        </div>
                      ))}
                      {Object.keys(subscription.granted_entitlements).length > 5 && (
                        <button
                          onClick={() => setActiveTab('entitlements')}
                          className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 py-2"
                        >
                          Xem tất cả {Object.keys(subscription.granted_entitlements).length} quyền lợi →
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Chưa có quyền lợi nào</p>
                    </div>
                  )}
                </div>

                {/* Quick Apps */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Code2 className="w-5 h-5 text-indigo-600" />
                      Ứng dụng
                    </h2>
                    <span className="text-sm text-gray-500">
                      {subscription.granted_app_codes?.length || 0} ứng dụng
                    </span>
                  </div>
                  
                  {subscription.granted_app_codes && subscription.granted_app_codes.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-auto">
                      <div className="grid grid-cols-1 gap-2">
                        {subscription.granted_app_codes.slice(0, 6).map((code) => (
                          <div key={code} className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors">
                            <Code2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                            <span className="text-sm font-medium text-indigo-900">{code}</span>
                          </div>
                        ))}
                      </div>
                      {subscription.granted_app_codes.length > 6 && (
                        <button
                          onClick={() => setActiveTab('apps')}
                          className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 py-2"
                        >
                          Xem tất cả {subscription.granted_app_codes.length} ứng dụng →
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Code2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Chưa có ứng dụng nào</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Information */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg shadow-sm border border-indigo-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-indigo-600" />
                  Thông tin giá
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Giá gói</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {formatPrice(subscription.price_amount, subscription.currency_code)}
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Tiền tệ</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {subscription.currency_code || 'VND'}
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Giá trị trung bình/ngày</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {(() => {
                        const totalDays = subscription.end_at 
                          ? Math.ceil((new Date(subscription.end_at).getTime() - new Date(subscription.start_at).getTime()) / (1000 * 60 * 60 * 24))
                          : 365; // Default to 365 days if no end date
                        const pricePerDay = subscription.price_amount / totalDays;
                        return formatPrice(pricePerDay, subscription.currency_code);
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Timeline/Progress */}
              {subscription.end_at && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Tiến trình sử dụng</h2>
                  
                  <div className="space-y-4">
                    {(() => {
                      const totalDays = Math.ceil((new Date(subscription.end_at).getTime() - new Date(subscription.start_at).getTime()) / (1000 * 60 * 60 * 24));
                      const usedDays = Math.ceil((new Date().getTime() - new Date(subscription.start_at).getTime()) / (1000 * 60 * 60 * 24));
                      const percentage = Math.min(Math.max((usedDays / totalDays) * 100, 0), 100);
                      
                      return (
                        <>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-600">
                              Đã sử dụng: <span className="font-semibold text-gray-900">{usedDays}/{totalDays} ngày</span>
                            </span>
                            <span className={`font-semibold ${percentage >= 90 ? 'text-red-600' : percentage >= 70 ? 'text-orange-600' : 'text-gray-900'}`}>
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                percentage >= 90 ? 'bg-red-500' : 
                                percentage >= 70 ? 'bg-orange-500' : 
                                'bg-indigo-600'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                            <span>{new Date(subscription.start_at).toLocaleDateString('vi-VN')}</span>
                            <span>{new Date(subscription.end_at).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'entitlements' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  <Shield className="w-5 h-5 inline mr-2" />
                  Quyền lợi được cấp
                </h2>
                
                {subscription.granted_entitlements && Object.keys(subscription.granted_entitlements).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(subscription.granted_entitlements).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{key}</span>
                        <code className="text-sm bg-white px-3 py-1 rounded border">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </code>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Không có quyền lợi nào được cấp</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'apps' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  <Code2 className="w-5 h-5 inline mr-2" />
                  Ứng dụng được cấp quyền
                </h2>
                
                {subscription.granted_app_codes && subscription.granted_app_codes.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {subscription.granted_app_codes.map((code) => (
                      <div key={code} className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <Code2 className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-900">{code}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Không có ứng dụng nào được cấp quyền</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Thời gian sử dụng</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {Math.ceil((new Date().getTime() - new Date(subscription.start_at).getTime()) / (1000 * 60 * 60 * 24))} ngày
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-indigo-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Ứng dụng</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {subscription.granted_app_codes?.length || 0}
                      </p>
                    </div>
                    <Code2 className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Quyền lợi</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {subscription.granted_entitlements ? Object.keys(subscription.granted_entitlements).length : 0}
                      </p>
                    </div>
                    <Shield className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}