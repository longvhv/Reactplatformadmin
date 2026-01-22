/**
 * Tenant Subscription Detail Page
 * 
 * Displays detailed information about a tenant subscription.
 * Handles soft delete and navigation to edit page.
 */

'use client';

import { Fragment, useState, useEffect } from 'react';
import { useRouter, useParams } from '../../../../../../components/shim/next-navigation';
import { CreditCard, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../../../../../components/ui/button';
import { PageLayout } from '../../../../../../components/layout/PageLayout';
import { tenantSubscriptionsApi, SubscriptionWithDetails } from '../../../../../../api/tenantSubscriptionsApi';
import { showToast } from '../../../../../../lib/toast';
import { ConfirmDialog } from '../../../../../../components/common/ConfirmDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../../../../components/ui/dropdown-menu';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../../../components/ui/card';
import { Badge } from '../../../../../../components/ui/badge';

export default function TenantSubscriptionDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [data, setData] = useState<SubscriptionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await tenantSubscriptionsApi.getByIdWithDetails(id);
      setData(result);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!data) return;
    try {
      await tenantSubscriptionsApi.delete(id, data.version);
      showToast.success('Success', 'Subscription cancelled/deleted');
      router.push('/platform/tenant-subscriptions');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to delete');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'trial': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'suspended': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'expired': return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      case 'cancelled': return 'bg-red-100 text-red-800 hover:bg-red-100';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
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
          <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Subscription Not Found</h2>
          <Button onClick={() => router.push('/platform/tenant-subscriptions')}>
            <ArrowLeft className="w-4 h-4 mr-2" />Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageLayout
        icon={CreditCard}
        title={data.subscription_name}
        description={`Subscription #${data.subscription_number}`}
        backButton={{ label: 'Back', onClick: () => router.push('/platform/tenant-subscriptions') }}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/platform/tenant-subscriptions/edit/${id}`)}>
                <Edit className="w-4 h-4 mr-2" />Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />Delete/Cancel
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
                <CardTitle className="text-lg">Subscription Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(data.status)} variant="secondary">
                        {data.status.toUpperCase()}
                      </Badge>
                      {data.is_trial && <Badge className="ml-2 bg-blue-50 text-blue-700" variant="secondary">TRIAL</Badge>}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Auto Renew</label>
                    <div className="mt-1 font-medium">{data.auto_renew ? 'Yes' : 'No'}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Tenant</label>
                    <div className="mt-1 font-medium">{data.tenant_name || data.tenant_id}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Plan</label>
                    <div className="mt-1 font-medium">{data.plan_display_name || data.plan_name || 'Custom'}</div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Dates
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">Start Date</label>
                      <div className="mt-1">{new Date(data.start_date).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">End Date</label>
                      <div className="mt-1">{new Date(data.end_date).toLocaleDateString()}</div>
                    </div>
                    {data.trial_end_date && (
                      <div>
                        <label className="text-sm text-gray-500">Trial Ends</label>
                        <div className="mt-1">{new Date(data.trial_end_date).toLocaleDateString()}</div>
                      </div>
                    )}
                    {data.renewal_date && (
                      <div>
                        <label className="text-sm text-gray-500">Renewal Date</label>
                        <div className="mt-1">{new Date(data.renewal_date).toLocaleDateString()}</div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage & Limits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Users className="w-4 h-4" /> Users
                      </span>
                      <span className="text-xs text-gray-500">
                        {data.current_users} / {data.max_users}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full" 
                        style={{ width: `${Math.min((data.current_users / data.max_users) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <HardDrive className="w-4 h-4" /> Storage
                      </span>
                      <span className="text-xs text-gray-500">
                        {data.current_storage_gb} / {data.max_storage_gb} GB
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full" 
                        style={{ width: `${Math.min((data.current_storage_gb / data.max_storage_gb) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-2">Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.features && data.features.length > 0 ? (
                      data.features.map((feature, idx) => (
                        <Badge key={idx} variant="outline" className="bg-white">
                          {feature}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">No specific features configured.</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {(data.notes) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{data.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Billing & Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Total Amount</label>
                  <div className="text-2xl font-bold text-indigo-600">
                    {data.total_amount.toLocaleString()} {data.currency}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {data.billing_cycle} cycle
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Base Price:</span>
                    <span>{data.base_price.toLocaleString()} {data.currency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount:</span>
                    <span className="text-green-600">-{data.discount_amount.toLocaleString()} {data.currency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax:</span>
                    <span>+{data.tax_amount.toLocaleString()} {data.currency}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="mb-2">
                    <label className="text-sm text-gray-500">Payment Status</label>
                    <div className="font-medium capitalize">{data.payment_status.replace('_', ' ')}</div>
                  </div>
                  {data.payment_method && (
                    <div className="mb-2">
                      <label className="text-sm text-gray-500">Method</label>
                      <div className="font-medium">{data.payment_method}</div>
                    </div>
                  )}
                  {data.last_payment_date && (
                    <div className="mb-2">
                      <label className="text-sm text-gray-500">Last Payment</label>
                      <div className="text-sm">{new Date(data.last_payment_date).toLocaleDateString()}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {(data.billing_contact_name || data.billing_contact_email) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Billing Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.billing_contact_name && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Name</label>
                      <div className="font-medium">{data.billing_contact_name}</div>
                    </div>
                  )}
                  {data.billing_contact_email && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Email</label>
                      <div className="text-sm text-blue-600">{data.billing_contact_email}</div>
                    </div>
                  )}
                  {data.billing_contact_phone && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Phone</label>
                      <div className="text-sm">{data.billing_contact_phone}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="text-xs text-gray-400 text-center">
              <div>Created: {new Date(data.created_at).toLocaleString()}</div>
              <div>Updated: {new Date(data.updated_at).toLocaleString()}</div>
              <div>ID: {data._id}</div>
            </div>
          </div>
        </div>
      </PageLayout>
      
      <ConfirmDialog 
        open={showDeleteDialog} 
        onOpenChange={setShowDeleteDialog} 
        title="Cancel Subscription" 
        description={`Are you sure you want to cancel subscription "${data.subscription_name}"? This will set the status to Cancelled and mark it as deleted.`} 
        onConfirm={handleDelete} 
        variant="destructive" 
      />
    </>
  );
}