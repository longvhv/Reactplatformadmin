/**
 * Add Subscription Page
 * Form to create new tenant subscription
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Plus, Calendar, Package, Building2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { useLanguage } from '../providers/LanguageProvider';
import { toast } from 'sonner@2.0.3';
import {
  createTenantSubscription,
  generateSubscriptionNumber,
  type CreateSubscriptionRequest,
} from '../api/tenantSubscriptionApi';
import { getAllServicePackages, type ServicePackage } from '../api/servicePackages';
import { tenantsApi, type Tenant } from '../api/tenantsApi';

// Add CSS for required label indicator
const styles = `
  .required::after {
    content: ' *';
    color: #ef4444;
  }
`;

export default function AddSubscriptionPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Form state
  const [formData, setFormData] = useState<CreateSubscriptionRequest>({
    tenant_id: '',
    package_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    auto_renew: false,
    metadata: {},
  });

  // Loading & validation states
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Options from APIs
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Selected package details
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);

  // Fetch tenants and packages on mount
  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      setLoadingOptions(true);
      const [tenantsData, packagesData] = await Promise.all([
        tenantsApi.getAll({ status: 'ACTIVE' }),
        getAllServicePackages({ status: 'ACTIVE' }),
      ]);
      setTenants(tenantsData);
      setPackages(packagesData);
    } catch (error: any) {
      console.error('Error loading options:', error);
      toast.error('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoadingOptions(false);
    }
  };

  // Handle package selection
  useEffect(() => {
    if (formData.package_id) {
      const pkg = packages.find((p) => p._id === formData.package_id);
      setSelectedPackage(pkg || null);

      // Auto-calculate end date based on billing cycle
      if (pkg && pkg.billing_cycle && formData.start_date) {
        const startDate = new Date(formData.start_date);
        let endDate = new Date(startDate);

        switch (pkg.billing_cycle) {
          case 'MONTHLY':
            endDate.setMonth(endDate.getMonth() + 1);
            break;
          case 'QUARTERLY':
            endDate.setMonth(endDate.getMonth() + 3);
            break;
          case 'YEARLY':
            endDate.setFullYear(endDate.getFullYear() + 1);
            break;
          case 'DAILY':
            endDate.setDate(endDate.getDate() + 1);
            break;
          case 'WEEKLY':
            endDate.setDate(endDate.getDate() + 7);
            break;
          default:
            // For LIFETIME, ONE_TIME, CUSTOM - don't set end date
            endDate = startDate;
        }

        if (pkg.billing_cycle !== 'LIFETIME' && pkg.billing_cycle !== 'ONE_TIME') {
          setFormData((prev) => ({
            ...prev,
            end_date: endDate.toISOString().split('T')[0],
          }));
        }
      }
    } else {
      setSelectedPackage(null);
    }
  }, [formData.package_id, formData.start_date, packages]);

  const handleInputChange = (field: keyof CreateSubscriptionRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.tenant_id) {
      newErrors.tenant_id = 'Vui lòng chọn tenant';
    }
    if (!formData.package_id) {
      newErrors.package_id = 'Vui lòng chọn gói dịch vụ';
    }
    if (!formData.start_date) {
      newErrors.start_date = 'Vui lòng chọn ngày bắt đầu';
    }

    // Validate end date is after start date
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end <= start) {
        newErrors.end_date = 'Ngày kết thúc phải sau ngày bắt đầu';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }

    try {
      setLoading(true);

      // Create subscription
      const newSubscription = await createTenantSubscription(formData);

      toast.success('Tạo đăng ký dịch vụ thành công!');
      
      // Navigate to the detail page or list
      navigate(`/core/subscriptions/${newSubscription._id}`);
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      toast.error(error?.message || 'Không thể tạo đăng ký dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getBillingCycleLabel = (cycle: string) => {
    const labels: Record<string, string> = {
      DAILY: 'Hàng ngày',
      WEEKLY: 'Hàng tuần',
      MONTHLY: 'Hàng tháng',
      QUARTERLY: 'Hàng quý',
      YEARLY: 'Hàng năm',
      LIFETIME: 'Trọn đời',
      ONE_TIME: 'Một lần',
      CUSTOM: 'Tùy chỉnh',
    };
    return labels[cycle] || cycle;
  };

  if (loadingOptions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/core/tenant-subscriptions')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Thêm đăng ký dịch vụ mới</h1>
                <p className="text-sm text-gray-600 mt-1">Tạo đăng ký dịch vụ cho tenant</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tenant Selection */}
              <div>
                <Label htmlFor="tenant_id" className="required">
                  Tenant
                </Label>
                <select
                  id="tenant_id"
                  value={formData.tenant_id}
                  onChange={(e) => handleInputChange('tenant_id', e.target.value)}
                  className={`w-full mt-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.tenant_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                >
                  <option value="">-- Chọn tenant --</option>
                  {tenants.map((tenant) => (
                    <option key={tenant._id} value={tenant._id}>
                      {tenant.name} ({tenant.code})
                    </option>
                  ))}
                </select>
                {errors.tenant_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.tenant_id}</p>
                )}
              </div>

              {/* Package Selection */}
              <div>
                <Label htmlFor="package_id" className="required">
                  Gói dịch vụ
                </Label>
                <select
                  id="package_id"
                  value={formData.package_id}
                  onChange={(e) => handleInputChange('package_id', e.target.value)}
                  className={`w-full mt-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.package_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                >
                  <option value="">-- Chọn gói dịch vụ --</option>
                  {packages.map((pkg) => (
                    <option key={pkg._id} value={pkg._id}>
                      {pkg.name} - {formatCurrency(pkg.price_amount, pkg.currency_code)} / {getBillingCycleLabel(pkg.billing_cycle || 'MONTHLY')}
                    </option>
                  ))}
                </select>
                {errors.package_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.package_id}</p>
                )}
              </div>

              {/* Package Details Preview */}
              {selectedPackage && (
                <Card className="bg-indigo-50 border-indigo-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-indigo-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-indigo-900">{selectedPackage.name}</h4>
                        {selectedPackage.description && (
                          <p className="text-sm text-indigo-700 mt-1">{selectedPackage.description}</p>
                        )}
                        <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                          <div>
                            <span className="text-indigo-700">Giá:</span>{' '}
                            <span className="font-semibold text-indigo-900">
                              {formatCurrency(selectedPackage.price_amount, selectedPackage.currency_code)}
                            </span>
                          </div>
                          <div>
                            <span className="text-indigo-700">Chu kỳ:</span>{' '}
                            <span className="font-semibold text-indigo-900">
                              {getBillingCycleLabel(selectedPackage.billing_cycle || 'MONTHLY')}
                            </span>
                          </div>
                          {selectedPackage.trial_days && selectedPackage.trial_days > 0 && (
                            <div>
                              <span className="text-indigo-700">Dùng thử:</span>{' '}
                              <span className="font-semibold text-indigo-900">
                                {selectedPackage.trial_days} ngày
                              </span>
                            </div>
                          )}
                          {selectedPackage.max_users && (
                            <div>
                              <span className="text-indigo-700">Số user:</span>{' '}
                              <span className="font-semibold text-indigo-900">
                                {selectedPackage.max_users}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Subscription Period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Thời gian đăng ký
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date */}
                <div>
                  <Label htmlFor="start_date" className="required">
                    Ngày bắt đầu
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className={errors.start_date ? 'border-red-500' : ''}
                    disabled={loading}
                  />
                  {errors.start_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
                  )}
                </div>

                {/* End Date */}
                <div>
                  <Label htmlFor="end_date">
                    Ngày kết thúc
                    <span className="text-xs text-gray-500 ml-2">(Tùy chọn)</span>
                  </Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date || ''}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    className={errors.end_date ? 'border-red-500' : ''}
                    disabled={loading}
                    min={formData.start_date}
                  />
                  {errors.end_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Để trống nếu đăng ký không có thời hạn
                  </p>
                </div>
              </div>

              {/* Auto Renew */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="auto_renew"
                  checked={formData.auto_renew}
                  onChange={(e) => handleInputChange('auto_renew', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  disabled={loading}
                />
                <Label htmlFor="auto_renew" className="!mb-0 cursor-pointer">
                  Tự động gia hạn khi hết hạn
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/core/tenant-subscriptions')}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang tạo...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo đăng ký
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}