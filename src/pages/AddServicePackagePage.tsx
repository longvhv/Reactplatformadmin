/**
 * Add Service Package Page
 * ✅ UPDATED 2026-01-15: Unified design with FormPageLayout
 */

import { useNavigate } from 'react-router';
import { Package as PackageIcon } from 'lucide-react';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
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
    <FormPageLayout
      mode="add"
      title="Thêm gói dịch vụ mới"
      description="Tạo gói dịch vụ với các tính năng và giá cả"
      icon={PackageIcon}
      backPath="/core/service-packages"
      backLabel="Quay lại danh sách"
    >
      <ServicePackageForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/core/service-packages')}
      />
    </FormPageLayout>
  );
}