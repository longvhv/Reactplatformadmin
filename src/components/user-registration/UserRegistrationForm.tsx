/**
 * User Registration Form Component
 * Form for creating and editing registration logs
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../providers/LanguageProvider';
import { useRouter } from '../shim/next-navigation';
import {
  UserRegistrationLog,
  UserRegistrationCreateData,
  UserRegistrationUpdateData,
  getRegistrationSources,
  getDataRegions,
} from '../../api/userRegistrationLogsApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface UserRegistrationFormProps {
  log?: UserRegistrationLog;
  isLoading?: boolean;
  onSubmit: (data: UserRegistrationCreateData | UserRegistrationUpdateData) => Promise<void>;
}

export const UserRegistrationForm: React.FC<UserRegistrationFormProps> = ({
  log,
  isLoading,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const router = useRouter();

  const [formData, setFormData] = useState<UserRegistrationCreateData>({
    tenant_id: log?.tenant_id || null,
    user_id: log?.user_id || null,
    registration_source: log?.registration_source || null,
    data_region: log?.data_region || null,
  });

  const [sources, setSources] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const [sourcesData, regionsData] = await Promise.all([
        getRegistrationSources(),
        getDataRegions(),
      ]);
      setSources(sourcesData);
      setRegions(regionsData);
    } catch (error) {
      console.error('Error loading options:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (field: keyof UserRegistrationCreateData, value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value || null }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('userRegistration.basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tenant ID */}
          <div className="space-y-2">
            <Label htmlFor="tenant_id">
              {t('userRegistration.tenantId')}
            </Label>
            <Input
              id="tenant_id"
              type="text"
              placeholder="00000000-0000-0000-0000-000000000000"
              value={formData.tenant_id || ''}
              onChange={(e) => handleChange('tenant_id', e.target.value)}
              className="font-mono"
            />
          </div>

          {/* User ID */}
          <div className="space-y-2">
            <Label htmlFor="user_id">
              {t('userRegistration.userId')}
            </Label>
            <Input
              id="user_id"
              type="text"
              placeholder="00000000-0000-0000-0000-000000000000"
              value={formData.user_id || ''}
              onChange={(e) => handleChange('user_id', e.target.value)}
              className="font-mono"
            />
          </div>

          {/* Registration Source */}
          <div className="space-y-2">
            <Label htmlFor="registration_source">
              {t('userRegistration.registrationSource')}
            </Label>
            {sources.length > 0 ? (
              <Select
                value={formData.registration_source || 'custom'}
                onValueChange={(value) =>
                  handleChange('registration_source', value === 'custom' ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('userRegistration.selectSource')} />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">
                    {t('userRegistration.customSource')}
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="registration_source"
                type="text"
                placeholder="web, mobile, api, oauth, etc."
                value={formData.registration_source || ''}
                onChange={(e) => handleChange('registration_source', e.target.value)}
              />
            )}
          </div>

          {/* Data Region */}
          <div className="space-y-2">
            <Label htmlFor="data_region">
              {t('userRegistration.dataRegion')}
            </Label>
            {regions.length > 0 ? (
              <Select
                value={formData.data_region || 'custom'}
                onValueChange={(value) =>
                  handleChange('data_region', value === 'custom' ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('userRegistration.selectRegion')} />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">
                    {t('userRegistration.customRegion')}
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="data_region"
                type="text"
                placeholder="us-east-1, eu-west-1, etc."
                value={formData.data_region || ''}
                onChange={(e) => handleChange('data_region', e.target.value)}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/core/user-registration-telemetry')}
          disabled={isLoading}
        >
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </form>
  );
};
