/**
 * Location Types API Client
 * Manages location type definitions with extra fields and optimistic locking
 */

import { createAdapter, BaseFilters } from './adapters';

/**
 * Extra Field Definition for dynamic fields
 * Stored as JSONB array in database
 */
export interface ExtraFieldDefinition {
  code: string;          // Field identifier (e.g., "max_capacity")
  name: string;          // Display name (e.g., "Maximum Capacity")
  type: 'text' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect';
  required?: boolean;
  default_value?: any;
  options?: string[];    // For select/multiselect types
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  order?: number;
  description?: string;
}

/**
 * Location Type Entity
 * Defines types of locations (e.g., "WAREHOUSE", "STORE", "OFFICE")
 */
export interface LocationType {
  _id: string;
  id?: string;                          // Alias for _id (auto-mapped by adapter)
  tenant_id: string;
  code: string;                         // Uppercase format: ^[A-Z0-9_]+$
  name: string;
  description?: string;
  extra_fields: ExtraFieldDefinition[]; // JSONB array of dynamic field definitions
  is_system: boolean;                   // System types cannot be deleted
  is_active: boolean;
  created_at: string;
  updated_at: string;
  version: number;                      // For optimistic locking
}

/**
 * Create Location Type Request
 */
export interface CreateLocationTypeData {
  tenant_id: string;
  code: string;                         // Must be uppercase: ^[A-Z0-9_]+$
  name: string;
  description?: string;
  extra_fields?: ExtraFieldDefinition[];
  is_system?: boolean;
  is_active?: boolean;
}

/**
 * Update Location Type Request
 * Includes version for optimistic locking
 */
export interface UpdateLocationTypeData {
  code?: string;
  name?: string;
  description?: string;
  extra_fields?: ExtraFieldDefinition[];
  is_active?: boolean;
  version: number;                      // Required for optimistic locking
}

/**
 * Location Type Filters
 */
export interface LocationTypeFilters extends BaseFilters {
  tenant_id?: string;
  is_active?: boolean;
  is_system?: boolean;
  search?: string;                      // Search in code, name, description
}

/**
 * Validation helpers
 */
export const LocationTypeValidation = {
  /**
   * Validate code format: uppercase letters, numbers, underscore only
   */
  isValidCode: (code: string): boolean => {
    return /^[A-Z0-9_]+$/.test(code);
  },

  /**
   * Format code to valid format
   */
  formatCode: (code: string): string => {
    return code.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  },

  /**
   * Validate extra field definition
   */
  isValidExtraField: (field: ExtraFieldDefinition): boolean => {
    if (!field.code || !field.name || !field.type) return false;
    if (!/^[a-z0-9_]+$/.test(field.code)) return false; // Lowercase for field codes
    if ((field.type === 'select' || field.type === 'multiselect') && (!field.options || field.options.length === 0)) {
      return false;
    }
    return true;
  },

  /**
   * Get validation error message
   */
  getCodeError: (code: string): string | null => {
    if (!code) return 'Code is required';
    if (code.length === 0) return 'Code cannot be empty';
    if (!LocationTypeValidation.isValidCode(code)) {
      return 'Code must contain only uppercase letters, numbers, and underscores';
    }
    return null;
  },

  /**
   * Get name validation error
   */
  getNameError: (name: string): string | null => {
    if (!name) return 'Name is required';
    if (name.trim().length === 0) return 'Name cannot be empty';
    return null;
  },
};

// Create adapter with optimistic locking support (no soft delete)
const adapter = createAdapter<LocationType, CreateLocationTypeData, UpdateLocationTypeData>(
  'location_types',
  '/location-types',
  false // No soft delete
);

/**
 * Location Types API
 */
