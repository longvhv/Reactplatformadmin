/**
 * Service Package Form Component
 * 
 * Reusable form for creating/editing service packages
 * Features: Dynamic feature/limit config editor, validation
 * Max 500 lines, DRY compliant
 */

import { useState, useEffect } from 'react';
import { ServicePackage, BillingCycle, FeatureConfig, LimitsConfig } from '../api/servicePackages';
import { saasProductApi } from '../api/saasProductApi';
import { useLanguage } from '../providers/LanguageProvider';
import { Plus, Trash2, Save, X } from 'lucide-react';

interface ServicePackageFormProps {
  package?: ServicePackage;
  onSubmit: (data: Partial<ServicePackage>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const BILLING_CYCLES: BillingCycle[] = ['MONTHLY', 'QUARTERLY', 'YEARLY', 'ONE_TIME', 'CUSTOM'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'VND'];

export function ServicePackageForm({
  package: pkg,
  onSubmit,
  onCancel,
  isLoading = false,
}: ServicePackageFormProps) {
  const { t } = useLanguage();

  // Form state
  const [packageCode, setPackageCode] = useState(pkg?.package_code || '');
  const [packageName, setPackageName] = useState(pkg?.package_name || '');
  const [productId, setProductId] = useState(pkg?.product_id || '');
  const [description, setDescription] = useState(pkg?.description || '');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(pkg?.billing_cycle || 'MONTHLY');
  const [price, setPrice] = useState(pkg?.price.toString() || '0');
  const [currency, setCurrency] = useState(pkg?.currency || 'USD');
  const [isPublic, setIsPublic] = useState(pkg?.is_public ?? true);
  const [isActive, setIsActive] = useState(pkg?.is_active ?? true);
  const [displayOrder, setDisplayOrder] = useState(pkg?.display_order?.toString() || '0');

  // Features & Limits
  const [features, setFeatures] = useState<FeatureConfig[]>(pkg?.features_config || []);
  const [limits, setLimits] = useState<LimitsConfig>(pkg?.limits_config || {});

  // Products list
  const [products, setProducts] = useState<any[]>([]);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const data = await saasProductApi.getAll();
      setProducts(data);
      if (!productId && data.length > 0) {
        setProductId(data[0]._id || '');
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }

  // Validation
  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!packageCode.trim()) {
      newErrors.packageCode = t('packageCodeRequired') || 'Package code is required';
    }
    if (!packageName.trim()) {
      newErrors.packageName = t('packageNameRequired') || 'Package name is required';
    }
    if (!productId) {
      newErrors.productId = t('productRequired') || 'Product is required';
    }
    if (parseFloat(price) < 0) {
      newErrors.price = t('priceMustBePositive') || 'Price must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Feature management
  function addFeature() {
    setFeatures([...features, { code: '', name: '', enabled: true }]);
  }

  function updateFeature(index: number, field: keyof FeatureConfig, value: any) {
    const updated = [...features];
    updated[index] = { ...updated[index], [field]: value };
    setFeatures(updated);
  }

  function removeFeature(index: number) {
    setFeatures(features.filter((_, i) => i !== index));
  }

  // Limit management
  function addLimit() {
    const key = `limit_${Object.keys(limits).length + 1}`;
    setLimits({ ...limits, [key]: 0 });
  }

  function updateLimitKey(oldKey: string, newKey: string) {
    if (oldKey === newKey) return;
    const { [oldKey]: value, ...rest } = limits;
    setLimits({ ...rest, [newKey]: value });
  }

  function updateLimitValue(key: string, value: string) {
    // Try to parse as number, fallback to string
    const numValue = parseFloat(value);
    setLimits({ ...limits, [key]: isNaN(numValue) ? value : numValue });
  }

  function removeLimit(key: string) {
    const { [key]: _, ...rest } = limits;
    setLimits(rest);
  }

  // Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    const data: Partial<ServicePackage> = {
      package_code: packageCode.trim(),
      package_name: packageName.trim(),
      product_id: productId,
      description: description.trim() || undefined,
      billing_cycle: billingCycle,
      price: parseFloat(price),
      currency,
      features_config: features.filter(f => f.code && f.name),
      limits_config: limits,
      display_order: parseInt(displayOrder) || 0,
      is_public: isPublic,
      is_active: isActive,
    };

    await onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('basicInformation') || 'Basic Information'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Package Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('packageCode') || 'Package Code'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={packageCode}
              onChange={(e) => setPackageCode(e.target.value.toUpperCase())}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.packageCode ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="VHV-PKG-001"
            />
            {errors.packageCode && (
              <p className="text-red-500 text-sm mt-1">{errors.packageCode}</p>
            )}
          </div>

          {/* Package Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('packageName') || 'Package Name'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.packageName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Professional Plan"
            />
            {errors.packageName && (
              <p className="text-red-500 text-sm mt-1">{errors.packageName}</p>
            )}
          </div>

          {/* Product */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('product') || 'Product'} <span className="text-red-500">*</span>
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.productId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">{t('selectProduct') || 'Select Product'}</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.product_name}
                </option>
              ))}
            </select>
            {errors.productId && (
              <p className="text-red-500 text-sm mt-1">{errors.productId}</p>
            )}
          </div>

          {/* Billing Cycle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('billingCycle') || 'Billing Cycle'}
            </label>
            <select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {BILLING_CYCLES.map((cycle) => (
                <option key={cycle} value={cycle}>
                  {cycle}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('price') || 'Price'}
            </label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('currency') || 'Currency'}
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {CURRENCIES.map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>
          </div>

          {/* Display Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('displayOrder') || 'Display Order'}
            </label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('description') || 'Description'}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Describe this package..."
          />
        </div>

        {/* Checkboxes */}
        <div className="mt-4 flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 text-indigo-600"
            />
            <span className="text-sm text-gray-700">{t('publicPackage') || 'Public'}</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-indigo-600"
            />
            <span className="text-sm text-gray-700">{t('active') || 'Active'}</span>
          </label>
        </div>
      </div>

      {/* Features Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('featuresConfiguration') || 'Features Configuration'}
          </h3>
          <button
            type="button"
            onClick={addFeature}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            {t('addFeature') || 'Add Feature'}
          </button>
        </div>

        <div className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={feature.code}
                onChange={(e) => updateFeature(index, 'code', e.target.value)}
                placeholder="feature_code"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="text"
                value={feature.name}
                onChange={(e) => updateFeature(index, 'name', e.target.value)}
                placeholder="Feature Name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={feature.enabled}
                  onChange={(e) => updateFeature(index, 'enabled', e.target.checked)}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className="text-sm text-gray-600">{t('enabled') || 'Enabled'}</span>
              </label>
              <button
                type="button"
                onClick={() => removeFeature(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {features.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">
              {t('noFeatures') || 'No features configured. Click "Add Feature" to start.'}
            </p>
          )}
        </div>
      </div>

      {/* Limits Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('limitsConfiguration') || 'Limits Configuration'}
          </h3>
          <button
            type="button"
            onClick={addLimit}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            {t('addLimit') || 'Add Limit'}
          </button>
        </div>

        <div className="space-y-3">
          {Object.entries(limits).map(([key, value]) => (
            <div key={key} className="flex gap-3 items-center p-3 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={key}
                onChange={(e) => updateLimitKey(key, e.target.value)}
                placeholder="limit_key"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="text"
                value={value}
                onChange={(e) => updateLimitValue(key, e.target.value)}
                placeholder="Value (-1 = unlimited)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={() => removeLimit(key)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {Object.keys(limits).length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">
              {t('noLimits') || 'No limits configured. Click "Add Limit" to start.'}
            </p>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          {t('cancel') || 'Cancel'}
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isLoading ? (t('saving') || 'Saving...') : (t('save') || 'Save')}
        </button>
      </div>
    </form>
  );
}