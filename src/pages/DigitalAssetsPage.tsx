/**
 * Digital Assets Page
 * Manage digital assets (domains, SSL certificates, license keys)
 * Compatible with tenant_digital_assets table
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  digitalAssetsApi,
  DigitalAsset,
  getAssetTypeLabel,
  getAssetTypeColor,
  getAssetStatusLabel,
  getAssetStatusColor,
  isAssetExpiringSoon,
  getDaysUntilExpiry,
} from '../api/digitalAssetsApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Search, RefreshCw, Shield, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from '../providers/LanguageProvider';

interface AssetStats {
  total: number;
  active: number;
  pending: number;
  expired: number;
  expiringSoon: number;
}

export default function DigitalAssetsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<DigitalAsset[]>([]);
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadAssets();
  }, []);

  useEffect(() => {
    applyFilters();
    calculateStats();
  }, [assets, searchTerm, statusFilter, typeFilter]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const data = await digitalAssetsApi.getAll();
      setAssets(data);
    } catch (error: any) {
      console.error('Error loading assets:', error);
      toast.error('Không thể tải danh sách tài sản: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...assets];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(search) ||
        asset._id.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(asset => asset.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(asset => asset.asset_type === typeFilter);
    }

    setFilteredAssets(filtered);
  };

  const calculateStats = () => {
    const stats: AssetStats = {
      total: assets.length,
      active: assets.filter(a => a.status === 'ACTIVE').length,
      pending: assets.filter(a => a.status === 'PENDING').length,
      expired: assets.filter(a => a.status === 'EXPIRED').length,
      expiringSoon: assets.filter(a => isAssetExpiringSoon(a)).length,
    };
    setStats(stats);
  };

  const handleActivate = async (asset: DigitalAsset) => {
    try {
      await digitalAssetsApi.activate(asset._id);
      toast.success(`Đã kích hoạt tài sản ${asset.name}`);
      loadAssets();
    } catch (error: any) {
      toast.error('Không thể kích hoạt: ' + error.message);
    }
  };

  const handleDelete = async (asset: DigitalAsset) => {
    if (!confirm(`Bạn có chắc muốn xóa tài sản "${asset.name}"?`)) return;

    try {
      await digitalAssetsApi.delete(asset._id);
      toast.success('Đã xóa tài sản');
      loadAssets();
    } catch (error: any) {
      toast.error('Không thể xóa: ' + error.message);
    }
  };

  const formatDate = (dateString: string | null) => {
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
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-500 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-foreground">
                Tài sản số
              </span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Quản lý tên miền, SSL, giấy phép
            </p>
          </div>
          <Button onClick={() => navigate('/core/digital-assets/add')}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm tài sản
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  Đang hoạt động
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.active}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Chờ kích hoạt
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
                  Sắp hết hạn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.expiringSoon}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Đã hết hạn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.expired}
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
                    placeholder="Tìm theo tên tài sản..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Loại tài sản" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  <SelectItem value="DOMAIN">Tên miền</SelectItem>
                  <SelectItem value="SSL">SSL</SelectItem>
                  <SelectItem value="LICENSE_KEY">Giấy phép</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                  <SelectItem value="PENDING">Chờ kích hoạt</SelectItem>
                  <SelectItem value="EXPIRED">Đã hết hạn</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" onClick={loadAssets}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Assets List */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-500 mt-4">Đang tải...</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Không có tài sản nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map((asset) => {
              const daysUntilExpiry = getDaysUntilExpiry(asset);
              const expiringSoon = isAssetExpiringSoon(asset);

              return (
                <Card key={asset._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {asset.asset_type === 'DOMAIN' && '🌐'}
                          {asset.asset_type === 'SSL' && '🔒'}
                          {asset.asset_type === 'LICENSE_KEY' && '🔑'}
                          {asset.name}
                        </CardTitle>
                        <div className="flex gap-2 mt-2">
                          <Badge className={getAssetTypeColor(asset.asset_type)} variant="outline">
                            {getAssetTypeLabel(asset.asset_type)}
                          </Badge>
                          <Badge className={getAssetStatusColor(asset.status)}>
                            {getAssetStatusLabel(asset.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {asset.expires_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Hết hạn:
                        </span>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatDate(asset.expires_at)}
                          </div>
                          {daysUntilExpiry !== null && daysUntilExpiry > 0 && (
                            <div className={`text-xs ${expiringSoon ? 'text-orange-600' : 'text-gray-500'}`}>
                              Còn {daysUntilExpiry} ngày
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {asset.activated_at && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Kích hoạt:</span>
                        <span className="text-sm">{formatDate(asset.activated_at)}</span>
                      </div>
                    )}

                    {expiringSoon && (
                      <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className="text-xs text-orange-600">Sắp hết hạn!</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-3 border-t">
                      {asset.status === 'PENDING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleActivate(asset)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Kích hoạt
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/core/digital-assets/${asset._id}`)}
                      >
                        Xem chi tiết
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
