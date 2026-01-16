/**
 * Locations Page
 * Standalone page for managing locations across all tenants
 * ✅ CREATED 2026-01-15: Complete implementation
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useLocations } from '../hooks/useLocations';
import { useLocationTypes } from '../hooks/useLocationTypes';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  MapPin, Plus, Search, Building2, Home, Filter,
  TrendingUp, Users, Globe, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from '../providers/LanguageProvider';
import type { Location, LocationStatus } from '../api/locationsApi';

export default function LocationsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LocationStatus | 'all'>('all');

  const { 
    locations, 
    loading, 
    error,
    deleteLocation,
    updateStatus,
    getStats 
  } = useLocations();

  const { types: locationTypes } = useLocationTypes();

  // Filter locations
  const filteredLocations = locations.filter(location => {
    const matchesSearch = !searchTerm || 
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || location.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get statistics
  const stats = getStats();

  // Get location type name
  const getLocationTypeName = (typeId: string) => {
    const type = locationTypes.find(t => t._id === typeId);
    return type?.name || 'Unknown';
  };

  // Handle delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa vị trí "${name}"?`)) return;

    try {
      await deleteLocation(id);
      toast.success('Đã xóa vị trí thành công');
    } catch (error: any) {
      toast.error('Không thể xóa vị trí: ' + (error.message || 'Unknown error'));
    }
  };

  // Handle status change
  const handleStatusChange = async (id: string, status: LocationStatus) => {
    try {
      await updateStatus(id, status);
      toast.success('Đã cập nhật trạng thái');
    } catch (error: any) {
      toast.error('Không thể cập nhật trạng thái: ' + (error.message || 'Unknown error'));
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: LocationStatus }) => {
    const variants: Record<LocationStatus, { color: string; label: string }> = {
      ACTIVE: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: 'Hoạt động' },
      INACTIVE: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', label: 'Ngừng hoạt động' },
      CLOSED: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: 'Đóng cửa' },
    };

    const variant = variants[status];
    return (
      <Badge className={variant.color}>
        {variant.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải dữ liệu vị trí...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 max-w-md">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="w-6 h-6" />
            <h3 className="font-semibold">Lỗi tải dữ liệu</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-7 h-7 text-indigo-600" />
            Quản lý Vị trí
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Quản lý tất cả các vị trí trong hệ thống
          </p>
        </div>
        <Button
          onClick={() => navigate('/core/locations/add')}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm vị trí
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tổng vị trí</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
              <MapPin className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Đang hoạt động</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.active}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/30">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Trụ sở chính</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.headquarters}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30">
              <Home className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Theo loại</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.byType && Object.keys(stats.byType).length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/30">
              <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc mã..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LocationStatus | 'all')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Ngừng hoạt động</option>
            <option value="CLOSED">Đóng cửa</option>
          </select>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Filter className="w-4 h-4" />
            <span>Tìm thấy {filteredLocations.length} vị trí</span>
          </div>
        </div>
      </Card>

      {/* Locations Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tên vị trí
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Mã
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Địa chỉ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trụ sở chính
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Không có vị trí nào</p>
                  </td>
                </tr>
              ) : (
                filteredLocations.map((location) => (
                  <tr 
                    key={location._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {location.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm text-gray-600 dark:text-gray-400">
                        {location.code || '-'}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">
                        {getLocationTypeName(location.type_id)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={location.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {location.address?.street || location.address?.city || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {location.is_headquarter && (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          <Home className="w-3 h-3 mr-1" />
                          HQ
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/core/locations/edit/${location._id}`)}
                        >
                          Sửa
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(location._id, location.name)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
