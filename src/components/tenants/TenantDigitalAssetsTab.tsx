/**
 * TenantDigitalAssetsTab Component
 * Manages digital assets (Domains, SSL, License Keys, etc.) for tenant
 * ✅ Aligned with tenant_digital_assets schema
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../providers/LanguageProvider';
import {
  Globe,
  Plus,
  Trash2,
  Edit,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  Pause,
  Shield,
  Key,
  Package,
  FileText,
} from 'lucide-react';
import {
  digitalAssetsApi,
  TenantDigitalAsset,
  CreateAssetRequest,
  UpdateAssetRequest,
  AssetType,
  getAssetTypeLabel,
  getAssetTypeColor,
  getAssetStatusLabel,
  getAssetStatusColor,
  formatExpiryStatus,
  isAssetExpiringSoon,
  isAssetExpired,
} from '../../api/digitalAssetsApi';
import { DigitalAssetForm } from '../digital-assets/DigitalAssetForm';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { showToast } from '../../lib/toast';

interface TenantDigitalAssetsTabProps {
  tenantId: string;
}

export const TenantDigitalAssetsTab: React.FC<TenantDigitalAssetsTabProps> = ({ tenantId }) => {
  const { t } = useTranslation();
  const [assets, setAssets] = useState<TenantDigitalAsset[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<TenantDigitalAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load assets
  const loadAssets = async () => {
    try {
      setLoading(true);
      const data = await digitalAssetsApi.getByTenant(tenantId);
      setAssets(data);
    } catch (err) {
      console.error('Error loading digital assets:', err);
      showToast.error(t('common.error'), 'Failed to load digital assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      loadAssets();
    }
  }, [tenantId]);

  // Handle create submit
  const handleCreateSubmit = async (data: CreateAssetRequest | UpdateAssetRequest) => {
    try {
      setSubmitting(true);
      await digitalAssetsApi.create(data as CreateAssetRequest);
      
      showToast.success(t('common.success'), 'Asset created successfully');
      setShowCreateModal(false);
      loadAssets();
    } catch (err: any) {
      showToast.error(t('common.error'), err.message || 'Failed to create asset');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle update submit
  const handleUpdateSubmit = async (data: CreateAssetRequest | UpdateAssetRequest) => {
    if (!editingAsset) return;
    
    try {
      setSubmitting(true);
      await digitalAssetsApi.update(editingAsset._id, data as UpdateAssetRequest);
      
      showToast.success(t('common.success'), 'Asset updated successfully');
      setEditingAsset(null);
      loadAssets();
    } catch (err: any) {
      showToast.error(t('common.error'), err.message || 'Failed to update asset');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete asset "${name}"?`)) return;

    try {
      await digitalAssetsApi.delete(id);
      showToast.success(t('common.success'), 'Digital asset deleted successfully');
      loadAssets();
    } catch (err) {
      console.error('Error deleting asset:', err);
      showToast.error(t('common.error'), 'Failed to delete digital asset');
    }
  };

  // Handle activate
  const handleActivate = async (id: string) => {
    try {
      await digitalAssetsApi.activate(id);
      showToast.success(t('common.success'), 'Asset activated successfully');
      loadAssets();
    } catch (err) {
      showToast.error(t('common.error'), 'Failed to activate asset');
    }
  };

  // Handle suspend
  const handleSuspend = async (id: string) => {
    try {
      await digitalAssetsApi.suspend(id);
      showToast.success(t('common.success'), 'Asset suspended successfully');
      loadAssets();
    } catch (err) {
      showToast.error(t('common.error'), 'Failed to suspend asset');
    }
  };

  // Handle auto-renew toggle
  const handleToggleAutoRenew = async (asset: TenantDigitalAsset) => {
    try {
      if (asset.auto_renew) {
        await digitalAssetsApi.disableAutoRenew(asset._id);
        showToast.success(t('common.success'), 'Auto-renewal disabled');
      } else {
        await digitalAssetsApi.enableAutoRenew(asset._id);
        showToast.success(t('common.success'), 'Auto-renewal enabled');
      }
      loadAssets();
    } catch (err) {
      showToast.error(t('common.error'), 'Failed to update auto-renewal settings');
    }
  };

  // Helper to get icon by type
  const getAssetIcon = (type: AssetType) => {
    switch (type) {
      case 'DOMAIN': return <Globe className="h-4 w-4" />;
      case 'SSL': return <Shield className="h-4 w-4" />;
      case 'LICENSE_KEY': return <Key className="h-4 w-4" />;
      case 'SOFTWARE': return <Package className="h-4 w-4" />;
      case 'SUBSCRIPTION': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading && !assets.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Digital Assets</h2>
          <p className="text-sm text-gray-500 mt-1">Manage domains, SSL certificates, licenses, and subscriptions.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {/* Assets List */}
      {assets.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auto Renew</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {assets.map((asset) => (
                  <tr key={asset._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg bg-gray-100 text-gray-600`}>
                          {getAssetIcon(asset.asset_type)}
                        </div>
                        <span className="font-medium text-gray-900">{asset.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={getAssetTypeColor(asset.asset_type)}>
                        {getAssetTypeLabel(asset.asset_type)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={getAssetStatusColor(asset.status)}>
                        {getAssetStatusLabel(asset.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        {isAssetExpiringSoon(asset) && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                        {isAssetExpired(asset) && <AlertTriangle className="h-3 w-3 text-red-500" />}
                        {asset.expires_at ? new Date(asset.expires_at).toLocaleDateString() : 'No expiry'}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {formatExpiryStatus(asset)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {asset.auto_renew ? (
                        <div className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          <span>On</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400 text-sm">
                          <XCircle className="h-4 w-4" />
                          <span>Off</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingAsset(asset)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Details
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {asset.status === 'ACTIVE' ? (
                              <DropdownMenuItem onClick={() => handleSuspend(asset._id)} className="text-orange-600">
                                <Pause className="mr-2 h-4 w-4" />
                                Suspend
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleActivate(asset._id)} className="text-green-600">
                                <Play className="mr-2 h-4 w-4" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem onClick={() => handleToggleAutoRenew(asset)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              {asset.auto_renew ? 'Disable Auto-renew' : 'Enable Auto-renew'}
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={() => handleDelete(asset._id, asset.name)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No digital assets found for this tenant.</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Asset
          </Button>
        </div>
      )}

      {/* Unified Modal Container */}
      {(showCreateModal || editingAsset) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <DigitalAssetForm 
                tenantId={tenantId}
                initialData={editingAsset || undefined}
                onSubmit={editingAsset ? handleUpdateSubmit : handleCreateSubmit}
                onCancel={() => {
                  setShowCreateModal(false);
                  setEditingAsset(null);
                }}
                loading={submitting}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};