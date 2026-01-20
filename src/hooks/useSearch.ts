/**
 * useSearch Hook
 * Provides cross-table search functionality
 * 
 * MIGRATED: Now uses DataClient abstraction layer
 * - Easy to switch between Supabase and Golang API
 * - Consistent pattern across all hooks
 * - Type-safe with generics
 * 
 * NOTE: Searches across multiple tables:
 * - tenants (name, code)
 * - users (email, full_name)
 * - tenant_members (employee_code, internal_email)
 * - departments (name, code)
 * - roles (name)
 * - system_announcements (title, content)
 * 
 * TODO: When Golang API is ready, implement full-text search server-side
 */

import { useState, useCallback } from 'react';
import { useDataClient } from './useDataClient';

/**
 * Search result item
 */
export interface SearchResult {
  id: string;
  type: 'tenant' | 'user' | 'member' | 'department' | 'role' | 'announcement' | 'other';
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: any;
  url?: string;
  relevance?: number; // 0-1 score
}

/**
 * Search options
 */
export interface SearchOptions {
  query: string;
  types?: Array<'tenant' | 'user' | 'member' | 'department' | 'role' | 'announcement'>;
  tenant_id?: string; // Filter by tenant
  limit?: number; // Max results per type
  fuzzy?: boolean; // Enable fuzzy matching
}

/**
 * Search results grouped by type
 */
export interface GroupedResults {
  tenants: SearchResult[];
  users: SearchResult[];
  members: SearchResult[];
  departments: SearchResult[];
  roles: SearchResult[];
  announcements: SearchResult[];
  total: number;
}

/**
 * Hook for cross-table search
 */
export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [groupedResults, setGroupedResults] = useState<GroupedResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Get DataClient instance
  const dataClient = useDataClient();

  /**
   * Perform search across tables
   */
  const search = useCallback(
    async (options: SearchOptions): Promise<SearchResult[]> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      if (!options.query || options.query.trim().length < 2) {
        setResults([]);
        setGroupedResults(null);
        return [];
      }

      setLoading(true);
      setError(null);
      setSearchQuery(options.query);

      try {
        console.log('[useSearch] Searching for:', options.query);

        const query = options.query.toLowerCase().trim();
        const limit = options.limit || 10;
        const searchTypes = options.types || [
          'tenant',
          'user',
          'member',
          'department',
          'role',
          'announcement',
        ];

        const allResults: SearchResult[] = [];

        // Search tenants
        if (searchTypes.includes('tenant')) {
          const tenantResults = await searchTenants(dataClient, query, limit);
          allResults.push(...tenantResults);
        }

        // Search users
        if (searchTypes.includes('user')) {
          const userResults = await searchUsers(dataClient, query, limit);
          allResults.push(...userResults);
        }

        // Search tenant members
        if (searchTypes.includes('member') && options.tenant_id) {
          const memberResults = await searchMembers(
            dataClient,
            query,
            options.tenant_id,
            limit
          );
          allResults.push(...memberResults);
        }

        // Search departments
        if (searchTypes.includes('department') && options.tenant_id) {
          const deptResults = await searchDepartments(
            dataClient,
            query,
            options.tenant_id,
            limit
          );
          allResults.push(...deptResults);
        }

        // Search roles
        if (searchTypes.includes('role') && options.tenant_id) {
          const roleResults = await searchRoles(dataClient, query, options.tenant_id, limit);
          allResults.push(...roleResults);
        }

        // Search announcements
        if (searchTypes.includes('announcement') && options.tenant_id) {
          const announcementResults = await searchAnnouncements(
            dataClient,
            query,
            options.tenant_id,
            limit
          );
          allResults.push(...announcementResults);
        }

        // Sort by relevance
        allResults.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));

        console.log('[useSearch] Found results:', allResults.length);

        // Group results by type
        const grouped: GroupedResults = {
          tenants: allResults.filter((r) => r.type === 'tenant'),
          users: allResults.filter((r) => r.type === 'user'),
          members: allResults.filter((r) => r.type === 'member'),
          departments: allResults.filter((r) => r.type === 'department'),
          roles: allResults.filter((r) => r.type === 'role'),
          announcements: allResults.filter((r) => r.type === 'announcement'),
          total: allResults.length,
        };

        setResults(allResults);
        setGroupedResults(grouped);
        setLoading(false);

        return allResults;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Search failed';
        setError(message);
        console.error('[useSearch] Search error:', err);
        setLoading(false);
        throw new Error(message);
      }
    },
    [dataClient]
  );

  /**
   * Clear search results
   */
  const clear = useCallback(() => {
    setResults([]);
    setGroupedResults(null);
    setSearchQuery('');
    setError(null);
  }, []);

  /**
   * Get results by type
   */
  const getResultsByType = useCallback(
    (type: SearchResult['type']): SearchResult[] => {
      return results.filter((r) => r.type === type);
    },
    [results]
  );

  return {
    results,
    groupedResults,
    loading,
    error,
    searchQuery,
    search,
    clear,
    getResultsByType,
  };
}

