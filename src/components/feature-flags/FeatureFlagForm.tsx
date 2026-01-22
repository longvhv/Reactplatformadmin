/**
 * Feature Flag Form Component
 * Form for creating and editing feature flags
 * 
 * ✅ ENHANCED 2026-01-20: Strict Schema Alignment + Timestamp Logic
 */

import React, { useState } from 'react';
import { useLanguage } from '../../providers/LanguageProvider';
import { 
  FeatureFlag, 
  CreateFeatureFlagRequest,
  UpdateFeatureFlagRequest,
  FlagType,
  Environment,
  TargetAudience
} from '../../api/featureFlagsApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Slider } from '../ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Code, Settings, Target, Flag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';

interface FeatureFlagFormProps {
  flag?: FeatureFlag;
  onSubmit: (data: CreateFeatureFlagRequest | UpdateFeatureFlagRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function FeatureFlagForm({ flag, onSubmit, onCancel, loading }: FeatureFlagFormProps) {
  const { t } = useLanguage();
  const isEdit = !!flag;
  const [activeTab, setActiveTab] = useState('general');

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

  // JSON States
  const [jsonInput, setJsonInput] = useState({
    conditions: JSON.stringify(flag?.conditions || {}, null, 2),
    metadata: JSON.stringify(flag?.metadata || {}, null, 2),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.flag_key.trim()) {
      newErrors.flag_key = t('featureFlags.validation.keyRequired') || 'Flag key is required';
    } else if (!/^[a-z0-9_]+$/.test(formData.flag_key)) {
      newErrors.flag_key = t('featureFlags.validation.keyFormat') || 'Only lowercase letters, numbers and underscores allowed';
    }

    if (!formData.flag_name.trim()) {
      newErrors.flag_name = t('featureFlags.validation.nameRequired') || 'Flag name is required';
    }

    if (formData.percentage_rollout < 0 || formData.percentage_rollout > 100) {
      newErrors.percentage_rollout = t('featureFlags.validation.rolloutRange') || 'Rollout must be between 0 and 100';
    }

    // JSON Validation
    try {
      JSON.parse(jsonInput.conditions);
    } catch (e) {
      newErrors.conditions = 'Invalid JSON format for Conditions';
    }

    try {
      JSON.parse(jsonInput.metadata);
    } catch (e) {
      newErrors.metadata = 'Invalid JSON format for Metadata';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const currentTimestamp = new Date().toISOString();
    
    const submitData: any = {
      flag_key: formData.flag_key.trim(),
      flag_name: formData.flag_name.trim(),
      flag_type: formData.flag_type,
      environment: formData.environment,
      is_enabled: formData.is_enabled,
      target_audience: formData.target_audience,
      percentage_rollout: Math.round(formData.percentage_rollout),
      conditions: JSON.parse(jsonInput.conditions),
      metadata: JSON.parse(jsonInput.metadata),
      description: formData.description.trim() || undefined,
    };

    // Handle timestamps logic
    if (isEdit && flag) {
      // Logic for Update
      if (formData.is_enabled !== flag.is_enabled) {
        if (formData.is_enabled) {
          submitData.enabled_at = currentTimestamp;
          // We generally keep disabled_at history or clear it? 
          // Schema says `disabled_at` timestamp. It doesn't imply history. 
          // Usually we clear the opposite timestamp or keep it as "last disabled at".
          // Let's assume we just update the one that happened.
        } else {
          submitData.disabled_at = currentTimestamp;
        }
      }
    } else {
      // Logic for Create
      if (formData.is_enabled) {
        submitData.enabled_at = currentTimestamp;
      }
    }

    onSubmit(submitData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleJsonChange = (field: keyof typeof jsonInput, value: string) => {
    setJsonInput(prev => ({ ...prev, [field]: value }));
    try {
      JSON.parse(value);
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    } catch (e) {
      setErrors(prev => ({ ...prev, [field]: 'Invalid JSON format' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-10">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="general">General Info</TabsTrigger>
          <TabsTrigger value="targeting">Targeting & Rules</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* --- GENERAL TAB --- */}
        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-indigo-600" />
                Basic Information
              </CardTitle>
              <CardDescription>Define the core properties of the feature flag</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Flag Key */}
                <div>
                  <Label htmlFor="flag_key" className="required">
                    Flag Key <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="flag_key"
                    value={formData.flag_key}
                    onChange={(e) => handleChange('flag_key', e.target.value)}
                    placeholder="e.g. new_checkout_flow"
                    disabled={isEdit}
                    className={errors.flag_key ? 'border-red-500' : ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Unique identifier used in code. Cannot be changed later.
                  </p>
                  {errors.flag_key && (
                    <p className="text-xs text-red-500 mt-1">{errors.flag_key}</p>
                  )}
                </div>

                {/* Flag Name */}
                <div>
                  <Label htmlFor="flag_name" className="required">
                    Display Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="flag_name"
                    value={formData.flag_name}
                    onChange={(e) => handleChange('flag_name', e.target.value)}
                    placeholder="e.g. New Checkout Flow"
                    className={errors.flag_name ? 'border-red-500' : ''}
                  />
                  {errors.flag_name && (
                    <p className="text-xs text-red-500 mt-1">{errors.flag_name}</p>
                  )}
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe what this feature flag controls..."
                    rows={3}
                  />
                </div>

                {/* Flag Type */}
                <div>
                  <Label htmlFor="flag_type">Type</Label>
                  <Select 
                    value={formData.flag_type} 
                    onValueChange={(value) => handleChange('flag_type', value as FlagType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boolean">Boolean (On/Off)</SelectItem>
                      <SelectItem value="feature">Feature Release</SelectItem>
                      <SelectItem value="experiment">Experiment (A/B)</SelectItem>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="release">Permission / Entitlement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Environment */}
                <div>
                  <Label htmlFor="environment">Environment</Label>
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
              </div>

              {/* Enabled Toggle */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div>
                  <Label htmlFor="is_enabled" className="text-base font-medium">
                    Feature Status
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Master switch. If disabled, the feature is off for everyone regardless of rules.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${formData.is_enabled ? 'text-green-600' : 'text-gray-500'}`}>
                    {formData.is_enabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                  <Switch
                    id="is_enabled"
                    checked={formData.is_enabled}
                    onCheckedChange={(checked) => handleChange('is_enabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TARGETING TAB --- */}
        <TabsContent value="targeting" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                Targeting Rules
              </CardTitle>
              <CardDescription>Control who sees this feature</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Target Audience */}
              <div>
                <Label htmlFor="target_audience" className="mb-2 block">Target Audience</Label>
                <Select 
                  value={formData.target_audience} 
                  onValueChange={(value) => handleChange('target_audience', value as TargetAudience)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="internal">Internal Users Only</SelectItem>
                    <SelectItem value="beta-testers">Beta Testers</SelectItem>
                    <SelectItem value="premium">Premium Plans</SelectItem>
                    <SelectItem value="enterprise">Enterprise Plans</SelectItem>
                    <SelectItem value="developers">Developers</SelectItem>
                    <SelectItem value="mobile">Mobile Users</SelectItem>
                    <SelectItem value="business">Business Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Percentage Rollout */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label className="text-base">Percentage Rollout</Label>
                    <p className="text-xs text-gray-500">Randomly select a percentage of users</p>
                  </div>
                  <span className="text-lg font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded">
                    {formData.percentage_rollout}%
                  </span>
                </div>
                <Slider
                  value={[formData.percentage_rollout]}
                  onValueChange={(value) => handleChange('percentage_rollout', value[0])}
                  max={100}
                  step={1}
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0% (Off)</span>
                  <span>50%</span>
                  <span>100% (All)</span>
                </div>
                {errors.percentage_rollout && (
                  <p className="text-xs text-red-500 mt-1">{errors.percentage_rollout}</p>
                )}
              </div>

              {/* Conditions JSON */}
              <div>
                <Label className="mb-2 block flex items-center gap-2">
                  <Code className="w-4 h-4" /> Advanced Conditions (JSON)
                </Label>
                <Textarea
                  value={jsonInput.conditions}
                  onChange={(e) => handleJsonChange('conditions', e.target.value)}
                  rows={6}
                  className={`font-mono text-xs bg-gray-50 ${errors.conditions ? 'border-red-500' : ''}`}
                  placeholder={`{ "user_ids": ["123", "456"], "country": "VN" }`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  JSON object defining complex rules (e.g. specific user IDs, email domains, etc.)
                </p>
                {errors.conditions && (
                  <p className="text-xs text-red-500 mt-1">{errors.conditions}</p>
                )}
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ADVANCED TAB --- */}
        <TabsContent value="advanced" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                Advanced Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Metadata JSON */}
              <div>
                <Label className="mb-2 block flex items-center gap-2">
                  <Code className="w-4 h-4" /> Metadata (JSON)
                </Label>
                <Textarea
                  value={jsonInput.metadata}
                  onChange={(e) => handleJsonChange('metadata', e.target.value)}
                  rows={6}
                  className={`font-mono text-xs bg-gray-50 ${errors.metadata ? 'border-red-500' : ''}`}
                  placeholder={`{ "ticket_id": "JIRA-123", "owner": "team-growth" }`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Additional data attached to this flag for documentation or audit purposes.
                </p>
                {errors.metadata && (
                  <p className="text-xs text-red-500 mt-1">{errors.metadata}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                <span>Saving...</span>
              </div>
            ) : (
              <>{isEdit ? (t('common.saveChanges') || 'Update Flag') : (t('featureFlags.create') || 'Create Flag')}</>
            )}
          </Button>
        </div>
      </Tabs>
    </form>
  );
}