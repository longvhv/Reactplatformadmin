/**
 * Add Service Package Page
 * 
 * Page for creating new service packages
 */

import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ServicePackageForm } from '../components/service-packages/ServicePackageForm';
import { packagesApi, CreatePackageRequest } from '../api/packagesApi';
import { toast } from 'sonner@2.0.3';

export default function AddServicePackagePage() {
  const navigate = useNavigate();

  const handleSubmit = async (data: Partial<CreatePackageRequest>) => {
    try {
      await packagesApi.create({
        ...data,
        entitlements_config: {}, // Default empty config
      } as CreatePackageRequest);

      toast.success('Đã tạo gói dịch vụ mới');
      navigate('/core/service-packages');
    } catch (error: any) {
      console.error('Error creating service package:', error);
      toast.error('Không thể tạo gói dịch vụ: ' + (error.message || 'Unknown error'));
      throw error;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/core/service-packages')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Thêm gói dịch vụ mới
        </h1>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
        <ServicePackageForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/core/service-packages')}
        />
      </div>
    </div>
  );
}