# 🗄️ Complete Database Schema & ERD

**Version:** 1.0.0  
**Last Updated:** January 14, 2026  
**Database:** PostgreSQL 14+  
**Primary Key:** `_id UUID`

---

## 📋 Table of Contents

1. [Entity Relationship Diagram (ERD)](#entity-relationship-diagram)
2. [Core Tables](#core-tables)
3. [Table Schemas](#table-schemas)
4. [Indexes & Performance](#indexes--performance)
5. [Relationships](#relationships)
6. [Data Types](#data-types)

---

## 🎨 Entity Relationship Diagram

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│    TENANTS      │◄────────│     USERS       │────────►│     ROLES       │
│                 │ 1     * │                 │ *     * │                 │
│ _id (PK)        │         │ _id (PK)        │         │ _id (PK)        │
│ name            │         │ email           │         │ name            │
│ slug (UNIQUE)   │         │ name            │         │ code            │
│ email           │         │ tenant_id (FK)  │         │ permissions[]   │
│ status          │         │ role_id (FK)    │         │ tenant_id (FK)  │
│ metadata        │         │ status          │         │                 │
└────────┬────────┘         └─────────────────┘         └─────────────────┘
         │                                                        
         │ 1                                                      
         │                                                        
         │ *                                                      
┌────────▼────────┐         ┌─────────────────┐         ┌─────────────────┐
│ SUBSCRIPTIONS   │────────►│ PACKAGES        │         │  APPLICATIONS   │
│                 │ *     1 │                 │         │                 │
│ _id (PK)        │         │ _id (PK)        │         │ _id (PK)        │
│ tenant_id (FK)  │         │ name            │         │ name            │
│ package_id (FK) │         │ code            │         │ code            │
│ status          │         │ price           │         │ description     │
│ start_date      │         │ billing_cycle   │         │ icon_url        │
│ end_date        │         │ features (JSON) │         │ status          │
│ auto_renew      │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └────────┬────────┘
                                                                  │
                                                                  │ 1
         ┌────────────────┐         ┌─────────────────┐          │
         │    ORDERS      │         │  RATE_LIMITS    │          │ *
         │                │         │                 │  ┌───────▼─────────┐
         │ _id (PK)       │         │ _id (PK)        │  │  APP_ROUTES     │
         │ tenant_id (FK) │         │ tenant_id (FK)  │  │                 │
         │ order_number   │         │ endpoint        │  │ _id (PK)        │
         │ total_amount   │         │ method          │  │ tenant_id (FK)  │
         │ status         │         │ limit           │  │ application_id  │
         │ payment_method │         │ window          │  │ path            │
         │                │         │ strategy        │  │ target_url      │
         └────────────────┘         │ enabled         │  │ enabled         │
                                    │                 │  │ priority        │
         ┌────────────────┐         └─────────────────┘  └─────────────────┘
         │ ANNOUNCEMENTS  │                               
         │                │         ┌─────────────────┐
         │ _id (PK)       │         │  AUDIT_LOGS     │
         │ title          │         │                 │
         │ content        │         │ _id (PK)        │
         │ priority       │         │ user_id (FK)    │
         │ status         │         │ tenant_id (FK)  │
         │ start_date     │         │ action          │
         │ end_date       │         │ entity_type     │
         │                │         │ entity_id       │
         └────────────────┘         │ changes (JSON)  │
                                    │ ip_address      │
                                    │ user_agent      │
                                    └─────────────────┘
```

---

## 📊 Core Tables

| Table | Description | Rows (Est.) | Relations |
|-------|-------------|-------------|-----------|
| **tenants** | Multi-tenant organizations | 1K - 100K | → users, subscriptions, orders |
| **users** | Platform users | 10K - 1M | ← tenants, roles |
| **roles** | User roles & permissions | 100 - 10K | ← users |
| **applications** | Application definitions | 10 - 100 | → app_routes |
| **tenant_app_routes** | Tenant-specific routing | 100 - 10K | ← tenants, applications |
| **rate_limits** | API rate limiting rules | 100 - 10K | ← tenants |
| **service_packages** | Service package definitions | 10 - 100 | → subscriptions |
| **subscriptions** | Tenant subscriptions | 1K - 100K | ← tenants, packages |
| **orders** | Order history | 10K - 1M | ← tenants |
| **announcements** | System announcements | 100 - 1K | Global |
| **audit_logs** | Security audit trail | 100K - 10M | ← users, tenants |

---

## 📋 Table Schemas

### **1. TENANTS Table**

```sql
CREATE TABLE tenants (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  website VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- Indexes
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_created_at ON tenants(created_at);
CREATE INDEX idx_tenants_deleted_at ON tenants(deleted_at) WHERE deleted_at IS NULL;

-- Metadata example
-- {
--   "industry": "Technology",
--   "size": "50-200 employees",
--   "country": "US",
--   "timezone": "America/Los_Angeles"
-- }
```

**Columns:**
- `_id` - Primary key (UUID)
- `name` - Organization name
- `slug` - URL-friendly identifier (unique)
- `email` - Primary contact email
- `phone` - Contact phone number
- `address` - Physical address
- `website` - Organization website
- `status` - Tenant status (active, inactive, suspended)
- `metadata` - Additional JSON data
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `deleted_at` - Soft delete timestamp

---

### **2. USERS Table**

```sql
CREATE TABLE users (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(_id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  phone VARCHAR(50),
  role_id UUID REFERENCES roles(_id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  email_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE(tenant_id, email)
);

-- Indexes
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**Columns:**
- `_id` - Primary key (UUID)
- `tenant_id` - Foreign key to tenants (CASCADE delete)
- `email` - User email (unique per tenant)
- `password_hash` - Bcrypt hashed password
- `name` - Full name
- `avatar_url` - Profile picture URL
- `phone` - Phone number
- `role_id` - Foreign key to roles
- `status` - User status
- `email_verified` - Email verification status
- `last_login` - Last login timestamp
- `metadata` - Additional JSON data
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `deleted_at` - Soft delete timestamp

---

### **3. ROLES Table**

```sql
CREATE TABLE roles (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, code)
);

-- Indexes
CREATE INDEX idx_roles_tenant_id ON roles(tenant_id);
CREATE INDEX idx_roles_code ON roles(code);
CREATE INDEX idx_roles_is_system ON roles(is_system_role);

-- Permissions example
-- [
--   "users.read",
--   "users.write",
--   "tenants.manage",
--   "applications.read"
-- ]
```

**Columns:**
- `_id` - Primary key (UUID)
- `tenant_id` - Foreign key to tenants (NULL for system roles)
- `name` - Role display name
- `code` - Role code identifier
- `description` - Role description
- `permissions` - JSON array of permission strings
- `is_system_role` - System-defined role (cannot be deleted)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

---

### **4. APPLICATIONS Table**

```sql
CREATE TABLE applications (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  icon_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  version VARCHAR(20),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_applications_code ON applications(code);
CREATE INDEX idx_applications_status ON applications(status);
```

**Columns:**
- `_id` - Primary key (UUID)
- `name` - Application name
- `code` - Application code (unique)
- `description` - Application description
- `icon_url` - Application icon URL
- `status` - Application status
- `version` - Application version
- `metadata` - Additional JSON data
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

---

### **5. TENANT_APP_ROUTES Table**

```sql
CREATE TABLE tenant_app_routes (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(_id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(_id) ON DELETE CASCADE,
  path VARCHAR(500) NOT NULL,
  target_url VARCHAR(500) NOT NULL,
  method VARCHAR(10) DEFAULT 'ALL',
  enabled BOOLEAN DEFAULT TRUE,
  priority INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, application_id, path, method)
);

-- Indexes
CREATE INDEX idx_routes_tenant_id ON tenant_app_routes(tenant_id);
CREATE INDEX idx_routes_application_id ON tenant_app_routes(application_id);
CREATE INDEX idx_routes_enabled ON tenant_app_routes(enabled);
CREATE INDEX idx_routes_priority ON tenant_app_routes(priority);
```

---

### **6. RATE_LIMITS Table**

```sql
CREATE TABLE rate_limits (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(_id) ON DELETE CASCADE,
  endpoint VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  limit_count INT NOT NULL,
  window_seconds INT NOT NULL,
  strategy VARCHAR(50) DEFAULT 'sliding_window' CHECK (strategy IN ('fixed_window', 'sliding_window', 'token_bucket')),
  enabled BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, endpoint, method)
);

-- Indexes
CREATE INDEX idx_rate_limits_tenant_id ON rate_limits(tenant_id);
CREATE INDEX idx_rate_limits_endpoint ON rate_limits(endpoint);
CREATE INDEX idx_rate_limits_enabled ON rate_limits(enabled);
```

**Redis Integration:**
- Key pattern: `ratelimit:{tenant_id}:{endpoint}:{method}:{timestamp}`
- Stores request counts per window
- TTL matches window_seconds

---

### **7. SERVICE_PACKAGES Table**

```sql
CREATE TABLE service_packages (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'one-time')),
  features JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Features example
-- {
--   "max_users": 100,
--   "max_storage_gb": 100,
--   "api_rate_limit": 10000,
--   "support_level": "premium",
--   "custom_branding": true
-- }
```

---

### **8. SUBSCRIPTIONS Table**

```sql
CREATE TABLE subscriptions (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(_id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES service_packages(_id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
  start_date DATE NOT NULL,
  end_date DATE,
  trial_end_date DATE,
  auto_renew BOOLEAN DEFAULT TRUE,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_package_id ON subscriptions(package_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
```

---

### **9. ORDERS Table**

```sql
CREATE TABLE orders (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(_id) ON DELETE CASCADE,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
  payment_method VARCHAR(50),
  payment_intent_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

---

### **10. ANNOUNCEMENTS Table**

```sql
CREATE TABLE announcements (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  target_audience VARCHAR(50) DEFAULT 'all',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_priority ON announcements(priority);
CREATE INDEX idx_announcements_start_date ON announcements(start_date);
CREATE INDEX idx_announcements_end_date ON announcements(end_date);
```

---

### **11. AUDIT_LOGS Table**

```sql
CREATE TABLE audit_logs (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(_id),
  tenant_id UUID REFERENCES tenants(_id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  changes JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Partition by month for performance
CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

---

## 🔗 Relationships

### **One-to-Many**

```
tenants (1) ─── (N) users
tenants (1) ─── (N) subscriptions
tenants (1) ─── (N) orders
tenants (1) ─── (N) tenant_app_routes
tenants (1) ─── (N) rate_limits
tenants (1) ─── (N) roles
packages (1) ─── (N) subscriptions
applications (1) ─── (N) tenant_app_routes
```

### **Many-to-Many**

```
users (N) ─── (N) roles (via role_id)
tenants (N) ─── (N) applications (via tenant_app_routes)
```

---

## 📊 Data Types & Conventions

| Type | Usage | Example |
|------|-------|---------|
| **UUID** | Primary keys, foreign keys | `01934a2f-1111-2222-3333-444444444444` |
| **VARCHAR** | Text fields with limit | `name VARCHAR(255)` |
| **TEXT** | Unlimited text | `description TEXT` |
| **DECIMAL** | Money, prices | `price DECIMAL(10,2)` |
| **JSONB** | Flexible metadata | `{"key": "value"}` |
| **TIMESTAMP** | Dates with time | `2026-01-14T10:00:00Z` |
| **BOOLEAN** | True/false flags | `enabled BOOLEAN` |
| **INET** | IP addresses | `192.168.1.1` |

---

## 🚀 Performance Optimization

### **Indexes Created**

- Primary key indexes (automatic)
- Foreign key indexes
- Status/filter indexes
- Composite indexes for common queries
- Partial indexes (WHERE clauses)

### **Query Optimization**

```sql
-- Use prepared statements
PREPARE get_tenant_users AS
  SELECT * FROM users WHERE tenant_id = $1 AND status = 'active';

-- Use EXPLAIN ANALYZE
EXPLAIN ANALYZE SELECT * FROM users WHERE tenant_id = $1;

-- Partition large tables
CREATE TABLE audit_logs (...) PARTITION BY RANGE (created_at);
```

---

**Version:** 1.0.0  
**Last Updated:** January 14, 2026  
**Total Tables:** 11  
**Total Columns:** 150+
