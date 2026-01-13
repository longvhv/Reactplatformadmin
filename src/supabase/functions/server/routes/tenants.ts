/**
 * Tenants API Routes
 * CRUD operations with optimistic locking and proper error handling
 */

import { Hono } from 'npm:hono';
import { getSupabaseClient, requireAuth } from '../lib/auth.ts';
import { asyncHandler, AppError, ErrorCodes, handleSupabaseError } from '../lib/error-handler.ts';
import { 
  validateTenantCode, 
  validateTenantName, 
  validateVersion, 
  validateUUID,
  validateRequired 
} from '../lib/validation.ts';

// ============================================
// TYPE DEFINITIONS (Server-side types)
// ============================================

type TenantStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
type TenantTier = 'FREE' | 'PRO' | 'ENTERPRISE' | 'PARTNER_BASIC' | 'PARTNER_PREMIUM' | 'PARTNER_ELITE' | 'PROVIDER';
type DataRegion = 'ap-southeast-1' | 'us-east-1' | 'eu-central-1';
type ComplianceLevel = 'STANDARD' | 'GDPR' | 'HIPAA' | 'PCI-DSS';
type BillingType = 'PREPAID' | 'POSTPAID';

interface Tenant {
  _id: string;
  code: string;
  name: string;
  parent_tenant_id?: string | null;
  path?: string | null;
  tier: TenantTier;
  status: TenantStatus;
  data_region: DataRegion;
  compliance_level: ComplianceLevel;
  timezone: string;
  billing_type: BillingType;
  profile: Record<string, any>;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
  version: number;
}

interface CreateTenantInput {
  code: string;
  name: string;
  parent_tenant_id?: string | null;
  tier?: TenantTier;
  status?: TenantStatus;
  data_region?: DataRegion;
  compliance_level?: ComplianceLevel;
  timezone?: string;
  billing_type?: BillingType;
  profile?: Record<string, any>;
  settings?: Record<string, any>;
}

interface UpdateTenantInput extends Partial<CreateTenantInput> {
  version?: number;
}

const app = new Hono();

/**
 * GET /tenants
 * List all tenants with optional filters
 */
app.get('/', asyncHandler(async (c) => {
  const supabase = getSupabaseClient();
  
  // Query parameters
  const status = c.req.query('status') as TenantStatus | undefined;
  const tier = c.req.query('tier') as TenantTier | undefined;
  const data_region = c.req.query('data_region');
  const parent_tenant_id = c.req.query('parent_tenant_id');
  const search = c.req.query('search');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  const offset = parseInt(c.req.query('offset') || '0');
  
  let query = supabase
    .from('tenants')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  // Apply filters
  if (status) query = query.eq('status', status);
  if (tier) query = query.eq('tier', tier);
  if (data_region) query = query.eq('data_region', data_region);
  if (parent_tenant_id === 'null') {
    query = query.is('parent_tenant_id', null);
  } else if (parent_tenant_id) {
    validateUUID(parent_tenant_id, 'parent_tenant_id');
    query = query.eq('parent_tenant_id', parent_tenant_id);
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
  }
  
  const { data, error, count } = await query;
  
  if (error) {
    throw handleSupabaseError(error);
  }
  
  return c.json({
    data: data || [],
    pagination: {
      total: count || 0,
      limit,
      offset,
      has_more: count ? count > offset + limit : false,
    },
  });
}));

/**
 * GET /tenants/:id
 * Get single tenant by ID
 */
app.get('/:id', asyncHandler(async (c) => {
  const id = c.req.param('id');
  validateUUID(id, 'tenant_id');
  
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('_id', id)
    .is('deleted_at', null)
    .single();
  
  if (error) {
    throw handleSupabaseError(error);
  }
  
  if (!data) {
    throw new AppError(404, ErrorCodes.NOT_FOUND, 'Tenant not found');
  }
  
  return c.json({ data });
}));

/**
 * POST /tenants
 * Create new tenant
 */
app.post('/', asyncHandler(async (c) => {
  const userId = await requireAuth(c);
  const body = await c.req.json<CreateTenantInput>();
  const supabase = getSupabaseClient();
  
  // Validation
  validateRequired(body, ['name', 'code']);
  validateTenantName(body.name);
  validateTenantCode(body.code);
  
  // Check code uniqueness
  const { data: existing } = await supabase
    .from('tenants')
    .select('_id')
    .eq('code', body.code)
    .is('deleted_at', null)
    .maybeSingle();
  
  if (existing) {
    throw new AppError(409, ErrorCodes.CONFLICT, 'Code already exists');
  }
  
  // Validate parent tenant if provided
  if (body.parent_tenant_id) {
    validateUUID(body.parent_tenant_id, 'parent_tenant_id');
    
    const { data: parent, error: parentError } = await supabase
      .from('tenants')
      .select('_id')
      .eq('_id', body.parent_tenant_id)
      .is('deleted_at', null)
      .maybeSingle();
    
    if (parentError) {
      throw handleSupabaseError(parentError);
    }
    
    if (!parent) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'Parent tenant not found');
    }
  }
  
  // Prepare insert data
  const insertData = {
    code: body.code,
    name: body.name,
    data_region: body.data_region || 'ap-southeast-1',
    compliance_level: body.compliance_level || 'STANDARD',
    parent_tenant_id: body.parent_tenant_id || null,
    tier: body.tier || 'FREE',
    billing_type: body.billing_type || 'POSTPAID',
    timezone: body.timezone || 'UTC',
    profile: body.profile || {},
    settings: body.settings || {
      max_users: 10,
      max_storage: 10,
      current_users: 0,
      current_storage: 0,
      mfa_enforced: false,
      sso_enabled: false,
      custom_branding: false,
      api_access: false,
      features: [],
    },
    status: body.status || 'TRIAL',
    created_by: userId,
    updated_by: userId,
  };
  
  const { data, error } = await supabase
    .from('tenants')
    .insert(insertData)
    .select()
    .single();
  
  if (error) {
    throw handleSupabaseError(error);
  }
  
  return c.json({ data }, 201);
}));

