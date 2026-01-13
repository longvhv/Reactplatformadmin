/**
 * User Groups Routes
 * Defines API routes for user_groups and group_members
 */

import { Hono } from 'npm:hono';
import * as userGroupsApi from './user-groups-api.tsx';

const userGroupsRoutes = new Hono();

// User Groups Routes
userGroupsRoutes.get('/user-groups', userGroupsApi.getUserGroups);
userGroupsRoutes.get('/user-groups/:id', userGroupsApi.getUserGroupDetails);
userGroupsRoutes.post('/user-groups', userGroupsApi.createUserGroup);
userGroupsRoutes.put('/user-groups/:id', userGroupsApi.updateUserGroup);
userGroupsRoutes.delete('/user-groups/:id', userGroupsApi.deleteUserGroup);

// Group Members Routes
userGroupsRoutes.get('/group-members', userGroupsApi.getGroupMembers);
userGroupsRoutes.post('/group-members', userGroupsApi.createGroupMember);
userGroupsRoutes.put('/group-members/:id', userGroupsApi.updateGroupMember);
userGroupsRoutes.delete('/group-members/:id', userGroupsApi.deleteGroupMember);

// Helper Routes
userGroupsRoutes.get('/tenant-members/:tenantMemberId/user-groups', userGroupsApi.getMemberUserGroups);

export { userGroupsRoutes };
export default userGroupsRoutes;