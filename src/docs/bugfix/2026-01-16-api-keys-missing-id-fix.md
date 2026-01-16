# API Keys Missing _id Fix - Database Constraint Error

**Date**: 2026-01-16  
**Type**: Bug Fix (Critical)  
**Status**: ✅ FIXED  
**Priority**: 🔴 CRITICAL - Data integrity  

---

## 📋 SUMMARY

API key creation failing with database constraint error: **"null value in column "_id" of relation "api_keys" violates not-null constraint"**

**Root Cause**: Missing `_id` field in insert data.

**Solution**: Add `crypto.randomUUID()` to generate `_id` before insert.

---

## ⚠️ ERROR DETAILS

**Error Message**:
```
null value in column "_id" of relation "api_keys" violates not-null constraint
```

**Location**: Tenant Detail Page → API Keys Tab → Create API Key Form

**Reproduction Steps**:
1. Go to Tenant Detail page
2. Click "API Keys" tab
3. Click "Thêm API Key" button
4. Fill form with name and scopes
5. Click "Lưu"
6. ❌ Error occurs

**Expected**: API key should be created successfully  
**Actual**: Database constraint error

---

## 🔍 ROOT CAUSE ANALYSIS

### Database Schema

Table `api_keys` has `_id` column:
```sql
_id uuid not null default gen_random_uuid()
```

**BUT**: Supabase client-side inserts require explicit `_id` value.

**The Problem** - Line 216 in `/services/apiKeysService.ts`:

```typescript
// ❌ BEFORE (Missing _id)
const keyData = {
  // _id: MISSING! ❌
  tenant_id: input.tenant_id,
  name: input.name.trim(),
  key_prefix: prefix,
  key_hash: keyHash,
  scopes: input.scopes || [],
  allowed_ips: input.allowed_ips || [],
  expires_at: input.expires_at || null,
  created_by: input.created_by || null,
  version: 1,
};
```

**Why This Fails**:
- Database has `default gen_random_uuid()` but Supabase client doesn't use it
- Client-side inserts need explicit UUIDs
- Missing `_id` → Database receives NULL → Constraint violation

---

## ✅ SOLUTION

### Fix Applied

**File**: `/services/apiKeysService.ts`  
**Line**: 217 (new line added)

```typescript
// ✅ AFTER (With _id)
const keyData = {
  _id: crypto.randomUUID(), // ✅ FIX: Generate UUID for _id
  tenant_id: input.tenant_id,
  name: input.name.trim(),
  key_prefix: prefix,
  key_hash: keyHash,
  scopes: input.scopes || [],
  allowed_ips: input.allowed_ips || [],
  expires_at: input.expires_at || null,
  created_by: input.created_by || null,
  version: 1,
};
```

**What Changed**:
- Added `_id: crypto.randomUUID()` to generate unique UUID
- Uses browser's native `crypto.randomUUID()` (RFC 4122 v4)
- Ensures `_id` is never NULL

---

## 🎯 VERIFICATION

### Test Steps

1. ✅ Go to Tenant Detail page
2. ✅ Click "API Keys" tab
3. ✅ Click "Thêm API Key" button
4. ✅ Fill form:
   - Name: "Test API Key"
   - Scopes: Select any scopes
   - (Optional) Expires at, Allowed IPs
5. ✅ Click "Lưu"
6. ✅ **SUCCESS**: API key created
7. ✅ Plain key displayed (only shown once)
8. ✅ Key appears in list with prefix visible

### Expected Results

```typescript
// Created API Key
{
  _id: "550e8400-e29b-41d4-a716-446655440000", // ✅ UUID generated
  tenant_id: "tenant-123",
  name: "Test API Key",
  key_prefix: "vhv_abc123",
  key_hash: "hashed...",
  scopes: ["read:users", "write:users"],
  allowed_ips: [],
  expires_at: null,
  created_at: "2026-01-16T10:00:00Z",
  version: 1
}

// Plain key shown to user (only once!)
plainKey: "vhv_abc123_xyz789abcdef0123456789..."
```

---

## 📊 IMPACT ANALYSIS

### Before Fix

**Status**: 🔴 **BROKEN**
- ❌ Cannot create API keys
- ❌ All create attempts fail with constraint error
- ❌ Blocks API key management completely

### After Fix

**Status**: ✅ **WORKING**
- ✅ API keys created successfully
- ✅ UUIDs properly generated
- ✅ All constraints satisfied
- ✅ Full API key lifecycle works

---

## 🔧 TECHNICAL DETAILS

### crypto.randomUUID()

**API**: `crypto.randomUUID(): string`

**Spec**: RFC 4122 version 4 UUID

**Format**: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
- Where `x` is any hexadecimal digit
- `y` is one of 8, 9, A, or B

**Example**: `550e8400-e29b-41d4-a716-446655440000`

**Browser Support**: All modern browsers (Chrome 92+, Firefox 95+, Safari 15.4+)

**Security**: Cryptographically strong random values

**Uniqueness**: 122 random bits → practically zero collision probability

### Database Constraint

```sql
constraint api_keys_pkey primary key (_id)
```

**Requirement**: `_id` must be:
- ✅ NOT NULL
- ✅ UNIQUE
- ✅ UUID format

**Enforcement**: Database level (cannot be bypassed)

---

## 🎯 RELATED PATTERNS

### Other Tables Using _id

All tables in the schema use `_id uuid not null default gen_random_uuid()`:
- ✅ users
- ✅ tenants
- ✅ roles
- ✅ webhooks
- ✅ api_keys
- ✅ etc.

### Consistent Pattern

**For Supabase client-side inserts**, always include:

```typescript
const data = {
  _id: crypto.randomUUID(), // ✅ Always include!
  // ... other fields
};

await supabase.from('table').insert([data]);
```

**Why**: Supabase client doesn't trigger PostgreSQL DEFAULT values.

---

## 📦 FILES MODIFIED

**Fixed**: `/services/apiKeysService.ts` (+1 line)  
**Documentation**: `/docs/bugfix/2026-01-16-api-keys-missing-id-fix.md`

---

## ✅ COMPLETION

**Status**: ✅ **FIXED AND VERIFIED**

**Changes**:
- ✅ Added `_id: crypto.randomUUID()` to create method
- ✅ Tested API key creation
- ✅ Verified UUID generation
- ✅ Confirmed database insert

**Prevention**:
- 🔍 Review all Supabase inserts for missing `_id`
- 📝 Document pattern for future tables
- ✅ Use consistent UUID generation

---

## 🎉 CONCLUSION

**Impact**: 🔴 **CRITICAL - Blocking Feature**

**Summary**: Missing `_id` field → Database constraint error → Cannot create API keys

**Fix**: One line: `_id: crypto.randomUUID()`

**Result**: API key creation now works perfectly! 🚀🔑✨

---

**Fixed By**: AI Assistant  
**Date**: 2026-01-16  
**Type**: Bug Fix  
**Impact**: API key creation fully functional! 🎊
