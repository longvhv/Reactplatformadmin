/**
 * Service Packages List Page
 * 
 * Main page for managing service packages with statistics
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllServicePackages,
  deleteServicePackage,
  getServicePackageStats,
  cloneServicePackage,
  ServicePackage,
  ServicePackageStats,
} from '../api/servicePackages';
import { saasProductApi } from '../api/saasProductApi';
import { ServicePackageTable } from '../components/ServicePackageTable';
import { useLanguage } from '../providers/LanguageProvider';
import { Plus, Package, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function ServicePackagesPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState<ServicePackageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      const [packagesData, productsData, statsData] = await Promise.all([
        getAllServicePackages(),
        saasProductApi.getAll(),
        getServicePackageStats(),
      ]);
      setPackages(packagesData);
      setProducts(productsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error(t('servicePackages.failedToLoadData') || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('servicePackages.confirmDelete') || 'Are you sure you want to delete this package?')) {
      return;
    }

    try {
      await deleteServicePackage(id);
      toast.success(t('servicePackages.packageDeleted') || 'Package deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete package:', error);
      toast.error(t('servicePackages.failedToDelete') || 'Failed to delete package');
    }
  }

  async function handleClone(id: string) {
    try {
      const original = packages.find((p) => p._id === id);
      if (!original) return;

      const newCode = prompt(
        t('servicePackages.enterNewCode') || 'Enter new package code:',
        `${original.package_code}-COPY`
      );
      if (!newCode) return;

      await cloneServicePackage(id, newCode);
      toast.success(t('servicePackages.packageCloned') || 'Package cloned successfully');
      loadData();
    } catch (error: any) {
      console.error('Failed to clone package:', error);
      toast.error(error.message || 'Failed to clone package');
    }
  }

  function handleEdit(id: string) {
    navigate(`/core/service-packages/edit/${id}`);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">{t('common.loading') || 'Loading...'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('servicePackages.title') || 'Service Packages'}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('servicePackages.manageServicePackages') || 'Manage pricing packages and configurations'}
          </p>
        </div>
        <button
          onClick={() => navigate('/core/service-packages/add')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          {t('servicePackages.addPackage') || 'Add Package'}
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('servicePackages.totalPackages') || 'Total Packages'}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('servicePackages.activePackages') || 'Active'}</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('servicePackages.averagePrice') || 'Average Price'}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${stats.avg_price.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('servicePackages.publicPackages') || 'Public'}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.public}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Packages Table */}
      <ServicePackageTable
        packages={packages}
        products={products}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onClone={handleClone}
      />
    </div>
  );
}