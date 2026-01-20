# Data Access Layer - Visual Architecture

Quick visual reference cho kiến trúc và flow.

---

## 🏗️ CURRENT ARCHITECTURE (Before)

```
┌─────────────────────────────────────────────────┐
│              React Components                    │
└────────────┬─────────────┬──────────────────────┘
             │             │
      ┌──────▼─────┐  ┌────▼──────────┐
      │  useTenants│  │  useTenant    │
      │            │  │               │
      │  Pattern 1 │  │  Pattern 2    │
      └──────┬─────┘  └────┬──────────┘
             │             │
    ┌────────▼────┐   ┌────▼──────────────┐
    │  Supabase   │   │  Edge Functions   │
    │  Client     │   │  fetch() + Bearer │
    │  Direct     │   │                   │
    └─────────────┘   └───────────────────┘
             │             │
             └──────┬──────┘
                    │
            ┌───────▼────────┐
            │   Supabase DB   │
            └─────────────────┘

❌ PROBLEMS:
   • Multiple patterns (inconsistent)
   • Tight coupling to Supabase
   • Hard to migrate to Golang API
   • Difficult to test/mock
```

---

## 🎯 TARGET ARCHITECTURE (After)

```
┌─────────────────────────────────────────────────┐
│              React Components                    │
└──────────────────────┬──────────────────────────┘
                       │
    ┌──────────────────▼──────────────────┐
    │         Custom Hooks Layer          │
    │  ┌─────────┐  ┌─────────┐          │
    │  │useTenant│  │useUsers │  etc...  │
    │  │         │  │         │          │
    │  │ UNIFIED PATTERN - All same!    │
    │  └─────────┘  └─────────┘          │
    └──────────────────┬──────────────────┘
                       │
    ┌──────────────────▼──────────────────┐
    │     DataClient (Abstract Layer)     │
    │                                     │
    │  IDataClient Interface:             │
    │    • query<T>(resource, options)    │
    │    • get<T>(resource, id)           │
    │    • create<T>(resource, data)      │
    │    • update<T>(resource, id, data)  │
    │    • delete(resource, id)           │
    │    • execute<T>(endpoint, options)  │
    │                                     │
    └──────────────────┬──────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
    ┌────▼─────────────┐    ┌────────▼────────────┐
    │  Supabase        │    │  Golang API         │
    │  DataClient      │    │  DataClient         │
    │  (Current)       │    │  (Future)           │
    │                  │    │                     │
    │  • from()        │    │  • fetch()          │
    │  • select()      │    │  • REST endpoints   │
    │  • insert()      │    │  • JSON response    │
    │  • update()      │    │                     │
    └────┬─────────────┘    └────────┬────────────┘
         │                           │
         │                           │
    ┌────▼─────────────┐    ┌────────▼────────────┐
    │  Supabase DB     │    │  Golang Backend     │
    │  PostgreSQL      │    │  + Database         │
    └──────────────────┘    └─────────────────────┘

✅ BENEFITS:
   • Single pattern (consistent)
   • Loose coupling (easy to swap)
   • Easy migration (just config change!)
   • Simple testing (easy to mock)
```

---

## 🔄 MIGRATION FLOW

### Step 1: Create Abstraction Layer

```
┌────────────────────────────────────┐
│  Create /lib/data-client/          │
│  ├── types.ts                      │
│  ├── SupabaseDataClient.ts         │
│  ├── GolangApiDataClient.ts        │
│  └── DataClientFactory.ts          │
└────────────────────────────────────┘
         │
         │ Setup & Configure
         ▼
┌────────────────────────────────────┐
│  Initialize in app                 │
│  DataClientFactory.configure({})   │
└────────────────────────────────────┘
```

### Step 2: Migrate Hooks One by One

```
┌─────────────────┐
│   useTenants    │
│   (old pattern) │
└────────┬────────┘
         │
         │ Transform
         ▼
┌─────────────────────────────────────┐
│  Remove:                            │
│  • Direct Supabase client           │
│  • fetch() calls                    │
│                                     │
│  Add:                               │
│  • getDataClient()                  │
│  • dataClient.query/get/create...  │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────┐
│   useTenants    │
│   (new pattern) │
└─────────────────┘
         │
         │ Test Thoroughly
         ▼
┌─────────────────┐
│  ✅ Migrated    │
└─────────────────┘
```

### Step 3: Switch to Golang API (Later)

```
┌──────────────────────────┐
│  Current State:          │
│  type: 'supabase'        │
│                          │
│  All hooks working ✅    │
└────────────┬─────────────┘
             │
             │ Just change config!
             ▼
┌──────────────────────────┐
│  Update config:          │
│  type: 'golang-api'      │
│  baseUrl: '...'          │
│  apiKey: '...'           │
└────────────┬─────────────┘
             │
             │ Zero code changes!
             ▼
┌──────────────────────────┐
│  New State:              │
│  Using Golang API ✅     │
│                          │
│  All hooks still work!   │
└──────────────────────────┘
```

