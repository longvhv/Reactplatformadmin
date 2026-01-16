/**
 * Tenant Domains Service
 * Manages domain verification and policies for tenants
 * Ready for migration to Golang microservice backend
 */

import { supabase } from '../utils/supabase/client';

// Enums matching database constraints
export type VerificationStatus = 'PENDING' | 'VERIFIED';
export type VerificationMethod = 'DNS_TXT' | 'HTML_FILE';
export type DomainPolicy = 'NONE' | 'CAPTURE' | 'ENFORCE_SSO';

// Types matching tenant_domains table
export interface TenantDomain {
  _id: string; // UUID primary key
  tenant_id: string; // UUID foreign key to tenants
  domain: string; // varchar(255), unique, lowercase alphanumeric with dots/hyphens
  verification_status: VerificationStatus; // PENDING or VERIFIED
  verification_method?: VerificationMethod; // DNS_TXT or HTML_FILE
  verification_token?: string; // varchar(100)
  policy: DomainPolicy; // NONE, CAPTURE, or ENFORCE_SSO
  verified_at?: string; // timestamp
  created_at: string; // timestamp
}

export interface CreateDomainInput {
  tenant_id: string;
  domain: string;
  verification_method?: VerificationMethod;
  policy?: DomainPolicy;
}

export interface UpdateDomainInput {
  domain?: string;
  verification_method?: VerificationMethod;
  policy?: DomainPolicy;
}

export interface VerifyDomainResult {
  success: boolean;
  message: string;
  domain?: TenantDomain;
}

class TenantDomainsService {
  private table = 'tenant_domains';

