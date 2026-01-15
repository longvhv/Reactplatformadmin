/**
 * Edit System Category Page
 * Page for editing existing system category
 * ✅ UPDATED 2026-01-15: Unified design with FormPageLayout
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Folder, RefreshCw } from 'lucide-react';
import { useLanguage } from '../providers/LanguageProvider';
import { systemCategoryApi, SystemCategory } from '../api/systemCategoryApi';
import { EnhancedSystemCategoryForm } from '../components/systemCategories/EnhancedSystemCategoryForm';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
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
      setSubmitting(true);
      await systemCategoryApi.update(id!, data);
      toast.success(t('systemCategories.updateSuccess'));
      navigate('/core/system-categories');
    } catch (error: any) {
      console.error('Failed to update category:', error);
      toast.error(error.message || t('errors.somethingWentWrong'));
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/core/system-categories');
  };

  if (loading && !category) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return null;
  }

  return (
    <FormPageLayout
      mode="edit"
      title={t('systemCategories.editCategory')}
      description={t('systemCategories.editCategoryDescription')}
      icon={Folder}
      backPath="/core/system-categories"
      backLabel={t('common.backToList')}
    >
      <EnhancedSystemCategoryForm 
        category={category}
        onSubmit={handleSubmit} 
        onCancel={handleCancel} 
        loading={submitting} 
      />
    </FormPageLayout>
  );
}

export default EditSystemCategoryPage;