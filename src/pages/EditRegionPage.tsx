/**
 * Edit Region Page
 * ✅ UPDATED 2026-01-15: Unified design with FormPageLayout
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { regionsApi, Region } from '@/api/regionsApi';
import { RegionForm } from '@/components/regions/RegionForm';
import { toast } from 'sonner@2.0.3';

export default function EditRegionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRegion();
  }, [id]);

  const loadRegion = async () => {
    try {
      setLoading(true);
      const data = await regionsApi.getById(id!);
      if (!data) {
        toast.error('Region không tồn tại');
        navigate('/platform/regions');
      }
      setRegion(data);
    } catch (error: any) {
      console.error('Failed to load region:', error);
      toast.error(t('errors.somethingWentWrong'));
      navigate('/platform/regions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      await regionsApi.update(id!, data);
      toast.success('Đã cập nhật region');
      navigate('/platform/regions');
    } catch (error: any) {
      console.error('Failed to update region:', error);
      toast.error(error.message || t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/platform/regions');
  };

  if (loading && !region) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải region...</p>
        </div>
      </div>
    );
  }

  if (!region) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Không tìm thấy region</p>
          <Button onClick={() => navigate('/platform/regions')} className="mt-4">
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <FormPageLayout
      mode="edit"
      title="Chỉnh sửa Region"
      description={region.name}
      icon={Globe}
      backPath="/platform/regions"
      backLabel="Quay lại danh sách"
    >
      <RegionForm
        region={region}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </FormPageLayout>
  );
}