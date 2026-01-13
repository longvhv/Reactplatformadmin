/**
 * Edit Service Package Page
 * 
 * Page for editing existing service packages
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getServicePackageById,
  updateServicePackage,
  ServicePackage,
} from '../api/servicePackages';
import { ServicePackageForm } from '../components/ServicePackageForm';
import { useLanguage } from '../providers/LanguageProvider';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function EditServicePackagePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [pkg, setPkg] = useState<ServicePackage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (id) {
      loadPackage(id);
    }
  }, [id]);

  async function loadPackage(packageId: string) {
    try {
      setIsFetching(true);
      const data = await getServicePackageById(packageId);
      if (!data) {
        toast.error(t('packageNotFound') || 'Package not found');
        navigate('/core/service-packages');
        return;
      }
      setPkg(data);
    } catch (error) {
      console.error('Failed to load package:', error);
      toast.error(t('failedToLoad') || 'Failed to load package');
      navigate('/core/service-packages');
    } finally {
      setIsFetching(false);
    }
  }

  async function handleSubmit(data: Partial<ServicePackage>) {
    if (!id) return;

    try {
      setIsLoading(true);
      await updateServicePackage(id, data);
      toast.success(t('packageUpdated') || 'Service package updated successfully');
      navigate('/core/service-packages');
    } catch (error: any) {
      console.error('Failed to update package:', error);
      toast.error(error.message || t('failedToUpdate') || 'Failed to update package');
    } finally {
      setIsLoading(false);
    }
  }

  function handleCancel() {
    navigate('/core/service-packages');
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">{t('loading') || 'Loading...'}</div>
      </div>
    );
  }

  if (!pkg) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleCancel}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('editServicePackage') || 'Edit Service Package'}
          </h1>
          <p className="text-gray-600 mt-1">{pkg.package_name}</p>
        </div>
      </div>

      {/* Form */}
      <ServicePackageForm
        package={pkg}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
}