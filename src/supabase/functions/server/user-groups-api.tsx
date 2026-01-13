/**
 * User Groups API Implementation
 * Handles CRUD operations for user_groups and group_members
 * Under 500 lines
 */

import { Context } from 'npm:hono';
import * as kv from './kv_store.tsx';

// ============================================
// TYPES
// ============================================

interface UserGroup {
  _id: string;
  tenant_id: string;
  code: string;
  name: string;
  description?: string | null;
  group_type?: string | null;
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

interface GroupMember {
  _id: string;
  tenant_id: string;
  user_group_id: string;
  tenant_member_id: string;
  is_primary: boolean;
  role_in_group?: string | null;
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
// USER GROUPS CRUD
// ============================================

export async function getUserGroups(c: Context) {
  try {
    const { tenant_id } = c.req.query();
    
    if (!tenant_id) {
      return c.json({ error: 'tenant_id is required' }, 400);
    }

    const allGroups = await kv.getByPrefix('user_group:') as UserGroup[];
    const filtered = allGroups.filter(group => 
      group.tenant_id === tenant_id && !group.deleted_at
    );

    return c.json({
      success: true,
      data: filtered,
      total: filtered.length,
    });
  } catch (error: any) {
    console.error('Error getting user groups:', error);
    return c.json({ error: error.message || 'Failed to get user groups' }, 500);
  }
}

export async function getUserGroupDetails(c: Context) {
  try {
    const id = c.req.param('id');
    const group = await kv.get(`user_group:${id}`) as UserGroup;

    if (!group || group.deleted_at) {
      return c.json({ error: 'User group not found' }, 404);
    }

    return c.json({
      success: true,
      data: group,
    });
  } catch (error: any) {
    console.error('Error getting user group details:', error);
    return c.json({ error: error.message || 'Failed to get user group' }, 500);
  }
}

export async function createUserGroup(c: Context) {
  try {
    const body = await c.req.json();
    const { tenant_id, code, name, description, group_type, status, order, metadata } = body;

    if (!tenant_id || !code || !name) {
      return c.json({ error: 'tenant_id, code, and name are required' }, 400);
    }

    // Check for duplicate code within tenant
    const allGroups = await kv.getByPrefix('user_group:') as UserGroup[];
    const duplicate = allGroups.find(group => 
      group.tenant_id === tenant_id && 
      group.code === code && 
      !group.deleted_at
    );

    if (duplicate) {
      return c.json({ error: 'User group code already exists in this tenant' }, 409);
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const userGroup: UserGroup = {
      _id: id,
      tenant_id,
      code,
      name,
      description: description || null,
      group_type: group_type || null,
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

    await kv.set(`user_group:${id}`, userGroup);

    return c.json({
      success: true,
      data: userGroup,
    }, 201);
  } catch (error: any) {
    console.error('Error creating user group:', error);
    return c.json({ error: error.message || 'Failed to create user group' }, 500);
  }
}

export async function updateUserGroup(c: Context) {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await kv.get(`user_group:${id}`) as UserGroup;
    if (!existing || existing.deleted_at) {
      return c.json({ error: 'User group not found' }, 404);
    }

    // Optimistic locking check
    if (body.version !== undefined && body.version !== existing.version) {
      return c.json({ 
        error: 'Version conflict. User group has been modified by another user.' 
      }, 409);
    }

    const now = new Date().toISOString();
    const updated: UserGroup = {
      ...existing,
      ...body,
      _id: existing._id,
      tenant_id: existing.tenant_id,
      created_at: existing.created_at,
      created_by: existing.created_by,
      updated_at: now,
      version: existing.version + 1,
    };

    await kv.set(`user_group:${id}`, updated);

    return c.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating user group:', error);
    return c.json({ error: error.message || 'Failed to update user group' }, 500);
  }
}

export async function deleteUserGroup(c: Context) {
  try {
    const id = c.req.param('id');
    const group = await kv.get(`user_group:${id}`) as UserGroup;

    if (!group || group.deleted_at) {
      return c.json({ error: 'User group not found' }, 404);
    }

    // Soft delete
    const now = new Date().toISOString();
    const deleted: UserGroup = {
      ...group,
      deleted_at: now,
      updated_at: now,
      version: group.version + 1,
    };

    await kv.set(`user_group:${id}`, deleted);

    return c.json({
      success: true,
      message: 'User group deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting user group:', error);
    return c.json({ error: error.message || 'Failed to delete user group' }, 500);
  }
}

// ============================================
// GROUP MEMBERS CRUD
// ============================================

export async function getGroupMembers(c: Context) {
  try {
    const { tenant_id, user_group_id, tenant_member_id } = c.req.query();

    const allMembers = await kv.getByPrefix('group_member:') as GroupMember[];
    let filtered = allMembers.filter(member => !member.deleted_at);

    if (tenant_id) {
      filtered = filtered.filter(m => m.tenant_id === tenant_id);
    }
    if (user_group_id) {
      filtered = filtered.filter(m => m.user_group_id === user_group_id);
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
    console.error('Error getting group members:', error);
    return c.json({ error: error.message || 'Failed to get group members' }, 500);
  }
}

export async function createGroupMember(c: Context) {
  try {
    const body = await c.req.json();
    const { tenant_id, user_group_id, tenant_member_id, is_primary, role_in_group, joined_at, metadata } = body;

    if (!tenant_id || !user_group_id || !tenant_member_id) {
      return c.json({ error: 'tenant_id, user_group_id, and tenant_member_id are required' }, 400);
    }

    // Check if relationship already exists
    const allMembers = await kv.getByPrefix('group_member:') as GroupMember[];
    const duplicate = allMembers.find(m => 
      m.tenant_id === tenant_id &&
      m.user_group_id === user_group_id &&
      m.tenant_member_id === tenant_member_id &&
      !m.deleted_at
    );

    if (duplicate) {
      return c.json({ error: 'Member already belongs to this user group' }, 409);
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const groupMember: GroupMember = {
      _id: id,
      tenant_id,
      user_group_id,
      tenant_member_id,
      is_primary: is_primary || false,
      role_in_group: role_in_group || null,
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

    await kv.set(`group_member:${id}`, groupMember);

    return c.json({
      success: true,
      data: groupMember,
    }, 201);
  } catch (error: any) {
    console.error('Error creating group member:', error);
    return c.json({ error: error.message || 'Failed to create group member' }, 500);
  }
}

export async function updateGroupMember(c: Context) {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await kv.get(`group_member:${id}`) as GroupMember;
    if (!existing || existing.deleted_at) {
      return c.json({ error: 'Group member not found' }, 404);
    }

    // Optimistic locking check
    if (body.version !== undefined && body.version !== existing.version) {
      return c.json({ 
        error: 'Version conflict. Record has been modified by another user.' 
      }, 409);
    }

    const now = new Date().toISOString();
    const updated: GroupMember = {
      ...existing,
      ...body,
      _id: existing._id,
      tenant_id: existing.tenant_id,
      user_group_id: existing.user_group_id,
      tenant_member_id: existing.tenant_member_id,
      created_at: existing.created_at,
      created_by: existing.created_by,
      updated_at: now,
      version: existing.version + 1,
    };

    await kv.set(`group_member:${id}`, updated);

    return c.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating group member:', error);
    return c.json({ error: error.message || 'Failed to update group member' }, 500);
  }
}

export async function deleteGroupMember(c: Context) {
  try {
    const id = c.req.param('id');
    const member = await kv.get(`group_member:${id}`) as GroupMember;

    if (!member || member.deleted_at) {
      return c.json({ error: 'Group member not found' }, 404);
    }

    // Soft delete
    const now = new Date().toISOString();
    const deleted: GroupMember = {
      ...member,
      deleted_at: now,
      updated_at: now,
      version: member.version + 1,
    };

    await kv.set(`group_member:${id}`, deleted);

    return c.json({
      success: true,
      message: 'Group member deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting group member:', error);
    return c.json({ error: error.message || 'Failed to delete group member' }, 500);
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export async function getMemberUserGroups(c: Context) {
  try {
    const tenantMemberId = c.req.param('tenantMemberId');
    
    const allMembers = await kv.getByPrefix('group_member:') as GroupMember[];
    const memberGroups = allMembers.filter(m => 
      m.tenant_member_id === tenantMemberId && !m.deleted_at
    );

    // Get user group details
    const userGroups = [];
    for (const member of memberGroups) {
      const group = await kv.get(`user_group:${member.user_group_id}`) as UserGroup;
      if (group && !group.deleted_at) {
        userGroups.push({
          ...group,
          membership: {
            is_primary: member.is_primary,
            role_in_group: member.role_in_group,
            joined_at: member.joined_at,
          }
        });
      }
    }

    return c.json({
      success: true,
      data: userGroups,
      total: userGroups.length,
    });
  } catch (error: any) {
    console.error('Error getting member user groups:', error);
    return c.json({ error: error.message || 'Failed to get member user groups' }, 500);
  }
}
