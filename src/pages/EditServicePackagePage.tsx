/**
 * Edit Service Package Page
 * 
 * Page for editing existing service packages
 */

import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
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
        navigate('/core/service-packages');
        return;
      }

      try {
        setLoading(true);
        const data = await packagesApi.getById(id);
        setPkg(data);
      } catch (error: any) {
        console.error('Error loading service package:', error);
        toast.error('Không thể tải gói dịch vụ');
        navigate('/core/service-packages');
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
      navigate('/core/service-packages');
    } catch (error: any) {
      console.error('Error updating service package:', error);
      toast.error('Không thể cập nhật gói dịch vụ: ' + (error.message || 'Unknown error'));
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/core/service-packages')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Chỉnh sửa gói dịch vụ
        </h1>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
        <ServicePackageForm
          package={pkg}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/core/service-packages')}
        />
      </div>
    </div>
  );
}