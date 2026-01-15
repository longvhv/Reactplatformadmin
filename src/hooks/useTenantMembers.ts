/**
 * useTenantMembers Hook
 * Manages tenant members operations
 */

import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '@/utils/supabase/info';

export interface TenantMember {
  _id: string;
  tenant_id: string;
  user_id: string;
  display_name: string;
  status: 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'RESIGNED';
  custom_data?: Record<string, any>;
  joined_at: string;
  user: {
    email: string;
    full_name: string;
    avatar_url?: string;
  };
}

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/tenants`;

export function useTenantMembers(tenantId: string) {
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch members
  const fetchMembers = async () => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/${tenantId}/members`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch members: ${response.statusText}`);
      }

      const data = await response.json();
      setMembers(data.data || []);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  // Invite member
  const inviteMember = async (email: string, displayName: string) => {
    if (!tenantId) return;

    try {
      const response = await fetch(`${API_BASE}/${tenantId}/members/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, display_name: displayName }),
      });

      if (!response.ok) {
        throw new Error(`Failed to invite member: ${response.statusText}`);
      }

      // Refresh members list
      await fetchMembers();
    } catch (err) {
      console.error('Error inviting member:', err);
      throw err;
    }
  };

  // Update member
  const updateMember = async (memberId: string, updates: Partial<TenantMember>) => {
    if (!tenantId) return;

    try {
      const response = await fetch(`${API_BASE}/${tenantId}/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update member: ${response.statusText}`);
      }

      // Refresh members list
      await fetchMembers();
    } catch (err) {
      console.error('Error updating member:', err);
      throw err;
    }
  };

  // Update member status
  const updateMemberStatus = async (memberId: string, status: TenantMember['status']) => {
    return updateMember(memberId, { status });
  };

  // Remove member
  const removeMember = async (memberId: string) => {
    if (!tenantId) return;

    try {
      const response = await fetch(`${API_BASE}/${tenantId}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to remove member: ${response.statusText}`);
      }

      // Refresh members list
      await fetchMembers();
    } catch (err) {
      console.error('Error removing member:', err);
      throw err;
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    if (tenantId) {
      fetchMembers();
    }
  }, [tenantId]);

  return {
    members,
    loading,
    error,
    fetchMembers,
    inviteMember,
    updateMember,
    updateMemberStatus,
    removeMember,
  };
}
