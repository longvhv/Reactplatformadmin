/**
 * Add Feature Flag Page
 * Page for creating a new feature flag
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useLanguage } from '@/providers/LanguageProvider';
import { Flag } from 'lucide-react';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { FeatureFlagForm } from '@/components/feature-flags/FeatureFlagForm';
import { featureFlagsApi, CreateFeatureFlagRequest } from '@/api/featureFlagsApi';
import { toast } from 'sonner@2.0.3';

export default function AddFeatureFlagPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateFeatureFlagRequest) => {
    setLoading(true);
    
    try {
      console.log('📝 Creating feature flag:', data);
      
      const response = await createFeatureFlag(data);
      
      console.log('✅ Feature flag created:', response);
      
      toast.success(t('featureFlags.createSuccess'));
      
      navigate('/platform/feature-flags');
      
    } catch (error: any) {
      console.error('❌ Error creating feature flag:', error);
      
      const errorMessage = error?.message || t('featureFlags.createError');
      
      toast.error(t('featureFlags.createError'), {
        description: errorMessage,
        duration: 7000,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/platform/feature-flags');
  };

  return (
    <FormPageLayout
      mode="add"
      title={t('featureFlags.add')}
      description={t('featureFlags.addDescription')}
      icon={Flag}
      backPath="/platform/feature-flags"
      backLabel={t('featureFlags.backToList')}
    >
      <FeatureFlagForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </FormPageLayout>
  );
}