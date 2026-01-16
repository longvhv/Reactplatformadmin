/**
 * Edit User Registration Page
 * Edit existing registration log entry
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  getUserRegistrationLogById,
  updateUserRegistrationLog,
  UserRegistrationLog,
  UserRegistrationUpdateData,
} from '../api/userRegistrationLogsApi';
import { UserRegistrationForm } from '../components/user-registration/UserRegistrationForm';
import { Button } from '../components/ui/button';
import { toast } from 'sonner@2.0.3';

export default function EditUserRegistrationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [log, setLog] = useState<UserRegistrationLog | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (id) {
      loadLog();
    }
  }, [id]);

  const loadLog = async () => {
    if (!id) return;
    
    try {
      setIsFetching(true);
      const data = await getUserRegistrationLogById(id);
      if (data) {
        setLog(data);
      } else {
        toast.error(t('userRegistration.notFound'));
        navigate('/core/user-registration-telemetry');
      }
    } catch (error) {
      console.error('Error loading log:', error);
      toast.error(t('userRegistration.loadError'));
      navigate('/core/user-registration-telemetry');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (data: UserRegistrationUpdateData) => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      await updateUserRegistrationLog(id, data);
      toast.success(t('userRegistration.updateSuccess'));
      navigate('/core/user-registration-telemetry');
    } catch (error) {
      console.error('Error updating log:', error);
      toast.error(t('userRegistration.updateError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!log) {
    return null;
  }

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
          {t('userRegistration.edit')}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {t('userRegistration.editDescription')}
        </p>
      </div>

      {/* Form */}
      <div className="max-w-3xl">
        <UserRegistrationForm log={log} onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}
