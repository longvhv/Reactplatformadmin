/**
 * System Announcements API
 * CRUD operations and status management
 */

import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const app = new Hono();

const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
};

// GET /system-announcements - List all announcements with filters
app.get('/system-announcements', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const url = new URL(c.req.url);
    
    const tenantId = url.searchParams.get('tenant_id');
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const priority = url.searchParams.get('priority');
    const isPublished = url.searchParams.get('is_published');
    const search = url.searchParams.get('search');
    
    let query = supabase
      .from('system_announcements')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    
    if (tenantId) query = query.eq('tenant_id', tenantId);
    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);
    if (priority) query = query.eq('priority', priority);
    if (isPublished !== null && isPublished !== undefined) {
      query = query.eq('is_published', isPublished === 'true');
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,category.ilike.%${search}%`);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching announcements:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data, count, success: true });
  } catch (error) {
    console.error('Announcements fetch error:', error);
    return c.json({ error: 'Failed to fetch announcements' }, 500);
  }
});

// GET /system-announcements/:id - Get single announcement
app.get('/system-announcements/:id', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    
    const { data, error } = await supabase
      .from('system_announcements')
      .select('*')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();
    
    if (error) {
      console.error(`Error fetching announcement ${id}:`, error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }
    
    return c.json({ data, success: true });
  } catch (error) {
    console.error('Announcement fetch error:', error);
    return c.json({ error: 'Failed to fetch announcement' }, 500);
  }
});

// POST /system-announcements - Create new announcement
app.post('/system-announcements', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const body = await c.req.json();
    
    if (!body.tenant_id || !body.title || !body.content) {
      return c.json({ error: 'Missing required fields: tenant_id, title, content' }, 400);
    }
    
    const announcementData = {
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('system_announcements')
      .insert([announcementData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating announcement:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data, success: true }, 201);
  } catch (error) {
    console.error('Announcement creation error:', error);
    return c.json({ error: 'Failed to create announcement' }, 500);
  }
});

// PUT /system-announcements/:id - Update announcement
app.put('/system-announcements/:id', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const updateData = {
      ...body,
      updated_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('system_announcements')
      .update(updateData)
      .eq('_id', id)
      .is('deleted_at', null)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating announcement ${id}:`, error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }
    
    return c.json({ data, success: true });
  } catch (error) {
    console.error('Announcement update error:', error);
    return c.json({ error: 'Failed to update announcement' }, 500);
  }
});

// DELETE /system-announcements/:id - Soft delete announcement
app.delete('/system-announcements/:id', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    
    const { error } = await supabase
      .from('system_announcements')
      .update({ 
        deleted_at: new Date().toISOString(),
        deleted_by: 'admin'
      })
      .eq('_id', id);
    
    if (error) {
      console.error(`Error deleting announcement ${id}:`, error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }
    
    return c.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Announcement deletion error:', error);
    return c.json({ error: 'Failed to delete announcement' }, 500);
  }
});

// PATCH /system-announcements/:id/status - Toggle status
app.patch('/system-announcements/:id/status', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    const { status } = await c.req.json();
    
    if (!status) {
      return c.json({ error: 'Status is required' }, 400);
    }
    
    const { data, error } = await supabase
      .from('system_announcements')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('_id', id)
      .is('deleted_at', null)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating status for announcement ${id}:`, error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }
    
    return c.json({ data, success: true });
  } catch (error) {
    console.error('Status update error:', error);
    return c.json({ error: 'Failed to update status' }, 500);
  }
});

// PATCH /system-announcements/:id/publish - Toggle publish status
app.patch('/system-announcements/:id/publish', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    const { is_published } = await c.req.json();
    
    const updateData: any = { 
      is_published,
      updated_at: new Date().toISOString()
    };
    
    if (is_published && !updateData.published_at) {
      updateData.published_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('system_announcements')
      .update(updateData)
      .eq('_id', id)
      .is('deleted_at', null)
      .select()
      .single();
    
    if (error) {
      console.error(`Error toggling publish for announcement ${id}:`, error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }
    
    return c.json({ data, success: true });
  } catch (error) {
    console.error('Publish toggle error:', error);
    return c.json({ error: 'Failed to toggle publish status' }, 500);
  }
});

// PATCH /system-announcements/:id/pin - Toggle pin status
app.patch('/system-announcements/:id/pin', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    const { is_pinned } = await c.req.json();
    
    const { data, error } = await supabase
      .from('system_announcements')
      .update({ 
        is_pinned,
        updated_at: new Date().toISOString()
      })
      .eq('_id', id)
      .is('deleted_at', null)
      .select()
      .single();
    
    if (error) {
      console.error(`Error toggling pin for announcement ${id}:`, error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }
    
    return c.json({ data, success: true });
  } catch (error) {
    console.error('Pin toggle error:', error);
    return c.json({ error: 'Failed to toggle pin status' }, 500);
  }
});

// GET /system-announcements/stats/overview - Get statistics
app.get('/system-announcements/stats/overview', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const url = new URL(c.req.url);
    const tenantId = url.searchParams.get('tenant_id');
    
    let query = supabase
      .from('system_announcements')
      .select('status, type, priority, is_published, view_count')
      .is('deleted_at', null);
    
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    
    const { data: announcements, error } = await query;
    
    if (error) {
      console.error('Error fetching announcement stats:', error);
      return c.json({ error: error.message }, 500);
    }
    
    const stats = {
      total: announcements.length,
      active: announcements.filter(a => a.status === 'active').length,
      draft: announcements.filter(a => a.status === 'draft').length,
      expired: announcements.filter(a => a.status === 'expired').length,
      archived: announcements.filter(a => a.status === 'archived').length,
      published: announcements.filter(a => a.is_published).length,
      unpublished: announcements.filter(a => !a.is_published).length,
      by_type: {
        info: announcements.filter(a => a.type === 'info').length,
        warning: announcements.filter(a => a.type === 'warning').length,
        error: announcements.filter(a => a.type === 'error').length,
        success: announcements.filter(a => a.type === 'success').length,
        maintenance: announcements.filter(a => a.type === 'maintenance').length,
      },
      by_priority: {
        low: announcements.filter(a => a.priority === 'low').length,
        normal: announcements.filter(a => a.priority === 'normal').length,
        high: announcements.filter(a => a.priority === 'high').length,
        critical: announcements.filter(a => a.priority === 'critical').length,
      },
      total_views: announcements.reduce((sum, a) => sum + (a.view_count || 0), 0),
    };
    
    return c.json({ data: stats, success: true });
  } catch (error) {
    console.error('Announcement stats error:', error);
    return c.json({ error: 'Failed to fetch announcement statistics' }, 500);
  }
});

export default app;
