# 📖 Applications - Use Cases & Integration Guide

**Version:** 1.0.0  
**Last Updated:** January 13, 2026

---

## 📋 Table of Contents

1. [User Stories](#user-stories)
2. [Use Cases](#use-cases)
3. [Integration Examples](#integration-examples)
4. [Best Practices](#best-practices)
5. [Troubleshooting](#troubleshooting)

---

## 👥 User Stories

### **As a Platform Admin**

1. **I want to define technical applications**
   - So that developers know what features the platform supports
   - Acceptance: Applications have unique codes and clear names

2. **I want to define capabilities for each application**
   - So that service packages can configure feature limits
   - Acceptance: Capabilities have types (BOOLEAN, NUMBER) and default values

3. **I want to use capability-based configuration**
   - So that service packages can flexibly control application features
   - Acceptance: Packages reference capabilities with custom values

4. **I want to deprecate old applications**
   - So that tenants can't subscribe to outdated features
   - Acceptance: Soft delete preserves audit trail

5. **I want to track application usage**
   - So that I can analyze which features are most popular
   - Acceptance: Can see how many packages use each application

---

### **As a Developer**

1. **I want consistent code naming**
   - So that I can easily integrate applications in code
   - Acceptance: Application codes follow UPPERCASE_SNAKE_CASE

2. **I want type-safe capability definitions**
   - So that I don't misconfigure package entitlements
   - Acceptance: Capabilities have clear types (BOOLEAN, NUMBER)

3. **I want flexible default values**
   - So that I can quickly create packages without specifying every value
   - Acceptance: Capabilities have sensible defaults

4. **I want to prevent duplicate capabilities**
   - So that data integrity is maintained
   - Acceptance: Composite unique constraint prevents duplicates

---

## 🎯 Use Cases

### **Use Case 1: Define HRM Recruitment Application**

**Actor:** Platform Admin  
**Goal:** Define HRM Recruitment application with capabilities  
**Precondition:** Admin has access to application management

**Flow:**

1. Admin navigates to Applications → Create
2. Admin fills in application details:
   ```json
   {
     "code": "HRM_RECRUIT",
     "name": "HRM - Recruitment Module",
     "description": "Recruitment and candidate management features including job postings, candidate tracking, interview scheduling, and AI-powered matching.",
     "is_active": true
   }
   ```
3. System validates code format (UPPERCASE_SNAKE_CASE)
4. System creates application with UUID
5. Admin adds capabilities:

   **Capability 1: Maximum Users**
   ```json
   {
     "code": "max_users",
     "name": "Maximum Users",
     "type": "NUMBER",
     "default_value": 10,
     "description": "Maximum number of users allowed to access recruitment module"
   }
   ```

   **Capability 2: Storage Limit**
   ```json
   {
     "code": "storage_gb",
     "name": "Storage Limit (GB)",
     "type": "NUMBER",
     "default_value": 5,
     "description": "Storage limit for resumes and candidate files in gigabytes"
   }
   ```

   **Capability 3: AI Matching**
   ```json
   {
     "code": "enable_ai_matching",
     "name": "AI Candidate Matching",
     "type": "BOOLEAN",
     "default_value": false,
     "description": "Enable AI-powered candidate-to-job matching"
   }
   ```

6. System validates capability codes (lowercase_snake_case)
7. System enforces composite unique constraint (app_code + code)
8. All capabilities created successfully

**Success Criteria:**
- ✅ Application created with unique code
- ✅ 3 capabilities added (2 NUMBER, 1 BOOLEAN)
- ✅ Default values set for quick package creation
- ✅ Code format validated at database level

---

### **Use Case 2: Create Service Package Using Application Capabilities**

**Actor:** Product Manager  
**Goal:** Create Basic Plan package with HRM Recruitment features  
**Precondition:** HRM_RECRUIT application and capabilities exist

**Flow:**

1. PM navigates to Service Packages → Create
2. PM defines package:
   ```json
   {
     "code": "BASIC_PLAN",
     "name": "Basic Plan",
     "price_amount": 29.99,
     "currency_code": "USD",
     "entitlements_config": {
       "HRM_RECRUIT": {
         "max_users": 5,              // Override default (10)
         "storage_gb": 2,             // Override default (5)
         "enable_ai_matching": false  // Use default (false)
       }
     }
   }
   ```

3. System validates that application exists
4. System validates that capabilities exist
5. System validates that values match capability types:
   - `max_users` (NUMBER): 5 ✅
   - `storage_gb` (NUMBER): 2 ✅
   - `enable_ai_matching` (BOOLEAN): false ✅
6. Package created successfully

**When Tenant Subscribes:**

```json
// Tenant subscription inherits package entitlements
{
  "tenant_id": "uuid",
  "package_code": "BASIC_PLAN",
  "entitlements": {
    "HRM_RECRUIT": {
      "max_users": 5,
      "storage_gb": 2,
      "enable_ai_matching": false
    }
  }
}
```

**Runtime Enforcement:**

```typescript
// Check if tenant can add more users
const canAddUser = async (tenantId: string) => {
  const subscription = await getSubscription(tenantId);
  const entitlements = subscription.entitlements.HRM_RECRUIT;
  const currentUsers = await countUsers(tenantId, 'HRM_RECRUIT');
  
  if (currentUsers >= entitlements.max_users) {
    throw new Error('User limit reached. Upgrade plan to add more users.');
  }
  
  return true;
};
```

**Success Criteria:**
- ✅ Package references existing capabilities
- ✅ Capability values override defaults
- ✅ Tenant subscription inherits entitlements
- ✅ Runtime enforcement works correctly

---

### **Use Case 3: Create Premium Plan with Enhanced Features**

**Actor:** Product Manager  
**Goal:** Create Premium Plan with higher limits and AI features  
**Precondition:** HRM_RECRUIT application exists

**Flow:**

1. PM creates Premium Plan:
   ```json
   {
     "code": "PREMIUM_PLAN",
     "name": "Premium Plan",
     "price_amount": 99.99,
     "currency_code": "USD",
     "entitlements_config": {
       "HRM_RECRUIT": {
         "max_users": 50,             // 10x more than Basic
         "storage_gb": 50,            // 25x more than Basic
         "enable_ai_matching": true   // AI feature enabled!
       }
     }
   }
   ```

2. System creates package with enhanced entitlements

**Marketing Comparison:**

| Feature | Basic Plan | Premium Plan |
|---------|------------|--------------|
| Max Users | 5 | 50 (10x more) |
| Storage | 2 GB | 50 GB (25x more) |
| AI Matching | ❌ Disabled | ✅ Enabled |
| Price | $29.99/mo | $99.99/mo |

**Upgrade Flow:**

```typescript
// Tenant upgrades from Basic to Premium
const upgrade = async (tenantId: string) => {
  const currentSub = await getSubscription(tenantId);
  // Current: max_users = 5
  
  await updateSubscription(tenantId, {
    package_code: 'PREMIUM_PLAN',
    entitlements: {
      HRM_RECRUIT: {
        max_users: 50,             // Now can add 45 more users
        storage_gb: 50,            // Now can upload 48 GB more
        enable_ai_matching: true   // AI matching now available!
      }
    }
  });
  
  console.log('Upgraded to Premium! AI Matching enabled.');
};
```

**Success Criteria:**
- ✅ Premium plan has higher limits
- ✅ BOOLEAN capabilities enable/disable features
- ✅ Clear upgrade path from Basic to Premium
- ✅ Runtime enforcement respects new limits

---

### **Use Case 4: Add New Capability to Existing Application**

**Actor:** Platform Admin  
**Goal:** Add API rate limiting capability to HRM_RECRUIT  
**Precondition:** HRM_RECRUIT application exists

**Flow:**

1. Admin adds new capability:
   ```json
   {
     "app_code": "HRM_RECRUIT",
     "code": "api_calls_limit",
     "name": "API Calls Limit (per minute)",
     "type": "NUMBER",
     "default_value": 60,
     "description": "Maximum API calls per minute for recruitment module"
   }
   ```

2. System validates:
   - ✅ Application exists
   - ✅ Code format is lowercase_snake_case
   - ✅ Type is valid (NUMBER)
   - ✅ No duplicate (app_code + code unique)

3. Capability created successfully

**Updating Existing Packages:**

```sql
-- Update Basic Plan to include new capability
UPDATE service_packages
SET entitlements_config = jsonb_set(
  entitlements_config,
  '{HRM_RECRUIT, api_calls_limit}',
  '30'  -- Lower limit for Basic
)
WHERE code = 'BASIC_PLAN';

-- Update Premium Plan
UPDATE service_packages
SET entitlements_config = jsonb_set(
  entitlements_config,
  '{HRM_RECRUIT, api_calls_limit}',
  '300'  -- Higher limit for Premium
)
WHERE code = 'PREMIUM_PLAN';
```

**Runtime Enforcement:**

```typescript
// Rate limiting middleware
const checkRateLimit = async (tenantId: string, appCode: string) => {
  const subscription = await getSubscription(tenantId);
  const limit = subscription.entitlements[appCode].api_calls_limit;
  
  const calls = await redis.incr(`rate:${tenantId}:${appCode}`);
  await redis.expire(`rate:${tenantId}:${appCode}`, 60); // 1 minute TTL
  
  if (calls > limit) {
    throw new Error(`Rate limit exceeded: ${calls}/${limit} calls per minute`);
  }
};
```

**Success Criteria:**
- ✅ New capability added without affecting existing capabilities
- ✅ Existing packages can be updated to include new capability
- ✅ Runtime enforcement works correctly
- ✅ Backward compatible (packages without new capability use default)

---

### **Use Case 5: Deprecate Old Application**

**Actor:** Platform Admin  
**Goal:** Deprecate OLD_HRM application and migrate to HRM_RECRUIT  
**Precondition:** OLD_HRM exists, HRM_RECRUIT is new replacement

**Flow:**

1. Admin marks OLD_HRM as inactive:
   ```bash
   PATCH /applications/code/OLD_HRM
   {
     "is_active": false
   }
   ```

2. System updates `is_active = false`

3. Frontend hides OLD_HRM from package creation UI:
   ```typescript
   const activeApps = await applicationsApi.getAll({ is_active: true });
   // OLD_HRM not included
   ```

4. Admin migrates existing packages:
   ```sql
   -- Migrate Basic Plan from OLD_HRM to HRM_RECRUIT
   UPDATE service_packages
   SET entitlements_config = entitlements_config - 'OLD_HRM'
   WHERE code = 'BASIC_PLAN';
   
   UPDATE service_packages
   SET entitlements_config = entitlements_config || '{"HRM_RECRUIT": {"max_users": 5, "storage_gb": 2}}'
   WHERE code = 'BASIC_PLAN';
   ```

5. After migration complete, admin soft deletes OLD_HRM:
   ```bash
   DELETE /applications/code/OLD_HRM
   ```

6. System sets `deleted_at = NOW()`

7. OLD_HRM excluded from all queries (indexes have `WHERE deleted_at IS NULL`)

**Success Criteria:**
- ✅ Old application marked inactive (hidden from UI)
- ✅ Existing packages migrated to new application
- ✅ Soft delete preserves audit trail
- ✅ Can be restored if needed (`deleted_at = NULL`)

---

## 🔧 Integration Examples

### **Example 1: React Admin UI - Application Management**

```typescript
// pages/admin/applications/index.tsx
import { useApplications } from '@/api/applicationsApi';

export function ApplicationsListPage() {
  const { applications, loading, error } = useApplications({ is_active: true });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="applications-list">
      <h1>Applications</h1>
      
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Status</th>
            <th>Capabilities</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map(app => (
            <tr key={app._id}>
              <td><code>{app.code}</code></td>
              <td>{app.name}</td>
              <td>
                <span className={app.is_active ? 'badge-active' : 'badge-inactive'}>
                  {app.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <a href={`/admin/applications/${app.code}/capabilities`}>
                  View Capabilities
                </a>
              </td>
              <td>
                <button onClick={() => editApp(app.code)}>Edit</button>
                <button onClick={() => deleteApp(app.code)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

### **Example 2: Create Application Form**

```typescript
// pages/admin/applications/create.tsx
import { useState } from 'react';
import { applicationsApi, isValidAppCode } from '@/api/applicationsApi';

export function CreateApplicationPage() {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.code) {
      newErrors.code = 'Code is required';
    } else if (!isValidAppCode(formData.code)) {
      newErrors.code = 'Code must be UPPERCASE_SNAKE_CASE (e.g., HRM_RECRUIT)';
    }
    
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      const app = await applicationsApi.create(formData);
      alert(`Application created: ${app._id}`);
      // Redirect to capabilities page
      window.location.href = `/admin/applications/${app.code}/capabilities`;
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Create Application</h1>
      
      <div className="form-group">
        <label>Code *</label>
        <input
          type="text"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          placeholder="HRM_RECRUIT"
        />
        {errors.code && <span className="error">{errors.code}</span>}
        <small>Format: UPPERCASE_SNAKE_CASE</small>
      </div>
      
      <div className="form-group">
        <label>Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="HRM - Recruitment Module"
        />
        {errors.name && <span className="error">{errors.name}</span>}
      </div>
      
      <div className="form-group">
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Recruitment and candidate management features"
        />
      </div>
      
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          />
          Active
        </label>
      </div>
      
      <button type="submit">Create Application</button>
    </form>
  );
}
```

---

### **Example 3: Capability Management**

```typescript
// pages/admin/applications/[code]/capabilities.tsx
import { useApplicationWithCapabilities, capabilitiesApi } from '@/api/applicationsApi';

export function CapabilitiesPage({ code }: { code: string }) {
  const { data, loading, error, refresh } = useApplicationWithCapabilities(code);

  const addCapability = async () => {
    const capability = {
      code: 'max_users',
      name: 'Maximum Users',
      type: 'NUMBER' as const,
      default_value: 10,
      description: 'Maximum number of users'
    };
    
    try {
      await capabilitiesApi.create(code, capability);
      refresh(); // Reload capabilities
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>Not found</div>;

  return (
    <div className="capabilities-page">
      <h1>{data.name}</h1>
      <p><code>{data.code}</code></p>
      
      <h2>Capabilities ({data.capabilities.length})</h2>
      
      <button onClick={addCapability}>Add Capability</button>
      
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Type</th>
            <th>Default Value</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.capabilities.map(cap => (
            <tr key={cap._id}>
              <td><code>{cap.code}</code></td>
              <td>{cap.name}</td>
              <td>
                <span className={`badge-${cap.type.toLowerCase()}`}>
                  {cap.type}
                </span>
              </td>
              <td>
                {cap.type === 'BOOLEAN' 
                  ? (cap.default_value ? 'True' : 'False')
                  : cap.default_value
                }
              </td>
              <td>
                <span className={cap.is_active ? 'badge-active' : 'badge-inactive'}>
                  {cap.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <button onClick={() => editCapability(cap._id)}>Edit</button>
                <button onClick={() => deleteCapability(cap._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 🎯 Best Practices

### **1. Code Naming Conventions**

**Applications: UPPERCASE_SNAKE_CASE**
```
✅ Good:
HRM_RECRUIT
CRM_SALES_V2
ACCOUNTING_2024
INVENTORY_MGMT

❌ Bad:
hrm-recruit         (lowercase, dash)
HRM.Recruit         (dot, mixed case)
HRM Recruitment     (space)
```

**Capabilities: lowercase_snake_case**
```
✅ Good:
max_users
storage_gb
enable_ai_matching
api_calls_limit

❌ Bad:
MAX_USERS           (uppercase)
max-users           (dash)
maxUsers            (camelCase)
```

---

### **2. Capability Types**

**Use BOOLEAN for:**
- Feature toggles (e.g., `enable_ai_matching`)
- Permissions (e.g., `allow_exports`)
- On/off switches (e.g., `enable_notifications`)

**Use NUMBER for:**
- Limits (e.g., `max_users`, `storage_gb`)
- Quotas (e.g., `api_calls_limit`)
- Thresholds (e.g., `max_file_size_mb`)

---

### **3. Default Values**

Set **realistic defaults**:
```json
{
  "code": "max_users",
  "type": "NUMBER",
  "default_value": 10  // ✅ Reasonable for small teams
}
```

Not:
```json
{
  "default_value": 999999  // ❌ Unrealistic
}
```

---

### **4. Package Configuration**

**Override only what's needed:**
```json
{
  "entitlements_config": {
    "HRM_RECRUIT": {
      "max_users": 50,         // Override
      "enable_ai_matching": true  // Override
      // storage_gb uses default (5)
    }
  }
}
```

**Use descriptive package names:**
```json
// ✅ Good
"BASIC_PLAN"
"PREMIUM_PLAN"
"ENTERPRISE_PLAN"

// ❌ Bad
"PLAN_1"
"PKG_A"
```

---

## 🐛 Troubleshooting

### **Problem 1: Invalid code format**

**Symptoms:**
- Error: "Invalid code format. Use uppercase letters, numbers, and underscores only"
- Application/capability creation fails

**Cause:** Code contains invalid characters

**Solution:**
```typescript
// Application code
const code = userInput.toUpperCase().replace(/[^A-Z0-9_]/g, '_');

// Capability code
const code = userInput.toLowerCase().replace(/[^a-z0-9_]/g, '_');
```

---

### **Problem 2: Duplicate capability code**

**Symptoms:**
- Error: "Capability code already exists for this application"
- Capability creation fails

**Cause:** Composite unique constraint (app_code + code)

**Solution:**
```sql
-- Check existing capabilities
SELECT code FROM app_capabilities 
WHERE app_code = 'HRM_RECRUIT';

-- Use different code or update existing capability
```

---

### **Problem 3: Foreign key violation**

**Symptoms:**
- Error: "Application not found"
- Capability creation fails

**Cause:** Application doesn't exist

**Solution:**
```typescript
// Check application exists before creating capability
const app = await applicationsApi.getByCode(appCode);
if (!app) {
  throw new Error('Application not found');
}

await capabilitiesApi.create(appCode, capability);
```

---

### **Problem 4: Type mismatch**

**Symptoms:**
- Error: "Invalid type. Must be BOOLEAN or NUMBER"
- Capability creation/update fails

**Cause:** Invalid type value

**Solution:**
```typescript
// Validate type before sending
const VALID_TYPES = ['BOOLEAN', 'NUMBER'];
if (!VALID_TYPES.includes(type)) {
  throw new Error('Invalid type. Must be BOOLEAN or NUMBER');
}
```

---

**Version:** 1.0.0  
**Last Updated:** January 13, 2026  
**Maintainer:** Platform Team
