/**
 * Location Types API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ CREATED 2026-01-14: 100% matches location_types schema (11 fields)
 * Location Types define the dynamic schema for locations (Office, Warehouse, Branch, etc.)
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

/**
 * Extra Field Definition
 * Defines dynamic fields for location type with JSON Schema validation
 */
export interface ExtraFieldDefinition {
  field_name: string;           // Field identifier (e.g., 'warehouse_capacity')
  field_type: 'text' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect' | 'json';
  label: string;                // Display label
  placeholder?: string;         // Input placeholder
  description?: string;         // Help text
  required?: boolean;           // Is required field
  default_value?: any;          // Default value
  validation?: {
    min?: number;               // Min value (for number)
    max?: number;               // Max value (for number)
    minLength?: number;         // Min length (for text)
    maxLength?: number;         // Max length (for text)
    pattern?: string;           // Regex pattern
    options?: string[];         // Options for select/multiselect
  };
  order?: number;               // Display order
}

/**
 * LocationType - 100% matches location_types table (11 fields)
 */
export interface LocationType {
  // Identity (1)
  _id: string;
  
  // Multi-tenancy (1)
  tenant_id?: string;           // NULL = System Type (built-in), NOT NULL = Custom Type
  
  // Basic Info (3)
  code: string;                 // varchar(50) - Must be uppercase, no spaces (e.g., 'OFFICE', 'WAREHOUSE')
  name: string;                 // text - Display name
  description?: string;         // text - Optional description
  
  // Dynamic Schema Configuration (1) - CORE FEATURE!
  extra_fields: ExtraFieldDefinition[];  // jsonb default '[]' - Define additional fields for this type
  
  // Status (2)
  is_system: boolean;           // boolean default false - System type cannot be deleted
  is_active: boolean;           // boolean default true - Active/Inactive status
  
  // Audit (3)
  created_at: string;           // timestamptz not null
  updated_at: string;           // timestamptz not null
  version: number;              // bigint not null default 1
}

/**
 * Create Location Type Request
 */
export interface CreateLocationTypeRequest {
  tenant_id?: string;           // NULL = System Type
  code: string;                 // Must be UPPERCASE, no spaces
  name: string;
  description?: string;
  extra_fields?: ExtraFieldDefinition[];
  is_system?: boolean;          // Default false
  is_active?: boolean;          // Default true
}

/**
 * Update Location Type Request
 */
export interface UpdateLocationTypeRequest {
  code?: string;
  name?: string;
  description?: string;
  extra_fields?: ExtraFieldDefinition[];
  is_active?: boolean;
}

/**
 * Location Type Filters
 */
export interface LocationTypeFilters extends BaseFilters {
  tenant_id?: string;
  code?: string;
  is_system?: boolean;
  is_active?: boolean;
  include_system?: boolean;     // Include system types in results
}

/**
 * Location Type Statistics
 */
