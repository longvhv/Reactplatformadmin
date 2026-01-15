# Tenants Use Cases

## Overview
Tài liệu mô tả các use cases (ca sử dụng) cho module Tenants trong hệ thống SaaS

---

## UC-1: Đăng ký Tenant mới (Tenant Onboarding)

### Actors
- **Primary:** Khách hàng mới (New Customer)
- **Secondary:** Hệ thống

### Preconditions
- Khách hàng có email hợp lệ
- Code (subdomain) chưa được sử dụng

### Flow
1. Khách hàng truy cập trang đăng ký
2. Nhập thông tin:
   - Company name
   - Subdomain (code)
   - Email
   - Password
3. Hệ thống validate:
   - Code format: `^[a-z0-9-]+$`
   - Code không trùng
   - Email hợp lệ
4. Hệ thống tạo:
   - Tenant với status = TRIAL, tier = FREE
   - User account
   - Tenant member (link user + tenant)
   - Default settings
5. Gửi email xác nhận
6. Redirect đến dashboard

### API Calls
```bash
# 1. Create Tenant
POST /api/v1/tenants
{
  "code": "acme-corp",
  "name": "ACME Corporation",
  "tier": "FREE",
  "status": "TRIAL"
}

# 2. Create User (if not exists)
POST /api/v1/users
{
  "email": "admin@acme.com",
  "full_name": "John Doe",
  "password": "hashed"
}

# 3. Create Tenant Member
POST /api/v1/tenant-members
{
  "tenant_id": "tenant-id",
  "user_id": "user-id",
  "status": "ACTIVE"
}
```

### Postconditions
- Tenant created với status = TRIAL
- Trial period = 14 days
- Default quota applied
- Welcome email sent

### Alternative Flows
- **1a.** Code already exists → Show error "Subdomain already taken"
- **2a.** Email already exists → Ask to login
- **3a.** Payment required → Redirect to payment page

---

## UC-2: Nâng cấp Tenant (Tier Upgrade)

### Actors
- **Primary:** Tenant Admin
- **Secondary:** Billing System

### Preconditions
- User có quyền admin trong tenant
- Tenant status = ACTIVE hoặc TRIAL

### Flow
1. Admin truy cập Billing page
2. Chọn tier mới (PRO hoặc ENTERPRISE)
3. Xem thông tin giá cả và tính năng
4. Xác nhận nâng cấp
5. Hệ thống:
   - Tạo subscription order
   - Xử lý payment
   - Update tenant.tier
   - Update quota và features
   - Gửi invoice
6. Hiển thị thông báo thành công

### API Calls
```bash
# 1. Get Current Tenant
GET /api/v1/tenants/{tenant_id}

# 2. Create Subscription Order
POST /api/v1/subscription-orders
{
  "tenant_id": "tenant-id",
  "package_id": "pro-monthly",
  "billing_cycle": "MONTHLY"
}

# 3. Update Tenant Tier
PATCH /api/v1/tenants/{tenant_id}
{
  "tier": "PRO",
  "status": "ACTIVE"
}

# 4. Update Settings (Unlock Features)
PATCH /api/v1/tenants/{tenant_id}
{
  "settings": {
    "features": {
      "api_access": true,
      "webhooks": true,
      "custom_domain": true
    },
    "quotas": {
      "users": 100,
      "storage_gb": 100
    }
  }
}
```

### Postconditions
- Tenant.tier updated
- New features unlocked
- Invoice generated
- Notification sent

### Alternative Flows
- **4a.** Payment failed → Retry or cancel
- **4b.** Downgrade → Show confirmation dialog

---

## UC-3: Tạm dừng Tenant do không thanh toán

### Actors
- **Primary:** Billing System (Automated)
- **Secondary:** Tenant Admin

### Preconditions
- Tenant có hóa đơn quá hạn > 7 days
- Billing type = POSTPAID

### Flow
1. Cron job chạy hàng ngày
2. Query tenants với:
   - Outstanding invoices > 7 days
   - Status = ACTIVE