// ============================================================================
// Search Functions for Each Table
// ============================================================================

/**
 * Search tenants by name or code
 */
async function searchTenants(
  dataClient: any,
  query: string,
  limit: number
): Promise<SearchResult[]> {
  try {
    // TODO: Implement proper full-text search server-side
    // For now, we filter client-side (not efficient for large datasets)
    
    const result = await dataClient.query('tenants', {
      filters: {}, // Get all, filter client-side
      limit: 100, // Limit query size
    });

    const filtered = result.data.filter((tenant: any) => {
      const nameMatch = tenant.name?.toLowerCase().includes(query);
      const codeMatch = tenant.code?.toLowerCase().includes(query);
      return nameMatch || codeMatch;
    });

    return filtered.slice(0, limit).map((tenant: any) => ({
      id: tenant._id,
      type: 'tenant' as const,
      title: tenant.name,
      subtitle: tenant.code,
      description: `${tenant.tier} - ${tenant.status}`,
      metadata: tenant,
      url: `/tenants/${tenant._id}`,
      relevance: calculateRelevance(query, [tenant.name, tenant.code]),
    }));
  } catch (err) {
    console.error('[useSearch] Error searching tenants:', err);
    return [];
  }
}

/**
 * Search users by email or name
 */
async function searchUsers(
  dataClient: any,
  query: string,
  limit: number
): Promise<SearchResult[]> {
  try {
    const result = await dataClient.query('users', {
      filters: {},
      limit: 100,
    });

    const filtered = result.data.filter((user: any) => {
      const emailMatch = user.email?.toLowerCase().includes(query);
      const nameMatch = user.full_name?.toLowerCase().includes(query);
      return emailMatch || nameMatch;
    });

    return filtered.slice(0, limit).map((user: any) => ({
      id: user._id,
      type: 'user' as const,
      title: user.full_name,
      subtitle: user.email,
      description: user.status,
      metadata: user,
      url: `/users/${user._id}`,
      relevance: calculateRelevance(query, [user.email, user.full_name]),
    }));
  } catch (err) {
    console.error('[useSearch] Error searching users:', err);
    return [];
  }
}

/**
 * Search tenant members
 */
async function searchMembers(
  dataClient: any,
  query: string,
  tenantId: string,
  limit: number
): Promise<SearchResult[]> {
  try {
    const result = await dataClient.query('tenant_members', {
      filters: { tenant_id: tenantId },
      limit: 100,
    });

    const filtered = result.data.filter((member: any) => {
      const codeMatch = member.employee_code?.toLowerCase().includes(query);
      const emailMatch = member.internal_email?.toLowerCase().includes(query);
      const titleMatch = member.job_title?.toLowerCase().includes(query);
      return codeMatch || emailMatch || titleMatch;
    });

    return filtered.slice(0, limit).map((member: any) => ({
      id: member._id,
      type: 'member' as const,
      title: member.employee_code || member.user_id,
      subtitle: member.internal_email || member.job_title,
      description: `${member.role} - ${member.status}`,
      metadata: member,
      url: `/tenants/${tenantId}/members/${member._id}`,
      relevance: calculateRelevance(query, [
        member.employee_code,
        member.internal_email,
        member.job_title,
      ]),
    }));
  } catch (err) {
    console.error('[useSearch] Error searching members:', err);
    return [];
  }
}

