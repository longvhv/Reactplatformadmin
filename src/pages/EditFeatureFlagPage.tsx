/**
 * Edit Feature Flag Page
 * Page for editing an existing feature flag
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLanguage } from '@/providers/LanguageProvider';
import { Flag, Loader, AlertCircle } from 'lucide-react';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { FeatureFlagForm } from '@/components/feature-flags/FeatureFlagForm';
import { featureFlagsApi, UpdateFeatureFlagRequest, FeatureFlag } from '@/api/featureFlagsApi';
import { toast } from 'sonner@2.0.3';
import { Button } from '@/components/ui/button';

export default function EditFeatureFlagPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [flag, setFlag] = useState<FeatureFlag | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadFlag();
    }
  }, [id]);

  const loadFlag = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📥 Loading feature flag:', id);
      
      const data = await featureFlagsApi.getById(id);
      
      console.log('✅ Feature flag loaded:', data);
      setFlag(data);
      
    } catch (err: any) {
      const errorMessage = err?.message || t('featureFlags.loadError');
      console.error('❌ Error loading feature flag:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateFeatureFlagRequest) => {
    if (!id) return;
    
    setSaving(true);
    
    try {
      console.log('💾 Updating feature flag:', id, data);
      
      const response = await featureFlagsApi.update(id, data);
      
      console.log('✅ Feature flag updated:', response);
      
      toast.success(t('featureFlags.updateSuccess'), {
        description: t('featureFlags.updateSuccessDesc'),
        duration: 5000,
      });
      
      navigate('/core/feature-flags');
      
    } catch (error: any) {
      console.error('❌ Error updating feature flag:', error);
      
      const errorMessage = error?.message || t('featureFlags.updateError');
      
      toast.error(t('featureFlags.updateError'), {
        description: errorMessage,
        duration: 7000,
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/core/feature-flags');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !flag) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t('common.error')}</h2>
          <p className="text-gray-600 mb-4">{error || t('featureFlags.notFound')}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => loadFlag()}>{t('common.retry')}</Button>
            <Button variant="outline" onClick={() => navigate('/core/feature-flags')}>
              {t('featureFlags.backToList')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FormPageLayout
      mode="edit"
      title={t('featureFlags.edit')}
      description={t('featureFlags.editDescription', { name: flag.flag_name })}
      icon={Flag}
      backPath="/core/feature-flags"
      backLabel={t('featureFlags.backToList')}
    >
      <FeatureFlagForm
        flag={flag}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={saving}
      />
    </FormPageLayout>
  );
}
