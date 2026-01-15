/**
 * Edit Region Page
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
        navigate('/core/regions');
      }
      setRegion(data);
    } catch (error: any) {
      console.error('Failed to load region:', error);
      toast.error(t('errors.somethingWentWrong'));
      navigate('/core/regions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      await regionsApi.update(id!, data);
      toast.success('Đã cập nhật region');
      navigate('/core/regions');
    } catch (error: any) {
      console.error('Failed to update region:', error);
      toast.error(error.message || t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/core/regions');
  };

  if (loading && !region) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/core/regions')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sửa Region</h1>
          <p className="text-gray-600 mt-1">Cập nhật thông tin địa giới</p>
        </div>
      </div>

      <Card className="p-6">
        <RegionForm region={region} onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
      </Card>
    </div>
  );
}