# System Categories Migration Guide

## 📋 Overview
This migration creates the `system_categories` table in Supabase with camelCase field naming convention.

## 🚀 How to Run Migration

### Step 1: Open Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)

### Step 2: Run Migration
1. Click **New Query**
2. Copy the entire contents of `/supabase/migrations/001_create_system_categories.sql`
3. Paste into the SQL Editor
4. Click **Run** or press `Ctrl+Enter`

### Step 3: Verify
After running the migration, verify:

```sql
-- Check table exists
SELECT * FROM system_categories LIMIT 10;

-- Should return 25 seed records with categories like:
-- GRP_SYSTEM, CAT_DRAFT, CAT_PUBLISHED, etc.
```

## 📊 Table Schema

```sql
CREATE TABLE system_categories (
  id UUID PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  "categoryGroup" VARCHAR(100) NOT NULL,  -- camelCase
  description TEXT,
  "isSystem" BOOLEAN DEFAULT false,       -- camelCase
  "isEditable" BOOLEAN DEFAULT true,      -- camelCase
  "order" INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),  -- camelCase
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()   -- camelCase
);
```

## 🔐 Security Policies
The migration includes:
- Row Level Security (RLS) enabled
- Read access for all users
- Full access for authenticated users

## 📦 Seed Data
Includes 25 pre-configured categories:
- **System Category Groups**: System, Business, Technical, User
- **Entity Status**: Draft, Published, Archived, Deleted
- **Priority Levels**: Critical, High, Medium, Low
- **User Roles**: Admin, Editor, Viewer
- **Workflow States**: Pending, Approved, Rejected, Completed

## 🐛 Troubleshooting

### Error: "Table already exists"
```sql
-- Drop table if you need to recreate
DROP TABLE IF EXISTS system_categories CASCADE;
-- Then run migration again
```

### Error: "Column does not exist"
Make sure you're using quotes for camelCase columns:
```sql
-- ❌ Wrong
SELECT categoryGroup FROM system_categories;

-- ✅ Correct
SELECT "categoryGroup" FROM system_categories;
```

### Supabase Client Query (No quotes needed)
```typescript
// In JavaScript/TypeScript, no quotes needed
const { data } = await supabase
  .from('system_categories')
  .select('*')
  .eq('categoryGroup', 'system');
```

## 📝 Notes
- All field names use **camelCase** convention
- PostgreSQL requires quotes for camelCase identifiers in raw SQL
- Supabase JS client handles this automatically
- Reserved keywords like `order` also need quotes

## ✅ Checklist
- [ ] Opened Supabase Dashboard
- [ ] Navigated to SQL Editor
- [ ] Copied migration file content
- [ ] Pasted and executed SQL
- [ ] Verified 25 seed records exist
- [ ] Tested query: `SELECT * FROM system_categories`
- [ ] App can now connect and CRUD operations work

---

**Need Help?** 
Check the error console for detailed messages or refer to [Supabase Documentation](https://supabase.com/docs)
