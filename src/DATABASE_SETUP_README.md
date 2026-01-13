# Database Setup & Seed Data Guide

## Overview

Tài liệu này hướng dẫn cách tạo và populate dữ liệu test cho 3 bảng mới:
- `user_linked_identities` - OAuth/Social login connections
- `user_mfa_methods` - Multi-factor authentication methods
- `tenant_sso_configs` - Tenant SSO configurations

## Architecture

### Database Schema Standards (go-framework)

Tất cả bảng tuân thủ các quy tắc sau:

1. **Primary Key**: `_id` (UUID)
2. **Naming Convention**: snake_case
3. **Table Types**:
   - **GLOBAL tables**: Không có `tenant_id` (user_linked_identities, user_mfa_methods)
   - **TENANT-SPECIFIC tables**: Có `tenant_id` (tenant_sso_configs)
4. **Audit Trail**: 
   - `created_at`, `updated_at`
   - `created_by`, `updated_by`
5. **Soft Delete**: 
   - `deleted_at`, `deleted_by`
6. **Optimistic Locking**: 
   - `version` (integer, auto-increment on update)

## Step 1: Tạo Tables

### Option A: Sử dụng Supabase SQL Editor (Recommended)

1. Truy cập Supabase Dashboard
2. Vào **SQL Editor**
3. Tạo new query
4. Copy nội dung file `/database-migrations.sql`
5. Execute query

### Option B: Sử dụng psql CLI

```bash
# Connect to your database
psql -h <your-supabase-host> -U postgres -d postgres

# Run migration file
\i database-migrations.sql
```

### Verify Tables Created

```sql
-- Check tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name IN ('user_linked_identities', 'user_mfa_methods', 'tenant_sso_configs');

-- Check columns
\d user_linked_identities
\d user_mfa_methods
\d tenant_sso_configs
```

## Step 2: Seed Demo Data

### API Endpoint

Seed data được thực hiện thông qua API endpoint:

```
POST /make-server-7eedb4e0/api/core/seed
```

### Seed Data Content

#### 1. User Linked Identities (7 records)

Liên kết OAuth/Social login cho users:

- **admin@vhvplatform.com**: Google + GitHub
- **john.doe@techcorp.com**: Microsoft + LinkedIn  
- **mike.wilson@techcorp.com**: GitHub
- **emma.brown@techcorp.com**: Google
- **david.smith@eduinstitute.edu**: Microsoft

**Providers supported**: GOOGLE, FACEBOOK, GITHUB, GITLAB, BITBUCKET, LINKEDIN, TWITTER, MICROSOFT, APPLE, SLACK, DISCORD, OKTA, AUTH0, SAML, LDAP

#### 2. User MFA Methods (10 records)

Multi-factor authentication cho users:

- **admin@vhvplatform.com**: 
  - TOTP (Google Authenticator) - Primary, Enforced
  - SMS (+84-28-1234-5678)
  - BACKUP_CODES (10 codes, 2 used)
  
- **john.doe@techcorp.com**: 
  - TOTP (Microsoft Authenticator) - Primary, Enforced
  - WEBAUTHN (YubiKey 5 NFC)
  
- **mike.wilson@techcorp.com**: 
  - TOTP (Authy)
  
- **emma.brown@techcorp.com**: 
  - SMS (+1-415-555-0111) - Primary, Enforced
  - EMAIL (emma.brown@techcorp.com)
  
- **david.smith@eduinstitute.edu**: 
  - TOTP (Google Authenticator) - Primary, Enforced
  - BACKUP_CODES (10 codes, 0 used)

**Method types supported**: TOTP, SMS, EMAIL, WEBAUTHN, BACKUP_CODES, PUSH_NOTIFICATION, BIOMETRIC, HARDWARE_TOKEN

#### 3. Tenant SSO Configs (5 records)

SSO configurations cho tenants:

- **tech-corp**: 
  - Microsoft Azure AD SSO (OIDC)
  - Okta SAML 2.0
  
- **edu-institute**: 
  - Google Workspace SSO (OIDC)
  
- **health-care**: 
  - Auth0 Enterprise SSO (OIDC)
  
