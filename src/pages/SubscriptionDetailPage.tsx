/**
 * Subscription Detail Page
 * Displays detailed information about a tenant subscription
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Pencil, Trash2, RefreshCw, Ban, CheckCircle,
  CreditCard, Calendar, DollarSign, Users, HardDrive, Mail,
  Phone, User, FileText, Tag, Clock, Database
} from 'lucide-react';
import { 
  getTenantSubscriptionById, 
  deleteTenantSubscription,
  renewTenantSubscription,
  cancelTenantSubscription,
  TenantSubscription 
} from '../api/tenantSubscriptionApi';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useLanguage } from '../providers/LanguageProvider';
import { toast } from 'sonner@2.0.3';

export const SubscriptionDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSubscription(id);
    }
  }, [id]);

  const fetchSubscription = async (subscriptionId: string) => {
    setLoading(true);
    try {
      const { data, error } = await getTenantSubscriptionById(subscriptionId);
      
      if (error || !data) {
        console.error('Error fetching subscription:', error);
        toast.error(t('subscriptions.notFound'));
        navigate('/core/subscriptions');
        return;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('subscriptions.fetchError'));
      navigate('/core/subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm(t('subscriptions.deleteConfirm'))) return;

    setActionLoading(true);
    try {
      const { success, error } = await deleteTenantSubscription(id);
      
      if (success) {
        toast.success(t('subscriptions.deleteSuccess'));
        navigate('/core/subscriptions');
      } else {
        toast.error(error?.message || t('subscriptions.deleteError'));
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('subscriptions.deleteError'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!id) return;

    setActionLoading(true);
    try {
      const { data, error } = await renewTenantSubscription(id, 12);
      
      if (error) {
        toast.error(t('subscriptions.renewError'));
      } else {
        toast.success(t('subscriptions.renewSuccess'));
        if (id) fetchSubscription(id);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('subscriptions.renewError'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id || !confirm(t('subscriptions.cancelConfirm'))) return;

    setActionLoading(true);
    try {
      const { data, error } = await cancelTenantSubscription(id, 'Cancelled by user request');
      
      if (error) {
        toast.error(t('subscriptions.cancelError'));
      } else {
        toast.success(t('subscriptions.cancelSuccess'));
        if (id) fetchSubscription(id);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('subscriptions.cancelError'));
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      trial: 'bg-blue-100 text-blue-800 border-blue-200',
      suspended: 'bg-orange-100 text-orange-800 border-orange-200',
      expired: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return statusColors[status as keyof typeof statusColors] || statusColors.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('subscriptions.notFound')}</h2>
          <Button onClick={() => navigate('/core/subscriptions')}>
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  const userPercentage = Math.round((subscription.current_users / subscription.max_users) * 100);
  const storagePercentage = Math.round((subscription.current_storage_gb / subscription.max_storage_gb) * 100);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/core/subscriptions')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back')}
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <CreditCard className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{subscription.subscription_name}</h1>
                <p className="text-gray-600 mt-1">{subscription.subscription_number}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge className={getStatusBadge(subscription.status)}>
                    {t(`subscriptions.status.${subscription.status}`)}
                  </Badge>
                  {subscription.plan_name && (
                    <Badge className="bg-indigo-50 text-indigo-700">
                      {subscription.plan_name}
                    </Badge>
                  )}
                  <Badge className="bg-blue-50 text-blue-700">
                    {t(`subscriptions.billingCycle.${subscription.billing_cycle}`)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/core/subscriptions/edit/${subscription._id}`)}
                disabled={actionLoading}
              >
                <Pencil className="w-4 h-4 mr-2" />
                {t('common.edit')}
              </Button>
              {subscription.status === 'active' && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleRenew}
                    disabled={actionLoading}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('subscriptions.renew')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="text-orange-600"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    {t('subscriptions.cancel')}
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={actionLoading}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subscription Period */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {t('subscriptions.period')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t('subscriptions.startDate')}</p>
                    <p className="font-medium text-gray-900">{formatDate(subscription.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t('subscriptions.endDate')}</p>
                    <p className="font-medium text-gray-900">{formatDate(subscription.end_date)}</p>
                  </div>
                  {subscription.trial_end_date && subscription.is_trial && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{t('subscriptions.trialEndDate')}</p>
                      <p className="font-medium text-blue-600">{formatDate(subscription.trial_end_date)}</p>
                    </div>
                  )}
                  {subscription.renewal_date && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{t('subscriptions.renewalDate')}</p>
                      <p className="font-medium text-gray-900">{formatDate(subscription.renewal_date)}</p>
                    </div>
                  )}
                </div>
                {subscription.auto_renew && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-blue-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">{t('subscriptions.autoRenewEnabled')}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  {t('subscriptions.pricing')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('subscriptions.basePrice')}</span>
                  <span className="font-medium">{formatCurrency(subscription.base_price, subscription.currency)}</span>
                </div>
                {subscription.discount_amount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>{t('subscriptions.discount')}</span>
                    <span className="font-medium">-{formatCurrency(subscription.discount_amount, subscription.currency)}</span>
                  </div>
                )}
                {subscription.tax_amount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('subscriptions.tax')}</span>
                    <span className="font-medium">{formatCurrency(subscription.tax_amount, subscription.currency)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">{t('subscriptions.totalAmount')}</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {formatCurrency(subscription.total_amount, subscription.currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-600">{t('subscriptions.paymentStatus')}</span>
                  <Badge className={
                    subscription.payment_status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }>
                    {t(`subscriptions.paymentStatus.${subscription.payment_status}`)}
                  </Badge>
                </div>
                {subscription.payment_method && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('subscriptions.paymentMethod')}</span>
                    <span className="font-medium capitalize">{subscription.payment_method.replace('_', ' ')}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage & Capacity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  {t('subscriptions.usage')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Users */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-700">{t('subscriptions.users')}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {subscription.current_users} / {subscription.max_users} ({userPercentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${
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
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-700">{t('subscriptions.storage')}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {subscription.current_storage_gb.toFixed(1)} / {subscription.max_storage_gb} GB ({storagePercentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${
                        storagePercentage >= 90 ? 'bg-red-500' : 
                        storagePercentage >= 70 ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features & Limits */}
            {(subscription.features || subscription.limits) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {t('subscriptions.features')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subscription.features && Array.isArray(subscription.features) && subscription.features.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">{t('subscriptions.enabledFeatures')}:</p>
                      <div className="flex flex-wrap gap-2">
                        {subscription.features.map((feature, index) => (
                          <Badge key={index} className="bg-indigo-50 text-indigo-700">
                            {typeof feature === 'string' ? feature : JSON.stringify(feature)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {subscription.limits && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">{t('subscriptions.limits')}:</p>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(subscription.limits, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {subscription.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('subscriptions.notes')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{subscription.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Billing Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {t('subscriptions.billingContact')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {subscription.billing_contact_name && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t('subscriptions.contactName')}</p>
                    <p className="font-medium text-gray-900">{subscription.billing_contact_name}</p>
                  </div>
                )}
                {subscription.billing_contact_email && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t('subscriptions.contactEmail')}</p>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${subscription.billing_contact_email}`} className="text-indigo-600 hover:underline">
                        {subscription.billing_contact_email}
                      </a>
                    </div>
                  </div>
                )}
                {subscription.billing_contact_phone && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t('subscriptions.contactPhone')}</p>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${subscription.billing_contact_phone}`} className="text-indigo-600 hover:underline">
                        {subscription.billing_contact_phone}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            {subscription.tags && subscription.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    {t('subscriptions.tags')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {subscription.tags.map((tag, index) => (
                      <Badge key={index} className="bg-gray-100 text-gray-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  {t('subscriptions.metadata')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {subscription.created_at && (
                  <div>
                    <span className="text-gray-600">{t('common.createdAt')}: </span>
                    <span className="font-medium">{formatDate(subscription.created_at)}</span>
                  </div>
                )}
                {subscription.updated_at && (
                  <div>
                    <span className="text-gray-600">{t('common.updatedAt')}: </span>
                    <span className="font-medium">{formatDate(subscription.updated_at)}</span>
                  </div>
                )}
                {subscription.version && (
                  <div>
                    <span className="text-gray-600">{t('common.version')}: </span>
                    <span className="font-medium">v{subscription.version}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