---

## 📊 MIGRATION PHASES

```
Phase 1: Foundation (Week 1, Days 1-2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░  20%
• Create abstraction layer
• Write unit tests
• Configure factory

Phase 2: Pilot (Week 1 Day 3 - Week 2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░  40%
• Migrate 2-3 pilot hooks
• Test thoroughly
• Document learnings

Phase 3: Mass Migration (Week 2-3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░  80%
• Migrate all remaining hooks
• Integration testing

Phase 4: Polish (Week 4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
• Final testing
• Documentation
• Training
```

---

## 🎯 HOOK MIGRATION PATTERN

### BEFORE (Multiple Patterns):

```typescript
// Pattern A: Direct Supabase
const supabase = createClient(url, key);
const { data } = await supabase
  .from('tenants')
  .select('*')
  .eq('status', 'ACTIVE');

// Pattern B: Edge Functions
const response = await fetch(API_BASE, {
  headers: { 'Authorization': `Bearer ${key}` }
});
const data = await response.json();
```

### AFTER (Single Pattern):

```typescript
// Unified pattern for ALL hooks
const dataClient = getDataClient();

const result = await dataClient.query<Tenant>('tenants', {
  filters: { status: 'ACTIVE' },
  orderBy: [{ field: 'created_at', direction: 'desc' }],
  limit: 20,
});

const tenants = result.data; // Fully typed as Tenant[]
```

---

## 🔌 SWITCHING DATA SOURCES

### Visual Flow:

```
┌─────────────────────────────────────────┐
│  Configuration File / Environment Var   │
│                                         │
│  NEXT_PUBLIC_DATA_SOURCE = ?            │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
   ┌────▼────┐   ┌────▼────────┐
   │'supabase'│   │'golang-api'│
   └────┬────┘   └────┬────────┘
        │             │
        │             │
┌───────▼────────┐  ┌─▼────────────────┐
│ Supabase       │  │ Golang API       │
│ DataClient     │  │ DataClient       │
│                │  │                  │
│ Uses:          │  │ Uses:            │
│ • Supabase SDK │  │ • fetch()        │
│ • anon key     │  │ • Bearer token   │
└────────────────┘  └──────────────────┘
        │                    │
        │                    │
        └──────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │  SAME INTERFACE!  │
         │  Hooks unchanged  │
         └───────────────────┘
```

**Key Point**: Hooks không biết data đến từ đâu! Chỉ biết interface.

---

## 📈 BENEFITS COMPARISON

```
BEFORE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Consistency      ▓▓░░░░░░░░░░░░░░ 20%
Maintainability  ▓▓▓░░░░░░░░░░░░░ 30%
Testability      ▓▓░░░░░░░░░░░░░░ 20%
Flexibility      ▓░░░░░░░░░░░░░░░ 10%
Type Safety      ▓▓▓▓░░░░░░░░░░░░ 40%

AFTER:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Consistency      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
Maintainability  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░  90%
Testability      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
Flexibility      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
Type Safety      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
```

---

## 🧪 TESTING PYRAMID

```
        ┌───────────┐
        │    E2E    │  Integration Tests
        │  Testing  │  (Complete flows)
        └─────┬─────┘
              │
      ┌───────▼────────┐
      │  Integration   │  Hook Tests
      │    Testing     │  (with real DataClient)
      └───────┬────────┘
              │
    ┌─────────▼──────────┐
    │    Unit Testing    │  DataClient Tests
    │                    │  (Mock dependencies)
    └────────────────────┘
          Foundation
```

**Testing Strategy**:
- **Unit**: Test DataClient implementations in isolation
- **Integration**: Test hooks with real DataClient
- **E2E**: Test complete user flows

---

## 💾 DATA FLOW DIAGRAM

### Query Flow:

```
┌──────────┐
│Component │
└────┬─────┘
     │ useState, useEffect
┌────▼─────────┐
│ Custom Hook  │ (useTenants)
│ • loadData() │
└────┬─────────┘
     │ getDataClient()
┌────▼──────────────┐
│ DataClientFactory │
│ • getClient()     │
└────┬──────────────┘
     │ returns IDataClient
┌────▼─────────────┐
│ SupabaseClient   │
│ or               │
│ GolangApiClient  │
└────┬─────────────┘
     │ execute query
┌────▼─────────┐
│  Data Source │
│ (DB or API)  │
└────┬─────────┘
     │ return data
┌────▼────────┐
│  Component  │
│  Re-render  │
└─────────────┘
```

---

## 🔐 ERROR HANDLING FLOW

