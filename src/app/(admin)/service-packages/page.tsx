/**
 * Service Packages Page
 * Trang quản lý các gói dịch vụ
 * ✅ CREATED: 2026-01-20
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '../../../../components/shim/next-navigation';
import { Package2, Plus, Search, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card } from '../../../../components/ui/card';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { showToast } from '../../../../lib/toast';
import { servicePackagesApi, ServicePackage } from '../../../../api/servicePackagesApi';

function ServicePackagesPage() {
  const router = useRouter();
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchServicePackages = async () => {
    try {
      setLoading(true);
      const data = await servicePackagesApi.getAll();
      setServicePackages(data);
    } catch (error: any) {
      console.error('Error fetching service packages:', error);
      showToast.error('Lỗi', 'Không thể tải danh sách service packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicePackages();
  }, []);

  const filteredPackages = servicePackages.filter(pkg =>
    pkg.package_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.package_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price?: number, currency?: string) => {
    if (!price) return '-';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency || 'VND',
    }).format(price);
  };

  return (
    <PageLayout
      icon={Package2}
      title="Service Packages"
      description="Quản lý các gói dịch vụ và pricing"
      actions={
        <Button onClick={() => router.push('/platform/service-packages/create')} className="gap-2">
          <Plus className="w-4 h-4" />
          Thêm Service Package
        </Button>
      }
    >
      {/* Search */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm service packages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Service Packages List */}
      <Card className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Đang tải service packages...</span>
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có service packages'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {searchTerm
                ? 'Thử tìm kiếm với từ khóa khác'
                : 'Bắt đầu bằng cách tạo service package đầu tiên'}
            </p>
            {!searchTerm && (
              <Button onClick={() => router.push('/platform/service-packages/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo Service Package Đầu Tiên
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPackages.map((pkg) => (
              <Card
                key={pkg._id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2"
                onClick={() => router.push(`/platform/service-packages/${pkg._id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <Package2 className="w-8 h-8 text-blue-500" />
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      pkg.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {pkg.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-1">{pkg.package_name}</h3>
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {pkg.package_code}
                </code>
                {pkg.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 mb-4 line-clamp-2">
                    {pkg.description}
                  </p>
                )}
                {pkg.price && (
                  <div className="mt-4 pt-4 border-t dark:border-gray-700">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatPrice(pkg.price, pkg.currency)}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Card>
    </PageLayout>
  );
}

export default ServicePackagesPage;