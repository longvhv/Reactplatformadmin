/**
 * Add User Registration Page
 * Create new registration log entry
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  createUserRegistrationLog,
  UserRegistrationCreateData,
} from '../api/userRegistrationLogsApi';
import { UserRegistrationForm } from '../components/user-registration/UserRegistrationForm';
import { Button } from '../components/ui/button';
import { toast } from 'sonner@2.0.3';

export default function AddUserRegistrationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: UserRegistrationCreateData) => {
    try {
      setIsLoading(true);
      await createUserRegistrationLog(data);
      toast.success(t('userRegistration.createSuccess'));
      navigate('/core/user-registration-telemetry');
    } catch (error) {
      console.error('Error creating registration log:', error);
      toast.error(t('userRegistration.createError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/core/user-registration-telemetry')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t('userRegistration.add')}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {t('userRegistration.addDescription')}
        </p>
      </div>

      {/* Form */}
      <div className="max-w-3xl">
        <UserRegistrationForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}
