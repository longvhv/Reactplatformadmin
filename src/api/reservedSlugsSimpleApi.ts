/**
 * Reserved Slugs API Client (Simple Version)
 * Direct API calls to backend - simplified schema
 * ✅ CREATED: 2026-01-21
 */

import { projectId, publicAnonKey } from '@/utils/supabase/info';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core`;

// ==================== TYPES ====================

export interface ReservedSlug {
  _id: string;
  slug: string;
  description?: string;
  entity_type?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface CreateReservedSlugRequest {
  slug: string;
  description?: string;
  entity_type?: string;
  is_active?: boolean;
}

export interface UpdateReservedSlugRequest {
  slug?: string;
  description?: string;
  entity_type?: string;
  is_active?: boolean;
  version: number;
}

// ==================== API CLIENT ====================

async function fetchAPI<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `API Error: ${response.status}`);
  }

  return data;
}

export const reservedSlugsApi = {
  /**
   * GET /reserved-slugs
   */
  getAll: async (): Promise<ReservedSlug[]> => {
    const result = await fetchAPI<{ success: boolean; data: ReservedSlug[] }>('/reserved-slugs');
    return result.data || [];
  },

  /**
   * GET /reserved-slugs/:id
   */
  getById: async (id: string): Promise<ReservedSlug> => {
    const result = await fetchAPI<{ success: boolean; data: ReservedSlug }>(`/reserved-slugs/${id}`);
    return result.data;
  },

  /**
   * POST /reserved-slugs
   */
  create: async (data: CreateReservedSlugRequest): Promise<ReservedSlug> => {
    const result = await fetchAPI<{ success: boolean; data: ReservedSlug }>('/reserved-slugs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data;
  },

  /**
   * PUT /reserved-slugs/:id
   */
  update: async (id: string, data: UpdateReservedSlugRequest): Promise<ReservedSlug> => {
    const result = await fetchAPI<{ success: boolean; data: ReservedSlug }>(`/reserved-slugs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.data;
  },

  /**
   * DELETE /reserved-slugs/:id
   */
  delete: async (id: string): Promise<void> => {
    await fetchAPI<{ success: boolean }>(`/reserved-slugs/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * POST /reserved-slugs/check
   * Check if a slug is reserved
   */
  checkSlug: async (slug: string): Promise<{ is_reserved: boolean; data: ReservedSlug | null }> => {
    const result = await fetchAPI<{ success: boolean; is_reserved: boolean; data: ReservedSlug | null }>(
      '/reserved-slugs/check',
      {
        method: 'POST',
        body: JSON.stringify({ slug }),
      }
    );
    return { is_reserved: result.is_reserved, data: result.data };
  },
};

export default reservedSlugsApi;
