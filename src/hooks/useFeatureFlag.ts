/**
 * useFeatureFlag Hook
 * Hook for checking if a specific feature flag is enabled
 */

import { useState, useEffect } from 'react';
import { featureFlagsApi, Environment } from '../api/featureFlagsApi';

interface UseFeatureFlagOptions {
  key: string;
  environment?: Environment;
  defaultValue?: boolean;
  autoCheck?: boolean;
}

export function useFeatureFlag(options: UseFeatureFlagOptions) {
  const { key, environment = 'production', defaultValue = false, autoCheck = true } = options;
  
  const [enabled, setEnabled] = useState<boolean>(defaultValue);
  const [loading, setLoading] = useState(false);
  const [exists, setExists] = useState(false);

  const checkFlag = async () => {
    if (!key) {
      setEnabled(defaultValue);
      setExists(false);
      return;
    }

    setLoading(true);
    
    try {
      const response = await featureFlagsApi.checkFlag(key, environment);
      
      setEnabled(response.enabled);
      setExists(response.exists);
      
      console.log(`🚩 Feature flag "${key}":`, response.enabled ? 'ENABLED' : 'DISABLED');
      
    } catch (err: any) {
      console.error(`❌ Error checking flag "${key}":`, err?.message);
      setEnabled(defaultValue);
      setExists(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoCheck) {
      checkFlag();
    }
  }, [key, environment, autoCheck]);

  return {
    enabled,
    loading,
    exists,
    checkFlag,
  };
}

/**
 * Simple function to check flag synchronously (for one-time checks)
 * Returns a promise that resolves to boolean
 */
export async function isFeatureEnabled(
  key: string, 
  environment: Environment = 'production',
  defaultValue = false
): Promise<boolean> {
  try {
    const response = await featureFlagsApi.checkFlag(key, environment);
    return response.enabled;
  } catch (err) {
    console.error(`Error checking flag "${key}":`, err);
    return defaultValue;
  }
}
