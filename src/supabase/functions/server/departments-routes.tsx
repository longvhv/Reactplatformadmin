/**
 * Departments API Routes
 * Defines HTTP routes for department and department member operations
 */

import { Hono } from 'npm:hono@4';
import * as api from './departments-api.tsx';

const app = new Hono();

// ============================================
// DEPARTMENTS ROUTES
// ============================================

// GET /departments - List all departments (with filters)
app.get('/departments', api.getDepartments);

// GET /departments/:id - Get single department
app.get('/departments/:id', api.getDepartmentDetails);

// POST /departments - Create new department
app.post('/departments', api.createDepartment);

// PUT /departments/:id - Update department
app.put('/departments/:id', api.updateDepartment);

// DELETE /departments/:id - Delete department (soft delete)
app.delete('/departments/:id', api.deleteDepartment);

// ============================================
// DEPARTMENT MEMBERS ROUTES
// ============================================

// GET /department-members - List all department members (with filters)
app.get('/department-members', api.getDepartmentMembers);

// POST /department-members - Create new department member
app.post('/department-members', api.createDepartmentMember);

// PUT /department-members/:id - Update department member
app.put('/department-members/:id', api.updateDepartmentMember);

// DELETE /department-members/:id - Delete department member (soft delete)
app.delete('/department-members/:id', api.deleteDepartmentMember);

// GET /tenant-members/:tenantMemberId/departments - Get departments for a tenant member
app.get('/tenant-members/:tenantMemberId/departments', api.getMemberDepartments);

export default app;
