/**
 * SaaS Product Types Routes
 * Định nghĩa routes cho SaaS Product Types API
 */

import { Hono } from 'npm:hono';
import {
  listProductTypes,
  getProductType,
  getProductTypeByCode,
  createProductType,
  updateProductType,
  deleteProductType,
  activateProductType,
} from './saas-product-types-api.tsx';

const app = new Hono();

/**
 * GET /saas-product-types
 * Lấy danh sách tất cả product types
 */
app.get('/saas-product-types', async (c) => {
  const response = await listProductTypes(c.req.raw);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

/**
 * GET /saas-product-types/:id
 * Lấy chi tiết một product type theo ID
 */
app.get('/saas-product-types/:id', async (c) => {
  const id = c.req.param('id');
  const response = await getProductType(id);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

/**
 * GET /saas-product-types/by-code/:code
 * Lấy product type theo code
 */
app.get('/saas-product-types/by-code/:code', async (c) => {
  const code = c.req.param('code');
  const response = await getProductTypeByCode(code);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

/**
 * POST /saas-product-types
 * Tạo product type mới
 */
app.post('/saas-product-types', async (c) => {
  const response = await createProductType(c.req.raw);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

/**
 * PUT /saas-product-types/:id
 * Cập nhật product type
 */
app.put('/saas-product-types/:id', async (c) => {
  const id = c.req.param('id');
  const response = await updateProductType(id, c.req.raw);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

/**
 * DELETE /saas-product-types/:id
 * Deactivate product type (soft delete)
 */
app.delete('/saas-product-types/:id', async (c) => {
  const id = c.req.param('id');
  const response = await deleteProductType(id);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

/**
 * PATCH /saas-product-types/:id/activate
 * Kích hoạt lại product type
 */
app.patch('/saas-product-types/:id/activate', async (c) => {
  const id = c.req.param('id');
  const response = await activateProductType(id);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

export default app;
