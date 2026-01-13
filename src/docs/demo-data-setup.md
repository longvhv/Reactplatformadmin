# Demo Data Setup Guide

## Overview
Comprehensive demo data initialization system for quick testing and development. Includes hierarchical tenants, users with different roles, and tenant memberships.

**Seed Endpoint:** `/api/core/seed`

---

## Demo Data Includes

### Tenants (7 total)
Hierarchical structure with 3 levels:

**Level 0: Platform**
- `vhv-platform` - Main platform tenant (root)

**Level 1: Organizations (3)**
- `tech-corp` - Technology corporation
- `edu-institute` - Educational institution
- `health-care` - Healthcare provider
- `demo-tenant` - Trial/demo tenant

**Level 2: Divisions (2)**
- `tech-corp-engineering` - Engineering division under Tech Corp
- `tech-corp-sales` - Sales division under Tech Corp

**Level 3: Teams (2)**
- `tech-corp-eng-frontend` - Frontend team
- `tech-corp-eng-backend` - Backend team

### Users (16 total)

**Super Admins (2)**
- `admin@vhvplatform.com` - Platform Administrator
- `sarah.admin@vhvplatform.com` - Sarah Johnson

**Admins (5)**
- `john.doe@techcorp.com` - Engineering Manager @ Tech Corp
- `lisa.chen@techcorp.com` - Sales Director @ Tech Corp
- `david.smith@eduinstitute.edu` - Academic Director @ Education
- `dr.maria.garcia@healthcareplus.com` - CMO @ Healthcare

**Users (7)**
- `mike.wilson@techcorp.com` - Senior Frontend Developer
- `emma.brown@techcorp.com` - Senior Backend Developer
- `alex.kim@techcorp.com` - DevOps Engineer
- `sophia.white@eduinstitute.edu` - Professor
- `james.taylor@eduinstitute.edu` - Student Advisor
- `robert.johnson@healthcareplus.com` - Cardiologist

**Moderators (1)**
- `support@vhvplatform.com` - Support Team

**Viewers (1)**
- `guest@vhvplatform.com` - Guest User

**Inactive (1)**
- `inactive@example.com` - Former Employee

### Passwords
- **Super Admins:** `Admin@123456`
- **All Others:** `User@123456`

All demo users have `email_verified = true` for immediate testing.

---

## Using the Seed Data UI

### Location
Navigate to **Settings Page** (`/core/settings`) - scroll to bottom for "Demo Data Management" card.

### Features

**1. Check Status**
- Click "Check Status" to see current seed state
- Shows existing vs expected counts for tenants and users
- Indicates if data is fully seeded, partially seeded, or not seeded

**2. Seed Demo Data**
- Click "Seed Demo Data" to initialize all demo data
- Creates tenants in hierarchical order (parents before children)
- Creates users with hashed passwords
- Skips existing records (idempotent)
- Shows success message with counts

**3. Clear Demo Data**
- Click "Clear Demo Data" to remove all demo data
- Requires confirmation dialog
- Deletes all demo tenants and users
- Only enabled when demo data exists

### Status Indicators
- ✅ **Green checkmark** - Data fully seeded
- ❌ **Gray X** - Data not seeded
- ⚠️ **Amber warning** - Partial data detected

---

## API Endpoints

### POST /api/core/seed
Seed all demo data.

**Request:**
```bash
curl -X POST https://PROJECT.supabase.co/functions/v1/api/core/seed \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Demo data seeded successfully",
  "results": {
    "tenants": {
      "created": 7,
      "errors": []
    },
    "users": {
      "created": 16,
      "errors": []
    },
    "summary": "Successfully seeded 7 tenants and 16 users"
  }
}
```

**Behavior:**
- Idempotent: Safe to run multiple times
- Skips existing records based on unique constraints (email, code)
- Creates tenants in order to respect parent-child relationships
- Hashes passwords using bcrypt (10 rounds)
- Sets all users as email_verified

---

### DELETE /api/core/seed
Clear all demo data.

**Request:**
```bash
curl -X DELETE https://PROJECT.supabase.co/functions/v1/api/core/seed \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Demo data cleared successfully"
}
```

**Warning:** This permanently deletes demo data. Use with caution.

---

### GET /api/core/seed/status
Check seed data status.

**Request:**
```bash
curl https://PROJECT.supabase.co/functions/v1/api/core/seed/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "status": {
    "tenants": {
      "existing": 7,
      "expected": 7,
      "seeded": true
    },
    "users": {
      "existing": 16,
      "expected": 16,
      "seeded": true
    }
  }
}
```

---

## Demo Data Details

### Tenant Hierarchy Visualization

```
vhv-platform (PLATFORM)
├── tech-corp (ENTERPRISE)
│   ├── tech-corp-engineering (DIVISION)
│   │   ├── tech-corp-eng-frontend (TEAM)
│   │   └── tech-corp-eng-backend (TEAM)
│   └── tech-corp-sales (DIVISION)
├── edu-institute (EDUCATION)
│   ├── edu-campus-london (BRANCH)
│   └── edu-campus-manchester (BRANCH)
├── health-care (HEALTHCARE)
└── demo-tenant (TRIAL)
```

