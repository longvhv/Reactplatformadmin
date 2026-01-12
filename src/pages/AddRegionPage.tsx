/**
 * Add Region Page
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../providers/LanguageProvider';
import { regionsApi } from '../api/regionsApi';
import { RegionForm } from '../components/regions/RegionForm';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function AddRegionPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const type = (searchParams.get('type') || 'country') as 'country' | 'province' | 'district';

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      await regionsApi.create(data);
      toast.success('Đã tạo region thành công');
      navigate('/regions');
    } catch (error: any) {
      console.error('Failed to create region:', error);
      toast.error(error.message || t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/regions');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/regions')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Thêm Region</h1>
          <p className="text-gray-600 mt-1">Tạo địa giới mới</p>
        </div>
      </div>

      <Card className="p-6">
        <RegionForm type={type} onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
      </Card>
    </div>
  );
}
