/**
 * SubscriptionCard Component
 * Displays tenant subscription in a card format
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, Calendar, DollarSign, Users, HardDrive,
  Eye, Pencil, Trash2, RefreshCw, Sparkles, Clock
} from 'lucide-react';
import { TenantSubscription, SubscriptionStatus } from '../../api/tenantSubscriptionApi';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { useLanguage } from '../../providers/LanguageProvider';

interface SubscriptionCardProps {
  subscription: TenantSubscription;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onDelete,
  onEdit,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const getStatusColor = (status: SubscriptionStatus) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      trial: 'bg-blue-100 text-blue-800 border-blue-200',
      suspended: 'bg-orange-100 text-orange-800 border-orange-200',
      expired: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return colors[status];
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

  const userPercentage = calculateUsagePercentage(subscription.current_users, subscription.max_users);
  const storagePercentage = calculateUsagePercentage(subscription.current_storage_gb, subscription.max_storage_gb);

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-indigo-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 line-clamp-1">
                  {subscription.subscription_name}
                </h3>
                <p className="text-sm text-gray-500">{subscription.subscription_number}</p>
              </div>
            </div>
          </div>
          <Badge className={getStatusColor(subscription.status)}>
            {t(`subscriptions.status.${subscription.status}`)}
          </Badge>
        </div>

        {/* Plan & Billing Info */}
        <div className="flex items-center gap-2 mt-3">
          {subscription.plan_name && (
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">
              {subscription.plan_name}
            </Badge>
          )}
          <Badge className="bg-blue-50 text-blue-700 border-blue-200">
            {t(`subscriptions.billingCycle.${subscription.billing_cycle}`)}
          </Badge>
          {subscription.is_trial && (
            <Badge className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {t('subscriptions.trial')}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Period */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-700">{t('subscriptions.period')}:</span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <div>{formatDate(subscription.start_date)} → {formatDate(subscription.end_date)}</div>
            {subscription.trial_end_date && subscription.is_trial && (
              <div className="text-blue-600 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Trial ends: {formatDate(subscription.trial_end_date)}
              </div>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="p-3 bg-indigo-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-indigo-600" />
              <span className="font-medium text-gray-700">{t('subscriptions.totalAmount')}:</span>
            </div>
            <span className="text-lg font-bold text-indigo-600">
              {formatCurrency(subscription.total_amount, subscription.currency)}
            </span>
          </div>
          {subscription.discount_amount > 0 && (
            <div className="mt-2 text-sm text-green-600">
              {t('subscriptions.discount')}: -{formatCurrency(subscription.discount_amount, subscription.currency)}
            </div>
          )}
          <div className="mt-2">
            <Badge className={
              subscription.payment_status === 'paid' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }>
              {t(`subscriptions.paymentStatus.${subscription.payment_status}`)}
            </Badge>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">{t('subscriptions.usage')}:</div>
          
          {/* Users */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span>{t('subscriptions.users')}</span>
              </div>
              <span className="font-medium">
                {subscription.current_users}/{subscription.max_users} ({userPercentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  userPercentage >= 90 ? 'bg-red-500' : 
                  userPercentage >= 70 ? 'bg-yellow-500' : 
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(userPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Storage */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <div className="flex items-center gap-2 text-gray-600">
                <HardDrive className="w-4 h-4" />
                <span>{t('subscriptions.storage')}</span>
              </div>
              <span className="font-medium">
                {subscription.current_storage_gb.toFixed(1)}/{subscription.max_storage_gb} GB ({storagePercentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  storagePercentage >= 90 ? 'bg-red-500' : 
                  storagePercentage >= 70 ? 'bg-yellow-500' : 
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Auto Renew */}
        {subscription.auto_renew && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
            <RefreshCw className="w-4 h-4" />
            <span>{t('subscriptions.autoRenewEnabled')}</span>
          </div>
        )}

        {/* Contact Info */}
        {subscription.billing_contact_email && (
          <div className="pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-1">{t('subscriptions.billingContact')}:</div>
            <div className="text-sm text-gray-700">
              {subscription.billing_contact_name && <div className="font-medium">{subscription.billing_contact_name}</div>}
              <div className="text-gray-600">{subscription.billing_contact_email}</div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between w-full gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/core/subscriptions/${subscription._id}`)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            {t('common.view')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit ? onEdit(subscription._id!) : navigate(`/core/subscriptions/edit/${subscription._id}`)}
            className="flex-1"
          >
            <Pencil className="w-4 h-4 mr-2" />
            {t('common.edit')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(subscription._id!)}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