3. Với mỗi tenant:
   - Update status = SUSPENDED
   - Gửi email cảnh báo
   - Disable API access
   - Show banner trong app
4. Admin nhận email
5. Admin thanh toán
6. Hệ thống tự động activate lại

### API Calls
```bash
# 1. Find Tenants with Overdue Invoices
GET /api/v1/subscription-invoices?status=OVERDUE&days_overdue=7

# 2. Suspend Tenant
PATCH /api/v1/tenants/{tenant_id}/status
{
  "status": "SUSPENDED"
}

# 3. Update Settings (Disable Features)
PATCH /api/v1/tenants/{tenant_id}
{
  "settings": {
    "features": {
      "api_access": false,
      "webhooks": false
    }
  }
}

# 4. After Payment
PATCH /api/v1/tenants/{tenant_id}/status
{
  "status": "ACTIVE"
}
```

### Postconditions
- Tenant status = SUSPENDED
- Users can view but not modify data
- API returns 403 Forbidden
- Email sent to admin

---

## UC-4: Thiết lập Partner Reseller

### Actors
- **Primary:** Platform Admin
- **Secondary:** Partner

### Preconditions
- Partner đã ký hợp đồng
- Partner cung cấp thông tin công ty

### Flow
1. Platform admin tạo Partner tenant
2. Set tier = PARTNER_ELITE/PREMIUM/BASIC
3. Set parent_tenant_id = provider-id
4. Configure commission rate trong settings
5. Partner login và tạo customer tenants
6. Customer tenants có parent_tenant_id = partner-id
7. Platform tính commission cho partner

### API Calls
```bash
# 1. Create Partner Tenant
POST /api/v1/tenants
{
  "code": "partner-abc",
  "name": "Partner ABC Solutions",
  "tier": "PARTNER_ELITE",
  "parent_tenant_id": "provider-id",
  "settings": {
    "commission": {
      "rate": 0.20,
      "type": "REVENUE_SHARE"
    }
  }
}

# 2. Partner Creates Customer Tenant
POST /api/v1/tenants
{
  "code": "customer-xyz",
  "name": "Customer XYZ",
  "tier": "PRO",
  "parent_tenant_id": "partner-abc-id"
}

# 3. Calculate Commission (Monthly Cron)
GET /api/v1/tenants?parent_tenant_id=partner-abc-id
# For each customer:
#   - Get total revenue
#   - Calculate commission = revenue * 0.20
#   - Create payout record
```

### Postconditions
- Partner tenant created
- Hierarchy established
- Commission tracked
- Partner has access to sub-tenants

---

## UC-5: Migrate Tenant to Different Region

### Actors
- **Primary:** Platform Admin
- **Secondary:** Tenant Admin

### Preconditions
- Tenant requests data migration (GDPR compliance)
- Target region has capacity

### Flow
1. Tenant admin requests migration
2. Platform admin reviews request
3. Schedule maintenance window
4. Backup tenant data:
   - Tenant record
   - All related data (members, settings)
5. Create new tenant in target region
6. Migrate data
7. Update tenant.data_region
8. Update DNS/routing
9. Verify data integrity
10. Decommission old data

### API Calls
```bash
# 1. Get Full Tenant Data
GET /api/v1/tenants/{tenant_id}
GET /api/v1/tenant-members?tenant_id={tenant_id}
GET /api/v1/departments?tenant_id={tenant_id}

# 2. Backup to S3
aws s3 cp tenant_backup.json s3://backups/

# 3. Update Data Region
PATCH /api/v1/tenants/{tenant_id}
{
  "data_region": "eu-central-1",
  "settings": {
    "migration": {
      "from": "ap-southeast-1",
      "to": "eu-central-1",
      "date": "2024-01-15",
      "verified": true
    }
  }
}

# 4. Update Routing Config
# Update load balancer / DNS to point to new region
```

### Postconditions
- Tenant data in new region
- data_region updated
- Routing updated
- Old data deleted (after retention period)

---

## UC-6: Configure Compliance Settings

