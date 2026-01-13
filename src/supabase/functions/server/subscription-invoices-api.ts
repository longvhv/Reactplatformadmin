/**
 * Subscription Invoices API
 * CRUD operations for subscription invoices
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

// GET /subscription-invoices - List all invoices with filters
app.get('/subscription-invoices', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const url = new URL(c.req.url);
    
    const tenantId = url.searchParams.get('tenant_id');
    const status = url.searchParams.get('status');
    const paymentStatus = url.searchParams.get('payment_status');
    const search = url.searchParams.get('search');
    
    let query = supabase
      .from('subscription_invoices')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('invoice_date', { ascending: false });
    
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus);
    }
    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching invoices:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data, count, success: true });
  } catch (error) {
    console.error('Invoices fetch error:', error);
    return c.json({ error: 'Failed to fetch invoices' }, 500);
  }
});

// GET /subscription-invoices/:id - Get single invoice
app.get('/subscription-invoices/:id', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    
    const { data, error } = await supabase
      .from('subscription_invoices')
      .select('*')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();
    
    if (error) {
      console.error(`Error fetching invoice ${id}:`, error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }
    
    return c.json({ data, success: true });
  } catch (error) {
    console.error('Invoice fetch error:', error);
    return c.json({ error: 'Failed to fetch invoice' }, 500);
  }
});

// POST /subscription-invoices - Create new invoice
app.post('/subscription-invoices', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const body = await c.req.json();
    
    if (!body.tenant_id || !body.order_id || !body.invoice_number) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    const invoiceData = {
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('subscription_invoices')
      .insert([invoiceData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating invoice:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data, success: true }, 201);
  } catch (error) {
    console.error('Invoice creation error:', error);
    return c.json({ error: 'Failed to create invoice' }, 500);
  }
});

// PUT /subscription-invoices/:id - Update invoice
app.put('/subscription-invoices/:id', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const updateData = {
      ...body,
      updated_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('subscription_invoices')
      .update(updateData)
      .eq('_id', id)
      .is('deleted_at', null)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating invoice ${id}:`, error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }
    
    return c.json({ data, success: true });
  } catch (error) {
    console.error('Invoice update error:', error);
    return c.json({ error: 'Failed to update invoice' }, 500);
  }
});

// DELETE /subscription-invoices/:id - Soft delete invoice
app.delete('/subscription-invoices/:id', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    
    const { error } = await supabase
      .from('subscription_invoices')
      .update({ 
        deleted_at: new Date().toISOString(),
        deleted_by: 'admin'
      })
      .eq('_id', id);
    
    if (error) {
      console.error(`Error deleting invoice ${id}:`, error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }
    
    return c.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Invoice deletion error:', error);
    return c.json({ error: 'Failed to delete invoice' }, 500);
  }
});

// GET /subscription-invoices/stats/overview - Get statistics
app.get('/subscription-invoices/stats/overview', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const url = new URL(c.req.url);
    const tenantId = url.searchParams.get('tenant_id');
    
    let query = supabase
      .from('subscription_invoices')
      .select('status, payment_status, total_amount')
      .is('deleted_at', null);
    
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    
    const { data: invoices, error } = await query;
    
    if (error) {
      console.error('Error fetching invoice stats:', error);
      return c.json({ error: error.message }, 500);
    }
    
    const stats = {
      total: invoices.length,
      draft: invoices.filter(i => i.status === 'draft').length,
      sent: invoices.filter(i => i.status === 'sent').length,
      paid: invoices.filter(i => i.status === 'paid').length,
      overdue: invoices.filter(i => i.status === 'overdue').length,
      cancelled: invoices.filter(i => i.status === 'cancelled').length,
      total_amount: invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0),
      paid_amount: invoices.filter(i => i.payment_status === 'paid').reduce((sum, i) => sum + (i.total_amount || 0), 0),
      pending_amount: invoices.filter(i => i.payment_status === 'pending').reduce((sum, i) => sum + (i.total_amount || 0), 0),
    };
    
    return c.json({ data: stats, success: true });
  } catch (error) {
    console.error('Invoice stats error:', error);
    return c.json({ error: 'Failed to fetch invoice statistics' }, 500);
  }
});

export default app;
