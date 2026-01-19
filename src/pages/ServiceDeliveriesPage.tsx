/**
 * Service Deliveries Page
 * Manage service deliveries (consulting, training, etc.)
 * Compatible with tenant_service_deliveries table
 * ✅ MIGRATED Phase 3: ConfirmDialog, showToast, Fragment wrapper
 */

import { Fragment, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  tenantServiceDeliveriesApi as serviceDeliveriesApi,
  ServiceDelivery,
  getUnitTypeLabel,
  getServiceStatusLabel,
  getServiceStatusColor,
  calculateProgress,
  getRemainingUnits,
  isDeliveryOverdue,
} from '../api/tenantServiceDeliveriesApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Search, RefreshCw, Briefcase, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { showToast } from '../lib/toast';
import { useLanguage } from '../providers/LanguageProvider';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { PageLayout } from '../components/layout/PageLayout';
import { StatisticsCards } from '../components/common/StatisticsCards';

interface DeliveryStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  overdue: number;
}

export default function ServiceDeliveriesPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [deliveries, setDeliveries] = useState<ServiceDelivery[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<ServiceDelivery[]>([]);
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    loadDeliveries();
  }, []);

  useEffect(() => {
    applyFilters();
    calculateStats();
  }, [deliveries, searchTerm, statusFilter]);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const data = await serviceDeliveriesApi.getAll();
      setDeliveries(data);
    } catch (error: any) {
      console.error('Error loading deliveries:', error);
      showToast.error('Lỗi', 'Không thể tải danh sách dịch vụ: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...deliveries];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(delivery =>
        delivery.service_name.toLowerCase().includes(search) ||
        delivery._id.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(delivery => delivery.status === statusFilter);
    }

    setFilteredDeliveries(filtered);
  };

  const calculateStats = () => {
    const stats: DeliveryStats = {
      total: deliveries.length,
      pending: deliveries.filter(d => d.status === 'PENDING').length,
      inProgress: deliveries.filter(d => d.status === 'IN_PROGRESS').length,
      completed: deliveries.filter(d => d.status === 'COMPLETED').length,
      cancelled: deliveries.filter(d => d.status === 'CANCELLED').length,
      overdue: deliveries.filter(d => isDeliveryOverdue(d)).length,
    };
    setStats(stats);
  };

  const handleStart = async (delivery: ServiceDelivery) => {
    try {
      await serviceDeliveriesApi.start(delivery._id);
      showToast.success('Thành công', `Đã bắt đầu dịch vụ ${delivery.service_name}`);
      loadDeliveries();
    } catch (error: any) {
      showToast.error('Lỗi', 'Không thể bắt đầu: ' + error.message);
    }
  };

  const handleComplete = async (delivery: ServiceDelivery) => {
    setConfirmDialog({
      open: true,
      title: 'Xác nhận hoàn thành',
      description: `Bạn có chắc muốn đánh dấu hoàn thành "${delivery.service_name}"?`,
      onConfirm: async () => {
        try {
          await serviceDeliveriesApi.complete(delivery._id);
          showToast.success('Thành công', 'Đã đánh dấu hoàn thành');
          loadDeliveries();
        } catch (error: any) {
          showToast.error('Lỗi', 'Không thể hoàn thành: ' + error.message);
        } finally {
          setConfirmDialog({ ...confirmDialog, open: false });
        }
      },
    });
  };

  const handleDelete = async (delivery: ServiceDelivery) => {
    setConfirmDialog({
      open: true,
      title: 'Xác nhận xóa',
      description: `Bạn có chắc muốn xóa "${delivery.service_name}"? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        try {
          await serviceDeliveriesApi.delete(delivery._id);
          showToast.success('Thành công', 'Đã xóa dịch vụ');
          loadDeliveries();
        } catch (error: any) {
          showToast.error('Lỗi', 'Không thể xóa: ' + error.message);
        } finally {
          setConfirmDialog({ ...confirmDialog, open: false });
        }
      },
      variant: 'destructive',
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <Fragment>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
          </div>
        </div>
      </Fragment>
    );
  }

  return (
    <Fragment>
      <PageLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dịch vụ thực hiện</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Quản lý các dịch vụ consulting, training</p>
            </div>
            <Button onClick={() => navigate('/commerce/service-deliveries/add')}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm dịch vụ
            </Button>
          </div>

          {/* Stats */}
          {stats && (
            <StatisticsCards
              stats={[
                { label: 'Tổng số', value: stats.total, color: 'gray' },
                { label: 'Chờ', value: stats.pending, color: 'yellow' },
                { label: 'Đang thực hiện', value: stats.inProgress, color: 'blue' },
                { label: 'Hoàn thành', value: stats.completed, color: 'green' },
                { label: 'Hủy', value: stats.cancelled, color: 'gray' },
                { label: 'Quá hạn', value: stats.overdue, color: 'red' },
              ]}
            />
          )}

          {/* Filters */}
          <Card className="p-4 mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm dịch vụ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="PENDING">Chờ</SelectItem>
                  <SelectItem value="IN_PROGRESS">Đang thực hiện</SelectItem>
                  <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                  <SelectItem value="CANCELLED">Hủy</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={loadDeliveries}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* Deliveries Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Dịch vụ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tiến độ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Thời hạn</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        Không có dịch vụ nào
                      </td>
                    </tr>
                  ) : (
                    filteredDeliveries.map((delivery) => {
                      const progress = calculateProgress(delivery);
                      const remaining = getRemainingUnits(delivery);
                      const isOverdue = isDeliveryOverdue(delivery);

                      return (
                        <tr key={delivery._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900 dark:text-white">{delivery.service_name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {delivery.total_units} {getUnitTypeLabel(delivery.unit_type)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  progress === 100 ? 'bg-green-600' : 'bg-blue-600'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {delivery.delivered_units}/{delivery.total_units} ({progress}%)
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={getServiceStatusColor(delivery.status)}>
                              {getServiceStatusLabel(delivery.status)}
                            </Badge>
                            {isOverdue && (
                              <Badge className="ml-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                Quá hạn
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {delivery.deadline ? formatDate(delivery.deadline) : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              {delivery.status === 'PENDING' && (
                                <Button variant="outline" size="sm" onClick={() => handleStart(delivery)}>
                                  Bắt đầu
                                </Button>
                              )}
                              {delivery.status === 'IN_PROGRESS' && (
                                <Button variant="outline" size="sm" onClick={() => handleComplete(delivery)}>
                                  Hoàn thành
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(delivery)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Xóa
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Confirm Dialog */}
        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
          title={confirmDialog.title}
          description={confirmDialog.description}
          onConfirm={confirmDialog.onConfirm}
          variant={confirmDialog.variant}
          confirmLabel="Xác nhận"
          cancelLabel="Hủy"
        />
      </PageLayout>
    </Fragment>
  );
}