/**
 * PATCH /tenants/:id
 * Update tenant with optimistic locking
 */
app.patch('/:id', asyncHandler(async (c) => {
  const id = c.req.param('id');
  validateUUID(id, 'tenant_id');
  
  const userId = await requireAuth(c);
  const body = await c.req.json<Partial<UpdateTenantInput>>();
  const supabase = getSupabaseClient();
  
  // Get current tenant for version check
  const { data: current, error: fetchError } = await supabase
    .from('tenants')
    .select('*')
    .eq('_id', id)
    .is('deleted_at', null)
    .single();
  
  if (fetchError) {
    throw handleSupabaseError(fetchError);
  }
  
  if (!current) {
    throw new AppError(404, ErrorCodes.NOT_FOUND, 'Tenant not found');
  }
  
  // Optimistic locking check
  if (body.version !== undefined) {
    validateVersion(body.version, current.version);
  }
  
  // Validate fields if provided
  if (body.name !== undefined) {
    validateTenantName(body.name);
  }
  
  if (body.code !== undefined) {
    validateTenantCode(body.code);
    
    // Check code uniqueness (excluding current tenant)
    if (body.code !== current.code) {
      const { data: existing } = await supabase
        .from('tenants')
        .select('_id')
        .eq('code', body.code)
        .neq('_id', id)
        .is('deleted_at', null)
        .maybeSingle();
      
      if (existing) {
        throw new AppError(409, ErrorCodes.CONFLICT, 'Code already exists');
      }
    }
  }
  
  // Validate parent tenant if changed
  if (body.parent_tenant_id !== undefined && body.parent_tenant_id !== current.parent_tenant_id) {
    if (body.parent_tenant_id) {
      validateUUID(body.parent_tenant_id, 'parent_tenant_id');
      
      // Prevent self-reference
      if (body.parent_tenant_id === id) {
        throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Tenant cannot be its own parent');
      }
      
      const { data: parent, error: parentError } = await supabase
        .from('tenants')
        .select('_id')
        .eq('_id', body.parent_tenant_id)
        .is('deleted_at', null)
        .maybeSingle();
      
      if (parentError) {
        throw handleSupabaseError(parentError);
      }
      
      if (!parent) {
        throw new AppError(404, ErrorCodes.NOT_FOUND, 'Parent tenant not found');
      }
    }
  }
  
  // Prepare update data
  const updateData: any = {
    updated_by: userId,
  };
  
  // Only update fields that are provided
  const allowedFields = [
    'name', 'code', 'tier', 'status', 'data_region', 'compliance_level',
    'billing_type', 'timezone', 'parent_tenant_id', 'profile', 'settings'
  ];
  
  for (const field of allowedFields) {
    if (body[field as keyof typeof body] !== undefined) {
      updateData[field] = body[field as keyof typeof body];
    }
  }
  
  // Update with optimistic locking
  const { data, error } = await supabase
    .from('tenants')
    .update(updateData)
    .eq('_id', id)
    .eq('version', current.version)
    .is('deleted_at', null)
    .select()
    .single();
  
  if (error) {
    throw handleSupabaseError(error);
  }
  
  if (!data) {
    throw new AppError(
      409,
      ErrorCodes.VERSION_CONFLICT,
      'Tenant was modified by another user. Please refresh and try again.'
    );
  }
  
  return c.json({ data });
}));

/**
 * DELETE /tenants/:id
 * Soft delete tenant
 */
app.delete('/:id', asyncHandler(async (c) => {
  const id = c.req.param('id');
  validateUUID(id, 'tenant_id');
  
  const userId = await requireAuth(c);
  const supabase = getSupabaseClient();
  
  // Check if tenant has children
  const { data: children } = await supabase
    .from('tenants')
    .select('_id')
    .eq('parent_tenant_id', id)
    .is('deleted_at', null)
    .limit(1);
  
  if (children && children.length > 0) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Cannot delete tenant with child tenants. Delete children first.'
    );
  }
  
  // Soft delete
  const { data, error } = await supabase
    .from('tenants')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
    })
    .eq('_id', id)
    .is('deleted_at', null)
    .select()
    .single();
  
  if (error) {
    throw handleSupabaseError(error);
  }
  
  if (!data) {
    throw new AppError(404, ErrorCodes.NOT_FOUND, 'Tenant not found or already deleted');
  }
  
  return c.json({ message: 'Tenant deleted successfully', data });
}));

export default app;