  /**
   * Generate verification token
   * @private
   */
  private generateVerificationToken(): string {
    // Generate random token (32 chars hex)
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate domain format (lowercase alphanumeric with dots/hyphens)
   * @private
   */
  private validateDomainFormat(domain: string): boolean {
    const domainRegex = /^[a-z0-9.-]+$/;
    return domainRegex.test(domain);
  }

  /**
   * Normalize domain to lowercase
   * @private
   */
  private normalizeDomain(domain: string): string {
    return domain.toLowerCase().trim();
  }

  /**
   * Get all domains for a tenant
   * Ready for: GET /api/v1/tenants/:tenantId/domains
   */
  async getByTenantId(tenantId: string): Promise<TenantDomain[]> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tenant domains:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getByTenantId:', error);
      throw error;
    }
  }

  /**
   * Get single domain by ID
   * Ready for: GET /api/v1/tenants/:tenantId/domains/:id
   */
  async getById(id: string): Promise<TenantDomain | null> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('_id', id)
        .single();

      if (error) {
        console.error('Error fetching domain:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  /**
   * Get domain by domain name
   * Ready for: GET /api/v1/domains/:domain
   */
  async getByDomain(domain: string): Promise<TenantDomain | null> {
    try {
      const normalizedDomain = this.normalizeDomain(domain);
      
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('domain', normalizedDomain)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('Error fetching domain by name:', error);
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error in getByDomain:', error);
      throw error;
    }
  }

  /**
   * Create new domain for tenant
   * Ready for: POST /api/v1/tenants/:tenantId/domains
   */
  async create(input: CreateDomainInput): Promise<TenantDomain> {
    try {
      const normalizedDomain = this.normalizeDomain(input.domain);

      // Validate domain format
      if (!this.validateDomainFormat(normalizedDomain)) {
        throw new Error('Invalid domain format. Only lowercase letters, numbers, dots, and hyphens allowed.');
      }

      // Check if domain already exists
      const existing = await this.getByDomain(normalizedDomain);
      if (existing) {
        throw new Error('Domain already exists');
      }

      // Generate verification token
      const verification_token = this.generateVerificationToken();

      const domainData = {
        tenant_id: input.tenant_id,
        domain: normalizedDomain,
        verification_status: 'PENDING' as VerificationStatus,
        verification_method: input.verification_method || 'DNS_TXT' as VerificationMethod,
        verification_token,
        policy: input.policy || 'NONE' as DomainPolicy,
      };

      const { data, error } = await supabase
        .from(this.table)
        .insert([domainData])
        .select()
        .single();

      if (error) {
        console.error('Error creating domain:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  /**
   * Update domain
   * Ready for: PUT /api/v1/tenants/:tenantId/domains/:id
   */
  async update(id: string, input: UpdateDomainInput): Promise<TenantDomain> {
    try {
      const updateData: any = {};

      if (input.domain) {
        const normalizedDomain = this.normalizeDomain(input.domain);
        if (!this.validateDomainFormat(normalizedDomain)) {
          throw new Error('Invalid domain format');
        }
        updateData.domain = normalizedDomain;
        // Reset verification if domain changes
        updateData.verification_status = 'PENDING';
        updateData.verification_token = this.generateVerificationToken();
        updateData.verified_at = null;
      }

      if (input.verification_method) {
        updateData.verification_method = input.verification_method;
      }

      if (input.policy) {
        updateData.policy = input.policy;
      }

      const { data, error } = await supabase
        .from(this.table)
        .update(updateData)
        .eq('_id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating domain:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  /**
   * Delete domain
   * Ready for: DELETE /api/v1/tenants/:tenantId/domains/:id
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.table)
        .delete()
        .eq('_id', id);

      if (error) {
        console.error('Error deleting domain:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  /**
   * Verify domain (check DNS TXT record or HTML file)
   * Ready for: POST /api/v1/tenants/:tenantId/domains/:id/verify
   * 
   * Note: In production, this should call backend API to actually verify
   * For now, this is a client-side placeholder
   */
  async verifyDomain(id: string): Promise<VerifyDomainResult> {
    try {
      const domain = await this.getById(id);
      
      if (!domain) {
        return {
          success: false,
          message: 'Domain not found',
        };
      }

      if (domain.verification_status === 'VERIFIED') {
        return {
          success: true,
          message: 'Domain already verified',
          domain,
        };
      }

      // In production, backend should perform actual verification
      // For now, simulate verification check
      console.log('Verification should be performed by backend:', {
        domain: domain.domain,
        method: domain.verification_method,
        token: domain.verification_token,
      });

      // Placeholder: Return pending status
      // Real implementation: Backend verifies DNS/HTML and updates status
      return {
        success: false,
        message: 'Verification check initiated. Please wait for backend to verify.',
        domain,
      };
    } catch (error) {
      console.error('Error in verifyDomain:', error);
      return {
        success: false,
        message: 'Error during verification',
      };
    }
  }

  /**
   * Manually mark domain as verified (admin action)
   * Ready for: POST /api/v1/tenants/:tenantId/domains/:id/mark-verified
   */
  async markAsVerified(id: string): Promise<TenantDomain> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .update({
          verification_status: 'VERIFIED',
          verified_at: new Date().toISOString(),
        })
        .eq('_id', id)
        .select()
        .single();

      if (error) {
        console.error('Error marking domain as verified:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in markAsVerified:', error);
      throw error;
    }
  }

  /**
   * Get verification instructions for domain
   * @param domain - Domain object
   * @returns Instruction text based on verification method
   */
  getVerificationInstructions(domain: TenantDomain): {
    method: VerificationMethod;
    instructions: string;
    recordName?: string;
    recordValue?: string;
    filePath?: string;
    fileContent?: string;
  } {
    if (domain.verification_method === 'DNS_TXT') {
      return {
        method: 'DNS_TXT',
        instructions: 'Add a TXT record to your DNS configuration',
        recordName: `_vhv-verify.${domain.domain}`,
        recordValue: domain.verification_token || '',
      };
    } else {
      // HTML_FILE
      return {
        method: 'HTML_FILE',
        instructions: 'Upload a verification file to your website root',
        filePath: `/.well-known/vhv-verification.txt`,
        fileContent: domain.verification_token || '',
      };
    }
  }

  /**
   * Get domain statistics for a tenant
   * Ready for: GET /api/v1/tenants/:tenantId/domains/stats
   */
  async getStats(tenantId: string): Promise<{
    total: number;
    verified: number;
    pending: number;
    byPolicy: Record<DomainPolicy, number>;
  }> {
    try {
      const domains = await this.getByTenantId(tenantId);

      const stats = {
        total: domains.length,
        verified: domains.filter(d => d.verification_status === 'VERIFIED').length,
        pending: domains.filter(d => d.verification_status === 'PENDING').length,
        byPolicy: {
          NONE: domains.filter(d => d.policy === 'NONE').length,
          CAPTURE: domains.filter(d => d.policy === 'CAPTURE').length,
          ENFORCE_SSO: domains.filter(d => d.policy === 'ENFORCE_SSO').length,
        },
      };

      return stats;
    } catch (error) {
      console.error('Error in getStats:', error);
      throw error;
    }
  }

  /**
   * Get verified domains only
   * Ready for: GET /api/v1/tenants/:tenantId/domains/verified
   */
  async getVerifiedDomains(tenantId: string): Promise<TenantDomain[]> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('verification_status', 'VERIFIED')
        .order('verified_at', { ascending: false });

      if (error) {
        console.error('Error fetching verified domains:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getVerifiedDomains:', error);
      throw error;
    }
  }

  /**
   * Change domain policy
   * Ready for: PATCH /api/v1/tenants/:tenantId/domains/:id/policy
   */
  async updatePolicy(id: string, policy: DomainPolicy): Promise<TenantDomain> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .update({ policy })
        .eq('_id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating domain policy:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updatePolicy:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const tenantDomainsService = new TenantDomainsService();