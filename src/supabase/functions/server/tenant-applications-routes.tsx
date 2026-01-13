/**
 * Tenant Applications Routes
 * Định nghĩa routes cho Tenant Applications API
 */

import { Hono } from 'npm:hono';
import {
  getTenantsByApp,
  getAppsByTenant,
  assignAppToTenant,
  updateTenantApplication,
  revokeTenantApplication,
} from './tenant-applications-api.tsx';

const app = new Hono();

/**
 * GET /tenant-applications/by-app/:app_code
 * Lấy danh sách tenants sử dụng một application
 */
app.get('/tenant-applications/by-app/:app_code', async (c) => {
  const appCode = c.req.param('app_code');
  const response = await getTenantsByApp(appCode, c.req.raw);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

/**
 * GET /tenant-applications/by-tenant/:tenant_id
 * Lấy danh sách applications của một tenant
 */
app.get('/tenant-applications/by-tenant/:tenant_id', async (c) => {
  const tenantId = c.req.param('tenant_id');
  const response = await getAppsByTenant(tenantId, c.req.raw);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

/**
 * POST /tenant-applications
 * Gán application cho tenant
 */
app.post('/tenant-applications', async (c) => {
  const response = await assignAppToTenant(c.req.raw);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

/**
 * PUT /tenant-applications/:id
 * Cập nhật tenant-application mapping
 */
app.put('/tenant-applications/:id', async (c) => {
  const id = c.req.param('id');
  const response = await updateTenantApplication(id, c.req.raw);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

/**
 * DELETE /tenant-applications/:id
 * Revoke app from tenant
 */
app.delete('/tenant-applications/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const deletedBy = body.deleted_by;
  
  const response = await revokeTenantApplication(id, deletedBy);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

export default app;