### Actors
- **Primary:** Tenant Admin
- **Secondary:** Compliance Officer

### Preconditions
- Tenant tier = ENTERPRISE
- Admin has compliance.manage permission

### Flow
1. Admin navigates to Compliance Settings
2. Select compliance level:
   - GDPR (EU)
   - HIPAA (Healthcare, US)
   - PCI-DSS (Payment)
3. System shows required configurations:
   - Data encryption
   - Access logs
   - Data retention policies
4. Admin configures each requirement
5. System validates configuration
6. System generates compliance report
7. Admin downloads audit certificate

### API Calls
```bash
# 1. Update Compliance Level
PATCH /api/v1/tenants/{tenant_id}
{
  "compliance_level": "GDPR",
  "settings": {
    "compliance": {
      "gdpr": {
        "data_retention_days": 365,
        "right_to_erasure": true,
        "consent_required": true,
        "dpo_email": "dpo@acme.com"
      },
      "encryption": {
        "at_rest": true,
        "in_transit": true
      },
      "audit_logs": {
        "enabled": true,
        "retention_days": 730
      }
    }
  }
}

# 2. Generate Compliance Report
GET /api/v1/tenants/{tenant_id}/compliance-report
```

### Postconditions
- Compliance level updated
- Audit logging enabled
- Data retention policies active
- Compliance certificate issued

---

## UC-7: Multi-Tenant User Access

### Actors
- **Primary:** User (belongs to multiple tenants)

### Preconditions
- User account exists
- User is member of multiple tenants

### Flow
1. User logs in với email
2. System queries tenant_members
3. Found multiple tenants
4. Show tenant selector
5. User selects tenant
6. System sets tenant context
7. User sees tenant-specific data
8. User can switch tenant anytime

### API Calls
```bash
# 1. Login
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "hashed"
}

# 2. Get User's Tenants
GET /api/v1/tenant-members?user_id={user_id}
# Returns:
[
  {"tenant_id": "A", "tenant_name": "ACME", "tenant_code": "acme"},
  {"tenant_id": "B", "tenant_name": "Startup", "tenant_code": "startup"}
]

# 3. Select Tenant
POST /api/v1/auth/switch-tenant
{
  "tenant_id": "A"
}
# Sets session.current_tenant_id = "A"

# 4. All Subsequent Requests Filter by Tenant
GET /api/v1/users?tenant_id={current_tenant_id}
```

### Postconditions
- User authenticated
- Tenant context set
- All queries scoped to tenant
- User can switch tenant

---

## UC-8: Tenant Settings Management

### Actors
- **Primary:** Tenant Admin

### Preconditions
- User has admin role
- Tenant status = ACTIVE

### Flow
1. Admin opens Settings page
2. Modify settings:
   - **Security:** MFA, password policy, IP whitelist
   - **Features:** Enable/disable features based on tier
   - **Notifications:** Email, Slack, webhooks
   - **Branding:** Logo, colors, company name
3. Click Save
4. System validates settings
5. System updates tenant.settings (JSONB)
6. Apply settings immediately

### API Calls
```bash
PATCH /api/v1/tenants/{tenant_id}
{
  "settings": {
    "security": {
      "mfa_required": true,
      "password_policy": {
        "min_length": 12,
        "require_uppercase": true,
        "require_number": true,
        "require_special": true
      },
      "session_timeout": 3600,
      "ip_whitelist": ["1.2.3.4"]
    },
    "features": {
      "api_access": true,
      "webhooks": true,
      "sso": false,
      "custom_domain": false
    },
    "notifications": {
      "email": true,
      "slack": true,
      "slack_webhook": "https://hooks.slack.com/..."
    },
    "branding": {
      "logo_url": "https://cdn.acme.com/logo.png",
      "primary_color": "#6366f1",
      "company_name": "ACME Corp"
    }
  }
}
```

### Postconditions
- Settings saved in JSONB
- Changes applied immediately
- Audit log created

---

## UC-9: Tenant Cancellation

