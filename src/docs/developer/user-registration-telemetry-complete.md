# User Registration Telemetry Module - Complete Documentation

**Module Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Date:** January 15, 2026  
**Migration Status:** Ready for Golang API

---

## 📋 Module Overview

User Registration Telemetry Module cung cấp công cụ phân tích và theo dõi đăng ký người dùng thông qua bảng `telemetry.user_registration_logs`. Module này giúp theo dõi nguồn đăng ký, phân bố địa lý và các thống kê quan trọng.

### Key Features

✅ **CRUD Operations** - Quản lý đầy đủ registration logs  
✅ **Analytics Dashboard** - Thống kê theo nguồn, khu vực, thời gian  
✅ **Visual Charts** - Pie charts hiển thị phân bố dữ liệu  
✅ **Time-based Statistics** - Thống kê 24h, 7 ngày, 30 ngày  
✅ **Multi-language** - Hỗ trợ 6 ngôn ngữ (en, es, ja, ko, vi, zh)  
✅ **Supabase Ready** - Tích hợp sẵn với Supabase  
✅ **Golang Migration Ready** - Chuẩn bị migration API sang Golang

---

## 🗄️ Database Schema

### Table: `telemetry.user_registration_logs`

```sql
CREATE TABLE telemetry.user_registration_logs (
  _id uuid NOT NULL,
  tenant_id uuid NULL,
  user_id uuid NULL,
  registration_source text NULL,
  data_region text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_registration_logs_pkey PRIMARY KEY (_id)
) TABLESPACE pg_default;
```

### Fields Description

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | uuid | Yes | Primary key (UUID) |
| `tenant_id` | uuid | No | Tenant identifier |
| `user_id` | uuid | No | User identifier |
| `registration_source` | text | No | Registration source (web, mobile, api, oauth, etc.) |
| `data_region` | text | No | Data region (us-east-1, eu-west-1, etc.) |
| `created_at` | timestamp | Yes | Auto-generated timestamp |

### Common Registration Sources

- `web` - Web application
- `mobile` - Mobile application
- `api` - Direct API registration
- `oauth` - OAuth providers
- `google` - Google OAuth
- `facebook` - Facebook OAuth
- `github` - GitHub OAuth
- `email` - Email registration
- `sso` - Single Sign-On
- `admin` - Admin-created accounts
- `import` - Bulk import

### Common Data Regions

- `us-east-1` - US East (Virginia)
- `us-west-1` - US West (California)
- `eu-west-1` - EU West (Ireland)
- `eu-central-1` - EU Central (Frankfurt)
- `ap-southeast-1` - Asia Pacific Southeast (Singapore)
- `ap-northeast-1` - Asia Pacific Northeast (Tokyo)
- `ap-south-1` - Asia Pacific South (Mumbai)

---

## 📁 File Structure

```
/api
  └── userRegistrationLogsApi.ts          # API layer (410 lines)

/components/user-registration
  ├── RegistrationSourceBadge.tsx         # Source badge component
  ├── DataRegionBadge.tsx                 # Region badge component
  ├── UserRegistrationTable.tsx           # Table component
  └── UserRegistrationForm.tsx            # Form component

/pages
  ├── UserRegistrationTelemetryPage.tsx   # List page with analytics
  ├── AddUserRegistrationPage.tsx         # Add page
  ├── EditUserRegistrationPage.tsx        # Edit page
  └── UserRegistrationDetailPage.tsx      # Detail page

/modules/user-registration-telemetry
  └── index.tsx                           # Module definition

/i18n
  ├── en.ts                               # English translations
  ├── es.ts                               # Spanish translations
  ├── ja.ts                               # Japanese translations
  ├── ko.ts                               # Korean translations
  ├── vi.ts                               # Vietnamese translations
  └── zh.ts                               # Chinese translations
```

---

## 🔌 API Reference

### Base Endpoint
**Frontend:** `/core/user-registration-telemetry`  
**Future Golang:** `/api/v1/telemetry/user-registrations`

### API Functions

#### 1. Get All Registration Logs
```typescript
getUserRegistrationLogs(filters?: UserRegistrationFilters): Promise<UserRegistrationLog[]>
```

**Filters:**
```typescript
interface UserRegistrationFilters {
  search?: string;
  registration_source?: string;
  data_region?: string;
  tenant_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}
```

#### 2. Get Registration by ID
```typescript
getUserRegistrationLogById(id: string): Promise<UserRegistrationLog | null>
```

#### 3. Create Registration
```typescript
createUserRegistrationLog(data: UserRegistrationCreateData): Promise<UserRegistrationLog>
```

#### 4. Update Registration
```typescript
updateUserRegistrationLog(
  id: string, 
  data: UserRegistrationUpdateData
): Promise<UserRegistrationLog>
```

#### 5. Delete Registration
```typescript
deleteUserRegistrationLog(id: string): Promise<void>
```

#### 6. Get Statistics
```typescript
getUserRegistrationStats(filters?: {
  start_date?: string;
  end_date?: string;
  tenant_id?: string;
}): Promise<UserRegistrationStats>
```

