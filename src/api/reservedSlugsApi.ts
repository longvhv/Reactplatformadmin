/**
 * Reserved Slugs API Client
 * Uses Adapter pattern - Ready for Golang migration
 * ✅ Production-ready with full CRUD operations
 * ✅ Type-safe with TypeScript
 * ✅ Optimistic locking support
 */

import { useState, useEffect } from 'react';
import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export type SlugType = 'SYSTEM' | 'BUSINESS' | 'OFFENSIVE' | 'FUTURE';
export type MatchType = 'EXACT' | 'PREFIX' | 'REGEX';

export interface ReservedSlug {
  // I. Định danh
  _id: string;
  
  // II. Thông tin Từ khóa
  slug: string;
  type: SlugType;
  match_type: MatchType;
  
  // III. Ngữ cảnh & Snapshot
  items_snapshot: Record<string, any>;
  reason: string | null;
  is_active: boolean;
  
  // IV. Audit & Versioning
  created_at: string;
  updated_at: string;
  version: number;
  deleted_at: string | null;
}

export interface CreateReservedSlugRequest {
  slug: string;
  type?: SlugType;
  match_type?: MatchType;
  items_snapshot?: Record<string, any>;
  reason?: string;
  is_active?: boolean;
}

export interface UpdateReservedSlugRequest {
  type?: SlugType;
  match_type?: MatchType;
  items_snapshot?: Record<string, any>;
  reason?: string;
  is_active?: boolean;
  version: number;
}

export interface ReservedSlugFilters extends BaseFilters {
  type?: SlugType;
  match_type?: MatchType;
  is_active?: boolean;
  slug?: string;
}

