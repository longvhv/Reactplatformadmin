/**
 * Add Region Page
 * ✅ UPDATED 2026-01-15: Unified design with FormPageLayout
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Map } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { regionsApi } from '@/api/regionsApi';
import { RegionForm } from '@/components/regions/RegionForm';
import { toast } from 'sonner@2.0.3';

export default function AddRegionPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      await regionsApi.create(data);
      toast.success('Đã tạo region thành công');
      navigate('/platform/regions');
    } catch (error: any) {
      console.error('Failed to create region:', error);
      toast.error(error.message || t('errors.somethingWentWrong'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/platform/regions');
  };

  return (
    <FormPageLayout
      mode="add"
      title="Thêm Region"
      description="Tạo địa giới mới"
      icon={Map}
      backPath="/platform/regions"
      backLabel="Quay lại danh sách"
    >
      <RegionForm 
        onSubmit={handleSubmit} 
        onCancel={handleCancel} 
        loading={loading} 
      />
    </FormPageLayout>
  );
}