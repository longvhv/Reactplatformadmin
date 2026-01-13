# User Sessions - Quick Setup

## ✅ Đã Hoàn Thành

### 1. Database Table
- **File**: `/user-sessions-migration.sql`  
- **Bảng**: `user_sessions` (GLOBAL table - no tenant_id)
- **Fields**: session_token, IP, device info, browser info, location, status, login_method, MFA status
- **Demo data**: 10 sessions across 5 users

### 2. Backend API  
- **File**: `/supabase/functions/server/user-sessions-api.tsx`
- **Endpoints**:
  - `GET /user-sessions` - List với filters
  - `GET /user-sessions/:id` - Chi tiết
  - `POST /user-sessions` - Tạo mới
  - `PATCH /user-sessions/:id` - Update
  - `DELETE /user-sessions/:id` - Revoke
  - `POST /user-sessions/:id/logout` - Logout
  - `POST /user-sessions/revoke-all` - Revoke tất cả sessions của user

### 3. Demo Data
- **10 sessions** cho 5 users (admin, john, mike, emma, david)
- Mix devices: Desktop, Mobile, Tablet
- Mix OS: macOS, Windows, Linux, iOS, Android
- Mix browsers: Chrome, Safari, Edge, Firefox
- Mix status: ACTIVE, LOGGED_OUT, EXPIRED, REVOKED
- Mix login methods: PASSWORD, SSO, OAUTH, MFA, BIOMETRIC

## 🚀 Cách Sử Dụng

### Step 1: Run Migration
```sql
-- Copy /user-sessions-migration.sql vào Supabase SQL Editor
-- Execute để tạo bảng
```

### Step 2: Seed Data
```bash
# Call seed API (sẽ tự động seed sessions)
POST /api/core/seed
```

### Step 3: Test API
```bash
# Get sessions of a user
GET /api/core/user-sessions?user_id=xxx

# Logout a session
POST /api/core/user-sessions/{id}/logout

# Revoke all sessions except current
POST /api/core/user-sessions/revoke-all
{
  "user_id": "xxx",
  "except_session_id": "yyy"
}
```

## 📊 Demo Sessions

| User | Devices | Status | Details |
|------|---------|--------|---------|
| admin@vhvplatform.com | MacBook Pro, iPhone 15 | 2 ACTIVE | Vietnam locations |
| john.doe@techcorp.com | Dell XPS, iPad, Samsung | 2 ACTIVE, 1 LOGGED_OUT | USA locations |
| mike.wilson@techcorp.com | MacBook Air, Ubuntu | 1 ACTIVE, 1 EXPIRED | SF locations |
| emma.brown@techcorp.com | iPhone 14, HP Pavilion | 1 ACTIVE, 1 REVOKED | SF/Seattle |
| david.smith@eduinstitute.edu | ThinkPad | 1 ACTIVE | London |

## 🔐 Security Features

- Session tokens: Unique `sess_{uuid}_{timestamp}`
- Expiration: 30 days default
- IP tracking & Geolocation (country, city)
- Device fingerprinting (type, name, OS, browser)
- MFA verification tracking
- Trusted device marking
- Optimistic locking (version field)
- Soft delete support

## 📝 Next: UI Implementation

Cần tạo UI component để hiển thị sessions trong user detail page - coming next!
