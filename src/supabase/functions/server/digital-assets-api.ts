/**
 * Digital Assets API
 * Manages tenant digital assets (domains, SSL, licenses, etc.)
 * Schema: tenant_digital_assets (docs/Tables.md)
 */

import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// ==================== TYPES ====================

interface DigitalAsset {
  _id: string;
  tenant_id: string;
  order_id?: string;
  asset_type: string; // No strict ENUM in DB, flexible varchar
  name: string;
  status: 'PENDING' | 'PROVISIONING' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'TRANSFERRING';
  auto_renew: boolean;
  asset_metadata: Record<string, any>;
  activated_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  version: number;
}

// ==================== HELPERS ====================

const KV_PREFIX = 'digital-assets';

function generateId(): string {
  return `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createAsset(data: Partial<DigitalAsset>): DigitalAsset {
  const now = new Date().toISOString();
  return {
    _id: data._id || generateId(),
    tenant_id: data.tenant_id || 'tenant-default',
    name: data.name || '',
    asset_type: data.asset_type || 'OTHER',
    status: data.status || 'PENDING',
    auto_renew: data.auto_renew ?? true,
    asset_metadata: data.asset_metadata || {},
    created_at: data.created_at || now,
    updated_at: now,
    version: data.version || 1,
    ...data,
  };
}

// ==================== ROUTES ====================

/**
 * GET /digital-assets
 * Get all digital assets (non-deleted)
 */
app.get('/digital-assets', async (c) => {
  try {
    const assets = await kv.getByPrefix<DigitalAsset>(KV_PREFIX);
    
    // Filter out soft-deleted
    const activeAssets = assets.filter(asset => !asset.deleted_at);
    
    // Apply query filters
    const url = new URL(c.req.url);
    const tenantId = url.searchParams.get('tenant_id');
    const assetType = url.searchParams.get('asset_type');
    const status = url.searchParams.get('status');
    
    let filtered = activeAssets;
    
    if (tenantId) {
      filtered = filtered.filter(a => a.tenant_id === tenantId);
    }
    if (assetType) {
      filtered = filtered.filter(a => a.asset_type === assetType);
    }
    if (status) {
      filtered = filtered.filter(a => a.status === status);
    }
    
    // Sort by created_at desc
    filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    return c.json({ data: filtered, count: filtered.length });
  } catch (error: any) {
    console.error('Error fetching digital assets:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /digital-assets/:id
 * Get a single digital asset by ID
 */
app.get('/digital-assets/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const key = `${KV_PREFIX}:${id}`;
    const asset = await kv.get<DigitalAsset>(key);
    
    if (!asset || asset.deleted_at) {
      return c.json({ error: 'Digital asset not found' }, 404);
    }
    
    return c.json({ data: asset });
  } catch (error: any) {
    console.error('Error fetching digital asset:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /digital-assets
 * Create a new digital asset
 */
app.post('/digital-assets', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.name || !body.asset_type) {
      return c.json({ 
        error: 'Missing required fields: name, asset_type' 
      }, 400);
    }
    
    const asset = createAsset(body);
    const key = `${KV_PREFIX}:${asset._id}`;
    
    await kv.set(key, asset);
    
    return c.json({ data: asset }, 201);
  } catch (error: any) {
    console.error('Error creating digital asset:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * PUT /digital-assets/:id
 * Update a digital asset
 */
app.put('/digital-assets/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const key = `${KV_PREFIX}:${id}`;
    
    const existing = await kv.get<DigitalAsset>(key);
    
    if (!existing || existing.deleted_at) {
      return c.json({ error: 'Digital asset not found' }, 404);
    }
    
    // Optimistic locking check
    if (body.version && body.version !== existing.version) {
      return c.json({ 
        error: 'Version conflict. Asset was modified by another user.' 
      }, 409);
    }
    
    const updated: DigitalAsset = {
      ...existing,
      ...body,
      _id: existing._id, // Prevent ID change
      updated_at: new Date().toISOString(),
      version: existing.version + 1,
    };
    
    await kv.set(key, updated);
    
    return c.json({ data: updated });
  } catch (error: any) {
    console.error('Error updating digital asset:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * DELETE /digital-assets/:id
 * Soft delete a digital asset
 */
app.delete('/digital-assets/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const key = `${KV_PREFIX}:${id}`;
    
    const existing = await kv.get<DigitalAsset>(key);
    
    if (!existing || existing.deleted_at) {
      return c.json({ error: 'Digital asset not found' }, 404);
    }
    
    const deleted: DigitalAsset = {
      ...existing,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: existing.version + 1,
    };
    
    await kv.set(key, deleted);
    
    return c.json({ message: 'Digital asset deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting digital asset:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /digital-assets/seed
 * Seed sample digital assets matching tenant_digital_assets schema
 */
app.post('/digital-assets/seed', async (c) => {
  try {
    const sampleAssets: Partial<DigitalAsset>[] = [
      {
        name: 'example.com',
        asset_type: 'DOMAIN',
        status: 'ACTIVE',
        auto_renew: true,
        activated_at: '2024-01-15T00:00:00Z',
        expires_at: '2025-01-15T00:00:00Z',
        asset_metadata: {
          registrar: 'GoDaddy',
          renewal_price: 15.99,
          dns_servers: ['ns1.example.com', 'ns2.example.com'],
          notes: 'Primary company domain',
        },
      },
      {
        name: 'SSL Certificate - *.example.com',
        asset_type: 'SSL_CERTIFICATE',
        status: 'ACTIVE',
        auto_renew: true,
        activated_at: '2024-06-01T00:00:00Z',
        expires_at: '2025-06-01T00:00:00Z',
        asset_metadata: {
          issuer: 'DigiCert',
          certificate_type: 'Wildcard',
          renewal_price: 89.99,
          serial_number: 'ABC123XYZ789',
          notes: 'Wildcard SSL certificate',
        },
      },
      {
        name: 'Windows Server 2022 Standard',
        asset_type: 'LICENSE_KEY',
        status: 'ACTIVE',
        auto_renew: false,
        activated_at: '2024-03-10T00:00:00Z',
        asset_metadata: {
          product_key: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
          edition: 'Standard',
          max_installations: 1,
          notes: 'Production server license',
        },
      },
      {
        name: 'Adobe Creative Cloud Team',
        asset_type: 'SUBSCRIPTION',
        status: 'ACTIVE',
        auto_renew: true,
        activated_at: '2024-01-01T00:00:00Z',
        expires_at: '2025-01-01T00:00:00Z',
        asset_metadata: {
          subscription_id: 'team-subscription-001',
          seats: 10,
          renewal_price: 599.88,
          billing_cycle: 'Annual',
          notes: '10 user seats',
        },
      },
      {
        name: 'backup.example.com',
        asset_type: 'DOMAIN',
        status: 'PENDING',
        auto_renew: false,
        expires_at: '2025-11-20T00:00:00Z',
        asset_metadata: {
          registrar: 'Namecheap',
          renewal_price: 12.99,
          purchased_date: '2024-11-20',
          notes: 'Backup domain - awaiting DNS setup',
        },
      },
      {
        name: 'Microsoft 365 Business Premium',
        asset_type: 'SUBSCRIPTION',
        status: 'PROVISIONING',
        auto_renew: true,
        expires_at: '2025-03-01T00:00:00Z',
        asset_metadata: {
          subscription_id: 'ms365-premium-001',
          seats: 25,
          renewal_price: 1499.75,
          billing_cycle: 'Annual',
          notes: 'Company-wide productivity suite',
        },
      },
    ];
    
    const created: DigitalAsset[] = [];
    
    for (const assetData of sampleAssets) {
      const asset = createAsset(assetData);
      const key = `${KV_PREFIX}:${asset._id}`;
      await kv.set(key, asset);
      created.push(asset);
    }
    
    return c.json({ 
      message: `Seeded ${created.length} digital assets`,
      data: created 
    }, 201);
  } catch (error: any) {
    console.error('Error seeding digital assets:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;