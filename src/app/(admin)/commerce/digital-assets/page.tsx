/**
 * Digital Assets Page
 * Manage digital assets (domains, SSL certificates, license keys)
 * Compatible with tenant_digital_assets table
 * ✅ MIGRATED: Using Next.js shim for navigation
 * ✅ Phase 3: ConfirmDialog, showToast, Fragment wrapper
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import {
  Package,
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  MoreVertical,
  Key,
  Shield,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lock,
  Unlock,
  RefreshCw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../../components/ui/dropdown-menu';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../../components/ui/dialog';
import { showToast } from '../../../../../lib/toast';
import { ConfirmDialog } from '../../../../../components/common/ConfirmDialog';
import { useLanguage } from '../../../../../providers/LanguageProvider';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { StatisticsCards } from '../../../../../components/common/StatisticsCards';
import { projectId, publicAnonKey } from '../../../../../utils/supabase/info';

interface DigitalAsset {
  _id: string;
  tenant_id: string;
  order_id?: string;
  name: string;
  asset_type: string;
  status: 'ACTIVE' | 'PENDING' | 'PROVISIONING' | 'EXPIRED' | 'SUSPENDED' | 'TRANSFERRING';
  auto_renew: boolean;
  asset_metadata: Record<string, any>;
  activated_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  version: number;
}

// API Client
const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core`;

const digitalAssetsApi = {
  getAll: async (): Promise<DigitalAsset[]> => {
    const response = await fetch(`${baseUrl}/digital-assets`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch digital assets');
    }
    
    const result = await response.json();
    return result.data || [];
  },
  
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${baseUrl}/digital-assets/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete digital asset');
    }
  },
};

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
        asset.asset_type?.toLowerCase().includes(term)
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
      active: assets.filter(a => a.status === 'ACTIVE').length,
      pending: assets.filter(a => a.status === 'PENDING').length,
      expired: assets.filter(a => a.status === 'EXPIRED').length,
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
    { label: 'Expiring Soon', value: stats.expiringSoon, color: 'yellow' as const, icon: AlertCircle },
    { label: 'Expired', value: stats.expired, color: 'red' as const, icon: Lock },
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
                <SelectItem value="all">{t('common.allTypes')}</SelectItem>
                <SelectItem value="DOMAIN">Domain</SelectItem>
                <SelectItem value="SSL">SSL Certificate</SelectItem>
                <SelectItem value="LICENSE_KEY">License Key</SelectItem>
                <SelectItem value="SOFTWARE">Software</SelectItem>
                <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.allStatuses')}</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROVISIONING">Provisioning</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="TRANSFERRING">Transferring</SelectItem>
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
                          {asset.name}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getAssetStatusColor(asset.status)}>
                          {getAssetStatusLabel(asset.status)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {asset.expires_at ? (
                          <div className="flex items-center gap-1">
                            {expiringSoon && (
                              <AlertCircle className="w-4 h-4 text-yellow-600" />
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

// Helper functions
function getAssetTypeColor(type?: string): string {
  switch (type) {
    case 'DOMAIN':
      return 'text-blue-600 border-blue-200 bg-blue-50';
    case 'SSL':
      return 'text-green-600 border-green-200 bg-green-50';
    case 'LICENSE_KEY':
      return 'text-purple-600 border-purple-200 bg-purple-50';
    case 'SOFTWARE':
      return 'text-orange-600 border-orange-200 bg-orange-50';
    case 'SUBSCRIPTION':
      return 'text-indigo-600 border-indigo-200 bg-indigo-50';
    default:
      return 'text-gray-600 border-gray-200 bg-gray-50';
  }
}

function getAssetTypeLabel(type?: string): string {
  switch (type) {
    case 'DOMAIN':
      return 'Domain';
    case 'SSL':
      return 'SSL Certificate';
    case 'LICENSE_KEY':
      return 'License Key';
    case 'SOFTWARE':
      return 'Software';
    case 'SUBSCRIPTION':
      return 'Subscription';
    case 'OTHER':
      return 'Other';
    default:
      return type || 'Unknown';
  }
}

function getAssetStatusColor(status?: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'PROVISIONING':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'EXPIRED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'SUSPENDED':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'TRANSFERRING':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getAssetStatusLabel(status?: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'PENDING':
      return 'Pending';
    case 'PROVISIONING':
      return 'Provisioning';
    case 'EXPIRED':
      return 'Expired';
    case 'SUSPENDED':
      return 'Suspended';
    case 'TRANSFERRING':
      return 'Transferring';
    default:
      return status || 'Unknown';
  }
}

function getDaysUntilExpiry(asset: DigitalAsset): number | null {
  if (!asset.expires_at) return null;
  const now = new Date();
  const expiry = new Date(asset.expires_at);
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

function isAssetExpiringSoon(asset: DigitalAsset): boolean {
  const daysLeft = getDaysUntilExpiry(asset);
  return daysLeft !== null && daysLeft > 0 && daysLeft <= 30;
}

// Named export for reuse
export { DigitalAssetsPage };

// Default export for routing
export default DigitalAssetsPage;