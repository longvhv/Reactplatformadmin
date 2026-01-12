/**
 * Regions API
 * API for managing regions (Countries, Provinces, Districts)
 * Table: regions
 */

export interface Region {
  id?: string;
  code: string; // Unique code
  name: string;
  name_en?: string;
  type: 'country' | 'province' | 'district';
  parent_id: string | null;
  start_date: string; // Date when region becomes effective
  end_date: string | null; // Date when region becomes inactive (null = active)
  description?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// Mock data
const mockRegions: Region[] = [
  // Countries
  {
    id: '1',
    code: 'VN',
    name: 'Việt Nam',
    name_en: 'Vietnam',
    type: 'country',
    parent_id: null,
    start_date: '1945-09-02',
    end_date: null,
    description: 'Socialist Republic of Vietnam',
    metadata: { iso_code: 'VN', phone_code: '+84', currency: 'VND' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    code: 'US',
    name: 'Hoa Kỳ',
    name_en: 'United States',
    type: 'country',
    parent_id: null,
    start_date: '1776-07-04',
    end_date: null,
    description: 'United States of America',
    metadata: { iso_code: 'US', phone_code: '+1', currency: 'USD' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  
  // Provinces (Vietnam)
  {
    id: '3',
    code: 'VN-HN',
    name: 'Hà Nội',
    name_en: 'Hanoi',
    type: 'province',
    parent_id: '1',
    start_date: '2008-01-01',
    end_date: null,
    description: 'Capital city of Vietnam',
    metadata: { timezone: 'Asia/Ho_Chi_Minh', area: '3359.82 km²' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    code: 'VN-HCM',
    name: 'Hồ Chí Minh',
    name_en: 'Ho Chi Minh City',
    type: 'province',
    parent_id: '1',
    start_date: '1976-07-02',
    end_date: null,
    description: 'Largest city in Vietnam',
    metadata: { timezone: 'Asia/Ho_Chi_Minh', area: '2061.4 km²' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    code: 'VN-DN',
    name: 'Đà Nẵng',
    name_en: 'Da Nang',
    type: 'province',
    parent_id: '1',
    start_date: '1997-01-01',
    end_date: null,
    description: 'Major port city in central Vietnam',
    metadata: { timezone: 'Asia/Ho_Chi_Minh', area: '1285.4 km²' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  
  // Districts (Hanoi)
  {
    id: '6',
    code: 'VN-HN-HK',
    name: 'Hoàn Kiếm',
    name_en: 'Hoan Kiem',
    type: 'district',
    parent_id: '3',
    start_date: '2008-01-01',
    end_date: null,
    description: 'Central district of Hanoi',
    metadata: { area: '5.29 km²' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '7',
    code: 'VN-HN-BD',
    name: 'Ba Đình',
    name_en: 'Ba Dinh',
    type: 'district',
    parent_id: '3',
    start_date: '2008-01-01',
    end_date: null,
    description: 'Political center of Vietnam',
    metadata: { area: '9.21 km²' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '8',
    code: 'VN-HN-CG',
    name: 'Cầu Giấy',
    name_en: 'Cau Giay',
    type: 'district',
    parent_id: '3',
    start_date: '2008-01-01',
    end_date: null,
    description: 'Western district of Hanoi',
    metadata: { area: '12.04 km²' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  
  // Districts (Ho Chi Minh City)
  {
    id: '9',
    code: 'VN-HCM-Q1',
    name: 'Quận 1',
    name_en: 'District 1',
    type: 'district',
    parent_id: '4',
    start_date: '1976-07-02',
    end_date: null,
    description: 'Central business district',
    metadata: { area: '7.73 km²' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '10',
    code: 'VN-HCM-Q3',
    name: 'Quận 3',
    name_en: 'District 3',
    type: 'district',
    parent_id: '4',
    start_date: '1976-07-02',
    end_date: null,
    description: 'Central district',
    metadata: { area: '4.90 km²' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const regionsApi = {
  // Get all regions with filters
  getAll: async (params?: {
    type?: 'country' | 'province' | 'district';
    parent_id?: string | null;
    search?: string;
    active_only?: boolean;
  }): Promise<Region[]> => {
    await delay(300);
    let result = [...mockRegions];

    if (params?.type) {
      result = result.filter((r) => r.type === params.type);
    }

    if (params?.parent_id !== undefined) {
      result = result.filter((r) => r.parent_id === params.parent_id);
    }

    if (params?.search) {
      const search = params.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.code.toLowerCase().includes(search) ||
          r.name.toLowerCase().includes(search) ||
          r.name_en?.toLowerCase().includes(search)
      );
    }

    if (params?.active_only) {
      const now = new Date().toISOString().split('T')[0];
      result = result.filter(
        (r) => r.start_date <= now && (r.end_date === null || r.end_date > now)
      );
    }

    return result;
  },

  // Get region by ID
  getById: async (id: string): Promise<Region | null> => {
    await delay(200);
    return mockRegions.find((r) => r.id === id) || null;
  },

  // Get countries
  getCountries: async (): Promise<Region[]> => {
    await delay(200);
    return mockRegions.filter((r) => r.type === 'country');
  },

  // Get provinces by country
  getProvinces: async (countryId: string): Promise<Region[]> => {
    await delay(200);
    return mockRegions.filter((r) => r.type === 'province' && r.parent_id === countryId);
  },

  // Get districts by province
  getDistricts: async (provinceId: string): Promise<Region[]> => {
    await delay(200);
    return mockRegions.filter((r) => r.type === 'district' && r.parent_id === provinceId);
  },

  // Create region
  create: async (data: Omit<Region, 'id' | 'created_at' | 'updated_at'>): Promise<Region> => {
    await delay(400);

    // Check if code already exists
    if (mockRegions.some((r) => r.code === data.code)) {
      throw new Error('Region code already exists');
    }

    const newRegion: Region = {
      ...data,
      id: String(mockRegions.length + 1),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockRegions.push(newRegion);
    return newRegion;
  },

  // Update region
  update: async (id: string, data: Partial<Region>): Promise<Region> => {
    await delay(400);
    const index = mockRegions.findIndex((r) => r.id === id);

    if (index === -1) {
      throw new Error('Region not found');
    }

    // Check if updating code to existing value
    if (data.code && data.code !== mockRegions[index].code) {
      if (mockRegions.some((r) => r.code === data.code && r.id !== id)) {
        throw new Error('Region code already exists');
      }
    }

    mockRegions[index] = {
      ...mockRegions[index],
      ...data,
      updated_at: new Date().toISOString(),
    };

    return mockRegions[index];
  },

  // Delete region
  delete: async (id: string): Promise<void> => {
    await delay(300);
    const index = mockRegions.findIndex((r) => r.id === id);

    if (index === -1) {
      throw new Error('Region not found');
    }

    // Check if region has children
    const hasChildren = mockRegions.some((r) => r.parent_id === id);
    if (hasChildren) {
      throw new Error('Cannot delete region with sub-regions. Delete sub-regions first.');
    }

    mockRegions.splice(index, 1);
  },

  // Get region hierarchy
  getHierarchy: async (): Promise<Region[]> => {
    await delay(300);
    return [...mockRegions];
  },
};
