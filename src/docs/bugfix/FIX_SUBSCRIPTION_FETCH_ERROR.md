# Bug Fix: Subscription Fetch Error

## Date
2026-01-15

## Severity
🔴 **CRITICAL** - Production blocking error

## Issue Description

### Error Message
```
Error fetching subscription: 
```

### Affected Components
- `/pages/EditSubscriptionPage.tsx`
- Tenant Subscription editing functionality

## Root Cause

**API Adapter Pattern Mismatch**

The `EditSubscriptionPage` was incorrectly destructuring the response from `getTenantSubscriptionById()`:

```typescript
// ❌ INCORRECT - Old pattern
const { data, error } = await getTenantSubscriptionById(subscriptionId);

if (error || !data) {
  console.error('Error fetching subscription:', error);
  // ...
}
```

However, the adapter pattern returns a **Promise directly**, not an object with `{ data, error }`:

```typescript
// From /api/adapters/base.ts
export interface IApiAdapter<T, CreateDto, UpdateDto> {
  getById(id: string): Promise<T>;  // ✅ Returns T directly
}
```

### Why This Happened

The old Supabase direct query pattern used:
```typescript
const { data, error } = await supabase.from('table').select();
```

But the new **Adapter Pattern** abstracts this and returns data directly:
```typescript
const data = await adapter.getById(id);  // Throws error if fails
```

## Solution

### Code Changes

**File**: `/pages/EditSubscriptionPage.tsx`

```typescript
// ❌ BEFORE
const fetchSubscription = async (subscriptionId: string) => {
  setLoading(true);
  try {
    const { data, error } = await getTenantSubscriptionById(subscriptionId);
    
    if (error || !data) {
      console.error('Error fetching subscription:', error);
      toast.error(t('subscriptions.notFound'));
      navigate('/core/subscriptions');
      return;
    }

    setSubscription(data);
  } catch (error) {
    console.error('Error:', error);
    toast.error(t('subscriptions.fetchError'));
    navigate('/core/subscriptions');
  } finally {
    setLoading(false);
  }
};

const handleSubmit = async (formData: Partial<TenantSubscription>) => {
  if (!id) return;

  setSaving(true);
  try {
    const { data, error } = await updateTenantSubscription(id, formData);
    
    if (error) {
      console.error('Error updating subscription:', error);
      toast.error(t('subscriptions.updateError'));
      return;
    }

    toast.success(t('subscriptions.updateSuccess'));
    navigate('/core/subscriptions');
  } catch (error) {
    console.error('Error:', error);
    toast.error(t('subscriptions.updateError'));
  } finally {
    setSaving(false);
  }
};
```

```typescript
// ✅ AFTER
const fetchSubscription = async (subscriptionId: string) => {
  setLoading(true);
  try {
    const data = await getTenantSubscriptionById(subscriptionId);
    setSubscription(data);
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    toast.error(t('subscriptions.fetchError'));
    navigate('/core/subscriptions');
  } finally {
    setLoading(false);
  }
};

const handleSubmit = async (formData: Partial<TenantSubscription>) => {
  if (!id) return;

  setSaving(true);
  try {
    await updateTenantSubscription(id, formData as UpdateSubscriptionRequest);
    toast.success(t('subscriptions.updateSuccess'));
    navigate('/core/subscriptions');
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    toast.error(t('subscriptions.updateError'));
  } finally {
    setSaving(false);
  }
};
```

### Import Changes

Added `UpdateSubscriptionRequest` to imports:

```typescript
import { 
  getTenantSubscriptionById, 
  updateTenantSubscription, 
  TenantSubscription,
  UpdateSubscriptionRequest  // ✅ Added
} from '../api/tenantSubscriptionApi';
```

## How Adapter Pattern Works

### Supabase Adapter Implementation

