/**
 * Location Type Definitions
 * Aligned with Supabase database schema
 */

export interface Location {
  _id: string;
  tenant_id: string;
  code: string;
  name: string;
  location_type: LocationType;
  status: LocationStatus;
  
  // Address
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  
  // Contact
  phone?: string;
  email?: string;
  fax?: string;
  
  // Geographic
  latitude?: number;
  longitude?: number;
  timezone?: string;
  
  // Business
  manager_id?: string;
  parent_location_id?: string;
  is_primary: boolean;
  is_warehouse: boolean;
  is_retail: boolean;
  
  // Operational
  area_sqm?: number;
  capacity?: number;
  opening_hours?: Record<string, string>;
  
  // Metadata
  description?: string;
  order?: number;
  metadata?: Record<string, any>;
  
  // Audit
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  created_by?: string;
  updated_by?: string;
  deleted_by?: string;
  version: number;
  
  // Relations (from API joins)
  manager?: {
    employee_code: string;
    user: {
      name: string;
      email: string;
    };
  };
  parent?: {
    code: string;
    name: string;
  };
  tenant?: {
    _id: string;
    code: string;
    name: string;
  };
}

export type LocationType = 
  | 'OFFICE' 
  | 'WAREHOUSE' 
  | 'RETAIL' 
  | 'FACTORY' 
  | 'BRANCH' 
  | 'HEADQUARTERS' 
  | 'DATACENTER' 
  | 'OTHER';

export type LocationStatus = 
  | 'ACTIVE' 
  | 'INACTIVE' 
  | 'CLOSED' 
  | 'MAINTENANCE' 
  | 'PLANNED';

export interface CreateLocationInput {
  tenant_id: string;
  code: string;
  name: string;
  location_type?: LocationType;
  status?: LocationStatus;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  fax?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  manager_id?: string;
  parent_location_id?: string;
  is_primary?: boolean;
  is_warehouse?: boolean;
  is_retail?: boolean;
  area_sqm?: number;
  capacity?: number;
  opening_hours?: Record<string, string>;
  description?: string;
  order?: number;
  metadata?: Record<string, any>;
}

export interface UpdateLocationInput extends Partial<CreateLocationInput> {
  version: number;
}

export const LOCATION_TYPES: { value: LocationType; label: string }[] = [
  { value: 'OFFICE', label: 'Office' },
  { value: 'WAREHOUSE', label: 'Warehouse' },
  { value: 'RETAIL', label: 'Retail Store' },
  { value: 'FACTORY', label: 'Factory' },
  { value: 'BRANCH', label: 'Branch' },
  { value: 'HEADQUARTERS', label: 'Headquarters' },
  { value: 'DATACENTER', label: 'Data Center' },
  { value: 'OTHER', label: 'Other' },
];

export const LOCATION_STATUSES: { value: LocationStatus; label: string; color: string }[] = [
  { value: 'ACTIVE', label: 'Active', color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'INACTIVE', label: 'Inactive', color: 'text-gray-600 bg-gray-50 border-gray-200' },
  { value: 'CLOSED', label: 'Closed', color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'MAINTENANCE', label: 'Maintenance', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { value: 'PLANNED', label: 'Planned', color: 'text-blue-600 bg-blue-50 border-blue-200' },
];
