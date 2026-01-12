/**
 * Edit App Component Page
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../providers/LanguageProvider';
import { appComponentApi, AppComponent } from '../api/appComponentApi';
import { AppComponentForm } from '../components/systemCategories/AppComponentForm';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function EditAppComponentPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [component, setComponent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadComponent();
    }
  }, [id]);

  const loadComponent = async () => {
    try {
      setLoading(true);
      const data = await appComponentApi.getById(id!);
      setComponent(data);
    } catch (error: any) {
      toast.error('Không thể tải component');
      console.error('Load component error:', error);
      navigate('/app-components');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      await appComponentApi.update(id!, {
        code: data.code,
        name: data.name,
        componentId: data.componentId,
        componentType: data.componentType,
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
      toast.success('Đã cập nhật component');
      navigate('/app-components');
    } catch (error: any) {
      console.error('Failed to update app component:', error);
      toast.error(error.message || t('errors.somethingWentWrong'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/app-components');
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

  if (!component) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app-components')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sửa App Component</h1>
          <p className="text-gray-600 mt-1">Cập nhật thông tin component</p>
        </div>
      </div>

      <Card className="p-6">
        <AppComponentForm
          category={component}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={submitting}
        />
      </Card>
    </div>
  );
}