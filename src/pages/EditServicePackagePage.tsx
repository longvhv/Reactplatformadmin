/**
 * Edit Service Package Page
 * ✅ UPDATED 2026-01-15: Unified design with FormPageLayout
 */

import { useNavigate, useParams } from 'react-router';
import { Button } from '../components/ui/button';
import { Package as PackageIcon } from 'lucide-react';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { ServicePackageForm } from '../components/service-packages/ServicePackageForm';
import { packagesApi, CreatePackageRequest } from '../api/packagesApi';
import { toast } from 'sonner@2.0.3';
import { useEffect, useState } from 'react';
import type { Package } from '../api/packagesApi';

export default function EditServicePackagePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPackage = async () => {
      if (!id) {
        navigate('/commerce/service-packages');
        return;
      }

      try {
        setLoading(true);
        const data = await packagesApi.getById(id);
        setPkg(data);
      } catch (error: any) {
        console.error('Error loading service package:', error);
        toast.error('Không thể tải gói dịch vụ');
        navigate('/commerce/service-packages');
      } finally {
        setLoading(false);
      }
    };

    loadPackage();
  }, [id, navigate]);

  const handleSubmit = async (data: Partial<CreatePackageRequest>) => {
    if (!id) return;

    try {
      await packagesApi.update(id, {
        ...data,
        version: pkg?.version,
      } as any);

      toast.success('Đã cập nhật gói dịch vụ');
      navigate('/commerce/service-packages');
    } catch (error: any) {
      console.error('Error updating service package:', error);
      toast.error('Không thể cập nhật gói dịch vụ: ' + (error.message || 'Unknown error'));
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải gói dịch vụ...</p>
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Không tìm thấy gói dịch vụ</p>
          <Button onClick={() => navigate('/commerce/service-packages')} className="mt-4">
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <FormPageLayout
      mode="edit"
      title="Chỉnh sửa gói dịch vụ"
      description={pkg.name}
      icon={PackageIcon}
      backPath="/commerce/service-packages"
      backLabel="Quay lại danh sách"
    >
      <ServicePackageForm
        package={pkg}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/commerce/service-packages')}
      />
    </FormPageLayout>
  );
}