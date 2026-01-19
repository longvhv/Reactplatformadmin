# Database Migrations

This directory contains SQL migration files for database schema changes.

## 📋 Available Migrations

### 2026-01-16: Applications & Permissions Tables

**File:** `2026-01-16-applications-permissions-tables.sql`

**Purpose:** Create tables for applications and permissions to support dynamic role permission management.

**What it creates:**
- `applications` table - Store application definitions
- `permissions` table - Store permission definitions linked to applications
- Indexes for performance
- Triggers for `updated_at` auto-update
- Sample seed data (6 applications, 40+ permissions)

**How to run:**

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Create a new query
4. Copy and paste the entire content of `2026-01-16-applications-permissions-tables.sql`
5. Click "Run" button
6. Verify success messages in output

**Verification:**
```sql
-- Check applications
SELECT * FROM applications;

-- Check permissions count
SELECT 
  a.name,
  COUNT(p.id) as permission_count
FROM applications a
LEFT JOIN permissions p ON a.id = p.application_id
GROUP BY a.name;
```

**Rollback (if needed):**
```sql
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

---

## 📖 General Migration Guidelines

### Before Running
- ✅ Backup your database
- ✅ Review the migration file
- ✅ Test in development environment first
- ✅ Check for conflicts with existing tables

### After Running
- ✅ Verify tables created successfully
- ✅ Check data inserted correctly
- ✅ Test affected features in the application
- ✅ Monitor for errors in production

### Best Practices
- Always run migrations in order (by date)
- Document any manual changes
- Keep backups before major migrations
- Test rollback procedures

---

## 🔧 Troubleshooting

### Common Issues

**Issue: "relation already exists"**
- Solution: The table already exists. Check if you need to run the migration or skip it.

**Issue: "permission denied"**
- Solution: Make sure you're using the service role key in Supabase or have proper permissions.

**Issue: "syntax error"**
- Solution: Make sure you copied the entire SQL file correctly.

**Issue: Foreign key constraint fails**
- Solution: Make sure parent tables exist before creating child tables.

---

## 📞 Support

If you encounter any issues:
1. Check the migration file comments
2. Review Supabase logs
3. Consult the feature documentation in `/docs/features/`
4. Check for related bugfix docs in `/docs/bugfix/`

---

**Last Updated:** 2026-01-16  
**Maintained By:** Development Team
