/**
 * User Consents Service
 * Manages legal consent tracking for GDPR/CCPA compliance
 * Features: Consent lifecycle, withdrawal tracking, expiry management, renewal
 * Ready for migration to Golang microservice backend
 */

import { supabase } from '../utils/supabase/client';

// Types matching user_consents table
export interface UserConsent {
  _id: string; // UUID primary key
  user_id: string; // UUID foreign key to users
  legal_document_id: string; // UUID (legal document reference)
  consent_given: boolean; // Consent status
  consent_date: string; // Timestamp when consent was given
  consent_ip?: string; // IP address (max 45 chars for IPv6)
  consent_user_agent?: string; // Browser user agent
  consent_method?: ConsentMethod; // How consent was obtained
  document_version?: string; // Version of the consented document
  document_title?: string; // Title of the document
  document_type?: DocumentType; // Type of document
  withdrawn: boolean; // Withdrawal status
  withdrawn_date?: string; // Timestamp when withdrawn
  withdrawn_reason?: string; // Reason for withdrawal
  expires_at?: string; // Expiry timestamp
  renewal_required: boolean; // Whether renewal is needed
  last_renewed_at?: string; // Last renewal timestamp
  source_application?: string; // Application source
  source_page?: string; // Page URL where consent was given
  metadata?: Record<string, any>; // JSONB metadata
  created_at: string; // Creation timestamp
  updated_at: string; // Last update timestamp
}

export type ConsentMethod = 
  | 'web' 
  | 'mobile' 
  | 'api' 
  | 'email' 
  | 'signup' 
  | 'profile' 
  | 'checkout' 
  | 'other';

export type DocumentType = 
  | 'privacy_policy'
  | 'terms_of_service'
  | 'cookie_policy'
  | 'marketing'
  | 'data_processing'
  | 'third_party_sharing'
  | 'newsletter'
  | 'other';

export type ConsentStatus = 
  | 'active' 
  | 'withdrawn' 
  | 'expired' 
  | 'renewal_required';

export interface CreateConsentInput {
  user_id: string;
  legal_document_id: string;
  consent_given?: boolean;
  consent_ip?: string;
  consent_user_agent?: string;
  consent_method?: ConsentMethod;
  document_version?: string;
  document_title?: string;
  document_type?: DocumentType;
  expires_at?: string;
  renewal_required?: boolean;
  source_application?: string;
  source_page?: string;
  metadata?: Record<string, any>;
}

export interface UpdateConsentInput {
  consent_given?: boolean;
  document_version?: string;
  document_title?: string;
  document_type?: DocumentType;
  expires_at?: string;
  renewal_required?: boolean;
  metadata?: Record<string, any>;
}

export interface WithdrawConsentInput {
  withdrawn_reason?: string;
}

export interface ConsentStats {
  total: number;
  active: number;
  withdrawn: number;
  expired: number;
  renewalRequired: number;
  byDocumentType: Record<string, number>;
  byConsentMethod: Record<string, number>;
  byStatus: Record<ConsentStatus, number>;
}

export interface ConsentHistory {
  consent_id: string;
  action: 'given' | 'withdrawn' | 'renewed' | 'expired';
  timestamp: string;
  reason?: string;
  metadata?: Record<string, any>;
}

class UserConsentsService {
  private table = 'user_consents';

  /**
   * Determine consent status
   * @private
   */
  private getConsentStatus(consent: UserConsent): ConsentStatus {
    // Withdrawn takes precedence
    if (consent.withdrawn) {
      return 'withdrawn';
    }

    // Check if expired
    if (consent.expires_at && new Date(consent.expires_at) < new Date()) {
      return 'expired';
    }

    // Check if renewal required
    if (consent.renewal_required) {
      return 'renewal_required';
    }

    // Active consent
    return 'active';
  }

