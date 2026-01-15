/**
 * Edit System Category Page
 * Page for editing existing system category
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLanguage } from '../providers/LanguageProvider';
import { systemCategoryApi, SystemCategory } from '../api/systemCategoryApi';
import { EnhancedSystemCategoryForm } from '../components/systemCategories/EnhancedSystemCategoryForm';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function EditSystemCategoryPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [category, setCategory] = useState<SystemCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadCategory();
    }
  }, [id]);

  const loadCategory = async () => {
    try {
      setLoading(true);
      const data = await systemCategoryApi.getById(id!);
      if (!data) {
        toast.error(t('systemCategories.notFound'));
        navigate('/core/system-categories');
      }
      setCategory(data);
    } catch (error: any) {
      console.error('Failed to load category:', error);
      toast.error(t('errors.somethingWentWrong'));
      navigate('/core/system-categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      await systemCategoryApi.update(id!, data);
      toast.success(t('systemCategories.updateSuccess'));
      navigate('/core/system-categories');
    } catch (error: any) {
      console.error('Failed to update category:', error);
      toast.error(error.message || t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/core/system-categories');
  };

  if (loading && !category) {
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/core/system-categories')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('systemCategories.editCategory')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('systemCategories.editCategoryDescription')}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6">
        <EnhancedSystemCategoryForm
          category={category}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={submitting}
        />
      </Card>
    </div>
  );
}

export default EditSystemCategoryPage;