export interface LocationTypeStats {
  total: number;
  system_types: number;
  custom_types: number;
  active: number;
  inactive: number;
  with_extra_fields: number;
  by_tenant: Record<string, number>;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<LocationType, CreateLocationTypeRequest, UpdateLocationTypeRequest>(
  'location_types',
  '/location-types'
);

// ==================== API CLIENT ====================

export const locationTypesApi = {
  /**
   * GET /location-types
   */
  getAll: async (filters?: LocationTypeFilters): Promise<LocationType[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /location-types/:id
   */
  getById: async (id: string): Promise<LocationType> => {
    return adapter.getById(id);
  },

  /**
   * POST /location-types
   */
  create: async (data: CreateLocationTypeRequest): Promise<LocationType> => {
    // Validate code format (uppercase, no spaces)
    if (!/^[A-Z0-9_]+$/.test(data.code)) {
      throw new Error('Code must be uppercase with no spaces (e.g., OFFICE, WAREHOUSE)');
    }
    
    // Validate name
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Name is required');
    }
    
    // Validate extra_fields if provided
    if (data.extra_fields) {
      validateExtraFields(data.extra_fields);
    }
    
    return adapter.create(data);
  },

  /**
   * PATCH /location-types/:id
   */
  update: async (id: string, data: UpdateLocationTypeRequest): Promise<LocationType> => {
    // Validate code format if provided
    if (data.code && !/^[A-Z0-9_]+$/.test(data.code)) {
      throw new Error('Code must be uppercase with no spaces');
    }
    
    // Validate extra_fields if provided
    if (data.extra_fields) {
      validateExtraFields(data.extra_fields);
    }
    
    return adapter.update(id, data);
  },

  /**
   * DELETE /location-types/:id
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * Get system location types (built-in)
   */
  getSystemTypes: async (): Promise<LocationType[]> => {
    return adapter.getAll({
      is_system: true,
      is_active: true,
    });
  },

  /**
   * Get custom location types for a tenant
   */
  getCustomTypes: async (tenantId: string): Promise<LocationType[]> => {
    return adapter.getAll({
      tenant_id: tenantId,
      is_system: false,
    });
  },

  /**
   * Get all types available for a tenant (system + custom)
   */
  getAvailableTypes: async (tenantId: string): Promise<LocationType[]> => {
    // Get both system types and tenant's custom types
    const [systemTypes, customTypes] = await Promise.all([
      locationTypesApi.getSystemTypes(),
      locationTypesApi.getCustomTypes(tenantId),
    ]);
    
    return [...systemTypes, ...customTypes];
  },

  /**
   * Get active location types
   */
  getActive: async (filters?: Omit<LocationTypeFilters, 'is_active'>): Promise<LocationType[]> => {
    return adapter.getAll({
      ...filters,
      is_active: true,
    });
  },

  /**
   * Get location type by code
   */
  getByCode: async (code: string, tenantId?: string): Promise<LocationType | null> => {
    const types = await adapter.getAll({
      code,
      tenant_id: tenantId,
    });
    return types.length > 0 ? types[0] : null;
  },

  /**
   * Check if code exists
   */
  codeExists: async (code: string, tenantId?: string, excludeId?: string): Promise<boolean> => {
    const types = await adapter.getAll({
      code,
      tenant_id: tenantId,
    });
    
    if (excludeId) {
      return types.some(t => t._id !== excludeId);
    }
    
    return types.length > 0;
  },

  /**
   * Get statistics
   */
  getStats: async (filters?: LocationTypeFilters): Promise<LocationTypeStats> => {
    const types = await adapter.getAll(filters);
    
    const stats: LocationTypeStats = {
      total: types.length,
      system_types: types.filter(t => t.is_system).length,
      custom_types: types.filter(t => !t.is_system).length,
      active: types.filter(t => t.is_active).length,
      inactive: types.filter(t => !t.is_active).length,
      with_extra_fields: types.filter(t => t.extra_fields && t.extra_fields.length > 0).length,
      by_tenant: {},
    };
    
    // Count by tenant
    types.forEach(t => {
      if (t.tenant_id) {
        stats.by_tenant[t.tenant_id] = (stats.by_tenant[t.tenant_id] || 0) + 1;
      }
    });
    
    return stats;
  },

  /**
   * Activate location type
   */
  activate: async (id: string): Promise<LocationType> => {
    return adapter.update(id, { is_active: true });
  },

  /**
   * Deactivate location type
   */
  deactivate: async (id: string): Promise<LocationType> => {
    return adapter.update(id, { is_active: false });
  },

  /**
   * Clone location type (create copy)
   */
  clone: async (id: string, newCode: string, newName: string): Promise<LocationType> => {
    const original = await adapter.getById(id);
    
    return adapter.create({
      tenant_id: original.tenant_id,
      code: newCode,
      name: newName,
      description: original.description ? `${original.description} (Cloned)` : undefined,
      extra_fields: original.extra_fields,
      is_system: false, // Cloned types are never system types
      is_active: true,
    });
  },

  /**
   * Add extra field to location type
   */
  addExtraField: async (id: string, field: ExtraFieldDefinition): Promise<LocationType> => {
    const locationType = await adapter.getById(id);
    
    // Validate field
    validateExtraFields([field]);
    
    // Check if field_name already exists
    if (locationType.extra_fields.some(f => f.field_name === field.field_name)) {
      throw new Error(`Field '${field.field_name}' already exists`);
    }
    
    const updatedFields = [...locationType.extra_fields, field];
    
    return adapter.update(id, {
      extra_fields: updatedFields,
    });
  },

  /**
   * Remove extra field from location type
   */
  removeExtraField: async (id: string, fieldName: string): Promise<LocationType> => {
    const locationType = await adapter.getById(id);
    
    const updatedFields = locationType.extra_fields.filter(f => f.field_name !== fieldName);
    
    return adapter.update(id, {
      extra_fields: updatedFields,
    });
  },

  /**
   * Update extra field in location type
   */
  updateExtraField: async (id: string, fieldName: string, field: Partial<ExtraFieldDefinition>): Promise<LocationType> => {
    const locationType = await adapter.getById(id);
    
    const fieldIndex = locationType.extra_fields.findIndex(f => f.field_name === fieldName);
    if (fieldIndex === -1) {
      throw new Error(`Field '${fieldName}' not found`);
    }
    
    const updatedFields = [...locationType.extra_fields];
    updatedFields[fieldIndex] = { ...updatedFields[fieldIndex], ...field };
    
    // Validate updated field
    validateExtraFields([updatedFields[fieldIndex]]);
    
    return adapter.update(id, {
      extra_fields: updatedFields,
    });
  },

  /**
   * Reorder extra fields
   */
  reorderExtraFields: async (id: string, fieldNames: string[]): Promise<LocationType> => {
    const locationType = await adapter.getById(id);
    
    // Create new order
    const reorderedFields = fieldNames.map((name, index) => {
      const field = locationType.extra_fields.find(f => f.field_name === name);
      if (!field) {
        throw new Error(`Field '${name}' not found`);
      }
      return { ...field, order: index };
    });
    
    return adapter.update(id, {
      extra_fields: reorderedFields,
    });
  },

  /**
   * Bulk activate
   */
  bulkActivate: async (ids: string[]): Promise<void> => {
    await Promise.all(ids.map(id => locationTypesApi.activate(id)));
  },

  /**
   * Bulk deactivate
   */
  bulkDeactivate: async (ids: string[]): Promise<void> => {
    await Promise.all(ids.map(id => locationTypesApi.deactivate(id)));
  },

  /**
   * Bulk delete
   */
  bulkDelete: async (ids: string[]): Promise<void> => {
    await Promise.all(ids.map(id => adapter.delete(id)));
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Validate extra fields definition
 */
function validateExtraFields(fields: ExtraFieldDefinition[]): void {
  const fieldNames = new Set<string>();
  
  fields.forEach((field, index) => {
    // Check required properties
    if (!field.field_name || !field.field_type || !field.label) {
      throw new Error(`Extra field at index ${index} is missing required properties (field_name, field_type, label)`);
    }
    
    // Check field_name format (lowercase, underscores only)
    if (!/^[a-z0-9_]+$/.test(field.field_name)) {
      throw new Error(`Field name '${field.field_name}' must be lowercase with underscores only`);
    }
    
    // Check for duplicate field_name
    if (fieldNames.has(field.field_name)) {
      throw new Error(`Duplicate field name '${field.field_name}'`);
    }
    fieldNames.add(field.field_name);
    
    // Validate field_type
    const validTypes = ['text', 'number', 'boolean', 'date', 'select', 'multiselect', 'json'];
    if (!validTypes.includes(field.field_type)) {
      throw new Error(`Invalid field_type '${field.field_type}'. Must be one of: ${validTypes.join(', ')}`);
    }
    
    // Validate select/multiselect options
    if ((field.field_type === 'select' || field.field_type === 'multiselect') && 
        (!field.validation?.options || field.validation.options.length === 0)) {
      throw new Error(`Field '${field.field_name}' of type '${field.field_type}' must have options`);
    }
    
    // Validate number constraints
    if (field.field_type === 'number' && field.validation) {
      if (field.validation.min !== undefined && field.validation.max !== undefined && 
          field.validation.min > field.validation.max) {
        throw new Error(`Field '${field.field_name}': min cannot be greater than max`);
      }
    }
    
    // Validate text constraints
    if (field.field_type === 'text' && field.validation) {
      if (field.validation.minLength !== undefined && field.validation.maxLength !== undefined && 
          field.validation.minLength > field.validation.maxLength) {
        throw new Error(`Field '${field.field_name}': minLength cannot be greater than maxLength`);
      }
    }
  });
}

/**
 * Get field type icon for UI
 */
export function getFieldTypeIcon(fieldType: ExtraFieldDefinition['field_type']): string {
  const icons: Record<ExtraFieldDefinition['field_type'], string> = {
    text: '📝',
    number: '🔢',
    boolean: '☑️',
    date: '📅',
    select: '📋',
    multiselect: '📑',
    json: '🔧',
  };
  return icons[fieldType];
}

/**
 * Get field type color for UI
 */
export function getFieldTypeColor(fieldType: ExtraFieldDefinition['field_type']): string {
  const colors: Record<ExtraFieldDefinition['field_type'], string> = {
    text: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    number: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    boolean: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    date: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    select: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    multiselect: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    json: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };
  return colors[fieldType];
}

/**
 * Format location type code for display
 */
export function formatCode(code: string): string {
  return code
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Generate field name from label
 */
export function generateFieldName(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Validate field value against field definition
 */
export function validateFieldValue(
  value: any,
  field: ExtraFieldDefinition
): { valid: boolean; error?: string } {
  // Check required
  if (field.required && (value === null || value === undefined || value === '')) {
    return { valid: false, error: `${field.label} is required` };
  }
  
  // If not required and empty, skip validation
  if (!field.required && (value === null || value === undefined || value === '')) {
    return { valid: true };
  }
  
  // Validate by type
  switch (field.field_type) {
    case 'text':
      if (typeof value !== 'string') {
        return { valid: false, error: `${field.label} must be text` };
      }
      if (field.validation?.minLength && value.length < field.validation.minLength) {
        return { valid: false, error: `${field.label} must be at least ${field.validation.minLength} characters` };
      }
      if (field.validation?.maxLength && value.length > field.validation.maxLength) {
        return { valid: false, error: `${field.label} must be at most ${field.validation.maxLength} characters` };
      }
      if (field.validation?.pattern && !new RegExp(field.validation.pattern).test(value)) {
        return { valid: false, error: `${field.label} format is invalid` };
      }
      break;
      
    case 'number':
      if (typeof value !== 'number') {
        return { valid: false, error: `${field.label} must be a number` };
      }
      if (field.validation?.min !== undefined && value < field.validation.min) {
        return { valid: false, error: `${field.label} must be at least ${field.validation.min}` };
      }
      if (field.validation?.max !== undefined && value > field.validation.max) {
        return { valid: false, error: `${field.label} must be at most ${field.validation.max}` };
      }
      break;
      
    case 'boolean':
      if (typeof value !== 'boolean') {
        return { valid: false, error: `${field.label} must be true or false` };
      }
      break;
      
    case 'date':
      if (!/^\d{4}-\d{2}-\d{2}/.test(String(value))) {
        return { valid: false, error: `${field.label} must be a valid date` };
      }
      break;
      
    case 'select':
      if (!field.validation?.options?.includes(String(value))) {
        return { valid: false, error: `${field.label} must be one of: ${field.validation?.options?.join(', ')}` };
      }
      break;
      
    case 'multiselect':
      if (!Array.isArray(value)) {
        return { valid: false, error: `${field.label} must be an array` };
      }
      const invalidOptions = value.filter(v => !field.validation?.options?.includes(v));
      if (invalidOptions.length > 0) {
        return { valid: false, error: `${field.label} contains invalid options: ${invalidOptions.join(', ')}` };
      }
      break;
      
    case 'json':
      try {
        if (typeof value === 'string') {
          JSON.parse(value);
        } else if (typeof value !== 'object') {
          return { valid: false, error: `${field.label} must be valid JSON` };
        }
      } catch {
        return { valid: false, error: `${field.label} must be valid JSON` };
      }
      break;
  }
  
  return { valid: true };
}

/**
 * Get default value for field type
 */
export function getDefaultValue(field: ExtraFieldDefinition): any {
  if (field.default_value !== undefined) {
    return field.default_value;
  }
  
  switch (field.field_type) {
    case 'text':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'date':
      return new Date().toISOString().split('T')[0];
    case 'select':
      return field.validation?.options?.[0] || '';
    case 'multiselect':
      return [];
    case 'json':
      return {};
    default:
      return null;
  }
}

export default locationTypesApi;
