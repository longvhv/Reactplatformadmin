/**
 * Subscription Detail Page
 * Hiển thị chi tiết đăng ký dịch vụ với sidebar layout
 * ✅ MIGRATED: Using Next.js shim for navigation
 * ✅ DropdownMenu, ConfirmDialog, showToast
 * ✅ Professional UI with dark mode support
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '../../../../../../components/shim/next-navigation';
import {
  CreditCard,
  ArrowLeft,
  MoreVertical,
  Edit,
  Trash2,
  Activity,
  User,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  TrendingDown,
  Package2,
  Clock,
  PlayCircle,
  PauseCircle,
  StopCircle,
} from 'lucide-react';
import { Button } from '../../../../../../components/ui/button';
import { subscriptionApi, TenantSubscription } from '../../../../../../api/subscriptionApi';
import { showToast } from '../../../../../../lib/toast';
import { ConfirmDialog } from '../../../../../../components/common/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../../../../../../components/ui/dropdown-menu';
import { UsageEventsTab } from '../../../../../../components/subscriptions/UsageEventsTab';
import { PageLayout } from '../../../../../../components/layout/PageLayout';

function SubscriptionDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'entitlements' | 'apps' | 'stats' | 'usage'>('overview');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadSubscription();
    }
  }, [id]);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const data = await subscriptionApi.getById(id);
      setSubscription(data);
    } catch (error: any) {
      console.error('Failed to load subscription:', error);
      showToast.error('Error', 'Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await subscriptionApi.delete(id);
      showToast.success('Success', 'Subscription deleted');
      router.push('/commerce/subscriptions');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to delete subscription');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!subscription) return;
    
    try {
      const newStatus = subscription.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      await subscriptionApi.update(id, { status: newStatus });
      showToast.success('Success', `Subscription ${newStatus.toLowerCase()}`);
      loadSubscription();
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Subscription Not Found</h2>
          <Button onClick={() => router.push('/commerce/subscriptions')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Subscriptions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageLayout
        icon={Package2}
        title={subscription.product_name || 'Subscription Details'}
        description={`Tenant: ${subscription.tenant_name || 'N/A'}`}
        backButton={{
          label: 'Back to Subscriptions',
          onClick: () => router.push('/commerce/subscriptions'),
        }}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/commerce/subscriptions/edit/${id}`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Subscription
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleStatus}>
                {subscription.status === 'ACTIVE' ? (
                  <>
                    <PauseCircle className="w-4 h-4 mr-2" />
                    Suspend
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Info },
              { id: 'entitlements', label: 'Entitlements', icon: Shield },
              { id: 'apps', label: 'Apps', icon: Code2 },
              { id: 'stats', label: 'Statistics', icon: BarChart3 },
              { id: 'usage', label: 'Usage', icon: Activity },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
              <h3 className="font-semibold mb-4">Subscription Info</h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Status:</dt>
                  <dd className="font-medium">{subscription.status}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Start Date:</dt>
                  <dd>{new Date(subscription.start_date).toLocaleDateString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">End Date:</dt>
                  <dd>{subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'N/A'}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'usage' && (
          <UsageEventsTab subscriptionId={id} />
        )}
      </PageLayout>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Subscription"
        description="Are you sure you want to delete this subscription? This action cannot be undone."
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}

export { SubscriptionDetailPage };
export default SubscriptionDetailPage;