### Tenant Types
- `PLATFORM` - Root platform tenant
- `ENTERPRISE` - Large organizations
- `DIVISION` - Organizational divisions
- `TEAM` - Individual teams
- `BRANCH` - Physical branches/locations
- `TRIAL` - Trial/demo tenants
- `EDUCATION` - Educational institutions
- `HEALTHCARE` - Healthcare providers

### User Distribution
| Role | Count | Example |
|------|-------|---------|
| SUPER_ADMIN | 2 | Platform administrators |
| ADMIN | 5 | Organization admins |
| USER | 7 | Standard users |
| MODERATOR | 1 | Support/moderation |
| VIEWER | 1 | Read-only access |

### User Statuses
| Status | Count | Example |
|--------|-------|---------|
| ACTIVE | 15 | Most users |
| INACTIVE | 1 | Former employees |

---

## Development Workflow

### Initial Setup
```bash
# 1. Navigate to Settings page
http://localhost:5173/core/settings

# 2. Click "Seed Demo Data"
# 3. Wait for success message
# 4. Verify by checking tenant/user pages
```

### Testing Multi-Tenancy
```bash
# Login as different tenant admins:
john.doe@techcorp.com / User@123456        # Tech Corp
david.smith@eduinstitute.edu / User@123456 # Education
dr.maria.garcia@healthcareplus.com / User@123456 # Healthcare
```

### Testing Hierarchies
```bash
# Navigate tenants in hierarchy:
1. vhv-platform
2. tech-corp (child of platform)
3. tech-corp-engineering (child of tech-corp)
4. tech-corp-eng-frontend (child of engineering)
```

### Cleanup
```bash
# Clear all demo data
# Navigate to Settings > Demo Data Management
# Click "Clear Demo Data" > Confirm
```

---

## Implementation Details

### Password Hashing
- Algorithm: bcrypt
- Salt rounds: 10
- Server-side only
- Never stored in plain text

### Tenant Relationships
- `parent_tenant_id` references `tenants._id`
- Must create parent before child
- Hierarchical queries supported

### Data Integrity
- Unique constraints: email (users), code (tenants)
- Foreign keys: parent_tenant_id
- Soft delete support (deleted_at)
- Audit trail (created_at, updated_at, version)

### Idempotency
Seed endpoint is idempotent:
```typescript
// Check if exists before creating
const { data: existing } = await supabase
  .from('users')
  .select('_id')
  .eq('email', user.email)
  .single();

if (existing) {
  console.log('User exists, skipping...');
  continue;
}
```

---

## Common Use Cases

### 1. Fresh Database Testing
```bash
# Clear existing data
DELETE /api/core/seed

# Seed fresh demo data
POST /api/core/seed

# Verify
GET /api/core/seed/status
```

### 2. Partial Data Recovery
If some demo data exists but incomplete:
```bash
# Seed will only create missing records
POST /api/core/seed
# Output: "Created 3 tenants, 5 users" (only missing ones)
```

### 3. Role-Based Testing
Login as different roles to test permissions:
- Super Admin: Full platform access
- Admin: Tenant-level access
- User: Basic access
- Moderator: Content management
- Viewer: Read-only

### 4. Hierarchy Testing
Test parent-child relationships:
- Query descendants
- Query ancestors
- Breadcrumb navigation
- Permission inheritance

---

## Troubleshooting

### Issue: Seed fails with "already exists"
**Solution:** Data already seeded. Use Clear first or check existing data.

### Issue: "Version conflict" errors
**Solution:** Concurrent updates. Retry seeding.

### Issue: Some tenants/users not created
**Solution:** Check errors array in response for details.

### Issue: Cannot login with demo credentials
**Solution:** Verify email and password. Check email_verified = true.

### Issue: Hierarchy not showing correctly
**Solution:** Ensure parent tenants created before children. Re-seed in order.

---

## Best Practices

1. **Always check status first** before seeding
2. **Clear old data** before fresh seed in production-like environments
3. **Use demo passwords** only in development
4. **Test hierarchies** by navigating tenant tree
5. **Verify counts** after seeding (should match expected)
6. **Monitor errors** in seed response
7. **Use different roles** for comprehensive testing

---

## Security Notes

⚠️ **IMPORTANT:**
- Demo data is for **development/testing ONLY**
- Never use demo passwords in production
- Clear demo data before production deployment
- Demo users have email_verified = true (bypasses verification)
- Passwords meet minimum requirements but are well-known

---

## Summary

**Total Demo Data:**
- 7 Tenants (3-level hierarchy)
- 16 Users (5 roles, 2 statuses)
- All passwords: Admin@123456 / User@123456
- All users: email_verified = true

**Access:**
- UI: Settings Page → Demo Data Management
- API: `/api/core/seed` (POST/DELETE/GET)

**Features:**
- Idempotent seeding
- Status checking
- One-click clear
- Hierarchical tenants
- Role-based users
- Production-ready structure
