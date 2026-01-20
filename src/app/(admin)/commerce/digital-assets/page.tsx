/**
 * Digital Assets Page
 * Manage digital assets (domains, SSL certificates, license keys)
 * Compatible with tenant_digital_assets table
 * ✅ MIGRATED: Using Next.js shim for navigation
 * ✅ Phase 3: ConfirmDialog, showToast, Fragment wrapper
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import {
  digitalAssetsApi,
  DigitalAsset,
  getAssetTypeLabel,
  getAssetTypeColor,
  getAssetStatusLabel,
  getAssetStatusColor,
  isAssetExpiringSoon,
  getDaysUntilExpiry,
} from '@/api/digitalAssetsApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, RefreshCw, Shield, AlertTriangle, CheckCircle, Calendar, Package } from 'lucide-react';
import { showToast } from '@/lib/toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useLanguage } from '@/providers/LanguageProvider';
import { PageLayout } from '@/components/layout/PageLayout';
import { StatisticsCards } from '@/components/common/StatisticsCards';

interface AssetStats {
  total: number;
  active: number;
  pending: number;
  expired: number;
  expiringSoon: number;
}

function DigitalAssetsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<DigitalAsset[]>([]);
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<DigitalAsset | null>(null);

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
      showToast.error('Lỗi', 'Không thể tải danh sách tài sản: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...assets];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(asset => 
        asset.name.toLowerCase().includes(term) ||
        asset.asset_value?.toLowerCase().includes(term) ||
        asset.notes?.toLowerCase().includes(term)
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
    const newStats: AssetStats = {
      total: assets.length,
      active: assets.filter(a => a.status === 'active').length,
      pending: assets.filter(a => a.status === 'pending').length,
      expired: assets.filter(a => a.status === 'expired').length,
      expiringSoon: assets.filter(a => isAssetExpiringSoon(a)).length,
    };
    setStats(newStats);
  };

  const handleDelete = (asset: DigitalAsset) => {
    setAssetToDelete(asset);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!assetToDelete) return;
    
    try {
      await digitalAssetsApi.delete(assetToDelete._id);
      showToast.success('Thành công', 'Đã xóa tài sản');
      loadAssets();
    } catch (error: any) {
      showToast.error('Lỗi', error.message);
    } finally {
      setShowDeleteDialog(false);
      setAssetToDelete(null);
    }
  };

  const statsCards = stats ? [
    { label: 'Total Assets', value: stats.total, color: 'indigo' as const, icon: Package },
    { label: 'Active', value: stats.active, color: 'green' as const, icon: CheckCircle },
    { label: 'Expiring Soon', value: stats.expiringSoon, color: 'yellow' as const, icon: AlertTriangle },
    { label: 'Expired', value: stats.expired, color: 'red' as const, icon: Calendar },
  ] : [];

  return (
    <>
      <PageLayout
        icon={Shield}
        title="Digital Assets"
        description="Manage domains, SSL certificates, and license keys"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAssets}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => router.push('/commerce/digital-assets/create')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Asset
            </Button>
          </div>
        }
      >
        {/* Stats */}
        {stats && <StatisticsCards stats={statsCards} columns={4} />}

        {/* Filters */}
        <Card className="p-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Asset Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="domain">Domain</SelectItem>
                <SelectItem value="ssl">SSL Certificate</SelectItem>
                <SelectItem value="license">License Key</SelectItem>
                <SelectItem value="api_key">API Key</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-muted-foreground">
            Showing {filteredAssets.length} of {assets.length} assets
          </p>
        </Card>

        {/* Assets Table */}
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Value</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Expiry</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => {
                  const daysLeft = getDaysUntilExpiry(asset);
                  const expiringSoon = isAssetExpiringSoon(asset);
                  
                  return (
                    <tr key={asset._id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-indigo-600" />
                          <span className="font-medium">{asset.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={getAssetTypeColor(asset.asset_type)}>
                          {getAssetTypeLabel(asset.asset_type)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {asset.asset_value}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getAssetStatusColor(asset.status)}>
                          {getAssetStatusLabel(asset.status)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {asset.expiry_date ? (
                          <div className="flex items-center gap-1">
                            {expiringSoon && (
                              <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            )}
                            <span className={expiringSoon ? 'text-yellow-600' : ''}>
                              {daysLeft !== null ? `${daysLeft} days` : 'N/A'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">No expiry</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/commerce/digital-assets/${asset._id}`)}
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(asset)}
                            className="text-red-600"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredAssets.length === 0 && (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No digital assets found</p>
              </div>
            )}
          </div>
        </Card>
      </PageLayout>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Digital Asset"
        description={`Are you sure you want to delete "${assetToDelete?.name}"?`}
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </>
  );
}

// Named export for reuse
export { DigitalAssetsPage };

// Default export for routing
export default DigitalAssetsPage;
