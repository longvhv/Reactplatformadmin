/**
 * Edit Region Page
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../providers/LanguageProvider';
import { regionsApi, Region } from '../api/regionsApi';
import { RegionForm } from '../components/regions/RegionForm';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function EditRegionPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadRegion();
    }
  }, [id]);

  const loadRegion = async () => {
    try {
      setLoading(true);
      const data = await regionsApi.getById(id!);
      if (data) {
        setRegion(data);
      } else {
        toast.error('Region không tồn tại');
        navigate('/regions');
      }
    } catch (error) {
      console.error('Failed to load region:', error);
      toast.error(t('errors.somethingWentWrong'));
      navigate('/regions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      await regionsApi.update(id!, data);
      toast.success('Đã cập nhật region');
      navigate('/regions');
    } catch (error: any) {
      console.error('Failed to update region:', error);
      toast.error(error.message || t('errors.somethingWentWrong'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/regions');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </div>
    );
  }

  if (!region) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/regions')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sửa Region</h1>
          <p className="text-gray-600 mt-1">Cập nhật thông tin địa giới</p>
        </div>
      </div>

      <Card className="p-6">
        <RegionForm region={region} onSubmit={handleSubmit} onCancel={handleCancel} loading={submitting} />
      </Card>
    </div>
  );
}
