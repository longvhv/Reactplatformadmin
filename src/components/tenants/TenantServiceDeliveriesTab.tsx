/**
 * TenantServiceDeliveriesTab Component
 * Manages service deliveries (SaaS product usage/delivery tracking)
 * ✅ Aligned with tenant_service_deliveries schema
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../providers/LanguageProvider';
import {
  Package,
  Plus,
  Trash2,
  Edit,
  MoreVertical,
  CheckCircle,
  XCircle,
  Play,
  Box,
} from 'lucide-react';
import {
  tenantServiceDeliveriesApi,
  TenantServiceDelivery,
  DeliveryStatus,
  CreateServiceDeliveryRequest,
  UpdateServiceDeliveryRequest,
  getStatusLabel,
  getStatusColor,
  getUnitTypeLabel,
  calculateProgress,
  formatCurrency,
} from '../../api/tenantServiceDeliveriesApi';
import { ServiceDeliveryForm } from '../service-deliveries/ServiceDeliveryForm';
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

interface TenantServiceDeliveriesTabProps {
  tenantId: string;
}

export const TenantServiceDeliveriesTab: React.FC<TenantServiceDeliveriesTabProps> = ({ tenantId }) => {
  const { t } = useTranslation();
  const [deliveries, setDeliveries] = useState<TenantServiceDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<TenantServiceDelivery | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load deliveries
  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const data = await tenantServiceDeliveriesApi.getByTenant(tenantId);
      setDeliveries(data);
    } catch (err) {
      console.error('Error loading service deliveries:', err);
      showToast.error(t('common.error'), 'Failed to load service deliveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      loadDeliveries();
    }
  }, [tenantId]);

  // Handle create submit
  const handleCreateSubmit = async (data: CreateServiceDeliveryRequest | UpdateServiceDeliveryRequest) => {
    try {
      setSubmitting(true);
      await tenantServiceDeliveriesApi.create(data as CreateServiceDeliveryRequest);
      
      showToast.success(t('common.success'), 'Delivery created successfully');
      setShowCreateModal(false);
      loadDeliveries();
    } catch (err: any) {
      showToast.error(t('common.error'), err.message || 'Failed to create delivery');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle update submit
  const handleUpdateSubmit = async (data: CreateServiceDeliveryRequest | UpdateServiceDeliveryRequest) => {
    if (!editingDelivery) return;
    
    try {
      setSubmitting(true);
      await tenantServiceDeliveriesApi.update(editingDelivery._id, data as UpdateServiceDeliveryRequest);
      
      showToast.success(t('common.success'), 'Delivery updated successfully');
      setEditingDelivery(null);
      loadDeliveries();
    } catch (err: any) {
      showToast.error(t('common.error'), err.message || 'Failed to update delivery');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service delivery?')) return;

    try {
      await tenantServiceDeliveriesApi.delete(id);
      showToast.success(t('common.success'), 'Service delivery deleted successfully');
      loadDeliveries();
    } catch (err) {
      console.error('Error deleting delivery:', err);
      showToast.error(t('common.error'), 'Failed to delete service delivery');
    }
  };

  // Handle status change
  const handleStatusChange = async (id: string, newStatus: DeliveryStatus) => {
    try {
      if (newStatus === 'COMPLETED') {
        await tenantServiceDeliveriesApi.complete(id);
      } else if (newStatus === 'CANCELLED') {
        await tenantServiceDeliveriesApi.cancel(id);
      } else if (newStatus === 'IN_PROGRESS') {
        await tenantServiceDeliveriesApi.start(id);
      } else {
        await tenantServiceDeliveriesApi.update(id, { status: newStatus });
      }
      
      showToast.success(t('common.success'), `Status updated to ${newStatus}`);
      loadDeliveries();
    } catch (err) {
      showToast.error(t('common.error'), 'Failed to update status');
    }
  };

  if (loading && !deliveries.length) {
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
          <h2 className="text-xl font-semibold text-gray-900">Service Deliveries</h2>
          <p className="text-sm text-gray-500 mt-1">Track usage and delivery of SaaS products and services.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Delivery
        </Button>
      </div>

      {/* Deliveries List */}
      {deliveries.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product / Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deliveries.map((delivery) => {
                  const progress = calculateProgress(delivery);
                  return (
                    <tr key={delivery._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                            <Box className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 truncate max-w-[200px]" title={delivery.product_id}>
                              Product: {delivery.product_id.substring(0, 8)}...
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="secondary" className="text-xs">
                                {getUnitTypeLabel(delivery.unit_type)}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {delivery.delivered_units} / {delivery.total_units}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full max-w-xs">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium">{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                progress >= 100 ? 'bg-green-500' : 'bg-indigo-600'
                              }`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={getStatusColor(delivery.status)}>
                          {getStatusLabel(delivery.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(delivery.total_units * delivery.unit_price, delivery.currency_code)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(delivery.unit_price, delivery.currency_code)} / unit
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(delivery.updated_at).toLocaleDateString()}
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
                              <DropdownMenuItem onClick={() => setEditingDelivery(delivery)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Details
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              {delivery.status !== 'COMPLETED' && delivery.status !== 'CANCELLED' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleStatusChange(delivery._id, 'IN_PROGRESS')}>
                                    <Play className="mr-2 h-4 w-4" />
                                    Start Progress
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(delivery._id, 'COMPLETED')} className="text-green-600">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Complete
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(delivery._id, 'CANCELLED')} className="text-red-600">
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancel
                                  </DropdownMenuItem>
                                </>
                              )}
                              
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem onClick={() => handleDelete(delivery._id)} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No service deliveries found for this tenant.</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Delivery
          </Button>
        </div>
      )}

      {/* Unified Modal Container */}
      {(showCreateModal || editingDelivery) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <ServiceDeliveryForm 
                tenantId={tenantId}
                initialData={editingDelivery || undefined}
                onSubmit={editingDelivery ? handleUpdateSubmit : handleCreateSubmit}
                onCancel={() => {
                  setShowCreateModal(false);
                  setEditingDelivery(null);
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
