/**
 * Settings API
 * 
 * Manages system-wide settings including general configuration and security settings.
 */

import { apiClient } from './adapters';

// ============================================================================
// TYPES
// ============================================================================

export interface GeneralSettings {
  id?: string;
  siteName: string;
  siteUrl: string;
  contactEmail: string;
  supportEmail?: string;
  description?: string;
  logo?: string;
  favicon?: string;
  timezone?: string;
  language?: string;
  currency?: string;
  dateFormat?: string;
  timeFormat?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SecuritySettings {
  id?: string;
  // MFA Settings
  mfaEnabled: boolean;
  mfaEnforced?: boolean;
  mfaMethods?: ('totp' | 'sms' | 'email')[];
  
  // Session Settings
  sessionTimeout: number; // in minutes
  sessionTimeoutWarning?: number; // in minutes before timeout
  maxActiveSessions?: number;
  
  // Password Policy
  passwordPolicy: {
    minLength: number;
    maxLength?: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    specialChars?: string;
    preventReuse?: number; // number of previous passwords to check
    expiryDays?: number; // force password change after X days
  };
  
  // IP & Access Control
  ipWhitelist?: string[];
  ipBlacklist?: string[];
  allowedCountries?: string[];
  blockedCountries?: string[];
  
  // Login Settings
  maxLoginAttempts?: number;
  lockoutDuration?: number; // in minutes
  requireEmailVerification?: boolean;
  
  // Audit
  auditLogRetention?: number; // in days
  
  createdAt?: string;
  updatedAt?: string;
}

export interface SettingsUpdateResult {
  success: boolean;
  data?: GeneralSettings | SecuritySettings;
  message?: string;
}

// ============================================================================
// API METHODS
// ============================================================================

export const settingsApi = {
  // ------------------------------------------------------------------------
  // GENERAL SETTINGS
  // ------------------------------------------------------------------------
  
  /**
   * Get general settings
   */
  getGeneral: async (): Promise<GeneralSettings> => {
    try {
      const response = await apiClient.get<GeneralSettings>('/api/settings/general');
      return response;
    } catch (error: any) {
      console.error('Failed to get general settings:', error);
      // Return defaults on error
      return {
        siteName: 'SaaS Platform',
        siteUrl: window.location.origin,
        contactEmail: 'contact@example.com',
        timezone: 'UTC',
        language: 'en',
        currency: 'USD',
      };
    }
  },
  
  /**
   * Update general settings
   */
  updateGeneral: async (data: Partial<GeneralSettings>): Promise<SettingsUpdateResult> => {
    try {
      const response = await apiClient.put<GeneralSettings>('/api/settings/general', data);
      return {
        success: true,
        data: response,
        message: 'General settings updated successfully',
      };
    } catch (error: any) {
      console.error('Failed to update general settings:', error);
      throw error;
    }
  },
  
  /**
   * Reset general settings to defaults
   */
  resetGeneral: async (): Promise<SettingsUpdateResult> => {
    try {
      const response = await apiClient.post<GeneralSettings>('/api/settings/general/reset');
      return {
        success: true,
        data: response,
        message: 'General settings reset to defaults',
      };
    } catch (error: any) {
      console.error('Failed to reset general settings:', error);
      throw error;
    }
  },
  
  // ------------------------------------------------------------------------
  // SECURITY SETTINGS
  // ------------------------------------------------------------------------
  
  /**
   * Get security settings
   */
  getSecurity: async (): Promise<SecuritySettings> => {
    try {
      const response = await apiClient.get<SecuritySettings>('/api/settings/security');
      return response;
    } catch (error: any) {
      console.error('Failed to get security settings:', error);
      // Return defaults on error
      return {
        mfaEnabled: false,
        sessionTimeout: 30,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
        },
      };
    }
  },
  
  /**
   * Update security settings
   */
  updateSecurity: async (data: Partial<SecuritySettings>): Promise<SettingsUpdateResult> => {
    try {
      const response = await apiClient.put<SecuritySettings>('/api/settings/security', data);
      return {
        success: true,
        data: response,
        message: 'Security settings updated successfully',
      };
    } catch (error: any) {
      console.error('Failed to update security settings:', error);
      throw error;
    }
  },
  
  /**
   * Reset security settings to defaults
   */
  resetSecurity: async (): Promise<SettingsUpdateResult> => {
    try {
      const response = await apiClient.post<SecuritySettings>('/api/settings/security/reset');
      return {
        success: true,
        data: response,
        message: 'Security settings reset to defaults',
      };
    } catch (error: any) {
      console.error('Failed to reset security settings:', error);
      throw error;
    }
  },
  
  /**
   * Test security settings (validate without saving)
   */
  testSecurity: async (data: Partial<SecuritySettings>): Promise<{ valid: boolean; errors?: string[] }> => {
    try {
      const response = await apiClient.post<{ valid: boolean; errors?: string[] }>(
        '/api/settings/security/test',
        data
      );
      return response;
    } catch (error: any) {
      console.error('Failed to test security settings:', error);
      return {
        valid: false,
        errors: [error.message || 'Validation failed'],
      };
    }
  },
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export const validateGeneralSettings = (data: Partial<GeneralSettings>): string[] => {
  const errors: string[] = [];
  
  if (data.siteName && data.siteName.length < 3) {
    errors.push('Site name must be at least 3 characters');
  }
  
  if (data.siteUrl && !isValidUrl(data.siteUrl)) {
    errors.push('Invalid site URL');
  }
  
  if (data.contactEmail && !isValidEmail(data.contactEmail)) {
    errors.push('Invalid contact email');
  }
  
  return errors;
};

export const validateSecuritySettings = (data: Partial<SecuritySettings>): string[] => {
  const errors: string[] = [];
  
  if (data.sessionTimeout && (data.sessionTimeout < 5 || data.sessionTimeout > 1440)) {
    errors.push('Session timeout must be between 5 and 1440 minutes');
  }
  
  if (data.passwordPolicy) {
    const { minLength, maxLength } = data.passwordPolicy;
    
    if (minLength < 6 || minLength > 128) {
      errors.push('Password minimum length must be between 6 and 128');
    }
    
    if (maxLength && maxLength < minLength) {
      errors.push('Password maximum length must be greater than minimum');
    }
  }
  
  return errors;
};

// Helper functions
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
