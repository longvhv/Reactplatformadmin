/**
 * Tenant Members API Routes
 * Defines HTTP routes for tenant member operations
 */

import { Hono } from 'npm:hono@4';
import * as api from './tenant-members-api.tsx';

const app = new Hono();

// ============================================
// TENANT MEMBERS ROUTES
// ============================================

// GET /tenant-members - List all tenant members (with filters)
app.get('/tenant-members', api.getTenantMembers);

// GET /tenant-members/:id - Get single tenant member
app.get('/tenant-members/:id', api.getTenantMemberDetails);

// POST /tenant-members - Create new tenant member
app.post('/tenant-members', api.createTenantMember);

// PUT /tenant-members/:id - Update tenant member
app.put('/tenant-members/:id', api.updateTenantMember);

// DELETE /tenant-members/:id - Delete tenant member (soft delete)
app.delete('/tenant-members/:id', api.deleteTenantMember);

// GET /tenant-members/:id/subordinates - Get direct reports
app.get('/tenant-members/:id/subordinates', api.getSubordinates);

// POST /tenant-members/bulk - Bulk create members
app.post('/tenant-members/bulk', api.bulkCreateTenantMembers);

export default app;
