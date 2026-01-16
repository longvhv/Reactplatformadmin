/**
 * Group Members API - Supabase Edge Functions
 * Backend API for managing group memberships
 * 
 * ✅ CREATED 2026-01-15
 * Implements full CRUD operations for group_members table
 * Uses KV store for data persistence
 * 
 * Endpoints:
 * - GET /group-members - List all group memberships
 * - GET /group-members/:id - Get single membership
 * - POST /group-members - Create new membership
 * - PUT /group-members/:id - Update membership
 * - DELETE /group-members/:id - Soft delete membership
 * - GET /user-groups/:id/members - Get group's members
 * - GET /tenant-members/:id/groups - Get member's groups
 */

import { Context } from 'npm:hono';
import * as kv from './kv_store.tsx';

// ==================== TYPES ====================

export interface GroupMember {
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

export interface UserGroup {
  _id: string;
  tenant_id: string;
  code: string;
  name: string;
  description?: string;
  group_type?: string;
  status: string;
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

// ==================== CRUD OPERATIONS ====================

/**
 * GET /group-members
 * List all group memberships with optional filters
 */
export async function getGroupMembers(c: Context) {
  try {
    const { 
      tenant_id, 
      user_group_id, 
      tenant_member_id,
      is_primary,
      active_only,
      include_deleted,
    } = c.req.query();

    const allMembers = await kv.getByPrefix('group_member:') as GroupMember[];
    let filtered = allMembers;

    // Filter by deleted_at
    if (include_deleted !== 'true') {
      filtered = filtered.filter(member => !member.deleted_at);
    }

    // Filter by tenant
    if (tenant_id) {
      filtered = filtered.filter(m => m.tenant_id === tenant_id);
    }

    // Filter by group
    if (user_group_id) {
      filtered = filtered.filter(m => m.user_group_id === user_group_id);
    }

    // Filter by member
    if (tenant_member_id) {
      filtered = filtered.filter(m => m.tenant_member_id === tenant_member_id);
    }

    // Filter by primary status
    if (is_primary === 'true') {
      filtered = filtered.filter(m => m.is_primary === true);
    } else if (is_primary === 'false') {
      filtered = filtered.filter(m => m.is_primary === false);
    }

    // Filter active only (not left)
    if (active_only === 'true') {
      filtered = filtered.filter(m => !m.left_at);
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

/**
 * GET /group-members/:id
 * Get a single group membership by ID
 */
export async function getGroupMemberById(c: Context) {
  try {
    const id = c.req.param('id');
    const member = await kv.get(`group_member:${id}`) as GroupMember;

    if (!member || member.deleted_at) {
      return c.json({ error: 'Group member not found' }, 404);
    }

    return c.json({
      success: true,
      data: member,
    });
  } catch (error: any) {
    console.error('Error getting group member:', error);
    return c.json({ error: error.message || 'Failed to get group member' }, 500);
  }
}

/**
 * POST /group-members
 * Create a new group membership
 * Validates unique constraint: (user_group_id, tenant_member_id)
 */
export async function createGroupMember(c: Context) {
  try {
    const body = await c.req.json();
    const { 
      tenant_id, 
      user_group_id, 
      tenant_member_id, 
      is_primary, 
      role_in_group, 
      joined_at, 
      metadata,
      created_by,
    } = body;

    // Validate required fields
    if (!tenant_id || !user_group_id || !tenant_member_id) {
      return c.json({ 
        error: 'tenant_id, user_group_id, and tenant_member_id are required' 
      }, 400);
    }

    // Check unique constraint: (user_group_id, tenant_member_id)
    const allMembers = await kv.getByPrefix('group_member:') as GroupMember[];
    const duplicate = allMembers.find(m => 
      m.user_group_id === user_group_id &&
      m.tenant_member_id === tenant_member_id &&
      !m.deleted_at
    );

    if (duplicate) {
      return c.json({ 
        error: 'Member is already assigned to this group' 
      }, 409);
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
      joined_at: joined_at || now,
      left_at: null,
      metadata: metadata || {},
      created_at: now,
      updated_at: now,
      created_by: created_by || null,
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

/**
 * PUT /group-members/:id
 * Update a group membership
 * Increments version for optimistic locking
 */
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
      // Preserve immutable fields
      _id: existing._id,
      tenant_id: existing.tenant_id,
      user_group_id: existing.user_group_id,
      tenant_member_id: existing.tenant_member_id,
      created_at: existing.created_at,
      created_by: existing.created_by,
      // Update audit fields
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

/**
 * DELETE /group-members/:id
 * Soft delete a group membership
 * Sets deleted_at timestamp
 */
export async function deleteGroupMember(c: Context) {
  try {
    const id = c.req.param('id');
    const { deleted_by } = c.req.query();

    const member = await kv.get(`group_member:${id}`) as GroupMember;

    if (!member || member.deleted_at) {
      return c.json({ error: 'Group member not found' }, 404);
    }

    // Soft delete
    const now = new Date().toISOString();
    const deleted: GroupMember = {
      ...member,
      deleted_at: now,
      deleted_by: deleted_by || null,
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

// ==================== HELPER FUNCTIONS ====================

/**
 * GET /user-groups/:id/members
 * Get all members of a specific group
 */
export async function getGroupMembersForGroup(c: Context) {
  try {
    const groupId = c.req.param('groupId');
    const { active_only } = c.req.query();
    
    const allMembers = await kv.getByPrefix('group_member:') as GroupMember[];
    let groupMembers = allMembers.filter(m => 
      m.user_group_id === groupId && !m.deleted_at
    );

    // Filter active only (not left)
    if (active_only === 'true') {
      groupMembers = groupMembers.filter(m => !m.left_at);
    }

    return c.json({
      success: true,
      data: groupMembers,
      total: groupMembers.length,
    });
  } catch (error: any) {
    console.error('Error getting group members for group:', error);
    return c.json({ error: error.message || 'Failed to get group members' }, 500);
  }
}

/**
 * GET /tenant-members/:id/groups
 * Get all groups that a member belongs to
 */
export async function getMemberGroups(c: Context) {
  try {
    const tenantMemberId = c.req.param('tenantMemberId');
    const { include_left } = c.req.query();
    
    const allMembers = await kv.getByPrefix('group_member:') as GroupMember[];
    let memberGroups = allMembers.filter(m => 
      m.tenant_member_id === tenantMemberId && !m.deleted_at
    );

    // Filter out left groups unless requested
    if (include_left !== 'true') {
      memberGroups = memberGroups.filter(m => !m.left_at);
    }

    // Get group details
    const groups = [];
    for (const membership of memberGroups) {
      const group = await kv.get(`user_group:${membership.user_group_id}`) as UserGroup;
      if (group && !group.deleted_at) {
        groups.push({
          ...group,
          membership: {
            _id: membership._id,
            is_primary: membership.is_primary,
            role_in_group: membership.role_in_group,
            joined_at: membership.joined_at,
            left_at: membership.left_at,
          },
        });
      }
    }

    return c.json({
      success: true,
      data: groups,
      total: groups.length,
    });
  } catch (error: any) {
    console.error('Error getting member groups:', error);
    return c.json({ error: error.message || 'Failed to get member groups' }, 500);
  }
}

/**
 * POST /group-members/assign
 * Convenience endpoint to assign a member to a group
 */
export async function assignMemberToGroup(c: Context) {
  try {
    const body = await c.req.json();
    const { 
      tenant_id,
      user_group_id, 
      tenant_member_id, 
      is_primary,
      role_in_group,
      created_by,
    } = body;

    // Validate required fields
    if (!tenant_id || !user_group_id || !tenant_member_id) {
      return c.json({ 
        error: 'tenant_id, user_group_id, and tenant_member_id are required' 
      }, 400);
    }

    // Check unique constraint
    const allMembers = await kv.getByPrefix('group_member:') as GroupMember[];
    const duplicate = allMembers.find(m => 
      m.user_group_id === user_group_id &&
      m.tenant_member_id === tenant_member_id &&
      !m.deleted_at
    );

    if (duplicate) {
      return c.json({ 
        error: 'Member is already assigned to this group' 
      }, 409);
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
      joined_at: now,
      left_at: null,
      metadata: {},
      created_at: now,
      updated_at: now,
      created_by: created_by || null,
      updated_by: null,
      deleted_at: null,
      deleted_by: null,
      version: 1,
    };

    await kv.set(`group_member:${id}`, groupMember);

    return c.json({
      success: true,
      data: groupMember,
      message: 'Member assigned to group successfully',
    }, 201);
  } catch (error: any) {
    console.error('Error assigning member to group:', error);
    return c.json({ error: error.message || 'Failed to assign member to group' }, 500);
  }
}

/**
 * POST /group-members/remove
 * Convenience endpoint to remove a member from a group
 * Sets left_at timestamp (not soft delete!)
 */
export async function removeMemberFromGroup(c: Context) {
  try {
    const body = await c.req.json();
    const { user_group_id, tenant_member_id, updated_by } = body;

    if (!user_group_id || !tenant_member_id) {
      return c.json({ 
        error: 'user_group_id and tenant_member_id are required' 
      }, 400);
    }

    // Find the membership
    const allMembers = await kv.getByPrefix('group_member:') as GroupMember[];
    const membership = allMembers.find(m => 
      m.user_group_id === user_group_id &&
      m.tenant_member_id === tenant_member_id &&
      !m.deleted_at &&
      !m.left_at
    );

    if (!membership) {
      return c.json({ 
        error: 'Active membership not found' 
      }, 404);
    }

    // Check if can remove (prevent removing primary group if it's the only one)
    if (membership.is_primary) {
      const memberGroups = allMembers.filter(m => 
        m.tenant_member_id === tenant_member_id &&
        !m.deleted_at &&
        !m.left_at
      );

      if (memberGroups.length === 1) {
        return c.json({ 
          error: 'Cannot remove primary group when it\'s the only group' 
        }, 400);
      }
    }

    // Set left_at
    const now = new Date().toISOString();
    const updated: GroupMember = {
      ...membership,
      left_at: now,
      updated_at: now,
      updated_by: updated_by || null,
      version: membership.version + 1,
    };

    await kv.set(`group_member:${membership._id}`, updated);

    return c.json({
      success: true,
      data: updated,
      message: 'Member removed from group successfully',
    });
  } catch (error: any) {
    console.error('Error removing member from group:', error);
    return c.json({ error: error.message || 'Failed to remove member from group' }, 500);
  }
}

/**
 * POST /group-members/set-primary
 * Set a group as the primary group for a member
 * Automatically unsets all other primary flags
 */
export async function setPrimaryGroup(c: Context) {
  try {
    const body = await c.req.json();
    const { tenant_member_id, user_group_id, updated_by } = body;

    if (!tenant_member_id || !user_group_id) {
      return c.json({ 
        error: 'tenant_member_id and user_group_id are required' 
      }, 400);
    }

    // Get all memberships for this member
    const allMembers = await kv.getByPrefix('group_member:') as GroupMember[];
    const memberGroups = allMembers.filter(m => 
      m.tenant_member_id === tenant_member_id &&
      !m.deleted_at &&
      !m.left_at
    );

    if (memberGroups.length === 0) {
      return c.json({ 
        error: 'Member is not assigned to any groups' 
      }, 404);
    }

    // Find target membership
    const targetMembership = memberGroups.find(m => m.user_group_id === user_group_id);
    if (!targetMembership) {
      return c.json({ 
        error: 'Member is not assigned to this group' 
      }, 404);
    }

    const now = new Date().toISOString();

    // Unset all primary flags
    for (const membership of memberGroups) {
      if (membership.is_primary) {
        const updated: GroupMember = {
          ...membership,
          is_primary: false,
          updated_at: now,
          updated_by: updated_by || null,
          version: membership.version + 1,
        };
        await kv.set(`group_member:${membership._id}`, updated);
      }
    }

    // Set new primary
    const newPrimary: GroupMember = {
      ...targetMembership,
      is_primary: true,
      updated_at: now,
      updated_by: updated_by || null,
      version: targetMembership.version + 1,
    };
    await kv.set(`group_member:${targetMembership._id}`, newPrimary);

    return c.json({
      success: true,
      data: newPrimary,
      message: 'Primary group updated successfully',
    });
  } catch (error: any) {
    console.error('Error setting primary group:', error);
    return c.json({ error: error.message || 'Failed to set primary group' }, 500);
  }
}

/**
 * GET /group-members/stats
 * Get statistics for group memberships
 */
export async function getGroupMemberStats(c: Context) {
  try {
    const { tenant_id, user_group_id } = c.req.query();

    const allMembers = await kv.getByPrefix('group_member:') as GroupMember[];
    let filtered = allMembers.filter(m => !m.deleted_at);

    if (tenant_id) {
      filtered = filtered.filter(m => m.tenant_id === tenant_id);
    }

    if (user_group_id) {
      filtered = filtered.filter(m => m.user_group_id === user_group_id);
    }

    const total = filtered.length;
    const active = filtered.filter(m => !m.left_at).length;
    const left = filtered.filter(m => m.left_at).length;
    const primary = filtered.filter(m => m.is_primary).length;

    // Count by role
    const byRole: Record<string, number> = {};
    filtered.forEach(m => {
      const role = m.role_in_group || 'NO_ROLE';
      byRole[role] = (byRole[role] || 0) + 1;
    });

    // Calculate averages
    const uniqueGroups = new Set(filtered.map(m => m.user_group_id)).size;
    const uniqueMembers = new Set(filtered.map(m => m.tenant_member_id)).size;

    return c.json({
      success: true,
      data: {
        total,
        active,
        left,
        primary,
        by_role: byRole,
        avg_member_per_group: uniqueGroups > 0 ? total / uniqueGroups : 0,
        avg_group_per_member: uniqueMembers > 0 ? total / uniqueMembers : 0,
      },
    });
  } catch (error: any) {
    console.error('Error getting group member stats:', error);
    return c.json({ error: error.message || 'Failed to get stats' }, 500);
  }
}