**Response:**
```typescript
interface UserRegistrationStats {
  total: number;
  bySource: Record<string, number>;
  byRegion: Record<string, number>;
  byDate: Record<string, number>;
  recentRegistrations: number;
  last24Hours: number;
  last7Days: number;
  last30Days: number;
}
```

#### 7. Get Registration Sources
```typescript
getRegistrationSources(): Promise<string[]>
```

#### 8. Get Data Regions
```typescript
getDataRegions(): Promise<string[]>
```

#### 9. Get Registration Trend
```typescript
getRegistrationTrend(
  days: number = 30,
  filters?: {
    tenant_id?: string;
    registration_source?: string;
    data_region?: string;
  }
): Promise<{ date: string; count: number }[]>
```

---

## 🎨 Components

### 1. RegistrationSourceBadge

Displays registration source with color-coded styling.

```tsx
<RegistrationSourceBadge source="web" />
<RegistrationSourceBadge source="oauth" />
<RegistrationSourceBadge source="mobile" />
```

**Supported Sources:**
- web, mobile, api, oauth, google, facebook, github, email, sso, admin, import

### 2. DataRegionBadge

Displays data region with flag emojis.

```tsx
<DataRegionBadge region="us-east-1" />
<DataRegionBadge region="eu-west-1" />
<DataRegionBadge region="ap-southeast-1" />
```

**Supported Regions:**
- All AWS regions with appropriate flags (🇺🇸, 🇪🇺, 🌏, etc.)

### 3. UserRegistrationTable

Full-featured table with:
- Click to view details
- Edit/Delete actions
- Source and region badges
- Responsive design
- Dark mode support

```tsx
<UserRegistrationTable 
  logs={logs}
  loading={loading}
  onDelete={handleDelete}
/>
```

### 4. UserRegistrationForm

Form for creating/editing registrations with:
- Tenant ID input
- User ID input
- Source selector (with custom option)
- Region selector (with custom option)
- Validation

```tsx
<UserRegistrationForm 
  log={existingLog}
  onSubmit={handleSubmit}
  isLoading={isLoading}
/>
```

---

## 📊 Analytics Dashboard

### Statistics Cards

The main page displays 4 key metrics:
1. **Total Registrations** - All-time total
2. **Last 24 Hours** - Recent activity
3. **Last 7 Days** - Weekly trend
4. **Last 30 Days** - Monthly trend

### Charts

#### Registrations by Source (Pie Chart)
Visual breakdown of registration sources with percentages.

#### Registrations by Region (Pie Chart)
Geographic distribution of user registrations.

### Filters

- **Search** - Filter by IDs
- **Source Filter** - Filter by registration source
- **Region Filter** - Filter by data region

---

## 🌐 Internationalization

### Translation Keys

All module text uses the `userRegistration` namespace:

```typescript
t('userRegistration.menu')          // "Registration Telemetry"
t('userRegistration.title')         // "User Registration Analytics"
t('userRegistration.add')           // "Add Registration"
t('userRegistration.totalRegistrations')  // "Total Registrations"
```

### Supported Languages

| Language | Code | Status |
|----------|------|--------|
| English | en | ✅ Complete |
| Spanish | es | ✅ Complete |
| Japanese | ja | ✅ Complete |
| Korean | ko | ✅ Complete |
| Vietnamese | vi | ✅ Complete |
| Chinese | zh | ✅ Complete |

---

## 🚀 Usage Examples

### Example 1: Track New Registration

```typescript
import { createUserRegistrationLog } from '../api/userRegistrationLogsApi';

// Track user registration
await createUserRegistrationLog({
  tenant_id: '550e8400-e29b-41d4-a716-446655440000',
  user_id: '660e8400-e29b-41d4-a716-446655440001',
  registration_source: 'google',
  data_region: 'us-east-1',
});
```

### Example 2: Get Statistics

```typescript
import { getUserRegistrationStats } from '../api/userRegistrationLogsApi';

// Get overall statistics
const stats = await getUserRegistrationStats();
console.log(`Total registrations: ${stats.total}`);
console.log(`Last 24h: ${stats.last24Hours}`);
console.log(`Sources:`, stats.bySource);
```

### Example 3: Filter by Tenant

```typescript
import { getUserRegistrationLogs } from '../api/userRegistrationLogsApi';

// Get registrations for specific tenant
const logs = await getUserRegistrationLogs({
  tenant_id: '550e8400-e29b-41d4-a716-446655440000',
  limit: 50,
});
```

### Example 4: Analyze Trends

```typescript
import { getRegistrationTrend } from '../api/userRegistrationLogsApi';

// Get 30-day trend for mobile registrations
const trend = await getRegistrationTrend(30, {
  registration_source: 'mobile',
});

// Chart data ready
trend.forEach(({ date, count }) => {
  console.log(`${date}: ${count} registrations`);
});
```

---

## 🔄 Golang Migration Guide

### Current Architecture
```
Frontend → Supabase Client → PostgreSQL
```