  /**
   * Check if consent is expired
   * @private
   */
  private isExpired(expiresAt?: string): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  /**
   * Detect user IP address
   * @private
   */
  private async detectUserIP(): Promise<string | undefined> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error detecting IP:', error);
      return undefined;
    }
  }

  /**
   * Get browser user agent
   * @private
   */
  private getUserAgent(): string {
    return navigator.userAgent;
  }

  /**
   * Get all consents for a user
   * Ready for: GET /api/v1/users/:userId/consents
   */
  async getByUserId(userId: string): Promise<UserConsent[]> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('user_id', userId)
        .order('consent_date', { ascending: false });

      if (error) {
        console.error('Error fetching consents:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getByUserId:', error);
      throw error;
    }
  }

  /**
   * Get single consent by ID
   * Ready for: GET /api/v1/users/:userId/consents/:id
   */
  async getById(id: string): Promise<UserConsent | null> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('_id', id)
        .single();

      if (error) {
        console.error('Error fetching consent:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  /**
   * Get consent by user and document
   * Ready for: GET /api/v1/users/:userId/consents/document/:documentId
   */
  async getByUserAndDocument(
    userId: string, 
    documentId: string
  ): Promise<UserConsent | null> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('user_id', userId)
        .eq('legal_document_id', documentId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('Error fetching consent:', error);
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error in getByUserAndDocument:', error);
      throw error;
    }
  }

  /**
   * Get consents by status
   * Ready for: GET /api/v1/users/:userId/consents?status=active
   */
  async getByStatus(userId: string, status: ConsentStatus): Promise<UserConsent[]> {
    try {
      const allConsents = await this.getByUserId(userId);
      return allConsents.filter(consent => this.getConsentStatus(consent) === status);
    } catch (error) {
      console.error('Error in getByStatus:', error);
      throw error;
    }
  }

  /**
   * Get consents by document type
   * Ready for: GET /api/v1/users/:userId/consents?document_type=privacy_policy
   */
  async getByDocumentType(
    userId: string, 
    documentType: DocumentType
  ): Promise<UserConsent[]> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('user_id', userId)
        .eq('document_type', documentType)
        .order('consent_date', { ascending: false });

      if (error) {
        console.error('Error fetching consents by type:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getByDocumentType:', error);
      throw error;
    }
  }

  /**
   * Get active consents
   * Ready for: GET /api/v1/users/:userId/consents/active
   */
  async getActive(userId: string): Promise<UserConsent[]> {
    return this.getByStatus(userId, 'active');
  }

  /**
   * Get withdrawn consents
   * Ready for: GET /api/v1/users/:userId/consents/withdrawn
   */
  async getWithdrawn(userId: string): Promise<UserConsent[]> {
    return this.getByStatus(userId, 'withdrawn');
  }

  /**
   * Get expired consents
   * Ready for: GET /api/v1/users/:userId/consents/expired
   */
  async getExpired(userId: string): Promise<UserConsent[]> {
    return this.getByStatus(userId, 'expired');
  }

  /**
   * Get consents requiring renewal
   * Ready for: GET /api/v1/users/:userId/consents/renewal-required
   */
  async getRenewalRequired(userId: string): Promise<UserConsent[]> {
    return this.getByStatus(userId, 'renewal_required');
  }

  /**
   * Create new consent
   * Ready for: POST /api/v1/users/:userId/consents
   */
  async create(input: CreateConsentInput): Promise<UserConsent> {
    try {
      // Check for existing consent
      const existing = await this.getByUserAndDocument(
        input.user_id, 
        input.legal_document_id
      );

      if (existing && !existing.withdrawn) {
        throw new Error('Active consent already exists for this document');
      }

      // Prepare consent data
      const consentData = {
        user_id: input.user_id,
        legal_document_id: input.legal_document_id,
        consent_given: input.consent_given ?? true,
        consent_date: new Date().toISOString(),
        consent_ip: input.consent_ip,
        consent_user_agent: input.consent_user_agent || this.getUserAgent(),
        consent_method: input.consent_method || 'web',
        document_version: input.document_version,
        document_title: input.document_title,
        document_type: input.document_type,
        withdrawn: false,
        expires_at: input.expires_at,
        renewal_required: input.renewal_required ?? false,
        source_application: input.source_application,
        source_page: input.source_page || window.location.href,
        metadata: input.metadata || {},
      };

      const { data, error } = await supabase
        .from(this.table)
        .insert([consentData])
        .select()
        .single();

      if (error) {
        console.error('Error creating consent:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  /**
   * Update consent
   * Ready for: PUT /api/v1/users/:userId/consents/:id
   */
  async update(id: string, input: UpdateConsentInput): Promise<UserConsent> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (input.consent_given !== undefined) {
        updateData.consent_given = input.consent_given;
      }

      if (input.document_version !== undefined) {
        updateData.document_version = input.document_version;
      }

      if (input.document_title !== undefined) {
        updateData.document_title = input.document_title;
      }

      if (input.document_type !== undefined) {
        updateData.document_type = input.document_type;
      }

      if (input.expires_at !== undefined) {
        updateData.expires_at = input.expires_at;
      }

      if (input.renewal_required !== undefined) {
        updateData.renewal_required = input.renewal_required;
      }

      if (input.metadata !== undefined) {
        updateData.metadata = input.metadata;
      }

      const { data, error } = await supabase
        .from(this.table)
        .update(updateData)
        .eq('_id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating consent:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  /**
   * Withdraw consent (GDPR right to withdraw)
   * Ready for: POST /api/v1/users/:userId/consents/:id/withdraw
   */
  async withdraw(id: string, input?: WithdrawConsentInput): Promise<UserConsent> {
    try {
      const updateData = {
        withdrawn: true,
        withdrawn_date: new Date().toISOString(),
        withdrawn_reason: input?.withdrawn_reason,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from(this.table)
        .update(updateData)
        .eq('_id', id)
        .select()
        .single();

      if (error) {
        console.error('Error withdrawing consent:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in withdraw:', error);
      throw error;
    }
  }

  /**
   * Renew consent
   * Ready for: POST /api/v1/users/:userId/consents/:id/renew
   */
  async renew(id: string, newExpiryDate?: string): Promise<UserConsent> {
    try {
      const current = await this.getById(id);
      if (!current) {
        throw new Error('Consent not found');
      }

      // Calculate new expiry (default: 1 year from now)
      const expiresAt = newExpiryDate || 
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      const updateData = {
        renewal_required: false,
        last_renewed_at: new Date().toISOString(),
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from(this.table)
        .update(updateData)
        .eq('_id', id)
        .select()
        .single();

      if (error) {
        console.error('Error renewing consent:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in renew:', error);
      throw error;
    }
  }

  /**
   * Delete consent
   * Ready for: DELETE /api/v1/users/:userId/consents/:id
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.table)
        .delete()
        .eq('_id', id);

      if (error) {
        console.error('Error deleting consent:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  /**
   * Get consent statistics
   * Ready for: GET /api/v1/users/:userId/consents/stats
   */
  async getStats(userId: string): Promise<ConsentStats> {
    try {
      const consents = await this.getByUserId(userId);

      const stats: ConsentStats = {
        total: consents.length,
        active: 0,
        withdrawn: 0,
        expired: 0,
        renewalRequired: 0,
        byDocumentType: {},
        byConsentMethod: {},
        byStatus: {
          active: 0,
          withdrawn: 0,
          expired: 0,
          renewal_required: 0,
        },
      };

      consents.forEach(consent => {
        const status = this.getConsentStatus(consent);

        // Count by status
        stats.byStatus[status]++;
        switch (status) {
          case 'active':
            stats.active++;
            break;
          case 'withdrawn':
            stats.withdrawn++;
            break;
          case 'expired':
            stats.expired++;
            break;
          case 'renewal_required':
            stats.renewalRequired++;
            break;
        }

        // Count by document type
        const docType = consent.document_type || 'other';
        stats.byDocumentType[docType] = (stats.byDocumentType[docType] || 0) + 1;

        // Count by consent method
        const method = consent.consent_method || 'other';
        stats.byConsentMethod[method] = (stats.byConsentMethod[method] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error in getStats:', error);
      throw error;
    }
  }

  /**
   * Bulk withdraw consents
   * Ready for: POST /api/v1/users/:userId/consents/bulk-withdraw
   */
  async bulkWithdraw(ids: string[], reason?: string): Promise<number> {
    try {
      const updateData = {
        withdrawn: true,
        withdrawn_date: new Date().toISOString(),
        withdrawn_reason: reason,
        updated_at: new Date().toISOString(),
      };

      const { error, count } = await supabase
        .from(this.table)
        .update(updateData)
        .in('_id', ids);

      if (error) {
        console.error('Error in bulk withdraw:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in bulkWithdraw:', error);
      throw error;
    }
  }

  /**
   * Bulk delete consents
   * Ready for: POST /api/v1/users/:userId/consents/bulk-delete
   */
  async bulkDelete(ids: string[]): Promise<number> {
    try {
      const { error, count } = await supabase
        .from(this.table)
        .delete()
        .in('_id', ids);

      if (error) {
        console.error('Error in bulk delete:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in bulkDelete:', error);
      throw error;
    }
  }

  /**
   * Get status display string
   */
  getStatusDisplay(status: ConsentStatus): string {
    const displays: Record<ConsentStatus, string> = {
      active: 'Active',
      withdrawn: 'Withdrawn',
      expired: 'Expired',
      renewal_required: 'Renewal Required',
    };
    return displays[status];
  }

  /**
   * Get status color class
   */
  getStatusColor(status: ConsentStatus): string {
    const colors: Record<ConsentStatus, string> = {
      active: 'green',
      withdrawn: 'red',
      expired: 'gray',
      renewal_required: 'yellow',
    };
    return colors[status];
  }

  /**
   * Get document type display
   */
  getDocumentTypeDisplay(type?: DocumentType): string {
    if (!type) return 'Other';
    const displays: Record<DocumentType, string> = {
      privacy_policy: 'Privacy Policy',
      terms_of_service: 'Terms of Service',
      cookie_policy: 'Cookie Policy',
      marketing: 'Marketing',
      data_processing: 'Data Processing',
      third_party_sharing: 'Third Party Sharing',
      newsletter: 'Newsletter',
      other: 'Other',
    };
    return displays[type];
  }

  /**
   * Get consent method display
   */
  getConsentMethodDisplay(method?: ConsentMethod): string {
    if (!method) return 'Other';
    const displays: Record<ConsentMethod, string> = {
      web: 'Web',
      mobile: 'Mobile',
      api: 'API',
      email: 'Email',
      signup: 'Sign Up',
      profile: 'Profile',
      checkout: 'Checkout',
      other: 'Other',
    };
    return displays[method];
  }

  /**
   * Format time ago
   */
  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now.getTime() - date.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  /**
   * Format time until expiry
   */
  getTimeUntilExpiry(expiresAt?: string): string {
    if (!expiresAt) return 'Never expires';

    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (days > 30) {
      const months = Math.floor(days / 30);
      return `${months} month${months > 1 ? 's' : ''} left`;
    }
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} left`;
    return 'Less than 1 minute';
  }

  /**
   * Check if consent needs attention
   */
  needsAttention(consent: UserConsent): boolean {
    const status = this.getConsentStatus(consent);
    return status === 'expired' || status === 'renewal_required';
  }

  /**
   * Export consents for GDPR compliance
   * Ready for: GET /api/v1/users/:userId/consents/export
   */
  async exportUserConsents(userId: string): Promise<string> {
    try {
      const consents = await this.getByUserId(userId);
      const exportData = consents.map(consent => ({
        id: consent._id,
        legal_document_id: consent.legal_document_id,
        document_title: consent.document_title,
        document_type: consent.document_type,
        document_version: consent.document_version,
        consent_given: consent.consent_given,
        consent_date: consent.consent_date,
        consent_method: consent.consent_method,
        withdrawn: consent.withdrawn,
        withdrawn_date: consent.withdrawn_date,
        withdrawn_reason: consent.withdrawn_reason,
        expires_at: consent.expires_at,
        renewal_required: consent.renewal_required,
        last_renewed_at: consent.last_renewed_at,
        source_application: consent.source_application,
        source_page: consent.source_page,
        metadata: consent.metadata,
        status: this.getConsentStatus(consent),
      }));

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error in exportUserConsents:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userConsentsService = new UserConsentsService();