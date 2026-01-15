/**
 * useTenant Hook
 * Manages single tenant data fetching and operations
 */

import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '@/utils/supabase/info';
import type { Tenant, TenantStatus } from '@/data/tenants';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/tenants`;

export function useTenant(tenantId?: string) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tenant by ID
  const fetchTenant = async () => {
    if (!tenantId || tenantId === 'new' || tenantId === 'add') return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tenant: ${response.statusText}`);
      }

      const result = await response.json();
      
      // API returns { data } wrapper
      if (result.data) {
        setTenant(result.data);
      } else {
        // Fallback if API returns tenant directly
        setTenant(result);
      }
    } catch (err) {
      console.error('Error fetching tenant:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tenant');
    } finally {
      setLoading(false);
    }
  };

  // Update tenant
  const updateTenant = async (updates: Partial<Tenant>) => {
    if (!tenantId) return;

    try {
      const response = await fetch(`${API_BASE}/${tenantId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update tenant: ${response.statusText}`);
      }

      const result = await response.json();
      
      // API returns { data } wrapper
      const updatedTenant = result.data || result;
      setTenant(updatedTenant);
    } catch (err) {
      console.error('Error updating tenant:', err);
      throw err;
    }
  };

  // Update status
  const updateStatus = async (newStatus: TenantStatus) => {
    if (!tenantId) return;

    try {
      const response = await fetch(`${API_BASE}/${tenantId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update local state
      if (tenant) {
        setTenant({
          ...tenant,
          status: data.status,
          updated_at: data.updated_at,
        });
      }
    } catch (err) {
      console.error('Error updating status:', err);
      throw err;
    }
  };

  // Delete tenant
  const deleteTenant = async () => {
    if (!tenantId) return;

    try {
      const response = await fetch(`${API_BASE}/${tenantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete tenant: ${response.statusText}`);
      }

      setTenant(null);
    } catch (err) {
      console.error('Error deleting tenant:', err);
      throw err;
    }
  };

  // Auto-fetch on mount and when tenantId changes
  useEffect(() => {
    if (tenantId && tenantId !== 'new' && tenantId !== 'add') {
      fetchTenant();
    }
  }, [tenantId]);

  return {
    tenant,
    loading,
    error,
    fetchTenant,
    updateTenant,
    updateStatus,
    deleteTenant,
  };
}