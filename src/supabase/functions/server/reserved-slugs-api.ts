/**
 * Reserved Slugs API
 * Manages system-wide reserved slugs/keywords
 * 
 * Tier 3 - Platform Management
 * ✅ CREATED: 2026-01-21
 */

import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const app = new Hono();

const KV_PREFIX = "reserved_slug:";

interface ReservedSlug {
  _id: string;
  slug: string;
  description?: string;
  entity_type?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  version: number;
}

/**
 * GET /reserved-slugs
 * List all reserved slugs
 */
app.get("/reserved-slugs", async (c) => {
  try {
    const slugs = await kv.getByPrefix<ReservedSlug>(KV_PREFIX);
    
    return c.json({
      success: true,
      data: slugs || [],
      count: slugs?.length || 0,
    });
  } catch (error: any) {
    console.error("Error fetching reserved slugs:", error);
    return c.json(
      { success: false, error: error.message || "Failed to fetch reserved slugs" },
      500
    );
  }
});

/**
 * GET /reserved-slugs/:id
 * Get a specific reserved slug
 */
app.get("/reserved-slugs/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const slug = await kv.get<ReservedSlug>(`${KV_PREFIX}${id}`);

    if (!slug) {
      return c.json({ success: false, error: "Reserved slug not found" }, 404);
    }

    return c.json({ success: true, data: slug });
  } catch (error: any) {
    console.error("Error fetching reserved slug:", error);
    return c.json(
      { success: false, error: error.message || "Failed to fetch reserved slug" },
      500
    );
  }
});

/**
 * POST /reserved-slugs
 * Create a new reserved slug
 */
app.post("/reserved-slugs", async (c) => {
  try {
    const body = await c.req.json();
    const { slug, description, entity_type, is_active } = body;

    // Validation
    if (!slug) {
      return c.json({ success: false, error: "Slug is required" }, 400);
    }

    // Check if slug already exists
    const existingSlugs = await kv.getByPrefix<ReservedSlug>(KV_PREFIX);
    const slugExists = existingSlugs?.some((s) => s.slug === slug);
    
    if (slugExists) {
      return c.json({ success: false, error: "Slug already exists" }, 409);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const newSlug: ReservedSlug = {
      _id: id,
      slug,
      description,
      entity_type,
      is_active: is_active ?? true,
      created_at: now,
      updated_at: now,
      version: 1,
    };

    await kv.set(`${KV_PREFIX}${id}`, newSlug);

    return c.json({ success: true, data: newSlug }, 201);
  } catch (error: any) {
    console.error("Error creating reserved slug:", error);
    return c.json(
      { success: false, error: error.message || "Failed to create reserved slug" },
      500
    );
  }
});

/**
 * PUT /reserved-slugs/:id
 * Update a reserved slug
 */
app.put("/reserved-slugs/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { slug, description, entity_type, is_active, version } = body;

    const existingSlug = await kv.get<ReservedSlug>(`${KV_PREFIX}${id}`);

    if (!existingSlug) {
      return c.json({ success: false, error: "Reserved slug not found" }, 404);
    }

    // Optimistic locking check
    if (version !== undefined && existingSlug.version !== version) {
      return c.json(
        {
          success: false,
          error: "Version conflict. The record has been modified by another user.",
          current_version: existingSlug.version,
        },
        409
      );
    }

    // Check if new slug conflicts with existing slugs (excluding current one)
    if (slug && slug !== existingSlug.slug) {
      const allSlugs = await kv.getByPrefix<ReservedSlug>(KV_PREFIX);
      const slugExists = allSlugs?.some((s) => s.slug === slug && s._id !== id);
      
      if (slugExists) {
        return c.json({ success: false, error: "Slug already exists" }, 409);
      }
    }

    const updatedSlug: ReservedSlug = {
      ...existingSlug,
      slug: slug ?? existingSlug.slug,
      description: description !== undefined ? description : existingSlug.description,
      entity_type: entity_type !== undefined ? entity_type : existingSlug.entity_type,
      is_active: is_active !== undefined ? is_active : existingSlug.is_active,
      updated_at: new Date().toISOString(),
      version: existingSlug.version + 1,
    };

    await kv.set(`${KV_PREFIX}${id}`, updatedSlug);

    return c.json({ success: true, data: updatedSlug });
  } catch (error: any) {
    console.error("Error updating reserved slug:", error);
    return c.json(
      { success: false, error: error.message || "Failed to update reserved slug" },
      500
    );
  }
});

/**
 * DELETE /reserved-slugs/:id
 * Delete a reserved slug
 */
app.delete("/reserved-slugs/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existingSlug = await kv.get<ReservedSlug>(`${KV_PREFIX}${id}`);

    if (!existingSlug) {
      return c.json({ success: false, error: "Reserved slug not found" }, 404);
    }

    await kv.del(`${KV_PREFIX}${id}`);

    return c.json({ success: true, message: "Reserved slug deleted" });
  } catch (error: any) {
    console.error("Error deleting reserved slug:", error);
    return c.json(
      { success: false, error: error.message || "Failed to delete reserved slug" },
      500
    );
  }
});

/**
 * POST /reserved-slugs/check
 * Check if a slug is reserved
 */
app.post("/reserved-slugs/check", async (c) => {
  try {
    const body = await c.req.json();
    const { slug } = body;

    if (!slug) {
      return c.json({ success: false, error: "Slug is required" }, 400);
    }

    const allSlugs = await kv.getByPrefix<ReservedSlug>(KV_PREFIX);
    const reservedSlug = allSlugs?.find(
      (s) => s.slug === slug && s.is_active
    );

    return c.json({
      success: true,
      is_reserved: !!reservedSlug,
      data: reservedSlug || null,
    });
  } catch (error: any) {
    console.error("Error checking reserved slug:", error);
    return c.json(
      { success: false, error: error.message || "Failed to check reserved slug" },
      500
    );
  }
});

export default app;
