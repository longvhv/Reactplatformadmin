# 🚨 CRITICAL: Database Migration Required

## ⚠️ Error You're Seeing
```
Load category groups error: Error: Could not find the table 'public.system_categories' in the schema cache
```

## 🔧 Why This Happens
The `system_categories` table doesn't exist in your Supabase database yet. You need to run the migration SQL to create it.

---

## ✅ How to Fix (5 Minutes)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar

### Step 2: Run the Migration
1. Click **New Query** button
2. Copy the **ENTIRE** content from the file:
   ```
   /supabase/migrations/001_create_system_categories.sql
   ```
3. Paste it into the SQL Editor
4. Click **Run** button (or press `Ctrl + Enter`)

### Step 3: Verify Success
After running, you should see:
```
Success. Rows returned: 25
```

Run this verification query:
```sql
SELECT COUNT(*) as total FROM system_categories;
-- Should return: 25
```

---

## 📊 What This Migration Does

### Creates Table
```sql
CREATE TABLE system_categories (
  id UUID PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  "categoryGroup" VARCHAR(100) NOT NULL,  -- camelCase!
  description TEXT,
  "isSystem" BOOLEAN DEFAULT false,
  "isEditable" BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
```

### Inserts 25 Seed Records
- **System Category Groups**: GRP_SYSTEM, GRP_BUSINESS, GRP_TECHNICAL, GRP_USER
- **Entity Status**: CAT_DRAFT, CAT_PUBLISHED, CAT_ARCHIVED, CAT_DELETED
- **Priority Levels**: CAT_CRITICAL, CAT_HIGH, CAT_MEDIUM, CAT_LOW
- **User Roles**: CAT_ADMIN, CAT_EDITOR, CAT_VIEWER
- **Workflow States**: CAT_PENDING, CAT_APPROVED, CAT_REJECTED, CAT_COMPLETED
- And more...

### Sets Up Security
- Enables Row Level Security (RLS)
- Allows read access for all users
- Allows full access for authenticated users

---

## 🎯 After Migration

1. **Reload the app** (Ctrl + R / Cmd + R)
2. Navigate to **System Categories** page
3. You should see **25 pre-loaded categories**
4. All CRUD operations will work perfectly!

---

## 🐛 Troubleshooting

### "Table already exists" Error
```sql
-- Drop the table and start fresh
DROP TABLE IF EXISTS system_categories CASCADE;
-- Then run the migration again
```

### "Permission denied" Error
Make sure you're logged in to Supabase Dashboard with the correct project.

### Still Not Working?
1. Check Supabase project URL matches your app
2. Verify the table exists:
   ```sql
   SELECT * FROM system_categories LIMIT 5;
   ```
3. Check browser console for detailed error messages

---

## 📝 Important Notes

### ⚡ CamelCase Fields
All field names use **camelCase** convention (not snake_case):
- `categoryGroup` (not `category_group`)
- `isSystem` (not `is_system`)
- `isEditable` (not `is_editable`)
- `createdAt` (not `created_at`)

### 🔐 Querying in SQL
When writing raw SQL, use **quotes** for camelCase:
```sql
-- ❌ Wrong
SELECT categoryGroup FROM system_categories;

-- ✅ Correct
SELECT "categoryGroup" FROM system_categories;
```

### 💻 Querying in JavaScript
Supabase JS client handles this automatically:
```typescript
// ✅ No quotes needed
const { data } = await supabase
  .from('system_categories')
  .select('*')
  .eq('categoryGroup', 'system');
```

---

## 🎉 Success Checklist

- [ ] Opened Supabase Dashboard
- [ ] Found SQL Editor
- [ ] Copied migration file content
- [ ] Pasted and executed SQL
- [ ] Saw "Success. Rows returned: 25"
- [ ] Verified with SELECT query
- [ ] Reloaded the app
- [ ] System Categories page loads without errors
- [ ] Can see 25 categories in the interface

---

**Need the migration file?**  
Location: `/supabase/migrations/001_create_system_categories.sql`

**Need more help?**  
Check: `/supabase/migrations/README.md`

---

🚀 **Once migration is complete, the app will work perfectly!**