- **vhv-platform**: 
  - GitHub OAuth (OAUTH2)

**Providers supported**: SAML, OAUTH2, OIDC, LDAP, CAS

### Execute Seeding

#### Option A: Using curl

```bash
# Seed all data
curl -X POST \
  https://<project-id>.supabase.co/functions/v1/make-server-7eedb4e0/api/core/seed \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json"
```

#### Option B: Using Frontend (Recommended)

Trong app đã có sẵn seed button. Seed process sẽ tự động:

1. Seed Tenants (nếu chưa có)
2. Seed Users (nếu chưa có)
3. Seed Tenant Members (nếu chưa có)
4. Seed Linked Identities (mới)
5. Seed MFA Methods (mới)
6. Seed SSO Configs (mới)

### Check Seeding Status

```bash
# Check status
curl -X GET \
  https://<project-id>.supabase.co/functions/v1/make-server-7eedb4e0/api/core/seed/status \
  -H "Authorization: Bearer <anon-key>"
```

Response:
```json
{
  "status": {
    "tenants": {
      "existing": 7,
      "expected": 7,
      "seeded": true
    },
    "users": {
      "existing": 6,
      "expected": 6,
      "seeded": true
    }
  }
}
```

### Clear Demo Data

```bash
# Delete all seeded data
curl -X DELETE \
  https://<project-id>.supabase.co/functions/v1/make-server-7eedb4e0/api/core/seed \
  -H "Authorization: Bearer <anon-key>"
```

## Step 3: Verify Data

### SQL Queries

```sql
-- Count records
SELECT 'user_linked_identities' as table_name, COUNT(*) as count FROM user_linked_identities WHERE deleted_at IS NULL
UNION ALL
SELECT 'user_mfa_methods', COUNT(*) FROM user_mfa_methods WHERE deleted_at IS NULL
UNION ALL
SELECT 'tenant_sso_configs', COUNT(*) FROM tenant_sso_configs WHERE deleted_at IS NULL;

-- View linked identities
SELECT 
  u.email,
  uli.provider,
  uli.provider_username,
  uli.is_primary,
  uli.is_verified,
  uli.last_used_at
FROM user_linked_identities uli
JOIN users u ON u._id = uli.user_id
WHERE uli.deleted_at IS NULL
ORDER BY u.email, uli.is_primary DESC;

-- View MFA methods
SELECT 
  u.email,
  umm.method_type,
  umm.method_name,
  umm.is_primary,
  umm.is_enforced,
  umm.success_count,
  umm.failure_count
FROM user_mfa_methods umm
JOIN users u ON u._id = umm.user_id
WHERE umm.deleted_at IS NULL
ORDER BY u.email, umm.is_primary DESC;

-- View SSO configs
SELECT 
  t.name as tenant_name,
  tsc.provider,
  tsc.name as config_name,
  tsc.status,
  tsc.created_at
FROM tenant_sso_configs tsc
JOIN tenants t ON t._id = tsc.tenant_id
WHERE tsc.deleted_at IS NULL
ORDER BY t.name, tsc.provider;
```

### API Queries

```bash
# Get linked identities for a user
curl -X GET \
  "https://<project-id>.supabase.co/functions/v1/make-server-7eedb4e0/api/core/user-linked-identities?user_id=<user-id>" \
  -H "Authorization: Bearer <anon-key>"

# Get MFA methods for a user
curl -X GET \
  "https://<project-id>.supabase.co/functions/v1/make-server-7eedb4e0/api/core/user-mfa-methods?user_id=<user-id>" \
  -H "Authorization: Bearer <anon-key>"

# Get SSO configs for a tenant
curl -X GET \
  "https://<project-id>.supabase.co/functions/v1/make-server-7eedb4e0/api/core/tenant-sso-configs?tenant_id=<tenant-id>" \
  -H "Authorization: Bearer <anon-key>"
```

## API Endpoints Reference

### User Linked Identities

```
GET    /user-linked-identities                  - List all
GET    /user-linked-identities/:id              - Get by ID
POST   /user-linked-identities                  - Create new
PATCH  /user-linked-identities/:id              - Update
DELETE /user-linked-identities/:id              - Soft delete
```

