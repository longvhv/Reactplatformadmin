/**
 * Add Region Page
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
      navigate('/core/regions');
    } catch (error: any) {
      console.error('Failed to create region:', error);
      toast.error(error.message || t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/core/regions');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/core/regions')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Thêm Region</h1>
          <p className="text-gray-600 mt-1">Tạo địa giới mới</p>
        </div>
      </div>

      <Card className="p-6">
        <RegionForm onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
      </Card>
    </div>
  );
}