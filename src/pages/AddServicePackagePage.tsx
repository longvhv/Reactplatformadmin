/**
 * Add Service Package Page
 * 
 * Page for creating new service packages
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createServicePackage, ServicePackage } from '../api/servicePackages';
import { ServicePackageForm } from '../components/ServicePackageForm';
import { useLanguage } from '../providers/LanguageProvider';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function AddServicePackagePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(data: Partial<ServicePackage>) {
    try {
      setIsLoading(true);
      await createServicePackage(data as any);
      toast.success(t('packageCreated') || 'Service package created successfully');
      navigate('/core/service-packages');
    } catch (error: any) {
      console.error('Failed to create package:', error);
      toast.error(error.message || t('failedToCreate') || 'Failed to create package');
    } finally {
      setIsLoading(false);
    }
  }

  function handleCancel() {
    navigate('/core/service-packages');
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
            {t('addServicePackage') || 'Add Service Package'}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('createNewPackage') || 'Create a new service package with features and limits'}
          </p>
        </div>
      </div>

      {/* Form */}
      <ServicePackageForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
}