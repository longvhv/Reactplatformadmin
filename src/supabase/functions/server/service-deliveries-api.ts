/**
 * Service Deliveries API
 * Manages tenant service deliveries (SaaS product usage/delivery tracking)
 * Schema: tenant_service_deliveries (docs/Tables.md)
 */

import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// ==================== TYPES ====================

interface ServiceDelivery {
  _id: string;
  tenant_id: string;
  product_id: string;
  subscription_id?: string;
  unit_type: string; // e.g., 'HOURS', 'SEATS', 'API_CALLS', 'STORAGE_GB'
  total_units: number;
  delivered_units: number;
  unit_price: number;
  currency_code: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  service_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  version: number;
}

// ==================== HELPERS ====================

const KV_PREFIX = 'service-deliveries';

function generateId(): string {
  return `delivery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createDelivery(data: Partial<ServiceDelivery>): ServiceDelivery {
  const now = new Date().toISOString();
  return {
    _id: data._id || generateId(),
    tenant_id: data.tenant_id || 'tenant-default',
    product_id: data.product_id || '',
    unit_type: data.unit_type || 'UNITS',
    total_units: data.total_units || 0,
    delivered_units: data.delivered_units || 0,
    unit_price: data.unit_price || 0,
    currency_code: data.currency_code || 'VND',
    status: data.status || 'PENDING',
    service_metadata: data.service_metadata || {},
    created_at: data.created_at || now,
    updated_at: now,
    version: data.version || 1,
    ...data,
  };
}

// ==================== ROUTES ====================

/**
 * GET /service-deliveries
 * Get all service deliveries with filters
 */
app.get('/service-deliveries', async (c) => {
  try {
    const deliveries = await kv.getByPrefix<ServiceDelivery>(KV_PREFIX);
    
    // Apply query filters
    const url = new URL(c.req.url);
    const tenantId = url.searchParams.get('tenant_id');
    const productId = url.searchParams.get('product_id');
    const status = url.searchParams.get('status');
    const subscriptionId = url.searchParams.get('subscription_id');
    
    let filtered = deliveries;
    
    if (tenantId) {
      filtered = filtered.filter(d => d.tenant_id === tenantId);
    }
    if (productId) {
      filtered = filtered.filter(d => d.product_id === productId);
    }
    if (status) {
      filtered = filtered.filter(d => d.status === status);
    }
    if (subscriptionId) {
      filtered = filtered.filter(d => d.subscription_id === subscriptionId);
    }
    
    // Sort by created_at desc
    filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    return c.json({ data: filtered, count: filtered.length });
  } catch (error: any) {
    console.error('Error fetching service deliveries:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /service-deliveries/:id
 * Get a single service delivery by ID
 */
app.get('/service-deliveries/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const key = `${KV_PREFIX}:${id}`;
    const delivery = await kv.get<ServiceDelivery>(key);
    
    if (!delivery) {
      return c.json({ error: 'Service delivery not found' }, 404);
    }
    
    return c.json({ data: delivery });
  } catch (error: any) {
    console.error('Error fetching service delivery:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /service-deliveries
 * Create a new service delivery
 */
app.post('/service-deliveries', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.tenant_id || !body.product_id || !body.unit_type) {
      return c.json({ 
        error: 'Missing required fields: tenant_id, product_id, unit_type' 
      }, 400);
    }
    
    const delivery = createDelivery(body);
    const key = `${KV_PREFIX}:${delivery._id}`;
    
    await kv.set(key, delivery);
    
    return c.json({ data: delivery }, 201);
  } catch (error: any) {
    console.error('Error creating service delivery:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * PUT /service-deliveries/:id
 * Update a service delivery
 */
app.put('/service-deliveries/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const key = `${KV_PREFIX}:${id}`;
    
    const existing = await kv.get<ServiceDelivery>(key);
    
    if (!existing) {
      return c.json({ error: 'Service delivery not found' }, 404);
    }
    
    // Optimistic locking check
    if (body.version && body.version !== existing.version) {
      return c.json({ 
        error: 'Version conflict. Service delivery was modified by another user.' 
      }, 409);
    }
    
    const updated: ServiceDelivery = {
      ...existing,
      ...body,
      _id: existing._id, // Prevent ID change
      updated_at: new Date().toISOString(),
      version: existing.version + 1,
    };
    
    await kv.set(key, updated);
    
    return c.json({ data: updated });
  } catch (error: any) {
    console.error('Error updating service delivery:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * DELETE /service-deliveries/:id
 * Delete a service delivery (hard delete, no soft delete in schema)
 */
app.delete('/service-deliveries/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const key = `${KV_PREFIX}:${id}`;
    
    const existing = await kv.get<ServiceDelivery>(key);
    
    if (!existing) {
      return c.json({ error: 'Service delivery not found' }, 404);
    }
    
    await kv.del(key);
    
    return c.json({ message: 'Service delivery deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting service delivery:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * PATCH /service-deliveries/:id/progress
 * Update delivery progress (delivered_units)
 */
app.patch('/service-deliveries/:id/progress', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const key = `${KV_PREFIX}:${id}`;
    
    const existing = await kv.get<ServiceDelivery>(key);
    
    if (!existing) {
      return c.json({ error: 'Service delivery not found' }, 404);
    }
    
    const deliveredUnits = body.delivered_units ?? existing.delivered_units;
    
    // Auto-update status based on progress
    let status = existing.status;
    if (deliveredUnits >= existing.total_units) {
      status = 'COMPLETED';
    } else if (deliveredUnits > 0) {
      status = 'IN_PROGRESS';
    }
    
    const updated: ServiceDelivery = {
      ...existing,
      delivered_units: deliveredUnits,
      status,
      updated_at: new Date().toISOString(),
      version: existing.version + 1,
    };
    
    await kv.set(key, updated);
    
    return c.json({ data: updated });
  } catch (error: any) {
    console.error('Error updating service delivery progress:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /service-deliveries/seed
 * Seed sample service deliveries
 */
app.post('/service-deliveries/seed', async (c) => {
  try {
    const sampleDeliveries: Partial<ServiceDelivery>[] = [
      {
        tenant_id: 'tenant-default',
        product_id: 'product-001',
        subscription_id: 'sub-001',
        unit_type: 'API_CALLS',
        total_units: 100000,
        delivered_units: 45230,
        unit_price: 0.001,
        currency_code: 'USD',
        status: 'IN_PROGRESS',
        service_metadata: {
          product_name: 'API Gateway Pro',
          billing_period: 'Monthly',
          start_date: '2024-01-01',
          end_date: '2024-01-31',
        },
      },
      {
        tenant_id: 'tenant-default',
        product_id: 'product-002',
        subscription_id: 'sub-002',
        unit_type: 'STORAGE_GB',
        total_units: 500,
        delivered_units: 500,
        unit_price: 0.15,
        currency_code: 'USD',
        status: 'COMPLETED',
        service_metadata: {
          product_name: 'Cloud Storage Enterprise',
          billing_period: 'Monthly',
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          storage_region: 'us-east-1',
        },
      },
      {
        tenant_id: 'tenant-default',
        product_id: 'product-003',
        unit_type: 'SEATS',
        total_units: 50,
        delivered_units: 0,
        unit_price: 29.99,
        currency_code: 'USD',
        status: 'PENDING',
        service_metadata: {
          product_name: 'Team Collaboration Suite',
          billing_period: 'Annual',
          license_type: 'Enterprise',
        },
      },
      {
        tenant_id: 'tenant-default',
        product_id: 'product-004',
        subscription_id: 'sub-004',
        unit_type: 'HOURS',
        total_units: 200,
        delivered_units: 87.5,
        unit_price: 150,
        currency_code: 'USD',
        status: 'IN_PROGRESS',
        service_metadata: {
          product_name: 'Professional Services',
          service_type: 'Consulting',
          consultant_name: 'John Doe',
          project_code: 'PROJ-2024-001',
        },
      },
      {
        tenant_id: 'tenant-default',
        product_id: 'product-005',
        subscription_id: 'sub-005',
        unit_type: 'BANDWIDTH_TB',
        total_units: 10,
        delivered_units: 10,
        unit_price: 50,
        currency_code: 'USD',
        status: 'COMPLETED',
        service_metadata: {
          product_name: 'CDN Premium',
          billing_period: 'Monthly',
          regions: ['US', 'EU', 'APAC'],
        },
      },
    ];
    
    const created: ServiceDelivery[] = [];
    
    for (const deliveryData of sampleDeliveries) {
      const delivery = createDelivery(deliveryData);
      const key = `${KV_PREFIX}:${delivery._id}`;
      await kv.set(key, delivery);
      created.push(delivery);
    }
    
    return c.json({ 
      message: `Seeded ${created.length} service deliveries`,
      data: created 
    }, 201);
  } catch (error: any) {
    console.error('Error seeding service deliveries:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;
