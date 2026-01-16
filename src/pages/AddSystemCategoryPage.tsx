/**
 * Add System Category Page
 * Page for creating new system category
 * ✅ UPDATED 2026-01-15: Unified design with FormPageLayout
 */

import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useLanguage } from '../providers/LanguageProvider';
import { systemCategoryApi } from '../api/systemCategoriesApi';
import { EnhancedSystemCategoryForm } from '../components/systemCategories/EnhancedSystemCategoryForm';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { toast } from 'sonner@2.0.3';

export function AddSystemCategoryPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      await systemCategoryApi.create(data);
      toast.success(t('systemCategories.createSuccess'));
      navigate('/core/system-categories');
    } catch (error: any) {
      console.error('Failed to create system category:', error);
      toast.error(error.message || t('errors.somethingWentWrong'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/core/system-categories');
  };

  return (
    <FormPageLayout
      mode="add"
      title={t('systemCategories.createCategory')}
      description={t('systemCategories.addCategoryDescription')}
      icon={Plus}
      backPath="/core/system-categories"
      backLabel={t('common.backToList')}
    >
      <EnhancedSystemCategoryForm 
        onSubmit={handleSubmit} 
        onCancel={handleCancel} 
        loading={loading} 
      />
    </FormPageLayout>
  );
}

export default AddSystemCategoryPage;