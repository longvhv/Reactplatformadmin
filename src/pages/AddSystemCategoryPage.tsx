/**
 * Add System Category Page
 * Page for creating new system category
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../providers/LanguageProvider';
import { systemCategoryApi } from '../api/systemCategoryApi';
import { EnhancedSystemCategoryForm } from '../components/systemCategories/EnhancedSystemCategoryForm';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
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
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/core/system-categories');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/core/system-categories')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('systemCategories.createCategory')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('systemCategories.addCategoryDescription')}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6">
        <EnhancedSystemCategoryForm onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
      </Card>
    </div>
  );
}

export default AddSystemCategoryPage;