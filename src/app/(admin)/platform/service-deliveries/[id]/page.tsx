/**
 * Service Delivery Detail Page
 * ✅ MIGRATED from /pages/platform/service-deliveries/[id].tsx
 * ✅ UPDATED: Uses tenantServiceDeliveriesApi and ServiceDeliveryWithDetails
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from '../../../../../components/shim/next-navigation';
import { Truck, ArrowLeft, Edit, Trash2, MoreVertical, Package, Calendar } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { tenantServiceDeliveriesApi, ServiceDeliveryWithDetails } from '../../../../../api/tenantServiceDeliveriesApi';
import { showToast } from '../../../../../lib/toast';
import { ConfirmDialog } from '../../../../../components/common/ConfirmDialog';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../../../components/ui/dropdown-menu';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';

export default function ServiceDeliveryDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [data, setData] = useState<ServiceDeliveryWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await tenantServiceDeliveriesApi.getByIdWithDetails(id);
      setData(result);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load service delivery');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await tenantServiceDeliveriesApi.delete(id);
      showToast.success('Success', 'Service delivery deleted');
      router.push('/platform/service-deliveries');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to delete');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Service Delivery Not Found</h2>
          <Button onClick={() => router.push('/platform/service-deliveries')}>
            <ArrowLeft className="w-4 h-4 mr-2" />Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageLayout 
        icon={Truck} 
        title={data.product_name || 'Service Delivery'} 
        description={`Delivery #${data._id}`} 
        backButton={{ label: 'Back', onClick: () => router.push('/platform/service-deliveries') }}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/platform/service-deliveries/edit/${id}`)}>
                <Edit className="w-4 h-4 mr-2" />Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-600" />
                  Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(data.status)} variant="secondary">
                        {data.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Tenant</label>
                    <div className="font-medium mt-1">{data.tenant_name || data.tenant_id}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Product</label>
                    <div className="font-medium mt-1">{data.product_name || data.product_id}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Product Code</label>
                    <div className="font-mono text-sm mt-1">{data.product_code || '-'}</div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-3">Delivery Progress</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium">{Math.round(data.progress_percentage || 0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full" 
                        style={{ width: `${Math.min((data.progress_percentage || 0), 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Delivered: {data.delivered_units}</span>
                      <span>Total: {data.total_units} {data.unit_type}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-xs text-gray-700">
                    {JSON.stringify(data.service_metadata, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Value & Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Total Value</label>
                  <div className="text-2xl font-bold text-indigo-600">
                    {data.total_value?.toLocaleString()} {data.currency_code}
                  </div>
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Unit Price:</span>
                    <span>{data.unit_price?.toLocaleString()} {data.currency_code}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivered Value:</span>
                    <span>{data.delivered_value?.toLocaleString()} {data.currency_code}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Remaining Value:</span>
                    <span>{data.remaining_value?.toLocaleString()} {data.currency_code}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Timestamps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Created:</span>
                  <span>{new Date(data.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Updated:</span>
                  <span>{new Date(data.updated_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageLayout>
      
      <ConfirmDialog 
        open={showDeleteDialog} 
        onOpenChange={setShowDeleteDialog} 
        title="Delete Service Delivery" 
        description={`Are you sure you want to delete this service delivery? This action cannot be undone.`} 
        onConfirm={handleDelete} 
        variant="destructive" 
      />
    </>
  );
}
