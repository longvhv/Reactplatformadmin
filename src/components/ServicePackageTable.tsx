/**
 * Service Package Table Component
 * 
 * Displays service packages with search, filtering, and actions
 * Reusable across different views, max 500 lines
 */

import { useState } from 'react';
import { ServicePackage, BillingCycle } from '../api/servicePackages';
import { useLanguage } from '../providers/LanguageProvider';
import { Search, Filter, Edit, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ServicePackageTableProps {
  packages: ServicePackage[];
  products?: any[];
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onClone?: (id: string) => void;
  showActions?: boolean;
}

export function ServicePackageTable({
  packages,
  products = [],
  onDelete,
  onEdit,
  onClone,
  showActions = true,
}: ServicePackageTableProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterBillingCycle, setFilterBillingCycle] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVisibility, setFilterVisibility] = useState('');

  // Get product name by ID
  function getProductName(productId: string): string {
    const product = products.find((p) => p._id === productId);
    return product?.product_name || 'Unknown';
  }

  // Format price
  function formatPrice(price: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price);
  }

  // Filter packages
  const filteredPackages = packages.filter((pkg) => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        pkg.package_name.toLowerCase().includes(search) ||
        pkg.package_code.toLowerCase().includes(search) ||
        (pkg.description?.toLowerCase().includes(search) ?? false);
      if (!matchesSearch) return false;
    }

    // Product filter
    if (filterProduct && pkg.product_id !== filterProduct) {
      return false;
    }

    // Billing cycle filter
    if (filterBillingCycle && pkg.billing_cycle !== filterBillingCycle) {
      return false;
    }

    // Status filter
    if (filterStatus === 'active' && !pkg.is_active) {
      return false;
    }
    if (filterStatus === 'inactive' && pkg.is_active) {
      return false;
    }

    // Visibility filter
    if (filterVisibility === 'public' && !pkg.is_public) {
      return false;
    }
    if (filterVisibility === 'private' && pkg.is_public) {
      return false;
    }

    return true;
  });

  // Get badge color for billing cycle
  function getBillingCycleBadge(cycle: BillingCycle): string {
    const colors: Record<BillingCycle, string> = {
      MONTHLY: 'bg-blue-100 text-blue-800',
      QUARTERLY: 'bg-green-100 text-green-800',
      YEARLY: 'bg-purple-100 text-purple-800',
      ONE_TIME: 'bg-orange-100 text-orange-800',
      CUSTOM: 'bg-gray-100 text-gray-800',
    };
    return colors[cycle] || 'bg-gray-100 text-gray-800';
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('servicePackages.searchPackages') || 'Search packages...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* Product Filter */}
          <div>
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">{t('servicePackages.allProducts') || 'All Products'}</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.product_name}
                </option>
              ))}
            </select>
          </div>

          {/* Billing Cycle Filter */}
          <div>
            <select
              value={filterBillingCycle}
              onChange={(e) => setFilterBillingCycle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">{t('servicePackages.allBillingCycles') || 'All Cycles'}</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
              <option value="ONE_TIME">One-time</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">{t('servicePackages.allStatuses') || 'All Status'}</option>
              <option value="active">{t('servicePackages.active') || 'Active'}</option>
              <option value="inactive">{t('servicePackages.inactive') || 'Inactive'}</option>
            </select>
          </div>

          {/* Visibility Filter */}
          <div>
            <select
              value={filterVisibility}
              onChange={(e) => setFilterVisibility(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">{t('servicePackages.allVisibility') || 'All'}</option>
              <option value="public">{t('servicePackages.public') || 'Public'}</option>
              <option value="private">{t('servicePackages.private') || 'Private'}</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(searchTerm || filterProduct || filterBillingCycle || filterStatus || filterVisibility) && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            <span>
              {t('common.showing') || 'Showing'} {filteredPackages.length} {t('common.of') || 'of'}{' '}
              {packages.length} {t('servicePackages.packages') || 'packages'}
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterProduct('');
                setFilterBillingCycle('');
                setFilterStatus('');
                setFilterVisibility('');
              }}
              className="ml-2 text-indigo-600 hover:text-indigo-800"
            >
              {t('servicePackages.clearFilters') || 'Clear filters'}
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('servicePackages.package') || 'Package'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('servicePackages.product') || 'Product'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('servicePackages.billing') || 'Billing'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('servicePackages.price') || 'Price'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('servicePackages.features') || 'Features'}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('servicePackages.status') || 'Status'}
                </th>
                {showActions && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions') || 'Actions'}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={showActions ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                    {t('servicePackages.noPackagesFound') || 'No packages found'}
                  </td>
                </tr>
              ) : (
                filteredPackages.map((pkg) => (
                  <tr key={pkg._id} className="hover:bg-gray-50">
                    {/* Package Info */}
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{pkg.package_name}</div>
                        <div className="text-sm text-gray-500">{pkg.package_code}</div>
                      </div>
                    </td>

                    {/* Product */}
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{getProductName(pkg.product_id)}</div>
                    </td>

                    {/* Billing Cycle */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getBillingCycleBadge(
                          pkg.billing_cycle
                        )}`}
                      >
                        {pkg.billing_cycle}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {formatPrice(pkg.price, pkg.currency)}
                      </div>
                    </td>

                    {/* Features Count */}
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">
                        {pkg.features_config.length} {t('servicePackages.features') || 'features'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Object.keys(pkg.limits_config).length} {t('servicePackages.limits') || 'limits'}
                      </div>
                    </td>

                    {/* Status Badges */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            pkg.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {pkg.is_active ? (t('servicePackages.active') || 'Active') : (t('servicePackages.inactive') || 'Inactive')}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          {pkg.is_public ? (
                            <>
                              <Eye className="w-3 h-3" />
                              {t('servicePackages.public') || 'Public'}
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              {t('servicePackages.private') || 'Private'}
                            </>
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    {showActions && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(pkg._id)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                              title={t('common.edit') || 'Edit'}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {onClone && (
                            <button
                              onClick={() => onClone(pkg._id)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title={t('servicePackages.clone') || 'Clone'}
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(pkg._id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title={t('common.delete') || 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Summary */}
      {filteredPackages.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          {t('common.showing') || 'Showing'} {filteredPackages.length}{' '}
          {filteredPackages.length === 1 ? (t('servicePackages.package') || 'package') : (t('servicePackages.packages') || 'packages')}
        </div>
      )}
    </div>
  );
}