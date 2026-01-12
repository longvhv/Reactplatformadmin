/**
 * Add App Component Page
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../providers/LanguageProvider';
import { appComponentApi } from '../api/appComponentApi';
import { AppComponentForm } from '../components/systemCategories/AppComponentForm';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function AddAppComponentPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      await appComponentApi.create({
        code: data.code,
        name: data.name,
        componentId: data.componentId || data.code.toLowerCase().replace(/_/g, '-'),
        componentType: data.componentType || 'page',
        route: data.route,
        icon: data.icon,
        parentId: data.parentId,
        permissions: data.permissions || [],
        isVisible: data.isVisible ?? true,
        order: data.order || 0,
        status: data.status ?? 1,
        description: data.description,
        metadata: data.metadata || {},
      });
      toast.success('Đã tạo component thành công');
      navigate('/app-components');
    } catch (error: any) {
      console.error('Failed to create app component:', error);
      toast.error(error.message || t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/app-components');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app-components')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Thêm App Component</h1>
          <p className="text-gray-600 mt-1">Tạo thành phần ứng dụng mới</p>
        </div>
      </div>

      <Card className="p-6">
        <AppComponentForm onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
      </Card>
    </div>
  );
}