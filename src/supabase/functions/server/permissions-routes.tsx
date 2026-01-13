/**
 * Permissions Routes
 * Định nghĩa routes cho Permissions API
 */

import { Hono } from 'npm:hono';
import {
  getPermissions,
  getPermissionsTree,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
} from './permissions-api.tsx';

const app = new Hono();

/**
 * GET /permissions
 * Lấy danh sách permissions với filter
 */
app.get('/permissions', async (c) => {
  const response = await getPermissions(c.req.raw);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

/**
 * GET /permissions/tree/:app_code
 * Lấy cấu trúc cây permissions theo app_code
 */
app.get('/permissions/tree/:app_code', async (c) => {
  const appCode = c.req.param('app_code');
  const response = await getPermissionsTree(appCode);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

/**
 * GET /permissions/:id
 * Lấy chi tiết permission
 */
app.get('/permissions/:id', async (c) => {
  const id = c.req.param('id');
  const response = await getPermissionById(id);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

/**
 * POST /permissions
 * Tạo mới permission
 */
app.post('/permissions', async (c) => {
  const response = await createPermission(c.req.raw);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

/**
 * PUT /permissions/:id
 * Cập nhật permission
 */
app.put('/permissions/:id', async (c) => {
  const id = c.req.param('id');
  const response = await updatePermission(id, c.req.raw);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

/**
 * DELETE /permissions/:id
 * Xóa mềm permission
 */
app.delete('/permissions/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const deletedBy = body.deleted_by;
  
  const response = await deletePermission(id, deletedBy);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

export default app;
