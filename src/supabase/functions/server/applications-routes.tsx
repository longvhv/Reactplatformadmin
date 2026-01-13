/**
 * Applications Routes
 * Định nghĩa routes cho Applications API
 */

import { Hono } from 'npm:hono';
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  toggleApplicationActive,
} from './applications-api.tsx';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const app = new Hono();

/**
 * DEBUG /applications/debug
 * Kiểm tra xem table applications có tồn tại không
 */
app.get('/applications/debug', async (c) => {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Try to count records
    const { data, error, count } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: false })
      .limit(5);
    
    if (error) {
      return c.json({
        status: 'error',
        message: 'Table query failed',
        error: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details
      }, 500);
    }
    
    return c.json({
      status: 'ok',
      message: 'Table exists and is accessible',
      count: count,
      sampleData: data
    });
  } catch (error) {
    return c.json({
      status: 'error',
      message: 'Unexpected error',
      error: String(error)
    }, 500);
  }
});

/**
 * GET /applications
 * Lấy danh sách applications với pagination và filters
 * Query params:
 *   - is_active: true/false (optional)
 *   - search: tìm kiếm theo code hoặc name (optional)
 *   - limit: số lượng records (default: 100)
 *   - offset: vị trí bắt đầu (default: 0)
 */
app.get('/applications', async (c) => {
  const response = await getApplications(c.req.raw);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

/**
 * GET /applications/:id
 * Lấy chi tiết một application
 */
app.get('/applications/:id', async (c) => {
  const id = c.req.param('id');
  const response = await getApplicationById(id);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

/**
 * POST /applications
 * Tạo mới application
 * Body: { code, name, description?, is_active?, created_by? }
 */
app.post('/applications', async (c) => {
  const response = await createApplication(c.req.raw);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

/**
 * PUT /applications/:id
 * Cập nhật application (với optimistic locking)
 * Body: { code?, name?, description?, is_active?, updated_by?, version? }
 */
app.put('/applications/:id', async (c) => {
  const id = c.req.param('id');
  const response = await updateApplication(id, c.req.raw);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

/**
 * DELETE /applications/:id
 * Xóa mềm application
 * Body (optional): { deleted_by? }
 */
app.delete('/applications/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const deletedBy = body.deleted_by;
  
  const response = await deleteApplication(id, deletedBy);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

/**
 * PATCH /applications/:id/toggle-active
 * Toggle trạng thái is_active
 * Body (optional): { user_id? }
 */
app.patch('/applications/:id/toggle-active', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const userId = body.user_id;
  
  const response = await toggleApplicationActive(id, userId);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

export default app;