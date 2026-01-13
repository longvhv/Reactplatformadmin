/**
 * Departments API Implementation
 * Handles CRUD operations for departments and department_members
 * Under 500 lines
 */

import { Context } from 'npm:hono';
import * as kv from './kv_store.tsx';

// ============================================
// TYPES
// ============================================

interface Department {
  _id: string;
  tenant_id: string;
  code: string;
  name: string;
  parent_department_id?: string | null;
  manager_id?: string | null;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  order?: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
  version: number;
}

interface DepartmentMember {
  _id: string;
  tenant_id: string;
  department_id: string;
  tenant_member_id: string;
  is_primary: boolean;
  role_in_department?: string | null;
  joined_at?: string | null;
  left_at?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
  version: number;
}

// ============================================
// DEPARTMENTS CRUD
// ============================================

export async function getDepartments(c: Context) {
  try {
    const { tenant_id } = c.req.query();
    
    if (!tenant_id) {
      return c.json({ error: 'tenant_id is required' }, 400);
    }

    const allDepartments = await kv.getByPrefix('department:') as Department[];
    const filtered = allDepartments.filter(dept => 
      dept.tenant_id === tenant_id && !dept.deleted_at
    );

    return c.json({
      success: true,
      data: filtered,
      total: filtered.length,
    });
  } catch (error: any) {
    console.error('Error getting departments:', error);
    return c.json({ error: error.message || 'Failed to get departments' }, 500);
  }
}

export async function getDepartmentDetails(c: Context) {
  try {
    const id = c.req.param('id');
    const department = await kv.get(`department:${id}`) as Department;

    if (!department || department.deleted_at) {
      return c.json({ error: 'Department not found' }, 404);
    }

    return c.json({
      success: true,
      data: department,
    });
  } catch (error: any) {
    console.error('Error getting department details:', error);
    return c.json({ error: error.message || 'Failed to get department' }, 500);
  }
}

export async function createDepartment(c: Context) {
  try {
    const body = await c.req.json();
    const { tenant_id, code, name, parent_department_id, manager_id, description, status, order, metadata } = body;

    if (!tenant_id || !code || !name) {
      return c.json({ error: 'tenant_id, code, and name are required' }, 400);
    }

    // Check for duplicate code within tenant
    const allDepartments = await kv.getByPrefix('department:') as Department[];
    const duplicate = allDepartments.find(dept => 
      dept.tenant_id === tenant_id && 
      dept.code === code && 
      !dept.deleted_at
    );

    if (duplicate) {
      return c.json({ error: 'Department code already exists in this tenant' }, 409);
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const department: Department = {
      _id: id,
      tenant_id,
      code,
      name,
      parent_department_id: parent_department_id || null,
      manager_id: manager_id || null,
      description: description || null,
      status: status || 'ACTIVE',
      order: order || 0,
      metadata: metadata || {},
      created_at: now,
      updated_at: now,
      created_by: null,
      updated_by: null,
      deleted_at: null,
      deleted_by: null,
      version: 1,
    };

    await kv.set(`department:${id}`, department);

    return c.json({
      success: true,
      data: department,
    }, 201);
  } catch (error: any) {
    console.error('Error creating department:', error);
    return c.json({ error: error.message || 'Failed to create department' }, 500);
  }
}

export async function updateDepartment(c: Context) {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await kv.get(`department:${id}`) as Department;
    if (!existing || existing.deleted_at) {
      return c.json({ error: 'Department not found' }, 404);
    }

    // Optimistic locking check
    if (body.version !== undefined && body.version !== existing.version) {
      return c.json({ 
        error: 'Version conflict. Department has been modified by another user.' 
      }, 409);
    }

    const now = new Date().toISOString();
    const updated: Department = {
      ...existing,
      ...body,
      _id: existing._id,
      tenant_id: existing.tenant_id,
      created_at: existing.created_at,
      created_by: existing.created_by,
      updated_at: now,
      version: existing.version + 1,
    };

    await kv.set(`department:${id}`, updated);

    return c.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating department:', error);
    return c.json({ error: error.message || 'Failed to update department' }, 500);
  }
}

export async function deleteDepartment(c: Context) {
  try {
    const id = c.req.param('id');
    const department = await kv.get(`department:${id}`) as Department;

    if (!department || department.deleted_at) {
      return c.json({ error: 'Department not found' }, 404);
    }

    // Soft delete
    const now = new Date().toISOString();
    const deleted: Department = {
      ...department,
      deleted_at: now,
      updated_at: now,
      version: department.version + 1,
    };

    await kv.set(`department:${id}`, deleted);

    return c.json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting department:', error);
    return c.json({ error: error.message || 'Failed to delete department' }, 500);
  }
}

// ============================================
// DEPARTMENT MEMBERS CRUD
// ============================================

