/**
 * Tenant Members API
 * Manages user-tenant relationships (employee profiles at each tenant)
 * 
 * Features:
 * - CRUD operations for tenant members
 * - Role-based access control
 * - Manager hierarchy support
 * - localStorage fallback for offline-first
 */

import { Context } from 'npm:hono@4';
import * as kv from './kv_store.tsx';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface TenantMember {
  _id: string;
  tenant_id: string;
  user_id: string;
  employee_code?: string;
  internal_email?: string;
  job_title?: string;
  manager_id?: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  status: 'ACTIVE' | 'RESIGNED' | 'ONBOARDING' | 'SUSPENDED';
  joined_at?: string;
  left_at?: string;
  permissions?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
  deleted_by?: string;
  version: number;
}

interface TenantMemberInput {
  tenant_id: string;
  user_id: string;
  employee_code?: string;
  internal_email?: string;
  job_title?: string;
  manager_id?: string;
  role?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  status?: 'ACTIVE' | 'RESIGNED' | 'ONBOARDING' | 'SUSPENDED';
  joined_at?: string;
  left_at?: string;
  permissions?: string[];
  metadata?: Record<string, any>;
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

function validateTenantMember(data: TenantMemberInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!data.tenant_id?.trim()) {
    errors.push('tenant_id is required');
  }

  if (!data.user_id?.trim()) {
    errors.push('user_id is required');
  }

