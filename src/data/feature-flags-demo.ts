/**
 * Feature Flags Demo Data
 */

export interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_name: string;
  description?: string;
  is_enabled: boolean;
  environment: 'development' | 'staging' | 'beta' | 'production';
  flag_type: 'boolean' | 'feature' | 'release' | 'experiment';
  target_audience?: string;
  percentage_rollout: number;
  conditions?: Record<string, any>;
  metadata?: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
  enabled_at?: string;
  disabled_at?: string;
}

export const FLAG_TYPES = [
  { value: 'boolean', label: 'Boolean', description: 'Simple on/off flag' },
  { value: 'feature', label: 'Feature', description: 'Feature toggle' },
  { value: 'release', label: 'Release', description: 'Release toggle' },
  { value: 'experiment', label: 'Experiment', description: 'A/B testing' },
] as const;

export const ENVIRONMENTS = [
  { value: 'development', label: 'Development', color: 'bg-purple-100 text-purple-800' },
  { value: 'staging', label: 'Staging', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'beta', label: 'Beta', color: 'bg-orange-100 text-orange-800' },
  { value: 'production', label: 'Production', color: 'bg-green-100 text-green-800' },
] as const;

export const TARGET_AUDIENCES = [
  { value: 'all', label: 'All Users' },
  { value: 'internal', label: 'Internal Users' },
  { value: 'beta-testers', label: 'Beta Testers' },
  { value: 'premium', label: 'Premium Users' },
  { value: 'business', label: 'Business Users' },
  { value: 'enterprise', label: 'Enterprise Users' },
  { value: 'developers', label: 'Developers' },
  { value: 'mobile', label: 'Mobile Users' },
] as const;