export async function getDepartmentMembers(c: Context) {
  try {
    const { tenant_id, department_id, tenant_member_id } = c.req.query();

    const allMembers = await kv.getByPrefix('department_member:') as DepartmentMember[];
    let filtered = allMembers.filter(member => !member.deleted_at);

    if (tenant_id) {
      filtered = filtered.filter(m => m.tenant_id === tenant_id);
    }
    if (department_id) {
      filtered = filtered.filter(m => m.department_id === department_id);
    }
    if (tenant_member_id) {
      filtered = filtered.filter(m => m.tenant_member_id === tenant_member_id);
    }

    return c.json({
      success: true,
      data: filtered,
      total: filtered.length,
    });
  } catch (error: any) {
    console.error('Error getting department members:', error);
    return c.json({ error: error.message || 'Failed to get department members' }, 500);
  }
}

export async function createDepartmentMember(c: Context) {
  try {
    const body = await c.req.json();
    const { tenant_id, department_id, tenant_member_id, is_primary, role_in_department, joined_at, metadata } = body;

    if (!tenant_id || !department_id || !tenant_member_id) {
      return c.json({ error: 'tenant_id, department_id, and tenant_member_id are required' }, 400);
    }

    // Check if relationship already exists
    const allMembers = await kv.getByPrefix('department_member:') as DepartmentMember[];
    const duplicate = allMembers.find(m => 
      m.tenant_id === tenant_id &&
      m.department_id === department_id &&
      m.tenant_member_id === tenant_member_id &&
      !m.deleted_at
    );

    if (duplicate) {
      return c.json({ error: 'Member already belongs to this department' }, 409);
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const departmentMember: DepartmentMember = {
      _id: id,
      tenant_id,
      department_id,
      tenant_member_id,
      is_primary: is_primary || false,
      role_in_department: role_in_department || null,
      joined_at: joined_at || null,
      left_at: null,
      metadata: metadata || {},
      created_at: now,
      updated_at: now,
      created_by: null,
      updated_by: null,
      deleted_at: null,
      deleted_by: null,
      version: 1,
    };

    await kv.set(`department_member:${id}`, departmentMember);

    return c.json({
      success: true,
      data: departmentMember,
    }, 201);
  } catch (error: any) {
    console.error('Error creating department member:', error);
    return c.json({ error: error.message || 'Failed to create department member' }, 500);
  }
}

export async function updateDepartmentMember(c: Context) {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await kv.get(`department_member:${id}`) as DepartmentMember;
    if (!existing || existing.deleted_at) {
      return c.json({ error: 'Department member not found' }, 404);
    }

    // Optimistic locking check
    if (body.version !== undefined && body.version !== existing.version) {
      return c.json({ 
        error: 'Version conflict. Record has been modified by another user.' 
      }, 409);
    }

    const now = new Date().toISOString();
    const updated: DepartmentMember = {
      ...existing,
      ...body,
      _id: existing._id,
      tenant_id: existing.tenant_id,
      department_id: existing.department_id,
      tenant_member_id: existing.tenant_member_id,
      created_at: existing.created_at,
      created_by: existing.created_by,
      updated_at: now,
      version: existing.version + 1,
    };

    await kv.set(`department_member:${id}`, updated);

    return c.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating department member:', error);
    return c.json({ error: error.message || 'Failed to update department member' }, 500);
  }
}

export async function deleteDepartmentMember(c: Context) {
  try {
    const id = c.req.param('id');
    const member = await kv.get(`department_member:${id}`) as DepartmentMember;

    if (!member || member.deleted_at) {
      return c.json({ error: 'Department member not found' }, 404);
    }

    // Soft delete
    const now = new Date().toISOString();
    const deleted: DepartmentMember = {
      ...member,
      deleted_at: now,
      updated_at: now,
      version: member.version + 1,
    };

    await kv.set(`department_member:${id}`, deleted);

    return c.json({
      success: true,
      message: 'Department member deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting department member:', error);
    return c.json({ error: error.message || 'Failed to delete department member' }, 500);
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export async function getMemberDepartments(c: Context) {
  try {
    const tenantMemberId = c.req.param('tenantMemberId');
    
    const allMembers = await kv.getByPrefix('department_member:') as DepartmentMember[];
    const memberDepartments = allMembers.filter(m => 
      m.tenant_member_id === tenantMemberId && !m.deleted_at
    );

    // Get department details
    const departments = [];
    for (const member of memberDepartments) {
      const dept = await kv.get(`department:${member.department_id}`) as Department;
      if (dept && !dept.deleted_at) {
        departments.push({
          ...dept,
          membership: {
            is_primary: member.is_primary,
            role_in_department: member.role_in_department,
            joined_at: member.joined_at,
          }
        });
      }
    }

    return c.json({
      success: true,
      data: departments,
      total: departments.length,
    });
  } catch (error: any) {
    console.error('Error getting member departments:', error);
    return c.json({ error: error.message || 'Failed to get member departments' }, 500);
  }
}
