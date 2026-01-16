/**
 * Feature Flag Form Component
 * Form for creating and editing feature flags - Under 400 lines
 */

import React, { useState } from 'react';
import { useLanguage } from '@/providers/LanguageProvider';
import { 
  FeatureFlag, 
  CreateFeatureFlagRequest,
  UpdateFeatureFlagRequest,
  FlagType,
  Environment,
  TargetAudience
} from '@/api/featureFlagsApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface FeatureFlagFormProps {
  flag?: FeatureFlag;
  onSubmit: (data: CreateFeatureFlagRequest | UpdateFeatureFlagRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function FeatureFlagForm({ flag, onSubmit, onCancel, loading }: FeatureFlagFormProps) {
  const { t } = useLanguage();
  const isEdit = !!flag;

  const [formData, setFormData] = useState({
    flag_key: flag?.flag_key || '',
    flag_name: flag?.flag_name || '',
    description: flag?.description || '',
    flag_type: (flag?.flag_type || 'boolean') as FlagType,
    environment: (flag?.environment || 'development') as Environment,
    is_enabled: flag?.is_enabled ?? false,
    target_audience: (flag?.target_audience || 'all') as TargetAudience,
    percentage_rollout: flag?.percentage_rollout ?? 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.flag_key.trim()) {
      newErrors.flag_key = t('featureFlags.validation.keyRequired');
    } else if (!/^[a-z0-9_]+$/.test(formData.flag_key)) {
      newErrors.flag_key = t('featureFlags.validation.keyFormat');
    }

    if (!formData.flag_name.trim()) {
      newErrors.flag_name = t('featureFlags.validation.nameRequired');
    }

    if (formData.percentage_rollout < 0 || formData.percentage_rollout > 100) {
      newErrors.percentage_rollout = t('featureFlags.validation.rolloutRange');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData: any = {
      flag_key: formData.flag_key.trim(),
      flag_name: formData.flag_name.trim(),
      flag_type: formData.flag_type,
      environment: formData.environment,
      is_enabled: formData.is_enabled,
      target_audience: formData.target_audience,
      percentage_rollout: formData.percentage_rollout,
    };

    if (formData.description.trim()) {
      submitData.description = formData.description.trim();
    }

    onSubmit(submitData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('featureFlags.basicInfo')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Flag Key */}
          <div>
            <Label htmlFor="flag_key" className="required">
              {t('featureFlags.flagKey')}
            </Label>
            <Input
              id="flag_key"
              value={formData.flag_key}
              onChange={(e) => handleChange('flag_key', e.target.value)}
              placeholder="new_feature_enabled"
              disabled={isEdit}
              className={errors.flag_key ? 'border-red-500' : ''}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('featureFlags.flagKeyHelp')}
            </p>
            {errors.flag_key && (
              <p className="text-xs text-red-500 mt-1">{errors.flag_key}</p>
            )}
          </div>

          {/* Flag Name */}
          <div>
            <Label htmlFor="flag_name" className="required">
              {t('featureFlags.flagName')}
            </Label>
            <Input
              id="flag_name"
              value={formData.flag_name}
              onChange={(e) => handleChange('flag_name', e.target.value)}
              placeholder={t('featureFlags.flagNamePlaceholder')}
              className={errors.flag_name ? 'border-red-500' : ''}
            />
            {errors.flag_name && (
              <p className="text-xs text-red-500 mt-1">{errors.flag_name}</p>
            )}
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <Label htmlFor="description">{t('featureFlags.description')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={t('featureFlags.descriptionPlaceholder')}
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('featureFlags.configuration')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Flag Type */}
          <div>
            <Label htmlFor="flag_type">{t('featureFlags.type')}</Label>
            <Select 
              value={formData.flag_type} 
              onValueChange={(value) => handleChange('flag_type', value as FlagType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="feature">Feature</SelectItem>
                <SelectItem value="release">Release</SelectItem>
                <SelectItem value="experiment">Experiment</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">{t('featureFlags.typeHelp')}</p>
          </div>

          {/* Environment */}
          <div>
            <Label htmlFor="environment">{t('featureFlags.environment')}</Label>
            <Select 
              value={formData.environment} 
              onValueChange={(value) => handleChange('environment', value as Environment)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="beta">Beta</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target Audience */}
          <div>
            <Label htmlFor="target_audience">{t('featureFlags.targetAudience')}</Label>
            <Select 
              value={formData.target_audience} 
              onValueChange={(value) => handleChange('target_audience', value as TargetAudience)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="beta-testers">Beta Testers</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="developers">Developers</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Enabled Toggle */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <Label htmlFor="is_enabled" className="text-base font-medium">
                {t('featureFlags.enabled')}
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                {t('featureFlags.enabledHelp')}
              </p>
            </div>
            <Switch
              id="is_enabled"
              checked={formData.is_enabled}
              onCheckedChange={(checked) => handleChange('is_enabled', checked)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('featureFlags.rollout')}</h3>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>{t('featureFlags.percentageRollout')}</Label>
            <span className="text-sm font-medium text-indigo-600">
              {formData.percentage_rollout}%
            </span>
          </div>
          <Slider
            value={[formData.percentage_rollout]}
            onValueChange={(value) => handleChange('percentage_rollout', value[0])}
            max={100}
            step={5}
            className="mb-2"
          />
          <p className="text-xs text-gray-500">
            {t('featureFlags.rolloutHelp')}
          </p>
          {errors.percentage_rollout && (
            <p className="text-xs text-red-500 mt-1">{errors.percentage_rollout}</p>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {loading ? (
            <>{t('common.saving')}</>
          ) : (
            <>{isEdit ? t('common.saveChanges') : t('featureFlags.create')}</>
          )}
        </Button>
      </div>
    </form>
  );
}