```
┌─────────────┐
│ API Call    │
└─────┬───────┘
      │
   ┌──▼───────────────┐
   │ Try-Catch Block  │
   └──┬───────────┬───┘
      │           │
   ✅ Success   ❌ Error
      │           │
┌─────▼─────┐  ┌──▼─────────────┐
│ Return    │  │ Log Error      │
│ Data      │  │ Set Error State│
└───────────┘  │ Try Fallback   │
               └──┬─────────────┘
                  │
         ┌────────┴────────┐
         │                 │
    ┌────▼─────┐    ┌──────▼──────┐
    │  Cache   │    │ Default     │
    │  Data    │    │ Data        │
    └──────────┘    └─────────────┘
```

---

## 🎯 HOOK PRIORITY GROUPS

```
┌──────────────────────────────────────┐
│ GROUP A: Core Entities (Week 2 D1-2)│
├──────────────────────────────────────┤
│ ⭐⭐⭐ useTenants                     │
│ ⭐⭐⭐ useTenant                      │
│ ⭐⭐⭐ useUsers                       │
│ ⭐⭐⭐ useUser                        │
│ ⭐⭐⭐ useTenantMembers               │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ GROUP B: Business (Week 2 D3-5)      │
├──────────────────────────────────────┤
│ ⭐⭐ useProducts                      │
│ ⭐⭐ useServicePackages               │
│ ⭐⭐ useSubscriptions                 │
│ ⭐⭐ useSubscriptionOrders            │
│ ⭐⭐ useSubscriptionInvoices          │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ GROUP C: System (Week 3 D1-2)        │
├──────────────────────────────────────┤
│ ⭐ useSystemJobs                     │
│ ⭐ useWebhooks                       │
│ ⭐ useTrafficLogs                    │
│ ⭐ useApplications                   │
│ ⭐ useAuditLogs                      │
└──────────────────────────────────────┘

⭐⭐⭐ = High Priority
⭐⭐   = Medium Priority
⭐    = Low Priority
```

---

## 🚀 DEPLOYMENT STRATEGY

```
┌────────────────┐
│  Development   │  Test locally
└───────┬────────┘
        │
        │ PR & Review
        ▼
┌────────────────┐
│   Staging      │  Integration testing
└───────┬────────┘
        │
        │ QA Sign-off
        ▼
┌────────────────┐
│  Production    │  Gradual rollout
│                │
│  10% users  ━━━▶ Monitor
│  50% users  ━━━▶ Monitor
│  100% users ━━━▶ Success!
└────────────────┘

If issues at any stage:
  └─▶ Rollback ─▶ Fix ─▶ Retry
```

---

## 📊 SUCCESS DASHBOARD

```
Migration Progress
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hooks Migrated    [▓▓▓▓▓▓▓▓░░] 23/30 (77%)
Tests Passing     [▓▓▓▓▓▓▓▓▓▓] 100%
Code Coverage     [▓▓▓▓▓▓▓▓▓░]  85%
Performance       [▓▓▓▓▓▓▓▓▓▓] ✅ Good
Documentation     [▓▓▓▓▓▓▓▓▓▓] ✅ Complete

Team Readiness
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trained           [▓▓▓▓▓▓▓▓▓▓] 5/5 (100%)
Comfortable       [▓▓▓▓▓▓▓▓░░] 4/5 (80%)
Using Pattern     [▓▓▓▓▓▓░░░░] 3/5 (60%)

Production Health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Uptime            [▓▓▓▓▓▓▓▓▓▓] 99.9%
Error Rate        [▓▓▓▓▓▓▓▓▓▓] 0.1%
Response Time     [▓▓▓▓▓▓▓▓▓▓] <200ms
User Satisfaction [▓▓▓▓▓▓▓▓▓░] 4.5/5
```

---

## 🎉 FINAL STATE

```
┌─────────────────────────────────────────────┐
│          ✅ MIGRATION COMPLETE              │
├─────────────────────────────────────────────┤
│                                             │
│  ✓ All hooks use unified pattern            │
│  ✓ Full test coverage                       │
│  ✓ Documentation complete                   │
│  ✓ Team trained                             │
│  ✓ Production stable                        │
│                                             │
│  READY TO MIGRATE TO GOLANG API!            │
│                                             │
│  Just change config:                        │
│  NEXT_PUBLIC_DATA_SOURCE=golang-api         │
│                                             │
│  Zero code changes needed! 🎉               │
└─────────────────────────────────────────────┘
```

---

**This visual guide provides a quick reference for the entire migration architecture and process.**

For detailed implementation, refer to:
- `/docs/DATA_ACCESS_STANDARDIZATION_PLAN.md`
- `/docs/DATA_CLIENT_QUICK_START.md`
- `/docs/DATA_ACCESS_IMPLEMENTATION_ROADMAP.md`