  // Validate role
  const validRoles = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];
  if (data.role && !validRoles.includes(data.role)) {
    errors.push(`role must be one of: ${validRoles.join(', ')}`);
  }

  // Validate status
  const validStatuses = ['ACTIVE', 'RESIGNED', 'ONBOARDING', 'SUSPENDED'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push(`status must be one of: ${validStatuses.join(', ')}`);
  }

  // Validate email format
  if (data.internal_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.internal_email)) {
    errors.push('internal_email must be a valid email address');
  }

  // Validate dates
  if (data.joined_at && isNaN(Date.parse(data.joined_at))) {
    errors.push('joined_at must be a valid date');
  }

  if (data.left_at && isNaN(Date.parse(data.left_at))) {
    errors.push('left_at must be a valid date');
  }

  // Validate joined_at < left_at
  if (data.joined_at && data.left_at) {
    const joinedDate = new Date(data.joined_at);
    const leftDate = new Date(data.left_at);
    if (joinedDate >= leftDate) {
      errors.push('left_at must be after joined_at');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateId(): string {
  return `tm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function getTenantMemberById(id: string): Promise<TenantMember | null> {
  try {
    const member = await kv.get(`tenant_member:${id}`);
    return member as TenantMember | null;
  } catch (error) {
    console.error('[getTenantMemberById] Error:', error);
    return null;
  }
}

async function getAllTenantMembers(): Promise<TenantMember[]> {
  try {
    const members = await kv.getByPrefix('tenant_member:');
    return (members || []) as TenantMember[];
  } catch (error) {
    console.error('[getAllTenantMembers] Error:', error);
    return [];
  }
}

async function getMembersByTenantId(tenantId: string): Promise<TenantMember[]> {
  try {
    const allMembers = await getAllTenantMembers();
    return allMembers.filter(m => m.tenant_id === tenantId && !m.deleted_at);
  } catch (error) {
    console.error('[getMembersByTenantId] Error:', error);
    return [];
  }
}

async function getMembersByUserId(userId: string): Promise<TenantMember[]> {
  try {
    const allMembers = await getAllTenantMembers();
    return allMembers.filter(m => m.user_id === userId && !m.deleted_at);
  } catch (error) {
    console.error('[getMembersByUserId] Error:', error);
    return [];
  }
}

// ============================================
// API HANDLERS
// ============================================

/**
 * GET /tenant-members
 * Get all tenant members or filter by tenant_id/user_id
 */
export async function getTenantMembers(c: Context) {
  try {
    const { tenant_id, user_id, status, role } = c.req.query();
    
    let members = await getAllTenantMembers();
    
    // Filter by tenant_id
    if (tenant_id) {
      members = members.filter(m => m.tenant_id === tenant_id);
    }
    
    // Filter by user_id
    if (user_id) {
      members = members.filter(m => m.user_id === user_id);
    }
    
    // Filter by status
    if (status) {
      members = members.filter(m => m.status === status);
    }
    
    // Filter by role
    if (role) {
      members = members.filter(m => m.role === role);
    }
    
    // Exclude soft-deleted records
    members = members.filter(m => !m.deleted_at);
    
    // Sort by created_at descending
    members.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return c.json({
      success: true,
      data: members,
      total: members.length
    });
  } catch (error: any) {
    console.error('[getTenantMembers] Error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch tenant members',
      details: error.message
    }, 500);
  }
}

/**
 * GET /tenant-members/:id
 * Get single tenant member by ID
 */
export async function getTenantMemberDetails(c: Context) {
  try {
    const { id } = c.req.param();
    
    if (!id) {
      return c.json({
        success: false,
        error: 'Member ID is required'
      }, 400);
    }

    const member = await getTenantMemberById(id);

    if (!member || member.deleted_at) {
      return c.json({
        success: false,
        error: 'Tenant member not found'
      }, 404);
    }

    return c.json({
      success: true,
      data: member
    });
  } catch (error: any) {
    console.error('[getTenantMemberDetails] Error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch tenant member',
      details: error.message
    }, 500);
  }
}

/**
 * POST /tenant-members
 * Create new tenant member
 */
export async function createTenantMember(c: Context) {
  try {
    const body = await c.req.json();
    
    // Validate input
    const validation = validateTenantMember(body);
    if (!validation.valid) {
      return c.json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      }, 400);
    }

    // Check if relationship already exists
    const existingMembers = await getAllTenantMembers();
    const duplicate = existingMembers.find(
      m => m.tenant_id === body.tenant_id && 
           m.user_id === body.user_id && 
           !m.deleted_at
    );

    if (duplicate) {
      return c.json({
        success: false,
        error: 'User is already a member of this tenant'
      }, 409);
    }

    // Create new member
    const now = new Date().toISOString();
    const newMember: TenantMember = {
      _id: generateId(),
      tenant_id: body.tenant_id,
      user_id: body.user_id,
      employee_code: body.employee_code,
      internal_email: body.internal_email,
      job_title: body.job_title,
      manager_id: body.manager_id,
      role: body.role || 'MEMBER',
      status: body.status || 'ACTIVE',
      joined_at: body.joined_at,
      left_at: body.left_at,
      permissions: body.permissions || [],
      metadata: body.metadata || {},
      created_at: now,
      updated_at: now,
      created_by: body.created_by,
      version: 1
    };

    // Save to KV store
    await kv.set(`tenant_member:${newMember._id}`, newMember);

    console.log(`[createTenantMember] Created member ${newMember._id} for tenant ${newMember.tenant_id}`);

    return c.json({
      success: true,
      data: newMember,
      message: 'Tenant member created successfully'
    }, 201);
  } catch (error: any) {
    console.error('[createTenantMember] Error:', error);
    return c.json({
      success: false,
      error: 'Failed to create tenant member',
      details: error.message
    }, 500);
  }
}

/**
 * PUT /tenant-members/:id
 * Update existing tenant member
 */
export async function updateTenantMember(c: Context) {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();

    if (!id) {
      return c.json({
        success: false,
        error: 'Member ID is required'
      }, 400);
    }

    // Get existing member
    const existingMember = await getTenantMemberById(id);
    if (!existingMember || existingMember.deleted_at) {
      return c.json({
        success: false,
        error: 'Tenant member not found'
      }, 404);
    }

    // Optimistic locking check
    if (body.version !== undefined && body.version !== existingMember.version) {
      return c.json({
        success: false,
        error: 'Conflict: member has been modified by another user',
        currentVersion: existingMember.version
      }, 409);
    }

    // Validate updated data
    const dataToValidate = {
      tenant_id: body.tenant_id || existingMember.tenant_id,
      user_id: body.user_id || existingMember.user_id,
      ...body
    };

    const validation = validateTenantMember(dataToValidate);
    if (!validation.valid) {
      return c.json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      }, 400);
    }

    // Update member
    const now = new Date().toISOString();
    const updatedMember: TenantMember = {
      ...existingMember,
      employee_code: body.employee_code !== undefined ? body.employee_code : existingMember.employee_code,
      internal_email: body.internal_email !== undefined ? body.internal_email : existingMember.internal_email,
      job_title: body.job_title !== undefined ? body.job_title : existingMember.job_title,
      manager_id: body.manager_id !== undefined ? body.manager_id : existingMember.manager_id,
      role: body.role || existingMember.role,
      status: body.status || existingMember.status,
      joined_at: body.joined_at !== undefined ? body.joined_at : existingMember.joined_at,
      left_at: body.left_at !== undefined ? body.left_at : existingMember.left_at,
      permissions: body.permissions || existingMember.permissions,
      metadata: { ...existingMember.metadata, ...body.metadata },
      updated_at: now,
      updated_by: body.updated_by,
      version: existingMember.version + 1
    };

    // Save to KV store
    await kv.set(`tenant_member:${id}`, updatedMember);

    console.log(`[updateTenantMember] Updated member ${id}`);

    return c.json({
      success: true,
      data: updatedMember,
      message: 'Tenant member updated successfully'
    });
  } catch (error: any) {
    console.error('[updateTenantMember] Error:', error);
    return c.json({
      success: false,
      error: 'Failed to update tenant member',
      details: error.message
    }, 500);
  }
}

/**
 * DELETE /tenant-members/:id
 * Soft delete tenant member
 */
export async function deleteTenantMember(c: Context) {
  try {
    const { id } = c.req.param();
    const body = await c.req.json().catch(() => ({}));

    if (!id) {
      return c.json({
        success: false,
        error: 'Member ID is required'
      }, 400);
    }

    // Get existing member
    const existingMember = await getTenantMemberById(id);
    if (!existingMember || existingMember.deleted_at) {
      return c.json({
        success: false,
        error: 'Tenant member not found'
      }, 404);
    }

    // Soft delete
    const now = new Date().toISOString();
    const deletedMember: TenantMember = {
      ...existingMember,
      deleted_at: now,
      deleted_by: body.deleted_by,
      updated_at: now,
      version: existingMember.version + 1
    };

    // Save to KV store
    await kv.set(`tenant_member:${id}`, deletedMember);

    console.log(`[deleteTenantMember] Soft deleted member ${id}`);

    return c.json({
      success: true,
      message: 'Tenant member deleted successfully'
    });
  } catch (error: any) {
    console.error('[deleteTenantMember] Error:', error);
    return c.json({
      success: false,
      error: 'Failed to delete tenant member',
      details: error.message
    }, 500);
  }
}

/**
 * GET /tenant-members/:id/subordinates
 * Get all direct reports for a manager
 */
export async function getSubordinates(c: Context) {
  try {
    const { id } = c.req.param();
    
    if (!id) {
      return c.json({
        success: false,
        error: 'Member ID is required'
      }, 400);
    }

    const allMembers = await getAllTenantMembers();
    const subordinates = allMembers.filter(
      m => m.manager_id === id && !m.deleted_at
    );

    return c.json({
      success: true,
      data: subordinates,
      total: subordinates.length
    });
  } catch (error: any) {
    console.error('[getSubordinates] Error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch subordinates',
      details: error.message
    }, 500);
  }
}

/**
 * POST /tenant-members/bulk
 * Bulk create tenant members
 */
export async function bulkCreateTenantMembers(c: Context) {
  try {
    const { members } = await c.req.json();

    if (!Array.isArray(members) || members.length === 0) {
      return c.json({
        success: false,
        error: 'members array is required and must not be empty'
      }, 400);
    }

    const results = {
      created: [] as TenantMember[],
      errors: [] as { index: number; errors: string[] }[]
    };

    const now = new Date().toISOString();

    for (let i = 0; i < members.length; i++) {
      const memberData = members[i];
      
      // Validate
      const validation = validateTenantMember(memberData);
      if (!validation.valid) {
        results.errors.push({ index: i, errors: validation.errors });
        continue;
      }

      // Check duplicate
      const existingMembers = await getAllTenantMembers();
      const duplicate = existingMembers.find(
        m => m.tenant_id === memberData.tenant_id && 
             m.user_id === memberData.user_id && 
             !m.deleted_at
      );

      if (duplicate) {
        results.errors.push({ 
          index: i, 
          errors: ['User is already a member of this tenant'] 
        });
        continue;
      }

      // Create member
      const newMember: TenantMember = {
        _id: generateId(),
        tenant_id: memberData.tenant_id,
        user_id: memberData.user_id,
        employee_code: memberData.employee_code,
        internal_email: memberData.internal_email,
        job_title: memberData.job_title,
        manager_id: memberData.manager_id,
        role: memberData.role || 'MEMBER',
        status: memberData.status || 'ACTIVE',
        joined_at: memberData.joined_at,
        left_at: memberData.left_at,
        permissions: memberData.permissions || [],
        metadata: memberData.metadata || {},
        created_at: now,
        updated_at: now,
        version: 1
      };

      await kv.set(`tenant_member:${newMember._id}`, newMember);
      results.created.push(newMember);
    }

    console.log(`[bulkCreateTenantMembers] Created ${results.created.length} members, ${results.errors.length} errors`);

    return c.json({
      success: true,
      data: results,
      message: `Created ${results.created.length} tenant members`
    }, 201);
  } catch (error: any) {
    console.error('[bulkCreateTenantMembers] Error:', error);
    return c.json({
      success: false,
      error: 'Failed to bulk create tenant members',
      details: error.message
    }, 500);
  }
}
