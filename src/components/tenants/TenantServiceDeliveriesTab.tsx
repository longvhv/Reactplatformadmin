/**
 * TenantServiceDeliveriesTab Component
 * Manages service deliveries (SaaS product usage/delivery tracking)
 * ✅ Aligned with tenant_service_deliveries schema
 * ✅ Using backend API
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
  RefreshCw,
} from 'lucide-react';
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
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// Types matching tenant_service_deliveries schema
interface ServiceDelivery {
  _id: string;
  tenant_id: string;
  product_id: string;
  subscription_id?: string;
  unit_type: string;
  total_units: number;
  delivered_units: number;
  unit_price: number;
  currency_code: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  service_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  version: number;
}

// API Client
const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core`;

const serviceDeliveriesApi = {
  getByTenant: async (tenantId: string): Promise<ServiceDelivery[]> => {
    const response = await fetch(`${baseUrl}/service-deliveries?tenant_id=${tenantId}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch service deliveries');
    }
    
    const result = await response.json();
    return result.data || [];
  },
  
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${baseUrl}/service-deliveries/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete service delivery');
    }
  },
};

interface TenantServiceDeliveriesTabProps {
  tenantId: string;
}

export const TenantServiceDeliveriesTab: React.FC<TenantServiceDeliveriesTabProps> = ({ tenantId }) => {
  const { t } = useTranslation();
  const [deliveries, setDeliveries] = useState<ServiceDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<ServiceDelivery | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load deliveries
  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const data = await serviceDeliveriesApi.getByTenant(tenantId);
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
  const handleCreateSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      // Call create API - simplified as we don't have the full API yet
      showToast.success(t('common.success'), 'Delivery created successfully (API TBD)');
      setShowCreateModal(false);
      loadDeliveries();
    } catch (err: any) {
      showToast.error(t('common.error'), err.message || 'Failed to create delivery');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle update submit
  const handleUpdateSubmit = async (data: any) => {
    if (!editingDelivery) return;
    
    try {
      setSubmitting(true);
      // Call update API - simplified as we don't have the full API yet
      showToast.success(t('common.success'), 'Delivery updated successfully (API TBD)');
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
      await serviceDeliveriesApi.delete(id);
      showToast.success(t('common.success'), 'Service delivery deleted successfully');
      loadDeliveries();
    } catch (err) {
      console.error('Error deleting delivery:', err);
      showToast.error(t('common.error'), 'Failed to delete service delivery');
    }
  };

  // Handle status change
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      // Update status via PUT API
      const response = await fetch(`${baseUrl}/service-deliveries/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status');
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
              <h3 className="text-lg font-semibold mb-4">
                {editingDelivery ? 'Edit Service Delivery' : 'Add Service Delivery'}
              </h3>
              <p className="text-gray-600 mb-4">
                Form will be available soon. For now, you can seed sample data.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingDelivery(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
function calculateProgress(delivery: ServiceDelivery): number {
  if (delivery.total_units === 0) return 0;
  return Math.min((delivery.delivered_units / delivery.total_units) * 100, 100);
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };
  return labels[status] || status;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
    COMPLETED: 'bg-green-100 text-green-800 border-green-200',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

function getUnitTypeLabel(unitType: string): string {
  const labels: Record<string, string> = {
    API_CALLS: 'API Calls',
    STORAGE_GB: 'Storage (GB)',
    SEATS: 'Seats',
    HOURS: 'Hours',
    BANDWIDTH_TB: 'Bandwidth (TB)',
    UNITS: 'Units',
  };
  return labels[unitType] || unitType;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}