/**
 * Search departments
 */
async function searchDepartments(
  dataClient: any,
  query: string,
  tenantId: string,
  limit: number
): Promise<SearchResult[]> {
  try {
    const result = await dataClient.query('departments', {
      filters: { tenant_id: tenantId },
      limit: 100,
    });

    const filtered = result.data.filter((dept: any) => {
      const nameMatch = dept.name?.toLowerCase().includes(query);
      const codeMatch = dept.code?.toLowerCase().includes(query);
      return nameMatch || codeMatch;
    });

    return filtered.slice(0, limit).map((dept: any) => ({
      id: dept._id,
      type: 'department' as const,
      title: dept.name,
      subtitle: dept.code,
      description: dept.status,
      metadata: dept,
      url: `/tenants/${tenantId}/departments/${dept._id}`,
      relevance: calculateRelevance(query, [dept.name, dept.code]),
    }));
  } catch (err) {
    console.error('[useSearch] Error searching departments:', err);
    return [];
  }
}

/**
 * Search roles
 */
async function searchRoles(
  dataClient: any,
  query: string,
  tenantId: string,
  limit: number
): Promise<SearchResult[]> {
  try {
    const result = await dataClient.query('roles', {
      filters: { tenant_id: tenantId },
      limit: 100,
    });

    const filtered = result.data.filter((role: any) => {
      const nameMatch = role.name?.toLowerCase().includes(query);
      const descMatch = role.description?.toLowerCase().includes(query);
      return nameMatch || descMatch;
    });

    return filtered.slice(0, limit).map((role: any) => ({
      id: role._id,
      type: 'role' as const,
      title: role.name,
      subtitle: role.type,
      description: role.description,
      metadata: role,
      url: `/tenants/${tenantId}/roles/${role._id}`,
      relevance: calculateRelevance(query, [role.name, role.description]),
    }));
  } catch (err) {
    console.error('[useSearch] Error searching roles:', err);
    return [];
  }
}

/**
 * Search system announcements
 */
async function searchAnnouncements(
  dataClient: any,
  query: string,
  tenantId: string,
  limit: number
): Promise<SearchResult[]> {
  try {
    const result = await dataClient.query('system_announcements', {
      filters: { tenant_id: tenantId, is_published: true },
      limit: 100,
    });

    const filtered = result.data.filter((announcement: any) => {
      const titleMatch = announcement.title?.toLowerCase().includes(query);
      const contentMatch = announcement.content?.toLowerCase().includes(query);
      return titleMatch || contentMatch;
    });

    return filtered.slice(0, limit).map((announcement: any) => ({
      id: announcement._id,
      type: 'announcement' as const,
      title: announcement.title,
      subtitle: announcement.type,
      description: announcement.content?.substring(0, 100) + '...',
      metadata: announcement,
      url: `/tenants/${tenantId}/announcements/${announcement._id}`,
      relevance: calculateRelevance(query, [announcement.title, announcement.content]),
    }));
  } catch (err) {
    console.error('[useSearch] Error searching announcements:', err);
    return [];
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate relevance score (0-1)
 * Higher score = better match
 */
function calculateRelevance(query: string, fields: (string | undefined)[]): number {
  let maxScore = 0;

  for (const field of fields) {
    if (!field) continue;

    const fieldLower = field.toLowerCase();
    const queryLower = query.toLowerCase();

    // Exact match
    if (fieldLower === queryLower) {
      maxScore = Math.max(maxScore, 1.0);
      continue;
    }

    // Starts with query
    if (fieldLower.startsWith(queryLower)) {
      maxScore = Math.max(maxScore, 0.8);
      continue;
    }

    // Contains query
    if (fieldLower.includes(queryLower)) {
      maxScore = Math.max(maxScore, 0.6);
      continue;
    }

    // Fuzzy match (simplified)
    const distance = levenshteinDistance(queryLower, fieldLower);
    const similarity = 1 - distance / Math.max(queryLower.length, fieldLower.length);
    maxScore = Math.max(maxScore, similarity * 0.4);
  }

  return maxScore;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