### Future Architecture
```
Frontend → Golang API → PostgreSQL
```

### Migration Checklist

✅ **API Endpoints Ready**
- GET /api/v1/telemetry/user-registrations
- GET /api/v1/telemetry/user-registrations/:id
- POST /api/v1/telemetry/user-registrations
- PUT /api/v1/telemetry/user-registrations/:id
- DELETE /api/v1/telemetry/user-registrations/:id
- GET /api/v1/telemetry/user-registrations/stats
- GET /api/v1/telemetry/user-registrations/sources
- GET /api/v1/telemetry/user-registrations/regions
- GET /api/v1/telemetry/user-registrations/trend

✅ **Data Models Defined**
```go
type UserRegistrationLog struct {
    ID                 uuid.UUID  `json:"_id" db:"_id"`
    TenantID           *uuid.UUID `json:"tenant_id" db:"tenant_id"`
    UserID             *uuid.UUID `json:"user_id" db:"user_id"`
    RegistrationSource *string    `json:"registration_source" db:"registration_source"`
    DataRegion         *string    `json:"data_region" db:"data_region"`
    CreatedAt          time.Time  `json:"created_at" db:"created_at"`
}
```

✅ **Migration Steps**
1. Create Golang handlers in `/golang-api/handlers/user_registration_telemetry_handler.go`
2. Update frontend API client to call Golang endpoints
3. Test all CRUD operations
4. Verify statistics calculations
5. Deploy and monitor

---

## 📈 Performance Considerations

### Indexing Recommendations

```sql
-- Index for filtering by tenant
CREATE INDEX idx_user_registration_logs_tenant 
ON telemetry.user_registration_logs(tenant_id);

-- Index for filtering by user
CREATE INDEX idx_user_registration_logs_user 
ON telemetry.user_registration_logs(user_id);

-- Index for time-based queries
CREATE INDEX idx_user_registration_logs_created 
ON telemetry.user_registration_logs(created_at DESC);

-- Composite index for source/region analysis
CREATE INDEX idx_user_registration_logs_source_region 
ON telemetry.user_registration_logs(registration_source, data_region);
```

### Query Optimization

- Use pagination with `limit` and `offset`
- Apply date range filters for large datasets
- Cache statistics for 5-15 minutes
- Use materialized views for heavy analytics

---

## 🧪 Testing Checklist

### Functional Testing

- [x] Create registration log
- [x] View registration list
- [x] View registration details
- [x] Edit registration log
- [x] Delete registration log
- [x] Filter by source
- [x] Filter by region
- [x] View statistics
- [x] View charts

### UI/UX Testing

- [x] Responsive design (mobile/tablet/desktop)
- [x] Dark mode compatibility
- [x] Badge styling
- [x] Chart rendering
- [x] Loading states
- [x] Error handling
- [x] i18n display

### Integration Testing

- [x] Supabase connection
- [x] Real-time updates
- [x] Navigation flow
- [x] Module registration

---

## 📝 Change Log

### Version 1.0.0 (2026-01-15)

**Initial Release**
- ✅ Complete CRUD operations
- ✅ Analytics dashboard with charts
- ✅ 6-language i18n support
- ✅ 4 pages (List/Add/Edit/Detail)
- ✅ 4 components (Table/Form/2 Badges)
- ✅ Full API layer (410 lines)
- ✅ Module registration
- ✅ Documentation

---

## 🎯 Best Practices

### 1. Data Collection

```typescript
// Track immediately after user creation
const trackRegistration = async (user: User, source: string, region: string) => {
  await createUserRegistrationLog({
    tenant_id: user.tenant_id,
    user_id: user.id,
    registration_source: source,
    data_region: region,
  });
};
```

### 2. Privacy Considerations

- Store only necessary telemetry data
- Consider GDPR compliance
- Implement data retention policies
- Allow users to request data deletion

### 3. Analytics Usage

```typescript
// Use for business insights
const analyzeGrowth = async () => {
  const stats = await getUserRegistrationStats({
    start_date: '2026-01-01',
    end_date: '2026-01-31',
  });
  
  return {
    totalNewUsers: stats.total,
    topSource: Object.keys(stats.bySource)[0],
    topRegion: Object.keys(stats.byRegion)[0],
  };
};
```

---

## 🔗 Related Documentation

- [System Jobs Module](./system-jobs-complete.md)
- [Database Schema](../DATABASE_SCHEMA_COMPLETE.md)
- [Golang Migration Guide](../GOLANG_MIGRATION_READY.md)
- [API Reference](../API_REFERENCE_COMPLETE.md)

---

## 👥 Module Information

**Created by:** VHV Platform Team  
**Module ID:** `user-registration-telemetry`  
**Sidebar Order:** 96  
**Total Files:** 13 files  
**Total Lines:** ~2,000 lines  
**Production Ready:** ✅ Yes  
**Last Updated:** January 15, 2026

---

## 📞 Support

For questions or issues related to this module:
1. Check this documentation
2. Review related modules
3. Consult API reference
4. Contact development team

---

**End of Documentation**
