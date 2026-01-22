/**
 * SubscriptionTable Component
 * Displays subscriptions in table format
 * ✅ FIXED 2026-01-22: Changed react-router to Next.js navigation
 */

import React, { useState } from 'react';
import { useRouter } from '../../components/shim/next-navigation';
import { 
  CreditCard, Eye, Pencil, Trash2, RefreshCw, Ban, 
  Calendar, DollarSign, Users, HardDrive, AlertCircle,
  CheckCircle, XCircle, Clock, Sparkles
} from 'lucide-react';
import { TenantSubscription, SubscriptionStatus, PaymentStatus } from '../../api/tenantSubscriptionsApi';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useLanguage } from '../../providers/LanguageProvider';

interface SubscriptionTableProps {
  subscriptions: TenantSubscription[];
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, status: SubscriptionStatus) => void;
  loading?: boolean;
}

export const SubscriptionTable: React.FC<SubscriptionTableProps> = ({
  subscriptions,
  onDelete,
  onStatusChange,
  loading = false,
}) => {
  const router = useRouter();
  const { t } = useLanguage();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const getStatusBadge = (status: SubscriptionStatus) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: t('subscriptions.status.active'), icon: CheckCircle },
      trial: { color: 'bg-blue-100 text-blue-800', label: t('subscriptions.status.trial'), icon: Sparkles },
      suspended: { color: 'bg-orange-100 text-orange-800', label: t('subscriptions.status.suspended'), icon: AlertCircle },
      expired: { color: 'bg-red-100 text-red-800', label: t('subscriptions.status.expired'), icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: t('subscriptions.status.cancelled'), icon: Ban },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: t('subscriptions.status.pending'), icon: Clock },
    };
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const statusConfig = {
      unpaid: { color: 'bg-red-100 text-red-800', label: t('subscriptions.paymentStatus.unpaid'), icon: XCircle },
      paid: { color: 'bg-green-100 text-green-800', label: t('subscriptions.paymentStatus.paid'), icon: CheckCircle },
      partially_paid: { color: 'bg-yellow-100 text-yellow-800', label: t('subscriptions.paymentStatus.partiallyPaid'), icon: AlertCircle },
      refunded: { color: 'bg-purple-100 text-purple-800', label: t('subscriptions.paymentStatus.refunded'), icon: RefreshCw },
      failed: { color: 'bg-red-100 text-red-800', label: t('subscriptions.paymentStatus.failed'), icon: XCircle },
    };
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getBillingCycleBadge = (cycle: string) => {
    const cycleConfig = {
      monthly: { color: 'bg-blue-50 text-blue-700', label: t('subscriptions.billingCycle.monthly') },
      quarterly: { color: 'bg-indigo-50 text-indigo-700', label: t('subscriptions.billingCycle.quarterly') },
      yearly: { color: 'bg-purple-50 text-purple-700', label: t('subscriptions.billingCycle.yearly') },
      custom: { color: 'bg-gray-50 text-gray-700', label: t('subscriptions.billingCycle.custom') },
    };
    const config = cycleConfig[cycle as keyof typeof cycleConfig] || cycleConfig.monthly;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const calculateUsagePercentage = (current: number, max: number) => {
    return max > 0 ? Math.round((current / max) * 100) : 0;
  };

  const handleDelete = (id: string) => {
    if (deleteConfirmId === id) {
      onDelete(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">{t('subscriptions.noSubscriptions')}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('subscriptions.noSubscriptionsDescription')}</p>
        <div className="mt-6">
          <Button onClick={() => router.push('/commerce/tenant-subscriptions/create')}>
            {t('subscriptions.addSubscription')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('subscriptions.subscriptionInfo')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('subscriptions.period')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('subscriptions.pricing')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('subscriptions.usage')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('subscriptions.status')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subscriptions.map((subscription) => {
              const userPercentage = calculateUsagePercentage(subscription.current_users, subscription.max_users);
              const storagePercentage = calculateUsagePercentage(subscription.current_storage_gb, subscription.max_storage_gb);

              return (
                <tr key={subscription._id} className="hover:bg-gray-50 transition-colors">
                  {/* Subscription Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => router.push(`/commerce/tenant-subscriptions/${subscription._id}`)}
                          className="text-sm font-medium text-gray-900 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                        >
                          {subscription.subscription_name}
                        </button>
                        <div className="text-sm text-gray-500">{subscription.subscription_number}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {subscription.plan_name && (
                            <Badge className="bg-indigo-50 text-indigo-700">
                              {subscription.plan_name}
                            </Badge>
                          )}
                          {getBillingCycleBadge(subscription.billing_cycle)}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Period */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{formatDate(subscription.start_date)}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-gray-400">→</span>
                        <span>{formatDate(subscription.end_date)}</span>
                      </div>
                      {subscription.is_trial && subscription.trial_end_date && (
                        <div className="text-xs text-blue-600 mt-1">
                          Trial: {formatDate(subscription.trial_end_date)}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Pricing */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="flex items-center gap-1 font-medium text-gray-900">
                        <DollarSign className="w-3 h-3" />
                        {formatCurrency(subscription.total_amount, subscription.currency)}
                      </div>
                      {subscription.discount_amount > 0 && (
                        <div className="text-xs text-green-600">
                          -{formatCurrency(subscription.discount_amount, subscription.currency)}
                        </div>
                      )}
                      <div className="mt-1">
                        {getPaymentStatusBadge(subscription.payment_status)}
                      </div>
                    </div>
                  </td>

                  {/* Usage */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="flex items-center gap-1 text-gray-700">
                        <Users className="w-3 h-3" />
                        <span>{subscription.current_users}/{subscription.max_users}</span>
                        <span className="text-xs text-gray-500">({userPercentage}%)</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-700 mt-1">
                        <HardDrive className="w-3 h-3" />
                        <span>{subscription.current_storage_gb.toFixed(1)}/{subscription.max_storage_gb} GB</span>
                        <span className="text-xs text-gray-500">({storagePercentage}%)</span>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      {getStatusBadge(subscription.status)}
                      {subscription.auto_renew && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <RefreshCw className="w-3 h-3" />
                          <span>{t('subscriptions.autoRenew')}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/commerce/tenant-subscriptions/${subscription._id}`)}
                        title={t('common.view')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/commerce/tenant-subscriptions/edit/${subscription._id}`)}
                        title={t('common.edit')}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(subscription._id!)}
                        className={deleteConfirmId === subscription._id ? 'text-red-600' : ''}
                        title={deleteConfirmId === subscription._id ? t('common.confirmDelete') : t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};