export interface ReservedSlugStats {
  total: number;
  active: number;
  inactive: number;
  byType: Record<SlugType, number>;
  byMatchType: Record<MatchType, number>;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<ReservedSlug, CreateReservedSlugRequest, UpdateReservedSlugRequest>(
  'reserved_slugs',
  '/reserved-slugs'
);

// ==================== API CLIENT ====================

export const reservedSlugsApi = {
  /**
   * GET /reserved-slugs
   */
  getAll: async (filters?: ReservedSlugFilters): Promise<ReservedSlug[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /reserved-slugs/:id
   */
  getById: async (id: string): Promise<ReservedSlug> => {
    return adapter.getById(id);
  },

  /**
   * GET /reserved-slugs/slug/:slug
   * Check if a slug is reserved
   */
  checkSlug: async (slug: string): Promise<{ reserved: boolean; slug?: ReservedSlug }> => {
    try {
      const { getSupabaseClient } = await import('../lib/supabase');
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('reserved_slugs')
        .select('*')
        .eq('slug', slug.toLowerCase())
        .eq('is_active', true)
        .is('deleted_at', null)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return {
        reserved: !!data,
        slug: data || undefined,
      };
    } catch (error) {
      console.error('Error checking slug:', error);
      throw error;
    }
  },

  /**
   * POST /reserved-slugs
   */
  create: async (data: CreateReservedSlugRequest): Promise<ReservedSlug> => {
    // Normalize slug to lowercase
    const normalizedData = {
      ...data,
      slug: data.slug.toLowerCase(),
      items_snapshot: data.items_snapshot || null,  // Default to null if not provided
    };
    
    console.log('📤 Creating reserved slug:', normalizedData);
    try {
      const result = await adapter.create(normalizedData);
      console.log('✅ Created reserved slug:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Failed to create reserved slug:', error);
      console.error('Request data:', normalizedData);
      throw error;
    }
  },

  /**
   * PATCH /reserved-slugs/:id
   */
  update: async (id: string, data: UpdateReservedSlugRequest): Promise<ReservedSlug> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /reserved-slugs/:id (soft delete)
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * POST /reserved-slugs/:id/activate
   */
  activate: async (id: string): Promise<ReservedSlug> => {
    const slug = await reservedSlugsApi.getById(id);
    return adapter.update(id, { is_active: true, version: slug.version });
  },

  /**
   * POST /reserved-slugs/:id/deactivate
   */
  deactivate: async (id: string): Promise<ReservedSlug> => {
    const slug = await reservedSlugsApi.getById(id);
    return adapter.update(id, { is_active: false, version: slug.version });
  },

  /**
   * GET /reserved-slugs/stats
   */
  getStats: async (): Promise<ReservedSlugStats> => {
    try {
      const { getSupabaseClient } = await import('../lib/supabase');
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('reserved_slugs')
        .select('type, match_type, is_active')
        .is('deleted_at', null);

      if (error) throw error;

      const stats: ReservedSlugStats = {
        total: data.length,
        active: data.filter(s => s.is_active).length,
        inactive: data.filter(s => !s.is_active).length,
        byType: {
          SYSTEM: data.filter(s => s.type === 'SYSTEM').length,
          BUSINESS: data.filter(s => s.type === 'BUSINESS').length,
          OFFENSIVE: data.filter(s => s.type === 'OFFENSIVE').length,
          FUTURE: data.filter(s => s.type === 'FUTURE').length,
        },
        byMatchType: {
          EXACT: data.filter(s => s.match_type === 'EXACT').length,
          PREFIX: data.filter(s => s.match_type === 'PREFIX').length,
          REGEX: data.filter(s => s.match_type === 'REGEX').length,
        },
      };

      return stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  },

  /**
   * POST /reserved-slugs/batch
   * Batch create reserved slugs
   */
  createBatch: async (slugs: CreateReservedSlugRequest[]): Promise<ReservedSlug[]> => {
    try {
      const { getSupabaseClient } = await import('../lib/supabase');
      const supabase = getSupabaseClient();

      // Normalize all slugs
      const normalizedSlugs = slugs.map(s => ({
        ...s,
        slug: s.slug.toLowerCase(),
        type: s.type || 'SYSTEM',
        match_type: s.match_type || 'EXACT',
        items_snapshot: s.items_snapshot || {},
        is_active: s.is_active !== undefined ? s.is_active : true,
      }));

      const { data, error } = await supabase
        .from('reserved_slugs')
        .insert(normalizedSlugs)
        .select();

      if (error) throw error;
      return data as ReservedSlug[];
    } catch (error) {
      console.error('Error creating batch:', error);
      throw error;
    }
  },
};

// ==================== HOOKS ====================

/**
 * Hook to fetch all reserved slugs
 */
export function useReservedSlugs(filters?: ReservedSlugFilters) {
  const [slugs, setSlugs] = useState<ReservedSlug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await reservedSlugsApi.getAll(filters);
      setSlugs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reserved slugs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [JSON.stringify(filters)]);

  return { slugs, loading, error, refresh };
}

/**
 * Hook to check if a slug is reserved
 */
export function useSlugCheck(slug: string | undefined) {
  const [checking, setChecking] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [reservedSlug, setReservedSlug] = useState<ReservedSlug | undefined>();

  const check = async (slugToCheck: string) => {
    if (!slugToCheck) return;
    
    setChecking(true);
    try {
      const result = await reservedSlugsApi.checkSlug(slugToCheck);
      setReserved(result.reserved);
      setReservedSlug(result.slug);
    } catch (err) {
      console.error('Error checking slug:', err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (slug) {
      check(slug);
    }
  }, [slug]);

  return { checking, reserved, reservedSlug, check };
}

/**
 * Hook to fetch stats
 */
export function useReservedSlugStats() {
  const [stats, setStats] = useState<ReservedSlugStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await reservedSlugsApi.getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { stats, loading, error, refresh };
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get type color
 */
export function getTypeColor(type: SlugType): string {
  switch (type) {
    case 'SYSTEM':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'BUSINESS':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
    case 'OFFENSIVE':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'FUTURE':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get type label
 */
export function getTypeLabel(type: SlugType): string {
  switch (type) {
    case 'SYSTEM':
      return 'System';
    case 'BUSINESS':
      return 'Business';
    case 'OFFENSIVE':
      return 'Offensive';
    case 'FUTURE':
      return 'Future';
    default:
      return type;
  }
}

/**
 * Get match type label
 */
export function getMatchTypeLabel(matchType: MatchType): string {
  switch (matchType) {
    case 'EXACT':
      return 'Exact match';
    case 'PREFIX':
      return 'Prefix match';
    case 'REGEX':
      return 'Regex pattern';
    default:
      return matchType;
  }
}

/**
 * Get match type icon
 */
export function getMatchTypeIcon(matchType: MatchType): string {
  switch (matchType) {
    case 'EXACT':
      return '=';
    case 'PREFIX':
      return '→';
    case 'REGEX':
      return '.*';
    default:
      return '?';
  }
}

/**
 * Validate slug format
 */
export function validateSlugFormat(slug: string): { valid: boolean; error?: string } {
  if (!slug) {
    return { valid: false, error: 'Slug is required' };
  }

  if (slug.length > 100) {
    return { valid: false, error: 'Slug must be less than 100 characters' };
  }

  // Check format: only lowercase, numbers, hyphens
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { 
      valid: false, 
      error: 'Slug must contain only lowercase letters, numbers, and hyphens' 
    };
  }

  // Cannot start or end with hyphen
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { valid: false, error: 'Slug cannot start or end with hyphen' };
  }

  // Cannot have consecutive hyphens
  if (slug.includes('--')) {
    return { valid: false, error: 'Slug cannot have consecutive hyphens' };
  }

  return { valid: true };
}

/**
 * Normalize slug
 */
export function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-') // Replace invalid chars with hyphen
    .replace(/--+/g, '-')         // Remove consecutive hyphens
    .replace(/^-+|-+$/g, '');     // Remove leading/trailing hyphens
}

export default reservedSlugsApi;