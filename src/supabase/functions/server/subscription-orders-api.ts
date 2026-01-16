/**
 * Subscription Orders API
 * CRUD operations for subscription orders
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

// GET /subscription-orders - List all orders with filters
app.get('/subscription-orders', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const url = new URL(c.req.url);
    
    const tenantId = url.searchParams.get('tenant_id');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    
    let query = supabase
      .from('subscription_orders')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`order_number.ilike.%${search}%,billing_info->customer_name.ilike.%${search}%,billing_info->customer_email.ilike.%${search}%`);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching orders:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data, count, success: true });
  } catch (error) {
    console.error('Orders fetch error:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

// GET /subscription-orders/:id - Get single order
app.get('/subscription-orders/:id', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    
    const { data, error } = await supabase
      .from('subscription_orders')
      .select('*')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();
    
    if (error) {
      console.error(`Error fetching order ${id}:`, error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }
    
    return c.json({ data, success: true });
  } catch (error) {
    console.error('Order fetch error:', error);
    return c.json({ error: 'Failed to fetch order' }, 500);
  }
});

// POST /subscription-orders - Create new order
app.post('/subscription-orders', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const body = await c.req.json();
    
    if (!body.tenant_id || !body.order_number) {
      return c.json({ error: 'Missing required fields: tenant_id, order_number' }, 400);
    }
    
    const orderData = {
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('subscription_orders')
      .insert([orderData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating order:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ data, success: true }, 201);
  } catch (error) {
    console.error('Order creation error:', error);
    return c.json({ error: 'Failed to create order' }, 500);
  }
});

// PUT /subscription-orders/:id - Update order
app.put('/subscription-orders/:id', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const updateData = {
      ...body,
      updated_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('subscription_orders')
      .update(updateData)
      .eq('_id', id)
      .is('deleted_at', null)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating order ${id}:`, error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }
    
    return c.json({ data, success: true });
  } catch (error) {
    console.error('Order update error:', error);
    return c.json({ error: 'Failed to update order' }, 500);
  }
});

// DELETE /subscription-orders/:id - Soft delete order
app.delete('/subscription-orders/:id', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    
    const { error } = await supabase
      .from('subscription_orders')
      .update({ 
        deleted_at: new Date().toISOString(),
        deleted_by: 'admin'
      })
      .eq('_id', id);
    
    if (error) {
      console.error(`Error deleting order ${id}:`, error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }
    
    return c.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Order deletion error:', error);
    return c.json({ error: 'Failed to delete order' }, 500);
  }
});

// GET /subscription-orders/stats/overview - Get statistics
app.get('/subscription-orders/stats/overview', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const url = new URL(c.req.url);
    const tenantId = url.searchParams.get('tenant_id');
    
    let query = supabase
      .from('subscription_orders')
      .select('status, type, total_amount')
      .is('deleted_at', null);
    
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    
    const { data: orders, error } = await query;
    
    if (error) {
      console.error('Error fetching order stats:', error);
      return c.json({ error: error.message }, 500);
    }
    
    const stats = {
      total: orders.length,
      draft: orders.filter(o => o.status === 'DRAFT').length,
      pending: orders.filter(o => o.status === 'PENDING').length,
      paid: orders.filter(o => o.status === 'PAID').length,
      cancelled: orders.filter(o => o.status === 'CANCELLED').length,
      failed: orders.filter(o => o.status === 'FAILED').length,
      refunded: orders.filter(o => o.status === 'REFUNDED').length,
      total_revenue: orders
        .filter(o => o.status === 'PAID')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0),
      // Stats by type
      new_orders: orders.filter(o => o.type === 'NEW').length,
      renewal_orders: orders.filter(o => o.type === 'RENEWAL').length,
      upgrade_orders: orders.filter(o => o.type === 'UPGRADE').length,
      downgrade_orders: orders.filter(o => o.type === 'DOWNGRADE').length,
      addon_orders: orders.filter(o => o.type === 'ADD_ON').length,
    };
    
    return c.json({ data: stats, success: true });
  } catch (error) {
    console.error('Order stats error:', error);
    return c.json({ error: 'Failed to fetch order statistics' }, 500);
  }
});

export default app;