### Actors
- **Primary:** Tenant Admin
- **Secondary:** Support Team

### Preconditions
- Tenant status = ACTIVE or SUSPENDED
- Admin confirms cancellation

### Flow
1. Admin navigates to Billing
2. Click "Cancel Subscription"
3. System shows confirmation dialog:
   - Data will be deleted in 30 days
   - Export data option
4. Admin confirms
5. System:
   - Update status = CANCELLED
   - Schedule data deletion (30 days)
   - Send confirmation email
   - Generate final invoice
6. After 30 days:
   - Soft delete tenant (set deleted_at)
   - Archive data to cold storage
7. After 90 days:
   - Hard delete data (GDPR compliance)

### API Calls
```bash
# 1. Cancel Tenant
PATCH /api/v1/tenants/{tenant_id}/status
{
  "status": "CANCELLED"
}

# 2. Schedule Deletion (Background Job)
POST /api/v1/tenants/{tenant_id}/schedule-deletion
{
  "delete_after_days": 30
}

# 3. Export Data (Optional)
GET /api/v1/tenants/{tenant_id}/export

# 4. Soft Delete (After 30 days)
DELETE /api/v1/tenants/{tenant_id}
# Sets deleted_at = NOW()

# 5. Hard Delete (After 90 days - Manual)
# Permanently remove from database
```

### Postconditions
- Status = CANCELLED
- Data retention scheduled
- Final invoice sent
- Goodbye email sent

---

## UC-10: Tenant Analytics Dashboard

### Actors
- **Primary:** Platform Admin

### Preconditions
- Admin has platform-wide access

### Flow
1. Admin opens Admin Dashboard
2. View analytics:
   - Total tenants by tier
   - Active vs trial vs cancelled
   - Revenue by region
   - Growth trends
3. Filter by:
   - Date range
   - Region
   - Tier
   - Status
4. Export report

### API Calls
```bash
# 1. Count Tenants by Tier
GET /api/v1/tenants/stats/by-tier
# Response:
{
  "FREE": 1000,
  "PRO": 200,
  "ENTERPRISE": 50,
  "PARTNER_ELITE": 10
}

# 2. Count by Status
GET /api/v1/tenants/stats/by-status
# Response:
{
  "TRIAL": 300,
  "ACTIVE": 900,
  "SUSPENDED": 50,
  "CANCELLED": 10
}

# 3. Revenue by Region
GET /api/v1/tenants/stats/revenue?group_by=region
# Response:
{
  "ap-southeast-1": 150000,
  "us-east-1": 300000,
  "eu-central-1": 100000
}

# 4. Growth Trend (Last 12 months)
GET /api/v1/tenants/stats/growth?period=12m
```

### Postconditions
- Analytics displayed
- Charts rendered
- Report exported

---

## Summary Table

| Use Case | Frequency | Complexity | Priority |
|----------|-----------|------------|----------|
| UC-1: Tenant Onboarding | Daily | Medium | High |
| UC-2: Tier Upgrade | Weekly | Medium | High |
| UC-3: Suspend for Non-Payment | Daily (Automated) | Low | High |
| UC-4: Partner Reseller Setup | Monthly | High | Medium |
| UC-5: Region Migration | Rare | Very High | Low |
| UC-6: Compliance Configuration | Rare | High | Medium |
| UC-7: Multi-Tenant User Access | Daily | Medium | High |
| UC-8: Settings Management | Weekly | Low | Medium |
| UC-9: Tenant Cancellation | Monthly | Medium | Medium |
| UC-10: Analytics Dashboard | Daily | Low | High |

---

## Integration Points

### External Systems
- **Payment Gateway:** Stripe, PayPal
- **Email Service:** SendGrid, AWS SES
- **Analytics:** Google Analytics, Mixpanel
- **Monitoring:** Sentry, DataDog
- **Storage:** AWS S3, Google Cloud Storage

### Internal Modules
- Users & Authentication
- Billing & Subscriptions
- Permissions & Roles
- Audit Logs
- Webhooks
