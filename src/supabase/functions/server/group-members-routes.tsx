/**
 * Group Members Routes
 * Defines Hono routes for group member management
 * 
 * ✅ CREATED 2026-01-15
 * Base path: /group-members
 */

import { Hono } from 'npm:hono';
import {
  getGroupMembers,
  getGroupMemberById,
  createGroupMember,
  updateGroupMember,
  deleteGroupMember,
  getGroupMembersForGroup,
  getMemberGroups,
  assignMemberToGroup,
  removeMemberFromGroup,
  setPrimaryGroup,
  getGroupMemberStats,
} from './group-members-api.tsx';

const app = new Hono();

// ==================== CRUD ROUTES ====================

// GET /group-members - List all group memberships
app.get('/group-members', getGroupMembers);

// GET /group-members/:id - Get single membership
app.get('/group-members/:id', getGroupMemberById);

// POST /group-members - Create new membership
app.post('/group-members', createGroupMember);

// PUT /group-members/:id - Update membership
app.put('/group-members/:id', updateGroupMember);

// DELETE /group-members/:id - Soft delete membership
app.delete('/group-members/:id', deleteGroupMember);

// ==================== HELPER ROUTES ====================

// GET /user-groups/:groupId/members - Get group's members
app.get('/user-groups/:groupId/members', getGroupMembersForGroup);

// GET /tenant-members/:tenantMemberId/groups - Get member's groups
app.get('/tenant-members/:tenantMemberId/groups', getMemberGroups);

// POST /group-members/assign - Assign member to group
app.post('/group-members/assign', assignMemberToGroup);

// POST /group-members/remove - Remove member from group
app.post('/group-members/remove', removeMemberFromGroup);

// POST /group-members/set-primary - Set primary group
app.post('/group-members/set-primary', setPrimaryGroup);

// GET /group-members/stats - Get statistics
app.get('/group-members/stats', getGroupMemberStats);

export default app;
