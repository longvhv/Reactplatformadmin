/**
 * Service Packages List Page
 * 
 * Main page for managing service packages with statistics
 * Aligned with DatabaseCommand.md schema: product_id, entitlements_config, status, is_public
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, Filter, RefreshCw, List, Grid, Edit2, Trash2, Copy, Package as PackageIcon } from 'lucide-react';
import { 
  packagesApi,
  Package, 
  PackageFilters,
  PackageStats 
} from '../api/packagesApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useLanguage } from '../providers/LanguageProvider';
import { toast } from 'sonner@2.0.3';

export default function ServicePackagesPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [packages, setPackages] = useState<Package[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([]);
  const [stats, setStats] = useState<PackageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [publicFilter, setPublicFilter] = useState<string>('all');

  useEffect(() => {
    loadPackages();
    loadStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [packages, searchTerm, statusFilter, publicFilter]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await packagesApi.getAll();
      setPackages(data);
    } catch (error: any) {
      console.error('Error loading packages:', error);
      toast.error('Không thể tải danh sách gói dịch vụ: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statistics = await packagesApi.getStats();
      setStats(statistics);
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...packages];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(pkg => 
        pkg.name.toLowerCase().includes(search) ||
        pkg.code.toLowerCase().includes(search) ||
        pkg.description?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(pkg => pkg.status === statusFilter);
    }

    // Public filter
    if (publicFilter === 'public') {
      filtered = filtered.filter(pkg => pkg.is_public);
    } else if (publicFilter === 'private') {
      filtered = filtered.filter(pkg => !pkg.is_public);
    }

    setFilteredPackages(filtered);
  };

  const handleDelete = async (pkg: Package) => {
    if (!confirm(`Bạn có chắc muốn xóa gói "${pkg.name}"?`)) return;

    try {
      await packagesApi.delete(pkg._id);
      toast.success('Đã xóa gói dịch vụ');
      loadPackages();
      loadStats();
    } catch (error: any) {
      console.error('Error deleting package:', error);
      toast.error('Không thể xóa: ' + error.message);
    }
  };

  const handleClone = async (pkg: Package) => {
    try {
      const newCode = `${pkg.code}_COPY_${Date.now()}`;
      await packagesApi.clone(pkg._id, newCode);
      toast.success('Đã sao chép gói dịch vụ');
      loadPackages();
      loadStats();
    } catch (error: any) {
      console.error('Error cloning package:', error);
      toast.error('Không thể sao chép: ' + error.message);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    // Fallback to VND if currency is null/undefined
    const currencyCode = currency || 'VND';
    
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

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      ARCHIVED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    };
    const labels = {
      ACTIVE: 'Hoạt động',
      INACTIVE: 'Không hoạt động',
      ARCHIVED: 'Lưu trữ',
    };
    return { variant: variants[status as keyof typeof variants] || variants.INACTIVE, label: labels[status as keyof typeof labels] || status };
  };

  // Table View Component
  const TableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Gói dịch vụ
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Giá
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Trạng thái
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {loading ? (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
              </td>
            </tr>
          ) : filteredPackages.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                Không có gói dịch vụ nào
              </td>
            </tr>
          ) : (
            filteredPackages.map((pkg) => {
              const statusBadge = getStatusBadge(pkg.status);
              return (
                <tr key={pkg._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div 
                        className="font-medium text-gray-900 dark:text-white cursor-pointer hover:text-indigo-600 hover:underline"
                        onClick={() => navigate(`/core/service-packages/${pkg._id}`)}
                      >
                        {pkg.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {pkg.code}
                      </div>
                      {pkg.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                          {pkg.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatPrice(pkg.price_amount, pkg.currency_code)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Badge className={statusBadge.variant}>
                        {statusBadge.label}
                      </Badge>
                      <Badge className={pkg.is_public ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'}>
                        {pkg.is_public ? 'Công khai' : 'Riêng tư'}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/core/service-packages/edit/${pkg._id}`)}
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClone(pkg)}
                        title="Sao chép"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(pkg)}
                        className="text-red-600 hover:text-red-700"
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
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
  );

  // Grid View Component
  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {loading ? (
        <div className="col-span-full flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Không có gói dịch vụ nào</p>
        </div>
      ) : (
        filteredPackages.map((pkg) => {
          const statusBadge = getStatusBadge(pkg.status);
          return (
            <Card key={pkg._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle 
                      className="text-lg mb-1 cursor-pointer hover:text-indigo-600"
                      onClick={() => navigate(`/core/service-packages/${pkg._id}`)}
                    >
                      {pkg.name}
                    </CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {pkg.code}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Badge className={statusBadge.variant}>
                      {statusBadge.label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {pkg.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {pkg.description}
                  </p>
                )}
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Giá:</span>
                    <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
                      {formatPrice(pkg.price_amount, pkg.currency_code)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Loại:</span>
                    <Badge className={pkg.is_public ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                      {pkg.is_public ? 'Công khai' : 'Riêng tư'}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t dark:border-gray-700">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/core/service-packages/edit/${pkg._id}`)}
                    title="Chỉnh sửa"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleClone(pkg)}
                    title="Sao chép"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(pkg)}
                    className="text-red-600 hover:text-red-700"
                    title="Xóa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/90 rounded-xl flex items-center justify-center">
                <PackageIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-foreground">Gói dịch vụ</span>
            </h1>
            <p className="text-muted-foreground mt-2">Quản lý các gói dịch vụ của hệ thống</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadPackages}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
            <Button onClick={() => navigate('/core/service-packages/add')}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm gói mới
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 dark:text-gray-400">Tổng số gói</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 dark:text-gray-400">Hoạt động</div>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 dark:text-gray-400">Không hoạt động</div>
                <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 dark:text-gray-400">Lưu trữ</div>
                <div className="text-2xl font-bold text-orange-600">{stats.archived}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 dark:text-gray-400">Công khai</div>
                <div className="text-2xl font-bold text-blue-600">{stats.public}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 dark:text-gray-400">Riêng tư</div>
                <div className="text-2xl font-bold text-purple-600">{stats.private}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm theo tên, mã hoặc mô tả..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                  <SelectItem value="INACTIVE">Không hoạt động</SelectItem>
                  <SelectItem value="ARCHIVED">Lưu trữ</SelectItem>
                </SelectContent>
              </Select>

              <Select value={publicFilter} onValueChange={setPublicFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="public">Công khai</SelectItem>
                  <SelectItem value="private">Riêng tư</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Package List */}
        <Card>
          {viewMode === 'table' ? <TableView /> : <GridView />}
        </Card>
      </div>
    </div>
  );
}