Query params:
- `user_id` - Filter by user
- `provider` - Filter by provider (GOOGLE, GITHUB, etc.)
- `status` - Filter by status (ACTIVE, INACTIVE, etc.)
- `is_primary` - Filter primary identities

### User MFA Methods

```
GET    /user-mfa-methods                        - List all
GET    /user-mfa-methods/:id                    - Get by ID
POST   /user-mfa-methods                        - Create new
PATCH  /user-mfa-methods/:id                    - Update
DELETE /user-mfa-methods/:id                    - Soft delete
```

Query params:
- `user_id` - Filter by user
- `method_type` - Filter by type (TOTP, SMS, EMAIL, etc.)
- `status` - Filter by status
- `is_verified` - Filter verified methods

### Tenant SSO Configs

```
GET    /tenant-sso-configs                      - List all
GET    /tenant-sso-configs/:id                  - Get by ID
POST   /tenant-sso-configs                      - Create new
PATCH  /tenant-sso-configs/:id                  - Update
DELETE /tenant-sso-configs/:id                  - Soft delete
POST   /tenant-sso-configs/:id/test             - Test config
```

Query params:
- `tenant_id` - Filter by tenant
- `provider` - Filter by provider (SAML, OIDC, OAUTH2, etc.)
- `status` - Filter by status
- `limit` & `offset` - Pagination

## Troubleshooting

### Error: Table does not exist

Nếu gặp lỗi "table does not exist":

1. Verify tables đã được tạo:
   ```sql
   \dt user_linked_identities
   \dt user_mfa_methods
   \dt tenant_sso_configs
   ```

2. Chạy lại migration SQL trong Supabase SQL Editor

3. Kiểm tra permissions:
   ```sql
   GRANT ALL ON user_linked_identities TO service_role;
   GRANT ALL ON user_mfa_methods TO service_role;
   GRANT ALL ON tenant_sso_configs TO service_role;
   ```

### Error: Constraint violation

Nếu gặp lỗi constraint:

1. Clear existing data:
   ```sql
   DELETE FROM user_linked_identities;
   DELETE FROM user_mfa_methods;
   DELETE FROM tenant_sso_configs;
   ```

2. Re-run seed

### Seed returns empty arrays

Điều này là bình thường nếu:
- Tables chưa được tạo
- Seed data đã tồn tại (skipped duplicates)

Check seed status để xác nhận.

## Production Considerations

### Security

1. **Sensitive Fields**: 
   - `client_secret` trong SSO configs phải được encrypt
   - `totp_secret_encrypted` trong MFA methods phải được encrypt
   - API không trả về các field này

2. **Permissions**:
   - Chỉ admins mới có thể tạo/sửa SSO configs
   - Users chỉ có thể xem/quản lý MFA methods của chính họ
   - Linked identities chỉ được access bởi user owner

3. **Rate Limiting**:
   - Implement rate limiting cho MFA verification endpoints
   - Limit số lần thử MFA sai

### Monitoring

1. **Track Usage**:
   - Monitor `success_count` và `failure_count` trong MFA methods
   - Monitor `last_used_at` để detect inactive methods

2. **Audit Trail**:
   - Log tất cả SSO config changes
   - Track MFA method additions/removals
   - Alert on suspicious linked identity additions

### Backup

```sql
-- Backup tables
pg_dump -t user_linked_identities -t user_mfa_methods -t tenant_sso_configs > auth_tables_backup.sql

-- Restore
psql < auth_tables_backup.sql
```

## Next Steps

1. ✅ Create database tables
2. ✅ Seed demo data  
3. 🔲 Build UI components to display this data
4. 🔲 Implement authentication flows using SSO configs
5. 🔲 Add MFA verification logic
6. 🔲 Build identity linking UI

## Support

Nếu gặp vấn đề, check:
1. Server logs: Supabase Edge Functions logs
2. Database logs: Supabase Database logs
3. Browser console: Frontend errors

## References

- Go-Framework Standards: [vhvplatform/go-framework](https://github.com/vhvplatform/go-framework)
- Supabase Docs: https://supabase.com/docs
- Database Migration Best Practices: https://supabase.com/docs/guides/database/migrations
