/**
 * Service Deliveries Page
 * Manage service deliveries (consulting, training, etc.)
 * Compatible with tenant_service_deliveries table
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  serviceDeliveriesApi,
  ServiceDelivery,
  getUnitTypeLabel,
  getServiceStatusLabel,
  getServiceStatusColor,
  calculateProgress,
  getRemainingUnits,
  isDeliveryOverdue,
} from '../api/serviceDeliveriesApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Search, RefreshCw, Briefcase, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from '../providers/LanguageProvider';

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
      toast.error('Không thể tải danh sách dịch vụ: ' + error.message);
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
      toast.success(`Đã bắt đầu dịch vụ ${delivery.service_name}`);
      loadDeliveries();
    } catch (error: any) {
      toast.error('Không thể bắt đầu: ' + error.message);
    }
  };

  const handleComplete = async (delivery: ServiceDelivery) => {
    if (!confirm(`Bạn có chắc muốn đánh dấu hoàn thành "${delivery.service_name}"?`)) return;

    try {
      await serviceDeliveriesApi.complete(delivery._id);
      toast.success('Đã đánh dấu hoàn thành');
      loadDeliveries();
    } catch (error: any) {
      toast.error('Không thể hoàn thành: ' + error.message);
    }
  };

  const handleDelete = async (delivery: ServiceDelivery) => {
    if (!confirm(`Bạn có chắc muốn xóa "${delivery.service_name}"?`)) return;

    try {
      await serviceDeliveriesApi.delete(delivery._id);
      toast.success('Đã xóa dịch vụ');
      loadDeliveries();
    } catch (error: any) {
      toast.error('Không thể xóa: ' + error.message);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-500 rounded-xl flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-foreground">
                Dịch vụ thực hiện
              </span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Quản lý dịch vụ tư vấn, đào tạo
            </p>
          </div>
          <Button onClick={() => navigate('/core/service-deliveries/add')}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm dịch vụ
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tổng số
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Chờ thực hiện
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Đang thực hiện
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.inProgress}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Hoàn thành
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.completed}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Quá hạn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.overdue}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Đã hủy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">
                  {stats.cancelled}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm theo tên dịch vụ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="PENDING">Chờ thực hiện</SelectItem>
                  <SelectItem value="IN_PROGRESS">Đang thực hiện</SelectItem>
                  <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                  <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" onClick={loadDeliveries}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Deliveries List */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-500 mt-4">Đang tải...</p>
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Không có dịch vụ nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDeliveries.map((delivery) => {
              const progress = calculateProgress(delivery);
              const remaining = getRemainingUnits(delivery);
              const overdue = isDeliveryOverdue(delivery);

              return (
                <Card key={delivery._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {delivery.service_name}
                        </CardTitle>
                        <Badge className={`mt-2 ${getServiceStatusColor(delivery.status)}`}>
                          {getServiceStatusLabel(delivery.status)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Tiến độ</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            progress >= 100 ? 'bg-green-600' :
                            progress >= 50 ? 'bg-blue-600' :
                            'bg-yellow-600'
                          }`}
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                    </div>

                    {/* Units */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Đã sử dụng:
                      </span>
                      <span className="text-sm font-medium">
                        {delivery.used_units} / {delivery.total_units} {getUnitTypeLabel(delivery.unit_type)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Còn lại:
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        {remaining} {getUnitTypeLabel(delivery.unit_type)}
                      </span>
                    </div>

                    {/* Dates */}
                    {delivery.started_at && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Bắt đầu:
                        </span>
                        <span className="text-sm">{formatDate(delivery.started_at)}</span>
                      </div>
                    )}

                    {delivery.completed_at && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Hoàn thành:
                        </span>
                        <span className="text-sm">{formatDate(delivery.completed_at)}</span>
                      </div>
                    )}

                    {/* Delivery Notes Count */}
                    {delivery.delivery_notes && delivery.delivery_notes.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Nhật ký:
                        </span>
                        <span className="text-sm">{delivery.delivery_notes.length} ghi chú</span>
                      </div>
                    )}

                    {overdue && (
                      <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className="text-xs text-orange-600">Quá hạn!</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-3 border-t">
                      {delivery.status === 'PENDING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleStart(delivery)}
                        >
                          Bắt đầu
                        </Button>
                      )}
                      {delivery.status === 'IN_PROGRESS' && remaining === 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleComplete(delivery)}
                        >
                          Hoàn thành
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/core/service-deliveries/${delivery._id}`)}
                      >
                        Chi tiết
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