export const locationTypesApi = {
  /**
   * GET /location-types
   * Get all location types with filters
   */
  getAll: (filters?: LocationTypeFilters) => adapter.getAll(filters),

  /**
   * GET /location-types/:id
   * Get location type by ID
   */
  getById: (id: string) => adapter.getById(id),

  /**
   * POST /location-types
   * Create new location type
   */
  create: async (data: CreateLocationTypeData): Promise<LocationType> => {
    // Validate code format
    const codeError = LocationTypeValidation.getCodeError(data.code);
    if (codeError) throw new Error(codeError);

    // Validate name
    const nameError = LocationTypeValidation.getNameError(data.name);
    if (nameError) throw new Error(nameError);

    // Validate extra fields if provided
    if (data.extra_fields) {
      for (const field of data.extra_fields) {
        if (!LocationTypeValidation.isValidExtraField(field)) {
          throw new Error(`Invalid extra field: ${field.code || 'unknown'}`);
        }
      }
    }

    return adapter.create(data);
  },

  /**
   * PUT /location-types/:id
   * Update location type with optimistic locking
   */
  update: async (id: string, data: UpdateLocationTypeData): Promise<LocationType> => {
    // Validate version for optimistic locking
    if (!data.version || data.version < 1) {
      throw new Error('Version is required for optimistic locking');
    }

    // Validate code if provided
    if (data.code) {
      const codeError = LocationTypeValidation.getCodeError(data.code);
      if (codeError) throw new Error(codeError);
    }

    // Validate name if provided
    if (data.name !== undefined) {
      const nameError = LocationTypeValidation.getNameError(data.name);
      if (nameError) throw new Error(nameError);
    }

    // Validate extra fields if provided
    if (data.extra_fields) {
      for (const field of data.extra_fields) {
        if (!LocationTypeValidation.isValidExtraField(field)) {
          throw new Error(`Invalid extra field: ${field.code || 'unknown'}`);
        }
      }
    }

    return adapter.update(id, data);
  },

  /**
   * DELETE /location-types/:id
   * Delete location type (hard delete, no soft delete)
   * System types cannot be deleted
   */
  delete: async (id: string): Promise<void> => {
    // Check if system type
    const locationType = await adapter.getById(id);
    if (locationType.is_system) {
      throw new Error('Cannot delete system location type');
    }

    return adapter.delete(id);
  },

  /**
   * GET /location-types/active
   * Get only active location types
   */
  getActive: async (filters?: Omit<LocationTypeFilters, 'is_active'>): Promise<LocationType[]> => {
    return adapter.getAll({ ...filters, is_active: true });
  },

  /**
   * GET /location-types/by-tenant/:tenantId
   * Get location types by tenant
   */
  getByTenant: async (tenantId: string, activeOnly: boolean = false): Promise<LocationType[]> => {
    return adapter.getAll({ 
      tenant_id: tenantId,
      ...(activeOnly && { is_active: true })
    });
  },

  /**
   * PATCH /location-types/:id/toggle-active
   * Toggle active status
   */
  toggleActive: async (id: string, version: number): Promise<LocationType> => {
    const locationType = await adapter.getById(id);
    
    // System types can be toggled
    return adapter.update(id, {
      is_active: !locationType.is_active,
      version,
    });
  },

  /**
   * GET /location-types/validate-code/:code
   * Check if code already exists for tenant
   */
  validateCode: async (code: string, tenantId: string, excludeId?: string): Promise<boolean> => {
    const types = await adapter.getAll({ tenant_id: tenantId });
    const exists = types.some(t => 
      t.code === code && (!excludeId || t._id !== excludeId)
    );
    return !exists; // Returns true if code is available
  },

  /**
   * Utility: Get extra field definition by code
   */
  getExtraFieldDefinition: (locationType: LocationType, fieldCode: string): ExtraFieldDefinition | undefined => {
    return locationType.extra_fields.find(f => f.code === fieldCode);
  },

  /**
   * Utility: Sort extra fields by order
   */
  getSortedExtraFields: (locationType: LocationType): ExtraFieldDefinition[] => {
    return [...locationType.extra_fields].sort((a, b) => (a.order || 0) - (b.order || 0));
  },
};

export default locationTypesApi;
