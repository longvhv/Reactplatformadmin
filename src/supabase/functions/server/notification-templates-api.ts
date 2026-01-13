/**
 * Notification Templates API
 * CRUD operations for notification templates
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

// GET /notification-templates - List all templates
app.get('/notification-templates', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const url = new URL(c.req.url);
    
    const tenantId = url.searchParams.get('tenant_id');
    const status = url.searchParams.get('status');
    const notificationType = url.searchParams.get('notification_type');
    const category = url.searchParams.get('category');
    const language = url.searchParams.get('language');
    const search = url.searchParams.get('search');
    
    let query = supabase
      .from('notification_templates')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    
    if (tenantId) query = query.eq('tenant_id', tenantId);
    if (status) query = query.eq('status', status);
    if (notificationType) query = query.eq('notification_type', notificationType);
    if (category) query = query.eq('category', category);
    if (language) query = query.eq('language_code', language);
    if (search) {
      query = query.or(`template_code.ilike.%${search}%,template_name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching templates:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data, count, success: true });
  } catch (error) {
    console.error('Templates fetch error:', error);
    return c.json({ error: 'Failed to fetch templates' }, 500);
  }
});

// GET /notification-templates/:id - Get single template
app.get('/notification-templates/:id', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();
    
    if (error) {
      console.error(`Error fetching template ${id}:`, error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }
    
    return c.json({ data, success: true });
  } catch (error) {
    console.error('Template fetch error:', error);
    return c.json({ error: 'Failed to fetch template' }, 500);
  }
});

// POST /notification-templates - Create new template
app.post('/notification-templates', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const body = await c.req.json();
    
    if (!body.tenant_id || !body.template_code || !body.template_name) {
      return c.json({ error: 'Missing required fields: tenant_id, template_code, template_name' }, 400);
    }
    
    const templateData = {
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('notification_templates')
      .insert([templateData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating template:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data, success: true }, 201);
  } catch (error) {
    console.error('Template creation error:', error);
    return c.json({ error: 'Failed to create template' }, 500);
  }
});

// PUT /notification-templates/:id - Update template
app.put('/notification-templates/:id', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const updateData = {
      ...body,
      updated_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('notification_templates')
      .update(updateData)
      .eq('_id', id)
      .is('deleted_at', null)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating template ${id}:`, error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }
    
    return c.json({ data, success: true });
  } catch (error) {
    console.error('Template update error:', error);
    return c.json({ error: 'Failed to update template' }, 500);
  }
});

// DELETE /notification-templates/:id - Soft delete template
app.delete('/notification-templates/:id', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    
    const { error } = await supabase
      .from('notification_templates')
      .update({ 
        deleted_at: new Date().toISOString(),
        deleted_by: 'admin'
      })
      .eq('_id', id);
    
    if (error) {
      console.error(`Error deleting template ${id}:`, error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }
    
    return c.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Template deletion error:', error);
    return c.json({ error: 'Failed to delete template' }, 500);
  }
});

// PATCH /notification-templates/:id/status - Toggle status
app.patch('/notification-templates/:id/status', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    const { status } = await c.req.json();
    
    if (!status) {
      return c.json({ error: 'Status is required' }, 400);
    }
    
    const { data, error } = await supabase
      .from('notification_templates')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('_id', id)
      .is('deleted_at', null)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating status for template ${id}:`, error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }
    
    return c.json({ data, success: true });
  } catch (error) {
    console.error('Status update error:', error);
    return c.json({ error: 'Failed to update status' }, 500);
  }
});

// POST /notification-templates/:id/duplicate - Duplicate template
app.post('/notification-templates/:id/duplicate', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    
    // Get original template
    const { data: original, error: fetchError } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();
    
    if (fetchError || !original) {
      return c.json({ error: 'Template not found' }, 404);
    }
    
    // Create duplicate
    const duplicate = {
      ...original,
      _id: undefined,
      template_code: `${original.template_code}_COPY`,
      template_name: `${original.template_name} (Copy)`,
      status: 'draft',
      usage_count: 0,
      success_count: 0,
      failure_count: 0,
      last_used_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'admin',
      updated_by: 'admin',
    };
    
    const { data, error } = await supabase
      .from('notification_templates')
      .insert([duplicate])
      .select()
      .single();
    
    if (error) {
      console.error('Error duplicating template:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data, success: true }, 201);
  } catch (error) {
    console.error('Template duplication error:', error);
    return c.json({ error: 'Failed to duplicate template' }, 500);
  }
});

// GET /notification-templates/stats/overview - Get statistics
app.get('/notification-templates/stats/overview', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const url = new URL(c.req.url);
    const tenantId = url.searchParams.get('tenant_id');
    
    let query = supabase
      .from('notification_templates')
      .select('status, notification_type, category, usage_count, success_count, failure_count')
      .is('deleted_at', null);
    
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    
    const { data: templates, error } = await query;
    
    if (error) {
      console.error('Error fetching template stats:', error);
      return c.json({ error: error.message }, 500);
    }
    
    const stats = {
      total: templates.length,
      active: templates.filter(t => t.status === 'active').length,
      draft: templates.filter(t => t.status === 'draft').length,
      inactive: templates.filter(t => t.status === 'inactive').length,
      by_type: {
        email: templates.filter(t => t.notification_type === 'email').length,
        sms: templates.filter(t => t.notification_type === 'sms').length,
        push: templates.filter(t => t.notification_type === 'push').length,
        'in-app': templates.filter(t => t.notification_type === 'in-app').length,
        webhook: templates.filter(t => t.notification_type === 'webhook').length,
      },
      by_category: {
        system: templates.filter(t => t.category === 'system').length,
        marketing: templates.filter(t => t.category === 'marketing').length,
        transactional: templates.filter(t => t.category === 'transactional').length,
        alert: templates.filter(t => t.category === 'alert').length,
        reminder: templates.filter(t => t.category === 'reminder').length,
      },
      total_usage: templates.reduce((sum, t) => sum + (t.usage_count || 0), 0),
      total_success: templates.reduce((sum, t) => sum + (t.success_count || 0), 0),
      total_failure: templates.reduce((sum, t) => sum + (t.failure_count || 0), 0),
    };
    
    return c.json({ data: stats, success: true });
  } catch (error) {
    console.error('Template stats error:', error);
    return c.json({ error: 'Failed to fetch template statistics' }, 500);
  }
});

export default app;
