/**
 * Region API
 * Manages hierarchical geographic locations
 */

// ============================================
// TYPES & INTERFACES
// ============================================

export type RegionType = 'REGION' | 'NATION' | 'PROVINCE' | 'DISTRICT' | 'COMMUNE';

export interface RegionHistoryEntry {
  changedAt: string;
  changedBy: string;
  field: string;
  oldValue: any;
  newValue: any;
  reason?: string;
}

export interface Region {
  id?: string;
  code: string;
  name: string;
  type: RegionType;
  parentId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  historyData?: RegionHistoryEntry[];
  order?: number;
  status?: number;
  metadata?: Record<string, any>;
  isSystem?: boolean;
  isEditable?: boolean;
  tenantId?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegionWithParent extends Region {
  parent?: Region | null;
  children?: Region[];
  level?: number;
  path?: string; // Full hierarchical path
}

export interface RegionTreeNode extends Region {
  children: RegionTreeNode[];
  level: number;
  hasChildren: boolean;
}

// ============================================
// HELPERS
// ============================================

export class RegionTypeHelper {
  static readonly REGION: RegionType = 'REGION';
  static readonly NATION: RegionType = 'NATION';
  static readonly PROVINCE: RegionType = 'PROVINCE';
  static readonly DISTRICT: RegionType = 'DISTRICT';
  static readonly COMMUNE: RegionType = 'COMMUNE';

  static getTypeName(type: RegionType): string {
    const names: Record<RegionType, string> = {
      REGION: 'Vùng miền',
      NATION: 'Quốc gia',
      PROVINCE: 'Tỉnh/Thành phố',
      DISTRICT: 'Quận/Huyện',
      COMMUNE: 'Xã/Phường',
    };
    return names[type] || type;
  }

  static getLevel(type: RegionType): number {
    const levels: Record<RegionType, number> = {
      REGION: 1,
      NATION: 2,
      PROVINCE: 3,
      DISTRICT: 4,
      COMMUNE: 5,
    };
    return levels[type] || 0;
  }

  static getParentType(type: RegionType): RegionType | null {
    const parentTypes: Record<RegionType, RegionType | null> = {
      REGION: null,
      NATION: 'REGION',
      PROVINCE: 'NATION',
      DISTRICT: 'PROVINCE',
      COMMUNE: 'DISTRICT',
    };
    return parentTypes[type];
  }

  static getChildType(type: RegionType): RegionType | null {
    const childTypes: Record<RegionType, RegionType | null> = {
      REGION: 'NATION',
      NATION: 'PROVINCE',
      PROVINCE: 'DISTRICT',
      DISTRICT: 'COMMUNE',
      COMMUNE: null,
    };
    return childTypes[type];
  }

  static isValid(region: Region): boolean {
    return region.status === 1 && 
           (!region.endDate || new Date(region.endDate) > new Date());
  }
}

// ============================================
// API BASE URL
// ============================================

const API_BASE_URL = '/api/regions';

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get all regions with optional filters
 */
export async function getRegions(params?: {
  type?: RegionType;
  parentId?: string | null;
  status?: number;
  isValid?: boolean; // Filter by temporal validity
}): Promise<Region[]> {
  const queryParams = new URLSearchParams();
  
  if (params?.type) queryParams.append('type', params.type);
  if (params?.parentId !== undefined) {
    queryParams.append('parentId', params.parentId || 'null');
  }
  if (params?.status !== undefined) queryParams.append('status', params.status.toString());
  if (params?.isValid !== undefined) queryParams.append('isValid', params.isValid.toString());

  const response = await fetch(`${API_BASE_URL}?${queryParams}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch regions: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get region by ID
 */
export async function getRegionById(id: string): Promise<RegionWithParent> {
  const response = await fetch(`${API_BASE_URL}/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch region: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get region by code
 */
export async function getRegionByCode(code: string): Promise<RegionWithParent> {
  const response = await fetch(`${API_BASE_URL}/code/${code}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch region: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get hierarchical tree of regions
 */
export async function getRegionTree(params?: {
  rootType?: RegionType;
  rootId?: string;
  maxDepth?: number;
}): Promise<RegionTreeNode[]> {
  const queryParams = new URLSearchParams();
  
  if (params?.rootType) queryParams.append('rootType', params.rootType);
  if (params?.rootId) queryParams.append('rootId', params.rootId);
  if (params?.maxDepth) queryParams.append('maxDepth', params.maxDepth.toString());

  const response = await fetch(`${API_BASE_URL}/tree?${queryParams}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch region tree: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get children of a region
 */
export async function getRegionChildren(parentId: string): Promise<Region[]> {
  return getRegions({ parentId });
}

/**
 * Get path from root to region
 */
export async function getRegionPath(regionId: string): Promise<Region[]> {
  const response = await fetch(`${API_BASE_URL}/${regionId}/path`);
  if (!response.ok) {
    throw new Error(`Failed to fetch region path: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Create new region
 */
export async function createRegion(data: Partial<Region>): Promise<Region> {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create region');
  }
  
  return response.json();
}

/**
 * Update region
 */
export async function updateRegion(
  id: string,
  data: Partial<Region>,
  changeReason?: string
): Promise<Region> {
  const payload = { ...data };
  if (changeReason) {
    (payload as any).changeReason = changeReason;
  }

  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update region');
  }
  
  return response.json();
}

/**
 * Delete region (soft delete by setting endDate)
 */
export async function deleteRegion(id: string, reason?: string): Promise<void> {
  const queryParams = new URLSearchParams();
  if (reason) queryParams.append('reason', reason);

  const response = await fetch(`${API_BASE_URL}/${id}?${queryParams}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete region');
  }
}

/**
 * Permanently delete region
 */
export async function permanentDeleteRegion(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${id}/permanent`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to permanently delete region');
  }
}

/**
 * Get region history
 */
export async function getRegionHistory(id: string): Promise<RegionHistoryEntry[]> {
  const response = await fetch(`${API_BASE_URL}/${id}/history`);
  if (!response.ok) {
    throw new Error(`Failed to fetch region history: ${response.statusText}`);
  }
  
  const region = await response.json();
  return region.historyData || [];
}

/**
 * Search regions by name
 */
export async function searchRegions(params: {
  query: string;
  type?: RegionType;
  limit?: number;
}): Promise<Region[]> {
  const queryParams = new URLSearchParams({
    query: params.query,
    ...(params.type && { type: params.type }),
    ...(params.limit && { limit: params.limit.toString() }),
  });

  const response = await fetch(`${API_BASE_URL}/search?${queryParams}`);
  if (!response.ok) {
    throw new Error(`Failed to search regions: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get regions by type with parent info
 */
export async function getRegionsByType(type: RegionType): Promise<RegionWithParent[]> {
  const response = await fetch(`${API_BASE_URL}/by-type/${type}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch regions by type: ${response.statusText}`);
  }
  return response.json();
}
