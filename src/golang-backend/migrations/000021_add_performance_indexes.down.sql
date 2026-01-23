-- Drop performance indexes

DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_status;
DROP INDEX IF EXISTS idx_users_created_at;

DROP INDEX IF EXISTS idx_tenants_owner;
DROP INDEX IF EXISTS idx_tenants_code;
DROP INDEX IF EXISTS idx_tenants_is_active;

DROP INDEX IF EXISTS idx_tenant_members_tenant;
DROP INDEX IF EXISTS idx_tenant_members_user;
DROP INDEX IF EXISTS idx_tenant_members_status;
DROP INDEX IF EXISTS idx_tenant_members_is_active;

DROP INDEX IF EXISTS idx_departments_tenant;
DROP INDEX IF EXISTS idx_departments_parent;
DROP INDEX IF EXISTS idx_departments_manager;
DROP INDEX IF EXISTS idx_departments_code;

DROP INDEX IF EXISTS idx_roles_tenant;
DROP INDEX IF EXISTS idx_roles_code;
DROP INDEX IF EXISTS idx_roles_is_active;

DROP INDEX IF EXISTS idx_permissions_resource;
DROP INDEX IF EXISTS idx_permissions_action;
DROP INDEX IF EXISTS idx_permissions_code;

DROP INDEX IF EXISTS idx_webhooks_tenant;
DROP INDEX IF EXISTS idx_webhooks_is_active;

DROP INDEX IF EXISTS idx_applications_code;
DROP INDEX IF EXISTS idx_applications_is_active;

DROP INDEX IF EXISTS idx_locations_tenant;
DROP INDEX IF EXISTS idx_locations_parent;
DROP INDEX IF EXISTS idx_locations_type;

DROP INDEX IF EXISTS idx_tenant_members_lookup;
DROP INDEX IF EXISTS idx_departments_hierarchy;
DROP INDEX IF EXISTS idx_user_roles_lookup;