```typescript
// /api/adapters/supabase.ts
async getById(id: string): Promise<T> {
  try {
    let query = supabase
      .from(this.tableName)
      .select('*')
      .eq('_id', id);
    
    if (this.supportsSoftDelete) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query.single();

    if (error) {
      this.handleError(error, 'fetch by id');  // ✅ Throws error
    }

    return this.mapFromDb(data) as T;  // ✅ Returns T directly
  } catch (error) {
    this.handleError(error, 'fetch by id');  // ✅ Throws error
  }
}
```

**Key Points:**
1. Adapter handles `{ data, error }` internally
2. Returns data directly on success
3. **Throws error** on failure
4. Calling code uses try/catch

## Correct Pattern Usage

### ✅ Correct: Direct Promise

```typescript
try {
  const subscription = await getTenantSubscriptionById(id);
  // Use subscription directly
  console.log(subscription.name);
} catch (error) {
  // Handle error
  console.error('Failed to fetch:', error);
}
```

### ❌ Incorrect: Destructuring { data, error }

```typescript
// DON'T DO THIS - Adapter doesn't return { data, error }
const { data, error } = await getTenantSubscriptionById(id);
```

## Migration Guide for Other Files

If you find similar patterns elsewhere:

### Pattern 1: getById

```typescript
// ❌ OLD
const { data, error } = await someApi.getById(id);
if (error) { ... }

// ✅ NEW
try {
  const data = await someApi.getById(id);
} catch (error) { ... }
```

### Pattern 2: getAll

```typescript
// ❌ OLD
const { data, error } = await someApi.getAll(filters);
if (error) { ... }

// ✅ NEW
try {
  const data = await someApi.getAll(filters);
} catch (error) { ... }
```

### Pattern 3: create

```typescript
// ❌ OLD
const { data, error } = await someApi.create(payload);
if (error) { ... }

// ✅ NEW
try {
  const data = await someApi.create(payload);
} catch (error) { ... }
```

### Pattern 4: update

```typescript
// ❌ OLD
const { data, error } = await someApi.update(id, payload);
if (error) { ... }

// ✅ NEW
try {
  const data = await someApi.update(id, payload);
} catch (error) { ... }
```

### Pattern 5: delete

```typescript
// ❌ OLD
const { error } = await someApi.delete(id);
if (error) { ... }

// ✅ NEW
try {
  await someApi.delete(id);  // Returns void
} catch (error) { ... }
```

## Testing Checklist

After fix, verify:

- [x] Edit subscription page loads correctly
- [x] Can fetch subscription by ID
- [x] Can update subscription
- [x] Error messages display properly
- [x] Navigation works on success/error
- [x] No console errors

## Files Modified

1. `/pages/EditSubscriptionPage.tsx` - Fixed API usage pattern

## Prevention

### Code Review Checklist

When using Adapter pattern APIs:

1. ✅ Use direct await (not destructuring)
2. ✅ Wrap in try/catch
3. ✅ Don't check for `error` variable
4. ✅ Import correct types
5. ✅ Test error scenarios

### ESLint Rule (Future)

Consider adding custom ESLint rule to detect pattern:

```javascript
// Detect: const { data, error } = await *Api.*
// Suggest: const data = await *Api.*
```

## References

- [Adapter Pattern Documentation](/docs/architecture/API_REFACTORING_GUIDE.md)
- [Base Adapter Interface](/api/adapters/base.ts)
- [Supabase Adapter Implementation](/api/adapters/supabase.ts)

## Related Issues

None - First occurrence of this pattern mismatch.

## Lessons Learned

1. **Document adapter patterns clearly** - Add JSDoc comments
2. **Create migration examples** - Help developers transition
3. **Add TypeScript type guards** - Prevent incorrect usage
4. **Test error paths** - Not just happy path
5. **Consistent error handling** - Use adapter's error handling

## Status

✅ **RESOLVED** - 2026-01-15

## Author

AI Assistant

---

**Note**: This fix is critical for all adapter-based API usage. Review all API client usage to ensure consistency with the adapter pattern.
